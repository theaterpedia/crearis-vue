import { defineEventHandler, getRouterParam, createError } from 'h3'
import { db } from '../../database/init'

/**
 * DELETE /api/images/:id - Delete image
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
        const existing = await db.get('SELECT id FROM images WHERE id = ?', [id])
        if (!existing) {
            throw createError({
                statusCode: 404,
                message: 'Image not found'
            })
        }

        await db.run('DELETE FROM images WHERE id = ?', [id])

        return {
            success: true,
            message: 'Image deleted successfully'
        }
    } catch (error) {
        console.error('Error deleting image:', error)
        throw createError({
            statusCode: 500,
            message: error instanceof Error ? error.message : 'Failed to delete image'
        })
    }
})
