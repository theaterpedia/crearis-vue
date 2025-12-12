import { defineEventHandler, readBody, createError, getCookie } from 'h3'
import { db } from '../../../database/init'
import { sessions } from '../../../utils/session-store'

/**
 * PATCH /api/users/me/partner
 * Link current user to a partner record
 * 
 * Body:
 * - partner_id: Partner ID to link
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

    const body = await readBody(event) as { partner_id: number }

    if (!body.partner_id) {
        throw createError({
            statusCode: 400,
            message: 'partner_id is required'
        })
    }

    try {
        // Check partner exists and is not already linked to another user
        // Note: partners table has no user_id - we check users.partner_id instead
        const existingLink = await db.get('SELECT id FROM users WHERE partner_id = $1 AND id != $2', [body.partner_id, session.userId])

        if (existingLink) {
            throw createError({
                statusCode: 409,
                message: 'Partner is already linked to another user'
            })
        }

        // Check partner exists
        const partner = await db.get('SELECT id, name FROM partners WHERE id = $1', [body.partner_id])

        if (!partner) {
            throw createError({
                statusCode: 404,
                message: 'Partner not found'
            })
        }

        // Update user's partner_id
        await db.run('UPDATE users SET partner_id = $1, updated_at = NOW() WHERE id = $2', [body.partner_id, session.userId])

        // Update session with new partner_id so UI reflects change immediately
        session.partner_id = body.partner_id

        // Check if user should advance from DEMO (8) to DRAFT (64)
        // This happens when both partner_id AND img_id are set
        if (session.status === 8 && session.img_id) {
            await db.run('UPDATE users SET status = 64, updated_at = NOW() WHERE id = $1', [session.userId])
            session.status = 64
            console.log(`[Partner] User ${session.userId} advanced from DEMO (8) to DRAFT (64)`)
        }

        return { success: true, partner_id: body.partner_id, partner_name: partner.name, status: session.status }
    } catch (error: any) {
        if (error.statusCode) throw error
        console.error('Error linking partner:', error)
        throw createError({
            statusCode: 500,
            message: 'Failed to link partner'
        })
    }
})
