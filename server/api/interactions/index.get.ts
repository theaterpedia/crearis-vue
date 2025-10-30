import { defineEventHandler, getQuery, createError } from 'h3'
import { db } from '../../database/init'

/**
 * GET /api/interactions - List interactions with filters and sorting
 * 
 * Purpose: Retrieve form submissions with filtering and sorting capabilities
 * 
 * Query parameters:
 * - name: Filter by form name (exact match)
 * - project: Filter by project domaincode
 * - status_id: Filter by status ID
 * - user_id: Filter by user ID
 * - timestamp_from: Filter by timestamp >= (ISO 8601 format)
 * - timestamp_to: Filter by timestamp <= (ISO 8601 format)
 * - sort_by: Sort field (timestamp, name, id) - default: timestamp
 * - sort_order: Sort order (asc, desc) - default: desc
 * - limit: Max number of results (default: 100)
 * - offset: Pagination offset (default: 0)
 */
export default defineEventHandler(async (event) => {
    try {
        const query = getQuery(event)

        // Build SQL query
        let sql = `
            SELECT 
                i.*,
                p.domaincode AS project_domaincode,
                u.username AS user_name,
                s.name AS status_name,
                s.name_i18n AS status_name_i18n
            FROM interactions i
            LEFT JOIN projects p ON i.project_id = p.id
            LEFT JOIN users u ON i.user_id = u.id
            LEFT JOIN status s ON i.status_id = s.id
            WHERE 1=1
        `
        const params: any[] = []

        // Filter by form name
        if (query.name) {
            sql += ` AND i.name = ?`
            params.push(query.name)
        }

        // Filter by project domaincode
        if (query.project) {
            const project = await db.get('SELECT id FROM projects WHERE domaincode = ?', [query.project])
            if (project) {
                sql += ` AND i.project_id = ?`
                params.push(project.id)
            } else {
                // Project not found, return empty results
                return {
                    items: [],
                    total: 0,
                    limit: Number(query.limit) || 100,
                    offset: Number(query.offset) || 0
                }
            }
        }

        // Filter by status_id
        if (query.status_id) {
            sql += ` AND i.status_id = ?`
            params.push(Number(query.status_id))
        }

        // Filter by user_id
        if (query.user_id) {
            sql += ` AND i.user_id = ?`
            params.push(Number(query.user_id))
        }

        // Filter by user_email (from fields JSONB or from_mail)
        if (query.user_email) {
            sql += ` AND (i.from_mail = ? OR i.fields->>'email' = ?)`
            params.push(query.user_email, query.user_email)
        }

        // Filter by timestamp range
        if (query.timestamp_from) {
            sql += ` AND i.timestamp >= ?`
            params.push(query.timestamp_from)
        }

        if (query.timestamp_to) {
            sql += ` AND i.timestamp <= ?`
            params.push(query.timestamp_to)
        }

        // Get total count before pagination
        const countSql = sql.replace(
            /SELECT.*FROM/s,
            'SELECT COUNT(*) as total FROM'
        )
        const countResult = await db.get(countSql, params)
        const total = countResult?.total || 0

        // Add sorting
        const sortBy = query.sort_by || 'timestamp'
        const sortOrder = query.sort_order === 'asc' ? 'ASC' : 'DESC'

        // Validate sort_by to prevent SQL injection
        const validSortFields = ['timestamp', 'name', 'id', 'status_id', 'project_id']
        if (validSortFields.includes(sortBy as string)) {
            sql += ` ORDER BY i.${sortBy} ${sortOrder}`
        } else {
            sql += ` ORDER BY i.timestamp DESC`
        }

        // Add pagination
        const limit = Math.min(Number(query.limit) || 100, 1000) // Max 1000
        const offset = Number(query.offset) || 0

        sql += ` LIMIT ? OFFSET ?`
        params.push(limit, offset)

        // Execute query
        const interactions = await db.all(sql, params)

        // Parse JSON fields (only if they're strings, PostgreSQL JSONB returns objects directly)
        const parsedInteractions = interactions.map((interaction: any) => ({
            ...interaction,
            fields: typeof interaction.fields === 'string' ? JSON.parse(interaction.fields) : interaction.fields,
            actions: typeof interaction.actions === 'string' ? JSON.parse(interaction.actions) : interaction.actions
        }))

        return {
            items: parsedInteractions,
            total,
            limit,
            offset
        }

    } catch (error) {
        console.error('Error fetching interactions:', error)
        throw createError({
            statusCode: 500,
            message: 'Failed to fetch interactions'
        })
    }
})
