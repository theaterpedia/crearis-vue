import { defineEventHandler, getRouterParam, createError, getCookie } from 'h3'
import { db } from '../../database/init'
import { sessions } from '../auth/login.post'

// Configrole bit flags (from Migration 045)
const CONFIGROLE_PARTNER = 2
const CONFIGROLE_PARTICIPANT = 4
const CONFIGROLE_MEMBER = 8

// Map configrole bits to role name
function configroleToName(configrole: number): string | null {
    if (configrole & CONFIGROLE_MEMBER) return 'member'
    if (configrole & CONFIGROLE_PARTICIPANT) return 'participant'
    if (configrole & CONFIGROLE_PARTNER) return 'partner'
    return null
}

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
        const rawProject = await db.get('SELECT * FROM projects WHERE domaincode = ?', [id]) as any

        if (!rawProject) {
            throw createError({
                statusCode: 404,
                message: 'Project not found'
            })
        }

        // Determine user's role for this project
        let _userRole: string | null = null
        let _userConfigrole: number | null = null
        let _userRoleLabel: string | null = null  // Custom display label from project_members.role

        const sessionId = getCookie(event, 'sessionId')
        if (sessionId) {
            const session = sessions.get(sessionId)
            if (session && session.expiresAt >= Date.now()) {
                const userId = session.userId

                // Check if user is owner
                if (rawProject.owner_id === userId) {
                    _userRole = 'owner'
                    _userRoleLabel = 'Eigentümer'  // Default label for owner
                } else {
                    // Check project_members for configrole and custom role label
                    const membership = await db.get(
                        'SELECT configrole, role FROM project_members WHERE project_id = ? AND user_id = ?',
                        [rawProject.id, userId]
                    ) as { configrole: number; role: string | null } | undefined

                    if (membership) {
                        _userConfigrole = membership.configrole
                        _userRole = configroleToName(membership.configrole) || 'member'
                        // Use custom role label if set, otherwise use default based on configrole
                        _userRoleLabel = membership.role || _userRole
                    }
                }
            }
        }

        // Get owner's sysmail for permission checks
        let owner_sysmail: string | null = null
        if (rawProject.owner_id) {
            const owner = await db.get('SELECT sysmail FROM users WHERE id = ?', [rawProject.owner_id]) as { sysmail: string } | undefined
            owner_sysmail = owner?.sysmail || null
        }

        // Return project with user role info
        const project = {
            ...rawProject,
            owner_sysmail,
            _userRole,
            _userConfigrole,
            _userRoleLabel
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
