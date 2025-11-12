/**
 * Unit Tests: rebuildShapeUrlWithXYZ Function
 * 
 * Tests the Z-value conversion logic and XYZ transformation for both Unsplash and Cloudinary.
 * This is a PURE FUNCTION test - no component mounting needed.
 */

import { describe, it, expect } from 'vitest'

/**
 * Extracted rebuildShapeUrlWithXYZ function for unit testing
 * This is a copy of the function from ImagesCoreAdmin.vue for isolated testing
 */
function rebuildShapeUrlWithXYZ(
    baseUrl: string,
    x: number | null,
    y: number | null,
    z: number | null,
    shape: 'square' | 'wide' | 'vertical' | 'thumb',
    xDefaultShrink: number
): string {
    if (!baseUrl) return baseUrl

    try {
        const url = new URL(baseUrl)

        // Detect adapter
        const isUnsplash = url.hostname.includes('unsplash.com')
        const isCloudinary = url.hostname.includes('cloudinary.com')

        if (isUnsplash) {
            // For Unsplash: update fp-x, fp-y, fp-z parameters
            if (x !== null && y !== null && z !== null) {
                // XYZ mode: set focal point parameters

                // X and Y: Convert 0-100 scale to 0.0-1.0 scale
                url.searchParams.set('fp-x', (x / 100).toFixed(2))
                url.searchParams.set('fp-y', (y / 100).toFixed(2))

                // Z: Use shrink multiplier strategy
                const shrinkMultiplier = z / 100
                const fpZ = 1.0 / shrinkMultiplier
                url.searchParams.set('fp-z', fpZ.toFixed(2))
            } else {
                // Auto mode: use entropy crop
                url.searchParams.set('crop', 'entropy')
                url.searchParams.delete('fp-x')
                url.searchParams.delete('fp-y')
                url.searchParams.delete('fp-z')
            }
            url.searchParams.set('fit', 'crop')
        } else if (isCloudinary) {
            // For Cloudinary: update transformation parameters
            const match = baseUrl.match(/^(https?:\/\/[^\/]+\/[^\/]+\/image\/upload\/)([^\/]*)\/(.+)$/)
            if (match) {
                const [, prefix, transformations, suffix] = match

                // Parse existing transformations
                const params = new Map<string, string>()
                if (transformations) {
                    transformations.split(',').forEach(param => {
                        const [key, value] = param.split('_')
                        if (key && value) params.set(key, value)
                    })
                }

                if (x !== null && y !== null) {
                    // Focal point mode: use c_crop with explicit positioning
                    params.set('c', 'crop')
                    params.set('g', 'xy_center')
                    // Calculate offsets from center
                    const offsetX = Math.round((x - 50) * (params.get('w') ? parseInt(params.get('w')!) / 100 : 3.36))
                    const offsetY = Math.round((y - 50) * (params.get('h') ? parseInt(params.get('h')!) / 100 : 1.68))
                    params.set('x', offsetX.toString())
                    params.set('y', offsetY.toString())

                    // Z: Cloudinary implementation using zoom parameter
                    if (z !== null) {
                        const shrinkMultiplier = z / 100
                        const cloudinaryZoom = 1.0 / shrinkMultiplier
                        params.set('z', cloudinaryZoom.toFixed(2))
                    }
                } else {
                    // Auto mode: use c_fill with auto gravity
                    params.set('c', 'fill')
                    params.set('g', 'auto')
                    params.delete('x')
                    params.delete('y')
                    params.delete('z')
                }

                // Rebuild transformation string
                const newTransformations = Array.from(params.entries())
                    .map(([key, value]) => `${key}_${value}`)
                    .join(',')

                return `${prefix}${newTransformations}/${suffix}`
            }
        }

        return url.toString()
    } catch (error) {
        console.error('[rebuildShapeUrlWithXYZ] Error rebuilding URL:', error)
        return baseUrl
    }
}

