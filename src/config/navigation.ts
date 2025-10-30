/**
 * Public navigation configuration for TopNav
 * Automatically generates navigation items for public routes
 */

export interface NavItem {
    label: string
    link: string
}

/**
 * Public navigation items for the main TopNav
 * These routes are automatically available across public pages
 */
export const publicNavItems: NavItem[] = [
    { label: 'Home', link: '/' },
    { label: 'Start', link: '/start' },
    { label: 'Team', link: '/team' },
    { label: 'Blog', link: '/blog' },
]

/**
 * Get navigation items for TopNav
 * Can be extended to filter based on current route or user permissions
 */
export function getPublicNavItems(): NavItem[] {
    return publicNavItems
}
