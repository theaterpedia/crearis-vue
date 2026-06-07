import { defineEventHandler, createError, readBody } from 'h3'
import { db } from '../../database/init'
import { LocalAdapter } from '../../adapters/local-adapter'

/**
 * POST /api/images/regenerate-shapes-batch
 * 
 * Regenerates all shapes and instances for local adapter images.
 * This recreates the physical shape files on disk from the source images.
 * 
 * Request body (optional):
 * - limit: number - Max images to process (default: 50)
 * - includeInstances: boolean - Also regenerate hero/display instances (default: true)
 * - includeBlur: boolean - Also generate blur hashes (default: true)
 */
export default defineEventHandler(async (event) => {
    const body = await readBody(event).catch(() => ({}))
    const limit = body?.limit || 50
    const includeInstances = body?.includeInstances !== false
    const includeBlur = body?.includeBlur !== false

    try {
        // Find all local adapter images
        const images = await db.all<any[]>(`
            SELECT id, xmlid, url, (author).adapter as adapter
            FROM images 
            WHERE (author).adapter IN ('local', 'crearis')
            AND url LIKE '/api/images/local/%'
            LIMIT ?
        `, [limit])

        if (!images || images.length === 0) {
            return {
                success: true,
                message: 'No local adapter images found',
                processed: 0,
                results: []
            }
        }

        console.log(`[regenerate-shapes-batch] Processing ${images.length} images...`)

        const localAdapter = new LocalAdapter()
        const results: any[] = []

        for (const image of images) {
            try {
                // Extract source filename from URL
                const sourceFilename = image.url.replace('/api/images/local/source/', '')
                const sourceFilepath = localAdapter.getFilepath(image.url)

                console.log(`[regenerate-shapes-batch] Processing ${image.xmlid}...`)

                // Generate shapes (templates)
                const shapeUrls = await localAdapter.generateShapes(sourceFilepath, image.xmlid)

                // Generate instances if requested
                let instanceUrls: Record<string, string> = {}
                if (includeInstances) {
                    instanceUrls = await localAdapter.generateInstances(sourceFilepath, image.xmlid)
                }

                // Generate blur hashes if requested
                let shapeBlurs: Record<string, string | null> = {}
                if (includeBlur) {
                    shapeBlurs = await localAdapter.regenerateBlurHashesForImage(image.xmlid)
                }

                // Build shape objects for database update
                const buildShapeRow = (url: string, blur: string | null) => {
                    return `(,,,${url},,${blur || ''},)`
                }

                const shapeSquare = buildShapeRow(shapeUrls.square, shapeBlurs.square || null)
                const shapeThumb = buildShapeRow(shapeUrls.thumb, shapeBlurs.thumb || null)
                const shapeWide = buildShapeRow(shapeUrls.wide, shapeBlurs.wide || null)
                const shapeVertical = buildShapeRow(shapeUrls.vertical, shapeBlurs.vertical || null)

                // Update the database
                await db.run(`
                    UPDATE images SET
                        shape_square = ?,
                        shape_thumb = ?,
                        shape_wide = ?,
                        shape_vertical = ?,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                `, [shapeSquare, shapeThumb, shapeWide, shapeVertical, image.id])

                results.push({
                    id: image.id,
                    xmlid: image.xmlid,
                    success: true,
                    shapes: shapeUrls,
                    instances: includeInstances ? instanceUrls : undefined,
                    blurs: includeBlur ? shapeBlurs : undefined
                })

                console.log(`[regenerate-shapes-batch] ✓ Regenerated shapes for ${image.xmlid}`)
            } catch (err) {
                console.error(`[regenerate-shapes-batch] ✗ Failed for image ${image.id}:`, err)
                results.push({
                    id: image.id,
                    xmlid: image.xmlid,
                    success: false,
                    error: String(err)
                })
            }
        }

        const successCount = results.filter(r => r.success).length
        const failCount = results.filter(r => !r.success).length

        return {
            success: true,
            message: `Processed ${images.length} images: ${successCount} success, ${failCount} failed`,
            processed: images.length,
            successCount,
            failCount,
            includeInstances,
            includeBlur,
            results
        }
    } catch (error) {
        console.error('[regenerate-shapes-batch] Error:', error)

        throw createError({
            statusCode: 500,
            message: `Failed to batch regenerate shapes: ${error}`
        })
    }
})
