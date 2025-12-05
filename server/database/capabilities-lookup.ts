/**
 * Capabilities Lookup Service
 * 
 * SINGLE SOURCE OF TRUTH: sysreg_config table
 * 
 * This module provides runtime lookup of capabilities from the config table.
 * The old posts-permissions.ts becomes a TEST ORACLE only.
 * 
 * Dec 5, 2025 - Sunrise Talk Implementation
 * 
 * IMPORTANT: Use pnpm, NOT npm!
 * This project uses pnpm for package management.
 */

import type { DatabaseAdapter } from './adapter'

// ============================================================================
// BIT LAYOUT (4-byte capability encoding)
// ============================================================================

export const BITS = {
    // Project type (bits 0-2)
    PROJECT_ALL: 0b000,

    // Entity (bits 3-7, 5 bits)
    ENTITY_ALL: 0b00000 << 3,
    ENTITY_PROJECT: 0b00001 << 3,
    ENTITY_USER: 0b00010 << 3,
    ENTITY_PAGE: 0b00011 << 3,
    ENTITY_POST: 0b00100 << 3,
    ENTITY_EVENT: 0b00101 << 3,
    ENTITY_IMAGE: 0b00110 << 3,
    ENTITY_LOCATION: 0b00111 << 3,

    // From-state (bits 8-10)
    STATE_ALL: 0b000 << 8,
    STATE_NEW: 0b001 << 8,
    STATE_DEMO: 0b010 << 8,
    STATE_DRAFT: 0b011 << 8,
    STATE_REVIEW: 0b100 << 8,
    STATE_RELEASED: 0b101 << 8,
    STATE_ARCHIVED: 0b110 << 8,
    STATE_TRASH: 0b111 << 8,

    // Read capability (bits 11-13)
    CAP_READ: 0b001 << 11,
    CAP_READ_PREVIEW: 0b010 << 11,
    CAP_READ_METADATA: 0b011 << 11,

    // Update capability (bits 14-16)
    CAP_UPDATE: 0b001 << 14,
    CAP_UPDATE_COMMENT: 0b010 << 14,
    CAP_UPDATE_APPEND: 0b011 << 14,

    // To-state for transitions (bits 17-19) - repurposed from create
    TO_STATE_NONE: 0b000 << 17,
    TO_STATE_NEW: 0b001 << 17,
    TO_STATE_DEMO: 0b010 << 17,
    TO_STATE_DRAFT: 0b011 << 17,
    TO_STATE_REVIEW: 0b100 << 17,
    TO_STATE_RELEASED: 0b101 << 17,
    TO_STATE_ARCHIVED: 0b110 << 17,
    TO_STATE_TRASH: 0b111 << 17,

    // Manage capability (bits 20-22)
    CAP_MANAGE: 0b001 << 20,
    CAP_MANAGE_STATUS: 0b010 << 20,
    CAP_MANAGE_CONFIG: 0b011 << 20,
    CAP_MANAGE_DELETE: 0b100 << 20,
    CAP_MANAGE_ARCHIVE: 0b101 << 20,

    // Simple capabilities (bits 23-24)
    CAP_LIST: 1 << 23,
    CAP_SHARE: 1 << 24,

    // Relations (bits 25-29) - renamed from roles
    REL_ANONYM: 1 << 25,
    REL_PARTNER: 1 << 26,
    REL_PARTICIPANT: 1 << 27,
    REL_MEMBER: 1 << 28,
    REL_CREATOR: 1 << 29,
} as const

// Helper combinations
export const REL_ALL = BITS.REL_ANONYM | BITS.REL_PARTNER | BITS.REL_PARTICIPANT | BITS.REL_MEMBER | BITS.REL_CREATOR
export const REL_AUTHENTICATED = BITS.REL_PARTNER | BITS.REL_PARTICIPANT | BITS.REL_MEMBER | BITS.REL_CREATOR
export const REL_ACTIVE = BITS.REL_PARTICIPANT | BITS.REL_MEMBER | BITS.REL_CREATOR

// ============================================================================
// BIT MASKS for extraction
// ============================================================================

export const MASKS = {
    PROJECT_TYPE: 0b111,                     // bits 0-2
    ENTITY: 0b11111 << 3,                    // bits 3-7
    FROM_STATE: 0b111 << 8,                  // bits 8-10
    CAP_READ: 0b111 << 11,                   // bits 11-13
    CAP_UPDATE: 0b111 << 14,                 // bits 14-16
    TO_STATE: 0b111 << 17,                   // bits 17-19
    CAP_MANAGE: 0b111 << 20,                 // bits 20-22
    CAP_LIST: 1 << 23,
    CAP_SHARE: 1 << 24,
    RELATIONS: 0b11111 << 25,                // bits 25-29
}

// ============================================================================
// ENTITY TYPE MAPPING
// ============================================================================

const ENTITY_NAME_TO_BITS: Record<string, number> = {
    'project': BITS.ENTITY_PROJECT,
    'user': BITS.ENTITY_USER,
    'page': BITS.ENTITY_PAGE,
    'post': BITS.ENTITY_POST,
    'event': BITS.ENTITY_EVENT,
    'image': BITS.ENTITY_IMAGE,
    'location': BITS.ENTITY_LOCATION,
}

