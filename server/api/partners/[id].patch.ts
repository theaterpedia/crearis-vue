import { defineEventHandler, readBody, createError, getCookie } from 'h3'
import { db } from '../../database/init'
import { sessions } from '../../utils/session-store'

/**
 * PATCH /api/partners/:id
 * Update a partner's properties (e.g., img_id)
 * 
 * Only allowed if:
 * - User is linked to this partner (partners.user_id = session.userId)
 * - OR user has admin role
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

    const partnerId = event.context.params?.id
    if (!partnerId) {
        throw createError({ statusCode: 400, message: 'Partner ID required' })
    }

    const body = await readBody(event) as { img_id?: number; name?: string }

    try {
        // Check partner exists
        const partner = await db.get(
            'SELECT id FROM partners WHERE id = ?',
            [partnerId]
        )

        if (!partner) {
            throw createError({ statusCode: 404, message: 'Partner not found' })
        }

        // Check permission: user must be linked to this partner (users.partner_id) OR be admin
        // Note: users.partner_id links TO partners.id, not the other way around
        const userLinked = await db.get(
            'SELECT id FROM users WHERE id = ? AND partner_id = ?',
            [session.userId, partnerId]
        )
        const isOwner = !!userLinked
        const isAdmin = session.activeRole === 'admin'

        if (!isOwner && !isAdmin) {
            throw createError({ statusCode: 403, message: 'Not authorized to update this partner' })
        }

        // Build update query
        const updates: string[] = []
        const values: any[] = []

        if (body.img_id !== undefined) {
            updates.push('img_id = ?')
            values.push(body.img_id)
        }

        if (body.name !== undefined) {
            updates.push('name = ?')
            values.push(body.name)
        }

        if (updates.length === 0) {
            throw createError({ statusCode: 400, message: 'No fields to update' })
        }

        // updated_at is TEXT column, use ISO string format
        updates.push('updated_at = ?')
        values.push(new Date().toISOString())
        values.push(partnerId)

        await db.run(
            `UPDATE partners SET ${updates.join(', ')} WHERE id = ?`,
            values
        )

        console.log(`[Partners] Updated partner ${partnerId}:`, body)

        return { success: true, partner_id: Number(partnerId) }
    } catch (error: any) {
        if (error.statusCode) throw error
        console.error('[Partners] Error updating partner:', error.message || error)
        throw createError({
            statusCode: 500,
            message: `Failed to update partner: ${error.message || 'Unknown error'}`
        })
    }
})
