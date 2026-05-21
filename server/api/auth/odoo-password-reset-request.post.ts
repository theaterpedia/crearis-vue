/**
 * /api/auth/odoo-password-reset-request — CV-side "forgot password" form →
 * Odoo `resetPassword` graphql mutation (sends reset-email).
 *
 * Phase-A C3 per [[2026-05-21_CV@wsl-2_next-action-plan_SSO-Phase-A-handoff]] §4
 * + CV@wsl-2 proposal §3.3.
 *
 * Simplest of the 4 auth endpoints — no Set-Cookie capture (Odoo only sends
 * the reset-email · no session issued), no bridge needed.
 *
 * ⚠ Always returns `{ success: true }` regardless of the upstream outcome —
 * email-enumeration timing-attack mitigation (proposal §9 risk #1). The
 * upstream `resetPassword` resolver returns the same shape whether or not
 * the email matches an actual partner; surfacing distinct outcomes to the
 * caller would leak partner-membership.
 *
 * Reset-email-template customization (CO@prod's `crearis_password_reset_cv_url`
 * addon · Phase-C item-2) makes the email link point at
 * `https://my.theaterpedia.org/auth/reset?token={{ token }}` — that route
 * lands in C7. Without the addon the email still goes out but the link
 * targets Odoo's web/reset_password endpoint (unreachable from CV side); the
 * reset-flow user-experience is broken until the addon deploys (proposal §9
 * risk #5 · plan §0.2-(b)).
 */

import {
    createError,
    defineEventHandler,
    getRequestHost,
    getRequestIP,
    readBody,
} from 'h3'

const ODOO_URL_DEFAULT = 'https://service.dasei.eu/graphql/vsf'

const RESET_PASSWORD_MUTATION = `
    mutation ResetPassword($email: String!) {
        resetPassword(email: $email)
    }
`

interface PerformResetRequestInput {
    email: string
    realIp: string
    requestHost: string
}

interface PerformResetRequestDeps {
    odooUrl: string
    fetchFn?: typeof fetch
}

/**
 * Pure-ish reset-request — fires the upstream mutation. Always-resolves; the
 * upstream result is logged but never surfaces to the caller (enumeration
 * protection). Returns true when the upstream call completed cleanly (for
 * test-assertion + log-surface); endpoint ignores the boolean.
 */
export async function performOdooResetRequest(
    input: PerformResetRequestInput,
    deps: PerformResetRequestDeps,
): Promise<boolean> {
    const fetchFn = deps.fetchFn ?? fetch
    try {
        const response = await fetchFn(deps.odooUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'REAL-IP': input.realIp,
                'resquest-host': input.requestHost,
            },
            body: JSON.stringify({
                query: RESET_PASSWORD_MUTATION,
                variables: { email: input.email },
            }),
        })
        // Drain body to avoid keeping the connection open; log if upstream
        // signaled an error but do NOT propagate (enumeration protection).
        const json = (await response.json().catch(() => null)) as {
            errors?: Array<{ message: string }>
        } | null
        if (json?.errors?.length) {
            console.warn(
                '[odoo-password-reset-request] upstream signaled error (suppressed):',
                json.errors[0]?.message,
            )
            return false
        }
        return true
    } catch (err) {
        console.warn(
            '[odoo-password-reset-request] upstream fetch error (suppressed):',
            err,
        )
        return false
    }
}

export default defineEventHandler(async (event) => {
    const body = await readBody<{ email?: string }>(event)
    if (!body?.email) {
        throw createError({ statusCode: 400, message: 'Email is required' })
    }

    await performOdooResetRequest(
        {
            email: body.email,
            realIp: getRequestIP(event) || '',
            requestHost: getRequestHost(event) || '',
        },
        { odooUrl: process.env.ODOO_GRAPHQL_URL || ODOO_URL_DEFAULT },
    )

    // Enumeration protection — always return success regardless of outcome.
    return { success: true }
})
