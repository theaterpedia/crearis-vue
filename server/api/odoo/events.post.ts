/**
 * POST /api/odoo/events
 * 
 * Create an event in Odoo via XML-RPC.
 * 
 * Body:
 *   - name: Event name (required)
 *   - date_begin: Start date ISO string (required)
 *   - date_end: End date ISO string (required)
 *   - event_type: 'simple_oneday' | 'multiple_days' | 'course' (default: simple_oneday)
 *   - seats_max: Maximum attendees (optional)
 *   - description: HTML description (optional)
 *   - project_id: Crearis project ID to link (optional)
 * 
 * Returns the created event data.
 * 
 * December 2025 - Alpha workaround
 */

import { defineEventHandler, readBody, createError, getCookie } from 'h3'
import { getOdooRpc } from '../../utils/odooRpc'
import { sessions } from '../auth/login.post'

// Event types we support
const VALID_EVENT_TYPES = ['simple_oneday', 'multiple_days', 'course'] as const
type EventType = typeof VALID_EVENT_TYPES[number]

interface CreateEventBody {
    name: string
    date_begin: string
    date_end: string
    event_type?: EventType
    seats_max?: number
    description?: string
    project_id?: number
    timezone?: string
}

export default defineEventHandler(async (event) => {
    // Check authentication (admin only for alpha)
    const sessionId = getCookie(event, 'sessionId')
    if (!sessionId) {
        throw createError({
            statusCode: 401,
            message: 'Authentication required'
        })
    }

    const session = sessions.get(sessionId)
    if (!session || session.expiresAt < Date.now()) {
        throw createError({
            statusCode: 401,
            message: 'Session expired'
        })
    }

    // TODO: Check if user is admin or has event creation permission
    // For alpha, we allow any authenticated user

    const body = await readBody(event) as CreateEventBody

    // Validate required fields
    if (!body.name?.trim()) {
        throw createError({
            statusCode: 400,
            message: 'Event name is required'
        })
    }

    if (!body.date_begin) {
        throw createError({
            statusCode: 400,
            message: 'Start date (date_begin) is required'
        })
    }

    if (!body.date_end) {
        throw createError({
            statusCode: 400,
            message: 'End date (date_end) is required'
        })
    }

    // Validate dates
    const dateBegin = new Date(body.date_begin)
    const dateEnd = new Date(body.date_end)

    if (isNaN(dateBegin.getTime())) {
        throw createError({
            statusCode: 400,
            message: 'Invalid start date format'
        })
    }

    if (isNaN(dateEnd.getTime())) {
        throw createError({
            statusCode: 400,
            message: 'Invalid end date format'
        })
    }

    if (dateEnd < dateBegin) {
        throw createError({
            statusCode: 400,
            message: 'End date must be after start date'
        })
    }

    // Validate event type
    const eventType = body.event_type || 'simple_oneday'
    if (!VALID_EVENT_TYPES.includes(eventType)) {
        throw createError({
            statusCode: 400,
            message: `Invalid event_type. Must be one of: ${VALID_EVENT_TYPES.join(', ')}`
        })
    }

    try {
        const odoo = getOdooRpc()

        // Format dates for Odoo (YYYY-MM-DD HH:MM:SS)
        const formatOdooDate = (date: Date) => {
            return date.toISOString().slice(0, 19).replace('T', ' ')
        }

        // Build Odoo values
        const values: Record<string, any> = {
            name: body.name.trim(),
            date_begin: formatOdooDate(dateBegin),
            date_end: formatOdooDate(dateEnd),
            date_tz: body.timezone || 'Europe/Berlin',
            // Custom field for event type
            x_studio_event_type: eventType,
        }

        // Optional fields
        if (body.seats_max !== undefined && body.seats_max > 0) {
            values.seats_max = body.seats_max
            values.seats_limited = true
        }

        if (body.description) {
            values.description = body.description
        }

        if (body.project_id) {
            values.x_studio_project_id = body.project_id
        }

        // Create in Odoo
        const odooId = await odoo.create('event.event', values)

        // Read back the created event
        const [created] = await odoo.read('event.event', [odooId], [
            'id', 'name', 'date_begin', 'date_end', 'date_tz', 'state',
            'seats_max', 'seats_available', 'x_studio_event_type'
        ])

        return {
            success: true,
            event: {
                id: created.id,
                odoo_id: created.id,
                name: created.name,
                date_begin: created.date_begin,
                date_end: created.date_end,
                timezone: created.date_tz,
                state: created.state,
                seats_max: created.seats_max,
                seats_available: created.seats_available,
                event_type: created.x_studio_event_type || eventType,
            },
            message: `Event "${body.name}" created in Odoo with ID ${odooId}`
        }
    } catch (error) {
        console.error('[/api/odoo/events POST] Error:', error)
        throw createError({
            statusCode: 500,
            message: error instanceof Error ? error.message : 'Failed to create event in Odoo'
        })
    }
})
