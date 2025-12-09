/**
 * Project Activation Composable
 * 
 * Manages project state transitions and activation criteria checking.
 * Follows PROJECT-WORKFLOW-SPEC.md v0.4
 * 
 * State Flow: new → demo → draft → confirmed → released → archived
 * 
 * December 2025
 */

import { ref, computed, type Ref, type ComputedRef } from 'vue'
import { useAuth } from './useAuth'

/**
 * Project status values (from sysreg bit allocation)
 */
export const PROJECT_STATUS = {
    NEW: 1,
    DEMO: 8,
    DRAFT: 64,
    CONFIRMED: 512,
    RELEASED: 4096,
    ARCHIVED: 32768,
    TRASH: 65536
} as const

/**
 * Status value to name mapping
 */
export const STATUS_TO_NAME: Record<number, string> = {
    [PROJECT_STATUS.NEW]: 'new',
    [PROJECT_STATUS.DEMO]: 'demo',
    [PROJECT_STATUS.DRAFT]: 'draft',
    [PROJECT_STATUS.CONFIRMED]: 'confirmed',
    [PROJECT_STATUS.RELEASED]: 'released',
    [PROJECT_STATUS.ARCHIVED]: 'archived',
    [PROJECT_STATUS.TRASH]: 'trash',
}

/**
 * Status name to value mapping
 */
export const NAME_TO_STATUS: Record<string, number> = {
    'new': PROJECT_STATUS.NEW,
    'demo': PROJECT_STATUS.DEMO,
    'draft': PROJECT_STATUS.DRAFT,
    'confirmed': PROJECT_STATUS.CONFIRMED,
    'released': PROJECT_STATUS.RELEASED,
    'archived': PROJECT_STATUS.ARCHIVED,
    'trash': PROJECT_STATUS.TRASH,
}

/**
 * Project type values
 */
export type ProjectType = 'topic' | 'project' | 'regio' | 'special'

/**
 * Panel detail modes
 */
export type PanelDetailMode = 'demo' | 'draft' | 'default' | 'config'

/**
 * Project data interface
 */
export interface ProjectData {
    id: string
    heading?: string
    type: ProjectType
    status: number
    owner_id: string
    owner_sysmail?: string
    image_id?: number | null
}

/**
 * Entity counts for criteria checking
 */
export interface EntityCounts {
    posts: number
    events: number
    members: number
    associatedProjects: number
    teamSize: number
}

/**
 * Activation rule interface
 */
export interface ActivationRule {
    id: string
    label: string
    labelDe: string
    check: (project: ProjectData, entities: EntityCounts) => boolean
    appliesTo: ProjectType[]
    isSkipRule?: boolean
}

/**
 * Rule check result
 */
export interface RuleCheckResult {
    rule: ActivationRule
    passed: boolean
    applicable: boolean
}

/**
 * Activation rules definitions
 */
export const ACTIVATION_RULES: ActivationRule[] = [
    {
        id: 'cover-image',
        label: 'Project must have a cover image',
        labelDe: 'Projekt muss ein Titelbild haben',
        check: (p) => !!p.image_id,
        appliesTo: ['topic', 'project', 'regio', 'special']
    },
    {
        id: 'topic-has-post',
        label: 'Topic project must have at least 1 post',
        labelDe: 'Themen-Projekt muss mindestens 1 Beitrag haben',
        check: (_, e) => e.posts >= 1,
        appliesTo: ['topic']
    },
    {
        id: 'project-has-event',
        label: 'Event project must have at least 1 event',
        labelDe: 'Event-Projekt muss mindestens 1 Veranstaltung haben',
        check: (_, e) => e.events >= 1,
        appliesTo: ['project']
    },
    {
        id: 'regio-has-member',
        label: 'Regio project must have at least 1 member',
        labelDe: 'Regio-Projekt muss mindestens 1 Mitglied haben',
        check: (_, e) => e.members >= 1,
        appliesTo: ['regio']
    },
    {
        id: 'regio-has-association',
        label: 'Regio project must have at least 1 associated project',
        labelDe: 'Regio-Projekt muss mindestens 1 verknüpftes Projekt haben',
        check: (_, e) => e.associatedProjects >= 1,
        appliesTo: ['regio']
    }
]

