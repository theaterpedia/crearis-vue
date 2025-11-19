import { defineEventHandler, getRouterParam, createError } from 'h3'
import { db } from '../../database/init'

// GET /api/posts/:id - Get a single post by ID
export default defineEventHandler(async (event) => {
    try {
        const id = getRouterParam(event, 'id')

        if (!id) {
            throw createError({
                statusCode: 400,
                message: 'Post ID is required'
            })
        }

        const sql = `
            SELECT 
                p.*,
                pr.domaincode AS domaincode
            FROM posts p
            LEFT JOIN projects pr ON p.project_id = pr.id
            WHERE p.id = ?
        `

        const post = await db.get(sql, [id])

        if (!post) {
            throw createError({
                statusCode: 404,
                message: 'Post not found'
            })
        }

        return { post }
    } catch (error: any) {
        // Re-throw if already a createError
        if (error.statusCode) {
            throw error
        }
        
        console.error('Error fetching post:', error)
        throw createError({
            statusCode: 500,
            message: 'Failed to fetch post'
        })
    }
})
