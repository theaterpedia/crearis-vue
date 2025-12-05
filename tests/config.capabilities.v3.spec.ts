/**
 * config.capabilities.spec.ts - Tests for capability detection (explicit flags)
 * 
 * Version: v0.3
 * Sprint: Projectlogin Workflow (Dec 1-9, 2025)
 * Updated: Dec 5, 2025 (Sunrise Talk - bits 17-19 repurposed for to_status)
 * 
 * Tests the capability portion of the sysreg_config matrix:
 * - Bits 11-13: Read capability (category + subcategories)
 * - Bits 14-16: Update capability (category + subcategories)
 * - Bits 17-19: to_status (for transitions) - REPURPOSED from create
 * - Bits 20-22: Manage capability (category + subcategories)
 * - Bits 23-24: Simple capabilities (list, share)
 * 
 * NOTE: Bits 17-19 were "create capability" in v0.2.
 * In v0.3 (Sunrise Talk Dec 5), they're repurposed for to_status in transition entries.
 * Create is now a PROJECT-level permission, not entity-level.
 */

import { describe, it, expect } from 'vitest'
import { v, vDescribe } from './helpers/versioned-test'

// ============================================================================
// Bit Constants (v0.3 - updated for to_status)
// ============================================================================

// Capability bit positions
const CAP_BITS = {
    read: { start: 11, width: 3 },
    update: { start: 14, width: 3 },
    to_status: { start: 17, width: 3 },  // RENAMED from create
    manage: { start: 20, width: 3 },
    list: { bit: 23 },
    share: { bit: 24 }
} as const

// Capability values
const CAP_VALUES = {
    // Read capabilities (bits 11-13)
    read: 0b001 << 11,           // Full read (category)
    read_preview: 0b010 << 11,   // Preview only
    read_metadata: 0b011 << 11,  // Metadata only

    // Update capabilities (bits 14-16)
    update: 0b001 << 14,         // Full update (category)
    update_comment: 0b010 << 14, // Add comments only
    update_append: 0b011 << 14,  // Append content only
    update_replace: 0b100 << 14, // Replace content
    update_shift: 0b101 << 14,   // Change date/costs/count

    // to_status values (bits 17-19) - for transition entries
    to_status_new: 0b001 << 17,
    to_status_demo: 0b010 << 17,
    to_status_draft: 0b011 << 17,
    to_status_review: 0b100 << 17,
    to_status_released: 0b101 << 17,
    to_status_archived: 0b110 << 17,
    to_status_trash: 0b111 << 17,

    // Manage capabilities (bits 20-22)
    manage: 0b001 << 20,         // Full manage (category)
    manage_status: 0b010 << 20,  // Status changes only
    manage_config: 0b011 << 20,  // Config changes only
    manage_delete: 0b100 << 20,  // Delete/trash only
    manage_archive: 0b101 << 20, // Archive only

    // Simple capabilities (bits 23-24)
    list: 1 << 23,
    share: 1 << 24
} as const

