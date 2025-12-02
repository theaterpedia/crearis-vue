/**
 * config.capabilities.spec.ts - Tests for capability detection (explicit flags)
 * 
 * Version: v0.2
 * Sprint: Projectlogin Workflow (Dec 1-9, 2025)
 * 
 * Tests the capability portion of the sysreg_config matrix:
 * - Bits 11-13: Read capability (category + subcategories)
 * - Bits 14-16: Update capability (category + subcategories)
 * - Bits 17-19: Create capability (category + subcategories)
 * - Bits 20-22: Manage capability (category + subcategories)
 * - Bits 23-24: Simple capabilities (list, share)
 * 
 * NOTE: Capability inheritance is DROPPED for v0.2-v0.4.
 * All capabilities must be explicitly set in config entries.
 * The CapabilitiesEditor UI handles this automatically.
 */

import { describe, it, expect } from 'vitest'
import { v, vDescribe } from './helpers/versioned-test'

// ============================================================================
// Bit Constants (updated for 5-bit entity: bits 3-7)
// ============================================================================

// Capability bit positions
const CAP_BITS = {
    read: { start: 11, width: 3 },
    update: { start: 14, width: 3 },
    create: { start: 17, width: 3 },
    manage: { start: 20, width: 3 },
    list: { bit: 23 },
    share: { bit: 24 }
} as const

// Capability values (category = 001 in each 3-bit group)
const CAP_VALUES = {
    // Read capabilities
    read: 0b001 << 11,           // Full read (category)
    read_preview: 0b010 << 11,   // Preview only
    read_metadata: 0b011 << 11,  // Metadata only

    // Update capabilities
    update: 0b001 << 14,         // Full update (category)
    update_comment: 0b010 << 14, // Add comments only
    update_append: 0b011 << 14,  // Append content only
    update_replace: 0b100 << 14, // Replace content
    update_shift: 0b101 << 14,   // Change date/costs/count

    // Create capabilities
    create: 0b001 << 17,         // Full create (category)
    create_draft: 0b010 << 17,   // Create as draft only
    create_template: 0b011 << 17, // From template only

    // Manage capabilities
    manage: 0b001 << 20,         // Full manage (category)
    manage_status: 0b010 << 20,  // Status changes only
    manage_config: 0b011 << 20,  // Config changes only
    manage_delete: 0b100 << 20,  // Delete/trash only
    manage_archive: 0b101 << 20, // Archive only

    // Simple capabilities
    list: 1 << 23,
    share: 1 << 24
} as const

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get the raw 3-bit value for a complex capability
 */
