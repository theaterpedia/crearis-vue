import { defineEventHandler, readBody, createError, getRouterParam } from 'h3'
import { db } from '../../../database/init'

export default defineEventHandler(async (event) => {
    try {
        const id = getRouterParam(event, 'id')
        const body = await readBody(event) as any

        if (!id) {
            throw createError({
                statusCode: 400,
                message: 'Event ID is required'
            })
        }

        // Update event in database
        const result = await db.run(
            `UPDATE events SET 
        name = ?,
        teaser = ?,
        date_begin = ?,
        date_end = ?,
        project_id = ?,
        img_id = ?,
        cimg = ?
      WHERE id = ?`,
            [
                body.name,
                body.teaser,
                body.date_begin,
                body.date_end,
                body.project_id,
                body.img_id,
                body.cimg,
                id
            ]
        )

        // Fetch and return the updated event
        const updatedEvent = await db.get('SELECT * FROM events WHERE id = ?', [id])

        if (!updatedEvent) {
            throw createError({
                statusCode: 404,
                message: 'Event not found'
            })
        }

        return {
            success: true,
            event: updatedEvent
        }
    } catch (error: any) {
        console.error('Error updating event:', error)
        throw createError({
            statusCode: error.statusCode || 500,
            message: error.message || 'Failed to update event'
        })
    }
})
