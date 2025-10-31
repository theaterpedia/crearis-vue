import { defineEventHandler, readBody, createError } from 'h3'
import { db } from '../../database/init'
import type { EventsTableFields } from '../../types/database'

// POST /api/events - Create new event
// After Migration 019 Chapter 3B:
// - events.id is now INTEGER (auto-increment), not provided by client
// - events.xmlid can optionally store old TEXT id
// - events.project_id stores INTEGER FK to projects.id
// - body.project accepts domaincode (TEXT) for lookup
export default defineEventHandler(async (event) => {
    try {
        const body = await readBody(event)

        // Validate required fields
        if (!body.name) {
            throw createError({
                statusCode: 400,
                message: 'Missing required field: name'
            })
        }

        // Lookup project_id if project domaincode provided
        let projectId = null
        if (body.project) {
            const project = await db.get('SELECT id FROM projects WHERE domaincode = ?', [body.project])
            if (project) {
                projectId = project.id
            }
        }

        // Prepare data with only valid table fields
        const eventData: Partial<EventsTableFields> = {
            xmlid: body.xmlid || body.id || null, // Store old id as xmlid
            name: body.name,
            teaser: body.teaser || null,
            cimg: body.cimg || null,
            cimg_id: body.cimg_id || null,
            date_begin: body.date_begin || null,
            date_end: body.date_end || null,
            event_type: body.event_type || 'workshop',
            isbase: body.isbase || 0,
            project_id: projectId,
            template: body.template || null,
            public_user: body.public_user || null,
            location: body.location || null
        }

        // Insert event (id is auto-generated)
        const sql = `
            INSERT INTO events (
                xmlid, name, teaser, cimg, cimg_id, date_begin, date_end,
                event_type, isbase, project_id, template, public_user, location
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            RETURNING id
        `

        const result = await db.run(sql, [
            eventData.xmlid,
            eventData.name,
            eventData.teaser,
            eventData.cimg,
            eventData.cimg_id,
            eventData.date_begin,
            eventData.date_end,
            eventData.event_type,
            eventData.isbase,
            eventData.project_id,
            eventData.template,
            eventData.public_user,
            eventData.location
        ])

        // Extract the new event ID from the result
        // PostgreSQL: result.rows[0].id, SQLite: result.lastID
        const newId = result.rows?.[0]?.id || result.lastID

        if (!newId) {
            throw new Error('Failed to get new event ID')
        }

        // Get the created event with domaincode
        const created = await db.get(`
            SELECT 
                e.*,
                p.domaincode AS domaincode
            FROM events e
            LEFT JOIN projects p ON e.project_id = p.id
            WHERE e.id = ?
        `, [newId])

        return created
    } catch (error) {
        console.error('Error creating event:', error)

        // Check for unique constraint violation
        if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
            throw createError({
                statusCode: 409,
                message: 'Event with this xmlid already exists'
            })
        }

        throw createError({
            statusCode: 500,
            message: error instanceof Error ? error.message : 'Failed to create event'
        })
    }
})
