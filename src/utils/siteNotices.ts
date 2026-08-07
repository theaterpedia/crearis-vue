/**
 * Per-domaincode SITE NOTICES — temporal post-it announcements on a site's
 * public pages. Third member of the domaincode seam-family (theme tokens ·
 * chrome frame · notices), same resolution key.
 *
 * These are ⟨CV⟩/owner-approved texts with a lifetime, not page content: the
 * alpha notice runs until the site leaves alpha, the Sommerpause has dates.
 * `from`/`until` are ISO dates (venue-time semantics — a day boundary, not a
 * timestamp); a notice renders only inside its window.
 *
 * Texts approved by HD 2026-08-07 (alpha as proposed; Sommerpause corrected:
 * „Mails lesen wir aber durchaus").
 */

import type { PostitColor, PostitRotation } from '@/fpostit/types'

export interface SiteNotice {
    /** Controller key — stable, so a page never registers it twice. */
    key: string
    title: string
    /** HTML content (the fpostit card renders v-html). */
    html: string
    /** Semantic color per the gloss grammar — never decoration. */
    color: PostitColor
    /**
     * The CARD consumes rotation as a class string ('rotate-2'); the numeric-
     * degrees rule (parseRotateDeg trap) applies to the board util, not here.
     */
    rotation?: PostitRotation
    /** Which surfaces carry it. 'site' = the project home · 'start' = /start. */
    routes: ReadonlyArray<'site' | 'start'>
    /** ISO date bounds, inclusive; absent = unbounded. */
    from?: string
    until?: string
}

export const DOMAIN_SITE_NOTICES: Record<string, ReadonlyArray<SiteNotice>> = {
    utopiaxaction: [
        // The alpha notice MOVED to the page-alert banner (C1/P9 — pedia's
        // standard-config mechanism, `page_options.alert_banner` on the landing
        // pages-row). Only the Sommerpause stays a post-it: positive = the
        // lived, per the grammar. Rosa is off from SA 2026-08-09, three weeks.
        // The window gates AUTO-OPENING; the card itself stays registered so
        // cta2 on the landing can open it any time (C1/P8).
        {
            key: 'uia-notice-sommerpause',
            title: 'Wir machen Sommerpause!',
            html: '<p>Bis Ende August sind wir schwerer erreichbar — Mails lesen wir aber durchaus. '
                + 'Ab September geht’s weiter, und ab <strong>10.09.</strong> läuft die Anmeldung '
                + 'für „Meine Grenzen". Wir freuen uns auf euch!</p>',
            color: 'positive',
            rotation: 'rotate-2',
            routes: ['site'],
            from: '2026-08-09',
            until: '2026-08-31',
        },
    ],
}

/** All notices REGISTERABLE for a surface — windows do not gate registration. */
export function resolveSiteNotices(
    domaincode: string | null | undefined,
    surface: 'site' | 'start',
): SiteNotice[] {
    if (!domaincode) return []
    return (DOMAIN_SITE_NOTICES[domaincode] ?? []).filter((notice) => notice.routes.includes(surface))
}

/** Is the notice inside its window today (venue-day granularity)? Gates AUTO-OPEN only. */
export function isNoticeActive(notice: SiteNotice, today: Date = new Date()): boolean {
    const todayIso = today.toISOString().slice(0, 10)
    return (!notice.from || todayIso >= notice.from) && (!notice.until || todayIso <= notice.until)
}
