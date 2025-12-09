/**
 * GET /api/sysreg/transition-summary
 * 
 * Returns detailed information about a state transition,
 * including what capabilities change for each role.
 * 
 * Query params:
 * - from: source status value (e.g., 8 for demo)
 * - to: target status value (e.g., 64 for draft)
 * - project_type: optional project type filter
 * 
 * Returns TransitionSummary with role capability changes.
 * 
 * December 2025
 */

import { defineEventHandler, getQuery, createError } from 'h3'

/**
 * Status value to name mapping
 */
const STATUS_TO_NAME: Record<number, string> = {
    1: 'new',
    8: 'demo',
    64: 'draft',
    512: 'confirmed',
    4096: 'released',
    32768: 'archived',
    65536: 'trash',
}

/**
 * Status name to value mapping
 */
const NAME_TO_STATUS: Record<string, number> = {
    'new': 1,
    'demo': 8,
    'draft': 64,
    'confirmed': 512,
    'released': 4096,
    'archived': 32768,
    'trash': 65536,
}

/**
 * Layout by state
 */
const STATE_LAYOUT: Record<string, 'stepper' | 'dashboard'> = {
    'new': 'stepper',
    'demo': 'stepper',
    'draft': 'dashboard',
    'confirmed': 'dashboard',
    'released': 'dashboard',
    'archived': 'dashboard',
    'trash': 'dashboard',
}

/**
 * State descriptions (German)
 */
const STATE_DESCRIPTIONS: Record<string, string> = {
    'new': 'Projekt ist neu und nur für Owner/Creator sichtbar',
    'demo': 'Demo-Phase: Team kann lesen, aber nicht bearbeiten',
    'draft': 'Entwurf: Team kann aktiv mitarbeiten',
    'confirmed': 'Bestätigt: Partner haben Leserechte',
    'released': 'Veröffentlicht: Öffentlich sichtbar',
    'archived': 'Archiviert: Nur noch lesbar',
    'trash': 'Papierkorb: Kann wiederhergestellt werden',
}

/**
 * Role metadata
 */
const ROLE_INFO = {
    p_owner: { icon: '👑', label: 'Owner', labelDe: 'Eigentümer' },
    p_creator: { icon: '✨', label: 'Creator', labelDe: 'Ersteller' },
    member: { icon: '👤', label: 'Member', labelDe: 'Mitglied' },
    participant: { icon: '👁', label: 'Participant', labelDe: 'Teilnehmer' },
    partner: { icon: '🤝', label: 'Partner', labelDe: 'Partner' },
}

type ProjectRelation = 'p_owner' | 'p_creator' | 'member' | 'participant' | 'partner'

/**
 * Capability matrix from project-capabilities-foundation.md
 */
interface Capabilities {
    read: 'none' | 'summary' | 'content' | 'config'
    update: 'none' | 'comment' | 'content' | 'config'
    manage: 'none' | 'status' | 'members' | 'full'
    list: boolean
    share: boolean
}

const CAPABILITY_MATRIX: Record<string, Record<ProjectRelation, Capabilities>> = {
    new: {
        p_owner: { read: 'config', update: 'config', manage: 'full', list: true, share: true },
        p_creator: { read: 'config', update: 'config', manage: 'members', list: true, share: true },
        member: { read: 'none', update: 'none', manage: 'none', list: false, share: false },
        participant: { read: 'none', update: 'none', manage: 'none', list: false, share: false },
        partner: { read: 'none', update: 'none', manage: 'none', list: false, share: false },
    },
    demo: {
        p_owner: { read: 'config', update: 'config', manage: 'full', list: true, share: true },
        p_creator: { read: 'content', update: 'none', manage: 'none', list: true, share: false },
        member: { read: 'content', update: 'none', manage: 'none', list: true, share: false },
        participant: { read: 'none', update: 'none', manage: 'none', list: false, share: false },
        partner: { read: 'none', update: 'none', manage: 'none', list: false, share: false },
    },
    draft: {
        p_owner: { read: 'config', update: 'config', manage: 'full', list: true, share: true },
        p_creator: { read: 'config', update: 'config', manage: 'members', list: true, share: true },
        member: { read: 'content', update: 'content', manage: 'none', list: true, share: true },
        participant: { read: 'summary', update: 'none', manage: 'none', list: true, share: false },
        partner: { read: 'none', update: 'none', manage: 'none', list: false, share: false },
    },
    confirmed: {
        p_owner: { read: 'config', update: 'config', manage: 'full', list: true, share: true },
        p_creator: { read: 'content', update: 'content', manage: 'status', list: true, share: true },
        member: { read: 'content', update: 'content', manage: 'none', list: true, share: true },
        participant: { read: 'content', update: 'none', manage: 'none', list: true, share: false },
        partner: { read: 'content', update: 'none', manage: 'none', list: true, share: false },
    },
    released: {
        p_owner: { read: 'config', update: 'config', manage: 'full', list: true, share: true },
        p_creator: { read: 'content', update: 'none', manage: 'none', list: true, share: false },
        member: { read: 'content', update: 'content', manage: 'none', list: true, share: true },
        participant: { read: 'content', update: 'none', manage: 'none', list: true, share: false },
        partner: { read: 'content', update: 'none', manage: 'none', list: true, share: false },
    },
    archived: {
        p_owner: { read: 'config', update: 'config', manage: 'full', list: true, share: false },
        p_creator: { read: 'content', update: 'none', manage: 'none', list: true, share: false },
        member: { read: 'content', update: 'none', manage: 'none', list: true, share: false },
        participant: { read: 'content', update: 'none', manage: 'none', list: true, share: false },
        partner: { read: 'content', update: 'none', manage: 'none', list: true, share: false },
    },
}

