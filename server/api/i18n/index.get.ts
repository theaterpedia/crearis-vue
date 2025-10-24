import { defineEventHandler, getQuery, createError } from 'h3'
import { db } from '../../database/init'
import type { I18nCodesTableFields } from '../../types/database'

/**
 * GET /api/i18n
 * 
 * List i18n codes with optional filtering and ordering
 * 
 * Query parameters:
 * - status: Filter by status (de, en, cz, draft, ok)
 * - name: Filter by name (exact match)
 * - variation: Filter by variation (exact match, use 'false' for root entries)
 * - type: Filter by type (button, nav, field, desc)
 * - orderBy: Order by field (name, type, status, variation)
 * - order: Order direction (asc, desc)
 * - preload: If 'true', only return button and nav types (for initial load)
 */
export default defineEventHandler(async (event) => {
    try {
        const query = getQuery(event)

        const filters: string[] = []
        const params: any[] = []
        let paramIndex = 1

        // Build WHERE clause
        if (query.status) {
            filters.push(`status = $${paramIndex}`)
            params.push(query.status)
            paramIndex++
        }

        if (query.name) {
            filters.push(`name = $${paramIndex}`)
            params.push(query.name)
            paramIndex++
        }

        if (query.variation !== undefined) {
            filters.push(`variation = $${paramIndex}`)
            params.push(query.variation)
            paramIndex++
        }

        if (query.type) {
            filters.push(`type = $${paramIndex}`)
            params.push(query.type)
            paramIndex++
        }

        // Preload filter: only button and nav types
        if (query.preload === 'true') {
            filters.push(`type IN ('button', 'nav')`)
            filters.push(`variation = 'false'`) // Only root entries for preload
        }

        const whereClause = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : ''

        // Build ORDER BY clause
        let orderBy = 'name ASC' // Default ordering
        if (query.orderBy) {
            const validOrderFields = ['name', 'type', 'status', 'variation', 'created_at', 'updated_at']
            const orderField = String(query.orderBy)

            if (validOrderFields.includes(orderField)) {
                const orderDir = query.order === 'desc' ? 'DESC' : 'ASC'
                orderBy = `${orderField} ${orderDir}`
            }
        }

        // Execute query
        const sql = `
            SELECT id, name, variation, type, text, status, created_at, updated_at
            FROM i18n_codes
            ${whereClause}
            ORDER BY ${orderBy}
        `

        const results = await db.all(sql, params) as I18nCodesTableFields[]

        // Parse text field from JSON string (SQLite) to object
        const parsedResults = results.map(row => ({
            ...row,
            text: typeof row.text === 'string' ? JSON.parse(row.text) : row.text
        }))

        return {
            success: true,
            count: parsedResults.length,
            i18n_codes: parsedResults
        }
    } catch (error: any) {
        console.error('Error fetching i18n codes:', error)
        throw createError({
            statusCode: 500,
            message: 'Failed to fetch i18n codes',
            data: error
        })
    }
})
