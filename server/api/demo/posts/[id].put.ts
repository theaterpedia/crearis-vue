import { defineEventHandler, readBody, createError, getRouterParam } from 'h3'
import { db } from '../../../database/init'

export default defineEventHandler(async (event) => {
    try {
        const id = getRouterParam(event, 'id')
        const body = await readBody(event) as any

        if (!id) {
            throw createError({
                statusCode: 400,
                message: 'Post ID is required'
            })
        }

        // Update post in database
        const result = await db.run(
            `UPDATE posts SET 
        name = ?,
        teaser = ?,
        cimg = ?
      WHERE id = ?`,
            [
                body.name,
                body.teaser,
                body.cimg,
                id
            ]
        )

        // Fetch and return the updated post
        const updatedPost = await db.get('SELECT * FROM posts WHERE id = ?', [id])

        if (!updatedPost) {
            throw createError({
                statusCode: 404,
                message: 'Post not found'
            })
        }

        return {
            success: true,
            post: updatedPost
        }
    } catch (error: any) {
        console.error('Error updating post:', error)
        throw createError({
            statusCode: error.statusCode || 500,
            message: error.message || 'Failed to update post'
        })
    }
})
