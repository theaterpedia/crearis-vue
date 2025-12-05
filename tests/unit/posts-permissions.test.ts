/**
 * Unit Tests: posts-permissions
 * 
 * Tests the 15 posts permission rules as pure functions.
 * All functions are tested without database dependencies.
 * 
 * Rules Tested:
 * - Rule 1: POST_ALLROLE_READ_RELEASED
 * - Rule 2: POST_OWNER_FULL
 * - Rule 3: POST_READ_P_OWNER
 * - Rule 4: POST_READ_P_MEMBER_DRAFT
 * - Rule 5: POST_READ_P_PARTICIPANT_REVIEW
 * - Rule 6: POST_READ_P_PARTNER_CONFIRMED
 * - Rule 7: POST_READ_DEPTH_BY_PROJECT
 * - Rule 8: POST_WRITE_OWN
 * - Rule 9: POST_WRITE_P_OWNER
 * - Rule 10: POST_WRITE_P_MEMBER_EDITOR
 * - Rule 11: POST_CREATE_P_MEMBER
 * - Rule 12: POST_TRANSITION_CREATOR_SUBMIT
 * - Rule 13: POST_TRANSITION_P_OWNER_APPROVE
 * - Rule 14: POST_TRANSITION_P_OWNER_REJECT
 * - Rule 15: POST_TRANSITION_P_OWNER_SKIP
 * 
 * Test Users (from reset-test-data):
 * - Hans: Project owner (uuid: 'hans-uuid')
 * - Nina: Member, configrole=8 (uuid: 'nina-uuid')
 * - Rosa: Participant, configrole=4 (uuid: 'rosa-uuid')
 * - Marc: Partner, configrole=2 (uuid: 'marc-uuid')
 * - Visitor: No membership (uuid: 'visitor-uuid')
 * 
 * Total: 60+ tests
 */

import { describe, it, expect } from 'vitest'
import {
    STATUS,
    CONFIGROLE,
    type PermissionContext,
    // Role helpers
    isPostOwner,
    isProjectOwner,
    isMember,
    isParticipant,
    isPartner,
    hasAnyProjectRole,
    // Read rules
    canReadReleased,
    canReadAsProjectOwner,
    canReadAsMember,
    canReadAsParticipant,
    canReadAsPartner,
    canReadPost,
    getContentDepth,
    // Write rules
    hasFullAccessAsOwner,
    canEditOwn,
    canEditAsProjectOwner,
    canEditAsMemberEditor,
    canEditPost,
    canCreatePost,
    // Transition rules
    canSubmitAsCreator,
    canApprove,
    canReject,
    canSkipReview,
    canTransition,
    VALID_TRANSITIONS,
    // Combined
    getPostPermissions
} from '../../server/utils/posts-permissions'

// ============================================================================
// Test Fixtures
// ============================================================================

const USERS = {
    HANS: 'hans-uuid',      // Project owner
    NINA: 'nina-uuid',      // Member (configrole=8)
    ROSA: 'rosa-uuid',      // Participant (configrole=4)
    MARC: 'marc-uuid',      // Partner (configrole=2)
    VISITOR: 'visitor-uuid' // No membership
}

function createProject(status: number, ownerId = USERS.HANS, teamSize = 5) {
    return {
        id: 1,
        owner_id: ownerId,
        status,
        team_size: teamSize
    }
}

function createPost(status: number, ownerId: string) {
    return {
        id: 100,
        owner_id: ownerId,
        status
    }
}

function createMembership(userId: string, configrole: number) {
    return {
        user_id: userId,
        configrole
    }
}

function createContext(
    userId: string,
    project: ReturnType<typeof createProject>,
    post?: ReturnType<typeof createPost>,
    membership?: ReturnType<typeof createMembership>
): PermissionContext {
    return { userId, project, post, membership }
}

// ============================================================================
// ROLE HELPER TESTS
// ============================================================================

