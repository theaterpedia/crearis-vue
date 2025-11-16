import { defineEventHandler, createError } from 'h3'
import { db } from '../../database/init'

export default defineEventHandler(async (event) => {
    try {
        const id = event.context.params?.id

        if (!id) {
            throw createError({
                statusCode: 400,
                message: 'Release ID is required'
            })
        }

        // Check if release exists
        const existingRelease = await db.get('SELECT * FROM releases WHERE id = ?', [id])
        if (!existingRelease) {
            throw createError({
                statusCode: 404,
                message: 'Release not found'
            })
        }

        // Check if there are tasks linked to this release
        const linkedTasks = await db.get('SELECT COUNT(*) as count FROM tasks WHERE release_id = ?', [id]) as { count: number }

        if (linkedTasks.count > 0) {
            // Set release_id to NULL for all linked tasks (due to ON DELETE SET NULL)
            // This is handled automatically by the foreign key constraint
        }

        // Delete the release
        await db.run('DELETE FROM releases WHERE id = ?', [id])

        return {
            success: true,
            message: 'Release deleted successfully',
            unlinked_tasks: linkedTasks.count
        }
    } catch (error: any) {
        if (error.statusCode) {
            throw error
        }

        throw createError({
            statusCode: 500,
            message: 'Failed to delete release',
            data: error
        })
    }
})
