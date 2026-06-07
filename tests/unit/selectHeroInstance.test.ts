/**
 * Unit Tests: selectHeroInstance Function
 * 
 * Tests the Hero instance selection logic based on viewport dimensions
 * and heightTmp prop values.
 * 
 * Origin: chat/tasks/2025-12-14-heroRefactor.md
 * 
 * Instance Selection Rules:
 * - viewport ≤ 440px: hero_square (default) or hero_vertical (if prominent/full)
 * - 441-768px: hero_square
 * - 769-1100px: hero_wide
 * - 1101-1440px: hero_wide_xl
 * - >1440px: hero_wide_xl (default) or hero_square_xl (if full + height > 950)
 */

import { describe, it, expect } from 'vitest'
import { selectHeroInstance, type HeroInstance, type HeightTmp } from '@/utils/selectHeroInstance'

describe('selectHeroInstance', () => {

    // ===================================================================
    // Mobile Breakpoint (≤ 440px)
    // ===================================================================

    describe('Mobile (viewport ≤ 440px)', () => {
        it('should return hero_square for mini height', () => {
            const result = selectHeroInstance({ width: 375, height: 667 }, 'mini')
            expect(result).toBe('hero_square')
        })

        it('should return hero_square for medium height', () => {
            const result = selectHeroInstance({ width: 414, height: 896 }, 'medium')
            expect(result).toBe('hero_square')
        })

        it('should return hero_vertical for prominent height', () => {
            const result = selectHeroInstance({ width: 375, height: 667 }, 'prominent')
            expect(result).toBe('hero_vertical')
        })

        it('should return hero_vertical for full height', () => {
            const result = selectHeroInstance({ width: 440, height: 800 }, 'full')
            expect(result).toBe('hero_vertical')
        })

        it('should handle exact 440px boundary', () => {
            const result = selectHeroInstance({ width: 440, height: 800 }, 'medium')
            expect(result).toBe('hero_square')
        })
    })

    // ===================================================================
    // Tablet Breakpoint (441-768px)
    // ===================================================================

    describe('Tablet (441-768px)', () => {
        it('should return hero_square regardless of heightTmp', () => {
            expect(selectHeroInstance({ width: 600, height: 800 }, 'mini')).toBe('hero_square')
            expect(selectHeroInstance({ width: 600, height: 800 }, 'medium')).toBe('hero_square')
            expect(selectHeroInstance({ width: 600, height: 800 }, 'prominent')).toBe('hero_square')
            expect(selectHeroInstance({ width: 600, height: 800 }, 'full')).toBe('hero_square')
        })

        it('should handle 768px boundary', () => {
            const result = selectHeroInstance({ width: 768, height: 1024 }, 'full')
            expect(result).toBe('hero_square')
        })
    })

    // ===================================================================
    // Small Desktop Breakpoint (769-1100px)
    // ===================================================================

    describe('Small Desktop (769-1100px)', () => {
        it('should return hero_wide regardless of heightTmp', () => {
            expect(selectHeroInstance({ width: 900, height: 600 }, 'mini')).toBe('hero_wide')
            expect(selectHeroInstance({ width: 1024, height: 768 }, 'full')).toBe('hero_wide')
        })

        it('should handle 1100px boundary', () => {
            const result = selectHeroInstance({ width: 1100, height: 800 }, 'full')
            expect(result).toBe('hero_wide')
        })
    })

    // ===================================================================
    // Large Desktop Breakpoint (1101-1440px)
    // ===================================================================

    describe('Large Desktop (1101-1440px)', () => {
        it('should return hero_wide_xl regardless of heightTmp', () => {
            expect(selectHeroInstance({ width: 1280, height: 720 }, 'mini')).toBe('hero_wide_xl')
            expect(selectHeroInstance({ width: 1366, height: 768 }, 'full')).toBe('hero_wide_xl')
        })

        it('should handle 1440px boundary', () => {
            const result = selectHeroInstance({ width: 1440, height: 900 }, 'full')
            expect(result).toBe('hero_wide_xl')
        })
    })

    // ===================================================================
    // XL Desktop Breakpoint (> 1440px)
    // ===================================================================

    describe('XL Desktop (> 1440px)', () => {
        it('should return hero_wide_xl for non-full heights', () => {
            expect(selectHeroInstance({ width: 1920, height: 1080 }, 'mini')).toBe('hero_wide_xl')
            expect(selectHeroInstance({ width: 2560, height: 1440 }, 'medium')).toBe('hero_wide_xl')
            expect(selectHeroInstance({ width: 1920, height: 1080 }, 'prominent')).toBe('hero_wide_xl')
        })

        it('should return hero_wide_xl for full height with short viewport', () => {
            const result = selectHeroInstance({ width: 1920, height: 900 }, 'full')
            expect(result).toBe('hero_wide_xl')
        })

        it('should return hero_square_xl for full height with tall viewport (> 950px)', () => {
            const result = selectHeroInstance({ width: 1920, height: 1080 }, 'full')
            expect(result).toBe('hero_square_xl')
        })

        it('should handle 950px height boundary', () => {
            expect(selectHeroInstance({ width: 1920, height: 950 }, 'full')).toBe('hero_wide_xl')
            expect(selectHeroInstance({ width: 1920, height: 951 }, 'full')).toBe('hero_square_xl')
        })
    })

    // ===================================================================
    // Edge Cases
    // ===================================================================

    describe('Edge Cases', () => {
        it('should handle very small viewports', () => {
            const result = selectHeroInstance({ width: 320, height: 480 }, 'full')
            expect(result).toBe('hero_vertical')
        })

        it('should handle very large viewports', () => {
            const result = selectHeroInstance({ width: 3840, height: 2160 }, 'full')
            expect(result).toBe('hero_square_xl')
        })

        it('should handle ultrawide monitors (> 1440px but short height)', () => {
            const result = selectHeroInstance({ width: 3440, height: 800 }, 'full')
            expect(result).toBe('hero_wide_xl')
        })
    })
})
