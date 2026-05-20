import { defineEventHandler, getRouterParam, createError } from 'h3'
import { db } from '../../../database/init'

/**
 * GET /api/images/xmlid/:xmlid - Get single image by xmlid
 * 
 * Returns full image data including all shape instances.
 * Used by DisplayImage, DisplayBanner, and Hero components for autonomous
 * image fetching without requiring image data on the parent entity.
 * 
 * Response includes:
 * - Core image metadata (id, name, url, etc.)
 * - Template shapes (square, thumb, wide, vertical)
 * - Instance shapes (display_wide, display_thumb_banner, hero_*)
 * - Author information
 * - Alt text for accessibility
 */
export default defineEventHandler(async (event) => {
    const xmlid = getRouterParam(event, 'xmlid')

    if (!xmlid) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Bad Request',
            message: 'xmlid parameter is required'
        })
    }

    try {
        const image = await db.get(`
            SELECT 
                i.id,
                i.xmlid,
                i.name,
                i.url,
                i.alt_text,
                i.title,
                i.x,
                i.y,
                i.fileformat,
                i.license,
                i.geo,
                i.date,
                i.about,
                i.shape_square,
                i.shape_thumb,
                i.shape_wide,
                i.shape_vertical,
                i.author,
                i.ctags,
                i.rtags,
                i.project_id,
                i.creator_id,
                u.username as creator_username,
                p.domaincode as project_domaincode
            FROM images i
            LEFT JOIN users u ON i.creator_id = u.id
            LEFT JOIN projects p ON i.project_id = p.id
            WHERE i.xmlid = ?
        `, [xmlid])

        if (!image) {
            throw createError({
                statusCode: 404,
                statusMessage: 'Not Found',
                message: `Image with xmlid '${xmlid}' not found`
            })
        }

        // Build shape instances from templates for local adapter
        // Cloudinary/Unsplash build URLs dynamically, local adapter has pre-generated files
        const response = buildImageResponse(image as ImageRow)

        return response
    } catch (error) {
        console.error(`[GET /api/images/xmlid/${xmlid}] Error:`, error)

        // Re-throw if already a H3 error
        if (error && typeof error === 'object' && 'statusCode' in error) {
            throw error
        }

        throw createError({
            statusCode: 500,
            statusMessage: 'Internal Server Error',
            message: 'Failed to fetch image'
        })
    }
})

/**
 * Image row from database
 */
interface ImageRow {
    id: number
    xmlid: string
    name: string
    url: string
    alt_text: string | null
    title: string | null
    x: number | null
    y: number | null
    fileformat: string
    license: string
    geo: string | null
    date: string | null
    about: string | null
    shape_square: ShapeData | null
    shape_thumb: ShapeData | null
    shape_wide: ShapeData | null
    shape_vertical: ShapeData | null
    author: AuthorData | null
    ctags: number
    rtags: number
    project_id: number | null
    creator_id: number | null
    creator_username: string | null
    project_domaincode: string | null
}

interface ShapeData {
    url: string
    blur?: string
    x?: number
    y?: number
    z?: number
}

interface AuthorData {
    adapter: string
    file_id?: string
    account_id?: string
    folder_id?: string
    info?: string
    config?: any
}

/**
 * Instance dimensions for URL building
 */
const INSTANCE_DIMENSIONS = {
    display_wide: { template: 'wide', width: 531, height: 300 },
    display_thumb_banner: { template: 'thumb', width: 1062, height: 266 },
    hero_wide_xl: { template: 'wide', width: 1440, height: 820 },
    hero_square_xl: { template: 'square', width: 1440, height: 1280 },
    hero_wide: { template: 'wide', width: 1100, height: 620 },
    hero_square: { template: 'square', width: 440, height: 440 },
    hero_vertical: { template: 'vertical', width: 440, height: 880 }
} as const

/**
 * Build full image response with shape instances
 */
function buildImageResponse(image: ImageRow) {
    const adapter = image.author?.adapter || detectAdapter(image.url)

    // Build base response
    const response: Record<string, any> = {
        id: image.id,
        xmlid: image.xmlid,
        name: image.name,
        url: image.url,
        adapter,
        alt_text: image.alt_text,
        title: image.title,
        dimensions: {
            x: image.x,
            y: image.y
        },
        fileformat: image.fileformat,
        license: image.license,

        // Template shapes
        square: image.shape_square,
        thumb: image.shape_thumb,
        wide: image.shape_wide,
        vertical: image.shape_vertical,

        // Author info
        author: image.author ? {
            name: image.author.info || image.author.file_id,
            uri: buildAuthorUri(image.author)
        } : null,

        // Metadata
        project_id: image.project_id,
        project_domaincode: image.project_domaincode,
        creator_id: image.creator_id,
        creator_username: image.creator_username
    }

    // Add shape instances based on adapter type
    const instances = buildShapeInstances(image, adapter)
    Object.assign(response, instances)

    return response
}

