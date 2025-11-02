/**
 * Cloudinary Adapter (STUB)
 * 
 * This is a placeholder stub for the Cloudinary adapter.
 * Implementation will be done when MCP information is available.
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
        // TODO: Implement using Cloudinary MCP
        throw new Error('Cloudinary adapter not yet implemented. Will be implemented using MCP.')
    }
}
