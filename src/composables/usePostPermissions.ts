/**
 * Posts Permission Composable
 * 
 * Vue composable for checking post permissions in the UI.
 * Mirrors the server-side rules from server/utils/posts-permissions.ts
 * 
 * Usage:
 * ```vue
 * const { canEdit, canCreate, contentDepth, availableTransitions } = usePostPermissions(post, project)
 * ```
 */

import { computed, type Ref, type ComputedRef } from 'vue'
import { useAuth } from './useAuth'

/**
 * Status bit values (mirror server/utils/posts-permissions.ts)
 * 
 * Bit allocation (3 bits per category):
 * - new:       bits 0-2  (1, 2, 3...)
 * - demo:      bits 3-5  (8, 16, 24...)
 * - draft:     bits 6-8  (64, 128, 192, 256...)
 * - confirmed: bits 9-11 (512, 1024...)
 * - released:  bits 12-14 (4096, 8192...)
 * - archived:  bit 15    (32768)
 * - trash:     bit 16    (65536)
 * 
 * Note: REVIEW (256) is a subcategory of DRAFT (parent_bit=64)
 * It represents "draft under review" in the workflow.
 */
export const STATUS = {
    NEW: 1,
    DEMO: 8,
    DRAFT: 64,
    REVIEW: 256,      // draft_review - subcategory of DRAFT
    CONFIRMED: 512,
    RELEASED: 4096,
    ARCHIVED: 32768,
    TRASH: 65536
} as const

// Project role configrole values
export const CONFIGROLE = {
    PARTNER: 2,
    PARTICIPANT: 4,
    MEMBER: 8
} as const

/**
 * Content depth levels for read access
 */
export type ContentDepth = 'none' | 'summary' | 'core' | 'full'

/**
 * Post data needed for permission checks
 */
export interface PostData {
    id: number
    owner_id?: number  // Deprecated: use owner_sysmail
    owner_sysmail?: string
    status: number
    project_id: number
}

/**
 * Project data needed for permission checks
 */
export interface ProjectData {
    id: number
    owner_id?: number  // Deprecated: use owner_sysmail
    owner_sysmail?: string
    status: number
    team_size?: number
}

/**
 * User's membership in the project
 */
export interface MembershipData {
    configrole: number
}

/**
 * Permission check results
 */
export interface PostPermissions {
    canRead: ComputedRef<boolean>
    canEdit: ComputedRef<boolean>
    canCreate: ComputedRef<boolean>
    canDelete: ComputedRef<boolean>
    canApprove: ComputedRef<boolean>
    canReject: ComputedRef<boolean>
    canSkipReview: ComputedRef<boolean>
    contentDepth: ComputedRef<ContentDepth>
    availableTransitions: ComputedRef<number[]>
}

/**
 * Valid state transitions
 */
const VALID_TRANSITIONS: Record<number, number[]> = {
    [STATUS.NEW]: [STATUS.DRAFT, STATUS.TRASH],
    [STATUS.DRAFT]: [STATUS.REVIEW, STATUS.CONFIRMED, STATUS.TRASH],
    [STATUS.REVIEW]: [STATUS.CONFIRMED, STATUS.DRAFT, STATUS.TRASH],
    [STATUS.CONFIRMED]: [STATUS.RELEASED, STATUS.REVIEW, STATUS.TRASH],
    [STATUS.RELEASED]: [STATUS.ARCHIVED, STATUS.CONFIRMED, STATUS.TRASH],
    [STATUS.ARCHIVED]: [STATUS.RELEASED, STATUS.TRASH],
    [STATUS.TRASH]: [STATUS.DRAFT]
}

/**
 * Posts permission composable
 * 
 * @param post - Reactive post data (or null for create-only checks)
 * @param project - Reactive project data
 * @param membership - Optional reactive membership data (auto-detected from useAuth if not provided)
 */
