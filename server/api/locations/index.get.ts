import { defineEventHandler, getQuery, createError } from 'h3'
import { db } from '../../database/init'

export default defineEventHandler(async (event) => {
    try {
        const query = getQuery(event)

        let sql = 'SELECT * FROM locations WHERE 1=1'
        const params: any[] = []

        // Filter by isbase
        if (query.isbase !== undefined) {
            sql += ' AND isbase = ?'
            params.push(Number(query.isbase))
        }

        // Filter by event_id
        if (query.event_id) {
            sql += ' AND event_id = ?'
            params.push(query.event_id)
        }

        sql += ' ORDER BY name'

        const locations = await db.all(sql, params)

        return locations
    } catch (error) {
        console.error('Error fetching locations:', error)
        throw createError({
            statusCode: 500,
            message: 'Failed to fetch locations'
        })
    }
})
