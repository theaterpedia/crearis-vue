import { defineEventHandler, readBody, createError } from 'h3'
import { db } from '../../database/init'
import type { ImagesTableFields } from '../../types/database'

/**
 * POST /api/images/batch
 * Batch import images from an array of image records
 * Useful for importing multiple images at once
 * 
 * Request body:
 * {
 *   images: Array<Partial<ImagesTableFields>>
 * }
 */
export default defineEventHandler(async (event) => {
    try {
        const body = await readBody(event) as { images: Array<Partial<ImagesTableFields> & { owner?: string }> }

        if (!body.images || !Array.isArray(body.images)) {
            throw createError({
                statusCode: 400,
                message: 'Request must include an array of images'
            })
        }

        if (body.images.length === 0) {
            throw createError({
                statusCode: 400,
                message: 'Images array cannot be empty'
            })
        }

        if (body.images.length > 100) {
            throw createError({
                statusCode: 400,
                message: 'Batch size limited to 100 images per request'
            })
        }

        const results = {
            success: [] as number[],
            failed: [] as { index: number; error: string }[],
            total: body.images.length
        }

        // Process each image
        for (let i = 0; i < body.images.length; i++) {
            const imageInput = body.images[i]

            try {
                // Validate required fields
                if (!imageInput.name || !imageInput.url) {
                    results.failed.push({
                        index: i,
                        error: 'Missing required fields: name, url'
                    })
                    continue
                }

                // Lookup owner_id if owner email/username provided
                let owner_id = imageInput.owner_id || null
                if (imageInput.owner && !owner_id) {
                    const owner = await db.get(
                        'SELECT id FROM users WHERE sysmail = ? OR username = ?',
                        [imageInput.owner, imageInput.owner]
                    )
                    if (owner) {
                        owner_id = owner.id
                    }
                }

                // Prepare image data with defaults
                const imageData: Partial<ImagesTableFields> = {
                    xmlid: imageInput.xmlid || null,
                    name: imageInput.name,
                    url: imageInput.url,
                    fileformat: imageInput.fileformat || 'none',
                    mediaformat: imageInput.mediaformat || null,
                    function: imageInput.function || null,
                    length: imageInput.length || null,
                    provider: imageInput.provider || null,
                    has_video: imageInput.has_video || false,
                    has_audio: imageInput.has_audio || false,
                    is_public: imageInput.is_public || false,
                    is_private: imageInput.is_private || false,
                    is_dark: imageInput.is_dark || false,
                    is_light: imageInput.is_light || false,
                    domaincode: imageInput.domaincode || null,
                    owner_id,
                    date: imageInput.date || new Date().toISOString(),
                    geo: imageInput.geo || null,
                    x: imageInput.x || null,
                    y: imageInput.y || null,
                    copyright: imageInput.copyright || null,
                    alt_text: imageInput.alt_text || null,
                    title: imageInput.title || null,
                    status_id: imageInput.status_id || 0, // default: new
                    tags: imageInput.tags || 0,
                    av_x: imageInput.av_x || null,
                    av_y: imageInput.av_y || null,
                    av_z: imageInput.av_z || 100,
                    ca_x: imageInput.ca_x || null,
                    ca_y: imageInput.ca_y || null,
                    ca_z: imageInput.ca_z || 100,
                    he_x: imageInput.he_x || null,
                    he_y: imageInput.he_y || null,
                    he_z: imageInput.he_z || 100
                }

                // Insert image
                const sql = `
                    INSERT INTO images (
                        xmlid, name, url, fileformat, mediaformat, function, length, provider,
                        has_video, has_audio, is_public, is_private, is_dark, is_light,
                        domaincode, owner_id, date, geo, x, y, copyright, alt_text, title,
                        status_id, tags, av_x, av_y, av_z, ca_x, ca_y, ca_z, he_x, he_y, he_z
                    ) VALUES (
                        ?, ?, ?, ?, ?, ?, ?, ?,
                        ?, ?, ?, ?, ?, ?,
                        ?, ?, ?, ?, ?, ?, ?, ?, ?,
                        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
                    )
                    RETURNING id
                `

                const result = await db.run(sql, [
                    imageData.xmlid,
                    imageData.name,
                    imageData.url,
                    imageData.fileformat,
                    imageData.mediaformat,
                    imageData.function,
                    imageData.length,
                    imageData.provider,
                    imageData.has_video,
                    imageData.has_audio,
                    imageData.is_public,
                    imageData.is_private,
                    imageData.is_dark,
                    imageData.is_light,
                    imageData.domaincode,
                    imageData.owner_id,
                    imageData.date,
                    imageData.geo ? JSON.stringify(imageData.geo) : null,
                    imageData.x,
                    imageData.y,
                    imageData.copyright,
                    imageData.alt_text,
                    imageData.title,
                    imageData.status_id,
                    imageData.tags,
                    imageData.av_x,
                    imageData.av_y,
                    imageData.av_z,
                    imageData.ca_x,
                    imageData.ca_y,
                    imageData.ca_z,
                    imageData.he_x,
                    imageData.he_y,
                    imageData.he_z
                ])

                const newId = result.rows?.[0]?.id || result.lastID

                if (newId) {
                    results.success.push(newId)
                } else {
                    results.failed.push({
                        index: i,
                        error: 'Failed to get new image ID'
                    })
                }
            } catch (error) {
                results.failed.push({
                    index: i,
                    error: error instanceof Error ? error.message : 'Unknown error'
                })
            }
        }

        return {
            success: true,
            imported: results.success.length,
            failed: results.failed.length,
            total: results.total,
            results
        }
    } catch (error) {
        console.error('Error in batch import:', error)

        if (error && typeof error === 'object' && 'statusCode' in error) {
            throw error
        }

        throw createError({
            statusCode: 500,
            message: error instanceof Error ? error.message : 'Failed to import images'
        })
    }
})
