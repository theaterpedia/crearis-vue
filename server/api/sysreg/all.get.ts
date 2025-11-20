/**
 * API Endpoint: GET /api/sysreg/all
 * 
 * Fetches all sysreg entries grouped by tagfamily.
 * Used for client-side caching and dropdown/filter options.
 * 
 * Returns:
 * {
 *   status: [...],
 *   config: [...],
 *   rtags: [...],
 *   ctags: [...],
 *   ttags: [...],
 *   dtags: [...]
 * }
 */

import { defineEventHandler, createError } from 'h3'
import { db } from '../../database/init'

export default defineEventHandler(async (event) => {
    try {
        // Fetch all sysreg entries
        const entries = await db.all(`
      SELECT 
        encode(value, 'hex') as value_hex,
        value,
        name,
        tagfamily,
        taglogic,
        is_default,
        name_i18n,
        desc_i18n
      FROM sysreg
      ORDER BY tagfamily, value
    `, [])

        // Group by tagfamily
        const grouped = {
            status: [] as any[],
            config: [] as any[],
            rtags: [] as any[],
            ctags: [] as any[],
            ttags: [] as any[],
            dtags: [] as any[]
        }

        for (const entry of entries) {
            const formatted = {
                value: `\\x${(entry as any).value_hex}`, // Format as BYTEA hex string
                name: (entry as any).name,
                tagfamily: (entry as any).tagfamily,
                taglogic: (entry as any).taglogic,
                is_default: (entry as any).is_default,
                name_i18n: (entry as any).name_i18n,
                desc_i18n: (entry as any).desc_i18n
            }

            const tagfamily = (entry as any).tagfamily as keyof typeof grouped
            if (grouped[tagfamily]) {
                grouped[tagfamily].push(formatted)
            }
        }

        return grouped
    } catch (error) {
        console.error('Error fetching sysreg data:', error)
        throw createError({
            statusCode: 500,
            statusMessage: 'Failed to fetch sysreg data'
        })
    }
})
