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

import { domaincodeFromHost } from '@/composables/useHostMode'

/** What a frame RESOLVES TO — links already in the shape this host wants. */
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

/**
 * How a frame is DECLARED — project-internal targets as `sub`, never as a full
 * path, so the same declaration serves both URL-shapes (route-space contract
 * §3). `sub: ''` is the project's own landing; `'#team'` an anchor on it.
 */
interface DomainSiteFrameSpec extends Omit<DomainSiteFrame, 'navItems' | 'brand'> {
    navItems?: ReadonlyArray<{ label: string; sub?: string }>
    brand?: { src: string; alt: string; sub?: string }
}

const DOMAIN_SITE_FRAME_SPECS: Record<string, DomainSiteFrameSpec> = {
    // uia · never the platform wordmark (c95b514). O-2 RULED (HD 2026-08-07,
    // design-thread §3·1): the condensing masthead — ring + wordmark large at
    // rest (PageLayout's site-brand-banner), collapsing past scrollBreak with
    // the ring arriving in the sticky topnav corner.
    utopiaxaction: {
        showLogo: 'yes',
        brand: {
            src: '/api/images/local/shapes/utopiaxaction.image.uia_logo_ring_square.webp',
            alt: 'Utopia in Action',
            sub: '',
        },
        scrollStyle: 'overlay',
        navItems: [
            { label: 'Utopia in Action', sub: '' },
            { label: 'Agenda', sub: 'start' },
            // C1/P1: Team from the pedia nav — anchors to the landing's team block.
            { label: 'Team', sub: '#team' },
            // C1/P2: taken from pedia, RENAMED (blog → Blog & Presse) and
            // DEACTIVATED for now: no link = visible but not clickable — the
            // nav does not lie, and it does not 404 either.
            { label: 'Blog & Presse' },
        ],
    },
}

/**
 * Frame for a site — `null` means the platform default chrome stands.
 * Links are resolved HERE, per host, so consumers never hold a path-shape.
 */
export function resolveSiteFrame(domaincode: string | null | undefined): DomainSiteFrame | null {
    if (!domaincode) return null
    const spec = DOMAIN_SITE_FRAME_SPECS[domaincode]
    if (!spec) return null
    const { navItems, brand, ...rest } = spec
    return {
        ...rest,
        ...(brand ? { brand: { src: brand.src, alt: brand.alt, href: projectPath(domaincode, brand.sub) } } : {}),
        ...(navItems
            ? {
                navItems: navItems.map((item) => (item.sub === undefined
                    ? { label: item.label }
                    : { label: item.label, link: projectPath(domaincode, item.sub) })),
            }
            : {}),
    }
}

/**
 * A path INSIDE a project, in the shape the current host wants
 * (route-space contract §3):
 *
 *   on the project's own domain  →  `/`  ·  `/start`  ·  `/posts/7`
 *   anywhere else (portal/app)   →  `/sites/uia`  ·  `/sites/uia/start`  …
 *
 * The frame's nav and brand held hardcoded `/sites/…` paths, which left a
 * project's own domain the moment a visitor clicked its own logo. Every
 * project-internal link belongs through here — one helper, one shape-decision.
 *
 * ⚠ Still the portal-shape `/sites/:domaincode` prefix, NOT the contract's
 * target `/:domaincode`: the `/sites/…` → `/:domaincode/…` redirect is a later
 * step, and it must ship together with EditLink's prefix-injection and the
 * NavStops. When it lands, this one function changes and the call-sites do not.
 */
export function projectPath(domaincode: string, sub = ''): string {
    const tail = sub && !sub.startsWith('#') ? (sub.startsWith('/') ? sub : `/${sub}`) : sub
    const onOwnDomain = domaincodeFromHost(
        typeof window !== 'undefined' ? window.location.host : '',
    ) === domaincode
    if (onOwnDomain) return tail.startsWith('#') ? `/${tail}` : (tail || '/')
    return `/sites/${domaincode}${tail}`
}
