/**
 * Canva Adapter (STUB)
 * 
 * This is a placeholder stub for the Canva adapter.
 * Implementation will be done when MCP information is available.
 */

import { BaseMediaAdapter } from './base-adapter'
import type { MediaMetadata } from '../types/adapters'

export class CanvaAdapter extends BaseMediaAdapter {
    readonly type = 'canva' as const

    canHandle(url: string): boolean {
        try {
            const urlObj = new URL(url)
            return urlObj.hostname.includes('canva.com')
        } catch {
            return false
        }
    }

    async fetchMetadata(url: string): Promise<MediaMetadata> {
        // TODO: Implement using Canva MCP
        throw new Error('Canva adapter not yet implemented. Will be implemented using MCP.')
    }
}
