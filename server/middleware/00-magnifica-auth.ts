/**
 * 00-magnifica-auth.ts — Magnifica response-page password-gate.
 *
 * Gesture-mode per HM-2026-06-02 PM: the password is a hospitality-threshold,
 * not a security guard. Olah was emailed the URL + the password by Hans
 * personally. The password-step is the threshold (per Umkehr-der-Fliessrichtung
 * discipline: invitation, not push).
 *
 * The middleware does ONE thing: handle POST /__auth (login) and POST
 * /__auth/logout. Static assets and every other request pass through untouched.
 *
 * Two-cookie pattern (gesture-mode adapted from howto-password-entry §4 · Nuxt-
 * framed howto adapted to crearis-vue's pure Vue 3 + Vite SPA + Nitro standalone
 * shape):
 *   - `magnifica_auth`         · httpOnly · sha256(password) · server-validates
 *   - `magnifica_auth_present` · readable · "1" · client reads on boot
 *
 * The readable companion cookie lets the SPA know whether to render gated
 * content without a server-roundtrip · acceptable for gesture-mode (the
 * substrate exists in the SPA bundle anyway · the hash is not the password).
 *
 * Per crearis:projects/magnifica/docs/howto-password-entry.md §0 (CCCS-organic-
 * intellectual register · Umkehr-der-Fliessrichtung) + §4 (Nitro middleware
 * spec) + integration-directions.md §3 step-5.
 *
 * Env-vars:
 *   MAGNIFICA_PASSWORD        · shared secret with Olah · required
 *   MAGNIFICA_COOKIE_MAX_AGE  · seconds · default 31536000 (1 year) · gesture-mode
 */

import { createHash } from 'node:crypto'
import {
    defineEventHandler,
    getMethod,
    getRequestURL,
    readBody,
    sendRedirect,
    setCookie,
    deleteCookie,
    setResponseStatus,
} from 'h3'

const COOKIE_AUTH = 'magnifica_auth'
const COOKIE_PRESENT = 'magnifica_auth_present'
const DEFAULT_MAX_AGE = 60 * 60 * 24 * 365 // 1 year · gesture-mode long-lived cookie

/**
 * Redirect URLs · exported for test verification + reuse.
 *
 * SUCCESS_REDIRECT carries the `?just_unlocked=1` flag that triggers the
 * 3-beat unlock overlay per crearis:projects/magnifica/docs/animations.md §2.3
 * Option A. The SPA reads the flag on mount, plays the overlay, then calls
 * `history.replaceState` to clean the URL · prevents replay on refresh.
 *
 * MISMATCH_REDIRECT carries the inline-error query-param read by EntryHero ·
 * shows "Wrong password." in the form-region. Adapts howto-password-entry §4
 * (401-with-inline-error) to a 302-with-query for pure-HTML-form-POST shape.
 */
export const SUCCESS_REDIRECT = '/?just_unlocked=1'
export const MISMATCH_REDIRECT = '/?error=invalid'

/** sha256 hex of a string · used for the auth-cookie value. Pure helper. */
export function sha256Hex(input: string): string {
    return createHash('sha256').update(input, 'utf8').digest('hex')
}

/** Pure decision-fn for the POST handler · injectable for tests. */
export function decideAuthOutcome(input: {
    submitted: string
    expected: string
}): { kind: 'match'; cookieValue: string } | { kind: 'mismatch' } | { kind: 'misconfig' } {
    if (!input.expected) {
        return { kind: 'misconfig' }
    }
    if (input.submitted && input.submitted === input.expected) {
        return { kind: 'match', cookieValue: sha256Hex(input.submitted) }
    }
    return { kind: 'mismatch' }
}

export default defineEventHandler(async (event) => {
    const url = getRequestURL(event)
    const method = getMethod(event)

    // Only handle our two endpoints; everything else passes through
    if (method !== 'POST') return
    if (url.pathname !== '/__auth' && url.pathname !== '/__auth/logout') return

    const isProd = process.env.NODE_ENV === 'production'

    // POST /__auth/logout · clear both cookies · redirect home (no unlock trigger)
    if (url.pathname === '/__auth/logout') {
        deleteCookie(event, COOKIE_AUTH, { path: '/' })
        deleteCookie(event, COOKIE_PRESENT, { path: '/' })
        return sendRedirect(event, '/', 302)
    }

    // POST /__auth · login attempt
    const expected = process.env.MAGNIFICA_PASSWORD || ''
    const body = await readBody<{ password?: string }>(event).catch(() => ({}))
    const submitted = (body?.password ?? '').toString()
    const outcome = decideAuthOutcome({ submitted, expected })

    if (outcome.kind === 'misconfig') {
        setResponseStatus(event, 500)
        return { error: 'MAGNIFICA_PASSWORD is not configured on the server.' }
    }
    if (outcome.kind === 'mismatch') {
        return sendRedirect(event, MISMATCH_REDIRECT, 302)
    }

    // Match · set both cookies and redirect home
    const maxAge = parseInt(
        process.env.MAGNIFICA_COOKIE_MAX_AGE || String(DEFAULT_MAX_AGE),
        10,
    )

    setCookie(event, COOKIE_AUTH, outcome.cookieValue, {
        httpOnly: true,
        secure: isProd,
        sameSite: 'strict',
        path: '/',
        maxAge,
    })
    setCookie(event, COOKIE_PRESENT, '1', {
        httpOnly: false,
        secure: isProd,
        sameSite: 'strict',
        path: '/',
        maxAge,
    })
    return sendRedirect(event, SUCCESS_REDIRECT, 302)
})