const STATUS_NAME_TO_BITS: Record<string, number> = {
    'new': BITS.STATE_NEW,
    'demo': BITS.STATE_DEMO,
    'draft': BITS.STATE_DRAFT,
    'review': BITS.STATE_REVIEW,
    'released': BITS.STATE_RELEASED,
    'archived': BITS.STATE_ARCHIVED,
    'trash': BITS.STATE_TRASH,
}

const RELATION_NAME_TO_BITS: Record<string, number> = {
    'anonym': BITS.REL_ANONYM,
    'partner': BITS.REL_PARTNER,
    'participant': BITS.REL_PARTICIPANT,
    'member': BITS.REL_MEMBER,
    'creator': BITS.REL_CREATOR,
}

// ============================================================================
// CAPABILITY LOOKUP TYPES
// ============================================================================

export interface CapabilityQuery {
    entityType: string    // 'post', 'image', 'project', etc.
    fromStatus: string    // 'draft', 'review', 'released', etc.
    relation: string      // 'anonym', 'member', 'creator', etc.
    capability: 'read' | 'update' | 'manage' | 'list' | 'share'
}

export interface TransitionQuery {
    entityType: string
    fromStatus: string
    toStatus: string
    relation: string
}

export interface ConfigEntry {
    value: number
    name: string
    description: string
}

// ============================================================================
// CAPABILITY LOOKUP FUNCTIONS
// ============================================================================

/**
 * Check if a specific capability is granted
 */
export async function hasCapability(
    db: DatabaseAdapter,
    query: CapabilityQuery
): Promise<boolean> {
    const entityBits = ENTITY_NAME_TO_BITS[query.entityType.toLowerCase()]
    const statusBits = STATUS_NAME_TO_BITS[query.fromStatus.toLowerCase()]
    const relationBits = RELATION_NAME_TO_BITS[query.relation.toLowerCase()]

    if (!entityBits || !statusBits || !relationBits) {
        console.warn('Invalid capability query:', query)
        return false
    }

    // Build capability bit based on type
    let capabilityBit = 0
    switch (query.capability) {
        case 'read': capabilityBit = BITS.CAP_READ; break
        case 'update': capabilityBit = BITS.CAP_UPDATE; break
        case 'manage': capabilityBit = BITS.CAP_MANAGE; break
        case 'list': capabilityBit = BITS.CAP_LIST; break
        case 'share': capabilityBit = BITS.CAP_SHARE; break
    }

    // Query config for matching entries
    // An entry grants permission if:
    // 1. Entity type matches (or is ALL)
    // 2. Status matches (or is ALL)
    // 3. Relation is included
    // 4. Capability is included
    const result = await db.get(`
        SELECT value FROM sysreg_config
        WHERE (value & $1 = $1 OR value & $2 = $2)  -- entity match or all
          AND (value & $3 = $3 OR value & $4 = $4)  -- status match or all
          AND (value & $5) != 0                      -- relation included
          AND (value & $6) != 0                      -- capability included
        LIMIT 1
    `, [
        entityBits, BITS.ENTITY_ALL,
        statusBits, BITS.STATE_ALL,
        relationBits,
        capabilityBit
    ])

    return !!result
}

/**
 * Check if a status transition is allowed
 */
export async function canTransition(
    db: DatabaseAdapter,
    query: TransitionQuery
): Promise<boolean> {
    const entityBits = ENTITY_NAME_TO_BITS[query.entityType.toLowerCase()]
    const fromBits = STATUS_NAME_TO_BITS[query.fromStatus.toLowerCase()]
    const toBits = getToStatusBits(query.toStatus.toLowerCase())
    const relationBits = RELATION_NAME_TO_BITS[query.relation.toLowerCase()]

    if (!entityBits || !fromBits || !toBits || !relationBits) {
        console.warn('Invalid transition query:', query)
        return false
    }

    // Query config for matching transition entries
    const result = await db.get(`
        SELECT value FROM sysreg_config
        WHERE (value & $1 = $1 OR value & $2 = $2)  -- entity match or all
          AND (value & $3 = $3 OR value & $4 = $4)  -- from-status match or all
          AND (value & $5 = $5)                      -- to-status matches
          AND (value & $6) != 0                      -- relation included
          AND (value & $7) != 0                      -- manage_status capability
        LIMIT 1
    `, [
        entityBits, BITS.ENTITY_ALL,
        fromBits, BITS.STATE_ALL,
        toBits,
        relationBits,
        BITS.CAP_MANAGE_STATUS
    ])

    return !!result
}

/**
 * Get all allowed transitions for an entity in a given state
 */
