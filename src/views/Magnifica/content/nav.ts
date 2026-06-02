/**
 * Shared navigation items for the Magnifica alt-routes (vision · toolbox · verein).
 *
 * Per crearis:projects/magnifica/docs/howto-topbar.md §7.1 (hardcoded nav · the
 * 4 routes are fixed · home is intentionally NOT in the nav since the wordmark
 * already links there).
 *
 * Imported by VisionPage / ToolboxPage / VereinPage so all three render the
 * same TopNav with consistent items. LandingPage renders EntryHero instead
 * (no TopNav · per howto-password-entry §0.4).
 */

import type { TopnavParentItem } from '@/components/TopNav.vue'

export const navItems: ReadonlyArray<TopnavParentItem> = [
    { label: 'Vision', link: '/vision' },
    { label: 'Toolbox', link: '/toolbox' },
    { label: 'Verein', link: '/verein' },
]
