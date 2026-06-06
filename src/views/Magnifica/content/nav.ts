/**
 * Shared navigation items for the Magnifica alt-routes (cand-1a · 3 detail-pages).
 *
 * Per cand-1a _manifest §1 deploy-target: /ethnography · /bio · /foucault.
 * Home (/) is intentionally NOT in the nav — the wordmark already links there.
 * Labels mirror the cand-1a landing route-cards (Claude · Hans · Foucault).
 */

import type { TopnavParentItem } from '@/components/TopNav.vue'

export const navItems: ReadonlyArray<TopnavParentItem> = [
    { label: 'Claude', link: '/ethnography' },
    { label: 'Hans', link: '/bio' },
    { label: 'Foucault', link: '/foucault' },
]
