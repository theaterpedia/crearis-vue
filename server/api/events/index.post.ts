import { defineEventHandler, readBody, createError } from 'h3'
import { db } from '../../database/init'
import type { EventsTableFields } from '../../types/database'

export default defineEventHandler(async (event) => {
    try {
        const body = await readBody(event)

        // Validate required fields
        if (!body.id || !body.name) {
            throw createError({
                statusCode: 400,
                message: 'Missing required fields: id, name'
            })
        }

        // Prepare data with only valid table fields
        const eventData: Partial<EventsTableFields> = {
            id: body.id,
            name: body.name,
            teaser: body.teaser || null,
            cimg: body.cimg || null,
            date_begin: body.date_begin || null,
            date_end: body.date_end || null,
            event_type: body.event_type || 'workshop',
            isbase: body.isbase || 0,
            project: body.project || null,
            template: body.template || null,
            public_user: body.public_user || null,
            location: body.location || null
        }

        // Insert event
        const sql = `
      INSERT INTO events (
        id, name, teaser, cimg, date_begin, date_end,
        event_type, isbase, project, template, public_user, location
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `

        await db.run(sql, [
            eventData.id,
            eventData.name,
            eventData.teaser,
            eventData.cimg,
            eventData.date_begin,
            eventData.date_end,
            eventData.event_type,
            eventData.isbase,
            eventData.project,
            eventData.template,
            eventData.public_user,
            eventData.location
        ])

        // Return the created event
        const created = await db.get('SELECT * FROM events WHERE id = ?', [body.id])

        return created
    } catch (error) {
        console.error('Error creating event:', error)

        // Check for unique constraint violation
        if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
            throw createError({
                statusCode: 409,
                message: 'Event with this ID already exists'
            })
        }

        throw createError({
            statusCode: 500,
            message: error instanceof Error ? error.message : 'Failed to create event'
        })
    }
})
