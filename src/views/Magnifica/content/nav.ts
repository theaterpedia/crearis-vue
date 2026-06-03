/**
 * Shared navigation items for the Magnifica alt-routes (cand-1c · 3 detail-pages).
 *
 * Per cand-1c §11.5 + §11.1 (killed 2022-routes · only Magnifica routes ship).
 * Home (/) is intentionally NOT in the nav — the wordmark already links there.
 * Tabs follow the cand-1c §11.5.1-§11.5.3 picks.
 */

import type { TopnavParentItem } from '@/components/TopNav.vue'

export const navItems: ReadonlyArray<TopnavParentItem> = [
    { label: 'Claude', link: '/ethnography' },
    { label: 'Hans', link: '/hans-doenitz' },
    { label: 'Foucault', link: '/cultural-studies' },
]
