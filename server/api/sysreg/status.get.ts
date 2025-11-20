import { defineEventHandler, getQuery, createError } from 'h3'
import { db } from '../../database/init'

/**
 * GET /api/sysreg/status - Get status entries from sysreg_status table
 * 
 * Query params:
 * - family: Filter by status family (e.g., 'events', 'posts', 'projects')
 * - name: Filter by exact status name (e.g., 'events > new')
 * 
 * Returns array of status entries with name, value (as hex), display info
 */
export default defineEventHandler(async (event) => {
    try {
        const query = getQuery(event)
        const family = query.family as string | undefined
        const name = query.name as string | undefined

        let sql = 'SELECT name, value, display_name_de, display_name_en FROM sysreg_status WHERE 1=1'
        const params: any[] = []

        // Filter by family (name starts with "family >")
        if (family) {
            sql += ' AND name LIKE ?'
            params.push(`${family} > %`)
        }

        // Filter by exact name
        if (name) {
            sql += ' AND name = ?'
            params.push(name)
        }

        sql += ' ORDER BY name'

        const results = await db.all(sql, params)

        // Convert BYTEA values to hex strings for JSON serialization
        const items = results.map((row: any) => ({
            name: row.name,
            value: row.value ? Buffer.from(row.value).toString('hex') : null,
            displayNameDe: row.display_name_de,
            displayNameEn: row.display_name_en
        }))

        return {
            items,
            count: items.length
        }
    } catch (error: any) {
        console.error('Error fetching sysreg_status:', error)
        throw createError({
            statusCode: 500,
            message: 'Failed to fetch status entries'
        })
    }
})
