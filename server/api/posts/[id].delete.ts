import { defineEventHandler, getRouterParam, createError } from 'h3'
import { db } from '../../database/init'

export default defineEventHandler(async (event) => {
    try {
        const id = getRouterParam(event, 'id')

        if (!id) {
            throw createError({
                statusCode: 400,
                message: 'Post ID is required'
            })
        }

        // Check if post exists
        const existing = await db.get('SELECT id FROM posts WHERE id = ?', [id])

        if (!existing) {
            throw createError({
                statusCode: 404,
                message: 'Post not found'
            })
        }

        // Delete the post
        await db.run('DELETE FROM posts WHERE id = ?', [id])

        return { success: true, id }
    } catch (error) {
        console.error('Error deleting post:', error)

        if (error instanceof Error && 'statusCode' in error) {
            throw error
        }

        throw createError({
            statusCode: 500,
            message: 'Failed to delete post'
        })
    }
})
