import { defineEventHandler, readBody, createError } from 'h3'
import { db } from '../../database/init'

/**
 * POST /api/projects/add-member
 * Add a user to a project's members list
 */
export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    const { userId, projectId } = body

    if (!userId || !projectId) {
        throw createError({
            statusCode: 400,
            message: 'userId and projectId are required'
        })
    }

    try {
        // First, verify the user exists
        const user = await db.get('SELECT id FROM users WHERE id = ?', [userId])
        if (!user) {
            throw createError({
                statusCode: 404,
                message: 'User not found'
            })
        }

        // Verify the project exists
        const project = await db.get('SELECT id, members FROM projects WHERE id = ?', [projectId])
        if (!project) {
            throw createError({
                statusCode: 404,
                message: 'Project not found'
            })
        }

        // Parse existing members (stored as JSON array or comma-separated string)
        let members: string[] = []
        if (project.members) {
            try {
                members = JSON.parse(project.members)
            } catch {
                // If not JSON, try comma-separated
                members = project.members.split(',').map((m: string) => m.trim()).filter(Boolean)
            }
        }

        // Check if user is already a member
        if (members.includes(userId)) {
            return {
                success: true,
                message: 'User is already a member of this project',
                data: { userId, projectId }
            }
        }

        // Add user to members
        members.push(userId)

        // Update project with new members list
        await db.run(
            'UPDATE projects SET members = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [JSON.stringify(members), projectId]
        )

        return {
            success: true,
            message: 'User added to project successfully',
            data: { userId, projectId, members }
        }
    } catch (error) {
        console.error('Error adding user to project:', error)

        // Re-throw if already a H3 error
        if (error && typeof error === 'object' && 'statusCode' in error) {
            throw error
        }

        throw createError({
            statusCode: 500,
            message: 'Failed to add user to project'
        })
    }
})
