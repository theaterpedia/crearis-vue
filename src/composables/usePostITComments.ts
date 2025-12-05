/**
 * Post-IT Comments Composable
 * 
 * Manages Post-IT style comments for projects and entities.
 * Role-based color assignment, threading, and CRUD operations.
 * 
 * Color mapping (from REPORT-2-POSTIT-COMMENT-SYSTEM.md):
 * - p_owner: orange
 * - p_creator: purple
 * - member: yellow
 * - participant: blue
 * - partner: green
 * - anonym: yellow (guest)
 * 
 * December 2025
 */

import { ref, computed, watch, type Ref, type ComputedRef } from 'vue'
import { useAuth } from './useAuth'
import type { ProjectRelation } from './useProjectActivation'

/**
 * Post-IT color variants (oklch values in CSS)
 */
export type PostITColor = 'yellow' | 'pink' | 'blue' | 'green' | 'orange' | 'purple'

/**
 * Comment author info
 */
export interface CommentAuthor {
  id: string
  name: string
  sysmail?: string
  relation: ProjectRelation
}

/**
 * Comment reaction
 */
export interface CommentReaction {
  emoji: string
  count: number
  hasReacted: boolean
}

/**
 * Comment data structure
 */
export interface Comment {
  id: string
  entityType: 'post' | 'project' | 'event' | 'image'
  entityId: string
  projectId: string
  parentId: string | null
  author: CommentAuthor
  content: string
  color: PostITColor
  isPinned: boolean
  reactions: CommentReaction[]
  replyCount: number
  createdAt: string
  updatedAt: string
}

/**
 * New comment input
 */
export interface NewCommentInput {
  entityType: Comment['entityType']
  entityId: string
  projectId: string
  parentId?: string
  content: string
}

/**
 * Comment thread (parent + replies)
 */
export interface CommentThread {
  parent: Comment
  replies: Comment[]
  totalCount: number
}

/**
 * Role to color mapping
 */
const ROLE_COLOR_MAP: Record<ProjectRelation, PostITColor> = {
  p_owner: 'orange',
  p_creator: 'purple',
  member: 'yellow',
  participant: 'blue',
  partner: 'green',
  anonym: 'yellow', // guests get yellow (most neutral)
}

/**
 * Get Post-IT color for a role
 */
export function getColorForRole(relation: ProjectRelation): PostITColor {
  return ROLE_COLOR_MAP[relation] ?? 'yellow'
}

/**
 * Color CSS variable mapping (oklch values from REPORT-5)
 */
export const COLOR_CSS_VARS: Record<PostITColor, string> = {
  yellow: 'var(--postit-yellow, oklch(92% 0.12 95))',
  pink: 'var(--postit-pink, oklch(78% 0.14 350))',
  blue: 'var(--postit-blue, oklch(82% 0.10 230))',
  green: 'var(--postit-green, oklch(80% 0.12 145))',
  orange: 'var(--postit-orange, oklch(85% 0.14 65))',
  purple: 'var(--postit-purple, oklch(78% 0.12 300))',
}

/**
 * API response type
 */
interface CommentsApiResponse {
  comments: Comment[]
  total: number
  hasMore: boolean
}

/**
 * Post-IT Comments Composable
 */
