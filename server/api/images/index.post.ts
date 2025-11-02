import { defineEventHandler, readBody, createError } from 'h3'
import { db } from '../../database/init'
import type { ImagesTableFields } from '../../types/database'

/**
 * POST /api/images - Create new image record
 */
export default defineEventHandler(async (event) => {
    try {
        const body = await readBody(event)

        if (!body.name || !body.url) {
            throw createError({
                statusCode: 400,
                message: 'Missing required fields: name and url'
            })
        }

        const imageData: Partial<ImagesTableFields> = {
            xmlid: body.xmlid || null,
            name: body.name,
            url: body.url,
            domaincode: body.domaincode || null,
            status_id: body.status_id || 0,
            owner_id: body.owner_id || null,
            alt_text: body.alt_text || null,
            title: body.title || null,
            x: body.x || null,
            y: body.y || null,
            fileformat: body.fileformat || 'none',
            embedformat: body.embedformat || null,
            license: body.license || 'BY',
            length: body.length || null
        }

        const sql = `
            INSERT INTO images (
                xmlid, name, url, domaincode, status_id, owner_id,
                alt_text, title, x, y, fileformat, embedformat, license, length
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            RETURNING id
        `

        const result = await db.run(sql, [
            imageData.xmlid,
            imageData.name,
            imageData.url,
            imageData.domaincode,
            imageData.status_id,
            imageData.owner_id,
            imageData.alt_text,
            imageData.title,
            imageData.x,
            imageData.y,
            imageData.fileformat,
            imageData.embedformat,
            imageData.license,
            imageData.length
        ])

        const newId = result.rows?.[0]?.id || result.lastID

        if (!newId) {
            throw new Error('Failed to get new image ID')
        }

        const created = await db.get('SELECT * FROM images WHERE id = ?', [newId])
        return created
    } catch (error) {
        console.error('Error creating image:', error)
        throw createError({
            statusCode: 500,
            message: error instanceof Error ? error.message : 'Failed to create image'
        })
    }
})