/**
 * Skip rule for small teams
 */
export const SKIP_CONFIRMED_RULE: ActivationRule = {
    id: 'small-team-skip',
    label: 'Project may skip to confirmed if team ≤3 people',
    labelDe: 'Projekt kann zu "Bestätigt" springen wenn Team ≤3 Personen',
    check: (_, e) => e.teamSize <= 3,
    appliesTo: ['topic', 'project', 'regio', 'special'],
    isSkipRule: true
}

/**
 * Configrole bit values for project_members
 */
export const CONFIGROLE = {
    PARTNER: 2,
    PARTICIPANT: 4,
    MEMBER: 8,
    CREATOR: 16  // p_creator bit
} as const

/**
 * User relation to project
 */
export type ProjectRelation = 'anonym' | 'partner' | 'participant' | 'member' | 'p_creator' | 'p_owner'

/**
 * Membership data interface
 */
export interface MembershipData {
    user_id: string
    configrole: number
}

/**
 * Get allowed target states from current state
 */
export function getAllowedTransitions(
    currentStatus: number,
    isPOwner: boolean,
    canSkip: boolean
): number[] {
    const targets: number[] = []

    switch (currentStatus) {
        case PROJECT_STATUS.NEW:
            targets.push(PROJECT_STATUS.DEMO)
            if (canSkip) {
                targets.push(PROJECT_STATUS.DRAFT)
                targets.push(PROJECT_STATUS.CONFIRMED)
            }
            break

        case PROJECT_STATUS.DEMO:
            targets.push(PROJECT_STATUS.DRAFT)
            if (canSkip) {
                targets.push(PROJECT_STATUS.CONFIRMED)
            }
            break

        case PROJECT_STATUS.DRAFT:
            targets.push(PROJECT_STATUS.DEMO) // go back
            targets.push(PROJECT_STATUS.CONFIRMED)
            break

        case PROJECT_STATUS.CONFIRMED:
            targets.push(PROJECT_STATUS.DRAFT) // go back
            targets.push(PROJECT_STATUS.RELEASED)
            break

        case PROJECT_STATUS.RELEASED:
            targets.push(PROJECT_STATUS.CONFIRMED) // go back (rare)
            if (isPOwner) {
                targets.push(PROJECT_STATUS.ARCHIVED)
            }
            break

        case PROJECT_STATUS.ARCHIVED:
            targets.push(PROJECT_STATUS.RELEASED) // restore
            break
    }

    // Trash is always p_owner only
    if (isPOwner && currentStatus !== PROJECT_STATUS.TRASH) {
        targets.push(PROJECT_STATUS.TRASH)
    }

    return targets
}

/**
 * Get panel detail mode based on project state and user relation
 */
export function getPanelDetailMode(
    projectStatus: number,
    relation: ProjectRelation
): PanelDetailMode {
    // p_owner always gets config
    if (relation === 'p_owner') {
        if (projectStatus === PROJECT_STATUS.DEMO) return 'demo'
        return 'config'
    }

    // p_creator mode varies by state
    if (relation === 'p_creator') {
        switch (projectStatus) {
            case PROJECT_STATUS.NEW:
            case PROJECT_STATUS.DRAFT:
                return 'config'
            case PROJECT_STATUS.DEMO:
                return 'demo'
            case PROJECT_STATUS.CONFIRMED:
                return 'draft'
            case PROJECT_STATUS.RELEASED:
            case PROJECT_STATUS.ARCHIVED:
            default:
                return 'default'
        }
    }

    // Members and below
    switch (projectStatus) {
        case PROJECT_STATUS.NEW:
            return 'config' // members don't have access to new anyway
        case PROJECT_STATUS.DEMO:
            return 'demo'
        case PROJECT_STATUS.DRAFT:
            return 'draft'
        case PROJECT_STATUS.CONFIRMED:
        case PROJECT_STATUS.RELEASED:
        case PROJECT_STATUS.ARCHIVED:
        default:
            return 'default'
    }
}

/**
 * Determine if stepper or dashboard layout should be used
 */
export function getLayoutType(projectStatus: number): 'stepper' | 'dashboard' {
    // Simple rule: status >= 64 (draft) → Dashboard
    return projectStatus >= PROJECT_STATUS.DRAFT ? 'dashboard' : 'stepper'
}

