/**
 * API Endpoint: GET /api/sysreg/all
 * 
 * Fetches all sysreg entries grouped by tagfamily.
 * Used for client-side caching and dropdown/filter options.
 * 
 * Note: After Migration 036, sysreg.value is INTEGER (not BYTEA).
 * Values are power-of-2 integers (1, 2, 4, 8, 16, etc.) representing bit positions.
 * 
 * Returns:
 * {
 *   status: [{ id, value: number, name, tagfamily, taglogic, ... }],
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
        // Note: After Migration 036, value is INTEGER (not BYTEA)
        // Note: After Migration 037, parent_bit added for subcategory relationships
        const entries = await db.all(`
      SELECT 
        id,
        value,
        name,
        tagfamily,
        taglogic,
        is_default,
        name_i18n,
        desc_i18n,
        parent_bit
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
                id: (entry as any).id,
                value: (entry as any).value, // INTEGER value (after Migration 036)
                name: (entry as any).name,
                tagfamily: (entry as any).tagfamily,
                taglogic: (entry as any).taglogic,
                is_default: (entry as any).is_default,
                name_i18n: (entry as any).name_i18n,
                desc_i18n: (entry as any).desc_i18n,
                parent_bit: (entry as any).parent_bit // Added in Migration 037
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
