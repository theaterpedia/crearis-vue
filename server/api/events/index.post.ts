import { defineEventHandler, readBody, createError } from 'h3'
import { db } from '../../database/init'

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

        // Insert event
        const sql = `
      INSERT INTO events (
        id, name, teaser, cimg, date_begin, date_end,
        event_type, isbase, project, template, public_user, location
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `

        await db.run(sql, [
            body.id,
            body.name,
            body.teaser || null,
            body.cimg || null,
            body.date_begin || null,
            body.date_end || null,
            body.event_type || 'workshop',
            body.isbase || 0,
            body.project || null,
            body.template || null,
            body.public_user || null,
            body.location || null
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
