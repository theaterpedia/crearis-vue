import { defineEventHandler, createError } from 'h3'
import { db } from '../../database/init'

/**
 * GET /api/users
 * Returns all users from the users table
 * Used by AdminActionsShowcase to populate user selection
 */
export default defineEventHandler(async () => {
    try {
        const users = await db.all(`
            SELECT 
                id,
                username,
                role,
                created_at
            FROM users
            ORDER BY username
        `)

        return users
    } catch (error) {
        console.error('Error fetching users:', error)
        throw createError({
            statusCode: 500,
            message: 'Failed to fetch users'
        })
    }
})
