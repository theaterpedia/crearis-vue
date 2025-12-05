/**
 * GET /api/sysreg/capabilities
 * 
 * Returns capabilities and allowed transitions for an entity
 * based on sysreg_config entries.
 * 
 * Query params:
 * - entity: 'post' | 'project' | 'image' | 'event'
 * - status: current status name (e.g., 'draft', 'review')
 * - relation: user's relation ('anonym', 'partner', 'participant', 'member', 'creator')
 * 
 * Returns:
 * {
 *   capabilities: { read, update, manage, list, share },
 *   transitions: ['draft', 'review', 'trash', ...]
 * }
 */

import { defineEventHandler, getQuery, createError } from 'h3'
import { db } from '../../database/init'

// Bit layout (must match server/database/capabilities-lookup.ts)
const BITS = {
    // Entity (bits 3-7)
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

    // Capabilities
    CAP_READ: 0b001 << 11,
    CAP_UPDATE: 0b001 << 14,
    CAP_MANAGE: 0b001 << 20,
    CAP_MANAGE_STATUS: 0b010 << 20,
    CAP_MANAGE_DELETE: 0b100 << 20,
    CAP_LIST: 1 << 23,
    CAP_SHARE: 1 << 24,

    // Relations (bits 25-29)
    REL_ANONYM: 1 << 25,
    REL_PARTNER: 1 << 26,
    REL_PARTICIPANT: 1 << 27,
    REL_MEMBER: 1 << 28,
    REL_CREATOR: 1 << 29,
}

// Masks
const MASKS = {
    ENTITY: 0b11111 << 3,
    FROM_STATE: 0b111 << 8,
    TO_STATE: 0b111 << 17,
    RELATIONS: 0b11111 << 25,
}

const ENTITY_MAP: Record<string, number> = {
    'project': BITS.ENTITY_PROJECT,
    'user': BITS.ENTITY_USER,
    'page': BITS.ENTITY_PAGE,
    'post': BITS.ENTITY_POST,
    'event': BITS.ENTITY_EVENT,
    'image': BITS.ENTITY_IMAGE,
    'location': BITS.ENTITY_LOCATION,
}

const STATUS_MAP: Record<string, number> = {
    'new': BITS.STATE_NEW,
    'demo': BITS.STATE_DEMO,
    'draft': BITS.STATE_DRAFT,
    'review': BITS.STATE_REVIEW,
    'released': BITS.STATE_RELEASED,
    'archived': BITS.STATE_ARCHIVED,
    'trash': BITS.STATE_TRASH,
}

const RELATION_MAP: Record<string, number> = {
    'anonym': BITS.REL_ANONYM,
    'partner': BITS.REL_PARTNER,
    'participant': BITS.REL_PARTICIPANT,
    'member': BITS.REL_MEMBER,
    'creator': BITS.REL_CREATOR,
}

const TO_STATUS_REVERSE: Record<number, string> = {
    1: 'new',
    2: 'demo',
    3: 'draft',
    4: 'review',
    5: 'released',
    6: 'archived',
    7: 'trash',
}

export default defineEventHandler(async (event) => {
    const query = getQuery(event)

    const entity = (query.entity as string)?.toLowerCase()
    const status = (query.status as string)?.toLowerCase()
    const relation = (query.relation as string)?.toLowerCase()

    // Validate params
    if (!entity || !ENTITY_MAP[entity]) {
        throw createError({
            statusCode: 400,
            message: `Invalid entity. Valid: ${Object.keys(ENTITY_MAP).join(', ')}`
        })
    }

    if (!status || !STATUS_MAP[status]) {
        throw createError({
            statusCode: 400,
            message: `Invalid status. Valid: ${Object.keys(STATUS_MAP).join(', ')}`
        })
    }

    if (!relation || !RELATION_MAP[relation]) {
        throw createError({
            statusCode: 400,
            message: `Invalid relation. Valid: ${Object.keys(RELATION_MAP).join(', ')}`
        })
    }

    const entityBits = ENTITY_MAP[entity]
    const statusBits = STATUS_MAP[status]
    const relationBits = RELATION_MAP[relation]

    // Query all matching config entries
    // An entry matches if:
    // 1. Entity matches exactly (for now, we don't support ENTITY_ALL in config)
    // 2. Status matches (or is ALL - bits 8-10 = 0)
    // 3. Relation is included
    const results = await db.all(`
        SELECT value, name FROM sysreg_config
        WHERE (value & $1) = $2        -- exact entity match
        AND (
            (value & $3) = $4 OR       -- exact status match
            (value & $3) = 0           -- status ALL (bits 8-10 = 0)
        )
        AND (value & $5) != 0          -- relation included
    `, [MASKS.ENTITY, entityBits, MASKS.FROM_STATE, statusBits, relationBits])

    // Aggregate capabilities and transitions
    const capabilities = {
        read: false,
        update: false,
        manage: false,
        list: false,
        share: false,
    }

    const transitions = new Set<string>()

    for (const row of results as { value: number; name: string }[]) {
        const v = row.value

        // Check capabilities
        if (v & BITS.CAP_READ) capabilities.read = true
        if (v & BITS.CAP_UPDATE) capabilities.update = true
        if (v & BITS.CAP_MANAGE) capabilities.manage = true
        if (v & BITS.CAP_LIST) capabilities.list = true
        if (v & BITS.CAP_SHARE) capabilities.share = true

        // Check for transition (has to_status bits set)
        const toStatusBits = (v & MASKS.TO_STATE) >> 17
        // A transition entry has either CAP_MANAGE_STATUS or CAP_MANAGE_DELETE
        if (toStatusBits && (v & (BITS.CAP_MANAGE_STATUS | BITS.CAP_MANAGE_DELETE))) {
            const toStatus = TO_STATUS_REVERSE[toStatusBits]
            if (toStatus) {
                transitions.add(toStatus)
            }
        }
    }

    return {
        entity,
        status,
        relation,
        capabilities,
        transitions: Array.from(transitions),
        _debug: {
            matchingEntries: (results as { name: string }[]).map(r => r.name)
        }
    }
})
