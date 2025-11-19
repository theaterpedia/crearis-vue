import { defineEventHandler, getRouterParam, createError } from 'h3'
import { db } from '../../database/init'

/**
 * GET /api/images/:id - Get single image by ID
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
        const image = await db.get(`
            SELECT 
                i.*,
                u.username as owner_username
            FROM images i
            LEFT JOIN users u ON i.owner_id = u.id
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

        // Re-throw if already a H3 error
        if (error && typeof error === 'object' && 'statusCode' in error) {
            throw error
        }

        throw createError({
            statusCode: 500,
            message: 'Failed to fetch image'
        })
    }
})
