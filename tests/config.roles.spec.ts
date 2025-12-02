/**
 * config.roles.spec.ts - Tests for role bit detection and resolution
 * 
 * Version: v0.2
 * Sprint: Projectlogin Workflow (Dec 1-9, 2025)
 * 
 * Tests the role portion of the sysreg_config capabilities matrix:
 * - Bit 25: anonym
 * - Bit 26: partner
 * - Bit 27: participant
 * - Bit 28: member
 * - Bit 29: owner (record owner)
 * - Bit 30: reserved
 * - Bit 31 (sign): admin (v0.5 - deferred)
 * 
 * Note: "owner" refers to record owner (creator of the record), NOT project-owner.
 * Project-owners receive elevated capabilities via separate config entries.
 */

import { describe, it, expect } from 'vitest'
import { v, vDescribe } from './helpers/versioned-test'

// Role bit positions (updated for 5-bit entity)
const ROLE_BITS = {
    anonym: 25,
    partner: 26,
    participant: 27,
    member: 28,
    owner: 29,     // Record owner (creator of the record)
    admin: 31      // sign bit - v0.5
} as const

// Role bit values (1 << bit position)
const ROLE_VALUES = {
    anonym: 1 << 25,      // 33554432
    partner: 1 << 26,     // 67108864
    participant: 1 << 27, // 134217728
    member: 1 << 28,      // 268435456
    owner: 1 << 29,       // 536870912
    admin: 1 << 31        // -2147483648 (negative due to sign bit)
} as const

// Helper functions for role detection
function hasRole(configValue: number, role: keyof typeof ROLE_BITS): boolean {
    const bit = ROLE_BITS[role]
    return (configValue & (1 << bit)) !== 0
}

function getRoles(configValue: number): string[] {
    const roles: string[] = []
    for (const [role, bit] of Object.entries(ROLE_BITS)) {
        if (role === 'admin') continue // Skip admin for now (v0.5)
        if ((configValue & (1 << bit)) !== 0) {
            roles.push(role)
        }
    }
    return roles
}

function setRoles(roles: string[]): number {
    let value = 0
    for (const role of roles) {
        const bit = ROLE_BITS[role as keyof typeof ROLE_BITS]
        if (bit !== undefined && role !== 'admin') {
            value |= (1 << bit)
        }
    }
    return value
}

// ============================================================================
// Test Suite
// ============================================================================

