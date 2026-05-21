/**
 * /api/auth/odoo-login — CV-side login form → Odoo `login` graphql mutation.
 *
 * Phase-A C1 per [[2026-05-21_CV@wsl-2_next-action-plan_SSO-Phase-A-handoff]] §2
 * + CV@wsl-2 proposal §3.1 + whitepaper §4.3 lineage (Pattern-A · v0.2).
 *
 * Flow:
 *   1. Receive { email, password } from CV-side Login.vue (creator-tier).
 *   2. POST graphql `login` mutation to ODOO_GRAPHQL_URL.
 *   3. Capture upstream Set-Cookie → appendResponseHeader to browser
 *      (load-bearing whitepaper §4.3 — closes the c48ae1d gap).
 *   4. Parse `session_id` from Set-Cookie · call `bridgeFromOdoo()` to
 *      create the CV-local sessionId mirror (reuses 02-auth.ts shipped at 3921e8c).
 *   5. Return { success, partner } · both cookies live on the browser.
 *
 * Identity-principle ([[project-identity-principle-2-relation-stage-gates]]):
 * this endpoint is CREATOR-tier only. Parents/pupils use `/api/auth/login`
 * (CV-LOCAL-DB · zero-Odoo-presence) — that endpoint must NOT be removed.
 *
 * Decision-logic extracted as the pure `performOdooLogin()` function so the
 * unit-suite covers branches without an h3-event mock (grandfather pattern
 * matching `bridgeFromOdoo` / `decideVerifyOutcome`).
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

const LOGIN_MUTATION = `
    mutation Login($email: String!, $password: String!) {
        login(email: $email, password: $password) {
            id
            name
            email
        }
    }
`

export interface OdooPartnerSummary {
    id: number
    name: string
    email: string
}

export type PerformOdooLoginResult =
    | {
          ok: true
          setCookieHeader: string | null
          partner: OdooPartnerSummary
      }
    | {
          ok: false
          statusCode: 401 | 502
          message: string
      }

interface PerformOdooLoginInput {
    email: string
    password: string
    realIp: string
    requestHost: string
}

interface PerformOdooLoginDeps {
    odooUrl: string
    fetchFn?: typeof fetch
}

interface OdooGraphqlLoginResponse {
    data?: { login?: OdooPartnerSummary | null }
    errors?: Array<{ message: string }>
}

/**
 * Pure-ish login decision — performs the upstream POST + classifies the
 * response into success-with-Set-Cookie or a structured failure. Injectable
 * `fetchFn` lets the test-suite cover branches without a live Odoo.
 */
export async function performOdooLogin(
    input: PerformOdooLoginInput,
    deps: PerformOdooLoginDeps,
): Promise<PerformOdooLoginResult> {
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
                query: LOGIN_MUTATION,
                variables: { email: input.email, password: input.password },
            }),
        })
    } catch (err) {
        console.error('[odoo-login] upstream fetch error:', err)
        return {
            ok: false,
            statusCode: 502,
            message: err instanceof Error ? err.message : 'Upstream network error',
        }
    }

    let json: OdooGraphqlLoginResponse
    try {
        json = (await response.json()) as OdooGraphqlLoginResponse
    } catch (err) {
        console.error('[odoo-login] upstream JSON parse error:', err)
        return {
            ok: false,
            statusCode: 502,
            message: 'Upstream returned non-JSON response',
        }
    }

    if (json.errors?.length || !json.data?.login) {
        return {
            ok: false,
            statusCode: 401,
            message: json.errors?.[0]?.message || 'Login failed',
        }
    }

    return {
        ok: true,
        setCookieHeader: response.headers.get('set-cookie'),
        partner: json.data.login,
    }
}

export default defineEventHandler(async (event) => {
    const body = await readBody<{ email?: string; password?: string }>(event)
    if (!body?.email || !body?.password) {
        throw createError({
            statusCode: 400,
            message: 'Email and password required',
        })
    }

    const result = await performOdooLogin(
        {
            email: body.email,
            password: body.password,
            realIp: getRequestIP(event) || '',
            requestHost: getRequestHost(event) || '',
        },
        { odooUrl: process.env.ODOO_GRAPHQL_URL || ODOO_URL_DEFAULT },
    )

    if (!result.ok) {
        throw createError({ statusCode: result.statusCode, message: result.message })
    }

    // Pattern-A · forward Odoo's Set-Cookie verbatim. Nitro is the response-origin
    // so the cookie lands host-only on the request host (e.g. my.theaterpedia.org)
    // — exactly what v0.2 §2.4 Flow-B step 3a + whitepaper §4.3 require pre-FLIP.
    if (result.setCookieHeader) {
        appendResponseHeader(event, 'Set-Cookie', result.setCookieHeader)
    }

    // Mirror Odoo's session into a CV-local sessionId so the existing
    // session.get / verify paths work for downstream requests.
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

    return { success: true, partner: result.partner }
})
