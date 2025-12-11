import { defineEventHandler, createError, getRouterParam, getCookie } from 'h3'
import { db } from '../../../../database/init'
import { sessions } from '../../../auth/login.post'

/**
 * GET /api/projects/:id/members
 * List all members of a project with their configrole
 * Only p_owner and p_creator can see member list with configrole details
 */

// Configrole bit values
const CONFIGROLE = {
    PARTNER: 2,
    PARTICIPANT: 4,
    MEMBER: 8,
    CREATOR: 16
} as const

// Map configrole to role name
function configroleToName(configrole: number): string {
    if (configrole & CONFIGROLE.CREATOR) return 'p_creator'
    if (configrole & CONFIGROLE.MEMBER) return 'member'
    if (configrole & CONFIGROLE.PARTICIPANT) return 'participant'
    if (configrole & CONFIGROLE.PARTNER) return 'partner'
    return 'unknown'
}

export default defineEventHandler(async (event) => {
    const projectId = getRouterParam(event, 'id')

    if (!projectId) {
        throw createError({
            statusCode: 400,
            message: 'Project ID is required'
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

        // Check if current user has access (owner or creator)
        const isOwner = project.owner_id === currentUserId

        let isCreator = false
        if (!isOwner) {
            const membership = await db.get(
                'SELECT configrole FROM project_members WHERE project_id = ? AND user_id = ?',
                [project.id, currentUserId]
            ) as { configrole: number } | undefined

            isCreator = membership ? (membership.configrole & CONFIGROLE.CREATOR) !== 0 : false
        }

        if (!isOwner && !isCreator) {
            throw createError({
                statusCode: 403,
                message: 'Only project owner or creator can view member list'
            })
        }

        // Get all members with user details
        const members = await db.all(`
            SELECT 
                pm.user_id,
                pm.project_id,
                pm.role as role_label,
                pm.configrole,
                u.sysmail,
                u.username,
                u.display_name,
                p.name as partner_name,
                p.img_id as partner_img_id
            FROM project_members pm
            JOIN users u ON u.id = pm.user_id
            LEFT JOIN partners p ON p.id = u.partner_id
            WHERE pm.project_id = ?
            ORDER BY pm.configrole DESC, u.username ASC
        `, [project.id]) as any[]

        // Add owner to list
        const owner = await db.get(`
            SELECT 
                u.id as user_id,
                u.sysmail,
                u.username,
                u.display_name,
                p.name as partner_name,
                p.img_id as partner_img_id
            FROM users u
            LEFT JOIN partners p ON p.id = u.partner_id
            WHERE u.id = ?
        `, [project.owner_id]) as any

        // Format response
        const memberList = members.map((m: any) => ({
            user_id: m.user_id,
            sysmail: m.sysmail,
            username: m.username,
            display_name: m.display_name || m.partner_name || m.username,
            partner_img_id: m.partner_img_id,
            configrole: m.configrole,
            role: configroleToName(m.configrole),
            role_label: m.role_label,
            is_owner: false,
            can_edit: isOwner  // Only owner can change roles
        }))

        // Add owner at the beginning
        if (owner) {
            memberList.unshift({
                user_id: owner.user_id,
                sysmail: owner.sysmail,
                username: owner.username,
                display_name: owner.display_name || owner.partner_name || owner.username,
                partner_img_id: owner.partner_img_id,
                configrole: null,
                role: 'p_owner',
                role_label: 'Eigentümer',
                is_owner: true,
                can_edit: false  // Can't change owner role
            })
        }

        return {
            project_id: project.id,
            domaincode: projectId,
            members: memberList,
            total: memberList.length,
            can_manage: isOwner
        }
    } catch (error) {
        console.error('Error fetching project members:', error)

        if (error && typeof error === 'object' && 'statusCode' in error) {
            throw error
        }

        throw createError({
            statusCode: 500,
            message: 'Failed to fetch project members'
        })
    }
})
