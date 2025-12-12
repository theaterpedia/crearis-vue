/**
 * PATCH /api/comments/:id
 * 
 * Update a comment (content or pin status).
 * 
 * Body:
 * - content: (optional) New content text
 * - is_pinned: (optional) Pin status (owner only)
 * 
 * Requires authentication.
 * Only comment author can edit content.
 * Only project owner can pin/unpin.
 * 
 * December 2025
 */

import { defineEventHandler, getRouterParam, readBody, createError, getCookie } from 'h3'
import { db } from '../../database/init'
import { sessions } from '../../utils/session-store'

export default defineEventHandler(async (event) => {
    const commentId = getRouterParam(event, 'id')

    if (!commentId) {
        throw createError({
            statusCode: 400,
            message: 'Comment ID is required',
        })
    }

    // Verify authentication
    const sessionId = getCookie(event, 'sessionId')
    if (!sessionId) {
        throw createError({
            statusCode: 401,
            message: 'Authentication required',
        })
    }

    const session = sessions.get(sessionId)
    if (!session || session.expiresAt < Date.now()) {
        throw createError({
            statusCode: 401,
            message: 'Session expired',
        })
    }

    const body = await readBody(event)

    // Get comment with project info
    const comment = await db.get(`
    SELECT c.*, p.owner_id as project_owner_id
    FROM comments c
    JOIN projects p ON c.project_id = p.id
    WHERE c.id = ?
  `, [commentId]) as any

    if (!comment) {
        throw createError({
            statusCode: 404,
            message: 'Comment not found',
        })
    }

    const isAuthor = comment.author_id === session.userId
    const isProjectOwner = comment.project_owner_id === session.userId

    // Check what's being updated
    const updates: string[] = []
    const params: any[] = []

    // Content update (author only)
    if (body.content !== undefined) {
        if (!isAuthor) {
            throw createError({
                statusCode: 403,
                message: 'Only comment author can edit content',
            })
        }

        const content = String(body.content).trim()
        if (!content) {
            throw createError({
                statusCode: 400,
                message: 'Content cannot be empty',
            })
        }

        if (content.length > 10000) {
            throw createError({
                statusCode: 400,
                message: 'Content too long (max 10000 characters)',
            })
        }

        updates.push('content = ?')
        params.push(content)
    }

    // Pin update (project owner only)
    if (body.is_pinned !== undefined) {
        if (!isProjectOwner) {
            throw createError({
                statusCode: 403,
                message: 'Only project owner can pin/unpin comments',
            })
        }

        updates.push('is_pinned = ?')
        params.push(body.is_pinned ? 1 : 0)
    }

    if (updates.length === 0) {
        throw createError({
            statusCode: 400,
            message: 'No valid updates provided',
        })
    }

    // Update timestamp
    updates.push('updated_at = ?')
    const now = new Date().toISOString()
    params.push(now)

    // Add comment ID for WHERE
    params.push(commentId)

    await db.run(`
    UPDATE comments SET ${updates.join(', ')} WHERE id = ?
  `, params)

    // Fetch updated comment
    const updated = await db.get('SELECT * FROM comments WHERE id = ?', [commentId]) as any

    return {
        success: true,
        comment: {
            id: updated.id,
            content: updated.content,
            isPinned: !!updated.is_pinned,
            updatedAt: updated.updated_at,
        },
    }
})
