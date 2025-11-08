/**
 * Unsplash Adapter
 * 
 * Handles image imports from Unsplash.
 * Fetches metadata from Unsplash API and transforms it for our database.
 */

import { BaseMediaAdapter } from './base-adapter'
import type { MediaMetadata, UnsplashPhoto, ImageImportBatch } from '../types/adapters'

export class UnsplashAdapter extends BaseMediaAdapter {
    readonly type = 'unsplash' as const

    private readonly API_BASE = 'https://api.unsplash.com'
    private readonly accessKey: string

    constructor() {
        super()
        this.accessKey = process.env.UNSPLASH_ACCESS_KEY || ''

        if (!this.accessKey) {
            console.warn('UNSPLASH_ACCESS_KEY not set in environment variables')
        }
    }

    /**
     * Check if URL is from Unsplash
     */
    canHandle(url: string): boolean {
        try {
            const urlObj = new URL(url)
            return urlObj.hostname.includes('unsplash.com') ||
                urlObj.hostname.includes('images.unsplash.com')
        } catch {
            return false
        }
    }

    /**
     * Extract Unsplash photo ID from URL
     * Examples:
     * - https://unsplash.com/photos/abc123
     * - https://images.unsplash.com/photo-123456789
     */
    private extractPhotoId(url: string): string | null {
        try {
            const urlObj = new URL(url)

            // Handle unsplash.com/photos/ID format
            if (urlObj.hostname.includes('unsplash.com') && urlObj.pathname.includes('/photos/')) {
                const match = urlObj.pathname.match(/\/photos\/([^/?]+)/)
                return match ? match[1] : null
            }

            // Handle images.unsplash.com/photo-ID format
            if (urlObj.hostname.includes('images.unsplash.com')) {
                const match = urlObj.pathname.match(/\/photo-([a-zA-Z0-9_-]+)/)
                return match ? match[1] : null
            }

            // Try to extract from query params
            const photoId = urlObj.searchParams.get('photo')
            if (photoId) return photoId

            return null
        } catch {
            return null
        }
    }

    /**
     * Fetch photo metadata from Unsplash API
     */
    async fetchMetadata(url: string, batchData?: ImageImportBatch): Promise<MediaMetadata> {
        const photoId = this.extractPhotoId(url)

        if (!photoId) {
            throw new Error(`Could not extract Unsplash photo ID from URL: ${url}`)
        }

        if (!this.accessKey) {
            throw new Error('UNSPLASH_ACCESS_KEY not configured')
        }

        // Fetch from Unsplash API using client_id query parameter
        const apiUrl = `${this.API_BASE}/photos/${photoId}?client_id=${this.accessKey}`
        const response = await fetch(apiUrl, {
            headers: {
                'Accept-Version': 'v1'
            }
        })

        if (!response.ok) {
            throw new Error(`Unsplash API error: ${response.status} ${response.statusText}`)
        }

        const photo: UnsplashPhoto = await response.json()

        // Transform to our metadata format
        return this.transformMetadata(photo)
    }

