/**
 * Posts Permission Utilities
 * 
 * Shared permission checking functions for posts.
 * Implements the 15 rules from POSTS-WORKFLOW-SPEC.md
 * 
 * Naming Convention:
 * - P_ prefix = rule depends on project-level role (project→entity)
 * - No prefix = rule works at entity level only
 * 
 * Rules Reference:
 * 1. POST_ALLROLE_READ_RELEASED - Anyone reads released posts in released projects
 * 2. POST_OWNER_FULL - Post owner has full access
 * 3. POST_READ_P_OWNER - Project owner reads all posts
 * 4. POST_READ_P_MEMBER_DRAFT - Members read posts in draft+
 * 5. POST_READ_P_PARTICIPANT_REVIEW - Participants read posts in review+
 * 6. POST_READ_P_PARTNER_CONFIRMED - Partners read posts in confirmed+
 * 7. POST_READ_DEPTH_BY_PROJECT - Content depth by project state
 * 8. POST_WRITE_OWN - Post owner can edit own post
 * 9. POST_WRITE_P_OWNER - Project owner can edit any post
 * 10. POST_WRITE_P_MEMBER_EDITOR - Member with configrole=8 can edit
 * 11. POST_CREATE_P_MEMBER - Members can create in draft+ projects
 * 12. POST_TRANSITION_CREATOR_SUBMIT - Creator submits new→draft, draft→review
 * 13. POST_TRANSITION_P_OWNER_APPROVE - Project owner approves review→confirmed
 * 14. POST_TRANSITION_P_OWNER_REJECT - Project owner rejects review→draft
 * 15. POST_TRANSITION_P_OWNER_SKIP - Owner skips review if team ≤ 3
 */