describe('Role Helpers', () => {
    describe('isPostOwner', () => {
        it('returns true when user owns the post', () => {
            const ctx = createContext(
                USERS.NINA,
                createProject(STATUS.DRAFT),
                createPost(STATUS.DRAFT, USERS.NINA)
            )
            expect(isPostOwner(ctx)).toBe(true)
        })

        it('returns false when user does not own the post', () => {
            const ctx = createContext(
                USERS.ROSA,
                createProject(STATUS.DRAFT),
                createPost(STATUS.DRAFT, USERS.NINA)
            )
            expect(isPostOwner(ctx)).toBe(false)
        })

        it('returns false when no post in context', () => {
            const ctx = createContext(USERS.NINA, createProject(STATUS.DRAFT))
            expect(isPostOwner(ctx)).toBe(false)
        })
    })

    describe('isProjectOwner', () => {
        it('returns true when user owns the project', () => {
            const ctx = createContext(USERS.HANS, createProject(STATUS.DRAFT))
            expect(isProjectOwner(ctx)).toBe(true)
        })

        it('returns false when user does not own the project', () => {
            const ctx = createContext(USERS.NINA, createProject(STATUS.DRAFT))
            expect(isProjectOwner(ctx)).toBe(false)
        })
    })

    describe('isMember', () => {
        it('returns true for member (configrole=8)', () => {
            const ctx = createContext(
                USERS.NINA,
                createProject(STATUS.DRAFT),
                undefined,
                createMembership(USERS.NINA, CONFIGROLE.MEMBER)
            )
            expect(isMember(ctx)).toBe(true)
        })

        it('returns false for participant', () => {
            const ctx = createContext(
                USERS.ROSA,
                createProject(STATUS.DRAFT),
                undefined,
                createMembership(USERS.ROSA, CONFIGROLE.PARTICIPANT)
            )
            expect(isMember(ctx)).toBe(false)
        })

        it('returns false without membership', () => {
            const ctx = createContext(USERS.VISITOR, createProject(STATUS.DRAFT))
            expect(isMember(ctx)).toBe(false)
        })
    })

    describe('isParticipant', () => {
        it('returns true for participant (configrole=4)', () => {
            const ctx = createContext(
                USERS.ROSA,
                createProject(STATUS.DRAFT),
                undefined,
                createMembership(USERS.ROSA, CONFIGROLE.PARTICIPANT)
            )
            expect(isParticipant(ctx)).toBe(true)
        })

        it('returns false for member', () => {
            const ctx = createContext(
                USERS.NINA,
                createProject(STATUS.DRAFT),
                undefined,
                createMembership(USERS.NINA, CONFIGROLE.MEMBER)
            )
            expect(isParticipant(ctx)).toBe(false)
        })
    })

    describe('isPartner', () => {
        it('returns true for partner (configrole=2)', () => {
            const ctx = createContext(
                USERS.MARC,
                createProject(STATUS.DRAFT),
                undefined,
                createMembership(USERS.MARC, CONFIGROLE.PARTNER)
            )
            expect(isPartner(ctx)).toBe(true)
        })

        it('returns false for participant', () => {
            const ctx = createContext(
                USERS.ROSA,
                createProject(STATUS.DRAFT),
                undefined,
                createMembership(USERS.ROSA, CONFIGROLE.PARTICIPANT)
            )
            expect(isPartner(ctx)).toBe(false)
        })
    })

    describe('hasAnyProjectRole', () => {
        it('returns true for project owner', () => {
            const ctx = createContext(USERS.HANS, createProject(STATUS.DRAFT))
            expect(hasAnyProjectRole(ctx)).toBe(true)
        })

        it('returns true for member', () => {
            const ctx = createContext(
                USERS.NINA,
                createProject(STATUS.DRAFT),
                undefined,
                createMembership(USERS.NINA, CONFIGROLE.MEMBER)
            )
            expect(hasAnyProjectRole(ctx)).toBe(true)
        })

        it('returns false for visitor', () => {
            const ctx = createContext(USERS.VISITOR, createProject(STATUS.DRAFT))
            expect(hasAnyProjectRole(ctx)).toBe(false)
        })
    })
})

// ============================================================================
// READ RULES (1, 3-7)
// ============================================================================