export function usePostPermissions(
    post: Ref<PostData | null>,
    project: Ref<ProjectData>,
    membership?: Ref<MembershipData | null>
) {
    const { user } = useAuth()

    // Get current user ID
    const userId = computed(() => {
        if (!user.value) return null
        return parseInt(user.value.id, 10)
    })

    // Auto-detect membership from current project context
    const effectiveMembership = computed(() => {
        if (membership?.value) return membership.value

        // Try to get from user's projects
        if (user.value?.projects) {
            const projectId = project.value?.id
            const currentProject = user.value.projects.find(
                (p: { domaincode: string; id: string }) =>
                    p.domaincode === projectId?.toString() ||
                    parseInt(p.id) === projectId
            )
            if (currentProject) {
                // Map project role to configrole
                if (currentProject.isOwner) return null  // Owner is separate
                if (currentProject.isMember) return { configrole: CONFIGROLE.MEMBER }
                // Participant/partner detection would need more data
            }
        }
        return null
    })

    // ============================================================
    // ROLE CHECKS
    // ============================================================

    // Get user sysmail for ownership checks
    const userSysmail = computed(() => user.value?.sysmail || null)

    const isPostOwner = computed(() => {
        if (!post.value || !userSysmail.value) return false
        // Prefer sysmail comparison, fallback to ID comparison
        if (post.value.owner_sysmail) {
            return post.value.owner_sysmail === userSysmail.value
        }
        // Fallback: compare IDs (deprecated)
        return userId.value ? post.value.owner_id === userId.value : false
    })

    const isProjectOwner = computed(() => {
        if (!project.value || !userSysmail.value) return false
        // Prefer sysmail comparison, fallback to ID comparison
        if (project.value.owner_sysmail) {
            return project.value.owner_sysmail === userSysmail.value
        }
        // Fallback: compare IDs (deprecated)
        return userId.value ? project.value.owner_id === userId.value : false
    })

    const isMember = computed(() => {
        return effectiveMembership.value?.configrole === CONFIGROLE.MEMBER
    })

    const isParticipant = computed(() => {
        return effectiveMembership.value?.configrole === CONFIGROLE.PARTICIPANT
    })

    const isPartner = computed(() => {
        return effectiveMembership.value?.configrole === CONFIGROLE.PARTNER
    })

    // ============================================================
    // READ PERMISSIONS
    // ============================================================

    const canRead = computed(() => {
        if (!post.value) return false

        // Rule 2: Post owner always has access
        if (isPostOwner.value) return true

        // Rule 1: Anyone can read released posts in released projects
        if (post.value.status >= STATUS.RELEASED && project.value.status >= STATUS.RELEASED) {
            return true
        }

        // Rule 3: Project owner reads all
        if (isProjectOwner.value) return true

        // Rule 4: Members read draft+
        if (isMember.value && post.value.status >= STATUS.DRAFT) return true

        // Rule 5: Participants read review+
        if (isParticipant.value && post.value.status >= STATUS.REVIEW) return true

        // Rule 6: Partners read confirmed+
        if (isPartner.value && post.value.status >= STATUS.CONFIRMED) return true

        return false
    })

    // ============================================================
    // CONTENT DEPTH (Rule 7)
    // ============================================================

    const contentDepth = computed<ContentDepth>(() => {
        // Project owner and post owner always get full depth
        if (isProjectOwner.value || isPostOwner.value) {
            return 'full'
        }

        const projectStatus = project.value.status

        if (projectStatus < STATUS.DEMO) return 'none'
        if (projectStatus < STATUS.DRAFT) return 'summary'
        if (projectStatus < STATUS.REVIEW) return 'core'
        return 'full'
    })

    // ============================================================
    // WRITE PERMISSIONS
    // ============================================================

    const canEdit = computed(() => {
        if (!post.value) return false

        // Rule 8: Post owner can edit
        if (isPostOwner.value) return true

        // Rule 9: Project owner can edit any
        if (isProjectOwner.value) return true

        // Rule 10: Member editor can edit in draft+ project
        if (isMember.value &&
            project.value.status >= STATUS.DRAFT &&
            post.value.status >= STATUS.DRAFT) {
            return true
        }

        return false
    })

    const canCreate = computed(() => {
        // Project owner can always create
        if (isProjectOwner.value) return true

        // Rule 11: Members can create in draft+ projects
        if (isMember.value && project.value.status >= STATUS.DRAFT) return true

        return false
    })

    const canDelete = computed(() => {
        return isPostOwner.value || isProjectOwner.value
    })

    // ============================================================
    // STATE TRANSITIONS
    // ============================================================

    const canApprove = computed(() => {
        if (!post.value) return false
        return isProjectOwner.value && post.value.status === STATUS.REVIEW
    })

    const canReject = computed(() => {
        if (!post.value) return false
        return isProjectOwner.value && post.value.status === STATUS.REVIEW
    })

    const canSkipReview = computed(() => {
        if (!post.value) return false
        if (!isProjectOwner.value) return false
        if (post.value.status !== STATUS.DRAFT) return false

        const teamSize = project.value.team_size ?? 1
        return teamSize <= 3
    })

    const availableTransitions = computed(() => {
        if (!post.value) return []

        const validTargets = VALID_TRANSITIONS[post.value.status] || []
        const result: number[] = []

        for (const target of validTargets) {
            if (canTransitionTo(target)) {
                result.push(target)
            }
        }

        return result
    })

    /**
     * Check if transition to specific status is allowed
     */
    function canTransitionTo(toStatus: number): boolean {
        if (!post.value) return false

        const fromStatus = post.value.status
        const validTargets = VALID_TRANSITIONS[fromStatus]
        if (!validTargets?.includes(toStatus)) return false

        // Trash: post owner or project owner
        if (toStatus === STATUS.TRASH) {
            return isPostOwner.value || isProjectOwner.value
        }

        // Rule 12: Creator submit paths (new→draft, draft→review)
        if (isPostOwner.value) {
            if (fromStatus === STATUS.NEW && toStatus === STATUS.DRAFT) return true
            if (fromStatus === STATUS.DRAFT && toStatus === STATUS.REVIEW) return true
        }

        // Rule 13: Approve (review→confirmed)
        if (fromStatus === STATUS.REVIEW && toStatus === STATUS.CONFIRMED) {
            return isProjectOwner.value
        }

        // Rule 14: Reject (review→draft)
        if (fromStatus === STATUS.REVIEW && toStatus === STATUS.DRAFT) {
            return isProjectOwner.value
        }

        // Rule 15: Skip review (draft→confirmed) - only if team ≤ 3
        if (fromStatus === STATUS.DRAFT && toStatus === STATUS.CONFIRMED) {
            return canSkipReview.value
        }

        // Other transitions: project owner only
        return isProjectOwner.value
    }

    return {
        // Role checks (exposed for UI conditional logic)
        isPostOwner,
        isProjectOwner,
        isMember,
        isParticipant,
        isPartner,

        // Permissions
        canRead,
        canEdit,
        canCreate,
        canDelete,
        canApprove,
        canReject,
        canSkipReview,
        contentDepth,
        availableTransitions,

        // Utility
        canTransitionTo
    }
}

