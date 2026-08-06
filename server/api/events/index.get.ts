import { defineEventHandler, getQuery, createError } from 'h3'
import { db } from '../../database/init'
import { STATUS, WORKFLOW_MASK } from '../../../src/utils/status-constants'

// GET /api/events - List events with optional filters
// After Migration 019 Chapter 3B:
// - events.id is now INTEGER (auto-increment)
// - events.xmlid stores old TEXT id
// - events.project_id stores INTEGER FK to projects.id
// - query.project accepts domaincode (TEXT) for filtering
// - response includes domaincode from joined projects table
// Sysreg visibility (HD 2026-08-06: project.status decides — status_old is OFF):
// - default: only events of PUBLISHED projects (lifecycle ≥ RELEASED, below ARCHIVED)
// - ?alpha_preview=true widens the floor to DRAFT-tier (param name kept for compat)
// - ?skip_alpha_filter=true bypasses entirely (internal editing pages / dashboards)
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

        // Sysreg project-visibility filter (replaces the status_old alpha filter,
        // HD 2026-08-06). `status` is a HYBRID: ordinal-compare the MASKED low
        // 17 bits only, and bound out archived/trash — they sort above RELEASED.
        // Always on (no VITE_APP_MODE dependence); the two escape params keep
        // their established names and their established meanings.
        const skipAlphaFilter = query.skip_alpha_filter === 'true'
        if (!skipAlphaFilter) {
            const floor = query.alpha_preview === 'true' ? STATUS.DRAFT : STATUS.RELEASED
            sql += ` AND (p.status & ${WORKFLOW_MASK}) >= ? AND (p.status & ${WORKFLOW_MASK}) < ${STATUS.ARCHIVED}`
            params.push(floor)
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