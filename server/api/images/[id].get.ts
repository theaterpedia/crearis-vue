import { defineEventHandler, getRouterParam, createError } from 'h3'
import { db } from '../../database/init'

/**
 * GET /api/images/:id
 * Returns a single image by ID with related data
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

    try {
        const image = await db.get(`
            SELECT 
                i.*,
                u.username as owner_username,
                s.name as status_name
            FROM images i
            LEFT JOIN users u ON i.owner_id = u.id
            LEFT JOIN status s ON i.status_id = s.id AND s.table = 'images'
            WHERE i.id = ?
        `, [id])

        if (!image) {
            throw createError({
                statusCode: 404,
                message: 'Image not found'
            })
        }

        return image
    } catch (error) {
        console.error('Error fetching image:', error)

        if (error && typeof error === 'object' && 'statusCode' in error) {
            throw error
        }

        throw createError({
            statusCode: 500,
            message: 'Failed to fetch image'
        })
    }
})
