/**
 * POST /api/comments
 * 
 * Create a new comment on an entity.
 * 
 * Body:
 * - entity_type: 'post' | 'project' | 'event' | 'image'
 * - entity_id: ID of the entity
 * - project_id: Project ID
 * - parent_id: (optional) Parent comment ID for replies
 * - content: Comment text (Markdown supported)
 * 
 * Requires authentication.
 * 
 * December 2025
 */

import { defineEventHandler, readBody, createError, getCookie } from 'h3'
import { db } from '../../database/init'
import { sessions } from '../auth/login.post'

/**
 * Role color mapping
 */
const ROLE_COLORS = {
    p_owner: 'orange',
    p_creator: 'purple',
    member: 'yellow',
    participant: 'blue',
    partner: 'green',
    anonym: 'yellow',
} as const

/**
 * Configrole bit values
 */
const CONFIGROLE = {
    PARTNER: 2,
    PARTICIPANT: 4,
    MEMBER: 8,
    CREATOR: 16,
} as const

/**
 * Get user's relation to project
 */
async function getUserRelation(
    userId: string,
    projectId: string,
    projectOwnerId: string
): Promise<string> {
    if (userId === projectOwnerId) return 'p_owner'

    const membership = await db.get(
        'SELECT configrole FROM project_members WHERE project_id = ? AND user_id = ?',
        [projectId, userId]
    ) as { configrole: number } | undefined

    if (!membership) return 'anonym'

    const cr = membership.configrole
    if (cr & CONFIGROLE.CREATOR) return 'p_creator'
    if (cr & CONFIGROLE.MEMBER) return 'member'
    if (cr & CONFIGROLE.PARTICIPANT) return 'participant'
    if (cr & CONFIGROLE.PARTNER) return 'partner'

    return 'anonym'
}

/**
 * Generate UUID
 */
function generateId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0
        const v = c === 'x' ? r : (r & 0x3) | 0x8
        return v.toString(16)
    })
}

export default defineEventHandler(async (event) => {
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

    const entityType = String(body.entity_type || '')
    const entityId = String(body.entity_id || '')
    const projectId = String(body.project_id || '')
    const parentId = body.parent_id ? String(body.parent_id) : null
    const content = String(body.content || '').trim()

    // Validate required fields
    if (!entityType || !entityId || !projectId || !content) {
        throw createError({
            statusCode: 400,
            message: 'Missing required fields: entity_type, entity_id, project_id, content',
        })
    }

    // Validate entity_type
    const validTypes = ['post', 'project', 'event', 'image']
    if (!validTypes.includes(entityType)) {
        throw createError({
            statusCode: 400,
            message: `Invalid entity_type. Must be one of: ${validTypes.join(', ')}`,
        })
    }

    // Validate content length
    if (content.length > 10000) {
        throw createError({
            statusCode: 400,
            message: 'Content too long (max 10000 characters)',
        })
    }

    // Get project
    const project = await db.get(
        'SELECT id, owner_id, status_id FROM projects WHERE id = ? OR domaincode = ?',
        [projectId, projectId]
    ) as { id: string; owner_id: string; status_id: number } | undefined

    if (!project) {
        throw createError({
            statusCode: 404,
            message: 'Project not found',
        })
    }

    // Get user's relation to check if they can comment
    const relation = await getUserRelation(session.userId, project.id, project.owner_id)

    // Only allow commenting if user has at least participant role or better
    const canComment = ['p_owner', 'p_creator', 'member', 'participant'].includes(relation)
    if (!canComment) {
        throw createError({
            statusCode: 403,
            message: 'You do not have permission to comment on this project',
        })
    }

    // If this is a reply, verify parent exists
    if (parentId) {
        const parent = await db.get(
            'SELECT id FROM comments WHERE id = ? AND project_id = ?',
            [parentId, project.id]
        )

        if (!parent) {
            throw createError({
                statusCode: 404,
                message: 'Parent comment not found',
            })
        }
    }

    // Get user info
    const user = await db.get(
        'SELECT id, name, sysmail FROM users WHERE id = ?',
        [session.userId]
    ) as { id: string; name: string; sysmail: string } | undefined

    if (!user) {
        throw createError({
            statusCode: 500,
            message: 'User not found',
        })
    }

    // Create comment
    const commentId = generateId()
    const now = new Date().toISOString()

    await db.run(`
    INSERT INTO comments (id, entity_type, entity_id, project_id, parent_id, author_id, content, is_pinned, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, false, ?, ?)
  `, [commentId, entityType, entityId, project.id, parentId, session.userId, content, now, now])

    const color = ROLE_COLORS[relation as keyof typeof ROLE_COLORS] || 'yellow'

    return {
        success: true,
        comment: {
            id: commentId,
            entityType,
            entityId,
            projectId: project.id,
            parentId,
            author: {
                id: user.id,
                name: user.name,
                sysmail: user.sysmail,
                relation,
            },
            content,
            color,
            isPinned: false,
            reactions: [],
            replyCount: 0,
            createdAt: now,
            updatedAt: now,
        },
    }
})
