/**
 * /api/auth/verify — NGINX edge-auth endpoint (SSO-StepB §3.4).
 *
 * Lightweight status-code-only endpoint called by NGINX `auth_request` directive
 * to gate SPA-shell serving without flash-of-unauth-content. Returns 200 if
 * the current request authenticates (CV-local session OR Odoo session resolved
 * via 02-auth bridging-middleware which runs before this handler), 401 otherwise.
 *
 * No body. Status-code is the entire signal NGINX needs.
 *
 * Auth-resolution order (after middleware chain runs):
 *   1. `event.context.session` populated by 02-auth.ts (Odoo-cookie → CV-session
 *      lazy-create or Odoo-cookie direct-verify cached on context)
 *   2. CV-local `sessionId` cookie present in sessions Map + not expired
 *   3. Otherwise → 401
 *
 * Until 02-auth.ts middleware lands (§3.1), only path 2 fires — verify is then
 * equivalent to a stripped session.get.ts. Once middleware is wired, path 1
 * carries the Odoo-cookie case transparently.
 *
 * Per CTO-WED-package §3.4 + §2 Step-6 (NGINX deploys this endpoint before
 * the FLIP; pre-FLIP it 401s any non-CV-cookie request as expected).
 */

import { defineEventHandler, getCookie, setResponseStatus } from 'h3'
import { sessions } from '../../utils/session-store'

/** Outcome enum — keeps the endpoint's decision pure-testable. */
export type VerifyOutcome = 'authed-via-context' | 'authed-via-cookie' | 'unauthed'

interface VerifyInputs {
    /** Truthy if `02-auth.ts` middleware populated `event.context.session`. */
    ctxSessionUserId: number | null
    /** CV-local `sessionId` cookie value, if any. */
    sessionId: string | undefined
    /** Current time (ms since epoch) — injected for test-determinism. */
    now: number
}

/**
 * Pure auth-decision (extracted for unit-testing without h3-event mocks).
 * Side-effect: drops stale sessions from the in-memory store.
 */
export function decideVerifyOutcome(input: VerifyInputs): VerifyOutcome {
    if (input.ctxSessionUserId !== null) {
        return 'authed-via-context'
    }
    if (input.sessionId) {
        const session = sessions.get(input.sessionId)
        if (session && session.expiresAt >= input.now) {
            return 'authed-via-cookie'
        }
        if (session) {
            // Stale — drop it so subsequent verify calls don't hit the same path.
            sessions.delete(input.sessionId)
        }
    }
    return 'unauthed'
}

export default defineEventHandler((event) => {
    const ctxSession = (event.context as { session?: { userId?: number } }).session
    const ctxSessionUserId =
        ctxSession && typeof ctxSession.userId === 'number' ? ctxSession.userId : null

    const outcome = decideVerifyOutcome({
        ctxSessionUserId,
        sessionId: getCookie(event, 'sessionId'),
        now: Date.now(),
    })

    setResponseStatus(event, outcome === 'unauthed' ? 401 : 200)
    return ''
})