    /**
     * Transform Unsplash photo data to our metadata format
     */
    private transformMetadata(photo: UnsplashPhoto): MediaMetadata {
        // Extract year from creation date for attribution
        const year = photo.created_at ? new Date(photo.created_at).getFullYear() : new Date().getFullYear()

        // Build about field in format: author | license | year
        const about = this.buildAboutField(photo, year)

        // Detect file format from URL
        const fileformat = this.detectFileFormat(photo.urls.raw)

        // Get geo data if available
        const geo = photo.location?.position?.latitude && photo.location?.position?.longitude
            ? {
                latitude: photo.location.position.latitude,
                longitude: photo.location.position.longitude,
                location: photo.location.name || photo.location.city || photo.location.country || undefined
            }
            : undefined

        // Extract collection ID if available
        const collectionId = photo.current_user_collections?.[0]?.id?.toString() || null

        // Clean and prepare base URL for shape generation
        // Extract auth params (ixid, ixlib) and any crop settings from raw URL
        const cleanBaseUrl = this.prepareBaseUrl(photo.urls.raw)

        // Extract German alt text from alternative_slugs if available
        const altText = this.extractGermanAltText(photo)

        return {
            url: photo.urls.raw,
            name: photo.alt_description || photo.description || `Unsplash Photo ${photo.id}`,
            alt_text: altText,
            title: photo.description || undefined,

            // Dimensions
            x: photo.width,
            y: photo.height,
            fileformat,

            // Author/attribution (all 6 fields required for media_adapter composite type)
            author: {
                adapter: 'unsplash',
                file_id: photo.id,
                account_id: photo.user.id,
                folder_id: collectionId || null,
                info: photo.user.name || null,
                config: null
            },

            // Shape variations with default crop dimensions (SSR-optimized smallest usable sizes)
            // Dimensions match ImgShape.vue and CSS variables (--tile-height-square: 8rem, --avatar: 4rem, etc.)
            shape_square: {
                url: this.buildShapeUrl(cleanBaseUrl, 'square'),
                x: 128,  // 8rem tile-height-square
                y: 128
            },
            shape_thumb: {
                url: this.buildShapeUrl(cleanBaseUrl, 'thumb'),
                x: 64,   // 4rem avatar (synonymous with thumb, face-focused crop)
                y: 64
            },
            shape_wide: {
                url: this.buildShapeUrl(cleanBaseUrl, 'wide'),
                x: 336,  // 21rem card-width
                y: 168   // 10.5rem card-height-min
            },
            shape_vertical: {
                url: this.buildShapeUrl(cleanBaseUrl, 'vertical'),
                x: 126,  // 7.875rem (9:16 aspect ratio)
                y: 224   // 14rem card-height
            },

            // Location
            geo,

            // Metadata
            date: photo.created_at ? new Date(photo.created_at) : undefined,
            license: 'unsplash', // Unsplash has its own license
            about: about,

            // Raw data for reference
            raw_data: photo
        }
    }

    /**
     * Extract German alt text from alternative_slugs
     * Converts slug format to readable text:
     * - Strips photo ID from end
     * - Replaces hyphens with spaces
     * - Capitalizes first letter
     * 
     * Example: "drei-personen-die-auf-einem-feld-stehen-abc123" 
     *       -> "Drei personen die auf einem feld stehen"
     * 
     * Falls back to alt_description or description if alternative_slugs.de not available
     */
    private extractGermanAltText(photo: UnsplashPhoto): string {
        // Try German slug first
        if (photo.alternative_slugs?.de) {
            const germanSlug = photo.alternative_slugs.de

            // Remove photo ID from end (usually last segment after final hyphen)
            // Photo IDs are typically 11 characters: alphanumeric + hyphens
            const parts = germanSlug.split('-')

            // If last part looks like a photo ID (alphanumeric, ~11 chars), remove it
            if (parts.length > 1 && parts[parts.length - 1].length >= 10) {
                parts.pop()
            }

            // Join with spaces and capitalize first letter
            const text = parts.join(' ')
            return text.charAt(0).toUpperCase() + text.slice(1)
        }

        // Fallback to English descriptions
        return photo.alt_description || photo.description || ''
    }

    /**
     * Prepare clean base URL with auth params at end
     * Extracts and removes crop parameters from original URL
     * Preserves essential auth params (ixid, ixlib) and moves them to end
     * 
     * @param rawUrl Original Unsplash raw URL
     * @returns Clean base URL with only auth params
     */
    private prepareBaseUrl(rawUrl: string): string {
        try {
            const urlObj = new URL(rawUrl)

            // Extract auth params (required by Unsplash API)
            const ixid = urlObj.searchParams.get('ixid')
            const ixlib = urlObj.searchParams.get('ixlib')

            // Clear all query parameters
            urlObj.search = ''

            // Add back only auth params at end (if present)
            if (ixid) urlObj.searchParams.set('ixid', ixid)
            if (ixlib) urlObj.searchParams.set('ixlib', ixlib)

            return urlObj.toString()
        } catch {
            return rawUrl
        }
    }

