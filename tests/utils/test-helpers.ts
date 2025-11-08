/**
 * Test Helper Utilities
 * 
 * Common utilities for component testing
 */

import { config } from '@vue/test-utils'

/**
 * Mock CSS custom properties (CSS variables)
 * Used to provide dimensions for ImgShape components in tests
 */
export function mockCSSVariables(variables: Record<string, string>) {
  const originalGetComputedStyle = window.getComputedStyle
  
  window.getComputedStyle = function(element: Element) {
    const styles = originalGetComputedStyle.call(window, element)
    return new Proxy(styles, {
      get(target, prop) {
        if (prop === 'getPropertyValue') {
          return (name: string) => {
            if (variables[name]) {
              return variables[name]
            }
            return target.getPropertyValue(name)
          }
        }
        return target[prop as keyof CSSStyleDeclaration]
      }
    })
  } as typeof window.getComputedStyle
  
  return () => {
    window.getComputedStyle = originalGetComputedStyle
  }
}

/**
 * Standard dimension mocks for ImgShape testing
 */
export const STANDARD_DIMENSIONS = {
  // Card dimensions
  '--card-width': '21rem',           // 336px
  '--card-height': '14rem',          // 224px
  '--card-height-min': '10.5rem',    // 168px
  
  // Tile dimensions
  '--tile-width': '8rem',            // 128px
  '--tile-height': '8rem',           // 128px
  '--tile-height-square': '8rem',    // 128px
  
  // Avatar dimensions
  '--avatar-width': '4rem',          // 64px
}

/**
 * Create a wrapper with mocked CSS variables
 */
export function setupCSSVariableMocks() {
  return mockCSSVariables(STANDARD_DIMENSIONS)
}
