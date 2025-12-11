import { defineEventHandler, getQuery, createError } from 'h3'
import { db } from '../../database/init'

// GET /api/locations - Fetch partners with location role (partner_types & 2 = 2)
export default defineEventHandler(async (event) => {
    try {
        const query = getQuery(event)

        // Query partners table, filtering for locations (bit 1)
        let sql = `
            SELECT * FROM partners 
            WHERE partner_types & 2 = 2
        `
        const params: any[] = []

        // Filter by isbase
        if (query.isbase !== undefined) {
            sql += ' AND isbase = $' + (params.length + 1)
            params.push(Number(query.isbase))
        }

        sql += ' ORDER BY name'

        const partners = await db.all(sql, params)
        return partners
    } catch (error: any) {
        // Fallback to old locations table if partners doesn't exist
        if (error.message?.includes('partners')) {
            console.warn('Partners table not found, falling back to locations')
            const locations = await db.all('SELECT * FROM locations ORDER BY name', [])
            return locations
        }
        console.error('Error fetching partners (locations):', error)
        throw createError({
            statusCode: 500,
            message: 'Failed to fetch locations'
        })
    }
})