// Status names for to_status bits
const TO_STATUS_NAMES: Record<number, string> = {
    0: 'none',
    1: 'new',
    2: 'demo',
    3: 'draft',
    4: 'review',
    5: 'released',
    6: 'archived',
    7: 'trash'
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get the raw 3-bit value for a complex capability
 */
function getCapabilityValue(configValue: number, capability: 'read' | 'update' | 'to_status' | 'manage'): number {
    const { start, width } = CAP_BITS[capability]
    const mask = ((1 << width) - 1) << start
    return (configValue & mask) >> start
}

/**
 * Check if a simple capability is set
 */
function hasSimpleCapability(configValue: number, capability: 'list' | 'share'): boolean {
    const bit = CAP_BITS[capability].bit
    return (configValue & (1 << bit)) !== 0
}

/**
 * Check if any level of a complex capability is set (value > 0)
 */
function hasCapability(configValue: number, capability: 'read' | 'update' | 'manage'): boolean {
    return getCapabilityValue(configValue, capability) > 0
}

/**
 * Check if the full category of a complex capability is set (value === 1)
 */
function hasFullCapability(configValue: number, capability: 'read' | 'update' | 'manage'): boolean {
    return getCapabilityValue(configValue, capability) === 1
}

/**
 * Get to_status name from config value (for transition entries)
 */
function getToStatus(configValue: number): string {
    const value = getCapabilityValue(configValue, 'to_status')
    return TO_STATUS_NAMES[value] ?? 'unknown'
}

/**
 * Check if this config entry is a transition entry (has to_status set)
 */
function isTransitionEntry(configValue: number): boolean {
    return getCapabilityValue(configValue, 'to_status') > 0
}

/**
 * Get the name of the subcategory for a capability value
 */
function getCapabilitySubcategory(configValue: number, capability: 'read' | 'update' | 'manage'): string | null {
    const value = getCapabilityValue(configValue, capability)

    const subcategories: Record<string, Record<number, string>> = {
        read: { 0: 'none', 1: 'read', 2: 'preview', 3: 'metadata' },
        update: { 0: 'none', 1: 'update', 2: 'comment', 3: 'append', 4: 'replace', 5: 'shift' },
        manage: { 0: 'none', 1: 'manage', 2: 'status', 3: 'config', 4: 'delete', 5: 'archive' }
    }

    return subcategories[capability]?.[value] ?? null
}

/**
 * Get all capabilities directly set on a config entry.
 * NOTE: NO INHERITANCE. What you see is what you get.
 */
function getCapabilities(configValue: number): {
    read: boolean
    update: boolean
    manage: boolean
    list: boolean
    share: boolean
    toStatus: string | null
} {
    const toStatusValue = getCapabilityValue(configValue, 'to_status')
    return {
        read: hasCapability(configValue, 'read'),
        update: hasCapability(configValue, 'update'),
        manage: hasCapability(configValue, 'manage'),
        list: hasSimpleCapability(configValue, 'list'),
        share: hasSimpleCapability(configValue, 'share'),
        toStatus: toStatusValue > 0 ? TO_STATUS_NAMES[toStatusValue] : null
    }
}

// ============================================================================
// Test Suite
// ============================================================================

vDescribe({ version: '0.3' })('config.capabilities', () => {

    describe('Capability Bit Constants', () => {
        v({ version: '0.3' })('should have correct bit positions for complex capabilities', () => {
            expect(CAP_BITS.read.start).toBe(11)
            expect(CAP_BITS.update.start).toBe(14)
            expect(CAP_BITS.to_status.start).toBe(17)
            expect(CAP_BITS.manage.start).toBe(20)
        })

        v({ version: '0.3' })('should have 3-bit width for complex capabilities', () => {
            expect(CAP_BITS.read.width).toBe(3)
            expect(CAP_BITS.update.width).toBe(3)
            expect(CAP_BITS.to_status.width).toBe(3)
            expect(CAP_BITS.manage.width).toBe(3)
        })

        v({ version: '0.3' })('should have correct bit positions for simple capabilities', () => {
            expect(CAP_BITS.list.bit).toBe(23)
            expect(CAP_BITS.share.bit).toBe(24)
        })
    })

    describe('getCapabilityValue()', () => {
        v({ version: '0.3' })('should extract read capability value', () => {
            expect(getCapabilityValue(CAP_VALUES.read, 'read')).toBe(1)
            expect(getCapabilityValue(CAP_VALUES.read_preview, 'read')).toBe(2)
            expect(getCapabilityValue(CAP_VALUES.read_metadata, 'read')).toBe(3)
        })

        v({ version: '0.3' })('should extract update capability value', () => {
            expect(getCapabilityValue(CAP_VALUES.update, 'update')).toBe(1)
            expect(getCapabilityValue(CAP_VALUES.update_comment, 'update')).toBe(2)
            expect(getCapabilityValue(CAP_VALUES.update_append, 'update')).toBe(3)
        })

        v({ version: '0.3' })('should extract to_status value', () => {
            expect(getCapabilityValue(CAP_VALUES.to_status_new, 'to_status')).toBe(1)
            expect(getCapabilityValue(CAP_VALUES.to_status_draft, 'to_status')).toBe(3)
            expect(getCapabilityValue(CAP_VALUES.to_status_review, 'to_status')).toBe(4)
            expect(getCapabilityValue(CAP_VALUES.to_status_released, 'to_status')).toBe(5)
            expect(getCapabilityValue(CAP_VALUES.to_status_trash, 'to_status')).toBe(7)
        })

        v({ version: '0.3' })('should extract manage capability value', () => {
            expect(getCapabilityValue(CAP_VALUES.manage, 'manage')).toBe(1)
            expect(getCapabilityValue(CAP_VALUES.manage_status, 'manage')).toBe(2)
            expect(getCapabilityValue(CAP_VALUES.manage_delete, 'manage')).toBe(4)
        })

        v({ version: '0.3' })('should return 0 for unset capabilities', () => {
            expect(getCapabilityValue(0, 'read')).toBe(0)
            expect(getCapabilityValue(0, 'update')).toBe(0)
            expect(getCapabilityValue(0, 'to_status')).toBe(0)
            expect(getCapabilityValue(0, 'manage')).toBe(0)
        })

        v({ version: '0.3' })('should isolate capability from combined value', () => {
            const combined = CAP_VALUES.read | CAP_VALUES.update_comment | CAP_VALUES.manage_status
            expect(getCapabilityValue(combined, 'read')).toBe(1)
            expect(getCapabilityValue(combined, 'update')).toBe(2)
            expect(getCapabilityValue(combined, 'to_status')).toBe(0)
            expect(getCapabilityValue(combined, 'manage')).toBe(2)
        })
    })

    describe('to_status (Transition Entries)', () => {
        v({ version: '0.3' })('should identify transition entries', () => {
            const nonTransition = CAP_VALUES.read | CAP_VALUES.update
            const transition = CAP_VALUES.to_status_draft | CAP_VALUES.manage_status

            expect(isTransitionEntry(nonTransition)).toBe(false)
            expect(isTransitionEntry(transition)).toBe(true)
        })

        v({ version: '0.3' })('should get to_status name', () => {
            expect(getToStatus(CAP_VALUES.to_status_new)).toBe('new')
            expect(getToStatus(CAP_VALUES.to_status_draft)).toBe('draft')
            expect(getToStatus(CAP_VALUES.to_status_review)).toBe('review')
            expect(getToStatus(CAP_VALUES.to_status_released)).toBe('released')
            expect(getToStatus(CAP_VALUES.to_status_trash)).toBe('trash')
            expect(getToStatus(0)).toBe('none')
        })

        v({ version: '0.3' })('should handle transition with manage_status', () => {
            // Typical transition entry: to_status + manage_status
            const transitionEntry = CAP_VALUES.to_status_review | CAP_VALUES.manage_status

            expect(isTransitionEntry(transitionEntry)).toBe(true)
            expect(getToStatus(transitionEntry)).toBe('review')
            expect(getCapabilityValue(transitionEntry, 'manage')).toBe(2) // status
        })

        v({ version: '0.3' })('should handle trash transition with manage_delete', () => {
            // Trash transition uses manage_delete
            const trashEntry = CAP_VALUES.to_status_trash | CAP_VALUES.manage_delete

            expect(isTransitionEntry(trashEntry)).toBe(true)
            expect(getToStatus(trashEntry)).toBe('trash')
            expect(getCapabilityValue(trashEntry, 'manage')).toBe(4) // delete
        })
    })

    describe('hasSimpleCapability()', () => {
        v({ version: '0.3' })('should detect list capability', () => {
            expect(hasSimpleCapability(CAP_VALUES.list, 'list')).toBe(true)
            expect(hasSimpleCapability(0, 'list')).toBe(false)
        })

        v({ version: '0.3' })('should detect share capability', () => {
            expect(hasSimpleCapability(CAP_VALUES.share, 'share')).toBe(true)
            expect(hasSimpleCapability(0, 'share')).toBe(false)
        })
    })

    describe('Explicit Capabilities (No Inheritance)', () => {
        v({ version: '0.3' })('should require explicit list flag', () => {
            const caps = getCapabilities(CAP_VALUES.read)
            expect(caps.read).toBe(true)
            expect(caps.list).toBe(false) // NOT inherited!
        })

        v({ version: '0.3' })('should require explicit flags with update', () => {
            const caps = getCapabilities(CAP_VALUES.update)
            expect(caps.update).toBe(true)
            expect(caps.read).toBe(false)
            expect(caps.list).toBe(false)
        })

        v({ version: '0.3' })('should correctly read explicit flags', () => {
            const fullAccess = CAP_VALUES.read | CAP_VALUES.update | CAP_VALUES.list | CAP_VALUES.share
            const caps = getCapabilities(fullAccess)
            expect(caps.read).toBe(true)
            expect(caps.update).toBe(true)
            expect(caps.list).toBe(true)
            expect(caps.share).toBe(true)
            expect(caps.manage).toBe(false)
            expect(caps.toStatus).toBeNull()
        })

        v({ version: '0.3' })('should include toStatus for transition entries', () => {
            const transition = CAP_VALUES.to_status_draft | CAP_VALUES.manage_status
            const caps = getCapabilities(transition)
            expect(caps.toStatus).toBe('draft')
            expect(caps.manage).toBe(true)
        })
    })

    describe('Combined Capabilities', () => {
        v({ version: '0.3' })('should handle read + update', () => {
            const combined = CAP_VALUES.read | CAP_VALUES.update
            expect(getCapabilityValue(combined, 'read')).toBe(1)
            expect(getCapabilityValue(combined, 'update')).toBe(1)
            expect(getCapabilityValue(combined, 'to_status')).toBe(0)
        })

        v({ version: '0.3' })('should handle all complex capabilities', () => {
            const allComplex = CAP_VALUES.read | CAP_VALUES.update |
                CAP_VALUES.to_status_review | CAP_VALUES.manage
            expect(hasCapability(allComplex, 'read')).toBe(true)
            expect(hasCapability(allComplex, 'update')).toBe(true)
            expect(isTransitionEntry(allComplex)).toBe(true)
            expect(hasCapability(allComplex, 'manage')).toBe(true)
        })
    })

    describe('Subcategory Pattern', () => {
        v({ version: '0.3' })('should understand category as value 1', () => {
            expect(getCapabilityValue(CAP_VALUES.read, 'read')).toBe(1)
            expect(getCapabilityValue(CAP_VALUES.update, 'update')).toBe(1)
            expect(getCapabilityValue(CAP_VALUES.manage, 'manage')).toBe(1)
        })

        v({ version: '0.3' })('should understand subcategories as values 2+', () => {
            expect(getCapabilityValue(CAP_VALUES.read_preview, 'read')).toBe(2)
            expect(getCapabilityValue(CAP_VALUES.update_comment, 'update')).toBe(2)
            expect(getCapabilityValue(CAP_VALUES.manage_status, 'manage')).toBe(2)
        })

        v({ version: '0.3' })('should get subcategory names', () => {
            expect(getCapabilitySubcategory(CAP_VALUES.read, 'read')).toBe('read')
            expect(getCapabilitySubcategory(CAP_VALUES.read_preview, 'read')).toBe('preview')
            expect(getCapabilitySubcategory(CAP_VALUES.manage_status, 'manage')).toBe('status')
            expect(getCapabilitySubcategory(CAP_VALUES.manage_delete, 'manage')).toBe('delete')
        })
    })
})

// ============================================================================
// Integration with Project Type / Entity / State
// ============================================================================

vDescribe({ version: '0.3' })('config.capabilities.matrix', () => {
    const PROJECT_BITS = { start: 0, width: 3 }
    const ENTITY_BITS = { start: 3, width: 5 }
    const STATE_BITS = { start: 8, width: 3 }

    function getProjectType(value: number): number {
        const mask = ((1 << PROJECT_BITS.width) - 1) << PROJECT_BITS.start
        return (value & mask) >> PROJECT_BITS.start
    }

    function getEntity(value: number): number {
        const mask = ((1 << ENTITY_BITS.width) - 1) << ENTITY_BITS.start
        return (value & mask) >> ENTITY_BITS.start
    }

    function getState(value: number): number {
        const mask = ((1 << STATE_BITS.width) - 1) << STATE_BITS.start
        return (value & mask) >> STATE_BITS.start
    }

    v({ version: '0.3' })('should parse full capability config entry', () => {
        const entry =
            0b010 |              // project type
            (0b00100 << 3) |     // post entity
            (0b101 << 8) |       // released state
            (0b001 << 11) |      // read capability
            (1 << 23) |          // list
            (0b11111 << 25)      // all relations

        expect(getProjectType(entry)).toBe(2)
        expect(getEntity(entry)).toBe(0b00100)
        expect(getState(entry)).toBe(5)
        expect(hasFullCapability(entry, 'read')).toBe(true)
        expect(hasSimpleCapability(entry, 'list')).toBe(true)
    })

    v({ version: '0.3' })('should parse transition config entry', () => {
        // Transition: post draft→review for creator
        const entry =
            0b010 |              // project type
            (0b00100 << 3) |     // post entity
            (0b011 << 8) |       // draft state (from_status)
            (0b100 << 17) |      // to_status = review
            (0b010 << 20) |      // manage_status
            (1 << 29)            // creator relation

        expect(getEntity(entry)).toBe(0b00100)
        expect(getState(entry)).toBe(3) // draft
        expect(getToStatus(entry)).toBe('review')
        expect(isTransitionEntry(entry)).toBe(true)
    })
})
