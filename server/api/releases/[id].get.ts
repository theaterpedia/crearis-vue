import { defineEventHandler, createError } from 'h3'
import db from '../../database/db'

export default defineEventHandler((event) => {
    try {
        const id = event.context.params?.id

        if (!id) {
            throw createError({
                statusCode: 400,
                message: 'Release ID is required'
            })
        }

        // Get release with task count
        const release = db.prepare(`
            SELECT 
                releases.*,
                COUNT(tasks.id) as task_count
            FROM releases
            LEFT JOIN tasks ON tasks.release_id = releases.id
            WHERE releases.id = ?
            GROUP BY releases.id
        `).get(id)

        if (!release) {
            throw createError({
                statusCode: 404,
                message: 'Release not found'
            })
        }

        return {
            success: true,
            release
        }
    } catch (error: any) {
        if (error.statusCode) {
            throw error
        }

        throw createError({
            statusCode: 500,
            message: 'Failed to fetch release',
            data: error
        })
    }
})
