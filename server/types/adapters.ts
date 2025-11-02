/**
 * Shared type definitions for media adapters
 * Used by both server and client for consistent typing
 */

export type AdapterType = 'unsplash' | 'cloudinary' | 'canva' | 'vimeo' | 'local' | 'external'

/**
 * Common interface for all media adapters
 */
export interface MediaAdapterInfo {
    adapter: AdapterType
    file_id?: string | null
    account_id?: string | null
    folder_id?: string | null
    info?: string | null
    config?: Record<string, any> | null
}

/**
 * Image shape/variation information
 */
export interface ImageShape {
    url: string
    x?: number
    y?: number
}

/**
 * Batch import metadata applied to all images
 */
export interface ImageImportBatch {
    domaincode?: string | null  // Will be converted to project_id
    owner_id?: number | null
    alt_text?: string | null
    license?: string | null
    xml_root?: string | null  // Base xmlid, will append .00, .01, .02...
    ctags?: Buffer | null
    rtags?: Buffer | null
}

/**
 * Result of image import operation
 */
export interface ImageImportResult {
    success: boolean
    image_id?: number
    url: string
    adapter: AdapterType
    error?: string
    warnings?: string[]
}

/**
 * Base interface that all adapters must implement
 */
export interface IMediaAdapter {
    readonly type: AdapterType

    /**
     * Detect if this adapter can handle the given URL
     */
    canHandle(url: string): boolean

    /**
     * Extract metadata from external service
     */
    fetchMetadata(url: string): Promise<MediaMetadata>

    /**
     * Import image into database
     */
    importImage(url: string, batchData?: ImageImportBatch): Promise<ImageImportResult>
}

/**
 * Generic metadata structure returned by adapters
 */
export interface MediaMetadata {
    // Core fields
    url: string
    name?: string
    alt_text?: string
    title?: string

    // Dimensions
    x?: number
    y?: number
    fileformat?: string

    // Author/attribution
    author?: MediaAdapterInfo

    // Shapes/variations
    shape_square?: ImageShape
    shape_thumb?: ImageShape
    shape_wide?: ImageShape
    shape_vertical?: ImageShape

    // Location
    geo?: {
        latitude?: number
        longitude?: number
        location?: string
    }

    // Metadata
    date?: Date
    license?: string
    about?: string

    // Adapter-specific data
    raw_data?: any
}

/**
 * Unsplash-specific types
 */
export interface UnsplashPhoto {
    id: string
    created_at: string
    updated_at: string
    width: number
    height: number
    color: string
    blur_hash: string
    description: string | null
    alt_description: string | null
    urls: {
        raw: string
        full: string
        regular: string
        small: string
        thumb: string
    }
    links: {
        self: string
        html: string
        download: string
        download_location: string
    }
    user: {
        id: string
        username: string
        name: string
        portfolio_url: string | null
        bio: string | null
        location: string | null
        links: {
            self: string
            html: string
            photos: string
        }
    }
    location?: {
        name: string | null
        city: string | null
        country: string | null
        position: {
            latitude: number | null
            longitude: number | null
        }
    }
    exif?: {
        make: string | null
        model: string | null
        exposure_time: string | null
        aperture: string | null
        focal_length: string | null
        iso: number | null
    }
    current_user_collections?: Array<{
        id: number
        title: string
    }>
}