vDescribe({ version: '0.2' })('config.roles', () => {

    describe('Role Bit Constants', () => {
        v({ version: '0.2' })('should have correct bit positions', () => {
            expect(ROLE_BITS.anonym).toBe(25)
            expect(ROLE_BITS.partner).toBe(26)
            expect(ROLE_BITS.participant).toBe(27)
            expect(ROLE_BITS.member).toBe(28)
            expect(ROLE_BITS.owner).toBe(29)
        })

        v({ version: '0.2' })('should have correct bit values', () => {
            expect(ROLE_VALUES.anonym).toBe(33554432)
            expect(ROLE_VALUES.partner).toBe(67108864)
            expect(ROLE_VALUES.participant).toBe(134217728)
            expect(ROLE_VALUES.member).toBe(268435456)
            expect(ROLE_VALUES.owner).toBe(536870912)
        })

        v({ version: '0.5', draft: true })('should handle admin on sign bit (v0.5)', () => {
            expect(ROLE_BITS.admin).toBe(31)
            // Sign bit produces negative value
            expect(ROLE_VALUES.admin).toBeLessThan(0)
        })
    })

    describe('hasRole()', () => {
        v({ version: '0.2' })('should detect single role', () => {
            const configWithAnonym = ROLE_VALUES.anonym
            expect(hasRole(configWithAnonym, 'anonym')).toBe(true)
            expect(hasRole(configWithAnonym, 'member')).toBe(false)
            expect(hasRole(configWithAnonym, 'owner')).toBe(false)
        })

        v({ version: '0.2' })('should detect multiple roles', () => {
            const configWithMemberAndOwner = ROLE_VALUES.member | ROLE_VALUES.owner
            expect(hasRole(configWithMemberAndOwner, 'member')).toBe(true)
            expect(hasRole(configWithMemberAndOwner, 'owner')).toBe(true)
            expect(hasRole(configWithMemberAndOwner, 'anonym')).toBe(false)
            expect(hasRole(configWithMemberAndOwner, 'participant')).toBe(false)
        })

        v({ version: '0.2' })('should handle all roles set', () => {
            const allRoles = ROLE_VALUES.anonym | ROLE_VALUES.partner |
                ROLE_VALUES.participant | ROLE_VALUES.member | ROLE_VALUES.owner
            expect(hasRole(allRoles, 'anonym')).toBe(true)
            expect(hasRole(allRoles, 'partner')).toBe(true)
            expect(hasRole(allRoles, 'participant')).toBe(true)
            expect(hasRole(allRoles, 'member')).toBe(true)
            expect(hasRole(allRoles, 'owner')).toBe(true)
        })

        v({ version: '0.2' })('should handle zero (no roles)', () => {
            const noRoles = 0
            expect(hasRole(noRoles, 'anonym')).toBe(false)
            expect(hasRole(noRoles, 'member')).toBe(false)
            expect(hasRole(noRoles, 'owner')).toBe(false)
        })
    })

    describe('getRoles()', () => {
        v({ version: '0.2' })('should return empty array for zero', () => {
            expect(getRoles(0)).toEqual([])
        })

        v({ version: '0.2' })('should return single role', () => {
            expect(getRoles(ROLE_VALUES.owner)).toEqual(['owner'])
        })

        v({ version: '0.2' })('should return multiple roles in order', () => {
            const value = ROLE_VALUES.anonym | ROLE_VALUES.member
            const roles = getRoles(value)
            expect(roles).toContain('anonym')
            expect(roles).toContain('member')
            expect(roles.length).toBe(2)
        })

        v({ version: '0.2' })('should ignore non-role bits', () => {
            // Set some lower bits (not roles) plus a role
            const value = 0b111 | ROLE_VALUES.owner
            const roles = getRoles(value)
            expect(roles).toEqual(['owner'])
        })
    })

    describe('setRoles()', () => {
        v({ version: '0.2' })('should return zero for empty array', () => {
            expect(setRoles([])).toBe(0)
        })

        v({ version: '0.2' })('should set single role', () => {
            expect(setRoles(['owner'])).toBe(ROLE_VALUES.owner)
        })

        v({ version: '0.2' })('should set multiple roles', () => {
            const value = setRoles(['anonym', 'member', 'owner'])
            expect(value).toBe(ROLE_VALUES.anonym | ROLE_VALUES.member | ROLE_VALUES.owner)
        })

        v({ version: '0.2' })('should ignore invalid role names', () => {
            const value = setRoles(['owner', 'invalid', 'member'])
            expect(value).toBe(ROLE_VALUES.owner | ROLE_VALUES.member)
        })

        v({ version: '0.2' })('should be reversible with getRoles()', () => {
            const roles = ['anonym', 'partner', 'participant', 'member', 'owner']
            const value = setRoles(roles)
            const retrieved = getRoles(value)
            expect(retrieved.sort()).toEqual(roles.sort())
        })
    })

    describe('Role Hierarchy', () => {
        v({ version: '0.2' })('should understand role priority order', () => {
            // Owner > Member > Participant > Partner > Anonym
            const rolePriority = ['anonym', 'partner', 'participant', 'member', 'owner']

            for (let i = 0; i < rolePriority.length - 1; i++) {
                const lowerRole = rolePriority[i]!
                const higherRole = rolePriority[i + 1]!
                const lowerBit = ROLE_BITS[lowerRole as keyof typeof ROLE_BITS]
                const higherBit = ROLE_BITS[higherRole as keyof typeof ROLE_BITS]
                expect(higherBit).toBeGreaterThan(lowerBit)
            }
        })

        v({ version: '0.2' })('should resolve highest role from multiple', () => {
            function getHighestRole(configValue: number): string | null {
                const roles = getRoles(configValue)
                if (roles.length === 0) return null

                const priority = ['owner', 'member', 'participant', 'partner', 'anonym']
                for (const role of priority) {
                    if (roles.includes(role)) return role
                }
                return null
            }

            expect(getHighestRole(ROLE_VALUES.anonym | ROLE_VALUES.member)).toBe('member')
            expect(getHighestRole(ROLE_VALUES.owner | ROLE_VALUES.participant)).toBe('owner')
            expect(getHighestRole(ROLE_VALUES.anonym)).toBe('anonym')
            expect(getHighestRole(0)).toBe(null)
        })
    })

    describe('Role + Other Bits Integration', () => {
        v({ version: '0.2' })('should preserve role bits when other bits are set', () => {
            // Simulate a full config value with project type, entity, state, and roles
            // New bit layout: project(0-2), entity(3-7), state(8-10), caps(11-24), roles(25-29)
            const projectType = 0b010 // project type (bits 0-2)
            const entity = 0b00100 << 3 // post entity (bits 3-7) - 5 bits now
            const state = 0b101 << 8 // released state (bits 8-10)
            const roles = ROLE_VALUES.member | ROLE_VALUES.owner

            const fullConfig = projectType | entity | state | roles

            // Roles should still be detectable
            expect(hasRole(fullConfig, 'member')).toBe(true)
            expect(hasRole(fullConfig, 'owner')).toBe(true)
            expect(hasRole(fullConfig, 'anonym')).toBe(false)
        })

        v({ version: '0.2' })('should correctly extract roles from full config', () => {
            // New bit layout
            const fullConfig = 0b010 | (0b00100 << 3) | (0b101 << 8) |
                ROLE_VALUES.anonym | ROLE_VALUES.partner | ROLE_VALUES.member

            const roles = getRoles(fullConfig)
            expect(roles).toContain('anonym')
            expect(roles).toContain('partner')
            expect(roles).toContain('member')
            expect(roles).not.toContain('participant')
            expect(roles).not.toContain('owner')
        })
    })
})

// ============================================================================
// Future Tests (v0.5)
// ============================================================================

vDescribe({ version: '0.5', draft: true })('config.roles.admin', () => {
    v({ version: '0.5', draft: true })('should detect admin role on sign bit', () => {
        const configWithAdmin = ROLE_VALUES.admin
        expect(hasRole(configWithAdmin, 'admin')).toBe(true)
        // Value should be negative due to sign bit
        expect(configWithAdmin).toBeLessThan(0)
    })

    v({ version: '0.5', draft: true })('should handle admin combined with other roles', () => {
        const configWithAdminAndOwner = ROLE_VALUES.admin | ROLE_VALUES.owner
        expect(hasRole(configWithAdminAndOwner, 'admin')).toBe(true)
        expect(hasRole(configWithAdminAndOwner, 'owner')).toBe(true)
    })
})
