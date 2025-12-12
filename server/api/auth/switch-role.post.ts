import { defineEventHandler, readBody, createError, getCookie } from 'h3'
import { sessions } from '../../utils/session-store'

export default defineEventHandler(async (event) => {
    const sessionId = getCookie(event, 'sessionId')

    if (!sessionId) {
        throw createError({
            statusCode: 401,
            message: 'Not authenticated'
        })
    }

    const session = sessions.get(sessionId)

    if (!session || session.expiresAt < Date.now()) {
        if (session) {
            sessions.delete(sessionId)
        }
        throw createError({
            statusCode: 401,
            message: 'Session expired'
        })
    }

    const body = await readBody(event)
    const { role } = body as { role: string }

    if (!role) {
        throw createError({
            statusCode: 400,
            message: 'Role is required'
        })
    }

    // Check if requested role is available
    if (!session.availableRoles.includes(role)) {
        throw createError({
            statusCode: 403,
            message: 'Role not available for this user'
        })
    }

    // Update active role
    session.activeRole = role

    return {
        success: true,
        activeRole: role,
        availableRoles: session.availableRoles
    }
})
