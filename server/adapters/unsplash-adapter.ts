/**
 * Unsplash Adapter
 * 
 * Handles image imports from Unsplash.
 * Fetches metadata from Unsplash API and transforms it for our database.
 */

import { BaseMediaAdapter } from './base-adapter'
import type { MediaMetadata, UnsplashPhoto } from '../types/adapters'

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
    async fetchMetadata(url: string): Promise<MediaMetadata> {
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
        const year = photo.created_at ? new Date(photo.created_at).getFullYear() : null

        // Build attribution HTML as required by Unsplash
        const attribution = this.buildAttribution(photo, year)

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

        return {
            url: photo.urls.raw,
            name: photo.alt_description || photo.description || `Unsplash Photo ${photo.id}`,
            alt_text: photo.alt_description || photo.description || '',
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

            // Shape variations
            shape_square: {
                url: photo.urls.regular,
                x: 1080, // Unsplash regular is typically 1080px wide
                y: undefined
            },
            shape_thumb: {
                url: photo.urls.thumb,
                x: 200, // Unsplash thumb is 200px
                y: undefined
            },
            shape_wide: {
                url: photo.urls.full,
                x: photo.width,
                y: photo.height
            },
            shape_vertical: photo.height > photo.width ? {
                url: photo.urls.regular,
                x: undefined,
                y: 1080
            } : undefined,

            // Location
            geo,

            // Metadata
            date: photo.created_at ? new Date(photo.created_at) : undefined,
            license: 'unsplash', // Unsplash has its own license
            about: attribution,

            // Raw data for reference
            raw_data: photo
        }
    }

    /**
     * Build attribution HTML fragment as required by Unsplash
     */
    private buildAttribution(photo: UnsplashPhoto, year: number | null): string {
        const userName = photo.user.name
        const userLink = photo.user.links.html
        const photoLink = photo.links.html

        const yearStr = year ? ` (${year})` : ''

        return `Photo by <a href="${userLink}?utm_source=crearis&utm_medium=referral">${userName}</a> on <a href="${photoLink}?utm_source=crearis&utm_medium=referral">Unsplash</a>${yearStr}`
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
