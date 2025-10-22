import { defineEventHandler, readBody, createError } from 'h3'
import { db } from '../../database/init'

/**
 * POST /api/projects/add-member
 * Add a user to a project's members list using project_members table
 */
export default defineEventHandler(async (event) => {
    const body = await readBody(event) as { userId?: string; projectId?: string }
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
        const project = await db.get('SELECT id FROM projects WHERE id = ?', [projectId])
        if (!project) {
            throw createError({
                statusCode: 404,
                message: 'Project not found'
            })
        }

        // Check if user is already a member
        const existingMember = await db.get(
            'SELECT * FROM project_members WHERE project_id = ? AND user_id = ?',
            [projectId, userId]
        )

        if (existingMember) {
            return {
                success: true,
                message: 'User is already a member of this project',
                data: { userId, projectId }
            }
        }

        // Add user to project_members table
        await db.run(
            'INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)',
            [projectId, userId, 'member']
        )

        return {
            success: true,
            message: 'User added to project successfully',
            data: { userId, projectId, role: 'member' }
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
