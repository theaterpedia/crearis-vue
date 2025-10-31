import { defineEventHandler, getRouterParam, createError } from 'h3'
import { db } from '../../database/init'

/**
 * DELETE /api/images/:id
 * Delete an image (or set to trash status)
 * 
 * Note: Consider using soft delete by setting status_id to 'trash' (16)
 * instead of hard delete to preserve referential integrity
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
        // Check if image exists
        const existing = await db.get('SELECT id FROM images WHERE id = ?', [id])
        if (!existing) {
            throw createError({
                statusCode: 404,
                message: 'Image not found'
            })
        }

        // Check if image is referenced by any entities
        const references = await db.get(`
            SELECT 
                (SELECT COUNT(*) FROM users WHERE cimg_id = ?) +
                (SELECT COUNT(*) FROM instructors WHERE cimg_id = ?) +
                (SELECT COUNT(*) FROM events WHERE cimg_id = ?) +
                (SELECT COUNT(*) FROM locations WHERE cimg_id = ?) +
                (SELECT COUNT(*) FROM posts WHERE cimg_id = ?) +
                (SELECT COUNT(*) FROM projects WHERE cimg_id = ?) as ref_count
        `, [id, id, id, id, id, id])

        if (references && references.ref_count > 0) {
            // Soft delete: set to trash status instead of hard delete
            await db.run(
                'UPDATE images SET status_id = 16, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [id]
            )

            return {
                success: true,
                message: 'Image moved to trash (soft delete)',
                references: references.ref_count
            }
        }

        // Hard delete if no references
        await db.run('DELETE FROM images WHERE id = ?', [id])

        return {
            success: true,
            message: 'Image permanently deleted'
        }
    } catch (error) {
        console.error('Error deleting image:', error)

        if (error && typeof error === 'object' && 'statusCode' in error) {
            throw error
        }

        throw createError({
            statusCode: 500,
            message: 'Failed to delete image'
        })
    }
})
