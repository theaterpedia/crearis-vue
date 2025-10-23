import { defineEventHandler, createError, getQuery } from 'h3'
import { db } from '../../database/init'

/**
 * GET /api/users
 * Returns all users from the users table
 * Supports filtering by project_id (domaincode) via project_members
 * After Migration 019 Chapter 5:
 * - query.project_id accepts domaincode (TEXT)
 * - project_members.project_id stores numeric project id (INTEGER FK)
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

        // Filter by project (via project_members) - accepts domaincode
        if (query.project_id) {
            // Lookup project numeric id by domaincode
            const project = await db.get('SELECT id FROM projects WHERE domaincode = ?', [query.project_id])

            if (project) {
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
                params.push(project.id)  // Use numeric project id for FK join
            } else {
                // If project not found, return empty results
                return []
            }
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
