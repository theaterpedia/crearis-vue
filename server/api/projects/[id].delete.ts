import { defineEventHandler, getRouterParam, createError } from 'h3'
import { db } from '../../database/db-new'

// DELETE /api/projects/[id] - Delete project
export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id')

    try {
        if (!id) {
            throw createError({
                statusCode: 400,
                message: 'Project ID is required'
            })
        }

        // Check if project exists
        const existing = await db.get('SELECT * FROM projects WHERE id = ?', [id])
        if (!existing) {
            throw createError({
                statusCode: 404,
                message: 'Project not found'
            })
        }

        // Delete project
        await db.run('DELETE FROM projects WHERE id = ?', [id])

        return {
            success: true,
            message: 'Project deleted successfully'
        }
    } catch (error) {
        console.error('Error deleting project:', error)
        throw createError({
            statusCode: 500,
            message: error instanceof Error ? error.message : 'Failed to delete project'
        })
    }
})