/**
 * Detect adapter type from URL
 */
function detectAdapter(url: string): string {
    if (url.includes('unsplash.com')) return 'unsplash'
    if (url.includes('cloudinary.com')) return 'cloudinary'
    if (url.startsWith('/api/images/local/')) return 'crearis'
    return 'external'
}

/**
 * Build author profile URI based on adapter
 */
function buildAuthorUri(author: AuthorData): string | null {
    if (!author.adapter || !author.account_id) return null

    switch (author.adapter) {
        case 'unsplash':
            return `https://unsplash.com/@${author.account_id}`
        case 'cloudinary':
            return null // Cloudinary doesn't have public author profiles
        default:
            return null
    }
}

/**
 * Build shape instances from templates
 * 
 * For local adapter: Generate URLs for pre-generated instance files
 * For Cloudinary/Unsplash: Build transformation URLs dynamically
 */
function buildShapeInstances(
    image: ImageRow,
    adapter: string
): Record<string, ShapeData | null> {
    const instances: Record<string, ShapeData | null> = {}

    for (const [instanceName, config] of Object.entries(INSTANCE_DIMENSIONS)) {
        const templateKey = `shape_${config.template}` as keyof ImageRow
        const template = image[templateKey] as ShapeData | null

        if (!template) {
            instances[instanceName] = null
            continue
        }

        // Build instance URL based on adapter
        let instanceUrl: string

        switch (adapter) {
            case 'crearis':
                // Local adapter: pre-generated files with naming convention
                instanceUrl = buildLocalInstanceUrl(image.xmlid, instanceName)
                break

            case 'cloudinary':
                // Cloudinary: build transformation URL
                instanceUrl = buildCloudinaryInstanceUrl(
                    template.url,
                    config.width,
                    config.height,
                    template.x,
                    template.y,
                    template.z
                )
                break

            case 'unsplash':
                // Unsplash: use ixid parameters
                instanceUrl = buildUnsplashInstanceUrl(
                    template.url,
                    config.width,
                    config.height
                )
                break

            default:
                // External: can't transform, use template
                instanceUrl = template.url
        }

        instances[instanceName] = {
            url: instanceUrl,
            blur: template.blur,  // Inherit blur from template
            x: template.x,        // Inherit XYZ from template
            y: template.y,
            z: template.z
        }
    }

    return instances
}

/**
 * Build local adapter instance URL
 * Format: /api/images/local/shapes/{xmlid}_{instanceName}.webp
 */
function buildLocalInstanceUrl(xmlid: string, instanceName: string): string {
    return `/api/images/local/shapes/${xmlid}_${instanceName}.webp`
}

/**
 * Build Cloudinary transformation URL
 */
function buildCloudinaryInstanceUrl(
    baseUrl: string,
    width: number,
    height: number,
    x?: number,
    y?: number,
    z?: number
): string {
    // Parse Cloudinary URL and insert transformation
    // Example: https://res.cloudinary.com/demo/image/upload/sample.jpg
    // Becomes: https://res.cloudinary.com/demo/image/upload/c_fill,w_531,h_300,g_auto/sample.jpg

    const uploadIndex = baseUrl.indexOf('/upload/')
    if (uploadIndex === -1) return baseUrl

    // Build transformation string
    let transform = `c_fill,w_${width},h_${height}`

    // Add focal point if custom XYZ defined
    if (x !== undefined && y !== undefined && x !== 50 && y !== 50) {
        transform += `,g_xy_center,x_${Math.round(x / 100 * width)},y_${Math.round(y / 100 * height)}`
    } else {
        transform += ',g_auto'
    }

    // Insert transformation after /upload/
    return baseUrl.slice(0, uploadIndex + 8) + transform + '/' + baseUrl.slice(uploadIndex + 8)
}

/**
 * Build Unsplash transformation URL
 */
function buildUnsplashInstanceUrl(
    baseUrl: string,
    width: number,
    height: number
): string {
    // Unsplash uses query parameters
    // Example: https://images.unsplash.com/photo-xxx?w=531&h=300&fit=crop

    const url = new URL(baseUrl)
    url.searchParams.set('w', width.toString())
    url.searchParams.set('h', height.toString())
    url.searchParams.set('fit', 'crop')
    url.searchParams.set('auto', 'format')

    return url.toString()
}
