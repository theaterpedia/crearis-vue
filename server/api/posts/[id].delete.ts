/**
 * DELETE /api/posts/:id
 *
 * ⚠ **Unauthenticated until 2026-07-30**, exactly like `events/[id].delete.ts` —
 * an id, an existence check, and a delete, with no session and no ownership check.
 * The events twin was verified live (`curl -X DELETE` with no cookie → HTTP 200,
 * row gone); this file was byte-for-byte the same shape.
 *
 * The CV-side analogue of the cv↔odoo thread's §4.1, and destructive. uia deploys
 * against prod at 1.0, so it would have been exposed the moment the site went up.
 *
 * Two checks now guard it, answering **different questions**:
 *   1. **may THIS USER write?** — session + creator/project-owner/member(configrole=8),
 *      mirroring `[id].patch.ts` so the two cannot drift apart.
 *   2. **may CV write AT ALL?** — the Rubicon guard (D4): at/above sysreg 512 Odoo
 *      owns the data and CV holds a read copy.
 *
 * Note on posts specifically: post-sync is still a deliberate no-op (posts lack
 * migration-060's `odoo_xmlid`/`confirmed_at`/`odoo_stats`), so nothing above the
 * Rubicon has actually been handed to Odoo yet. The guard is applied anyway — the
 * ownership line is a property of D4, not of whether the sync has caught up, and
 * having it already in place is what makes enabling post-sync a non-event.
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
                message: 'Post ID is required'
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
            SELECT p.id, p.status, p.creator_id, p.project_id, pr.owner_id as project_owner_id
            FROM posts p
            LEFT JOIN projects pr ON p.project_id = pr.id
            WHERE p.id = ?
        `, [id]) as any

        if (!existing) {
            throw createError({
                statusCode: 404,
                message: 'Post not found'
            })
        }

        // Authorization · identical shape to [id].patch.ts
        const isPostCreator = existing.creator_id === session.userId
        const isProjectOwner = existing.project_owner_id === session.userId

        let isProjectMemberWithEditRights = false
        if (existing.project_id) {
            const membership = await db.get(
                'SELECT configrole FROM project_members WHERE project_id = ? AND user_id = ?',
                [existing.project_id, session.userId]
            ) as { configrole: number } | undefined
            isProjectMemberWithEditRights = membership?.configrole === 8
        }

        if (!isPostCreator && !isProjectOwner && !isProjectMemberWithEditRights) {
            throw createError({
                statusCode: 403,
                message: 'Not authorized to delete this post'
            })
        }

        // D4 · the ownership line — a different question from the one above.
        assertRubiconWrite({
            kind: 'delete',
            currentStatus: existing.status,
            entity: 'posts',
            id: existing.id,
            createError,
        })

        // Delete the post
        await db.run('DELETE FROM posts WHERE id = ?', [id])

        console.log(`[DELETE /api/posts/${id}] Deleted by user ${session.userId}`)

        return { success: true, id }
    } catch (error) {
        console.error('Error deleting post:', error)

        if (error && typeof error === 'object' && 'statusCode' in error) {
            throw error
        }

        throw createError({
            statusCode: 500,
            message: 'Failed to delete post'
        })
    }
})
