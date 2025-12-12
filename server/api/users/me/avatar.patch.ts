import { defineEventHandler, readBody, createError, getCookie } from 'h3'
import { db } from '../../../database/init'
import { sessions } from '../../../utils/session-store'

/**
 * PATCH /api/users/me/avatar
 * Set current user's avatar image
 * 
 * Body:
 * - img_id: Image ID to set as avatar
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

    const body = await readBody(event) as { img_id: number }

    if (!body.img_id) {
        throw createError({
            statusCode: 400,
            message: 'img_id is required'
        })
    }

    try {
        // Check image exists
        const image = await db.get('SELECT id FROM images WHERE id = ?', [body.img_id])

        if (!image) {
            throw createError({
                statusCode: 404,
                message: 'Image not found'
            })
        }

        // Update user's img_id
        await db.run('UPDATE users SET img_id = ?, updated_at = NOW() WHERE id = ?', [body.img_id, session.userId])

        // Update session with new img_id
        session.img_id = body.img_id

        // Check if user should advance from DEMO (8) to DRAFT (64)
        // This happens when both partner_id AND img_id are set
        if (session.status === 8 && session.partner_id) {
            await db.run('UPDATE users SET status = 64, updated_at = NOW() WHERE id = ?', [session.userId])
            session.status = 64
            console.log(`[Avatar] User ${session.userId} advanced from DEMO (8) to DRAFT (64)`)
        }

        return { success: true, img_id: body.img_id, status: session.status }
    } catch (error: any) {
        if (error.statusCode) throw error
        console.error('Error setting avatar:', error)
        throw createError({
            statusCode: 500,
            message: 'Failed to set avatar'
        })
    }
})
