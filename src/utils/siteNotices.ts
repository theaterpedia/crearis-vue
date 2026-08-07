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
        {
            // muted = utility/meta per the four-color grammar.
            key: 'uia-notice-alpha',
            title: 'Diese Website ist neu.',
            html: '<p>Wir bauen sie gerade erst auf — manches fehlt noch, manches ändert sich. '
                + 'Wenn dir etwas auffällt: Schreib uns, wir freuen uns! '
                + '<a href="mailto:uiacollective@gmail.com">uiacollective@gmail.com</a></p>',
            color: 'muted',
            rotation: '-rotate-1',
            routes: ['site', 'start'],
        },
        {
            // positive = the lived, per the grammar. Rosa is off from SA
            // 2026-08-09, three weeks.
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

/** The notices active for a surface today (venue-day granularity). */
export function resolveSiteNotices(
    domaincode: string | null | undefined,
    surface: 'site' | 'start',
    today: Date = new Date(),
): SiteNotice[] {
    if (!domaincode) return []
    const all = DOMAIN_SITE_NOTICES[domaincode] ?? []
    const todayIso = today.toISOString().slice(0, 10)
    return all.filter((notice) =>
        notice.routes.includes(surface)
        && (!notice.from || todayIso >= notice.from)
        && (!notice.until || todayIso <= notice.until))
}
