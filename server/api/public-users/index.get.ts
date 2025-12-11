import { defineEventHandler, getQuery, createError } from 'h3'
import { db } from '../../database/init'

// GET /api/public-users - Fetch partners with instructor role (partner_types & 1 = 1)
// Uses partners table (Migration 061) with backwards-compatible filtering
export default defineEventHandler(async (event) => {
    try {
        const query = getQuery(event)

        // Query partners table, filtering for instructors (bit 0)
        // Falls back to instructors_v view if partners table doesn't exist yet
        let sql = `
            SELECT * FROM partners 
            WHERE partner_types & 1 = 1
        `
        const params: any[] = []

        // Filter by status value
        if (query.status_eq !== undefined) {
            sql += ' AND status = $' + (params.length + 1)
            params.push(query.status_eq)
        }

        sql += ' ORDER BY name'

        const partners = await db.all(sql, params)
        return partners
    } catch (error: any) {
        // Fallback to old instructors table if partners doesn't exist
        if (error.message?.includes('partners')) {
            console.warn('Partners table not found, falling back to instructors')
            const instructors = await db.all('SELECT * FROM instructors ORDER BY name', [])
            return instructors
        }
        console.error('Error fetching partners (instructors):', error)
        throw createError({
            statusCode: 500,
            message: 'Failed to fetch partners'
        })
    }
})
