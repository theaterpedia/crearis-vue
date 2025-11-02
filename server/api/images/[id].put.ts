import { defineEventHandler, getRouterParam, readBody, createError } from 'h3'
import { db } from '../../database/init'
import type { ImagesTableFields } from '../../types/database'

/**
 * PUT /api/images/:id - Update image
 */
export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id')
    const body = await readBody(event)

    if (!id) {
        throw createError({
            statusCode: 400,
            message: 'Image ID is required'
        })
    }

    try {
        const existing = await db.get('SELECT id FROM images WHERE id = ?', [id])
        if (!existing) {
            throw createError({
                statusCode: 404,
                message: 'Image not found'
            })
        }

        const updates: string[] = []
        const values: any[] = []

        const allowedFields: (keyof ImagesTableFields)[] = [
            'name', 'url', 'alt_text', 'title', 'domaincode', 'status_id',
            'owner_id', 'x', 'y', 'fileformat', 'embedformat', 'license', 'length'
        ]

        for (const field of allowedFields) {
            if (body[field] !== undefined) {
                updates.push(`${field} = ?`)
                values.push(body[field])
            }
        }

        if (updates.length === 0) {
            throw createError({
                statusCode: 400,
                message: 'No fields to update'
            })
        }

        updates.push('updated_at = CURRENT_TIMESTAMP')
        values.push(id)

        const sql = `UPDATE images SET ${updates.join(', ')} WHERE id = ?`
        await db.run(sql, values)

        const updated = await db.get('SELECT * FROM images WHERE id = ?', [id])
        return updated
    } catch (error) {
        console.error('Error updating image:', error)
        throw createError({
            statusCode: 500,
            message: error instanceof Error ? error.message : 'Failed to update image'
        })
    }
})
