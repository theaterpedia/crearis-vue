import { defineEventHandler, getRouterParam, readBody, createError } from 'h3'
import { db } from '../../database/init'
import type { ImagesTableFields } from '../../types/database'

/**
 * PUT /api/images/:id
 * Update an existing image
 */
export default defineEventHandler(async (event) => {
    const rawId = getRouterParam(event, 'id')
    const id = rawId ? decodeURIComponent(rawId) : null

    if (!id) {
        throw createError({
            statusCode: 400,
            message: 'Image ID is required'
        })
    }

    const body = await readBody(event) as Partial<ImagesTableFields>

    try {
        // Check if image exists
        const existing = await db.get('SELECT id FROM images WHERE id = ?', [id])
        if (!existing) {
            throw createError({
                statusCode: 404,
                message: 'Image not found'
            })
        }

        // Build update query dynamically based on provided fields
        const updateFields: string[] = []
        const params: any[] = []

        // Fields that can be updated
        const allowedFields: (keyof ImagesTableFields)[] = [
            'xmlid', 'name', 'url', 'fileformat', 'mediaformat', 'function', 'length',
            'provider', 'has_video', 'has_audio', 'is_public', 'is_private', 'is_dark',
            'is_light', 'domaincode', 'owner_id', 'date', 'geo', 'x', 'y', 'copyright',
            'alt_text', 'title', 'status_id', 'tags', 'av_x', 'av_y', 'av_z',
            'ca_x', 'ca_y', 'ca_z', 'he_x', 'he_y', 'he_z'
        ]

        for (const field of allowedFields) {
            if (body[field] !== undefined) {
                // Handle JSONB field
                if (field === 'geo' && body[field] !== null) {
                    updateFields.push(`${field} = ?`)
                    params.push(JSON.stringify(body[field]))
                } else {
                    updateFields.push(`${field} = ?`)
                    params.push(body[field])
                }
            }
        }

        if (updateFields.length === 0) {
            throw createError({
                statusCode: 400,
                message: 'No valid fields to update'
            })
        }

        // Add updated_at timestamp
        updateFields.push('updated_at = CURRENT_TIMESTAMP')

        // Add the id as the last parameter for WHERE clause
        params.push(id)

        const updateQuery = `
            UPDATE images 
            SET ${updateFields.join(', ')}
            WHERE id = ?
        `

        await db.run(updateQuery, params)

        // Fetch and return the updated image
        const updated = await db.get('SELECT * FROM images WHERE id = ?', [id])

        return updated
    } catch (error) {
        console.error('Error updating image:', error)

        if (error && typeof error === 'object' && 'statusCode' in error) {
            throw error
        }

        throw createError({
            statusCode: 500,
            message: 'Failed to update image'
        })
    }
})
