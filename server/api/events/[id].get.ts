import { defineEventHandler, getRouterParam, createError } from 'h3'
import { db } from '../../database/init'

// GET /api/events/:id - Get a single event by ID
export default defineEventHandler(async (event) => {
    try {
        const id = getRouterParam(event, 'id')

        if (!id) {
            throw createError({
                statusCode: 400,
                message: 'Event ID is required'
            })
        }

        const sql = `
            SELECT 
                e.*,
                e.user_id AS creator_id,
                pr.domaincode AS domaincode,
                loc.name AS location_name,
                creator.username AS creator_name
            FROM events e
            LEFT JOIN projects pr ON e.project_id = pr.id
            LEFT JOIN partners loc ON e.location = loc.id
            LEFT JOIN users creator ON e.user_id = creator.id
            WHERE e.id = ?
        `

        const eventData = await db.get(sql, [id])

        if (!eventData) {
            throw createError({
                statusCode: 404,
                message: 'Event not found'
            })
        }

        return { event: eventData }
    } catch (error: any) {
        // Re-throw if already a createError
        if (error.statusCode) {
            throw error
        }

        console.error('Error fetching event:', error)
        throw createError({
            statusCode: 500,
            message: 'Failed to fetch event'
        })
    }
})
