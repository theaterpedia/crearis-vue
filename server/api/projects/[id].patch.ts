import { defineEventHandler, getRouterParam, createError, readBody, getCookie } from 'h3'
import { db } from '../../database/init'
import { sessions } from '../../utils/session-store'

// PATCH /api/projects/:id - Update project fields
export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id')

    try {
        if (!id) {
            throw createError({
                statusCode: 400,
                message: 'Project ID is required'
            })
        }

        // Verify authentication
        const sessionId = getCookie(event, 'sessionId')
        if (!sessionId) {
            throw createError({
                statusCode: 401,
                message: 'Authentication required'
            })
        }

        const session = sessions.get(sessionId)
        if (!session || session.expiresAt < Date.now()) {
            throw createError({
                statusCode: 401,
                message: 'Session expired'
            })
        }

        // Get project by domaincode
        const project = await db.get('SELECT * FROM projects WHERE domaincode = ?', [id]) as any

        if (!project) {
            throw createError({
                statusCode: 404,
                message: 'Project not found'
            })
        }

        // Check if user is owner (only owners can update project)
        if (project.owner_id !== session.userId) {
            throw createError({
                statusCode: 403,
                message: 'Only project owner can update project'
            })
        }

        // Read update body
        const body = await readBody(event)

        // Build update query dynamically
        const allowedFields = ['status', 'status_old', 'heading', 'description', 'teaser', 'theme', 'config']
        const updates: string[] = []
        const values: any[] = []

        for (const field of allowedFields) {
            if (body[field] !== undefined) {
                updates.push(`${field} = ?`)
                values.push(body[field])
            }
        }

        if (updates.length === 0) {
            throw createError({
                statusCode: 400,
                message: 'No valid fields to update'
            })
        }

        // Add updated_at
        updates.push('updated_at = CURRENT_TIMESTAMP')

        // Add project id for WHERE clause
        values.push(project.id)

        // Execute update
        await db.run(
            `UPDATE projects SET ${updates.join(', ')} WHERE id = ?`,
            values
        )

        // Return updated project
        const updatedProject = await db.get('SELECT * FROM projects WHERE id = ?', [project.id])

        console.log(`[PATCH /api/projects/${id}] Updated by user ${session.userId}:`, Object.keys(body))

        return updatedProject
    } catch (error) {
        console.error('Error updating project:', error)

        // Re-throw if already a H3 error
        if (error && typeof error === 'object' && 'statusCode' in error) {
            throw error
        }

        throw createError({
            statusCode: 500,
            message: 'Failed to update project'
        })
    }
})
