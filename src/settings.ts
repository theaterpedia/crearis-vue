import type { TopnavParentItem } from './components/TopNav.vue'
import type { ToggleOption } from './components/ToggleMenu.vue'

/**
 * UI Package Settings
 * 
 * This file contains all configurable settings for the UI components.
 * Import and customize these settings in your application.
 */

// ============================================================================
// PAGE SETTINGS
// ============================================================================

export const pageSettings = {
  // Organization Identity
  claim: 'neuartige Vernetzung Theaterpädagogik',

  // SEO Meta Tags (aligned with PROJECT_SEO_CONFIGURATION.md naming)
  seo_title: 'Theaterpedia Netzwerk für Theaterpädagogik',
  seo_description: 'Theaterpedia - werde Teil einer neuen Bewegung! Vernetzung, Austausch und Weiterbildung für Theaterpädagog*innen im deutschsprachigen Raum.',
  seo_keywords: 'Theaterpädagogik, Vernetzung, Veranstaltungen, Theatervermittlung, Performance, kreative Gemeinschaft, Weiterbildung, Theater',
  seo_image: 'https://www.theaterpedia.org/images/og-theaterpedia-network.jpg',
  og_title: 'Theaterpedia - Netzwerk für Theaterpädagogik',
  og_description: 'Werde Teil einer neuen Bewegung! Vernetzung, Austausch und Weiterbildung für Theaterpädagog*innen.',
  twitter_card: 'summary_large_image' as const,

  // Layout options
  showAside: true,
  showBottom: true,
  alertBanner: {
    message: 'ACHTUNG! Theaterpedia befindet sich bis JAN 2026 in der Alpha-Phase: Fehler in Design und Typografie sind erwartbar, bitte Geduld bei fehlendem Inhalt.',
    alertType: 'warning' as const,
  },
}// ============================================================================
// LAYOUT SETTINGS
// ============================================================================

export type SiteLayout = 'default' | 'sidebar' | 'fullSidebar' | 'fullTwo' | 'fullThree'

export const layoutSettings = {
  /**
   * Site Layout Options:
   * - 'default': Boxed layout with optional right sidebar (current implementation)
   * - 'sidebar': Reserved for future - boxed layout with different sidebar behavior
   * - 'fullSidebar': Reserved for future - full-width with different sidebar behavior
   * - 'fullTwo': Full-width 2-column layout (main + right sidebar)
   * - 'fullThree': Full-width 3-column layout (left sidebar + main + right sidebar)
   */
  siteLayout: 'default' as SiteLayout,

  // Base Layout Props
  baseWideHeader: false,
  baseWideTopnav: true,
  baseWideContent: false,
  baseBottomWide: true,
  baseFooterWide: true,
  fullwidthPadding: true, // Controls padding in fullwidth layouts

  // Background color
  backgroundColor: 'default' as 'default' | 'primary' | 'secondary' | 'muted' | 'accent' | 'positive' | 'negative' | 'warning',
}

// ============================================================================
// NAVBAR SETTINGS
// ============================================================================

export const navbarSettings = {
  scrollStyle: 'overlay_reappear' as 'simple' | 'overlay' | 'overlay_reappear',
  navbarSticky: false, // If true, navbar stays fixed at top
  navbarReappear: true, // If true, navbar reappears when scrolling up
}

// ============================================================================
// NAVIGATION MENU ITEMS
// ============================================================================

export const mainMenuItems: TopnavParentItem[] = [
  {
    label: 'Ausbildung Theaterpädagogik',
    children: [
      { label: 'Einstiege ins Theaterspiel', link: '/heroes' },
      { label: 'Grundlagen Theaterpädagogik (BuT)', link: '#' },
      { label: 'Profil Performance & Interkulturelles Theater', link: '#' },
      {
        label: 'Aufbaustufe Theaterpädagogogik',
        children: [
          { label: 'Professionalisierung', link: '#' },
          { label: 'Spezialisierung', link: '#' },
        ],
      },
    ],
  },
  {
    label: 'Team & Institut',
    children: [
      { label: 'Über uns', link: '#' },
      { label: 'Team', link: '#' },
      { label: 'Kontakt', link: '#' },
    ],
  },
  {
    label: 'Aktuelles',
    link: '#',
  },
]

