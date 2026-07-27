/**
 * Navigation for the uia site (Utopia in Action · Augsburg).
 *
 * SCOPE THIS ROUND (HP 2026-07-27): only the landing (`/`) and ONE content-page
 * (`/agenda`) get built. The other three navstops exist but stay EMPTY — they
 * render, they are reachable, and they say so. Do not hide them: a nav that
 * lies about what exists is worse than a nav with a stub behind it.
 *
 * The owners' own page-order was: Vision · nächste Projekte · Unser Programm ·
 * Insta & Kontakt · Presse. Two changes, both settled with HP:
 *   - „nächste Projekte" + „Unser Programm" ARE one thing → `Agenda`. Their own
 *     Unser-Programm text says so: the Zusatzprogramm section is exactly the
 *     nächste-Projekte list.
 *   - „Insta & Kontakt" → `Kontakt` · „Presse" → `Blog & Presse`.
 *
 * Agenda leads, because for an agenda-typus site the agenda IS the heart —
 * not the vision that frames it.
 */

import type { TopnavParentItem } from '@/components/TopNav.vue'

/** A navstop plus whether it has content this round. */
export interface UiaNavItem extends TopnavParentItem {
    /** false → route resolves to the shared „in Arbeit" stub. */
    ready: boolean
}

export const navItems: ReadonlyArray<UiaNavItem> = [
    { label: 'Agenda', link: '/agenda', ready: true },
    { label: 'Vision', link: '/vision', ready: false },
    { label: 'Blog & Presse', link: '/blog', ready: false },
    { label: 'Kontakt', link: '/kontakt', ready: false },
]

/** Copy for the shared stub behind every `ready: false` navstop. */
export const stub = {
    overline: 'diese Seite entsteht gerade',
    headline: 'Wir sind noch beim Einrichten',
    body: 'Bis dahin findest du alles Aktuelle auf der Agenda — oder schreib uns einfach.',
    link: { href: '/agenda', label: '→ zur Agenda' },
}
