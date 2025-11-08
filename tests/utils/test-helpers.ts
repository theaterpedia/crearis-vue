/**
 * Test Helper Utilities
 * 
 * Common utilities for component testing
 */

import { VueWrapper } from '@vue/test-utils'
import { ref, computed } from 'vue'

/**
 * Standard dimension values for ImgShape testing (in pixels)
 */
export const STANDARD_DIMENSIONS = {
  // Card dimensions
  '--card-width': '336px',           // 21rem
  '--card-height': '224px',          // 14rem
  '--card-height-min': '168px',      // 10.5rem
  
  // Tile dimensions
  '--tile-width': '128px',           // 8rem
  '--tile-height': '128px',          // 8rem
  '--tile-height-square': '128px',   // 8rem
  
  // Avatar dimensions
  '--avatar-width': '64px',          // 4rem
}

/**
 * Mock CSS custom properties by injecting them into document
 * This approach works better with Vue component internals
 */
export function mockCSSVariables(variables: Record<string, string>) {
  // Create a style element with CSS variables
  const style = document.createElement('style')
  const cssVars = Object.entries(variables)
    .map(([key, value]) => `${key}: ${value};`)
    .join('\n  ')
  
  style.textContent = `
    :root {
      ${cssVars}
    }
    * {
      ${cssVars}
    }
    body {
      ${cssVars}
    }
  `
  
  document.head.appendChild(style)
  
  // Force a reflow
  document.body.offsetHeight
  
  // Return cleanup function
  return () => {
    document.head.removeChild(style)
  }
}

/**
 * Set inline styles on wrapper element to provide dimensions
 * This is the most reliable approach for component testing
 */
export function setWrapperDimensions(wrapper: VueWrapper, dimensions: Record<string, string>) {
  const element = wrapper.element as HTMLElement
  Object.entries(dimensions).forEach(([key, value]) => {
    element.style.setProperty(key, value)
  })
}

/**
 * Mock the useTheme composable with test dimensions
 * This ensures components get valid dimensions immediately
 */
export function mockUseTheme() {
  // Return the current theme dims (allow tests to mutate via setMockThemeDimensions)
  return {
    cardWidth: ref(THEME_DIMS.cardWidth),
    cardHeight: ref(THEME_DIMS.cardHeight),
    tileWidth: ref(THEME_DIMS.tileWidth),
    tileHeight: ref(THEME_DIMS.tileHeight),
    avatarWidth: ref(THEME_DIMS.avatarWidth),
    imageDimensions: computed(() => ({
      cardWidth: THEME_DIMS.cardWidth,
      cardHeight: THEME_DIMS.cardHeight,
      cardHeightMin: THEME_DIMS.cardHeightMin,
      tileWidth: THEME_DIMS.tileWidth,
      tileHeight: THEME_DIMS.tileHeight,
      tileHeightSquare: THEME_DIMS.tileHeightSquare,
      avatarWidth: THEME_DIMS.avatarWidth
    }))
  }
}

// Internal mutable theme dims used by mockUseTheme
const THEME_DIMS: {
  cardWidth: number
  cardHeight: number
  cardHeightMin: number
  tileWidth: number
  tileHeight: number
  tileHeightSquare: number
  avatarWidth: number
} = {
  cardWidth: 336,
  cardHeight: 224,
  cardHeightMin: 168,
  tileWidth: 128,
  tileHeight: 128,
  tileHeightSquare: 128,
  avatarWidth: 64
}

/**
 * Tests can call this to change the mocked theme dimensions used by mockUseTheme.
 * Pass null/0 values to simulate missing/invalid dimensions.
 */
export function setMockThemeDimensions(dims: Partial<typeof THEME_DIMS>) {
  Object.assign(THEME_DIMS, dims)
}

export function resetMockThemeDimensions() {
  THEME_DIMS.cardWidth = 336
  THEME_DIMS.cardHeight = 224
  THEME_DIMS.cardHeightMin = 168
  THEME_DIMS.tileWidth = 128
  THEME_DIMS.tileHeight = 128
  THEME_DIMS.tileHeightSquare = 128
  THEME_DIMS.avatarWidth = 64
}

/**
 * Create a wrapper with mocked CSS variables
 */
export function setupCSSVariableMocks() {
  return mockCSSVariables(STANDARD_DIMENSIONS)
}