/**
 * Capability level descriptions (German)
 */
const READ_LEVELS: Record<string, string> = {
    none: 'Kein Zugriff',
    summary: 'Nur Überschrift & Teaser',
    content: 'Vollständige Inhalte',
    config: 'Inhalte + Einstellungen',
}

const UPDATE_LEVELS: Record<string, string> = {
    none: 'Keine Bearbeitung',
    comment: 'Nur Kommentare',
    content: 'Inhalte bearbeiten',
    config: 'Einstellungen ändern',
}

const MANAGE_LEVELS: Record<string, string> = {
    none: 'Keine Verwaltung',
    status: 'Status ändern',
    members: 'Team verwalten',
    full: 'Vollständige Kontrolle',
}

/**
 * Compare capabilities between two states for a role
 */
function compareCapabilities(
    fromCaps: Capabilities,
    toCaps: Capabilities,
    role: ProjectRelation
) {
    const roleInfo = ROLE_INFO[role]
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

    return {
        relation: role,
        icon: roleInfo.icon,
        label: roleInfo.label,
        labelDe: roleInfo.labelDe,
        gainedCapabilities: gained,
        lostCapabilities: lost,
    }
}

export default defineEventHandler(async (event) => {
    const query = getQuery(event)

    const fromStr = String(query.from || '')
    const toStr = String(query.to || '')

    // Parse status values
    let fromStatus: number
    let toStatus: number

    // Try parsing as number first
    if (/^\d+$/.test(fromStr)) {
        fromStatus = parseInt(fromStr, 10)
    } else {
        fromStatus = NAME_TO_STATUS[fromStr] ?? 0
    }

    if (/^\d+$/.test(toStr)) {
        toStatus = parseInt(toStr, 10)
    } else {
        toStatus = NAME_TO_STATUS[toStr] ?? 0
    }

    if (!fromStatus || !toStatus) {
        throw createError({
            statusCode: 400,
            message: 'Invalid from/to status. Use status values (1, 8, 64, ...) or names (new, demo, draft, ...)',
        })
    }

    const fromName = STATUS_TO_NAME[fromStatus]
    const toName = STATUS_TO_NAME[toStatus]

    if (!fromName || !toName) {
        throw createError({
            statusCode: 400,
            message: `Unknown status value: from=${fromStatus}, to=${toStatus}`,
        })
    }

    const fromMatrix = CAPABILITY_MATRIX[fromName]
    const toMatrix = CAPABILITY_MATRIX[toName]

    if (!fromMatrix || !toMatrix) {
        throw createError({
            statusCode: 400,
            message: `No capability matrix for state: ${fromName} or ${toName}`,
        })
    }

    // Calculate changes for each role
    const roles: ProjectRelation[] = ['p_owner', 'p_creator', 'member', 'participant', 'partner']
    const changes = roles
        .map(role => compareCapabilities(fromMatrix[role], toMatrix[role], role))
        .filter(c => c.gainedCapabilities.length > 0 || c.lostCapabilities.length > 0)

    // Determine if layout changes
    const layoutChange = STATE_LAYOUT[fromName] !== STATE_LAYOUT[toName]

    // Determine if this is a skip or backward transition
    const statusOrder = ['new', 'demo', 'draft', 'confirmed', 'released', 'archived']
    const fromIdx = statusOrder.indexOf(fromName)
    const toIdx = statusOrder.indexOf(toName)
    const isSkip = Math.abs(toIdx - fromIdx) > 1
    const isBackward = toIdx < fromIdx

    return {
        fromState: {
            value: fromStatus,
            name: fromName,
            label: fromName.toUpperCase(),
            layout: STATE_LAYOUT[fromName],
            description: STATE_DESCRIPTIONS[fromName],
        },
        toState: {
            value: toStatus,
            name: toName,
            label: toName.toUpperCase(),
            layout: STATE_LAYOUT[toName],
            description: STATE_DESCRIPTIONS[toName],
        },
        changes,
        layoutChange,
        isSkip,
        isBackward,
    }
})
