/**
 * Transition Summary Composable
 * 
 * Fetches and displays what changes when transitioning between project states.
 * Shows capability differences per role: what's gained, what's lost, layout changes.
 * 
 * Uses examples from project-capabilities-foundation.md:
 * - p_owner: Full control in all states (read:config, update:config, manage:full)
 * - p_creator: Config in new/draft, reduced in confirmed (read:content, manage:status)
 * - member: No new, Read demo, RW in draft+
 * - participant: Summary in draft, full read in confirmed+
 * - partner: Read only in confirmed+
 * 
 * December 2025
 */

import { ref, computed, watch, type Ref, type ComputedRef } from 'vue'
import { PROJECT_STATUS, STATUS_TO_NAME, type ProjectRelation } from './useProjectActivation'

/**
 * Capability level descriptions
 */
const READ_LEVELS = {
    none: 'Kein Zugriff',
    summary: 'Nur Überschrift & Teaser',
    content: 'Vollständige Inhalte',
    config: 'Inhalte + Einstellungen'
} as const

const UPDATE_LEVELS = {
    none: 'Keine Bearbeitung',
    comment: 'Nur Kommentare',
    content: 'Inhalte bearbeiten',
    config: 'Einstellungen ändern'
} as const

const MANAGE_LEVELS = {
    none: 'Keine Verwaltung',
    status: 'Status ändern',
    members: 'Team verwalten',
    full: 'Vollständige Kontrolle'
} as const

/**
 * State info for display
 */
export interface StateInfo {
    value: number
    name: string
    label: string
    layout: 'stepper' | 'dashboard'
    description: string
}

/**
 * Capability change for a role
 */
export interface RoleCapabilityChange {
    relation: ProjectRelation
    icon: string
    label: string
    labelDe: string
    gainedCapabilities: string[]
    lostCapabilities: string[]
    summary: string
}

/**
 * Full transition summary
 */
export interface TransitionSummary {
    fromState: StateInfo
    toState: StateInfo
    changes: RoleCapabilityChange[]
    layoutChange: boolean
    isSkip: boolean
    isBackward: boolean
}

/**
 * State definitions with layout info
 */
const STATES: StateInfo[] = [
    { value: PROJECT_STATUS.NEW, name: 'new', label: 'NEW', layout: 'stepper', description: 'Projekt ist neu und nur für Owner/Creator sichtbar' },
    { value: PROJECT_STATUS.DEMO, name: 'demo', label: 'DEMO', layout: 'stepper', description: 'Demo-Phase: Team kann lesen, aber nicht bearbeiten' },
    { value: PROJECT_STATUS.DRAFT, name: 'draft', label: 'DRAFT', layout: 'dashboard', description: 'Entwurf: Team kann aktiv mitarbeiten' },
    { value: PROJECT_STATUS.CONFIRMED, name: 'confirmed', label: 'CONF', layout: 'dashboard', description: 'Bestätigt: Partner haben Leserechte' },
    { value: PROJECT_STATUS.RELEASED, name: 'released', label: 'REL', layout: 'dashboard', description: 'Veröffentlicht: Öffentlich sichtbar' },
    { value: PROJECT_STATUS.ARCHIVED, name: 'archived', label: 'ARCH', layout: 'dashboard', description: 'Archiviert: Nur noch lesbar' },
    { value: PROJECT_STATUS.TRASH, name: 'trash', label: 'TRASH', layout: 'dashboard', description: 'Papierkorb: Kann wiederhergestellt werden' },
]

/**
 * Role icons and labels
 */
const ROLE_INFO: Record<ProjectRelation, { icon: string; label: string; labelDe: string }> = {
    p_owner: { icon: '👑', label: 'Owner', labelDe: 'Eigentümer' },
    p_creator: { icon: '✨', label: 'Creator', labelDe: 'Ersteller' },
    member: { icon: '👤', label: 'Member', labelDe: 'Mitglied' },
    participant: { icon: '👁', label: 'Participant', labelDe: 'Teilnehmer' },
    partner: { icon: '🤝', label: 'Partner', labelDe: 'Partner' },
    anonym: { icon: '🌐', label: 'Public', labelDe: 'Öffentlich' },
}

