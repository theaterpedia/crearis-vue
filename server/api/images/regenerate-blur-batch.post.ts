import { defineEventHandler, createError, readBody } from 'h3'
import { db } from '../../database/init'
import { LocalAdapter } from '../../adapters/local-adapter'

/**
 * POST /api/images/regenerate-blur-batch
 * 
 * Regenerates BlurHash values for all local adapter images that don't have blur hashes.
 * 
 * Request body (optional):
 * - limit: number - Max images to process (default: 50)
 * - force: boolean - Regenerate even if blur exists (default: false)
 */
export default defineEventHandler(async (event) => {
    const body = await readBody(event).catch(() => ({}))
    const limit = body?.limit || 50
    const force = body?.force || false

    try {
        // Find local adapter images without blur hashes (or all if force=true)
        let query: string
        if (force) {
            query = `
                SELECT id, xmlid, (author).adapter as adapter, shape_square, shape_thumb, shape_wide, shape_vertical
                FROM images 
                WHERE (author).adapter IN ('local', 'crearis')
                LIMIT ?
            `
        } else {
            // Find images where at least one shape is missing blur
            // Check if blur field (6th position in ROW) is empty
            query = `
                SELECT id, xmlid, (author).adapter as adapter, shape_square, shape_thumb, shape_wide, shape_vertical
                FROM images 
                WHERE (author).adapter IN ('local', 'crearis')
                AND (
                    shape_square NOT LIKE '%,_,%,_,%,_,%' OR shape_square IS NULL
                    OR shape_thumb NOT LIKE '%,_,%,_,%,_,%' OR shape_thumb IS NULL
                    OR shape_wide NOT LIKE '%,_,%,_,%,_,%' OR shape_wide IS NULL
                    OR shape_vertical NOT LIKE '%,_,%,_,%,_,%' OR shape_vertical IS NULL
                )
                LIMIT ?
            `
        }

        const images = await db.all<any[]>(query, [limit])

        if (!images || images.length === 0) {
            return {
                success: true,
                message: 'No images need blur hash regeneration',
                processed: 0,
                results: []
            }
        }

        console.log(`[regenerate-blur-batch] Processing ${images.length} images...`)

        const localAdapter = new LocalAdapter()
        const results: any[] = []

        for (const image of images) {
            try {
                // Generate blur hashes
                const blurHashes = await localAdapter.regenerateBlurHashesForImage(image.xmlid)

                // Helper to parse existing shape data and add blur
                const updateShapeWithBlur = (shapeJson: string | null, blur: string | null): string | null => {
                    if (!shapeJson) return null

                    try {
                        // Parse the ROW format: (x,y,z,url,turl,blur,tpar)
                        const match = shapeJson.match(/\(([^,]*),([^,]*),([^,]*),([^,]*),([^,]*),([^,]*),([^,]*)\)/)
                        if (match) {
                            return `(${match[1] || ''},${match[2] || ''},${match[3] || ''},${match[4] || ''},${match[5] || ''},${blur || ''},${match[7] || ''})`
                        }
                        return shapeJson
                    } catch (e) {
                        return shapeJson
                    }
                }

                // Update each shape with its blur hash
                const updatedSquare = updateShapeWithBlur(image.shape_square, blurHashes.square)
                const updatedThumb = updateShapeWithBlur(image.shape_thumb, blurHashes.thumb)
                const updatedWide = updateShapeWithBlur(image.shape_wide, blurHashes.wide)
                const updatedVertical = updateShapeWithBlur(image.shape_vertical, blurHashes.vertical)

                // Update the database
                await db.run(`
                    UPDATE images SET
                        shape_square = ?,
                        shape_thumb = ?,
                        shape_wide = ?,
                        shape_vertical = ?,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                `, [updatedSquare, updatedThumb, updatedWide, updatedVertical, image.id])

                results.push({
                    id: image.id,
                    xmlid: image.xmlid,
                    success: true,
                    blurHashes
                })

                console.log(`[regenerate-blur-batch] ✓ Updated image ${image.id} (${image.xmlid})`)
            } catch (err) {
                console.error(`[regenerate-blur-batch] ✗ Failed for image ${image.id}:`, err)
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
            results
        }
    } catch (error) {
        console.error('[regenerate-blur-batch] Error:', error)

        throw createError({
            statusCode: 500,
            message: `Failed to batch regenerate blur hashes: ${error}`
        })
    }
})
