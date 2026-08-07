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
    /** The site's public nav. `link` optional — a linkless item renders deactivated. */
    navItems?: ReadonlyArray<{ label: string; link?: string }>
    /**
     * The site's own mark — rendered in TopNav's logo slot INSTEAD of the
     * platform wordmark. `href` is the site's home, never `/` (the portal).
     */
    brand?: { src: string; alt: string; href: string }
    /**
     * Topnav scroll behavior. O-2 (the condensing masthead) needs a sticky
     * nav so the corner ring has somewhere to arrive: 'overlay'.
     */
    scrollStyle?: 'simple' | 'overlay' | 'overlay_reappear'
}

export const DOMAIN_SITE_FRAMES: Record<string, DomainSiteFrame> = {
    // uia · never the platform wordmark (c95b514). O-2 RULED (HD 2026-08-07,
    // design-thread §3·1): the condensing masthead — ring + wordmark large at
    // rest (PageLayout's site-brand-banner), collapsing past scrollBreak with
    // the ring arriving in the sticky topnav corner.
    utopiaxaction: {
        showLogo: 'yes',
        brand: {
            src: '/api/images/local/shapes/utopiaxaction.image.uia_logo_ring_square.webp',
            alt: 'Utopia in Action',
            href: '/sites/utopiaxaction',
        },
        scrollStyle: 'overlay',
        navItems: [
            { label: 'Utopia in Action', link: '/sites/utopiaxaction' },
            { label: 'Agenda', link: '/sites/utopiaxaction/start' },
            // C1/P1: Team from the pedia nav — anchors to the landing's team block.
            { label: 'Team', link: '/sites/utopiaxaction#team' },
            // C1/P2: taken from pedia, RENAMED (blog → Blog & Presse) and
            // DEACTIVATED for now: no link = visible but not clickable — the
            // nav does not lie, and it does not 404 either.
            { label: 'Blog & Presse' },
        ],
    },
}

/** Frame for a site — `null` means the platform default chrome stands. */
export function resolveSiteFrame(domaincode: string | null | undefined): DomainSiteFrame | null {
    if (!domaincode) return null
    return DOMAIN_SITE_FRAMES[domaincode] ?? null
}