describe('Read Rules', () => {
    // Rule 1: POST_ALLROLE_READ_RELEASED
    describe('Rule 1: canReadReleased', () => {
        it('returns true for released post in released project', () => {
            const ctx = createContext(
                USERS.VISITOR,
                createProject(STATUS.RELEASED),
                createPost(STATUS.RELEASED, USERS.NINA)
            )
            expect(canReadReleased(ctx)).toBe(true)
        })

        it('returns false for draft post in released project', () => {
            const ctx = createContext(
                USERS.VISITOR,
                createProject(STATUS.RELEASED),
                createPost(STATUS.DRAFT, USERS.NINA)
            )
            expect(canReadReleased(ctx)).toBe(false)
        })

        it('returns false for released post in draft project', () => {
            const ctx = createContext(
                USERS.VISITOR,
                createProject(STATUS.DRAFT),
                createPost(STATUS.RELEASED, USERS.NINA)
            )
            expect(canReadReleased(ctx)).toBe(false)
        })

        it('returns false without post', () => {
            const ctx = createContext(USERS.VISITOR, createProject(STATUS.RELEASED))
            expect(canReadReleased(ctx)).toBe(false)
        })
    })

    // Rule 3: POST_READ_P_OWNER
    describe('Rule 3: canReadAsProjectOwner', () => {
        it('returns true for project owner', () => {
            const ctx = createContext(
                USERS.HANS,
                createProject(STATUS.NEW),
                createPost(STATUS.NEW, USERS.NINA)
            )
            expect(canReadAsProjectOwner(ctx)).toBe(true)
        })

        it('returns false for non-owner', () => {
            const ctx = createContext(
                USERS.NINA,
                createProject(STATUS.DRAFT),
                createPost(STATUS.DRAFT, USERS.NINA)
            )
            expect(canReadAsProjectOwner(ctx)).toBe(false)
        })
    })

    // Rule 4: POST_READ_P_MEMBER_DRAFT
    describe('Rule 4: canReadAsMember', () => {
        it('returns true for member reading draft post', () => {
            const ctx = createContext(
                USERS.NINA,
                createProject(STATUS.DRAFT),
                createPost(STATUS.DRAFT, USERS.HANS),
                createMembership(USERS.NINA, CONFIGROLE.MEMBER)
            )
            expect(canReadAsMember(ctx)).toBe(true)
        })

        it('returns false for member reading new post', () => {
            const ctx = createContext(
                USERS.NINA,
                createProject(STATUS.DRAFT),
                createPost(STATUS.NEW, USERS.HANS),
                createMembership(USERS.NINA, CONFIGROLE.MEMBER)
            )
            expect(canReadAsMember(ctx)).toBe(false)
        })

        it('returns false for participant reading draft post', () => {
            const ctx = createContext(
                USERS.ROSA,
                createProject(STATUS.DRAFT),
                createPost(STATUS.DRAFT, USERS.HANS),
                createMembership(USERS.ROSA, CONFIGROLE.PARTICIPANT)
            )
            expect(canReadAsMember(ctx)).toBe(false)
        })
    })

    // Rule 5: POST_READ_P_PARTICIPANT_REVIEW
    describe('Rule 5: canReadAsParticipant', () => {
        it('returns true for participant reading review post', () => {
            const ctx = createContext(
                USERS.ROSA,
                createProject(STATUS.DRAFT),
                createPost(STATUS.REVIEW, USERS.NINA),
                createMembership(USERS.ROSA, CONFIGROLE.PARTICIPANT)
            )
            expect(canReadAsParticipant(ctx)).toBe(true)
        })

        it('returns false for participant reading draft post', () => {
            const ctx = createContext(
                USERS.ROSA,
                createProject(STATUS.DRAFT),
                createPost(STATUS.DRAFT, USERS.NINA),
                createMembership(USERS.ROSA, CONFIGROLE.PARTICIPANT)
            )
            expect(canReadAsParticipant(ctx)).toBe(false)
        })
    })

    // Rule 6: POST_READ_P_PARTNER_CONFIRMED
    describe('Rule 6: canReadAsPartner', () => {
        it('returns true for partner reading confirmed post', () => {
            const ctx = createContext(
                USERS.MARC,
                createProject(STATUS.DRAFT),
                createPost(STATUS.CONFIRMED, USERS.NINA),
                createMembership(USERS.MARC, CONFIGROLE.PARTNER)
            )
            expect(canReadAsPartner(ctx)).toBe(true)
        })

        it('returns false for partner reading review post', () => {
            const ctx = createContext(
                USERS.MARC,
                createProject(STATUS.DRAFT),
                createPost(STATUS.REVIEW, USERS.NINA),
                createMembership(USERS.MARC, CONFIGROLE.PARTNER)
            )
            expect(canReadAsPartner(ctx)).toBe(false)
        })
    })

    // Combined read test
    describe('canReadPost (combined)', () => {
        it('returns true for post owner regardless of status', () => {
            const ctx = createContext(
                USERS.NINA,
                createProject(STATUS.NEW),
                createPost(STATUS.NEW, USERS.NINA)
            )
            expect(canReadPost(ctx)).toBe(true)
        })

        it('returns true for visitor on released post in released project', () => {
            const ctx = createContext(
                USERS.VISITOR,
                createProject(STATUS.RELEASED),
                createPost(STATUS.RELEASED, USERS.NINA)
            )
            expect(canReadPost(ctx)).toBe(true)
        })

        it('returns false for visitor on draft post', () => {
            const ctx = createContext(
                USERS.VISITOR,
                createProject(STATUS.DRAFT),
                createPost(STATUS.DRAFT, USERS.NINA)
            )
            expect(canReadPost(ctx)).toBe(false)
        })

        it('returns true for project owner on any post', () => {
            const ctx = createContext(
                USERS.HANS,
                createProject(STATUS.NEW),
                createPost(STATUS.NEW, USERS.NINA)
            )
            expect(canReadPost(ctx)).toBe(true)
        })
    })

    // Rule 7: POST_READ_DEPTH_BY_PROJECT
    describe('Rule 7: getContentDepth', () => {
        it('returns "none" for new project (non-owner)', () => {
            const ctx = createContext(
                USERS.VISITOR,
                createProject(STATUS.NEW),
                createPost(STATUS.NEW, USERS.NINA)
            )
            expect(getContentDepth(ctx)).toBe('none')
        })

        it('returns "summary" for demo project', () => {
            const ctx = createContext(
                USERS.VISITOR,
                createProject(STATUS.DEMO),
                createPost(STATUS.DRAFT, USERS.NINA)
            )
            expect(getContentDepth(ctx)).toBe('summary')
        })

        it('returns "core" for draft project', () => {
            const ctx = createContext(
                USERS.VISITOR,
                createProject(STATUS.DRAFT),
                createPost(STATUS.DRAFT, USERS.NINA)
            )
            expect(getContentDepth(ctx)).toBe('core')
        })

        it('returns "full" for review+ project', () => {
            const ctx = createContext(
                USERS.VISITOR,
                createProject(STATUS.REVIEW),
                createPost(STATUS.REVIEW, USERS.NINA)
            )
            expect(getContentDepth(ctx)).toBe('full')
        })

        it('returns "full" for project owner regardless of status', () => {
            const ctx = createContext(
                USERS.HANS,
                createProject(STATUS.NEW),
                createPost(STATUS.NEW, USERS.NINA)
            )
            expect(getContentDepth(ctx)).toBe('full')
        })

        it('returns "full" for post owner regardless of project status', () => {
            const ctx = createContext(
                USERS.NINA,
                createProject(STATUS.NEW),
                createPost(STATUS.NEW, USERS.NINA)
            )
            expect(getContentDepth(ctx)).toBe('full')
        })
    })
})

