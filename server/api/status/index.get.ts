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

        let sql = 'SELECT * FROM sysreg WHERE tagfamily = \'status\''
        const params: any[] = []

        if (query.id) {
            sql += ' AND id = $' + (params.length + 1)
            params.push(Number(query.id))
        }

        if (query.value !== undefined) {
            sql += ' AND value = $' + (params.length + 1)
            params.push(query.value)
        }

        if (query.name) {
            sql += ' AND name = $' + (params.length + 1)
            params.push(query.name)
        }

        sql += ' ORDER BY name'

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
