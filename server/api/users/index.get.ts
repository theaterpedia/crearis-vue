import { defineEventHandler, createError, getQuery } from 'h3'
import { db } from '../../database/init'

/**
 * GET /api/users
 * Returns all users from the users table
 * Supports filtering by project_id via project_members
 * Used by AdminActionsShowcase to populate user selection
 */
export default defineEventHandler(async (event) => {
    try {
        const query = getQuery(event)

        let sql = `
            SELECT 
                u.id,
                u.username,
                u.role,
                u.created_at
            FROM users u
        `
        const params: any[] = []

        // Filter by project (via project_members)
        if (query.project_id) {
            sql = `
                SELECT DISTINCT
                    u.id,
                    u.username,
                    u.role,
                    u.created_at
                FROM users u
                INNER JOIN project_members pm ON u.id = pm.user_id
                WHERE pm.project_id = ?
            `
            params.push(query.project_id)
        }

        sql += ' ORDER BY u.username'

        const users = await db.all(sql, params)

        return users
    } catch (error) {
        console.error('Error fetching users:', error)
        throw createError({
            statusCode: 500,
            message: 'Failed to fetch users'
        })
    }
})