function getCapabilityValue(configValue: number, capability: 'read' | 'update' | 'create' | 'manage'): number {
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
function hasCapability(configValue: number, capability: 'read' | 'update' | 'create' | 'manage'): boolean {
    return getCapabilityValue(configValue, capability) > 0
}

/**
 * Check if the full category of a complex capability is set (value === 1)
 */
function hasFullCapability(configValue: number, capability: 'read' | 'update' | 'create' | 'manage'): boolean {
    return getCapabilityValue(configValue, capability) === 1
}

/**
 * Get the name of the subcategory for a capability value
 */
function getCapabilitySubcategory(configValue: number, capability: 'read' | 'update' | 'create' | 'manage'): string | null {
    const value = getCapabilityValue(configValue, capability)

    const subcategories: Record<string, Record<number, string>> = {
        read: { 0: 'none', 1: 'read', 2: 'preview', 3: 'metadata' },
        update: { 0: 'none', 1: 'update', 2: 'comment', 3: 'append', 4: 'replace', 5: 'shift' },
        create: { 0: 'none', 1: 'create', 2: 'draft', 3: 'template' },
        manage: { 0: 'none', 1: 'manage', 2: 'status', 3: 'config', 4: 'delete', 5: 'archive' }
    }

    return subcategories[capability]?.[value] ?? null
}

/**
 * Get all capabilities directly set on a config entry.
 * 
 * NOTE: NO INHERITANCE in v0.2-v0.4. What you see is what you get.
 * Each capability must be explicitly set in the config entry.
 */
function getCapabilities(configValue: number): {
    read: boolean
    update: boolean
    create: boolean
    manage: boolean
    list: boolean
    share: boolean
} {
    return {
        read: hasCapability(configValue, 'read'),
        update: hasCapability(configValue, 'update'),
        create: hasCapability(configValue, 'create'),
        manage: hasCapability(configValue, 'manage'),
        list: hasSimpleCapability(configValue, 'list'),
        share: hasSimpleCapability(configValue, 'share')
    }
}

// ============================================================================
// Test Suite
// ============================================================================

vDescribe({ version: '0.2' })('config.capabilities', () => {

    describe('Capability Bit Constants', () => {
        v({ version: '0.2' })('should have correct bit positions for complex capabilities', () => {
            expect(CAP_BITS.read.start).toBe(11)
            expect(CAP_BITS.update.start).toBe(14)
            expect(CAP_BITS.create.start).toBe(17)
            expect(CAP_BITS.manage.start).toBe(20)
        })

        v({ version: '0.2' })('should have 3-bit width for complex capabilities', () => {
            expect(CAP_BITS.read.width).toBe(3)
            expect(CAP_BITS.update.width).toBe(3)
            expect(CAP_BITS.create.width).toBe(3)
            expect(CAP_BITS.manage.width).toBe(3)
        })

        v({ version: '0.2' })('should have correct bit positions for simple capabilities', () => {
            expect(CAP_BITS.list.bit).toBe(23)
            expect(CAP_BITS.share.bit).toBe(24)
        })
    })

    describe('getCapabilityValue()', () => {
        v({ version: '0.2' })('should extract read capability value', () => {
            expect(getCapabilityValue(CAP_VALUES.read, 'read')).toBe(1)
            expect(getCapabilityValue(CAP_VALUES.read_preview, 'read')).toBe(2)
            expect(getCapabilityValue(CAP_VALUES.read_metadata, 'read')).toBe(3)
        })

        v({ version: '0.2' })('should extract update capability value', () => {
            expect(getCapabilityValue(CAP_VALUES.update, 'update')).toBe(1)
            expect(getCapabilityValue(CAP_VALUES.update_comment, 'update')).toBe(2)
            expect(getCapabilityValue(CAP_VALUES.update_append, 'update')).toBe(3)
            expect(getCapabilityValue(CAP_VALUES.update_replace, 'update')).toBe(4)
            expect(getCapabilityValue(CAP_VALUES.update_shift, 'update')).toBe(5)
        })

        v({ version: '0.2' })('should extract create capability value', () => {
            expect(getCapabilityValue(CAP_VALUES.create, 'create')).toBe(1)
            expect(getCapabilityValue(CAP_VALUES.create_draft, 'create')).toBe(2)
            expect(getCapabilityValue(CAP_VALUES.create_template, 'create')).toBe(3)
        })

        v({ version: '0.2' })('should extract manage capability value', () => {
            expect(getCapabilityValue(CAP_VALUES.manage, 'manage')).toBe(1)
            expect(getCapabilityValue(CAP_VALUES.manage_status, 'manage')).toBe(2)
            expect(getCapabilityValue(CAP_VALUES.manage_config, 'manage')).toBe(3)
            expect(getCapabilityValue(CAP_VALUES.manage_delete, 'manage')).toBe(4)
            expect(getCapabilityValue(CAP_VALUES.manage_archive, 'manage')).toBe(5)
        })

        v({ version: '0.2' })('should return 0 for unset capabilities', () => {
            expect(getCapabilityValue(0, 'read')).toBe(0)
            expect(getCapabilityValue(0, 'update')).toBe(0)
            expect(getCapabilityValue(0, 'create')).toBe(0)
            expect(getCapabilityValue(0, 'manage')).toBe(0)
        })

        v({ version: '0.2' })('should isolate capability from combined value', () => {
            const combined = CAP_VALUES.read | CAP_VALUES.update_comment | CAP_VALUES.manage_status
            expect(getCapabilityValue(combined, 'read')).toBe(1)
            expect(getCapabilityValue(combined, 'update')).toBe(2)
            expect(getCapabilityValue(combined, 'create')).toBe(0)
            expect(getCapabilityValue(combined, 'manage')).toBe(2)
        })
    })

    describe('hasSimpleCapability()', () => {
        v({ version: '0.2' })('should detect list capability', () => {
            expect(hasSimpleCapability(CAP_VALUES.list, 'list')).toBe(true)
            expect(hasSimpleCapability(0, 'list')).toBe(false)
        })

        v({ version: '0.2' })('should detect share capability', () => {
            expect(hasSimpleCapability(CAP_VALUES.share, 'share')).toBe(true)
            expect(hasSimpleCapability(0, 'share')).toBe(false)
        })

        v({ version: '0.2' })('should handle both set', () => {
            const both = CAP_VALUES.list | CAP_VALUES.share
            expect(hasSimpleCapability(both, 'list')).toBe(true)
            expect(hasSimpleCapability(both, 'share')).toBe(true)
        })
    })

    describe('hasCapability() and hasFullCapability()', () => {
        v({ version: '0.2' })('should detect any level of read', () => {
            expect(hasCapability(CAP_VALUES.read, 'read')).toBe(true)
            expect(hasCapability(CAP_VALUES.read_preview, 'read')).toBe(true)
            expect(hasCapability(CAP_VALUES.read_metadata, 'read')).toBe(true)
            expect(hasCapability(0, 'read')).toBe(false)
        })

        v({ version: '0.2' })('should detect full category vs subcategory', () => {
            expect(hasFullCapability(CAP_VALUES.read, 'read')).toBe(true)
            expect(hasFullCapability(CAP_VALUES.read_preview, 'read')).toBe(false)
            expect(hasFullCapability(CAP_VALUES.update, 'update')).toBe(true)
            expect(hasFullCapability(CAP_VALUES.update_comment, 'update')).toBe(false)
        })
    })

    describe('getCapabilitySubcategory()', () => {
        v({ version: '0.2' })('should return subcategory names for read', () => {
            expect(getCapabilitySubcategory(0, 'read')).toBe('none')
            expect(getCapabilitySubcategory(CAP_VALUES.read, 'read')).toBe('read')
            expect(getCapabilitySubcategory(CAP_VALUES.read_preview, 'read')).toBe('preview')
            expect(getCapabilitySubcategory(CAP_VALUES.read_metadata, 'read')).toBe('metadata')
        })

        v({ version: '0.2' })('should return subcategory names for update', () => {
            expect(getCapabilitySubcategory(CAP_VALUES.update, 'update')).toBe('update')
            expect(getCapabilitySubcategory(CAP_VALUES.update_comment, 'update')).toBe('comment')
            expect(getCapabilitySubcategory(CAP_VALUES.update_append, 'update')).toBe('append')
            expect(getCapabilitySubcategory(CAP_VALUES.update_replace, 'update')).toBe('replace')
            expect(getCapabilitySubcategory(CAP_VALUES.update_shift, 'update')).toBe('shift')
        })

        v({ version: '0.2' })('should return subcategory names for manage', () => {
            expect(getCapabilitySubcategory(CAP_VALUES.manage, 'manage')).toBe('manage')
            expect(getCapabilitySubcategory(CAP_VALUES.manage_status, 'manage')).toBe('status')
            expect(getCapabilitySubcategory(CAP_VALUES.manage_delete, 'manage')).toBe('delete')
        })
    })

    describe('Explicit Capabilities (No Inheritance)', () => {
        v({ version: '0.2' })('should require explicit list flag (not inherited from read)', () => {
            // In v0.2, read does NOT automatically grant list
            const caps = getCapabilities(CAP_VALUES.read)
            expect(caps.read).toBe(true)
            expect(caps.list).toBe(false) // NOT inherited!
        })

        v({ version: '0.2' })('should require explicit flags with update', () => {
            // In v0.2, update does NOT automatically grant read/list/share
            const caps = getCapabilities(CAP_VALUES.update)
            expect(caps.update).toBe(true)
            expect(caps.read).toBe(false)  // NOT inherited!
            expect(caps.list).toBe(false)  // NOT inherited!
            expect(caps.share).toBe(false) // NOT inherited!
        })

        v({ version: '0.2' })('should require explicit flags with create', () => {
            // In v0.2, create does NOT automatically grant read/list/share
            const caps = getCapabilities(CAP_VALUES.create)
            expect(caps.create).toBe(true)
            expect(caps.read).toBe(false)  // NOT inherited!
            expect(caps.list).toBe(false)  // NOT inherited!
            expect(caps.share).toBe(false) // NOT inherited!
        })

        v({ version: '0.2' })('should require explicit flags with manage', () => {
            // In v0.2, manage does NOT automatically grant list/share
            const caps = getCapabilities(CAP_VALUES.manage)
            expect(caps.manage).toBe(true)
            expect(caps.list).toBe(false)  // NOT inherited!
            expect(caps.share).toBe(false) // NOT inherited!
            expect(caps.read).toBe(false)
        })

        v({ version: '0.2' })('should handle no capabilities', () => {
            const caps = getCapabilities(0)
            expect(caps.read).toBe(false)
            expect(caps.update).toBe(false)
            expect(caps.create).toBe(false)
            expect(caps.manage).toBe(false)
            expect(caps.list).toBe(false)
            expect(caps.share).toBe(false)
        })

        v({ version: '0.2' })('should correctly read explicit flags', () => {
            // CapabilitiesEditor will set all needed flags explicitly
            const fullAccess = CAP_VALUES.read | CAP_VALUES.update | CAP_VALUES.list | CAP_VALUES.share
            const caps = getCapabilities(fullAccess)
            expect(caps.read).toBe(true)
            expect(caps.update).toBe(true)
            expect(caps.list).toBe(true)
            expect(caps.share).toBe(true)
            expect(caps.create).toBe(false)
            expect(caps.manage).toBe(false)
        })
    })

    describe('Combined Capabilities', () => {
        v({ version: '0.2' })('should handle read + update', () => {
            const combined = CAP_VALUES.read | CAP_VALUES.update
            expect(getCapabilityValue(combined, 'read')).toBe(1)
            expect(getCapabilityValue(combined, 'update')).toBe(1)
            expect(getCapabilityValue(combined, 'create')).toBe(0)
        })

        v({ version: '0.2' })('should handle all complex capabilities', () => {
            const allComplex = CAP_VALUES.read | CAP_VALUES.update |
                CAP_VALUES.create | CAP_VALUES.manage
            expect(hasCapability(allComplex, 'read')).toBe(true)
            expect(hasCapability(allComplex, 'update')).toBe(true)
            expect(hasCapability(allComplex, 'create')).toBe(true)
            expect(hasCapability(allComplex, 'manage')).toBe(true)
        })

        v({ version: '0.2' })('should handle complex + simple capabilities', () => {
            const mixed = CAP_VALUES.read_preview | CAP_VALUES.share
            expect(getCapabilityValue(mixed, 'read')).toBe(2)
            expect(hasSimpleCapability(mixed, 'share')).toBe(true)
            expect(hasSimpleCapability(mixed, 'list')).toBe(false)
        })
    })

    describe('Subcategory Pattern (parent_bit)', () => {
        v({ version: '0.2' })('should understand category as value 1', () => {
            // In category->subcategory pattern:
            // Value 1 = category (parent)
            // Value 2+ = subcategories
            expect(getCapabilityValue(CAP_VALUES.read, 'read')).toBe(1)
            expect(getCapabilityValue(CAP_VALUES.update, 'update')).toBe(1)
        })

        v({ version: '0.2' })('should understand subcategories as values 2+', () => {
            expect(getCapabilityValue(CAP_VALUES.read_preview, 'read')).toBe(2)
            expect(getCapabilityValue(CAP_VALUES.read_metadata, 'read')).toBe(3)
            expect(getCapabilityValue(CAP_VALUES.update_comment, 'update')).toBe(2)
            expect(getCapabilityValue(CAP_VALUES.update_shift, 'update')).toBe(5)
        })

        v({ version: '0.2' })('should treat category as "full" and subcategory as "limited"', () => {
            // Category (value 1) = full capability
            expect(hasFullCapability(CAP_VALUES.read, 'read')).toBe(true)

            // Subcategory (value 2+) = limited capability
            expect(hasFullCapability(CAP_VALUES.read_preview, 'read')).toBe(false)
            expect(hasCapability(CAP_VALUES.read_preview, 'read')).toBe(true)
        })
    })
})

// ============================================================================
// Integration with Project Type / Entity / State
// ============================================================================

vDescribe({ version: '0.2' })('config.capabilities.matrix', () => {
    // New bit layout for 5-bit entity
    // Project type bits (0-2)
    const PROJECT_BITS = { start: 0, width: 3 }
    // Entity bits (3-7) - 5 bits = 32 entity types
    const ENTITY_BITS = { start: 3, width: 5 }
    // State bits (8-10)
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

    v({ version: '0.2' })('should parse full config entry', () => {
        // Example: default project, post entity (00100), released state, read capability, anonym role
        const projectType = 0b010 // project (bits 0-2)
        const entity = 0b00100 << 3 // post entity (bits 3-7)
        const state = 0b101 << 8 // released (bits 8-10)
        const read = 0b001 << 11 // read category (bits 11-13)
        const list = 1 << 23 // explicit list
        const roles = 1 << 25 // anonym (bit 25)

        const configEntry = projectType | entity | state | read | list | roles

        expect(getProjectType(configEntry)).toBe(0b010)
        expect(getEntity(configEntry)).toBe(0b00100)
        expect(getState(configEntry)).toBe(0b101)
        expect(getCapabilityValue(configEntry, 'read')).toBe(1)
        expect(hasSimpleCapability(configEntry, 'list')).toBe(true)
    })

    v({ version: '0.2' })('should handle example: "Released posts readable by anyone"', () => {
        // Build config: default project, post (00100), released, read + list, all roles
        const entry =
            0b010 |              // project type (bits 0-2)
            (0b00100 << 3) |     // post entity (bits 3-7)
            (0b101 << 8) |       // released state (bits 8-10)
            (0b001 << 11) |      // read capability (bits 11-13)
            (1 << 23) |          // list (explicit - bit 23)
            (0b11111 << 25)      // all roles (bits 25-29)

        expect(getProjectType(entry)).toBe(2) // project
        expect(getEntity(entry)).toBe(0b00100) // post
        expect(getState(entry)).toBe(5) // released
        expect(hasFullCapability(entry, 'read')).toBe(true)
        expect(hasSimpleCapability(entry, 'list')).toBe(true)
    })
})
