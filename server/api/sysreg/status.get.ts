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

        let sql = 'SELECT name, value, name_i18n, desc_i18n FROM sysreg_status WHERE 1=1'
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

        sql += ' ORDER BY value'

        console.log('[sysreg/status] Executing SQL:', sql, 'with params:', params)
        const results = await db.all(sql, params)
        console.log('[sysreg/status] Query returned', results.length, 'rows')
        console.log('[sysreg/status] First row sample:', results[0])

        // Convert BYTEA values to hex strings and extract i18n names
        const items = results.map((row: any, index: number) => {
            try {
                console.log(`[sysreg/status] Processing row ${index}:`, {
                    name: row.name,
                    value_type: typeof row.value,
                    value_isBuffer: Buffer.isBuffer(row.value),
                    name_i18n_type: typeof row.name_i18n
                })
                
                // name_i18n is already parsed as object by PostgreSQL driver
                const nameI18n = row.name_i18n || {}
                // row.value is already a Buffer from PostgreSQL
                const hexValue = row.value ? (Buffer.isBuffer(row.value) ? row.value.toString('hex') : row.value) : null
                
                return {
                    name: row.name,
                    value: hexValue,
                    displayNameDe: nameI18n.de || row.name,
                    displayNameEn: nameI18n.en || row.name
                }
            } catch (err) {
                console.error(`[sysreg/status] Error processing row ${index}:`, err, 'row:', row)
                throw err
            }
        })

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