/**
 * Capability matrix from project-capabilities-foundation.md
 * Maps: state -> relation -> { read, update, manage, list, share }
 */
type CapLevel = 'none' | 'summary' | 'content' | 'config'
type ManageLevel = 'none' | 'status' | 'members' | 'full'

interface Capabilities {
    read: CapLevel
    update: CapLevel
    manage: ManageLevel
    list: boolean
    share: boolean
}

const CAPABILITY_MATRIX: Record<string, Record<ProjectRelation, Capabilities>> = {
    // NEW state
    new: {
        p_owner: { read: 'config', update: 'config', manage: 'full', list: true, share: true },
        p_creator: { read: 'config', update: 'config', manage: 'members', list: true, share: true },
        member: { read: 'none', update: 'none', manage: 'none', list: false, share: false },
        participant: { read: 'none', update: 'none', manage: 'none', list: false, share: false },
        partner: { read: 'none', update: 'none', manage: 'none', list: false, share: false },
        anonym: { read: 'none', update: 'none', manage: 'none', list: false, share: false },
    },
    // DEMO state
    demo: {
        p_owner: { read: 'config', update: 'config', manage: 'full', list: true, share: true },
        p_creator: { read: 'content', update: 'none', manage: 'none', list: true, share: false },
        member: { read: 'content', update: 'none', manage: 'none', list: true, share: false },
        participant: { read: 'none', update: 'none', manage: 'none', list: false, share: false },
        partner: { read: 'none', update: 'none', manage: 'none', list: false, share: false },
        anonym: { read: 'none', update: 'none', manage: 'none', list: false, share: false },
    },
    // DRAFT state
    draft: {
        p_owner: { read: 'config', update: 'config', manage: 'full', list: true, share: true },
        p_creator: { read: 'config', update: 'config', manage: 'members', list: true, share: true },
        member: { read: 'content', update: 'content', manage: 'none', list: true, share: true },
        participant: { read: 'summary', update: 'none', manage: 'none', list: true, share: false },
        partner: { read: 'none', update: 'none', manage: 'none', list: false, share: false },
        anonym: { read: 'none', update: 'none', manage: 'none', list: false, share: false },
    },
    // CONFIRMED state
    confirmed: {
        p_owner: { read: 'config', update: 'config', manage: 'full', list: true, share: true },
        p_creator: { read: 'content', update: 'content', manage: 'status', list: true, share: true },
        member: { read: 'content', update: 'content', manage: 'none', list: true, share: true },
        participant: { read: 'content', update: 'none', manage: 'none', list: true, share: false },
        partner: { read: 'content', update: 'none', manage: 'none', list: true, share: false },
        anonym: { read: 'none', update: 'none', manage: 'none', list: false, share: false },
    },
    // RELEASED state
    released: {
        p_owner: { read: 'config', update: 'config', manage: 'full', list: true, share: true },
        p_creator: { read: 'content', update: 'none', manage: 'none', list: true, share: false },
        member: { read: 'content', update: 'content', manage: 'none', list: true, share: true },
        participant: { read: 'content', update: 'none', manage: 'none', list: true, share: false },
        partner: { read: 'content', update: 'none', manage: 'none', list: true, share: false },
        anonym: { read: 'content', update: 'none', manage: 'none', list: true, share: false },
    },
    // ARCHIVED state
    archived: {
        p_owner: { read: 'config', update: 'config', manage: 'full', list: true, share: false },
        p_creator: { read: 'content', update: 'none', manage: 'none', list: true, share: false },
        member: { read: 'content', update: 'none', manage: 'none', list: true, share: false },
        participant: { read: 'content', update: 'none', manage: 'none', list: true, share: false },
        partner: { read: 'content', update: 'none', manage: 'none', list: true, share: false },
        anonym: { read: 'content', update: 'none', manage: 'none', list: true, share: false },
    },
    // TRASH state
    trash: {
        p_owner: { read: 'config', update: 'none', manage: 'full', list: true, share: false },
        p_creator: { read: 'none', update: 'none', manage: 'none', list: false, share: false },
        member: { read: 'none', update: 'none', manage: 'none', list: false, share: false },
        participant: { read: 'none', update: 'none', manage: 'none', list: false, share: false },
        partner: { read: 'none', update: 'none', manage: 'none', list: false, share: false },
        anonym: { read: 'none', update: 'none', manage: 'none', list: false, share: false },
    },
}

