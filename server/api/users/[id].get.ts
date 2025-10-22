import { defineEventHandler, getRouterParam, createError } from 'h3'
import { db } from '../../database/init'

/**
 * GET /api/users/:id
 * Returns a single user by ID
 * Used by AdminActionUsersPanel to load user data for alter/show actions
 * 
 * Database: PostgreSQL (default) - Uses unified adapter interface
 * Note: The db adapter automatically converts ? placeholders to $1, $2 for PostgreSQL
 */
export default defineEventHandler(async (event) => {
    const rawId = getRouterParam(event, 'id')

    // Decode the URL-encoded parameter (getRouterParam does NOT auto-decode)
    const id = rawId ? decodeURIComponent(rawId) : null

    if (!id) {
        throw createError({
            statusCode: 400,
            message: 'User ID is required'
        })
    }

    try {
        const user = await db.get(`
            SELECT 
                id,
                username,
                role,
                instructor_id,
                created_at
            FROM users
            WHERE id = ?
        `, [id])

        if (!user) {
            throw createError({
                statusCode: 404,
                message: 'User not found'
            })
        }

        return user
    } catch (error) {
        console.error('Error fetching user:', error)

        // Re-throw if already a H3 error
        if (error && typeof error === 'object' && 'statusCode' in error) {
            throw error
        }

        throw createError({
            statusCode: 500,
            message: 'Failed to fetch user'
        })
    }
})
