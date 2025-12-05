/**
 * Responsive Composable
 * 
 * Provides reactive breakpoint detection and mobile utilities.
 * Uses window resize observer with debouncing.
 * 
 * Breakpoints follow Opus CSS conventions (from 03-base.css):
 * - mobile: < 640px
 * - tablet: 640px - 1024px
 * - desktop: > 1024px
 * 
 * December 2025
 */

import { ref, computed, onMounted, onUnmounted, readonly } from 'vue'

/**
 * Breakpoint definitions (matches Opus CSS)
 */
const BREAKPOINTS = {
  mobile: 640,
  tablet: 1024,
  desktop: 1280,
  wide: 1536,
} as const

/**
 * Current viewport size
 */
const viewportWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1024)
const viewportHeight = ref(typeof window !== 'undefined' ? window.innerHeight : 768)

/**
 * Track if composable is initialized (SSR safety)
 */
let isInitialized = false
let resizeHandler: (() => void) | null = null

/**
 * Initialize viewport tracking (singleton)
 */
function initViewportTracking() {
  if (isInitialized || typeof window === 'undefined') return

  const handleResize = debounce(() => {
    viewportWidth.value = window.innerWidth
    viewportHeight.value = window.innerHeight
  }, 100)

  resizeHandler = handleResize
  window.addEventListener('resize', handleResize)
  isInitialized = true

  // Initial update
  viewportWidth.value = window.innerWidth
  viewportHeight.value = window.innerHeight
}

/**
 * Simple debounce utility
 */
function debounce<T extends (...args: any[]) => void>(fn: T, ms: number): T {
  let timeoutId: ReturnType<typeof setTimeout> | null = null
  return ((...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(...args), ms)
  }) as T
}

/**
 * Responsive Composable
 */
export function useResponsive() {
  // Initialize on first use
  onMounted(() => {
    initViewportTracking()
  })

  // Computed breakpoint checks
  const isMobile = computed(() => viewportWidth.value < BREAKPOINTS.mobile)
  const isTablet = computed(() => 
    viewportWidth.value >= BREAKPOINTS.mobile && viewportWidth.value < BREAKPOINTS.tablet
  )
  const isDesktop = computed(() => viewportWidth.value >= BREAKPOINTS.tablet)
  const isWide = computed(() => viewportWidth.value >= BREAKPOINTS.wide)

  // Compound checks
  const isMobileOrTablet = computed(() => viewportWidth.value < BREAKPOINTS.tablet)
  const isTabletOrDesktop = computed(() => viewportWidth.value >= BREAKPOINTS.mobile)

  // Touch device detection
  const isTouchDevice = computed(() => {
    if (typeof window === 'undefined') return false
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0
  })

  // Orientation
  const isPortrait = computed(() => viewportHeight.value > viewportWidth.value)
  const isLandscape = computed(() => viewportWidth.value >= viewportHeight.value)

  // Current breakpoint name
  const currentBreakpoint = computed<'mobile' | 'tablet' | 'desktop' | 'wide'>(() => {
    if (viewportWidth.value < BREAKPOINTS.mobile) return 'mobile'
    if (viewportWidth.value < BREAKPOINTS.tablet) return 'tablet'
    if (viewportWidth.value < BREAKPOINTS.wide) return 'desktop'
    return 'wide'
  })

  // Check if at least a certain breakpoint
  function isAtLeast(breakpoint: keyof typeof BREAKPOINTS): boolean {
    return viewportWidth.value >= BREAKPOINTS[breakpoint]
  }

  // Check if at most a certain breakpoint
  function isAtMost(breakpoint: keyof typeof BREAKPOINTS): boolean {
    return viewportWidth.value < BREAKPOINTS[breakpoint]
  }

  // Get appropriate component variant
  function getVariant<T extends string>(options: {
    mobile?: T
    tablet?: T
    desktop?: T
    wide?: T
    default: T
  }): T {
    if (isMobile.value && options.mobile) return options.mobile
    if (isTablet.value && options.tablet) return options.tablet
    if (isWide.value && options.wide) return options.wide
    if (isDesktop.value && options.desktop) return options.desktop
    return options.default
  }

  // CSS custom property helpers
  const touchTargetSize = computed(() => isTouchDevice.value ? '44px' : '32px')
  const gridColumns = computed(() => {
    if (isMobile.value) return 1
    if (isTablet.value) return 2
    if (isDesktop.value) return 3
    return 4
  })

  return {
    // Viewport
    viewportWidth: readonly(viewportWidth),
    viewportHeight: readonly(viewportHeight),

    // Breakpoint checks
    isMobile,
    isTablet,
    isDesktop,
    isWide,
    isMobileOrTablet,
    isTabletOrDesktop,
    currentBreakpoint,

    // Device checks
    isTouchDevice,
    isPortrait,
    isLandscape,

    // Utilities
    isAtLeast,
    isAtMost,
    getVariant,

    // CSS helpers
    touchTargetSize,
    gridColumns,

    // Constants
    BREAKPOINTS,
  }
}

/**
 * Media query composable for custom breakpoints
 */
export function useMediaQuery(query: string) {
  const matches = ref(false)

  onMounted(() => {
    if (typeof window === 'undefined') return

    const mediaQuery = window.matchMedia(query)
    matches.value = mediaQuery.matches

    const handler = (e: MediaQueryListEvent) => {
      matches.value = e.matches
    }

    mediaQuery.addEventListener('change', handler)
    onUnmounted(() => {
      mediaQuery.removeEventListener('change', handler)
    })
  })

  return readonly(matches)
}

/**
 * Preferred color scheme detection
 */
export function usePreferredColorScheme() {
  const isDark = useMediaQuery('(prefers-color-scheme: dark)')
  const isLight = computed(() => !isDark.value)

  return {
    isDark,
    isLight,
    scheme: computed(() => isDark.value ? 'dark' : 'light')
  }
}

/**
 * Reduced motion preference
 */
export function useReducedMotion() {
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  
  return {
    prefersReducedMotion,
    // Helper to get appropriate animation duration
    getAnimationDuration: (normalMs: number) =>
      prefersReducedMotion.value ? 0 : normalMs
  }
}
