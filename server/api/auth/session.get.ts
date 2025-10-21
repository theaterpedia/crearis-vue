import { defineEventHandler, getCookie } from 'h3'
import { sessions } from './login.post'

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
            username: session.username,
            availableRoles: session.availableRoles,
            activeRole: session.activeRole,
            projectId: session.projectId,
            projectName: session.projectName
        }
    }
})