export function usePostITComments(
  entityType: Ref<Comment['entityType']>,
  entityId: Ref<string>,
  projectId: Ref<string>,
  userRelation?: Ref<ProjectRelation>
) {
  const { user } = useAuth()

  // State
  const comments = ref<Comment[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const hasMore = ref(false)
  const total = ref(0)

  // Current user's color
  const myColor = computed<PostITColor>(() =>
    getColorForRole(userRelation?.value ?? 'anonym')
  )

  // Threaded comments (grouped by parent)
  const threads = computed<CommentThread[]>(() => {
    const rootComments = comments.value.filter(c => !c.parentId)
    return rootComments.map(parent => ({
      parent,
      replies: comments.value.filter(c => c.parentId === parent.id),
      totalCount: 1 + comments.value.filter(c => c.parentId === parent.id).length
    }))
  })

  // Pinned comments (always shown first)
  const pinnedComments = computed(() =>
    comments.value.filter(c => c.isPinned && !c.parentId)
  )

  // Count
  const commentCount = computed(() => comments.value.length)

  /**
   * Fetch comments from API
   */
  async function fetchComments(append = false) {
    if (!entityId.value || !projectId.value) return

    isLoading.value = true
    error.value = null

    try {
      const offset = append ? comments.value.length : 0
      const response = await fetch(
        `/api/comments?entity_type=${entityType.value}&entity_id=${entityId.value}&project_id=${projectId.value}&offset=${offset}&limit=20`
      )

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data: CommentsApiResponse = await response.json()

      if (append) {
        comments.value = [...comments.value, ...data.comments]
      } else {
        comments.value = data.comments
      }

      total.value = data.total
      hasMore.value = data.hasMore
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch comments'
      console.error('[usePostITComments] Fetch error:', err)
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Create a new comment
   */
  async function createComment(input: Omit<NewCommentInput, 'entityType' | 'entityId' | 'projectId'>): Promise<Comment | null> {
    if (!user.value) {
      error.value = 'Authentication required'
      return null
    }

    isLoading.value = true
    error.value = null

    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entity_type: entityType.value,
          entity_id: entityId.value,
          project_id: projectId.value,
          parent_id: input.parentId ?? null,
          content: input.content,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP ${response.status}`)
      }

      const { comment } = await response.json()

      // Add to local state
      comments.value = [comment, ...comments.value]
      total.value++

      // If reply, update parent's reply count
      if (input.parentId) {
        const parent = comments.value.find(c => c.id === input.parentId)
        if (parent) parent.replyCount++
      }

      return comment
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create comment'
      console.error('[usePostITComments] Create error:', err)
      return null
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Update a comment
   */
  async function updateComment(commentId: string, content: string): Promise<boolean> {
    isLoading.value = true
    error.value = null

    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const { comment: updated } = await response.json()

      // Update local state
      const index = comments.value.findIndex(c => c.id === commentId)
      if (index !== -1) {
        comments.value[index] = { ...comments.value[index], ...updated }
      }

      return true
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update comment'
      return false
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Delete a comment
   */
  async function deleteComment(commentId: string): Promise<boolean> {
    isLoading.value = true
    error.value = null

    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      // Get the comment to check if it's a reply
      const comment = comments.value.find(c => c.id === commentId)

      // Remove from local state
      comments.value = comments.value.filter(c => c.id !== commentId)
      total.value--

      // If reply, update parent's reply count
      if (comment?.parentId) {
        const parent = comments.value.find(c => c.id === comment.parentId)
        if (parent) parent.replyCount = Math.max(0, parent.replyCount - 1)
      }

      return true
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete comment'
      return false
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Toggle pin on a comment (owner only)
   */
  async function togglePin(commentId: string): Promise<boolean> {
    const comment = comments.value.find(c => c.id === commentId)
    if (!comment) return false

    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_pinned: !comment.isPinned }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      // Update local state
      comment.isPinned = !comment.isPinned
      return true
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to toggle pin'
      return false
    }
  }

  /**
   * Add reaction to a comment
   */
  async function addReaction(commentId: string, emoji: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/comments/${commentId}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      // Update local state
      const comment = comments.value.find(c => c.id === commentId)
      if (comment) {
        const existing = comment.reactions.find(r => r.emoji === emoji)
        if (existing) {
          existing.count++
          existing.hasReacted = true
        } else {
          comment.reactions.push({ emoji, count: 1, hasReacted: true })
        }
      }

      return true
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to add reaction'
      return false
    }
  }

  /**
   * Remove reaction from a comment
   */
  async function removeReaction(commentId: string, emoji: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/comments/${commentId}/reactions/${encodeURIComponent(emoji)}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      // Update local state
      const comment = comments.value.find(c => c.id === commentId)
      if (comment) {
        const existing = comment.reactions.find(r => r.emoji === emoji)
        if (existing) {
          existing.count = Math.max(0, existing.count - 1)
          existing.hasReacted = false
          if (existing.count === 0) {
            comment.reactions = comment.reactions.filter(r => r.emoji !== emoji)
          }
        }
      }

      return true
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to remove reaction'
      return false
    }
  }

  /**
   * Load more comments (pagination)
   */
  function loadMore() {
    if (hasMore.value && !isLoading.value) {
      fetchComments(true)
    }
  }

  /**
   * Refresh comments
   */
  function refresh() {
    fetchComments(false)
  }

  // Auto-fetch when entity changes
  watch(
    [entityType, entityId, projectId],
    () => {
      if (entityId.value && projectId.value) {
        fetchComments(false)
      }
    },
    { immediate: true }
  )

  return {
    // State
    comments,
    threads,
    pinnedComments,
    commentCount,
    total,
    hasMore,
    isLoading,
    error,

    // User's color
    myColor,

    // Actions
    fetchComments,
    createComment,
    updateComment,
    deleteComment,
    togglePin,
    addReaction,
    removeReaction,
    loadMore,
    refresh,

    // Helpers
    getColorForRole,
    COLOR_CSS_VARS,
    ROLE_COLOR_MAP,
  }
}

/**
 * Standalone helper for getting role color
 */
export function useRoleColor(relation: Ref<ProjectRelation>) {
  return computed(() => getColorForRole(relation.value))
}
