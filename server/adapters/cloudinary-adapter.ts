/**
 * Cloudinary Adapter
 * 
 * Handles image imports from Cloudinary.
 * Generates shape URLs with crop transformations.
 */

import { BaseMediaAdapter } from './base-adapter'
import type { MediaMetadata } from '../types/adapters'

export class CloudinaryAdapter extends BaseMediaAdapter {
    readonly type = 'cloudinary' as const

    canHandle(url: string): boolean {
        try {
            const urlObj = new URL(url)
            return urlObj.hostname.includes('cloudinary.com') ||
                urlObj.hostname.includes('res.cloudinary.com')
        } catch {
            return false
        }
    }

    async fetchMetadata(url: string): Promise<MediaMetadata> {
        // For now, create basic metadata with shape URLs
        // TODO: Implement full metadata extraction using Cloudinary MCP

        const filename = this.extractFilename(url)
        const fileformat = this.detectFileFormat(url)
        const year = new Date().getFullYear()

        // Build about field: owner | license | year
        // For Cloudinary, we use "Private" as license and current year
        const about = `(c) Owner | Private | ${year}`

        return {
            url,
            name: filename,
            alt_text: '',

            // Basic dimensions (unknown without API call)
            x: undefined,
            y: undefined,
            fileformat,

            // Author info for Cloudinary
            author: {
                adapter: 'cloudinary',
                file_id: this.extractPublicId(url) || null,
                account_id: this.extractCloudName(url) || null,
                folder_id: null,
                info: null,
                config: null
            },

            // Shape variations with default crop dimensions
            shape_square: {
                url: this.buildShapeUrl(url, 'square'),
                x: 128,
                y: 128
            },
            shape_thumb: {
                url: this.buildShapeUrl(url, 'thumb'),
                x: 64,
                y: 64
            },
            shape_wide: {
                url: this.buildShapeUrl(url, 'wide'),
                x: 336,
                y: 168
            },
            shape_vertical: {
                url: this.buildShapeUrl(url, 'vertical'),
                x: 126,
                y: 224
            },

            license: 'private',
            about: about,
            raw_data: { url, source: 'cloudinary' }
        }
    }

    /**
     * Build shape URL with Cloudinary transformation parameters
     * Inserts c_crop,w_X,h_X into the URL path
     * 
     * Format: https://res.cloudinary.com/{cloud_name}/image/upload/{transformations}/v{version}/{path}
     * 
     * @param baseUrl Cloudinary URL
     * @param shape Shape variant (square, thumb, wide, vertical)
     * @returns URL with crop transformations applied
     */
    private buildShapeUrl(baseUrl: string, shape: 'square' | 'thumb' | 'wide' | 'vertical'): string {
        let width: number, height: number

        // Hard-coded dimensions matching ImgShape.vue and CSS variables
        switch (shape) {
            case 'square':
                width = height = 128
                break
            case 'thumb':
                width = height = 64
                break
            case 'wide':
                width = 336
                height = 168
                break
            case 'vertical':
                width = 126
                height = 224
                break
        }

        try {
            // Cloudinary URL pattern: https://res.cloudinary.com/{cloud}/image/upload/{transforms?}/v{version}/{path}
            const pattern = /^(https:\/\/res\.cloudinary\.com\/[^\/]+\/image\/upload\/)(.*?)(\/v\d+\/.+)$/
            const match = baseUrl.match(pattern)

            if (match) {
                // Has existing transformations - replace them
                const [, base, , rest] = match
                const transformations = `c_crop,w_${width},h_${height}`
                return `${base}${transformations}${rest}`
            }

            // Try pattern without existing transformations
            const simplePattern = /^(https:\/\/res\.cloudinary\.com\/[^\/]+\/image\/upload)(\/v\d+\/.+)$/
            const simpleMatch = baseUrl.match(simplePattern)

            if (simpleMatch) {
                // Insert transformations before /vXXXXXXXXXX/
                const [, base, rest] = simpleMatch
                const transformations = `c_crop,w_${width},h_${height}`
                return `${base}/${transformations}${rest}`
            }

            // Cannot parse URL structure, return original
            return baseUrl
        } catch {
            return baseUrl
        }
    }

    /**
     * Extract Cloudinary cloud name from URL
     */
    private extractCloudName(url: string): string | null {
        try {
            const match = url.match(/res\.cloudinary\.com\/([^\/]+)/)
            return match ? match[1] : null
        } catch {
            return null
        }
    }

    /**
     * Extract Cloudinary public ID from URL
     */
    private extractPublicId(url: string): string | null {
        try {
            // Pattern: /v{version}/{path}
            const match = url.match(/\/v\d+\/(.+?)(?:\?|$)/)
            return match ? match[1] : null
        } catch {
            return null
        }
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

            return 'jpeg' // Default
        } catch {
            return 'jpeg'
        }
    }
}