// ============================================================================
// WRITE RULES (2, 8-11)
// ============================================================================

describe('Write Rules', () => {
    // Rule 2: POST_OWNER_FULL
    describe('Rule 2: hasFullAccessAsOwner', () => {
        it('returns true for post owner', () => {
            const ctx = createContext(
                USERS.NINA,
                createProject(STATUS.DRAFT),
                createPost(STATUS.DRAFT, USERS.NINA)
            )
            expect(hasFullAccessAsOwner(ctx)).toBe(true)
        })

        it('returns false for non-owner', () => {
            const ctx = createContext(
                USERS.ROSA,
                createProject(STATUS.DRAFT),
                createPost(STATUS.DRAFT, USERS.NINA)
            )
            expect(hasFullAccessAsOwner(ctx)).toBe(false)
        })
    })

    // Rule 8: POST_WRITE_OWN
    describe('Rule 8: canEditOwn', () => {
        it('returns true for post owner', () => {
            const ctx = createContext(
                USERS.NINA,
                createProject(STATUS.DRAFT),
                createPost(STATUS.DRAFT, USERS.NINA)
            )
            expect(canEditOwn(ctx)).toBe(true)
        })

        it('returns false for non-owner', () => {
            const ctx = createContext(
                USERS.ROSA,
                createProject(STATUS.DRAFT),
                createPost(STATUS.DRAFT, USERS.NINA),
                createMembership(USERS.ROSA, CONFIGROLE.PARTICIPANT)
            )
            expect(canEditOwn(ctx)).toBe(false)
        })
    })

    // Rule 9: POST_WRITE_P_OWNER
    describe('Rule 9: canEditAsProjectOwner', () => {
        it('returns true for project owner', () => {
            const ctx = createContext(
                USERS.HANS,
                createProject(STATUS.DRAFT),
                createPost(STATUS.DRAFT, USERS.NINA)
            )
            expect(canEditAsProjectOwner(ctx)).toBe(true)
        })

        it('returns false for member', () => {
            const ctx = createContext(
                USERS.NINA,
                createProject(STATUS.DRAFT),
                createPost(STATUS.DRAFT, USERS.ROSA),
                createMembership(USERS.NINA, CONFIGROLE.MEMBER)
            )
            expect(canEditAsProjectOwner(ctx)).toBe(false)
        })
    })

    // Rule 10: POST_WRITE_P_MEMBER_EDITOR
    describe('Rule 10: canEditAsMemberEditor', () => {
        it('returns true for member editing draft post in draft project', () => {
            const ctx = createContext(
                USERS.NINA,
                createProject(STATUS.DRAFT),
                createPost(STATUS.DRAFT, USERS.ROSA),
                createMembership(USERS.NINA, CONFIGROLE.MEMBER)
            )
            expect(canEditAsMemberEditor(ctx)).toBe(true)
        })

        it('returns false for member editing new post', () => {
            const ctx = createContext(
                USERS.NINA,
                createProject(STATUS.DRAFT),
                createPost(STATUS.NEW, USERS.ROSA),
                createMembership(USERS.NINA, CONFIGROLE.MEMBER)
            )
            expect(canEditAsMemberEditor(ctx)).toBe(false)
        })

        it('returns false for participant editing draft post', () => {
            const ctx = createContext(
                USERS.ROSA,
                createProject(STATUS.DRAFT),
                createPost(STATUS.DRAFT, USERS.NINA),
                createMembership(USERS.ROSA, CONFIGROLE.PARTICIPANT)
            )
            expect(canEditAsMemberEditor(ctx)).toBe(false)
        })

        it('returns false for member when project is new', () => {
            const ctx = createContext(
                USERS.NINA,
                createProject(STATUS.NEW),
                createPost(STATUS.DRAFT, USERS.ROSA),
                createMembership(USERS.NINA, CONFIGROLE.MEMBER)
            )
            expect(canEditAsMemberEditor(ctx)).toBe(false)
        })
    })

    // Combined edit test
    describe('canEditPost (combined)', () => {
        it('returns true for post owner', () => {
            const ctx = createContext(
                USERS.NINA,
                createProject(STATUS.DRAFT),
                createPost(STATUS.DRAFT, USERS.NINA)
            )
            expect(canEditPost(ctx)).toBe(true)
        })

        it('returns true for project owner', () => {
            const ctx = createContext(
                USERS.HANS,
                createProject(STATUS.DRAFT),
                createPost(STATUS.DRAFT, USERS.NINA)
            )
            expect(canEditPost(ctx)).toBe(true)
        })

        it('returns true for member editor', () => {
            const ctx = createContext(
                USERS.NINA,
                createProject(STATUS.DRAFT),
                createPost(STATUS.DRAFT, USERS.ROSA),
                createMembership(USERS.NINA, CONFIGROLE.MEMBER)
            )
            expect(canEditPost(ctx)).toBe(true)
        })

        it('returns false for participant', () => {
            const ctx = createContext(
                USERS.ROSA,
                createProject(STATUS.DRAFT),
                createPost(STATUS.DRAFT, USERS.NINA),
                createMembership(USERS.ROSA, CONFIGROLE.PARTICIPANT)
            )
            expect(canEditPost(ctx)).toBe(false)
        })
    })

    // Rule 11: POST_CREATE_P_MEMBER
    describe('Rule 11: canCreatePost', () => {
        it('returns true for project owner in any project status', () => {
            const ctx = createContext(USERS.HANS, createProject(STATUS.NEW))
            expect(canCreatePost(ctx)).toBe(true)
        })

        it('returns true for member in draft project', () => {
            const ctx = createContext(
                USERS.NINA,
                createProject(STATUS.DRAFT),
                undefined,
                createMembership(USERS.NINA, CONFIGROLE.MEMBER)
            )
            expect(canCreatePost(ctx)).toBe(true)
        })

        it('returns false for member in new project', () => {
            const ctx = createContext(
                USERS.NINA,
                createProject(STATUS.NEW),
                undefined,
                createMembership(USERS.NINA, CONFIGROLE.MEMBER)
            )
            expect(canCreatePost(ctx)).toBe(false)
        })

        it('returns false for participant', () => {
            const ctx = createContext(
                USERS.ROSA,
                createProject(STATUS.DRAFT),
                undefined,
                createMembership(USERS.ROSA, CONFIGROLE.PARTICIPANT)
            )
            expect(canCreatePost(ctx)).toBe(false)
        })

        it('returns false for visitor', () => {
            const ctx = createContext(USERS.VISITOR, createProject(STATUS.DRAFT))
            expect(canCreatePost(ctx)).toBe(false)
        })
    })
})

