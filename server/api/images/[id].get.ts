import { defineEventHandler, getRouterParam, createError } from 'h3'
import { db } from '../../database/init'

/**
 * Hero instance dimensions for URL building
 */
const HERO_INSTANCE_DIMENSIONS = {
    hero_wide_xl: { template: 'wide', width: 1440, height: 820 },
    hero_square_xl: { template: 'square', width: 1440, height: 1280 },
    hero_wide: { template: 'wide', width: 1100, height: 620 },
    hero_square: { template: 'square', width: 440, height: 440 },
    hero_vertical: { template: 'vertical', width: 440, height: 880 }
} as const

interface ShapeData {
    url: string
    blur?: string
    x?: number
    y?: number
    z?: number
}

/**
 * Build hero instances from img_* JSONB columns
 * For local adapter: Build URLs for the hero instance files
 * For cloud adapters: Build sized URLs dynamically
 */
function buildHeroInstances(image: any): Record<string, ShapeData | null> {
    const instances: Record<string, ShapeData | null> = {}

    // Determine adapter type
    const adapter = detectAdapter(image.url || '')

    for (const [instanceName, config] of Object.entries(HERO_INSTANCE_DIMENSIONS)) {
        // Get the corresponding img_* column (img_wide, img_square, img_vert)
        const imgKey = config.template === 'vertical' ? 'img_vert' : `img_${config.template}`
        const imgData = image[imgKey] as ShapeData | undefined

        if (!imgData?.url) {
            instances[instanceName] = null
            continue
        }

        // Build instance URL based on adapter
        let instanceUrl: string

        if (adapter === 'local') {
            // Local adapter: Build URL for the hero instance file
            // Instance files are named: {xmlid}_{instanceName}.webp
            // e.g., opus1.image.test_hero_wide_xl.webp
            if (image.xmlid) {
                instanceUrl = `/api/images/local/shapes/${image.xmlid}_${instanceName}.webp`
            } else {
                // Fallback to template shape if no xmlid
                instanceUrl = imgData.url
            }
        } else if (adapter === 'unsplash') {
            // Unsplash: use query parameters for sizing
            instanceUrl = buildUnsplashUrl(imgData.url, config.width, config.height)
        } else if (adapter === 'cloudinary') {
            // Cloudinary: build transformation URL
            instanceUrl = buildCloudinaryUrl(imgData.url, config.width, config.height)
        } else {
            // External: can't transform, use base URL
            instanceUrl = imgData.url
        }

        instances[instanceName] = {
            url: instanceUrl,
            blur: imgData.blur,
            x: imgData.x,
            y: imgData.y,
            z: imgData.z
        }
    }

    return instances
}

function detectAdapter(url: string): 'local' | 'unsplash' | 'cloudinary' | 'external' {
    if (url.startsWith('/api/images/local/')) return 'local'
    if (url.includes('unsplash.com')) return 'unsplash'
    if (url.includes('cloudinary.com')) return 'cloudinary'
    return 'external'
}

function buildUnsplashUrl(baseUrl: string, width: number, height: number): string {
    try {
        const url = new URL(baseUrl)
        url.searchParams.set('w', width.toString())
        url.searchParams.set('h', height.toString())
        url.searchParams.set('fit', 'crop')
        url.searchParams.set('auto', 'format')
        return url.toString()
    } catch {
        return baseUrl
    }
}

function buildCloudinaryUrl(baseUrl: string, width: number, height: number): string {
    const uploadIndex = baseUrl.indexOf('/upload/')
    if (uploadIndex === -1) return baseUrl

    const transform = `c_fill,w_${width},h_${height},g_auto`
    return baseUrl.slice(0, uploadIndex + 8) + transform + '/' + baseUrl.slice(uploadIndex + 8)
}

/**
 * GET /api/images/:id - Get single image by ID
 * 
 * Returns image with computed hero instances for responsive serving
 */
export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id')

    if (!id) {
        throw createError({
            statusCode: 400,
            message: 'Image ID is required'
        })
    }

    try {
        const image = await db.get(`
            SELECT 
                i.*,
                u.username as creator_username
            FROM images i
            LEFT JOIN users u ON i.creator_id = u.id
            WHERE i.id = ?
        `, [id])

        if (!image) {
            throw createError({
                statusCode: 404,
                message: 'Image not found'
            })
        }

        // Build hero instances for responsive image serving
        const heroInstances = buildHeroInstances(image)

        return {
            ...image,
            ...heroInstances
        }
    } catch (error) {
        console.error('Error fetching image:', error)

        // Re-throw if already a H3 error
        if (error && typeof error === 'object' && 'statusCode' in error) {
            throw error
        }

        throw createError({
            statusCode: 500,
            message: 'Failed to fetch image'
        })
    }
})
