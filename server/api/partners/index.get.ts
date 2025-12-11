import { defineEventHandler, getQuery, createError } from 'h3'
import { db } from '../../database/init'

/**
 * GET /api/partners
 * Search partners for onboarding flow
 * 
 * Query params:
 * - search: Search term for name (min 2 chars)
 * - limit: Max results (default 10)
 */
export default defineEventHandler(async (event) => {
    const query = getQuery(event)
    const search = query.search as string
    const limit = Math.min(Number(query.limit) || 10, 50)

    try {
        let sql = 'SELECT id, name, partner_types, user_id FROM partners WHERE 1=1'
        const params: any[] = []

        if (search && search.length >= 2) {
            sql += ' AND name ILIKE ?'
            params.push(`%${search}%`)
        }

        sql += ' ORDER BY name ASC LIMIT ?'
        params.push(limit)

        const partners = await db.all(sql, params)
        return partners
    } catch (error) {
        console.error('Error fetching partners:', error)
        throw createError({
            statusCode: 500,
            message: 'Failed to fetch partners'
        })
    }
})
