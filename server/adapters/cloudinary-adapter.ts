/**
 * Cloudinary Adapter
 * 
 * Handles image imports from Cloudinary without API access.
 * Extracts metadata from URL structure (folder, filename, version).
 * 
 * ENV Variables:
 * - CLOUDINARY_ACCOUNT: Default account name (e.g., 'little-papillon')
 * - CLOUDINARY_INITIAL_VERSION: Fallback version for year extraction (e.g., 'v1665139609')
 */

import { BaseMediaAdapter } from './base-adapter'
import type { MediaMetadata, ImageImportBatch } from '../types/adapters'

export class CloudinaryAdapter extends BaseMediaAdapter {
    readonly type = 'cloudinary' as const

    canHandle(url: string): boolean {
        try {
            const urlObj = new URL(url)
            return urlObj.hostname.includes('cloudinary.com')
        } catch {
            return false
        }
    }

    async fetchMetadata(url: string, batchData?: ImageImportBatch): Promise<MediaMetadata> {
        // Extract all components from URL
        const cloudName = this.extractCloudName(url)
        const publicId = this.extractPublicId(url)
        const folder = this.extractFolder(publicId)
        const filename = this.extractFilenameFromPublicId(publicId)
        const version = this.extractVersion(url)
        const fileformat = this.detectFileFormat(url)
        
        // Extract year from version timestamp
        const year = this.extractYearFromVersion(version) || 
                     this.extractYearFromVersion(process.env.CLOUDINARY_INITIAL_VERSION || 'v1665139609')
        
        // Generate alt_text from folder + filename, removing suffix
        const altText = this.extractAltText(folder, filename)
        
        // Get author name from batch data or use default
        const authorName = batchData?.owner_name || 'Hans Dönitz'
        
        // Build about field: (c) Author | Private | Year
        const about = `(c) ${authorName} | Private | ${year}`

        return {
            url,
            name: filename || 'Cloudinary Image',
            alt_text: altText,

            // Basic dimensions (unknown without API call)
            x: undefined,
            y: undefined,
            fileformat,

            // Author info for Cloudinary
            author: {
                adapter: 'cloudinary',
                file_id: publicId || null,
                account_id: cloudName || null,
                folder_id: folder || null,
                info: authorName,
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
            raw_data: { url, source: 'cloudinary', version, folder, filename }
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
     * Extract Cloudinary public ID from URL (full path including folder)
     * Example: dasei/Lichtdesign_rxwwbj or theaterpedia_lichtpunkte_ea_rh
     */
    private extractPublicId(url: string): string | null {
        try {
            // Remove any existing transformations first
            // Pattern: /v{version}/{path}.{ext}
            const match = url.match(/\/v\d+\/(.+?)(?:\?|$)/)
            if (match) {
                const pathWithExt = match[1]
                // Remove file extension
                return pathWithExt.replace(/\.[^.]+$/, '')
            }
            return null
        } catch {
            return null
        }
    }

    /**
     * Extract folder path from public ID
     * Example: "dasei/Lichtdesign_rxwwbj" → "dasei"
     * Example: "theaterpedia_lichtpunkte_ea_rh" → null
     */
    private extractFolder(publicId: string | null): string | null {
        if (!publicId) return null
        const parts = publicId.split('/')
        if (parts.length > 1) {
            // Return all parts except the last one (filename)
            return parts.slice(0, -1).join('/')
        }
        return null
    }

    /**
     * Extract filename from public ID (without folder)
     * Example: "dasei/Lichtdesign_rxwwbj" → "Lichtdesign_rxwwbj"
     * Example: "theaterpedia_lichtpunkte_ea_rh" → "theaterpedia_lichtpunkte_ea_rh"
     */
    private extractFilenameFromPublicId(publicId: string | null): string | null {
        if (!publicId) return null
        const parts = publicId.split('/')
        return parts[parts.length - 1]
    }

    /**
     * Extract version from URL
     * Example: "v1735162309" or "v1665139609"
     */
    private extractVersion(url: string): string | null {
        try {
            const match = url.match(/\/(v\d+)\//)
            return match ? match[1] : null
        } catch {
            return null
        }
    }

    /**
     * Extract year from Cloudinary version (Unix timestamp)
     * Example: v1735162309 → 2024, v1665139609 → 2022
     */
    private extractYearFromVersion(version: string | null): number | null {
        if (!version) return null
        try {
            // Remove 'v' prefix and parse as integer
            const timestamp = parseInt(version.substring(1))
            if (isNaN(timestamp)) return null
            
            // Convert Unix timestamp (seconds) to JavaScript timestamp (milliseconds)
            const date = new Date(timestamp * 1000)
            return date.getFullYear()
        } catch {
            return null
        }
    }

    /**
     * Generate alt_text from folder and filename
     * Rules:
     * 1. Combine folder + filename
     * 2. Remove suffix (last underscore part matching pattern _xx)
     * 3. Replace underscores with spaces
     * 4. Capitalize first letter
     * 
     * Examples:
     * - folder="dasei", filename="Lichtdesign_rxwwbj" → "Dasei Lichtdesign"
     * - folder=null, filename="theaterpedia_lichtpunkte_ea_rh" → "Theaterpedia lichtpunkte"
     */
    private extractAltText(folder: string | null, filename: string | null): string {
        if (!filename) return ''
        
        // Start with folder + filename (or just filename)
        let text = folder ? `${folder} ${filename}` : filename
        
        // Remove Cloudinary hash suffix pattern (underscore followed by lowercase letters/numbers, typically 6 chars)
        // Examples: _rxwwbj, _ea_rh, _hd, _tp
        text = text.replace(/_[a-z0-9]{2,}$/i, '') // Remove hash/suffix at end
        text = text.replace(/_[a-z]{2}$/i, '')     // Remove any remaining 2-char suffix
        
        // Replace remaining underscores with spaces
        text = text.replace(/_/g, ' ')
        
        // Capitalize first letter
        return text.charAt(0).toUpperCase() + text.slice(1)
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