/**
 * Simple permission check for single post (non-reactive)
 * Useful for one-time checks in event handlers
 */
export function checkPostPermission(
    action: 'read' | 'edit' | 'create' | 'delete',
    post: PostData | null,
    project: ProjectData,
    userId: number,
    membership: MembershipData | null
): boolean {
    const isPostOwner = post?.owner_id === userId
    const isProjectOwner = project.owner_id === userId
    const isMember = membership?.configrole === CONFIGROLE.MEMBER
    const isParticipant = membership?.configrole === CONFIGROLE.PARTICIPANT
    const isPartner = membership?.configrole === CONFIGROLE.PARTNER

    switch (action) {
        case 'read':
            if (!post) return false
            if (isPostOwner) return true
            if (post.status >= STATUS.RELEASED && project.status >= STATUS.RELEASED) return true
            if (isProjectOwner) return true
            if (isMember && post.status >= STATUS.DRAFT) return true
            if (isParticipant && post.status >= STATUS.REVIEW) return true
            if (isPartner && post.status >= STATUS.CONFIRMED) return true
            return false

        case 'edit':
            if (!post) return false
            if (isPostOwner) return true
            if (isProjectOwner) return true
            if (isMember && project.status >= STATUS.DRAFT && post.status >= STATUS.DRAFT) return true
            return false

        case 'create':
            if (isProjectOwner) return true
            if (isMember && project.status >= STATUS.DRAFT) return true
            return false

        case 'delete':
            if (!post) return false
            return isPostOwner || isProjectOwner
    }
}
