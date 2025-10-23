import { defineEventHandler, getQuery, createError } from 'h3'
import { db } from '../../database/init'

// GET /api/events - List events with optional filters
// After Migration 019 Chapter 5:
// - query.project accepts domaincode (TEXT)
// - events.project stores numeric project id as TEXT
export default defineEventHandler(async (event) => {
    try {
        const query = getQuery(event)

        let sql = 'SELECT * FROM events WHERE 1=1'
        const params: any[] = []

        // Filter by isbase
        if (query.isbase !== undefined) {
            sql += ' AND isbase = ?'
            params.push(Number(query.isbase))
        }

        // Filter by project (accepts domaincode, looks up numeric id)
        if (query.project) {
            // Lookup project numeric id by domaincode
            const project = await db.get('SELECT id FROM projects WHERE domaincode = ?', [query.project])
            if (project) {
                // events.project stores numeric id as TEXT
                sql += ' AND project = ?'
                params.push(String(project.id))
            } else {
                // If project not found, return empty results
                return []
            }
        }

        sql += ' ORDER BY id'

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
