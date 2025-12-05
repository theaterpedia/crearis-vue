/**
 * GET /api/comments
 * 
 * Fetch comments for an entity.
 * 
 * Query params:
 * - entity_type: 'post' | 'project' | 'event' | 'image'
 * - entity_id: ID of the entity
 * - project_id: Project ID for authorization
 * - offset: Pagination offset (default 0)
 * - limit: Page size (default 20, max 100)
 * 
 * Returns paginated comments with author info and reactions.
 * 
 * December 2025
 */

import { defineEventHandler, getQuery, createError, getCookie } from 'h3'
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
    userId: string | null,
    projectId: string,
    projectOwnerId: string
): Promise<string> {
    if (!userId) return 'anonym'

    // Check if owner
    if (userId === projectOwnerId) return 'p_owner'

    // Check membership
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

export default defineEventHandler(async (event) => {
    const query = getQuery(event)

    const entityType = String(query.entity_type || '')
    const entityId = String(query.entity_id || '')
    const projectId = String(query.project_id || '')
    const offset = Math.max(0, parseInt(String(query.offset || '0'), 10))
    const limit = Math.min(100, Math.max(1, parseInt(String(query.limit || '20'), 10)))

    // Validate required params
    if (!entityType || !entityId || !projectId) {
        throw createError({
            statusCode: 400,
            message: 'Missing required parameters: entity_type, entity_id, project_id',
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

    // Get current user (optional - allows anonymous read)
    let currentUserId: string | null = null
    const sessionId = getCookie(event, 'sessionId')
    if (sessionId) {
        const session = sessions.get(sessionId)
        if (session && session.expiresAt > Date.now()) {
            currentUserId = session.userId
        }
    }

    // Get project for authorization
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

    // Fetch comments with author info
    const comments = await db.all(`
    SELECT 
      c.id,
      c.entity_type,
      c.entity_id,
      c.project_id,
      c.parent_id,
      c.author_id,
      c.content,
      c.is_pinned,
      c.created_at,
      c.updated_at,
      u.name as author_name,
      u.sysmail as author_sysmail,
      (SELECT COUNT(*) FROM comments r WHERE r.parent_id = c.id) as reply_count
    FROM comments c
    LEFT JOIN users u ON c.author_id = u.id
    WHERE c.entity_type = ? AND c.entity_id = ? AND c.project_id = ?
    ORDER BY c.is_pinned DESC, c.created_at DESC
    LIMIT ? OFFSET ?
  `, [entityType, entityId, project.id, limit + 1, offset]) as any[]

    // Check if there are more
    const hasMore = comments.length > limit
    if (hasMore) {
        comments.pop()
    }

    // Get total count
    const countResult = await db.get(
        'SELECT COUNT(*) as total FROM comments WHERE entity_type = ? AND entity_id = ? AND project_id = ?',
        [entityType, entityId, project.id]
    ) as { total: number }

    // Get reactions for these comments
    const commentIds = comments.map(c => c.id)
    let reactionsMap: Record<string, { emoji: string; count: number; hasReacted: boolean }[]> = {}

    if (commentIds.length > 0) {
        const reactions = await db.all(`
      SELECT 
        comment_id,
        emoji,
        COUNT(*) as count,
        MAX(CASE WHEN user_id = ? THEN 1 ELSE 0 END) as has_reacted
      FROM comment_reactions
      WHERE comment_id IN (${commentIds.map(() => '?').join(',')})
      GROUP BY comment_id, emoji
    `, [currentUserId, ...commentIds]) as any[]

        for (const r of reactions) {
            if (!reactionsMap[r.comment_id]) {
                reactionsMap[r.comment_id] = []
            }
            reactionsMap[r.comment_id].push({
                emoji: r.emoji,
                count: r.count,
                hasReacted: r.has_reacted === 1,
            })
        }
    }

    // Transform comments with author relation and color
    const transformedComments = await Promise.all(
        comments.map(async (c) => {
            const relation = await getUserRelation(c.author_id, project.id, project.owner_id)
            const color = ROLE_COLORS[relation as keyof typeof ROLE_COLORS] || 'yellow'

            return {
                id: c.id,
                entityType: c.entity_type,
                entityId: c.entity_id,
                projectId: c.project_id,
                parentId: c.parent_id,
                author: {
                    id: c.author_id,
                    name: c.author_name || 'Unknown',
                    sysmail: c.author_sysmail,
                    relation,
                },
                content: c.content,
                color,
                isPinned: !!c.is_pinned,
                reactions: reactionsMap[c.id] || [],
                replyCount: c.reply_count || 0,
                createdAt: c.created_at,
                updatedAt: c.updated_at,
            }
        })
    )

    return {
        comments: transformedComments,
        total: countResult.total,
        hasMore,
    }
})
