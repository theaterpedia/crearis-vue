import { defineEventHandler, createError, getCookie } from 'h3'
import { db } from '../../../database/init'
import { sessions } from '../../auth/login.post'

/**
 * POST /api/users/me/activate
 * Activate user profile (transition from DRAFT to CONFIRMED)
 * 
 * Status transitions:
 * - 64 (DRAFT) → 1024 (CONFIRMED_USER)
 */
export default defineEventHandler(async (event) => {
    // Get session
    const sessionId = getCookie(event, 'sessionId')
    if (!sessionId) {
        throw createError({ statusCode: 401, message: 'Not authenticated' })
    }

    const session = sessions.get(sessionId)
    if (!session || session.expiresAt < Date.now()) {
        throw createError({ statusCode: 401, message: 'Session expired' })
    }

    try {
        // Get current user status
        const user = await db.get('SELECT id, status FROM users WHERE id = ?', [session.userId])

        if (!user) {
            throw createError({
                statusCode: 404,
                message: 'User not found'
            })
        }

        // Only allow activation from DRAFT status (64)
        if (user.status !== 64) {
            throw createError({
                statusCode: 400,
                message: `Cannot activate from status ${user.status}. Must be in DRAFT (64) status.`
            })
        }

        // Transition to CONFIRMED_USER (1024)
        await db.run('UPDATE users SET status = ?, updated_at = NOW() WHERE id = ?', [1024, session.userId])

        // Update session with new status so subsequent requests see the change
        session.status = 1024

        return {
            success: true,
            message: 'Profile activated successfully',
            newStatus: 1024
        }
    } catch (error: any) {
        if (error.statusCode) throw error
        console.error('Error activating profile:', error)
        throw createError({
            statusCode: 500,
            message: 'Failed to activate profile'
        })
    }
})
