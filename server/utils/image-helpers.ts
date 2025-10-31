/**
 * Image validation and utility functions
 * Provides helpers for validating formats, extracting metadata, and handling image operations
 */

/**
 * Valid file formats for images (from CHECK constraint in database)
 */
export const VALID_FILE_FORMATS = [
    'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg',
    'bmp', 'tiff', 'tif', 'ico', 'heic', 'heif', 'avif'
] as const

/**
 * Valid media formats for video/audio (from CHECK constraint in database)
 */
export const VALID_MEDIA_FORMATS = [
    'mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv', 'flv', 'wmv',
    'mp3', 'wav', 'aac', 'flac', 'm4a', 'wma', 'opus'
] as const

/**
 * Image tag bitmatrix definitions
 */
export const IMAGE_TAGS = {
    ADULT: 1,      // 2^0 = 1
    TEEN: 2,       // 2^1 = 2
    CHILD: 4,      // 2^2 = 4
    GROUP: 8,      // 2^3 = 8
    PORTRAIT: 16,  // 2^4 = 16
    DETAIL: 32,    // 2^5 = 32
    LOCATION: 64,  // 2^6 = 64
    SYSTEM: 128    // 2^7 = 128
} as const

/**
 * Image tag names for display
 */
export const IMAGE_TAG_NAMES: Record<number, string> = {
    1: 'adult',
    2: 'teen',
    4: 'child',
    8: 'group',
    16: 'portrait',
    32: 'detail',
    64: 'location',
    128: 'system'
}

/**
 * Standard rendition dimensions
 */
export const RENDITION_DIMENSIONS = {
    avatar: { width: 64, height: 64 },
    card: { width: 320, height: 180 },
    hero: { width: 1280, height: 720 }
} as const

/**
 * Validate file format
 */
export function isValidFileFormat(format: string): boolean {
    return VALID_FILE_FORMATS.includes(format.toLowerCase() as any)
}

/**
 * Validate media format
 */
export function isValidMediaFormat(format: string): boolean {
    return VALID_MEDIA_FORMATS.includes(format.toLowerCase() as any)
}

/**
 * Extract file format from URL
 */
export function extractFileFormatFromUrl(url: string): string | null {
    try {
        const urlObj = new URL(url)
        const pathname = urlObj.pathname
        const extension = pathname.split('.').pop()?.toLowerCase()

        if (extension && isValidFileFormat(extension)) {
            return extension
        }

        return null
    } catch {
        return null
    }
}

/**
 * Check if tags bitmatrix has specific tag
 */
export function hasTag(tags: number, tag: number): boolean {
    return (tags & tag) === tag
}

/**
 * Add tag to tags bitmatrix
 */
export function addTag(tags: number, tag: number): number {
    return tags | tag
}

/**
 * Remove tag from tags bitmatrix
 */
export function removeTag(tags: number, tag: number): number {
    return tags & ~tag
}

/**
 * Toggle tag in tags bitmatrix
 */
export function toggleTag(tags: number, tag: number): number {
    return tags ^ tag
}

/**
 * Get array of active tag names from bitmatrix
 */
export function getActiveTagNames(tags: number): string[] {
    const activeNames: string[] = []

    for (const [value, name] of Object.entries(IMAGE_TAG_NAMES)) {
        if (hasTag(tags, Number(value))) {
            activeNames.push(name)
        }
    }

    return activeNames
}

/**
 * Convert array of tag names to bitmatrix
 */
export function tagNamesToBits(tagNames: string[]): number {
    let bits = 0

    for (const name of tagNames) {
        const value = Object.entries(IMAGE_TAG_NAMES).find(([_, n]) => n === name)?.[0]
        if (value) {
            bits = addTag(bits, Number(value))
        }
    }

    return bits
}

/**
 * Validate crop coordinates
 * x, y should be between 0-100 (percentage)
 * z should be > 0 (zoom level, default 100)
 */
export function validateCropCoords(x?: number | null, y?: number | null, z?: number | null): boolean {
    if (x !== null && x !== undefined && (x < 0 || x > 100)) return false
    if (y !== null && y !== undefined && (y < 0 || y > 100)) return false
    if (z !== null && z !== undefined && z <= 0) return false
    return true
}

/**
 * Generate image URL with rendition parameters
 * This is a placeholder - actual implementation would depend on image service
 */
export function getImageUrl(
    baseUrl: string,
    rendition: 'avatar' | 'card' | 'hero',
    crop?: { x?: number | null, y?: number | null, z?: number | null }
): string {
    const dims = RENDITION_DIMENSIONS[rendition]
    const params = new URLSearchParams()

    params.set('w', dims.width.toString())
    params.set('h', dims.height.toString())

    if (crop?.x !== null && crop?.x !== undefined) params.set('x', crop.x.toString())
    if (crop?.y !== null && crop?.y !== undefined) params.set('y', crop.y.toString())
    if (crop?.z !== null && crop?.z !== undefined) params.set('z', crop.z.toString())

    return `${baseUrl}?${params.toString()}`
}

/**
 * Validate image metadata
 */
export function validateImageMetadata(data: {
    name?: string
    url?: string
    fileformat?: string
    mediaformat?: string | null
}): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!data.name || data.name.trim() === '') {
        errors.push('Name is required')
    }

    if (!data.url || data.url.trim() === '') {
        errors.push('URL is required')
    } else {
        try {
            new URL(data.url)
        } catch {
            errors.push('Invalid URL format')
        }
    }

    if (data.fileformat && !isValidFileFormat(data.fileformat)) {
        errors.push(`Invalid file format: ${data.fileformat}`)
    }

    if (data.mediaformat && !isValidMediaFormat(data.mediaformat)) {
        errors.push(`Invalid media format: ${data.mediaformat}`)
    }

    return {
        valid: errors.length === 0,
        errors
    }
}
