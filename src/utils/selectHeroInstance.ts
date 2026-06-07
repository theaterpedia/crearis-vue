/**
 * Hero Instance Selection Utility
 * 
 * Selects the optimal hero shape instance based on viewport dimensions
 * and hero height configuration.
 * 
 * Instance Dimensions:
 * - hero_vertical:  440 × 880   (mobile portrait)
 * - hero_square:    440 × 440   (mobile/tablet)
 * - hero_wide:      1100 × 620  (small desktop)
 * - hero_wide_xl:   1440 × 820  (large desktop)
 * - hero_square_xl: 1440 × 1280 (XL cover heroes)
 * 
 * @see chat/tasks/2025-12-14-heroRefactor.md Section 3.3
 */

export type HeroInstance =
    | 'hero_vertical'   // 440×880 - Mobile portrait
    | 'hero_square'     // 440×440 - Mobile/tablet
    | 'hero_wide'       // 1100×620 - Small desktop
    | 'hero_wide_xl'    // 1440×820 - Large desktop
    | 'hero_square_xl'  // 1440×1280 - XL cover heroes

export type HeightTmp = 'full' | 'prominent' | 'medium' | 'mini'

export interface Viewport {
    width: number
    height: number
}

/**
 * Instance dimension specifications
 */
export const HERO_INSTANCE_DIMENSIONS: Record<HeroInstance, { width: number; height: number }> = {
    hero_vertical: { width: 440, height: 880 },
    hero_square: { width: 440, height: 440 },
    hero_wide: { width: 1100, height: 620 },
    hero_wide_xl: { width: 1440, height: 820 },
    hero_square_xl: { width: 1440, height: 1280 }
}

/**
 * Breakpoint constants (in pixels)
 */
export const HERO_BREAKPOINTS = {
    MOBILE_MAX: 440,
    TABLET_MAX: 768,
    SMALL_DESKTOP_MAX: 1100,
    LARGE_DESKTOP_MAX: 1440,
    TALL_VIEWPORT_MIN: 950
} as const

/**
 * Select the optimal hero instance based on viewport and height configuration.
 * 
 * Selection Logic:
 * 
 * | Viewport          | Default           | prominent/full          |
 * |-------------------|-------------------|-------------------------|
 * | ≤ 440px          | hero_square       | hero_vertical           |
 * | 441-768px        | hero_square       | hero_square             |
 * | 769-1100px       | hero_wide         | hero_wide               |
 * | 1101-1440px      | hero_wide_xl      | hero_wide_xl            |
 * | >1440px          | hero_wide_xl      | hero_square_xl*         |
 * 
 * *Only when heightTmp='full' AND viewport.height > 950px
 * 
 * @param viewport - Current viewport dimensions
 * @param heightTmp - Hero height configuration
 * @returns The optimal hero instance name
 */
export function selectHeroInstance(
    viewport: Viewport,
    heightTmp: HeightTmp = 'prominent'
): HeroInstance {
    const { width, height } = viewport
    const isFullOrProminent = heightTmp === 'prominent' || heightTmp === 'full'

    // Mobile: ≤ 440px
    if (width <= HERO_BREAKPOINTS.MOBILE_MAX) {
        // Use vertical for prominent/full (cover) heroes on mobile
        return isFullOrProminent ? 'hero_vertical' : 'hero_square'
    }

    // Tablet: 441-768px
    if (width <= HERO_BREAKPOINTS.TABLET_MAX) {
        return 'hero_square'
    }

    // Small desktop: 769-1100px
    if (width <= HERO_BREAKPOINTS.SMALL_DESKTOP_MAX) {
        return 'hero_wide'
    }

    // Large desktop: 1101-1440px
    if (width <= HERO_BREAKPOINTS.LARGE_DESKTOP_MAX) {
        return 'hero_wide_xl'
    }

    // Extra large: > 1440px
    // Use square_xl for full-cover heroes on tall screens
    if (heightTmp === 'full' && height > HERO_BREAKPOINTS.TALL_VIEWPORT_MIN) {
        return 'hero_square_xl'
    }

    return 'hero_wide_xl'
}

/**
 * Get dimensions for a hero instance
 */
export function getHeroInstanceDimensions(instance: HeroInstance): { width: number; height: number } {
    return HERO_INSTANCE_DIMENSIONS[instance]
}

/**
 * Get the template shape that a hero instance is derived from
 */
export function getHeroInstanceTemplate(instance: HeroInstance): 'square' | 'wide' | 'vertical' {
    switch (instance) {
        case 'hero_vertical':
            return 'vertical'
        case 'hero_square':
        case 'hero_square_xl':
            return 'square'
        case 'hero_wide':
        case 'hero_wide_xl':
            return 'wide'
    }
}

export default selectHeroInstance