/**
 * Project activation composable
 */
export function useProjectActivation(
    project: Ref<ProjectData | null>,
    entityCounts: Ref<EntityCounts>,
    membership?: Ref<MembershipData | null>
) {
    const { user } = useAuth()

    // Loading/error state
    const isLoading = ref(false)
    const error = ref<string | null>(null)

    // Current user's sysmail
    const userSysmail = computed(() => user.value?.sysmail || null)

    // Determine user's relation to project
    const userRelation = computed<ProjectRelation>(() => {
        if (!project.value || !userSysmail.value) return 'anonym'

        // Check if user is p_owner
        if (project.value.owner_sysmail === userSysmail.value) return 'p_owner'

        // Check membership
        if (membership?.value) {
            const configrole = membership.value.configrole
            // Check p_creator bit (16)
            if (configrole & CONFIGROLE.CREATOR) return 'p_creator'
            if (configrole & CONFIGROLE.MEMBER) return 'member'
            if (configrole & CONFIGROLE.PARTICIPANT) return 'participant'
            if (configrole & CONFIGROLE.PARTNER) return 'partner'
        }

        return 'anonym'
    })

    // Convenience booleans
    const isPOwner = computed(() => userRelation.value === 'p_owner')
    const isPCreator = computed(() => userRelation.value === 'p_creator')
    const canManageProject = computed(() => isPOwner.value || isPCreator.value)

    // Current status info
    const currentStatus = computed(() => project.value?.status ?? PROJECT_STATUS.NEW)
    const currentStatusName = computed(() => STATUS_TO_NAME[currentStatus.value] ?? 'new')

    // Layout type
    const layoutType = computed(() => getLayoutType(currentStatus.value))
    const isStepper = computed(() => layoutType.value === 'stepper')
    const isDashboard = computed(() => layoutType.value === 'dashboard')

    // Panel detail mode for current user
    const panelDetailMode = computed<PanelDetailMode>(() =>
        getPanelDetailMode(currentStatus.value, userRelation.value)
    )

    // Check all activation rules
    const ruleResults = computed<RuleCheckResult[]>(() => {
        if (!project.value) return []

        const projectType = project.value.type
        const results: RuleCheckResult[] = []

        for (const rule of ACTIVATION_RULES) {
            const applicable = rule.appliesTo.includes(projectType)
            const passed = applicable ? rule.check(project.value, entityCounts.value) : true

            results.push({ rule, passed, applicable })
        }

        return results
    })

    // Check skip rule
    const skipRuleResult = computed<RuleCheckResult>(() => {
        const rule = SKIP_CONFIRMED_RULE
        const projectType = project.value?.type ?? 'project'
        const applicable = rule.appliesTo.includes(projectType)
        const passed = project.value
            ? rule.check(project.value, entityCounts.value)
            : false

        return { rule, passed, applicable }
    })

    // Can skip to confirmed?
    const canSkipToConfirmed = computed(() => skipRuleResult.value.passed)

    // Are all required criteria met?
    const allCriteriaMet = computed(() =>
        ruleResults.value.every((r: RuleCheckResult) => r.passed)
    )

    // Failed criteria (for display)
    const failedCriteria = computed(() =>
        ruleResults.value.filter((r: RuleCheckResult) => !r.passed && r.applicable)
    )

    // Allowed target states
    const allowedTargets = computed(() =>
        getAllowedTransitions(currentStatus.value, isPOwner.value, canSkipToConfirmed.value)
    )

    // Can user transition at all?
    const canTransition = computed(() =>
        canManageProject.value && allCriteriaMet.value && allowedTargets.value.length > 0
    )

    // Can trash (p_owner only)
    const canTrash = computed(() =>
        isPOwner.value && currentStatus.value !== PROJECT_STATUS.TRASH
    )

    /**
     * Validate if transition to target state is allowed
     */
    function validateTransition(targetStatus: number): { valid: boolean; reason?: string } {
        if (!project.value) {
            return { valid: false, reason: 'No project loaded' }
        }

        if (!canManageProject.value) {
            return { valid: false, reason: 'Insufficient permissions' }
        }

        // Trash check
        if (targetStatus === PROJECT_STATUS.TRASH) {
            if (!isPOwner.value) {
                return { valid: false, reason: 'Only project owner can move to trash' }
            }
            return { valid: true }
        }

        // Archive check
        if (targetStatus === PROJECT_STATUS.ARCHIVED) {
            if (!isPOwner.value) {
                return { valid: false, reason: 'Only project owner can archive' }
            }
        }

        // Check if target is in allowed list
        if (!allowedTargets.value.includes(targetStatus)) {
            return { valid: false, reason: `Cannot transition from ${currentStatusName.value} to ${STATUS_TO_NAME[targetStatus]}` }
        }

        // Check criteria for forward transitions
        const isForward = targetStatus > currentStatus.value
        if (isForward && !allCriteriaMet.value) {
            const missing = failedCriteria.value.map((f: RuleCheckResult) => f.rule.label).join(', ')
            return { valid: false, reason: `Missing criteria: ${missing}` }
        }

        return { valid: true }
    }

    /**
     * Execute transition to target state
     */
    async function transitionTo(targetStatus: number): Promise<boolean> {
        const validation = validateTransition(targetStatus)
        if (!validation.valid) {
            error.value = validation.reason ?? 'Invalid transition'
            return false
        }

        if (!project.value) return false

        isLoading.value = true
        error.value = null

        try {
            const response = await fetch(`/api/projects/${project.value.id}/activate`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: targetStatus })
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                throw new Error(errorData.message || `HTTP ${response.status}`)
            }

            // Update local state (in a real app, you'd refetch or update via store)
            // project.value.status = targetStatus

            return true
        } catch (err) {
            error.value = err instanceof Error ? err.message : 'Transition failed'
            return false
        } finally {
            isLoading.value = false
        }
    }

    /**
     * Get target state info for display
     */
    function getTargetInfo(targetStatus: number) {
        const name = STATUS_TO_NAME[targetStatus] ?? 'unknown'
        const validation = validateTransition(targetStatus)
        const isForward = targetStatus > currentStatus.value
        const isSkip = isForward && (targetStatus - currentStatus.value) > getStatusStep(currentStatus.value)

        return {
            status: targetStatus,
            name,
            label: name.charAt(0).toUpperCase() + name.slice(1),
            isAllowed: validation.valid,
            reason: validation.reason,
            isForward,
            isBackward: !isForward && targetStatus !== currentStatus.value,
            isSkip
        }
    }

    /**
     * Helper: Get expected next step size
     */
    function getStatusStep(status: number): number {
        // Normal step is one level in the hierarchy
        switch (status) {
            case PROJECT_STATUS.NEW: return PROJECT_STATUS.DEMO - PROJECT_STATUS.NEW // to demo
            case PROJECT_STATUS.DEMO: return PROJECT_STATUS.DRAFT - PROJECT_STATUS.DEMO // to draft
            case PROJECT_STATUS.DRAFT: return PROJECT_STATUS.CONFIRMED - PROJECT_STATUS.DRAFT // to confirmed
            case PROJECT_STATUS.CONFIRMED: return PROJECT_STATUS.RELEASED - PROJECT_STATUS.CONFIRMED // to released
            case PROJECT_STATUS.RELEASED: return PROJECT_STATUS.ARCHIVED - PROJECT_STATUS.RELEASED // to archived
            default: return 0
        }
    }

    return {
        // State
        isLoading,
        error,

        // User relation
        userRelation,
        isPOwner,
        isPCreator,
        canManageProject,

        // Status info
        currentStatus,
        currentStatusName,

        // Layout
        layoutType,
        isStepper,
        isDashboard,
        panelDetailMode,

        // Rules & criteria
        ruleResults,
        skipRuleResult,
        canSkipToConfirmed,
        allCriteriaMet,
        failedCriteria,

        // Transitions
        allowedTargets,
        canTransition,
        canTrash,
        validateTransition,
        transitionTo,
        getTargetInfo,

        // Constants (for external use)
        STATUS: PROJECT_STATUS,
        STATUS_TO_NAME,
        NAME_TO_STATUS,
        ACTIVATION_RULES,
        SKIP_CONFIRMED_RULE
    }
}
