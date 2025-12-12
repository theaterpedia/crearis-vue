import { defineEventHandler, getCookie, deleteCookie } from 'h3'
import { sessions } from '../../utils/session-store'

export default defineEventHandler(async (event) => {
    const sessionId = getCookie(event, 'sessionId')

    if (sessionId) {
        sessions.delete(sessionId)
        deleteCookie(event, 'sessionId')
    }

    return {
        success: true,
        message: 'Logged out successfully'
    }
})