/**
 * Get state info by value
 */
export function getStateInfo(statusValue: number): StateInfo | null {
    return STATES.find(s => s.value === statusValue) ?? null
}

/**
 * Get state info by name
 */
export function getStateByName(name: string): StateInfo | null {
    return STATES.find(s => s.name === name) ?? null
}

/**
 * Compare capabilities and return changes
 */
function compareCapabilities(
    fromCaps: Capabilities,
    toCaps: Capabilities,
    relation: ProjectRelation
): RoleCapabilityChange {
    const roleInfo = ROLE_INFO[relation]
    const gained: string[] = []
    const lost: string[] = []

    // Compare read
    const readLevels = ['none', 'summary', 'content', 'config']
    const fromReadIdx = readLevels.indexOf(fromCaps.read)
    const toReadIdx = readLevels.indexOf(toCaps.read)
    if (toReadIdx > fromReadIdx) {
        gained.push(`Lesen: ${READ_LEVELS[toCaps.read]}`)
    } else if (toReadIdx < fromReadIdx) {
        lost.push(`Lesen: ${READ_LEVELS[fromCaps.read]} → ${READ_LEVELS[toCaps.read]}`)
    }

    // Compare update
    const updateLevels = ['none', 'comment', 'content', 'config']
    const fromUpdateIdx = updateLevels.indexOf(fromCaps.update)
    const toUpdateIdx = updateLevels.indexOf(toCaps.update)
    if (toUpdateIdx > fromUpdateIdx) {
        gained.push(`Bearbeiten: ${UPDATE_LEVELS[toCaps.update]}`)
    } else if (toUpdateIdx < fromUpdateIdx) {
        lost.push(`Bearbeiten: ${UPDATE_LEVELS[fromCaps.update]} → ${UPDATE_LEVELS[toCaps.update]}`)
    }

    // Compare manage
    const manageLevels = ['none', 'status', 'members', 'full']
    const fromManageIdx = manageLevels.indexOf(fromCaps.manage)
    const toManageIdx = manageLevels.indexOf(toCaps.manage)
    if (toManageIdx > fromManageIdx) {
        gained.push(`Verwaltung: ${MANAGE_LEVELS[toCaps.manage]}`)
    } else if (toManageIdx < fromManageIdx) {
        lost.push(`Verwaltung: ${MANAGE_LEVELS[fromCaps.manage]} → ${MANAGE_LEVELS[toCaps.manage]}`)
    }

    // Compare list
    if (!fromCaps.list && toCaps.list) {
        gained.push('Auflistung in Übersichten')
    } else if (fromCaps.list && !toCaps.list) {
        lost.push('Auflistung in Übersichten')
    }

    // Compare share
    if (!fromCaps.share && toCaps.share) {
        gained.push('Teilen erlaubt')
    } else if (fromCaps.share && !toCaps.share) {
        lost.push('Teilen nicht mehr erlaubt')
    }

    // Generate summary
    let summary = ''
    if (gained.length > 0 && lost.length === 0) {
        summary = `Erhält: ${gained.join(', ')}`
    } else if (lost.length > 0 && gained.length === 0) {
        summary = `Verliert: ${lost.join(', ')}`
    } else if (gained.length > 0 && lost.length > 0) {
        summary = `+${gained.length} / -${lost.length} Änderungen`
    } else {
        summary = 'Keine Änderung'
    }

    return {
        relation,
        icon: roleInfo.icon,
        label: roleInfo.label,
        labelDe: roleInfo.labelDe,
        gainedCapabilities: gained,
        lostCapabilities: lost,
        summary
    }
}

