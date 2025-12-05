import { defineEventHandler, getRouterParam, createError, readBody, getCookie } from 'h3'
import { db } from '../../database/init'
import { sessions } from '../auth/login.post'

// PATCH /api/posts/:id - Update post fields
// Supports updating: name, subtitle, teaser, status, dtags, ctags, ttags, rtags, etc.
// Authorization: Must be post owner, project owner, or project member
export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id')

    try {
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

        // Get post with project info
        const post = await db.get(`
            SELECT p.*, pr.owner_id as project_owner_id
            FROM posts p
            LEFT JOIN projects pr ON p.project_id = pr.id
            WHERE p.id = ?
        `, [id]) as any

        if (!post) {
            throw createError({
                statusCode: 404,
                message: 'Post not found'
            })
        }

        // Check authorization
        // Allow: post owner, project owner, or project member (configrole=8)
        // Partners (configrole=2) and participants (configrole=4) can only edit their own posts
        const isPostOwner = post.owner_id === session.userId
        const isProjectOwner = post.project_owner_id === session.userId

        // Check if user is a project member with edit rights (configrole=8)
        let isProjectMemberWithEditRights = false
        if (post.project_id) {
            const membership = await db.get(
                'SELECT configrole FROM project_members WHERE project_id = ? AND user_id = ?',
                [post.project_id, session.userId]
            ) as { configrole: number } | undefined
            // Only full members (configrole=8) can edit any post
            // Partners (2) and participants (4) can only edit their own posts
            isProjectMemberWithEditRights = membership?.configrole === 8
        }

        if (!isPostOwner && !isProjectOwner && !isProjectMemberWithEditRights) {
            throw createError({
                statusCode: 403,
                message: 'Not authorized to update this post'
            })
        }

        // Read update body
        const body = await readBody(event) as Record<string, any>

        // Build update query dynamically
        // Content fields
        const allowedFields = [
            'name', 'subtitle', 'teaser', 'md', 'html',
            'post_date', 'template', 'header_type', 'lang',
            'cimg', 'img_id', 'img_show',
            // Tag fields (integer bitmasks)
            'status', 'dtags', 'ctags', 'ttags', 'rtags',
            // Visibility (usually set by triggers, but allow manual override)
            'r_anonym', 'r_partner', 'r_participant', 'r_member', 'r_owner'
        ]
        const updates: string[] = []
        const values: any[] = []

        for (const field of allowedFields) {
            if (body[field] !== undefined) {
                updates.push(`${field} = ?`)
                values.push(body[field])
            }
        }

        if (updates.length === 0) {
            throw createError({
                statusCode: 400,
                message: 'No valid fields to update'
            })
        }

        // Add updated_at
        updates.push('updated_at = CURRENT_TIMESTAMP')

        // Add post id for WHERE clause
        values.push(post.id)

        // Execute update
        await db.run(
            `UPDATE posts SET ${updates.join(', ')} WHERE id = ?`,
            values
        )

        // Return updated post with domaincode
        const updatedPost = await db.get(`
            SELECT p.*, pr.domaincode
            FROM posts p
            LEFT JOIN projects pr ON p.project_id = pr.id
            WHERE p.id = ?
        `, [post.id])

        console.log(`[PATCH /api/posts/${id}] Updated by user ${session.userId}:`, Object.keys(body))

        return updatedPost
    } catch (error) {
        console.error('Error updating post:', error)

        // Re-throw if already a H3 error
        if (error && typeof error === 'object' && 'statusCode' in error) {
            throw error
        }

        throw createError({
            statusCode: 500,
            message: 'Failed to update post'
        })
    }
})
