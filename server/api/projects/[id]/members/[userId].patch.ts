import { defineEventHandler, readBody, createError, getRouterParam, getCookie } from 'h3'
import { db } from '../../../../database/init'
import { sessions } from '../../../auth/login.post'

/**
 * PATCH /api/projects/:id/members/:userId
 * Update a project member's configrole
 * Only p_owner can update member roles
 * 
 * Body: { configrole: number } or { role: 'member' | 'participant' | 'partner' | 'creator' }
 */

// Configrole bit values
const CONFIGROLE = {
    PARTNER: 2,
    PARTICIPANT: 4,
    MEMBER: 8,
    CREATOR: 16  // p_creator bit
} as const

// Map role name to configrole bit
function roleToConfigrole(role: string): number {
    switch (role) {
        case 'creator':
        case 'p_creator':
            return CONFIGROLE.CREATOR | CONFIGROLE.MEMBER  // Creator is also a member
        case 'member':
            return CONFIGROLE.MEMBER
        case 'participant':
            return CONFIGROLE.PARTICIPANT
        case 'partner':
            return CONFIGROLE.PARTNER
        default:
            return CONFIGROLE.MEMBER
    }
}

export default defineEventHandler(async (event) => {
    const projectId = getRouterParam(event, 'id')
    const targetUserId = getRouterParam(event, 'userId')

    if (!projectId || !targetUserId) {
        throw createError({
            statusCode: 400,
            message: 'Project ID and User ID are required'
        })
    }

    // Authenticate
    const sessionId = getCookie(event, 'sessionId')
    if (!sessionId) {
        throw createError({
            statusCode: 401,
            message: 'Not authenticated'
        })
    }

    const session = sessions.get(sessionId)
    if (!session || session.expiresAt < Date.now()) {
        throw createError({
            statusCode: 401,
            message: 'Session expired'
        })
    }

    const currentUserId = session.userId

    try {
        // Get project by domaincode
        const project = await db.get(
            'SELECT id, owner_id, status FROM projects WHERE domaincode = ?',
            [projectId]
        ) as { id: number; owner_id: number; status: number } | undefined

        if (!project) {
            throw createError({
                statusCode: 404,
                message: 'Project not found'
            })
        }

        // Check if current user is project owner
        if (project.owner_id !== currentUserId) {
            throw createError({
                statusCode: 403,
                message: 'Only project owner can update member roles'
            })
        }

        // Parse request body
        const body = await readBody(event) as {
            configrole?: number
            role?: string
            roleLabel?: string  // Custom display label
        }

        // Determine new configrole
        let newConfigrole: number
        if (typeof body.configrole === 'number') {
            newConfigrole = body.configrole
        } else if (body.role) {
            newConfigrole = roleToConfigrole(body.role)
        } else {
            throw createError({
                statusCode: 400,
                message: 'Either configrole or role is required'
            })
        }

        // Resolve target user ID (can be numeric or sysmail)
        let numericTargetUserId: number
        if (/^\d+$/.test(targetUserId)) {
            numericTargetUserId = parseInt(targetUserId, 10)
        } else {
            // Assume it's a sysmail
            const targetUser = await db.get(
                'SELECT id FROM users WHERE sysmail = ?',
                [targetUserId]
            ) as { id: number } | undefined

            if (!targetUser) {
                throw createError({
                    statusCode: 404,
                    message: 'Target user not found'
                })
            }
            numericTargetUserId = targetUser.id
        }

        // Check if membership exists
        const membership = await db.get(
            'SELECT * FROM project_members WHERE project_id = ? AND user_id = ?',
            [project.id, numericTargetUserId]
        )

        if (!membership) {
            throw createError({
                statusCode: 404,
                message: 'User is not a member of this project'
            })
        }

        // Update the membership
        const updateFields: string[] = ['configrole = ?']
        const updateValues: any[] = [newConfigrole]

        if (body.roleLabel !== undefined) {
            updateFields.push('role = ?')
            updateValues.push(body.roleLabel)
        }

        updateValues.push(project.id, numericTargetUserId)

        await db.run(
            `UPDATE project_members SET ${updateFields.join(', ')} WHERE project_id = ? AND user_id = ?`,
            updateValues
        )

        // Return updated membership
        const updated = await db.get(
            'SELECT pm.*, u.sysmail, u.username FROM project_members pm JOIN users u ON u.id = pm.user_id WHERE pm.project_id = ? AND pm.user_id = ?',
            [project.id, numericTargetUserId]
        )

        return {
            success: true,
            message: 'Member role updated',
            data: updated
        }
    } catch (error) {
        console.error('Error updating member role:', error)

        if (error && typeof error === 'object' && 'statusCode' in error) {
            throw error
        }

        throw createError({
            statusCode: 500,
            message: 'Failed to update member role'
        })
    }
})
