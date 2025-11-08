/**
 * Adapter Registry
 * 
 * Central registry for all media adapters.
 * Provides adapter detection and instantiation.
 */

import type { IMediaAdapter } from '../types/adapters'
import { UnsplashAdapter } from './unsplash-adapter'
import { CloudinaryAdapter } from './cloudinary-adapter'
// Import other adapters as they're implemented
// import { CanvaAdapter } from './canva-adapter'
// import { VimeoAdapter } from './vimeo-adapter'

/**
 * Registry of all available adapters
 */
class AdapterRegistry {
    private adapters: IMediaAdapter[] = []

    constructor() {
        this.registerAdapters()
    }

    /**
     * Register all available adapters
     */
    private registerAdapters(): void {
        // Register Unsplash adapter
        this.adapters.push(new UnsplashAdapter())
        
        // Register Cloudinary adapter
        this.adapters.push(new CloudinaryAdapter())

        // TODO: Register other adapters as they're implemented
        // this.adapters.push(new CanvaAdapter())
        // this.adapters.push(new VimeoAdapter())
    }

    /**
     * Detect which adapter can handle the given URL
     */
    detectAdapter(url: string): IMediaAdapter | null {
        for (const adapter of this.adapters) {
            if (adapter.canHandle(url)) {
                return adapter
            }
        }
        return null
    }

    /**
     * Get all registered adapters
     */
    getAllAdapters(): IMediaAdapter[] {
        return [...this.adapters]
    }

    /**
     * Get adapter by type
     */
    getAdapterByType(type: string): IMediaAdapter | null {
        return this.adapters.find(a => a.type === type) || null
    }
}

// Export singleton instance
export const adapterRegistry = new AdapterRegistry()
