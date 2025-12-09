import { defineEventHandler, getQuery, createError } from 'h3'
import { db } from '../../database/init'

/**
 * GET /api/images - List images with optional filters
 */
export default defineEventHandler(async (event) => {
    try {
        const query = getQuery(event)

        let sql = `
            SELECT 
                i.*,
                u.username as creator_username,
                p.name as project_name
            FROM images i
            LEFT JOIN users u ON i.creator_id = u.id
            LEFT JOIN projects p ON i.project_id = p.id
            WHERE 1=1
        `
        const params: any[] = []

        if (query.project_domaincode) {
            sql += ' AND i.project_domaincode = ?'
            params.push(query.project_domaincode)
        }

        if (query.project_id) {
            sql += ' AND i.project_id = ?'
            params.push(Number(query.project_id))
        }

        // Accept both creator_id and owner_id for backward compatibility
        if (query.creator_id || query.owner_id) {
            sql += ' AND i.creator_id = ?'
            params.push(Number(query.creator_id || query.owner_id))
        }

        if (query.status_id !== undefined) {
            sql += ' AND i.status_id = ?'
            params.push(Number(query.status_id))
        }

        if (query.is_public !== undefined) {
            sql += ' AND i.is_public = ?'
            params.push(query.is_public === 'true' || query.is_public === '1')
        }

        // Filter by status value (bitmask: 1=NEW, 8=DEMO, 64=DRAFT, 256=REVIEW, 512=CONFIRMED, etc.)
        // status_lt: less than (e.g., status_lt=64 returns status < 64)
        // status_eq: equal (e.g., status_eq=64 returns status = 64)
        // status_gt: greater than (e.g., status_gt=64 returns status > 64)
        if (query.status_lt !== undefined) {
            const statusValue = Number(query.status_lt)
            sql += ` AND i.status < ?`
            params.push(statusValue)
        }
        if (query.status_eq !== undefined) {
            const statusValue = Number(query.status_eq)
            sql += ` AND i.status = ?`
            params.push(statusValue)
        }
        if (query.status_gt !== undefined) {
            const statusValue = Number(query.status_gt)
            sql += ` AND i.status > ?`
            params.push(statusValue)
        }

        // Filter by visibility (is_public, is_private, is_internal)
        if (query.visibility) {
            if (query.visibility === 'public') {
                sql += ' AND i.is_public = TRUE'
            } else if (query.visibility === 'private') {
                sql += ' AND i.is_private = TRUE'
            } else if (query.visibility === 'internal') {
                sql += ' AND i.is_internal = TRUE'
            }
        }

        // Filter by ctags (hex value, AND logic - all bits must match)
        if (query.ctags) {
            const ctagsHex = query.ctags.toString().replace(/^0x/, '')
            sql += ` AND (get_byte(i.ctags, 0) & x'${ctagsHex}'::int) = x'${ctagsHex}'::int`
        }

        // Filter by rtags (hex value, AND logic - all bits must match)
        if (query.rtags) {
            const rtagsHex = query.rtags.toString().replace(/^0x/, '')
            sql += ` AND (get_byte(i.rtags, 0) & x'${rtagsHex}'::int) = x'${rtagsHex}'::int`
        }

        sql += ' ORDER BY i.created_at DESC'

        const images = await db.all(sql, params)
        return images
    } catch (error) {
        console.error('Error fetching images:', error)
        throw createError({
            statusCode: 500,
            message: 'Failed to fetch images'
        })
    }
})
