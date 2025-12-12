import { defineEventHandler, createError, getCookie } from 'h3'
import { db } from '../../../database/init'
import { sessions } from '../../../utils/session-store'

/**
 * POST /api/users/me/advance
 * Advance user from DEMO (8) to DRAFT (64) status
 * 
 * Requirements:
 * - User must be in DEMO status (8)
 * - User must have a linked partner_id
 * - Avatar (img_id) is optional
 * 
 * Status transitions:
 * - 8 (DEMO) → 64 (DRAFT)
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
        const user = await db.get('SELECT id, status, partner_id FROM users WHERE id = ?', [session.userId])

        if (!user) {
            throw createError({
                statusCode: 404,
                message: 'User not found'
            })
        }

        // Only allow advancement from DEMO status (8)
        if (user.status !== 8) {
            throw createError({
                statusCode: 400,
                message: `Cannot advance from status ${user.status}. Must be in DEMO (8) status.`
            })
        }

        // Require partner_id to be set
        if (!user.partner_id) {
            throw createError({
                statusCode: 400,
                message: 'Partner profile must be linked before advancing. Please complete step 1.'
            })
        }

        // Transition to DRAFT (64) - img_id is optional
        await db.run('UPDATE users SET status = ?, updated_at = NOW() WHERE id = ?', [64, session.userId])

        // Update session with new status
        session.status = 64

        console.log(`[Advance] User ${session.userId} advanced from DEMO (8) to DRAFT (64)`)

        return {
            success: true,
            message: 'Advanced to DRAFT status successfully',
            newStatus: 64
        }
    } catch (error: any) {
        if (error.statusCode) throw error
        console.error('Error advancing user status:', error)
        throw createError({
            statusCode: 500,
            message: 'Failed to advance user status'
        })
    }
})
