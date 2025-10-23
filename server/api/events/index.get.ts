import { defineEventHandler, getQuery, createError } from 'h3'
import { db } from '../../database/init'

// GET /api/events - List events with optional filters
// After Migration 019 Chapter 3B:
// - events.id is now INTEGER (auto-increment)
// - events.xmlid stores old TEXT id
// - events.project_id stores INTEGER FK to projects.id
// - query.project accepts domaincode (TEXT) for filtering
// - response includes domaincode from joined projects table
export default defineEventHandler(async (event) => {
    try {
        const query = getQuery(event)

        let sql = `
            SELECT 
                e.*,
                p.domaincode AS domaincode
            FROM events e
            LEFT JOIN projects p ON e.project_id = p.id
            WHERE 1=1
        `
        const params: any[] = []

        // Filter by isbase (if this field exists)
        if (query.isbase !== undefined) {
            sql += ' AND e.isbase = ?'
            params.push(Number(query.isbase))
        }

        // Filter by project (accepts domaincode, looks up project_id)
        if (query.project) {
            // Lookup project id by domaincode
            const project = await db.get('SELECT id FROM projects WHERE domaincode = ?', [query.project])
            if (project) {
                sql += ' AND e.project_id = ?'
                params.push(project.id)
            } else {
                // If project not found, return empty results
                return []
            }
        }

        sql += ' ORDER BY e.id'

        const events = await db.all(sql, params)

        return events
    } catch (error) {
        console.error('Error fetching events:', error)
        throw createError({
            statusCode: 500,
            message: 'Failed to fetch events'
        })
    }
})