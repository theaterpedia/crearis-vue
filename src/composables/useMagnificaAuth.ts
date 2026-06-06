/**
 * useMagnificaAuth — client-side reactive auth-state for the Magnifica response-page.
 *
 * Gesture-mode design (HM-2026-06-02 PM): the SPA reads the readable companion
 * cookie `magnifica_auth_present` to know whether to render gated content. The
 * real auth-hash lives in httpOnly `magnifica_auth` and stays inaccessible to
 * client JS · the server validates it on the login POST.
 *
 * Per crearis:projects/magnifica/docs/howto-password-entry.md §0.4 (one URL ·
 * the hero stays · gated content unfolds below post-auth) + the gesture-mode
 * discipline that a bypass by manual cookie-setting is structurally acceptable.
 *
 * Module-level singleton state: all consumers share one reactive ref so the
 * route-guard and the page-components see the same value at the same time.
 */

import { computed, ref, type ComputedRef } from 'vue'

const COOKIE_PRESENT = 'magnifica_auth_present'

/** Pure helper · injectable for tests via the `cookieString` param. */
export function readPresentFlag(cookieString?: string): boolean {
    const source = cookieString ?? (typeof document !== 'undefined' ? document.cookie : '')
    if (!source) return false
    const parts = source.split(';')
    for (const part of parts) {
        const trimmed = part.trim()
        if (trimmed === `${COOKIE_PRESENT}=1`) return true
        // tolerate quoting / extra whitespace
        if (trimmed.startsWith(`${COOKIE_PRESENT}=`)) {
            const value = trimmed.slice(COOKIE_PRESENT.length + 1).replace(/^"|"$/g, '')
            if (value === '1') return true
        }
    }
    return false
}

const isAuthenticated = ref(readPresentFlag())

export function useMagnificaAuth(): {
    isAuthenticated: ComputedRef<boolean>
    refresh: () => void
    logout: () => Promise<void>
} {
    function refresh() {
        isAuthenticated.value = readPresentFlag()
    }

    async function logout() {
        try {
            await fetch('/__auth/logout', { method: 'POST', credentials: 'include' })
        } catch {
            // best-effort · cookies might already be gone
        }
        refresh()
        if (typeof window !== 'undefined') {
            window.location.href = '/'
        }
    }

    return {
        isAuthenticated: computed(() => isAuthenticated.value),
        refresh,
        logout,
    }
}
