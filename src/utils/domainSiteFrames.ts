/**
 * Per-domaincode SITE-FRAME resolution — the chrome sibling of
 * `domainThemeOverrides.ts` (F-4, HD-approved 2026-08-06: „we follow exactly
 * your proposal").
 *
 * The catch it kills: EventPage/PostPage mount PageLayout with no `showLogo`
 * and hardcoded dashboard navItems, so every fullview wore the Theaterpedia
 * wordmark on the uia site (uia thread §10.9 — the browser-loop catch; the
 * c95b514 rule: no Theaterpedia wordmark in the uia topnav).
 *
 * One seam, three consumers by design: theme tokens (domainThemeOverrides) ·
 * chrome (this) · preset (projectPreset). All three key off the same resolved
 * domaincode — route param today, host→domaincode resolution on the one
 * instance later. When that resolution lands, these registries become its
 * config surface.
 */

export interface DomainSiteFrame {
    /** PageLayout's showLogo — 'no' = the site brings its own brand, not the platform's. */
    showLogo?: 'default' | 'desktop' | 'yes' | 'no'
    /** The site's public nav. Editor/dashboard links stay role-gated in the pages. */
    navItems?: ReadonlyArray<{ label: string; link: string }>
}

export const DOMAIN_SITE_FRAMES: Record<string, DomainSiteFrame> = {
    // uia · no platform wordmark (c95b514); the site's own nav. The logo ring
    // (registry image id 3) lands with sister C's external-design pass.
    utopiaxaction: {
        showLogo: 'no',
        navItems: [
            { label: 'Utopia in Action', link: '/sites/utopiaxaction' },
            { label: 'Agenda', link: '/sites/utopiaxaction/start' },
        ],
    },
}

/** Frame for a site — `null` means the platform default chrome stands. */
export function resolveSiteFrame(domaincode: string | null | undefined): DomainSiteFrame | null {
    if (!domaincode) return null
    return DOMAIN_SITE_FRAMES[domaincode] ?? null
}
