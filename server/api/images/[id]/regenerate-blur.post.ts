import { defineEventHandler, getRouterParam, createError, readBody } from 'h3'
import { db } from '../../../database/init'
import { LocalAdapter } from '../../../adapters/local-adapter'

/**
 * POST /api/images/:id/regenerate-blur
 * 
 * Regenerates BlurHash values for a local adapter image's shapes
 * and updates the database with the new blur hashes.
 * 
 * Only works for local adapter images.
 * 
 * Note: Only updates shape_* composite columns. The database trigger
 * `compute_image_shape_fields()` automatically propagates blur to img_* JSONB columns.
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
        // Fetch the image
        const image = await db.get<any>(`
            SELECT id, xmlid, (author).adapter as adapter, 
                   shape_square, shape_thumb, shape_wide, shape_vertical
            FROM images 
            WHERE id = ?
        `, [id])

        if (!image) {
            throw createError({
                statusCode: 404,
                message: 'Image not found'
            })
        }

        // Check if it's a local adapter image
        if (image.adapter !== 'local' && image.adapter !== 'crearis') {
            throw createError({
                statusCode: 400,
                message: `BlurHash regeneration only supported for local adapter images. This image uses: ${image.adapter}`
            })
        }

        // Generate blur hashes using the local adapter
        const localAdapter = new LocalAdapter()
        const blurHashes = await localAdapter.regenerateBlurHashesForImage(image.xmlid)

        // Helper to parse existing shape data and add blur
        const updateShapeWithBlur = (shapeJson: string | null, blur: string | null): string | null => {
            if (!shapeJson) return null

            try {
                // Parse the existing shape (ROW format from PostgreSQL or JSON)
                let shape: any
                if (shapeJson.startsWith('(')) {
                    // PostgreSQL ROW format: (x,y,z,url,json,blur,turl,tpar) - 8 fields
                    // Parse the row format - handle quoted and unquoted values
                    const match = shapeJson.match(/\(([^,]*),([^,]*),([^,]*),([^,]*),([^,]*),([^,]*),([^,]*),([^,]*)\)/)
                    if (match) {
                        shape = {
                            x: match[1] || null,
                            y: match[2] || null,
                            z: match[3] || null,
                            url: match[4] || null,
                            json: match[5] || null,
                            blur: blur,  // Update with new blur (position 6)
                            turl: match[7] || null,
                            tpar: match[8] || null
                        }
                    } else {
                        console.error('[regenerate-blur] Regex did not match shape:', shapeJson)
                        return shapeJson // Can't parse, return as-is
                    }
                } else {
                    // JSON format
                    shape = JSON.parse(shapeJson)
                    shape.blur = blur
                }

                // Helper to escape value for ROW format - quote if contains special chars
                const escapeForRow = (val: string | null): string => {
                    if (!val) return ''
                    // If value contains comma, quote, backslash, or parens, it needs quoting
                    if (/[,()\\"]/.test(val)) {
                        // Escape backslashes and quotes, then wrap in quotes
                        return '"' + val.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"'
                    }
                    return val
                }

                // Return as PostgreSQL ROW format (x,y,z,url,json,blur,turl,tpar)
                return `(${escapeForRow(shape.x)},${escapeForRow(shape.y)},${escapeForRow(shape.z)},${escapeForRow(shape.url)},${escapeForRow(shape.json)},${escapeForRow(shape.blur)},${escapeForRow(shape.turl)},${escapeForRow(shape.tpar)})`
            } catch (e) {
                console.error('[regenerate-blur] Failed to parse shape:', shapeJson, e)
                return shapeJson
            }
        }

        // Update each shape with its blur hash (composite type columns)
        // The database trigger will automatically propagate to img_* JSONB columns
        const updatedSquare = updateShapeWithBlur(image.shape_square, blurHashes.square)
        const updatedThumb = updateShapeWithBlur(image.shape_thumb, blurHashes.thumb)
        const updatedWide = updateShapeWithBlur(image.shape_wide, blurHashes.wide)
        const updatedVertical = updateShapeWithBlur(image.shape_vertical, blurHashes.vertical)

        // Update the database - only shape_* columns, trigger handles img_*
        await db.run(`
            UPDATE images SET
                shape_square = ?,
                shape_thumb = ?,
                shape_wide = ?,
                shape_vertical = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [updatedSquare, updatedThumb, updatedWide, updatedVertical, id])

        console.log(`[regenerate-blur] Updated blur hashes for image ${id} (${image.xmlid})`)

        return {
            success: true,
            imageId: Number(id),
            xmlid: image.xmlid,
            blurHashes
        }
    } catch (error) {
        console.error('[regenerate-blur] Error:', error)

        if (error && typeof error === 'object' && 'statusCode' in error) {
            throw error
        }

        throw createError({
            statusCode: 500,
            message: `Failed to regenerate blur hashes: ${error}`
        })
    }
})
