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
    'utopiaxaction.theaterpedia.org',
])

/** Pure decision — host string → mode. */
export function resolveHostMode(host: string): HostMode {
    return PUBLIC_HOSTS.has(host) ? 'public' : 'app'
}

/**
 * ── The route-space contract · host → project (thread §3 · §9 tonight-narrow) ──
 *
 * A project's own registered domain (or `<domaincode>.theaterpedia.org`) IS the
 * project: on such a host the site-shape URLs (`/`, `/posts/:id`, `/events/:id`)
 * carry no `:domaincode` segment, so scope is RESOLVED from the host instead of
 * passed in the path. Grows one line per Phase-2 activation.
 *
 * ⚠ Deliberately a SECOND map beside `PUBLIC_HOSTS`, not a derivation of it
 * (contract §14·5): „is this host a project site?" and „does this host run in
 * public or app mode?" are two questions that happen to share an answer today.
 * Collapsing them is how the two-definition `SiteLayout` drift happened — and
 * `theaterpedia.org` is already the counter-example (publicly browsable, yet
 * app-mode by the safe default).
 *
 * ⚠ Bundle-code, therefore an activation costs a deploy. The contract's §15·A·4
 * proposes moving this to server-stamped data; until that is decided, one line
 * here per site.
 */
export const HOST_PROJECT: Record<string, string> = {
    'utopiaxaction.theaterpedia.org': 'utopiaxaction',
    // 'mariamueller.de': 'mariamueller',   // added on activation
    // A project's own registered domain lives here too, beside its
    // `<domaincode>.theaterpedia.org` form — utopiaxaction moved off
    // utopia-in-action.de on 2026-09-11 when that domain was freed.
}

/**
 * The project this host IS, or `undefined` for portal/app/foreign hosts.
 *
 * ⚠ Matches on the HOSTNAME: a port is never part of a site's identity, and
 * `window.location.host` carries one whenever the port is non-default. In
 * production (443) the two are identical; the difference is what makes the
 * site-shape testable on a dev server at all.
 */
export function domaincodeFromHost(host: string = ''): string | undefined {
    return HOST_PROJECT[host.split(':')[0] ?? host]
}

/** Content-resolution question — kept apart from `resolveHostMode` on purpose. */
export function isProjectHost(host: string = ''): boolean {
    return domaincodeFromHost(host) !== undefined
}

/**
 * Scope for a project component: the route segment when the URL carries one
 * (portal-shape), else the host (site-shape). `''` means „no project" — the
 * component renders its own empty state rather than guessing.
 */
export function resolveDomaincode(routeParam: unknown): string {
    if (typeof routeParam === 'string' && routeParam) return routeParam
    const host = typeof window !== 'undefined' ? window.location.host : ''
    return domaincodeFromHost(host) ?? ''
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
