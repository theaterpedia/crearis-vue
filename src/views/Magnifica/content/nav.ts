/**
 * Shared navigation items for the Magnifica alt-routes (final · 3 detail-pages).
 *
 * Per final_conception.md navcards: /ethnography · /context · /discourse.
 * Home (/) is intentionally NOT in the nav — the wordmark already links there.
 * Labels per the conception's navcard semantics (ethnography · theaterpädagogik ·
 * discourse); kept short for the nav bar.
 */

import type { TopnavParentItem } from '@/components/TopNav.vue'

export const navItems: ReadonlyArray<TopnavParentItem> = [
    { label: 'Ethnography', link: '/ethnography' },
    { label: 'Theaterpädagogik', link: '/context' },
    { label: 'Discourse', link: '/discourse' },
]
