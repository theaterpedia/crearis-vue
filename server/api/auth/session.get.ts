import { defineEventHandler, getCookie } from 'h3'
import { sessions } from '../../utils/session-store'

export default defineEventHandler(async (event) => {
    const sessionId = getCookie(event, 'sessionId')

    if (!sessionId) {
        return {
            authenticated: false,
            user: null
        }
    }

    const session = sessions.get(sessionId)

    if (!session || session.expiresAt < Date.now()) {
        if (session) {
            sessions.delete(sessionId)
        }
        return {
            authenticated: false,
            user: null
        }
    }

    return {
        authenticated: true,
        user: {
            id: session.userId,
            sysmail: session.sysmail,  // Added for permission checks
            username: session.username,
            status: session.status,  // For onboarding flow
            partner_id: session.partner_id,  // For onboarding flow
            img_id: session.img_id,  // For onboarding flow
            availableRoles: session.availableRoles,
            activeRole: session.activeRole,
            projectId: session.projectId,
            projectName: session.projectName,
            projects: session.projects || [],
            capabilities: session.capabilities ?
                Object.fromEntries(
                    Object.entries(session.capabilities).map(([key, value]) => [key, Array.from(value)])
                ) : {}
        }
    }
})