// Status bit values (from sysreg)
export const STATUS = {
    NEW: 1,
    DEMO: 8,
    DRAFT: 64,
    REVIEW: 256,
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
 * Context for permission checks
 */
export interface PermissionContext {
    userId: number
    // Post info
    post?: {
        id: number
        owner_id: number
        status: number
        project_id: number
    }
    // Project info
    project: {
        id: number
        owner_id: number
        status: number
        team_size?: number  // For skip rule
    }
    // User's role in project (from project_members)
    membership?: {
        configrole: number  // 2=partner, 4=participant, 8=member
    }
}

/**
 * Content depth levels for read access
 */
export type ContentDepth = 'none' | 'summary' | 'core' | 'full'

// ============================================================
// ROLE CHECKS (Helper functions)
// ============================================================

export function isPostOwner(ctx: PermissionContext): boolean {
    return ctx.post?.owner_id === ctx.userId
}

export function isProjectOwner(ctx: PermissionContext): boolean {
    return ctx.project.owner_id === ctx.userId
}

export function isMember(ctx: PermissionContext): boolean {
    return ctx.membership?.configrole === CONFIGROLE.MEMBER
}

export function isParticipant(ctx: PermissionContext): boolean {
    return ctx.membership?.configrole === CONFIGROLE.PARTICIPANT
}

export function isPartner(ctx: PermissionContext): boolean {
    return ctx.membership?.configrole === CONFIGROLE.PARTNER
}

export function hasAnyProjectRole(ctx: PermissionContext): boolean {
    return isProjectOwner(ctx) || !!ctx.membership
}

// ============================================================
// READ RULES (1, 3-7)
// ============================================================

/**
 * Rule 1: POST_ALLROLE_READ_RELEASED
 * Anyone can read released posts in released projects
 */
export function canReadReleased(ctx: PermissionContext): boolean {
    if (!ctx.post) return false
    return ctx.post.status >= STATUS.RELEASED && ctx.project.status >= STATUS.RELEASED
}

/**
 * Rule 3: POST_READ_P_OWNER
 * Project owner can read all posts
 */
export function canReadAsProjectOwner(ctx: PermissionContext): boolean {
    return isProjectOwner(ctx)
}

/**
 * Rule 4: POST_READ_P_MEMBER_DRAFT
 * Members can read posts in draft+ state
 */
export function canReadAsMember(ctx: PermissionContext): boolean {
    if (!ctx.post) return false
    return isMember(ctx) && ctx.post.status >= STATUS.DRAFT
}

/**
 * Rule 5: POST_READ_P_PARTICIPANT_REVIEW
 * Participants can read posts in review+ state
 */
export function canReadAsParticipant(ctx: PermissionContext): boolean {
    if (!ctx.post) return false
    return isParticipant(ctx) && ctx.post.status >= STATUS.REVIEW
}

/**
 * Rule 6: POST_READ_P_PARTNER_CONFIRMED
 * Partners can read posts in confirmed+ state
 */
export function canReadAsPartner(ctx: PermissionContext): boolean {
    if (!ctx.post) return false
    return isPartner(ctx) && ctx.post.status >= STATUS.CONFIRMED
}

/**
 * Combined read permission check
 * Returns true if user can read the post
 */
export function canReadPost(ctx: PermissionContext): boolean {
    // Rule 2: Post owner always has access
    if (isPostOwner(ctx)) return true
    
    // Rule 1: Anyone can read released
    if (canReadReleased(ctx)) return true
    
    // Rule 3: Project owner reads all
    if (canReadAsProjectOwner(ctx)) return true
    
    // Rule 4: Members read draft+
    if (canReadAsMember(ctx)) return true
    
    // Rule 5: Participants read review+
    if (canReadAsParticipant(ctx)) return true
    
    // Rule 6: Partners read confirmed+
    if (canReadAsPartner(ctx)) return true
    
    return false
}

/**
 * Rule 7: POST_READ_DEPTH_BY_PROJECT
 * Determine content depth based on project state
 */
export function getContentDepth(ctx: PermissionContext): ContentDepth {
    const projectStatus = ctx.project.status
    
    // Project owner and post owner always get full depth
    if (isProjectOwner(ctx) || isPostOwner(ctx)) {
        return 'full'
    }
    
    if (projectStatus < STATUS.DEMO) {
        return 'none'  // new project - owner only
    }
    
    if (projectStatus < STATUS.DRAFT) {
        return 'summary'  // demo - headline + teaser only
    }
    
    if (projectStatus < STATUS.REVIEW) {
        return 'core'  // draft - headline + teaser + body (via modal)
    }
    
    return 'full'  // review+ - all fields + comments
}

// ============================================================
// WRITE RULES (2, 8-11)
// ============================================================

/**
 * Rule 2: POST_OWNER_FULL
 * Post owner has full access to their post
 */
export function hasFullAccessAsOwner(ctx: PermissionContext): boolean {
    return isPostOwner(ctx)
}

/**
 * Rule 8: POST_WRITE_OWN
 * Post owner can edit their own post
 */
export function canEditOwn(ctx: PermissionContext): boolean {
    return isPostOwner(ctx)
}

/**
 * Rule 9: POST_WRITE_P_OWNER
 * Project owner can edit any post
 */
export function canEditAsProjectOwner(ctx: PermissionContext): boolean {
    return isProjectOwner(ctx)
}

/**
 * Rule 10: POST_WRITE_P_MEMBER_EDITOR
 * Member with configrole=8 can edit any post in draft+ project
 */
export function canEditAsMemberEditor(ctx: PermissionContext): boolean {
    if (!ctx.post) return false
    return isMember(ctx) && 
           ctx.project.status >= STATUS.DRAFT && 
           ctx.post.status >= STATUS.DRAFT
}

/**
 * Combined edit permission check
 * Returns true if user can edit the post
 */
export function canEditPost(ctx: PermissionContext): boolean {
    // Rule 2/8: Post owner can edit
    if (canEditOwn(ctx)) return true
    
    // Rule 9: Project owner can edit any
    if (canEditAsProjectOwner(ctx)) return true
    
    // Rule 10: Member editor can edit
    if (canEditAsMemberEditor(ctx)) return true
    
    return false
}

/**
 * Rule 11: POST_CREATE_P_MEMBER
 * Members can create posts in draft+ projects
 */
export function canCreatePost(ctx: PermissionContext): boolean {
    // Project owner can always create
    if (isProjectOwner(ctx)) return true
    
    // Members can create in draft+ projects
    if (isMember(ctx) && ctx.project.status >= STATUS.DRAFT) return true
    
    return false
}

// ============================================================
// STATE TRANSITION RULES (12-15)
// ============================================================

/**
 * Valid state transitions
 */
export const VALID_TRANSITIONS: Record<number, number[]> = {
    [STATUS.NEW]: [STATUS.DRAFT, STATUS.TRASH],
    [STATUS.DRAFT]: [STATUS.REVIEW, STATUS.CONFIRMED, STATUS.TRASH],  // confirmed only if skip allowed
    [STATUS.REVIEW]: [STATUS.CONFIRMED, STATUS.DRAFT, STATUS.TRASH],  // draft = reject/send-back
    [STATUS.CONFIRMED]: [STATUS.RELEASED, STATUS.REVIEW, STATUS.TRASH],
    [STATUS.RELEASED]: [STATUS.ARCHIVED, STATUS.CONFIRMED, STATUS.TRASH],
    [STATUS.ARCHIVED]: [STATUS.RELEASED, STATUS.TRASH],
    [STATUS.TRASH]: [STATUS.DRAFT]  // restore
}

/**
 * Rule 12: POST_TRANSITION_CREATOR_SUBMIT
 * Creator can submit: new→draft, draft→review
 */
export function canSubmitAsCreator(ctx: PermissionContext, toStatus: number): boolean {
    if (!ctx.post) return false
    if (!isPostOwner(ctx)) return false
    
    const from = ctx.post.status
    
    // new → draft
    if (from === STATUS.NEW && toStatus === STATUS.DRAFT) return true
    
    // draft → review
    if (from === STATUS.DRAFT && toStatus === STATUS.REVIEW) return true
    
    return false
}

/**
 * Rule 13: POST_TRANSITION_P_OWNER_APPROVE
 * Project owner approves: review→confirmed
 */
export function canApprove(ctx: PermissionContext): boolean {
    if (!ctx.post) return false
    if (!isProjectOwner(ctx)) return false
    
    return ctx.post.status === STATUS.REVIEW
}

/**
 * Rule 14: POST_TRANSITION_P_OWNER_REJECT
 * Project owner rejects (send-back): review→draft
 */
export function canReject(ctx: PermissionContext): boolean {
    if (!ctx.post) return false
    if (!isProjectOwner(ctx)) return false
    
    return ctx.post.status === STATUS.REVIEW
}

/**
 * Rule 15: POST_TRANSITION_P_OWNER_SKIP
 * Project owner can skip review if team ≤ 3: draft→confirmed directly
 */
export function canSkipReview(ctx: PermissionContext): boolean {
    if (!ctx.post) return false
    if (!isProjectOwner(ctx)) return false
    if (ctx.post.status !== STATUS.DRAFT) return false
    
    // Team size check (owner + members ≤ 3)
    const teamSize = ctx.project.team_size ?? 1
    return teamSize <= 3
}

/**
 * Check if a specific state transition is allowed
 */
export function canTransition(ctx: PermissionContext, toStatus: number): boolean {
    if (!ctx.post) return false
    
    const fromStatus = ctx.post.status
    
    // Check if transition is structurally valid
    const validTargets = VALID_TRANSITIONS[fromStatus]
    if (!validTargets?.includes(toStatus)) return false
    
    // Post owner / project owner can always trash
    if (toStatus === STATUS.TRASH) {
        return isPostOwner(ctx) || isProjectOwner(ctx)
    }
    
    // Rule 12: Creator submit paths
    if (canSubmitAsCreator(ctx, toStatus)) return true
    
    // Rule 13: Approve
    if (fromStatus === STATUS.REVIEW && toStatus === STATUS.CONFIRMED) {
        return canApprove(ctx)
    }
    
    // Rule 14: Reject (send-back)
    if (fromStatus === STATUS.REVIEW && toStatus === STATUS.DRAFT) {
        return canReject(ctx)
    }
    
    // Rule 15: Skip review (draft → confirmed)
    if (fromStatus === STATUS.DRAFT && toStatus === STATUS.CONFIRMED) {
        return canSkipReview(ctx)
    }
    
    // Project owner can do other transitions (release, archive, restore)
    if (isProjectOwner(ctx)) return true
    
    return false
}

// ============================================================
// COMBINED PERMISSION OBJECT (for UI consumption)
// ============================================================

export interface PostPermissions {
    canRead: boolean
    canEdit: boolean
    canCreate: boolean
    canDelete: boolean
    canApprove: boolean
    canReject: boolean
    canSkipReview: boolean
    contentDepth: ContentDepth
    availableTransitions: number[]
}

/**
 * Get all permissions for a post in one call
 * Useful for UI components that need multiple permission checks
 */
export function getPostPermissions(ctx: PermissionContext): PostPermissions {
    const availableTransitions: number[] = []
    
    if (ctx.post) {
        const validTargets = VALID_TRANSITIONS[ctx.post.status] || []
        for (const target of validTargets) {
            if (canTransition(ctx, target)) {
                availableTransitions.push(target)
            }
        }
    }
    
    return {
        canRead: canReadPost(ctx),
        canEdit: canEditPost(ctx),
        canCreate: canCreatePost(ctx),
        canDelete: isPostOwner(ctx) || isProjectOwner(ctx),
        canApprove: canApprove(ctx),
        canReject: canReject(ctx),
        canSkipReview: canSkipReview(ctx),
        contentDepth: getContentDepth(ctx),
        availableTransitions
    }
}
