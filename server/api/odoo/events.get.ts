/**
 * GET /api/odoo/events
 * 
 * Read events from Odoo via XML-RPC.
 * 
 * Query params:
 *   - project_id: Filter by project (via x_studio_project_id or similar)
 *   - limit: Max events to return (default 50)
 *   - offset: Pagination offset
 *   - upcoming: If 'true', only future events
 * 
 * Returns event data from Odoo event.event model.
 * 
 * December 2025 - Alpha workaround
 */

import { defineEventHandler, getQuery, createError } from 'h3'
import { getOdooRpc } from '../../utils/odooRpc'

// Fields to fetch from Odoo
const EVENT_FIELDS = [
    'id',
    'name',
    'date_begin',
    'date_end',
    'date_tz',
    'state',
    'seats_max',
    'seats_available',
    'seats_reserved',
    'seats_used',
    'address_id',          // Location (many2one)
    'organizer_id',        // Organizer (many2one)
    'user_id',             // Responsible user
    'description',
    'note',
    'active',
    'is_published',
    'website_url',
    // Custom fields (if exist)
    'x_studio_project_id',
    'x_studio_event_type', // simple_oneday, multiple_days, course
]

export default defineEventHandler(async (event) => {
    const query = getQuery(event)

    const projectId = query.project_id ? String(query.project_id) : undefined
    const limit = Math.min(100, Math.max(1, parseInt(String(query.limit || '50'), 10)))
    const offset = Math.max(0, parseInt(String(query.offset || '0'), 10))
    const upcoming = query.upcoming === 'true'

    try {
        const odoo = getOdooRpc()

        // Build domain filter
        const domain: any[] = [['active', '=', true]]

        if (upcoming) {
            const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
            domain.push(['date_begin', '>=', now])
        }

        if (projectId) {
            // Try custom field first, fallback to name search if not available
            domain.push(['x_studio_project_id', '=', parseInt(projectId, 10)])
        }

        // Fetch events from Odoo
        const events = await odoo.searchRead(
            'event.event',
            domain,
            EVENT_FIELDS,
            { limit, offset, order: 'date_begin asc' }
        )

        // Get total count for pagination
        const total = await odoo.count('event.event', domain)

        // Transform to frontend-friendly format
        const transformed = events.map(e => ({
            id: e.id,
            odoo_id: e.id,
            name: e.name,
            date_begin: e.date_begin,
            date_end: e.date_end,
            timezone: e.date_tz,
            state: e.state,
            // Seats
            seats_max: e.seats_max,
            seats_available: e.seats_available,
            seats_reserved: e.seats_reserved,
            seats_used: e.seats_used,
            // Relations (many2one returns [id, name] or false)
            location: e.address_id ? {
                id: (e.address_id as any[])[0],
                name: (e.address_id as any[])[1]
            } : null,
            organizer: e.organizer_id ? {
                id: (e.organizer_id as any[])[0],
                name: (e.organizer_id as any[])[1]
            } : null,
            responsible: e.user_id ? {
                id: (e.user_id as any[])[0],
                name: (e.user_id as any[])[1]
            } : null,
            // Content
            description: e.description,
            note: e.note,
            // Status
            active: e.active,
            is_published: e.is_published,
            website_url: e.website_url,
            // Custom
            project_id: e.x_studio_project_id,
            event_type: e.x_studio_event_type || 'simple_oneday',
        }))

        return {
            success: true,
            events: transformed,
            total,
            limit,
            offset,
            hasMore: offset + events.length < total
        }
    } catch (error) {
        console.error('[/api/odoo/events] Error:', error)
        throw createError({
            statusCode: 500,
            message: error instanceof Error ? error.message : 'Failed to fetch events from Odoo'
        })
    }
})
