import { defineEventHandler, getQuery, createError } from 'h3'
import { db } from '../../database/init'

// GET /api/projects - List all projects
// After Migration 019 Chapter 5: Returns projects with proper field structure
// - id: auto-increment INTEGER
// - domaincode: unique TEXT identifier
// - name: project title/display name
// - heading: legacy field for backward compatibility
export default defineEventHandler(async (event) => {

    try {
        const query = getQuery(event)

        let sql = 'SELECT * FROM projects WHERE 1=1'
        const params: any[] = []

        // Filter by status value (0-6)
        // status_lt: less than (e.g., status_lt=3 returns status.value < 3)
        // status_eq: equal (e.g., status_eq=2 returns status.value = 2)
        // status_gt: greater than (e.g., status_gt=4 returns status.value > 4)
        if (query.status_lt !== undefined) {
            const statusValue = Number(query.status_lt)
            if (statusValue >= 0 && statusValue <= 6) {
                sql += ` AND status_id IN (SELECT id FROM status WHERE "table" = 'projects' AND value < ?)`
                params.push(statusValue)
            }
        }
        if (query.status_eq !== undefined) {
            const statusValue = Number(query.status_eq)
            if (statusValue >= 0 && statusValue <= 6) {
                sql += ` AND status_id IN (SELECT id FROM status WHERE "table" = 'projects' AND value = ?)`
                params.push(statusValue)
            }
        }
        if (query.status_gt !== undefined) {
            const statusValue = Number(query.status_gt)
            if (statusValue >= 0 && statusValue <= 6) {
                sql += ` AND status_id IN (SELECT id FROM status WHERE "table" = 'projects' AND value > ?)`
                params.push(statusValue)
            }
        }

        sql += ' ORDER BY created_at DESC'

        // Get all projects ordered by created date
        const rawProjects = await db.all(sql, params)

        // Return projects array directly (consistent with events/posts/instructors)
        return rawProjects
    } catch (error) {
        console.error('Error fetching projects:', error)
        throw createError({
            statusCode: 500,
            message: 'Failed to fetch projects'
        })
    }
})
