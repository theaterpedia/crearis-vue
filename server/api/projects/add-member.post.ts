import { defineEventHandler, readBody, createError } from 'h3'
import { db } from '../../database/init'

/**
 * POST /api/projects/add-member
 * Add a user to a project's members list using project_members table
 * After Migration 019 Chapter 5:
 * - projectId parameter is the domaincode (TEXT)
 * - project_members table uses numeric project id (INTEGER FK)
 */
export default defineEventHandler(async (event) => {
    const body = await readBody(event) as { userId?: string | number; projectId?: string }
    const { userId, projectId } = body

    if (!userId || !projectId) {
        throw createError({
            statusCode: 400,
            message: 'userId and projectId (domaincode) are required'
        })
    }

    try {
        // Convert userId to INTEGER if it's a string (sysmail lookup)
        let numericUserId: number
        if (typeof userId === 'number') {
            numericUserId = userId
        } else {
            const user = await db.get('SELECT id FROM users WHERE sysmail = ?', [userId])
            if (!user) {
                throw createError({
                    statusCode: 404,
                    message: 'User not found'
                })
            }
            numericUserId = user.id
        }

        // Verify the user exists by numeric id
        const user = await db.get('SELECT id FROM users WHERE id = ?', [numericUserId])
        if (!user) {
            throw createError({
                statusCode: 404,
                message: 'User not found'
            })
        }

        // Lookup project by domaincode, get numeric id
        const project = await db.get('SELECT id, domaincode FROM projects WHERE domaincode = ?', [projectId])
        if (!project) {
            throw createError({
                statusCode: 404,
                message: 'Project not found'
            })
        }

        const numericProjectId = project.id

        // Check if user is already a member (using numeric project_id)
        const existingMember = await db.get(
            'SELECT * FROM project_members WHERE project_id = ? AND user_id = ?',
            [numericProjectId, numericUserId]
        )

        if (existingMember) {
            return {
                success: true,
                message: 'User is already a member of this project',
                data: { userId: numericUserId, projectId, projectDbId: numericProjectId }
            }
        }

        // Add user to project_members table (using numeric ids)
        await db.run(
            'INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)',
            [numericProjectId, numericUserId, 'member']
        )

        return {
            success: true,
            message: 'User added to project successfully',
            data: { userId: numericUserId, projectId, projectDbId: numericProjectId, role: 'member' }
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
