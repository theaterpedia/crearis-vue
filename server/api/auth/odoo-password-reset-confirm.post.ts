/**
 * /api/auth/odoo-password-reset-confirm — CV-side reset-link landing form →
 * Odoo `changePassword` graphql mutation (token-based password-set).
 *
 * Phase-A C4 per [[2026-05-21_CV@wsl-2_next-action-plan_SSO-Phase-A-handoff]] §5
 * + CV@wsl-2 proposal §3.4.
 *
 * ⚠ Blocking-dep on auto-login (Phase-C item-1 `crearis_auth_resolver_patches`):
 * the upstream `changePassword` resolver as-shipped sets the new password
 * but does NOT call `request.session.authenticate()` — same shape as the
 * `register` resolver gap (CO@prod cross-check 07ff15b · plan §5). Note:
 * the separate `UpdatePassword` mutation IS auto-login as-shipped, but
 * `changePassword` (the token-based flow) requires the resolver-patch.
 * Code ships with the Set-Cookie capture path in place; pre-addon the user
 * lands the new password but the redirect to a logged-in state requires a
 * subsequent login round-trip on the client side.
 *
 * Flow:
 *   1. Receive { token, newPassword } from CV-side reset-form (C7 SPA route).
 *   2. POST `changePassword(token, newPassword)` to ODOO_GRAPHQL_URL.
 *   3. Capture upstream Set-Cookie → appendResponseHeader to browser.
 *   4. Parse session_id from Set-Cookie · call `bridgeFromOdoo()` to mirror.
 *   5. Return { success } · no partner info returned (the mutation resolver
 *      doesn't expose partner shape in the return type).
 *
 * Reset-link URL target: per CO@prod §2.3 + plan §0.2-(b), the reset-email
 * link is `https://my.theaterpedia.org/auth/reset?token={{ token }}` — set
 * by CO@prod's `crearis_password_reset_cv_url` addon (Phase-C item-2).
 */

import {
    appendResponseHeader,
    createError,
    defineEventHandler,
    getRequestHost,
    getRequestIP,
    readBody,
    setCookie,
} from 'h3'
import { bridgeFromOdoo as defaultBridgeFromOdoo } from '../../middleware/02-auth'
import { parseOdooSessionFromSetCookie } from '../../utils/odoo-set-cookie-parse'

const ODOO_URL_DEFAULT = 'https://service.dasei.eu/graphql/vsf'
const CV_SESSION_TTL_SECS = 24 * 60 * 60

const CHANGE_PASSWORD_MUTATION = `
    mutation ChangePassword($newPassword: String!, $token: String!) {
        changePassword(newPassword: $newPassword, token: $token)
    }
`

export type PerformOdooResetConfirmResult =
    | {
          ok: true
          setCookieHeader: string | null
      }
    | {
          ok: false
          statusCode: 401 | 502
          message: string
      }

interface PerformOdooResetConfirmInput {
    token: string
    newPassword: string
    realIp: string
    requestHost: string
}

interface PerformOdooResetConfirmDeps {
    odooUrl: string
    fetchFn?: typeof fetch
}

interface OdooGraphqlResetConfirmResponse {
    data?: { changePassword?: boolean | null }
    errors?: Array<{ message: string }>
}

/** Pure-ish reset-confirm decision — POST + classify. */
export async function performOdooResetConfirm(
    input: PerformOdooResetConfirmInput,
    deps: PerformOdooResetConfirmDeps,
): Promise<PerformOdooResetConfirmResult> {
    const fetchFn = deps.fetchFn ?? fetch
    let response: Response
    try {
        response = await fetchFn(deps.odooUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'REAL-IP': input.realIp,
                'resquest-host': input.requestHost,
            },
            body: JSON.stringify({
                query: CHANGE_PASSWORD_MUTATION,
                variables: {
                    newPassword: input.newPassword,
                    token: input.token,
                },
            }),
        })
    } catch (err) {
        console.error('[odoo-password-reset-confirm] upstream fetch error:', err)
        return {
            ok: false,
            statusCode: 502,
            message: err instanceof Error ? err.message : 'Upstream network error',
        }
    }

    let json: OdooGraphqlResetConfirmResponse
    try {
        json = (await response.json()) as OdooGraphqlResetConfirmResponse
    } catch (err) {
        console.error('[odoo-password-reset-confirm] upstream JSON parse error:', err)
        return {
            ok: false,
            statusCode: 502,
            message: 'Upstream returned non-JSON response',
        }
    }

    // 401 for token-rejected · the only error a caller cares about. Surface
    // Odoo's message verbatim ("Invalid or expired token" or similar) so the
    // C7 SPA-route can render it.
    if (json.errors?.length) {
        return {
            ok: false,
            statusCode: 401,
            message: json.errors[0]?.message || 'Invalid or expired token',
        }
    }
    // The resolver returns true on success; false / null signals refusal.
    if (json.data?.changePassword !== true) {
        return {
            ok: false,
            statusCode: 401,
            message: 'Invalid or expired token',
        }
    }

    return {
        ok: true,
        setCookieHeader: response.headers.get('set-cookie'),
    }
}

export default defineEventHandler(async (event) => {
    const body = await readBody<{ token?: string; newPassword?: string }>(event)
    if (!body?.token || !body?.newPassword) {
        throw createError({
            statusCode: 400,
            message: 'Token and new password are required',
        })
    }

    const result = await performOdooResetConfirm(
        {
            token: body.token,
            newPassword: body.newPassword,
            realIp: getRequestIP(event) || '',
            requestHost: getRequestHost(event) || '',
        },
        { odooUrl: process.env.ODOO_GRAPHQL_URL || ODOO_URL_DEFAULT },
    )

    if (!result.ok) {
        throw createError({ statusCode: result.statusCode, message: result.message })
    }

    // Same as C2 (register): pre-addon-deploy `changePassword` returns
    // success without Set-Cookie; post-addon it auto-logs-in. Same code-path.
    if (result.setCookieHeader) {
        appendResponseHeader(event, 'Set-Cookie', result.setCookieHeader)
        const odooSessionId = parseOdooSessionFromSetCookie(result.setCookieHeader)
        if (odooSessionId) {
            const bridge = await defaultBridgeFromOdoo(odooSessionId)
            if (bridge) {
                setCookie(event, 'sessionId', bridge.sessionId, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'lax',
                    maxAge: CV_SESSION_TTL_SECS,
                    path: '/',
                })
            }
        }
    }

    return { success: true }
})
