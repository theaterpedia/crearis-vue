import { defineEventHandler, getRouterParam, createError, readBody, getCookie } from 'h3'
import { db } from '../../../database/init'
import { sessions } from '../../../utils/session-store'

/**
 * PATCH /api/projects/:id/activate
 * 
 * Activate (transition) a project to a new status.
 * 
 * Body: { status: number } - Target status value
 * 
 * Returns: Updated project data
 */

// Project status values (from sysreg)
const PROJECT_STATUS = {
    NEW: 1,
    DEMO: 8,
    DRAFT: 64,
    CONFIRMED: 512,
    RELEASED: 4096,
    ARCHIVED: 32768,
    TRASH: 65536
} as const

// Valid transitions map: fromStatus -> [allowedTargetStatuses]
const VALID_TRANSITIONS: Record<number, number[]> = {
    [PROJECT_STATUS.NEW]: [PROJECT_STATUS.DEMO, PROJECT_STATUS.DRAFT, PROJECT_STATUS.CONFIRMED],
    [PROJECT_STATUS.DEMO]: [PROJECT_STATUS.DRAFT, PROJECT_STATUS.CONFIRMED],
    [PROJECT_STATUS.DRAFT]: [PROJECT_STATUS.DEMO, PROJECT_STATUS.CONFIRMED, PROJECT_STATUS.TRASH],
    [PROJECT_STATUS.CONFIRMED]: [PROJECT_STATUS.DRAFT, PROJECT_STATUS.RELEASED, PROJECT_STATUS.TRASH],
    [PROJECT_STATUS.RELEASED]: [PROJECT_STATUS.CONFIRMED, PROJECT_STATUS.ARCHIVED, PROJECT_STATUS.TRASH],
    [PROJECT_STATUS.ARCHIVED]: [PROJECT_STATUS.RELEASED, PROJECT_STATUS.TRASH],
    [PROJECT_STATUS.TRASH]: [PROJECT_STATUS.DRAFT] // Can only restore to draft
}

// Owner-only transitions
const OWNER_ONLY_TARGETS = [PROJECT_STATUS.TRASH, PROJECT_STATUS.ARCHIVED]

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

        // Get project (by domaincode or id)
        const project = await db.get(
            'SELECT * FROM projects WHERE domaincode = ? OR id = ?',
            [id, id]
        ) as any

        if (!project) {
            throw createError({
                statusCode: 404,
                message: 'Project not found'
            })
        }

        // Check permissions
        const isOwner = project.owner_id === session.userId

        // Check if user is p_creator via project_members
        const membership = await db.get(
            `SELECT configrole FROM project_members 
             WHERE project_id = ? AND user_id = ?`,
            [project.id, session.userId]
        ) as any

        const CONFIGROLE_CREATOR = 16 // p_creator bit
        const isPCreator = membership && (membership.configrole & CONFIGROLE_CREATOR) > 0

        if (!isOwner && !isPCreator) {
            throw createError({
                statusCode: 403,
                message: 'Only project owner or creator can transition project status'
            })
        }

        // Read target status
        const body = await readBody(event)
        const targetStatus = body.status

        if (typeof targetStatus !== 'number') {
            throw createError({
                statusCode: 400,
                message: 'Target status must be a number'
            })
        }

        // Get current status
        const currentStatus = project.status_id || project.status || PROJECT_STATUS.NEW

        // Validate transition
        const allowedTargets = VALID_TRANSITIONS[currentStatus] || []
        if (!allowedTargets.includes(targetStatus)) {
            throw createError({
                statusCode: 400,
                message: `Invalid transition from ${currentStatus} to ${targetStatus}`
            })
        }

        // Check owner-only transitions
        if (OWNER_ONLY_TARGETS.includes(targetStatus) && !isOwner) {
            throw createError({
                statusCode: 403,
                message: 'This transition requires project owner permissions'
            })
        }

        // TODO: Add activation criteria checks here
        // For now, we allow all valid transitions

        // Execute update
        await db.run(
            `UPDATE projects 
             SET status_id = ?, updated_at = CURRENT_TIMESTAMP 
             WHERE id = ?`,
            [targetStatus, project.id]
        )

        // Return updated project
        const updatedProject = await db.get(
            'SELECT * FROM projects WHERE id = ?',
            [project.id]
        )

        console.log(`[PATCH /api/projects/${id}/activate] Status changed from ${currentStatus} to ${targetStatus} by user ${session.userId}`)

        return {
            success: true,
            project: updatedProject,
            previousStatus: currentStatus,
            newStatus: targetStatus
        }
    } catch (error) {
        console.error('Error activating project:', error)

        // Re-throw if already a H3 error
        if (error && typeof error === 'object' && 'statusCode' in error) {
            throw error
        }

        throw createError({
            statusCode: 500,
            message: 'Internal server error'
        })
    }
})