/**
 * Calculate transition summary between two states
 */
export function calculateTransitionSummary(
    fromStatus: number,
    toStatus: number
): TransitionSummary | null {
    const fromState = getStateInfo(fromStatus)
    const toState = getStateInfo(toStatus)

    if (!fromState || !toState) return null

    const fromMatrix = CAPABILITY_MATRIX[fromState.name]
    const toMatrix = CAPABILITY_MATRIX[toState.name]

    if (!fromMatrix || !toMatrix) return null

    // Calculate changes for each role
    const relevantRoles: ProjectRelation[] = ['p_owner', 'p_creator', 'member', 'participant', 'partner']
    const changes: RoleCapabilityChange[] = relevantRoles.map(role =>
        compareCapabilities(fromMatrix[role], toMatrix[role], role)
    )

    // Filter out roles with no changes
    const significantChanges = changes.filter(c =>
        c.gainedCapabilities.length > 0 || c.lostCapabilities.length > 0
    )

    return {
        fromState,
        toState,
        changes: significantChanges,
        layoutChange: fromState.layout !== toState.layout,
        isSkip: Math.abs(STATES.findIndex(s => s.value === toStatus) - STATES.findIndex(s => s.value === fromStatus)) > 1,
        isBackward: toStatus < fromStatus
    }
}

/**
 * Transition Summary Composable
 */
export function useTransitionSummary(
    currentStatus: Ref<number>,
    selectedTarget?: Ref<number | null>
) {
    // Available states for timeline
    const allStates = computed(() => STATES.filter(s => s.value !== PROJECT_STATUS.TRASH))

    // Current state info
    const currentStateInfo = computed(() => getStateInfo(currentStatus.value))

    // Target state info
    const targetStateInfo = computed(() =>
        selectedTarget?.value ? getStateInfo(selectedTarget.value) : null
    )

    // Transition summary (when target selected)
    const summary = computed<TransitionSummary | null>(() => {
        if (!selectedTarget?.value) return null
        return calculateTransitionSummary(currentStatus.value, selectedTarget.value)
    })

    // Layout will change?
    const willChangeLayout = computed(() => summary.value?.layoutChange ?? false)

    // Is this a skip transition?
    const isSkipTransition = computed(() => summary.value?.isSkip ?? false)

    // Is this a backward transition?
    const isBackwardTransition = computed(() => summary.value?.isBackward ?? false)

    // Roles with significant changes
    const affectedRoles = computed(() =>
        summary.value?.changes.map(c => c.relation) ?? []
    )

    // Get changes for specific role
    function getChangesForRole(role: ProjectRelation): RoleCapabilityChange | null {
        return summary.value?.changes.find(c => c.relation === role) ?? null
    }

    // Get current capabilities for role
    function getCurrentCapabilities(role: ProjectRelation): Capabilities | null {
        const stateName = currentStateInfo.value?.name
        if (!stateName) return null
        return CAPABILITY_MATRIX[stateName]?.[role] ?? null
    }

    // Get target capabilities for role
    function getTargetCapabilities(role: ProjectRelation): Capabilities | null {
        const stateName = targetStateInfo.value?.name
        if (!stateName) return null
        return CAPABILITY_MATRIX[stateName]?.[role] ?? null
    }

    return {
        // States
        allStates,
        currentStateInfo,
        targetStateInfo,

        // Summary
        summary,
        willChangeLayout,
        isSkipTransition,
        isBackwardTransition,
        affectedRoles,

        // Helpers
        getChangesForRole,
        getCurrentCapabilities,
        getTargetCapabilities,
        getStateInfo,
        getStateByName,

        // Static data
        ROLE_INFO,
        READ_LEVELS,
        UPDATE_LEVELS,
        MANAGE_LEVELS,
    }
}
