import { defineEventHandler, createError } from 'h3'
import { db } from '../../database/db-new'

export default defineEventHandler(async (event) => {
    try {
        const id = event.context.params?.id

        if (!id) {
            throw createError({
                statusCode: 400,
                message: 'Task ID is required'
            })
        }

        // Check if task exists
        const existingTask = await db.get('SELECT * FROM tasks WHERE id = ?', [id])
        if (!existingTask) {
            throw createError({
                statusCode: 404,
                message: 'Task not found'
            })
        }

        // Delete the task
        await db.run('DELETE FROM tasks WHERE id = ?', [id])

        return {
            success: true,
            message: 'Task deleted successfully',
            deletedTask: existingTask
        }
    } catch (error: any) {
        if (error.statusCode) {
            throw error
        }

        throw createError({
            statusCode: 500,
            message: 'Failed to delete task',
            data: error
        })
    }
})
