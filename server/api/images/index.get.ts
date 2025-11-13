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
                u.username as owner_username,
                s.name as status_name,
                p.name as project_name
            FROM images i
            LEFT JOIN users u ON i.owner_id = u.id
            LEFT JOIN status s ON i.status_id = s.id AND s.table = 'images'
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

        if (query.owner_id) {
            sql += ' AND i.owner_id = ?'
            params.push(Number(query.owner_id))
        }

        if (query.status_id !== undefined) {
            sql += ' AND i.status_id = ?'
            params.push(Number(query.status_id))
        }

        if (query.is_public !== undefined) {
            sql += ' AND i.is_public = ?'
            params.push(query.is_public === 'true' || query.is_public === '1')
        }

        // Filter by status value (0-6)
        // status_lt: less than (e.g., status_lt=3 returns status.value < 3)
        // status_eq: equal (e.g., status_eq=2 returns status.value = 2)
        // status_gt: greater than (e.g., status_gt=4 returns status.value > 4)
        if (query.status_lt !== undefined) {
            const statusValue = Number(query.status_lt)
            if (statusValue >= 0 && statusValue <= 6) {
                sql += ` AND i.status_id IN (SELECT id FROM status WHERE "table" = 'images' AND value < ?)`
                params.push(statusValue)
            }
        }
        if (query.status_eq !== undefined) {
            const statusValue = Number(query.status_eq)
            if (statusValue >= 0 && statusValue <= 6) {
                sql += ` AND i.status_id IN (SELECT id FROM status WHERE "table" = 'images' AND value = ?)`
                params.push(statusValue)
            }
        }
        if (query.status_gt !== undefined) {
            const statusValue = Number(query.status_gt)
            if (statusValue >= 0 && statusValue <= 6) {
                sql += ` AND i.status_id IN (SELECT id FROM status WHERE "table" = 'images' AND value > ?)`
                params.push(statusValue)
            }
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
