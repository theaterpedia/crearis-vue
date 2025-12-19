import { defineEventHandler, getQuery, createError } from 'h3'
import { db } from '../../database/init'
import { isServerAlphaMode, getAlphaProjectStatuses } from '../../utils/alpha-mode'

// GET /api/events - List events with optional filters
// After Migration 019 Chapter 3B:
// - events.id is now INTEGER (auto-increment)
// - events.xmlid stores old TEXT id
// - events.project_id stores INTEGER FK to projects.id
// - query.project accepts domaincode (TEXT) for filtering
// - response includes domaincode from joined projects table
// Alpha mode (v0.4):
// - ?alpha_preview=true to include 'draft' projects (when in alpha mode)
// - Filters by projects.status_old instead of sysreg status
export default defineEventHandler(async (event) => {
    try {
        const query = getQuery(event)

        let sql = `
            SELECT 
                e.*,
                p.domaincode AS domaincode,
                p.status_old AS project_status_old
            FROM events e
            LEFT JOIN projects p ON e.project_id = p.id
            WHERE 1=1
        `
        const params: any[] = []

        // Alpha mode: filter by projects.status_old
        // TODO v0.5: Remove this block when migrating to full sysreg status
        if (isServerAlphaMode()) {
            const alphaPreview = query.alpha_preview === 'true'
            const validStatuses = getAlphaProjectStatuses(alphaPreview)
            // Use ? placeholders - adapter converts to $1, $2 for PostgreSQL
            sql += ` AND p.status_old IN (${validStatuses.map(() => '?').join(', ')})`
            params.push(...validStatuses)
        }

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

        // Filter by status value (bitmask: 1=NEW, 8=DEMO, 64=DRAFT, 256=REVIEW, 512=CONFIRMED, etc.)
        // status_lt: less than (e.g., status_lt=64 returns status < 64)
        // status_eq: equal (e.g., status_eq=64 returns status = 64)
        // status_gt: greater than (e.g., status_gt=64 returns status > 64)
        if (query.status_lt !== undefined) {
            const statusValue = Number(query.status_lt)
            sql += ` AND e.status < ?`
            params.push(statusValue)
        }
        if (query.status_eq !== undefined) {
            const statusValue = Number(query.status_eq)
            sql += ` AND e.status = ?`
            params.push(statusValue)
        }
        if (query.status_gt !== undefined) {
            const statusValue = Number(query.status_gt)
            sql += ` AND e.status > ?`
            params.push(statusValue)
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