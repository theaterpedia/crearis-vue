import { computed, type ComputedRef } from 'vue'

/**
 * Host-discrimination composable — Phase-A C10 · plan §9a.
 *
 * Returns `'public' | 'app'` derived from `window.location.host`. Public-mode
 * hosts (per the v0.2 three-domain layout) render the SPA as always-anonymous
 * (no edit-panel, no Odoo auth-paths exposed). Everything else defaults to
 * app-mode (auth-gated behavior on `my.theaterpedia.org`).
 *
 * Per [[reference-three-domain-layout-theaterpedia-family]] +
 * v0.2 §5.1 (CTO architectural decision · proxy-everything · 2026-05-20).
 *
 * Default-fallback safety: unknown hosts → `'app'`. Defaulting to public-mode
 * would leak edit-perspective behavior on misconfigured deploys; defaulting
 * to auth-gated is the safer half (the worst case is a noisy login redirect,
 * not a privacy leak).
 *
 * The pure `resolveHostMode(host)` decision is exported separately so the
 * unit-suite covers branches without DOM-mocking (grandfather pattern matching
 * `bridgeFromOdoo` / `decideVerifyOutcome` / `performOdooLogin`).
 */

export type HostMode = 'public' | 'app'

/**
 * Public-mode hosts. Extend as additional public-facing project domains
 * onboard (freundes-kreis.de · raumlauf.de · etc. once their DNS lands).
 * Keep small + greppable; the orchestration-spine (CV@prod-pulse §3.1)
 * will source this list dynamically in the future-state.
 */
export const PUBLIC_HOSTS: ReadonlySet<string> = new Set([
    'utopia-in-action.de',
])

/** Pure decision — host string → mode. */
export function resolveHostMode(host: string): HostMode {
    return PUBLIC_HOSTS.has(host) ? 'public' : 'app'
}

export interface UseHostModeReturn {
    host: string
    mode: ComputedRef<HostMode>
}

export function useHostMode(): UseHostModeReturn {
    const host = typeof window !== 'undefined' ? window.location.host : ''
    const mode = computed<HostMode>(() => resolveHostMode(host))
    return { host, mode }
}