// ============================================================================
// STATE TRANSITION RULES (12-15)
// ============================================================================

describe('State Transition Rules', () => {
    // Rule 12: POST_TRANSITION_CREATOR_SUBMIT
    describe('Rule 12: canSubmitAsCreator', () => {
        it('allows new→draft for post owner', () => {
            const ctx = createContext(
                USERS.NINA,
                createProject(STATUS.DRAFT),
                createPost(STATUS.NEW, USERS.NINA)
            )
            expect(canSubmitAsCreator(ctx, STATUS.DRAFT)).toBe(true)
        })

        it('allows draft→review for post owner', () => {
            const ctx = createContext(
                USERS.NINA,
                createProject(STATUS.DRAFT),
                createPost(STATUS.DRAFT, USERS.NINA)
            )
            expect(canSubmitAsCreator(ctx, STATUS.REVIEW)).toBe(true)
        })

        it('denies new→draft for non-owner', () => {
            const ctx = createContext(
                USERS.ROSA,
                createProject(STATUS.DRAFT),
                createPost(STATUS.NEW, USERS.NINA)
            )
            expect(canSubmitAsCreator(ctx, STATUS.DRAFT)).toBe(false)
        })

        it('denies draft→confirmed for post owner (wrong transition)', () => {
            const ctx = createContext(
                USERS.NINA,
                createProject(STATUS.DRAFT),
                createPost(STATUS.DRAFT, USERS.NINA)
            )
            expect(canSubmitAsCreator(ctx, STATUS.CONFIRMED)).toBe(false)
        })
    })

    // Rule 13: POST_TRANSITION_P_OWNER_APPROVE
    describe('Rule 13: canApprove', () => {
        it('returns true for project owner on review post', () => {
            const ctx = createContext(
                USERS.HANS,
                createProject(STATUS.DRAFT),
                createPost(STATUS.REVIEW, USERS.NINA)
            )
            expect(canApprove(ctx)).toBe(true)
        })

        it('returns false for project owner on draft post', () => {
            const ctx = createContext(
                USERS.HANS,
                createProject(STATUS.DRAFT),
                createPost(STATUS.DRAFT, USERS.NINA)
            )
            expect(canApprove(ctx)).toBe(false)
        })

        it('returns false for non-project-owner', () => {
            const ctx = createContext(
                USERS.NINA,
                createProject(STATUS.DRAFT),
                createPost(STATUS.REVIEW, USERS.ROSA),
                createMembership(USERS.NINA, CONFIGROLE.MEMBER)
            )
            expect(canApprove(ctx)).toBe(false)
        })
    })

    // Rule 14: POST_TRANSITION_P_OWNER_REJECT
    describe('Rule 14: canReject', () => {
        it('returns true for project owner on review post', () => {
            const ctx = createContext(
                USERS.HANS,
                createProject(STATUS.DRAFT),
                createPost(STATUS.REVIEW, USERS.NINA)
            )
            expect(canReject(ctx)).toBe(true)
        })

        it('returns false for project owner on confirmed post', () => {
            const ctx = createContext(
                USERS.HANS,
                createProject(STATUS.DRAFT),
                createPost(STATUS.CONFIRMED, USERS.NINA)
            )
            expect(canReject(ctx)).toBe(false)
        })

        it('returns false for member', () => {
            const ctx = createContext(
                USERS.NINA,
                createProject(STATUS.DRAFT),
                createPost(STATUS.REVIEW, USERS.ROSA),
                createMembership(USERS.NINA, CONFIGROLE.MEMBER)
            )
            expect(canReject(ctx)).toBe(false)
        })
    })

    // Rule 15: POST_TRANSITION_P_OWNER_SKIP
    describe('Rule 15: canSkipReview', () => {
        it('returns true for project owner with small team (≤3)', () => {
            const ctx = createContext(
                USERS.HANS,
                createProject(STATUS.DRAFT, USERS.HANS, 2),
                createPost(STATUS.DRAFT, USERS.NINA)
            )
            expect(canSkipReview(ctx)).toBe(true)
        })

        it('returns false for project owner with large team (>3)', () => {
            const ctx = createContext(
                USERS.HANS,
                createProject(STATUS.DRAFT, USERS.HANS, 5),
                createPost(STATUS.DRAFT, USERS.NINA)
            )
            expect(canSkipReview(ctx)).toBe(false)
        })

        it('returns false for non-project-owner', () => {
            const ctx = createContext(
                USERS.NINA,
                createProject(STATUS.DRAFT, USERS.HANS, 2),
                createPost(STATUS.DRAFT, USERS.ROSA),
                createMembership(USERS.NINA, CONFIGROLE.MEMBER)
            )
            expect(canSkipReview(ctx)).toBe(false)
        })

        it('returns false for review post (wrong status)', () => {
            const ctx = createContext(
                USERS.HANS,
                createProject(STATUS.DRAFT, USERS.HANS, 2),
                createPost(STATUS.REVIEW, USERS.NINA)
            )
            expect(canSkipReview(ctx)).toBe(false)
        })

        it('handles default team_size of 1', () => {
            const project = createProject(STATUS.DRAFT, USERS.HANS, 1)
            delete (project as any).team_size // Simulate missing field
            const ctx = createContext(
                USERS.HANS,
                project,
                createPost(STATUS.DRAFT, USERS.NINA)
            )
            // Defaults to 1, which is ≤3
            expect(canSkipReview(ctx)).toBe(true)
        })
    })

    // Combined transition test
    describe('canTransition (combined)', () => {
        it('allows trash for post owner', () => {
            const ctx = createContext(
                USERS.NINA,
                createProject(STATUS.DRAFT),
                createPost(STATUS.DRAFT, USERS.NINA)
            )
            expect(canTransition(ctx, STATUS.TRASH)).toBe(true)
        })

        it('allows trash for project owner', () => {
            const ctx = createContext(
                USERS.HANS,
                createProject(STATUS.DRAFT),
                createPost(STATUS.DRAFT, USERS.NINA)
            )
            expect(canTransition(ctx, STATUS.TRASH)).toBe(true)
        })

        it('denies trash for member (non-owner)', () => {
            const ctx = createContext(
                USERS.ROSA,
                createProject(STATUS.DRAFT),
                createPost(STATUS.DRAFT, USERS.NINA),
                createMembership(USERS.ROSA, CONFIGROLE.MEMBER)
            )
            expect(canTransition(ctx, STATUS.TRASH)).toBe(false)
        })

        it('denies invalid transition (draft→released)', () => {
            const ctx = createContext(
                USERS.HANS,
                createProject(STATUS.DRAFT),
                createPost(STATUS.DRAFT, USERS.NINA)
            )
            expect(canTransition(ctx, STATUS.RELEASED)).toBe(false)
        })

        it('allows project owner to release confirmed post', () => {
            const ctx = createContext(
                USERS.HANS,
                createProject(STATUS.CONFIRMED),
                createPost(STATUS.CONFIRMED, USERS.NINA)
            )
            expect(canTransition(ctx, STATUS.RELEASED)).toBe(true)
        })

        it('allows project owner to archive released post', () => {
            const ctx = createContext(
                USERS.HANS,
                createProject(STATUS.RELEASED),
                createPost(STATUS.RELEASED, USERS.NINA)
            )
            expect(canTransition(ctx, STATUS.ARCHIVED)).toBe(true)
        })

        it('allows restore from trash', () => {
            const ctx = createContext(
                USERS.HANS,
                createProject(STATUS.DRAFT),
                createPost(STATUS.TRASH, USERS.NINA)
            )
            expect(canTransition(ctx, STATUS.DRAFT)).toBe(true)
        })
    })

    describe('VALID_TRANSITIONS map', () => {
        it('defines valid transitions from NEW', () => {
            expect(VALID_TRANSITIONS[STATUS.NEW]).toContain(STATUS.DRAFT)
            expect(VALID_TRANSITIONS[STATUS.NEW]).toContain(STATUS.TRASH)
        })

        it('defines valid transitions from DRAFT', () => {
            expect(VALID_TRANSITIONS[STATUS.DRAFT]).toContain(STATUS.REVIEW)
            expect(VALID_TRANSITIONS[STATUS.DRAFT]).toContain(STATUS.CONFIRMED)
            expect(VALID_TRANSITIONS[STATUS.DRAFT]).toContain(STATUS.TRASH)
        })

        it('defines valid transitions from REVIEW', () => {
            expect(VALID_TRANSITIONS[STATUS.REVIEW]).toContain(STATUS.CONFIRMED)
            expect(VALID_TRANSITIONS[STATUS.REVIEW]).toContain(STATUS.DRAFT)
            expect(VALID_TRANSITIONS[STATUS.REVIEW]).toContain(STATUS.TRASH)
        })

        it('defines valid transitions from TRASH', () => {
            expect(VALID_TRANSITIONS[STATUS.TRASH]).toContain(STATUS.DRAFT)
        })
    })
})