export async function getAllowedTransitions(
    db: DatabaseAdapter,
    entityType: string,
    fromStatus: string,
    relation: string
): Promise<string[]> {
    const entityBits = ENTITY_NAME_TO_BITS[entityType.toLowerCase()]
    const fromBits = STATUS_NAME_TO_BITS[fromStatus.toLowerCase()]
    const relationBits = RELATION_NAME_TO_BITS[relation.toLowerCase()]

    if (!entityBits || !fromBits || !relationBits) {
        return []
    }

    // Query all transition entries for this entity/status/relation
    const results = await db.all(`
        SELECT value FROM sysreg_config
        WHERE (value & $1 = $1 OR value & $2 = $2)  -- entity match or all
          AND (value & $3 = $3 OR value & $4 = $4)  -- from-status match or all
          AND (value & $5) != 0                      -- relation included
          AND (value & $6) != 0                      -- manage_status capability
          AND (value & $7) != 0                      -- has to-status (is transition)
    `, [
        entityBits, BITS.ENTITY_ALL,
        fromBits, BITS.STATE_ALL,
        relationBits,
        BITS.CAP_MANAGE_STATUS,
        MASKS.TO_STATE
    ])

    // Extract to-status from each result
    const transitions: string[] = []
    for (const row of results as { value: number }[]) {
        const toStatus = extractToStatus(row.value)
        if (toStatus && !transitions.includes(toStatus)) {
            transitions.push(toStatus)
        }
    }

    return transitions
}

/**
 * Get all capabilities for an entity/status/relation
 */
export async function getCapabilities(
    db: DatabaseAdapter,
    entityType: string,
    status: string,
    relation: string
): Promise<{
    read: boolean
    update: boolean
    manage: boolean
    list: boolean
    share: boolean
    transitions: string[]
}> {
    const [read, update, manage, list, share] = await Promise.all([
        hasCapability(db, { entityType, fromStatus: status, relation, capability: 'read' }),
        hasCapability(db, { entityType, fromStatus: status, relation, capability: 'update' }),
        hasCapability(db, { entityType, fromStatus: status, relation, capability: 'manage' }),
        hasCapability(db, { entityType, fromStatus: status, relation, capability: 'list' }),
        hasCapability(db, { entityType, fromStatus: status, relation, capability: 'share' }),
    ])

    const transitions = await getAllowedTransitions(db, entityType, status, relation)

    return { read, update, manage, list, share, transitions }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getToStatusBits(status: string): number {
    const map: Record<string, number> = {
        'new': BITS.TO_STATE_NEW,
        'demo': BITS.TO_STATE_DEMO,
        'draft': BITS.TO_STATE_DRAFT,
        'review': BITS.TO_STATE_REVIEW,
        'released': BITS.TO_STATE_RELEASED,
        'archived': BITS.TO_STATE_ARCHIVED,
        'trash': BITS.TO_STATE_TRASH,
    }
    return map[status] || 0
}

function extractToStatus(value: number): string | null {
    const toStatusBits = (value & MASKS.TO_STATE) >> 17
    const map: Record<number, string> = {
        1: 'new',
        2: 'demo',
        3: 'draft',
        4: 'review',
        5: 'released',
        6: 'archived',
        7: 'trash',
    }
    return map[toStatusBits] || null
}

/**
 * Debug: Print a capability value in human-readable format
 */
export function debugCapabilityValue(value: number): string {
    const parts: string[] = []

    // Entity
    const entityBits = (value & MASKS.ENTITY) >> 3
    const entities: Record<number, string> = {
        0: 'ALL', 1: 'project', 2: 'user', 3: 'page',
        4: 'post', 5: 'event', 6: 'image', 7: 'location'
    }
    parts.push(`entity=${entities[entityBits] || entityBits}`)

    // From-status
    const statusBits = (value & MASKS.FROM_STATE) >> 8
    const statuses: Record<number, string> = {
        0: 'ALL', 1: 'new', 2: 'demo', 3: 'draft',
        4: 'review', 5: 'released', 6: 'archived', 7: 'trash'
    }
    parts.push(`from=${statuses[statusBits] || statusBits}`)

    // To-status (if transition)
    const toStatusBits = (value & MASKS.TO_STATE) >> 17
    if (toStatusBits) {
        parts.push(`to=${statuses[toStatusBits] || toStatusBits}`)
    }

    // Capabilities
    const caps: string[] = []
    if (value & BITS.CAP_READ) caps.push('read')
    if (value & BITS.CAP_UPDATE) caps.push('update')
    if (value & BITS.CAP_MANAGE) caps.push('manage')
    if (value & BITS.CAP_LIST) caps.push('list')
    if (value & BITS.CAP_SHARE) caps.push('share')
    if (value & BITS.CAP_MANAGE_STATUS) caps.push('status')
    if (caps.length) parts.push(`caps=[${caps.join(',')}]`)

    // Relations
    const rels: string[] = []
    if (value & BITS.REL_ANONYM) rels.push('anonym')
    if (value & BITS.REL_PARTNER) rels.push('partner')
    if (value & BITS.REL_PARTICIPANT) rels.push('participant')
    if (value & BITS.REL_MEMBER) rels.push('member')
    if (value & BITS.REL_CREATOR) rels.push('creator')
    if (rels.length) parts.push(`rels=[${rels.join(',')}]`)

    return parts.join(' | ')
}
