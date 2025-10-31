import { defineEventHandler, readBody, createError } from 'h3'
import { db } from '../../database/init'
import type { ImagesTableFields } from '../../types/database'

/**
 * POST /api/images
 * Create a new image record
 * Required fields: name, url, fileformat
 */
export default defineEventHandler(async (event) => {
    try {
        const body = await readBody(event) as Partial<ImagesTableFields> & { owner?: string }

        // Validate required fields
        if (!body.name || !body.url) {
            throw createError({
                statusCode: 400,
                message: 'Missing required fields: name, url'
            })
        }

        // Lookup owner_id if owner email/username provided
        let owner_id = body.owner_id || null
        if (body.owner && !owner_id) {
            const owner = await db.get(
                'SELECT id FROM users WHERE sysmail = ? OR username = ?',
                [body.owner, body.owner]
            )
            if (owner) {
                owner_id = owner.id
            }
        }

        // Prepare image data with defaults
        const imageData: Partial<ImagesTableFields> = {
            xmlid: body.xmlid || null,
            name: body.name,
            url: body.url,
            fileformat: body.fileformat || 'none',
            mediaformat: body.mediaformat || null,
            function: body.function || null,
            length: body.length || null,
            provider: body.provider || null,
            has_video: body.has_video || false,
            has_audio: body.has_audio || false,
            is_public: body.is_public || false,
            is_private: body.is_private || false,
            is_dark: body.is_dark || false,
            is_light: body.is_light || false,
            domaincode: body.domaincode || null,
            owner_id,
            date: body.date || new Date().toISOString(),
            geo: body.geo || null,
            x: body.x || null,
            y: body.y || null,
            copyright: body.copyright || null,
            alt_text: body.alt_text || null,
            title: body.title || null,
            status_id: body.status_id || 0, // default: new
            tags: body.tags || 0,
            av_x: body.av_x || null,
            av_y: body.av_y || null,
            av_z: body.av_z || 100,
            ca_x: body.ca_x || null,
            ca_y: body.ca_y || null,
            ca_z: body.ca_z || 100,
            he_x: body.he_x || null,
            he_y: body.he_y || null,
            he_z: body.he_z || 100
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

        if (!newId) {
            throw new Error('Failed to get new image ID')
        }

        // Get the created image
        const created = await db.get('SELECT * FROM images WHERE id = ?', [newId])

        return created
    } catch (error) {
        console.error('Error creating image:', error)

        if (error instanceof Error && error.message.includes('UNIQUE constraint')) {
            throw createError({
                statusCode: 409,
                message: 'Image with this xmlid already exists'
            })
        }

        throw createError({
            statusCode: 500,
            message: error instanceof Error ? error.message : 'Failed to create image'
        })
    }
})