// ============================================================================
// COMBINED PERMISSIONS OBJECT
// ============================================================================

describe('getPostPermissions (combined object)', () => {
    it('returns all permissions for post owner', () => {
        const ctx = createContext(
            USERS.NINA,
            createProject(STATUS.DRAFT),
            createPost(STATUS.DRAFT, USERS.NINA)
        )
        const perms = getPostPermissions(ctx)

        expect(perms.canRead).toBe(true)
        expect(perms.canEdit).toBe(true)
        expect(perms.canCreate).toBe(false) // Nina not a member without membership
        expect(perms.canDelete).toBe(true)
        expect(perms.canApprove).toBe(false)
        expect(perms.canReject).toBe(false)
        expect(perms.canSkipReview).toBe(false)
        expect(perms.contentDepth).toBe('full')
        expect(perms.availableTransitions).toContain(STATUS.REVIEW)
        expect(perms.availableTransitions).toContain(STATUS.TRASH)
    })

    it('returns all permissions for project owner', () => {
        const ctx = createContext(
            USERS.HANS,
            createProject(STATUS.DRAFT, USERS.HANS, 2),
            createPost(STATUS.DRAFT, USERS.NINA)
        )
        const perms = getPostPermissions(ctx)

        expect(perms.canRead).toBe(true)
        expect(perms.canEdit).toBe(true)
        expect(perms.canCreate).toBe(true)
        expect(perms.canDelete).toBe(true)
        expect(perms.canApprove).toBe(false) // Post not in review
        expect(perms.canReject).toBe(false)
        expect(perms.canSkipReview).toBe(true) // Small team
        expect(perms.contentDepth).toBe('full')
        expect(perms.availableTransitions).toContain(STATUS.CONFIRMED) // Skip review
    })

    it('returns permissions for project owner with review post', () => {
        const ctx = createContext(
            USERS.HANS,
            createProject(STATUS.DRAFT),
            createPost(STATUS.REVIEW, USERS.NINA)
        )
        const perms = getPostPermissions(ctx)

        expect(perms.canApprove).toBe(true)
        expect(perms.canReject).toBe(true)
        expect(perms.availableTransitions).toContain(STATUS.CONFIRMED)
        expect(perms.availableTransitions).toContain(STATUS.DRAFT)
    })

    it('returns restricted permissions for visitor', () => {
        const ctx = createContext(
            USERS.VISITOR,
            createProject(STATUS.RELEASED),
            createPost(STATUS.RELEASED, USERS.NINA)
        )
        const perms = getPostPermissions(ctx)

        expect(perms.canRead).toBe(true)
        expect(perms.canEdit).toBe(false)
        expect(perms.canCreate).toBe(false)
        expect(perms.canDelete).toBe(false)
        expect(perms.canApprove).toBe(false)
        expect(perms.canReject).toBe(false)
        expect(perms.canSkipReview).toBe(false)
        expect(perms.contentDepth).toBe('full')
        expect(perms.availableTransitions).toEqual([])
    })

    it('returns available transitions for member', () => {
        const ctx = createContext(
            USERS.NINA,
            createProject(STATUS.DRAFT),
            createPost(STATUS.DRAFT, USERS.NINA),
            createMembership(USERS.NINA, CONFIGROLE.MEMBER)
        )
        const perms = getPostPermissions(ctx)

        expect(perms.canCreate).toBe(true)
        expect(perms.availableTransitions).toContain(STATUS.REVIEW)
        expect(perms.availableTransitions).toContain(STATUS.TRASH)
    })
})
