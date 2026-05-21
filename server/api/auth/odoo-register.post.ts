/**
 * /api/auth/odoo-register — CV-side creator-tier registration form →
 * Odoo `register` graphql mutation.
 *
 * Phase-A C2 per [[2026-05-21_CV@wsl-2_next-action-plan_SSO-Phase-A-handoff]] §3
 * + CV@wsl-2 proposal §3.2.
 *
 * ⚠ Blocking-dep on auto-login (Phase-C item-1 `crearis_auth_resolver_patches`):
 * the upstream `register` resolver as-shipped does NOT call
 * `request.session.authenticate()`, so NO Set-Cookie is issued — CO@prod
 * cross-check 07ff15b · plan §3. Code ships with the Set-Cookie capture path
 * in place; once CO@prod's resolver-patch addon deploys, the same code starts
 * auto-mirroring the new Odoo session into a CV-local sessionId. Until then
 * the endpoint returns `{ success, partner }` and the client falls back to
 * the login form (or re-uses the credentials it just submitted).
 *
 * Identity-principle ([[project-identity-principle-2-relation-stage-gates]]):
 * this endpoint is CREATOR-tier only. Parents/pupils MUST use `/getstarted`
 * (CV-LOCAL-DB · zero-Odoo-presence). The UI must NOT offer this endpoint
 * as the registration path for /getstarted-originated users.
 *
 * Mutation argument-order note (CO@prod §7.1): the upstream signature is
 * `register(name!, email!, password!, subscribeNewsletter)` — `name` first.
 * graphql is named-args so positional order doesn't matter on the wire, but
 * the field names must match.
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
import type { OdooPartnerSummary } from './odoo-login.post'

const ODOO_URL_DEFAULT = 'https://service.dasei.eu/graphql/vsf'
const CV_SESSION_TTL_SECS = 24 * 60 * 60

const REGISTER_MUTATION = `
    mutation Register(
        $name: String!,
        $email: String!,
        $password: String!,
        $subscribeNewsletter: Boolean
    ) {
        register(
            name: $name,
            email: $email,
            password: $password,
            subscribeNewsletter: $subscribeNewsletter
        ) {
            id
            name
            email
        }
    }
`

export type PerformOdooRegisterResult =
    | {
          ok: true
          setCookieHeader: string | null
          partner: OdooPartnerSummary
      }
    | {
          ok: false
          statusCode: 400 | 409 | 502
          message: string
      }

interface PerformOdooRegisterInput {
    email: string
    name: string
    password: string
    subscribeNewsletter: boolean
    realIp: string
    requestHost: string
}

interface PerformOdooRegisterDeps {
    odooUrl: string
    fetchFn?: typeof fetch
}

interface OdooGraphqlRegisterResponse {
    data?: { register?: OdooPartnerSummary | null }
    errors?: Array<{ message: string }>
}

/**
 * Crude pattern-match for the email-already-in-use case so the endpoint can
 * surface 409 (conflict) vs 400 (generic upstream rejection). Matches Odoo's
 * default signup error phrases. Future-CV may tighten this once we have
 * deployed-Odoo-error samples on the wire.
 */
function classifyRegisterError(message: string): 400 | 409 {
    const lowered = message.toLowerCase()
    if (
        lowered.includes('already') &&
        (lowered.includes('email') ||
            lowered.includes('mail') ||
            lowered.includes('exist'))
    ) {
        return 409
    }
    return 400
}

/** Pure-ish register decision — POST + classify into success or structured failure. */
export async function performOdooRegister(
    input: PerformOdooRegisterInput,
    deps: PerformOdooRegisterDeps,
): Promise<PerformOdooRegisterResult> {
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
                query: REGISTER_MUTATION,
                variables: {
                    name: input.name,
                    email: input.email,
                    password: input.password,
                    subscribeNewsletter: input.subscribeNewsletter,
                },
            }),
        })
    } catch (err) {
        console.error('[odoo-register] upstream fetch error:', err)
        return {
            ok: false,
            statusCode: 502,
            message: err instanceof Error ? err.message : 'Upstream network error',
        }
    }

    let json: OdooGraphqlRegisterResponse
    try {
        json = (await response.json()) as OdooGraphqlRegisterResponse
    } catch (err) {
        console.error('[odoo-register] upstream JSON parse error:', err)
        return {
            ok: false,
            statusCode: 502,
            message: 'Upstream returned non-JSON response',
        }
    }

    if (json.errors?.length) {
        const message = json.errors[0]?.message || 'Registration failed'
        return { ok: false, statusCode: classifyRegisterError(message), message }
    }
    if (!json.data?.register) {
        return { ok: false, statusCode: 400, message: 'Registration failed' }
    }

    return {
        ok: true,
        setCookieHeader: response.headers.get('set-cookie'),
        partner: json.data.register,
    }
}

export default defineEventHandler(async (event) => {
    const body = await readBody<{
        email?: string
        name?: string
        password?: string
        subscribeNewsletter?: boolean
    }>(event)
    if (!body?.email || !body?.name || !body?.password) {
        throw createError({
            statusCode: 400,
            message: 'Email, name, and password are required',
        })
    }

    const result = await performOdooRegister(
        {
            email: body.email,
            name: body.name,
            password: body.password,
            subscribeNewsletter: body.subscribeNewsletter ?? false,
            realIp: getRequestIP(event) || '',
            requestHost: getRequestHost(event) || '',
        },
        { odooUrl: process.env.ODOO_GRAPHQL_URL || ODOO_URL_DEFAULT },
    )

    if (!result.ok) {
        throw createError({ statusCode: result.statusCode, message: result.message })
    }

    // Pre-addon-deploy: register does NOT auto-login → no Set-Cookie · skip mirror.
    // Post-addon-deploy: register DOES auto-login → Set-Cookie present · mirror as
    // in C1. Same code-path; the addon flips the auto-login behavior upstream.
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

    return { success: true, partner: result.partner }
})
