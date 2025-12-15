/**
 * POST /api/images/[id]/regenerate-shapes
 * 
 * Regenerate shape variants for a local image using Sharp.
 * Useful for updating crops after XYZ adjustments or changing cropping strategy.
 * 
 * Request body (optional):
 * - shapes: Array of shapes to regenerate (default: all)
 * - strategy: Override cropping strategy ('entropy' | 'attention')
 * - xyz: Object with x, y, z values for XYZ transformation
 * 
 * Only works for local adapter images (adapter='local' in author field).
 * External images (Unsplash, Cloudinary) cannot be regenerated.
 */

import { defineEventHandler, getRouterParam, readBody, createError } from 'h3'
import { LocalAdapter } from '../../../adapters/local-adapter'
import { db } from '../../../database/init'

type ShapeType = 'square' | 'thumb' | 'wide' | 'vertical'

interface RegenerateOptions {
    shapes?: ShapeType[]
    strategy?: 'entropy' | 'attention'
    xyz?: {
        square?: { x: number; y: number; z: number }
        thumb?: { x: number; y: number; z: number }
        wide?: { x: number; y: number; z: number }
        vertical?: { x: number; y: number; z: number }
    }
}

export default defineEventHandler(async (event) => {
    try {
        const imageId = getRouterParam(event, 'id')

        if (!imageId || isNaN(parseInt(imageId, 10))) {
            throw createError({
                statusCode: 400,
                statusMessage: 'Invalid image ID'
            })
        }

        // Get image from database
        const image = await db.get(
            `SELECT id, xmlid, url, name, 
                    (author).adapter as adapter
             FROM images 
             WHERE id = ?`,
            [imageId]
        )

        if (!image) {
            throw createError({
                statusCode: 404,
                statusMessage: 'Image not found'
            })
        }

        // Check if image is from local adapter (can be 'local' or 'crearis')
        const adapterName = (image as any).adapter
        if (adapterName !== 'local' && adapterName !== 'crearis') {
            throw createError({
                statusCode: 400,
                statusMessage: `Cannot regenerate shapes for ${adapterName} images. Only local adapter images can be regenerated.`
            })
        }

        // Parse request body
        const body = await readBody(event).catch(() => ({}))
        const options: RegenerateOptions = body || {}
        const shapesToRegenerate: ShapeType[] = options?.shapes || ['square', 'thumb', 'wide', 'vertical']

        console.log(`[Regenerate] Image ${imageId} - Regenerating shapes:`, shapesToRegenerate)

        // Initialize adapter
        const adapter = new LocalAdapter()

        // Get source file path
        const sourceUrl = (image as any).url
        const sourceFilepath = adapter.getFilepath(sourceUrl)

        // Get xmlid from the image record (it's a direct column, not nested in author)
        const xmlid = (image as any).xmlid

        if (!xmlid) {
            throw createError({
                statusCode: 400,
                statusMessage: 'Image is missing xmlid - cannot regenerate shapes'
            })
        }

        console.log(`[Regenerate] Image ${imageId} - Source: ${sourceFilepath}, xmlid: ${xmlid}`)

        // Generate all templates at once (more efficient than per-shape)
        const allShapes = await adapter.generateShapes(sourceFilepath, xmlid)

        // Regenerate shapes (templates)
        const newUrls: Record<string, string> = {}

        for (const shape of shapesToRegenerate) {
            let shapeUrl: string

            // Check if XYZ transformation requested for this shape
            const xyzParams = options.xyz?.[shape]

            if (xyzParams && xyzParams.x !== undefined && xyzParams.y !== undefined && xyzParams.z !== undefined) {
                // Use XYZ transformation
                shapeUrl = await adapter.generateShapeWithXYZ(
                    sourceFilepath,
                    xmlid,
                    shape,
                    xyzParams.x,
                    xyzParams.y,
                    xyzParams.z
                )
                console.log(`[Regenerate] ${shape} with XYZ (${xyzParams.x},${xyzParams.y},${xyzParams.z})`)
            } else {
                // Use pre-generated shape
                shapeUrl = allShapes[shape]
                console.log(`[Regenerate] ${shape} with default strategy`)
            }

            newUrls[shape] = shapeUrl
        }

        // Also regenerate instances (display_*, hero_*)
        console.log(`[Regenerate] Generating shape instances for ${xmlid}...`)
        const instanceUrls = await adapter.generateInstances(sourceFilepath, xmlid)
        console.log(`[Regenerate] Generated ${Object.keys(instanceUrls).length} instances`)

        // Update database with new shape URLs
        const updates: string[] = []
        const values: any[] = []

        for (const shape of shapesToRegenerate) {
            updates.push(`shape_${shape} = ROW(NULL, NULL, NULL, ?, NULL, NULL, NULL, NULL)::image_shape`)
            values.push(newUrls[shape])
        }

        if (updates.length > 0) {
            values.push(imageId)
            await db.run(
                `UPDATE images SET ${updates.join(', ')} WHERE id = ?`,
                values
            )
        }

        console.log(`[Regenerate] Success - Image ${imageId} shapes updated`)

        return {
            success: true,
            image_id: parseInt(imageId, 10),
            regenerated_shapes: shapesToRegenerate,
            urls: newUrls,
            instances: instanceUrls,
            message: `Successfully regenerated ${shapesToRegenerate.length} shape(s) and ${Object.keys(instanceUrls).length} instance(s)`
        }
    } catch (error: any) {
        console.error('[Regenerate] Error:', error)

        // Re-throw H3 errors
        if (error.statusCode) {
            throw error
        }

        // Wrap other errors
        throw createError({
            statusCode: 500,
            statusMessage: error.message || 'Failed to regenerate shapes'
        })
    }
})