    /**
     * Build shape URL with Unsplash crop parameters in standardized order
     * Parameter order: crop operation → dimensions → focal params → auth params
     * 
     * Standard sequence:
     * 1. crop=entropy|focalpoint (crop method)
     * 2. fit=crop (apply cropping)
     * 3. w=X, h=Y (dimensions)
     * 4. fp-x, fp-y, fp-z (focal point parameters, if focalpoint crop)
     * 5. ixid, ixlib (auth params, already in baseUrl)
     * 
     * Special case: thumb shape uses focalpoint crop with 1.5x zoom for face-focused view
     * 
     * @param baseUrl Clean base URL with auth params at end
     * @param shape Shape variant (square, thumb, wide, vertical)
     * @returns URL with crop parameters in standardized order
     */
    private buildShapeUrl(baseUrl: string, shape: 'square' | 'thumb' | 'wide' | 'vertical'): string {
        let width: number, height: number

        // Hard-coded dimensions matching ImgShape.vue and CSS variables
        // These are the smallest usable sizes for SSR optimization
        switch (shape) {
            case 'square':
                width = height = 128  // 8rem tile-height-square
                break
            case 'thumb':
                width = height = 64   // 4rem avatar
                break
            case 'wide':
                width = 336           // 21rem card-width
                height = 168          // 10.5rem card-height-min
                break
            case 'vertical':
                width = 126           // 7.875rem (9:16 aspect ratio)
                height = 224          // 14rem card-height
                break
        }

        try {
            const urlObj = new URL(baseUrl)

            // Extract existing auth params to re-add at end
            const authParams = new Map<string, string>()
            urlObj.searchParams.forEach((value, key) => {
                authParams.set(key, value)
            })

            // Clear all params to rebuild in correct order
            urlObj.search = ''

            // Special handling for thumb: use focalpoint crop with zoom
            if (shape === 'thumb') {
                // 1. Crop operation - focalpoint for face-focused view
                urlObj.searchParams.set('crop', 'focalpoint')
                urlObj.searchParams.set('fit', 'crop')

                // 2. Dimensions
                urlObj.searchParams.set('w', width.toString())
                urlObj.searchParams.set('h', height.toString())

                // 3. Focal point parameters - center with 1.5x zoom
                urlObj.searchParams.set('fp-x', '0.5')  // Center horizontally
                urlObj.searchParams.set('fp-y', '0.5')  // Center vertically (face height)
                urlObj.searchParams.set('fp-z', '1.5')  // 1.5x zoom for closer view
            } else {
                // Standard shapes: use entropy crop (Unsplash smart crop)
                // 1. Crop operation parameters
                urlObj.searchParams.set('crop', 'entropy')
                urlObj.searchParams.set('fit', 'crop')

                // 2. Dimensions
                urlObj.searchParams.set('w', width.toString())
                urlObj.searchParams.set('h', height.toString())
            }

            // 4. Auth params (last, preserves API requirements)
            authParams.forEach((value, key) => {
                urlObj.searchParams.set(key, value)
            })

            return urlObj.toString()
        } catch {
            // If URL parsing fails, return original
            return baseUrl
        }
    }

    /**
     * Build about field in format: author | license | year
     * Example: (c) Hans Dönitz | Unsplash | 2019
     * 
     * This format allows HTML links to be added later if needed:
     * <a href="...">(c) Hans Dönitz</a> | Unsplash | 2019
     */
    private buildAboutField(photo: UnsplashPhoto, year: number): string {
        const authorName = photo.user.name || photo.user.username || 'Unknown'
        return `(c) ${authorName} | Unsplash | ${year}`
    }

    /**
     * Detect file format from URL
     */
    private detectFileFormat(url: string): string {
        try {
            const urlObj = new URL(url)
            const pathname = urlObj.pathname.toLowerCase()

            if (pathname.endsWith('.jpg') || pathname.endsWith('.jpeg')) return 'jpeg'
            if (pathname.endsWith('.png')) return 'png'
            if (pathname.endsWith('.webp')) return 'webp'
            if (pathname.endsWith('.gif')) return 'gif'
            if (pathname.includes('fm=jpg') || urlObj.searchParams.get('fm') === 'jpg') return 'jpeg'
            if (pathname.includes('fm=png') || urlObj.searchParams.get('fm') === 'png') return 'png'
            if (pathname.includes('fm=webp') || urlObj.searchParams.get('fm') === 'webp') return 'webp'

            // Default for Unsplash
            return 'jpeg'
        } catch {
            return 'jpg'
        }
    }
}
