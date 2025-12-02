import { defineEventHandler, getQuery, createError } from 'h3'
import { db } from '../../database/init'

export default defineEventHandler(async (event) => {
    try {
        const query = getQuery(event)

        let sql = 'SELECT * FROM instructors WHERE 1=1'
        const params: any[] = []

        // Filter by status BYTEA value
        // Note: Status is now a BYTEA field, not a foreign key
        // status_eq: Filter by exact status value (hex string like '\\x02')
        if (query.status_eq !== undefined) {
            sql += ' AND status = $' + (params.length + 1)
            params.push(query.status_eq)
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
