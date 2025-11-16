import { defineEventHandler, getRouterParam, createError } from 'h3'
import { db } from '../../database/init'

export default defineEventHandler(async (event) => {
    try {
        const id = getRouterParam(event, 'id')

        if (!id) {
            throw createError({
                statusCode: 400,
                message: 'Event ID is required'
            })
        }

        // Check if event exists
        const existing = await db.get('SELECT id FROM events WHERE id = ?', [id])

        if (!existing) {
            throw createError({
                statusCode: 404,
                message: 'Event not found'
            })
        }

        // Delete the event
        await db.run('DELETE FROM events WHERE id = ?', [id])

        return { success: true, id }
    } catch (error) {
        console.error('Error deleting event:', error)

        if (error instanceof Error && 'statusCode' in error) {
            throw error
        }

        throw createError({
            statusCode: 500,
            message: 'Failed to delete event'
        })
    }
})
