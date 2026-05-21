/**
 * /api/auth/logout — CV-side logout · clears the CV session AND coordinates
 * an Odoo-side logout.
 *
 * Phase-A C9 (plan §10) extends the pre-C9 CV-only logout to also fire the
 * upstream `logout` graphql mutation against Odoo + clear the forwarded
 * Odoo `session_id` cookie on the browser. Without this, the user's Odoo
 * session lingered on `service.dasei.eu` (and on the browser-visible
 * cookie) until natural expiry · re-login would silently bridge back to
 * the still-valid Odoo session.
 *
 * Cookie-scope · Pattern-A v1 per [[2026-05-20_CTO-architectural-decision_odoo-as-IdP-cross-domain-auth-and-graphql-domain-context]] §2.2:
 * the Odoo `session_id` cookie is HOST-ONLY on `my.theaterpedia.org`
 * (Nitro is the response-origin · no Domain= attribute when Set-Cookie
 * passes through). To CLEAR a host-only cookie the clear-instruction must
 * NOT carry a Domain attribute either. Earlier draft of this commit had
 * `domain: '.theaterpedia.org'` carried over from the WED-package FLIP
 * framing — wrong for v1 (would target a `.theaterpedia.org`-scoped
 * cookie that doesn't exist · the host-only cookie persists). Dropped per
 * grandfather confirm + CV@prod cross-check 2026-05-21 PM (§17 edit-log).
 *
 * If / when Pattern-B (server-side session-store, exfiltration-defensive)
 * OR Path-B FLIP (intra-`.dasei.eu` cookie-sharing) land — both are named
 * future-state revisit-triggers — the cookie-scope changes and the
 * clear-instruction here must match whatever scope was-set.
 *
 * Failure tolerance: an Odoo-side logout failure is logged but does NOT
 * block the CV-side logout. The Odoo session times out naturally; CV
 * stays clean.
 */

import { defineEventHandler, deleteCookie, getCookie } from 'h3'
import { sessions } from '../../utils/session-store'

const ODOO_URL_DEFAULT = 'https://service.dasei.eu/graphql/vsf'

export default defineEventHandler(async (event) => {
    const cvSessionId = getCookie(event, 'sessionId')
    const odooSessionId = getCookie(event, 'session_id')

    // CV side · always clear regardless of Odoo state.
    if (cvSessionId) {
        sessions.delete(cvSessionId)
        deleteCookie(event, 'sessionId')
    }

    // Odoo side · fire-and-forget logout + clear forwarded cookie.
    if (odooSessionId) {
        try {
            const odooUrl = process.env.ODOO_GRAPHQL_URL || ODOO_URL_DEFAULT
            await fetch(odooUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Cookie: `session_id=${odooSessionId}`,
                },
                body: JSON.stringify({ query: 'mutation { logout }' }),
            })
        } catch (err) {
            console.warn('[logout] Odoo logout failed (suppressed):', err)
            // Don't block CV-side logout — Odoo session will time out anyway.
        }
        // Clear the host-only Odoo cookie on the browser (no Domain attribute ·
        // Pattern-A v1 · matches the response-origin scope).
        deleteCookie(event, 'session_id', { path: '/' })
    }

    return {
        success: true,
        message: 'Logged out successfully',
    }
})
