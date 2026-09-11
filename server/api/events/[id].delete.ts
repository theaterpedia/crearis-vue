/**
 * DELETE /api/events/:id
 *
 * ⚠ **This endpoint was completely unauthenticated until 2026-07-30.** It took an
 * id, checked the row existed, and deleted it — no session, no ownership check,
 * nothing. Verified live before fixing, not just read:
 *
 *     curl -X DELETE localhost:3000/api/events/6      (no cookie, no auth)
 *     → HTTP 200 {"success":true,"id":"6"}   · row gone
 *
 * That is the CV-side analogue of the cv↔odoo thread's §4.1 (*"an unauthenticated
 * caller who knows a `cid` can rewrite event and post content"*) — except
 * destructive, and needing only an integer. uia deploys against prod at 1.0, so it
 * would have been exposed the moment the site went up.
 *
 * Two checks now guard it, and they answer **different questions**:
 *   1. **may THIS USER write?** — session + creator/project-owner/member(configrole=8),
 *      mirroring `[id].patch.ts` exactly so the two cannot drift apart.
 *   2. **may CV write AT ALL?** — the Rubicon guard (D4): at/above sysreg 512 Odoo
 *      is the system of record and CV holds a read copy, so deleting there is not
 *      CV's call. See `server/utils/rubicon-guard.ts`.
 *
 * The second is not redundant with the first: the owner of a *published* event is
 * still not allowed to delete it from the CV side.
 */

import { defineEventHandler, getRouterParam, createError, getCookie } from 'h3'
import { db } from '../../database/init'
import { sessions } from '../../utils/session-store'
import { assertRubiconWrite } from '../../utils/rubicon-guard'

export default defineEventHandler(async (event) => {
    try {
        const id = getRouterParam(event, 'id')

        if (!id) {
            throw createError({
                statusCode: 400,
                message: 'Event ID is required'
            })
        }

        // Verify authentication
        const sessionId = getCookie(event, 'sessionId')
        if (!sessionId) {
            throw createError({
                statusCode: 401,
                message: 'Authentication required'
            })
        }

        const session = sessions.get(sessionId)
        if (!session || session.expiresAt < Date.now()) {
            throw createError({
                statusCode: 401,
                message: 'Session expired'
            })
        }

        // Fetch enough to answer both questions — the old query selected only `id`.
        const existing = await db.get(`
            SELECT e.id, e.status, e.user_id, e.project_id, pr.owner_id as project_owner_id
            FROM events e
            LEFT JOIN projects pr ON e.project_id = pr.id
            WHERE e.id = ?
        `, [id]) as any

        if (!existing) {
            throw createError({
                statusCode: 404,
                message: 'Event not found'
            })
        }

        // Authorization · identical shape to [id].patch.ts
        const isEventCreator = existing.user_id === session.userId
        const isProjectOwner = existing.project_owner_id === session.userId

        let isProjectMemberWithEditRights = false
        if (existing.project_id) {
            const membership = await db.get(
                'SELECT configrole FROM project_members WHERE project_id = ? AND user_id = ?',
                [existing.project_id, session.userId]
            ) as { configrole: number } | undefined
            isProjectMemberWithEditRights = membership?.configrole === 8
        }

        if (!isEventCreator && !isProjectOwner && !isProjectMemberWithEditRights) {
            throw createError({
                statusCode: 403,
                message: 'Not authorized to delete this event'
            })
        }

        // D4 · the ownership line — a different question from the one above.
        assertRubiconWrite({
            kind: 'delete',
            currentStatus: existing.status,
            entity: 'events',
            id: existing.id,
            createError,
        })

        // Delete the event
        await db.run('DELETE FROM events WHERE id = ?', [id])

        console.log(`[DELETE /api/events/${id}] Deleted by user ${session.userId}`)

        return { success: true, id }
    } catch (error) {
        console.error('Error deleting event:', error)

        if (error && typeof error === 'object' && 'statusCode' in error) {
            throw error
        }

        throw createError({
            statusCode: 500,
            message: 'Failed to delete event'
        })
    }
})
