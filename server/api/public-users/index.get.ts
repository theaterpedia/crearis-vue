import { defineEventHandler, getQuery, createError } from 'h3'
import { db } from '../../database/init'

export default defineEventHandler(async (event) => {
    try {
        const query = getQuery(event)

        let sql = 'SELECT * FROM instructors WHERE 1=1'
        const params: any[] = []

        // Filter by status value (0-6)
        // status_lt: less than (e.g., status_lt=3 returns status.value < 3)
        // status_eq: equal (e.g., status_eq=2 returns status.value = 2)
        // status_gt: greater than (e.g., status_gt=4 returns status.value > 4)
        if (query.status_lt !== undefined) {
            const statusValue = Number(query.status_lt)
            if (statusValue >= 0 && statusValue <= 6) {
                sql += ` AND status_id IN (SELECT id FROM status WHERE "table" = 'persons' AND value < ?)`
                params.push(statusValue)
            }
        }
        if (query.status_eq !== undefined) {
            const statusValue = Number(query.status_eq)
            if (statusValue >= 0 && statusValue <= 6) {
                sql += ` AND status_id IN (SELECT id FROM status WHERE "table" = 'persons' AND value = ?)`
                params.push(statusValue)
            }
        }
        if (query.status_gt !== undefined) {
            const statusValue = Number(query.status_gt)
            if (statusValue >= 0 && statusValue <= 6) {
                sql += ` AND status_id IN (SELECT id FROM status WHERE "table" = 'persons' AND value > ?)`
                params.push(statusValue)
            }
        }

        sql += ' ORDER BY name'

        const instructors = await db.all(sql, params)
        return instructors
    } catch (error) {
        console.error('Error fetching instructors:', error)
        throw createError({
            statusCode: 500,
            message: 'Failed to fetch instructors'
        })
    }
})
