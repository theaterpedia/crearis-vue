import { defineEventHandler, getRouterParam, createError } from 'h3'
import { db } from '../../database/init'

// GET /api/projects/:id - Get single project
export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id')

    try {
        if (!id) {
            throw createError({
                statusCode: 400,
                message: 'Project ID is required'
            })
        }

        // Get project by domaincode
        const rawProject = await db.get('SELECT * FROM projects WHERE domaincode = ?', [id])

        if (!rawProject) {
            throw createError({
                statusCode: 404,
                message: 'Project not found'
            })
        }

        // Return project with proper field mapping
        const project = {
            ...rawProject,
            // No additional mapping needed - domaincode and name fields exist in DB
        }

        return project
    } catch (error) {
        console.error('Error fetching project:', error)

        // Re-throw if already a H3 error
        if (error && typeof error === 'object' && 'statusCode' in error) {
            throw error
        }

        throw createError({
            statusCode: 500,
            message: 'Failed to fetch project'
        })
    }
})
