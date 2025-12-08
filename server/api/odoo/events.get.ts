/**
 * GET /api/odoo/events
 * 
 * Read events from Odoo via XML-RPC.
 * 
 * Query params:
 *   - project_id: Filter by project (not yet implemented)
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

// Fields to fetch from Odoo (standard + Crearis custom fields)
// Note: 'state' field doesn't exist in Odoo 16 event.event - use 'stage_id' instead
const EVENT_FIELDS_BASIC = [
    // Standard Odoo event.event fields only
    'id',
    'name',
    'date_begin',
    'date_end',
    'date_tz',
    'stage_id',            // Event stage (replaces 'state' in Odoo 16)
    'kanban_state',        // Kanban state
    'seats_max',
    'seats_available',
    'seats_reserved',
    'seats_used',
    'seats_limited',
    'address_id',          // Location (many2one)
    'organizer_id',        // Organizer (many2one)
    'user_id',             // Responsible user
    'description',
    'note',
    'active',
    'event_type_id',       // Event type (many2one) - standard Odoo field!
]

// Crearis custom fields (add after confirming basic fields work)
const EVENT_FIELDS_CREARIS = [
    'cid',                 // Crearis ID (computed: domain.event-TYPE__id)
    'rectitle',            // Display title with domain prefix
    'teasertext',          // Short teaser
    'cimg',                // Hero image URL
    'md',                  // Markdown content
    'schedule',            // Schedule text
    'header_type',         // simple/columns/banner/cover/bauchbinde
    'header_size',         // mini/medium/prominent/full
    'edit_mode',           // locked/blocks/content/full
    'domain_code',         // Website/domain (many2one)
    'version',             // Version counter
]

// Website fields - might need website module
const EVENT_FIELDS_WEBSITE = [
    'is_published',
    'website_url',
]

// Use all fields now that parsing is fixed
const EVENT_FIELDS = [...EVENT_FIELDS_BASIC, ...EVENT_FIELDS_CREARIS, ...EVENT_FIELDS_WEBSITE]

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
            // Project filtering would require a custom field in Odoo
            // For now, we skip this filter - events are not linked to projects yet
            console.log('[/api/odoo/events] Project filter not yet implemented:', projectId)
        }

        // Fetch events from Odoo
        const events = await odoo.searchRead(
            'event.event',
            domain,
            EVENT_FIELDS,
            { limit, offset, order: 'date_begin asc' }
        )

        // Check if we got an error response
        if (!events || !Array.isArray(events)) {
            throw createError({
                statusCode: 500,
                message: 'Odoo returned invalid response'
            })
        }

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
            // Stage (Odoo 16 uses stage_id instead of state)
            stage_id: e.stage_id ? {
                id: (e.stage_id as any[])[0],
                name: (e.stage_id as any[])[1]
            } : null,
            kanban_state: e.kanban_state || 'normal',
            // Seats
            seats_max: e.seats_max,
            seats_available: e.seats_available,
            seats_reserved: e.seats_reserved,
            seats_used: e.seats_used,
            seats_limited: e.seats_limited,
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
            // Event type (from Odoo event.type)
            event_type_id: e.event_type_id ? {
                id: (e.event_type_id as any[])[0],
                name: (e.event_type_id as any[])[1]
            } : null,
            // Domain/site
            domain_code: e.domain_code ? {
                id: (e.domain_code as any[])[0],
                name: (e.domain_code as any[])[1]
            } : null,
            // Content
            description: e.description,
            note: e.note,
            // Status
            active: e.active,
            is_published: e.is_published,
            website_url: e.website_url,
            // Crearis custom fields
            cid: e.cid || null,
            rectitle: e.rectitle || e.name,
            teasertext: e.teasertext || null,
            cimg: e.cimg || null,
            md: e.md || null,
            schedule: e.schedule || null,
            header_type: e.header_type || 'simple',
            header_size: e.header_size || 'mini',
            edit_mode: e.edit_mode || 'content',
            version: e.version || 1,
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