// ============================================================================
// LAYOUT TOGGLE OPTIONS
// ============================================================================

export const layoutToggleOptions: ToggleOption[] = [
  {
    text: '**Default** Boxed layout with right sidebar',
    state: 'default',
    icon: {
      template: '<svg fill="currentColor" height="20" viewBox="0 0 256 256" width="20" xmlns="http://www.w3.org/2000/svg"><path d="M216,40H40A16,16,0,0,0,24,56V200a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A16,16,0,0,0,216,40ZM40,56H96V200H40ZM216,200H112V56H216V200Z"></path></svg>',
    },
  },
  {
    text: '**Sidebar** Alternative sidebar layout (coming soon)',
    state: 'sidebar',
    icon: {
      template: '<svg fill="currentColor" height="20" viewBox="0 0 256 256" width="20" xmlns="http://www.w3.org/2000/svg"><path d="M216,40H40A16,16,0,0,0,24,56V200a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A16,16,0,0,0,216,40ZM40,56H80V200H40ZM216,200H96V56H216V200Z"></path></svg>',
    },
  },
  {
    text: '**Full Sidebar** Full-width with sidebar (coming soon)',
    state: 'fullSidebar',
    icon: {
      template: '<svg fill="currentColor" height="20" viewBox="0 0 256 256" width="20" xmlns="http://www.w3.org/2000/svg"><path d="M224,48H32a8,8,0,0,0-8,8V200a8,8,0,0,0,8,8H224a8,8,0,0,0,8-8V56A8,8,0,0,0,224,48ZM40,64H88V192H40ZM216,192H104V64H216Z"></path></svg>',
    },
  },
  {
    text: '**Full Two** Full-width 2-column layout',
    state: 'fullTwo',
    icon: {
      template: '<svg fill="currentColor" height="20" viewBox="0 0 256 256" width="20" xmlns="http://www.w3.org/2000/svg"><path d="M224,48H32a8,8,0,0,0-8,8V200a8,8,0,0,0,8,8H224a8,8,0,0,0,8-8V56A8,8,0,0,0,224,48ZM40,192V64H144V192Zm176,0H160V64h56Z"></path></svg>',
    },
  },
  {
    text: '**Full Three** Full-width 3-column layout',
    state: 'fullThree',
    icon: {
      template: '<svg fill="currentColor" height="20" viewBox="0 0 256 256" width="20" xmlns="http://www.w3.org/2000/svg"><path d="M224,48H32a8,8,0,0,0-8,8V200a8,8,0,0,0,8,8H224a8,8,0,0,0,8-8V56A8,8,0,0,0,224,48ZM40,192V64H88V192Zm64,0V64h48V192Zm112,0H168V64h48Z"></path></svg>',
    },
  },
]

// ============================================================================
// RESPONSIVE SETTINGS
// ============================================================================

/**
 * Responsive Settings
 * 
 * These settings control responsive behavior across the application.
 * The mobileFontSizeScale is applied globally via CSS (see src/assets/css/03-base.css)
 * and automatically scales all rem-based font sizes on mobile devices.
 * 
 * Example: With mobileFontSizeScale: 0.8
 * - A component with font-size: 1rem becomes 0.8rem on mobile
 * - A component with font-size: 1.5rem becomes 1.2rem on mobile
 * 
 * This provides consistent font size reduction across all views
 * (TaskDashboard, BaseView, DemoView, etc.) without modifying individual components.
 */
export const responsiveSettings = {
  // Mobile font size reduction (0.85 = 85% of base font size, approx 15% reduction)
  mobileFontSizeScale: 0.85,
  // Breakpoint for mobile styles (px)
  mobileBreakpoint: 768,
}

// ============================================================================
// NAVIGATION ROUTES
// ============================================================================

export interface NavRoute {
  path: string
  name: string
  protected?: boolean
  requiresAuth?: boolean
  requiresRole?: string | string[]
}

export const defaultNavRoutes: NavRoute[] = [
  {
    path: '/',
    name: 'Home',
    protected: false,
  },
  {
    path: '/tasks',
    name: 'Tasks',
    protected: true,
    requiresAuth: true,
  },
  {
    path: '/base',
    name: 'Base',
    protected: true,
    requiresAuth: true,
  },
  {
    path: '/demo',
    name: 'Demo',
    protected: false,
  }
]
