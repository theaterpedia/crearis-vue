/**
 * DELETE /api/comments/:id
 * 
 * Delete a comment.
 * 
 * Requires authentication.
 * Comment author can delete own comments.
 * Project owner can delete any comment.
 * 
 * December 2025
 */

import { defineEventHandler, getRouterParam, createError, getCookie } from 'h3'
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

    // Only author or project owner can delete
    if (!isAuthor && !isProjectOwner) {
        throw createError({
            statusCode: 403,
            message: 'You do not have permission to delete this comment',
        })
    }

    // Delete reactions first (if not using CASCADE)
    await db.run('DELETE FROM comment_reactions WHERE comment_id = ?', [commentId])

    // Delete replies (cascade delete)
    await db.run('DELETE FROM comments WHERE parent_id = ?', [commentId])

    // Delete the comment
    await db.run('DELETE FROM comments WHERE id = ?', [commentId])

    return {
        success: true,
        deleted: commentId,
    }
})