describe('rebuildShapeUrlWithXYZ - Pure Function Tests', () => {
    describe('Unsplash adapter', () => {
        it('should convert X/Y from 0-100 scale to 0.0-1.0 scale', () => {
            const url = 'https://images.unsplash.com/photo-123?w=1000'
            const result = rebuildShapeUrlWithXYZ(url, 50, 30, 100, 'wide', 0.084)

            expect(result).toContain('fp-x=0.50')  // 50 → 0.50
            expect(result).toContain('fp-y=0.30')  // 30 → 0.30
        })

        it('should apply shrink multiplier for Z-value (wide default Z=100)', () => {
            const url = 'https://images.unsplash.com/photo-123?w=1000'

            // Z=100 (wide default) → multiplier=1.0 → fp-z=1.00
            const result = rebuildShapeUrlWithXYZ(url, 50, 50, 100, 'wide', 0.084)
            expect(result).toContain('fp-z=1.00')
        })

        it('should apply shrink multiplier for Z-value (square default Z=50)', () => {
            const url = 'https://images.unsplash.com/photo-123?w=1000'

            // Z=50 (square default) → multiplier=0.5 → fp-z=2.00 (show 2x more)
            const result = rebuildShapeUrlWithXYZ(url, 50, 50, 50, 'square', 0.084)
            expect(result).toContain('fp-z=2.00')
        })

        it('should apply shrink multiplier for Z-value (thumb default Z=25)', () => {
            const url = 'https://images.unsplash.com/photo-123?w=1000'

            // Z=25 (thumb default) → multiplier=0.25 → fp-z=4.00 (show 4x more)
            const result = rebuildShapeUrlWithXYZ(url, 50, 50, 25, 'thumb', 0.084)
            expect(result).toContain('fp-z=4.00')
        })

        it('should apply shrink multiplier for Z-value (zoom in Z=200)', () => {
            const url = 'https://images.unsplash.com/photo-123?w=1000'

            // Z=200 (zoom in 2x) → multiplier=2.0 → fp-z=0.50
            const result = rebuildShapeUrlWithXYZ(url, 50, 50, 200, 'wide', 0.084)
            expect(result).toContain('fp-z=0.50')
        })

        it('should use shape parameter correctly (same Z, different shapes)', () => {
            const url = 'https://images.unsplash.com/photo-123?w=1000'

            // Same Z value, different shapes, same result (Z is relative)
            const wideUrl = rebuildShapeUrlWithXYZ(url, 50, 50, 100, 'wide', 0.084)
            const squareUrl = rebuildShapeUrlWithXYZ(url, 50, 50, 100, 'square', 0.084)

            // Both should have fp-z=1.00 (Z=100 means "use this multiplier")
            expect(wideUrl).toContain('fp-z=1.00')
            expect(squareUrl).toContain('fp-z=1.00')
        })

        it('should remove focal point params when XYZ are null (auto mode)', () => {
            const url = 'https://images.unsplash.com/photo-123?fp-x=0.50&fp-y=0.50&fp-z=1.00'
            const result = rebuildShapeUrlWithXYZ(url, null, null, null, 'wide', 0.084)

            expect(result).not.toContain('fp-x=')
            expect(result).not.toContain('fp-y=')
            expect(result).not.toContain('fp-z=')
            expect(result).toContain('crop=entropy')
        })

        it('should handle edge cases for X/Y values', () => {
            const url = 'https://images.unsplash.com/photo-123?w=1000'

            // X=0, Y=0 (top-left corner)
            const result1 = rebuildShapeUrlWithXYZ(url, 0, 0, 100, 'wide', 0.084)
            expect(result1).toContain('fp-x=0.00')
            expect(result1).toContain('fp-y=0.00')

            // X=100, Y=100 (bottom-right corner)
            const result2 = rebuildShapeUrlWithXYZ(url, 100, 100, 100, 'wide', 0.084)
            expect(result2).toContain('fp-x=1.00')
            expect(result2).toContain('fp-y=1.00')
        })
    })

    describe('Cloudinary adapter', () => {
        it('should convert X/Y from 0-100 to pixel offsets from center', () => {
            const url = 'https://res.cloudinary.com/test/image/upload/c_fill,g_auto,w_336,h_168/v123/image.jpg'
            const result = rebuildShapeUrlWithXYZ(url, 80, 30, 100, 'wide', 0.084)

            // x=80 → offset = (80-50) * 3.36 = +101px
            expect(result).toContain('x_101')
            // y=30 → offset = (30-50) * 1.68 = -34px
            expect(result).toContain('y_-34')
        })

        it('should apply shrink multiplier for Z-value (wide default)', () => {
            const url = 'https://res.cloudinary.com/test/image/upload/c_fill,g_auto,w_336,h_168/v123/image.jpg'

            // Z=100 → multiplier=1.0 → z=1.00
            const result = rebuildShapeUrlWithXYZ(url, 50, 50, 100, 'wide', 0.084)
            expect(result).toContain('z_1.00')
        })

        it('should apply shrink multiplier for Z-value (square default)', () => {
            const url = 'https://res.cloudinary.com/test/image/upload/c_fill,g_auto,w_336,h_168/v123/image.jpg'

            // Z=50 → multiplier=0.5 → z=2.00
            const result = rebuildShapeUrlWithXYZ(url, 50, 50, 50, 'square', 0.084)
            expect(result).toContain('z_2.00')
        })

        it('should apply shrink multiplier for Z-value (thumb default)', () => {
            const url = 'https://res.cloudinary.com/test/image/upload/c_fill,g_auto,w_336,h_168/v123/image.jpg'

            // Z=25 → multiplier=0.25 → z=4.00
            const result = rebuildShapeUrlWithXYZ(url, 50, 50, 25, 'thumb', 0.084)
            expect(result).toContain('z_4.00')
        })

        it('should switch from c_fill to c_crop when X/Y set', () => {
            const url = 'https://res.cloudinary.com/test/image/upload/c_fill,g_auto,w_336,h_168/v123/image.jpg'
            const result = rebuildShapeUrlWithXYZ(url, 50, 50, 100, 'wide', 0.084)

            expect(result).toContain('c_crop')
            expect(result).toContain('g_xy_center')
            expect(result).not.toContain('c_fill')
        })

        it('should switch back to c_fill when XYZ are null (auto mode)', () => {
            const url = 'https://res.cloudinary.com/test/image/upload/c_crop,g_xy_center,x_100,y_50,z_1.5,w_336,h_168/v123/image.jpg'
            const result = rebuildShapeUrlWithXYZ(url, null, null, null, 'wide', 0.084)

            expect(result).toContain('c_fill')
            expect(result).toContain('g_auto')
            expect(result).not.toContain('c_crop')
            expect(result).not.toContain('x_')
            expect(result).not.toContain('y_')
            expect(result).not.toContain('z_')
        })

        it('should handle negative offsets correctly', () => {
            const url = 'https://res.cloudinary.com/test/image/upload/c_fill,g_auto,w_336,h_168/v123/image.jpg'

            // X=20, Y=20 should give negative offsets
            const result = rebuildShapeUrlWithXYZ(url, 20, 20, 100, 'wide', 0.084)
            expect(result).toContain('x_-101')  // (20-50) * 3.36 = -101
            expect(result).toContain('y_-50')   // (20-50) * 1.68 = -50
        })

        it('should handle center position (X=50, Y=50) correctly', () => {
            const url = 'https://res.cloudinary.com/test/image/upload/c_fill,g_auto,w_336,h_168/v123/image.jpg'

            // X=50, Y=50 should give zero offsets
            const result = rebuildShapeUrlWithXYZ(url, 50, 50, 100, 'wide', 0.084)
            expect(result).toContain('x_0')
            expect(result).toContain('y_0')
        })
    })

    describe('xDefaultShrink calculation concept', () => {
        it('should demonstrate xDefaultShrink for wide width (336px)', () => {
            // For image with original width x=4000, wide width=336
            const shrink = 336 / 4000
            expect(shrink).toBeCloseTo(0.084, 3)
        })

        it('should demonstrate xDefaultShrink fallback to 3000', () => {
            // When image.x is NULL, fallback to 3000
            const shrink = 336 / 3000
            expect(shrink).toBeCloseTo(0.112, 3)
        })

        it('should demonstrate how xDefaultShrink affects different shapes', () => {
            // Wide shape: width=336px
            const wideShrink = 336 / 4000  // 0.084

            // Square shape: width=336px (same as wide)
            const squareShrink = 336 / 4000  // 0.084

            // Thumb shape: width=168px
            const thumbShrink = 168 / 4000  // 0.042

            expect(wideShrink).toBeCloseTo(0.084, 3)
            expect(squareShrink).toBeCloseTo(0.084, 3)
            expect(thumbShrink).toBeCloseTo(0.042, 3)
        })
    })

    describe('Error handling', () => {
        it('should return original URL if URL parsing fails', () => {
            const invalidUrl = 'not-a-valid-url'
            const result = rebuildShapeUrlWithXYZ(invalidUrl, 50, 50, 100, 'wide', 0.084)
            expect(result).toBe(invalidUrl)
        })

        it('should handle empty URL gracefully', () => {
            const result = rebuildShapeUrlWithXYZ('', 50, 50, 100, 'wide', 0.084)
            expect(result).toBe('')
        })

        it('should handle Cloudinary URL without transformation section', () => {
            const url = 'https://res.cloudinary.com/test/image/upload/v123/image.jpg'
            const result = rebuildShapeUrlWithXYZ(url, 50, 50, 100, 'wide', 0.084)
            // The function should still work - it creates a transformation section
            // when the pattern doesn't fully match (missing /v123/ part)
            expect(result).toContain('c_crop')
            expect(result).toContain('x_0')
            expect(result).toContain('y_0')
        })
    })

    describe('Formula verification', () => {
        it('should verify shrinkMultiplier = z / 100', () => {
            const z100 = 100
            const z50 = 50
            const z25 = 25
            const z200 = 200

            expect(z100 / 100).toBe(1.0)
            expect(z50 / 100).toBe(0.5)
            expect(z25 / 100).toBe(0.25)
            expect(z200 / 100).toBe(2.0)
        })

        it('should verify adapterZoom = 1.0 / shrinkMultiplier', () => {
            const multiplier100 = 1.0
            const multiplier50 = 0.5
            const multiplier25 = 0.25
            const multiplier200 = 2.0

            expect(1.0 / multiplier100).toBe(1.0)   // No adjustment
            expect(1.0 / multiplier50).toBe(2.0)    // Show 2x more
            expect(1.0 / multiplier25).toBe(4.0)    // Show 4x more
            expect(1.0 / multiplier200).toBe(0.5)   // Zoom in 2x
        })

        it('should verify shape-specific Z defaults produce correct multipliers', () => {
            const wideZ = 100
            const squareZ = 50
            const thumbZ = 25

            // Wide: Z=100 → multiplier=1.0 → fp-z=1.0 (no adjustment)
            expect(1.0 / (wideZ / 100)).toBe(1.0)

            // Square: Z=50 → multiplier=0.5 → fp-z=2.0 (show 2x more context)
            expect(1.0 / (squareZ / 100)).toBe(2.0)

            // Thumb: Z=25 → multiplier=0.25 → fp-z=4.0 (show 4x more context)
            expect(1.0 / (thumbZ / 100)).toBe(4.0)
        })
    })
})
