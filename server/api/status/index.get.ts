import { defineEventHandler, getQuery, createError } from 'h3'
import { db } from '../../database/init'

/**
 * GET /api/status - Get status entries
 * 
 * Query parameters:
 * - table: Filter by table name
 * - value: Filter by value
 * - name: Filter by name
 */
export default defineEventHandler(async (event) => {
    try {
        const query = getQuery(event)

        let sql = 'SELECT * FROM status WHERE 1=1'
        const params: any[] = []

        if (query.id) {
            sql += ' AND id = ?'
            params.push(Number(query.id))
        }

        if (query.table) {
            sql += ' AND "table" = ?'
            params.push(query.table)
        }

        if (query.value !== undefined) {
            sql += ' AND value = ?'
            params.push(Number(query.value))
        }

        if (query.name) {
            sql += ' AND name = ?'
            params.push(query.name)
        }

        sql += ' ORDER BY "table", value'

        const items = await db.all(sql, params)

        return { items }
    } catch (error) {
        console.error('Error fetching status:', error)
        throw createError({
            statusCode: 500,
            message: 'Failed to fetch status entries'
        })
    }
})
