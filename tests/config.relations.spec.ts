/**
 * config.relations.spec.ts - Tests for relation bit detection and resolution
 * 
 * Version: v0.3
 * Sprint: Projectlogin Workflow (Dec 1-9, 2025)
 * Updated: Dec 5, 2025 (Sunrise Talk - renamed roles → relations, owner → creator)
 * 
 * Tests the relation portion of the sysreg_config capabilities matrix:
 * - Bit 25: anonym
 * - Bit 26: partner
 * - Bit 27: participant
 * - Bit 28: member
 * - Bit 29: creator (record creator) - renamed from "owner"
 * - Bit 30: reserved
 * - Bit 31 (sign): admin (v0.5 - deferred)
 * 
 * Note: "creator" refers to record creator, NOT project-owner.
 * Project-owners receive elevated capabilities via separate config entries
 * marked with "P_owner" in the name.
 * 
 * Terminology update (Dec 5 Sunrise Talk):
 * - "roles" → "relations" (fits drama-in-education philosophy)
 * - "owner" → "creator" (avoids confusion with project-owner)
 */

import { describe, it, expect } from 'vitest'
import { v, vDescribe } from './helpers/versioned-test'

// Relation bit positions (renamed from roles)
const RELATION_BITS = {
    anonym: 25,
    partner: 26,
    participant: 27,
    member: 28,
    creator: 29,    // Record creator (renamed from "owner")
    admin: 31       // sign bit - v0.5
} as const

// Relation bit values (1 << bit position)
const RELATION_VALUES = {
    anonym: 1 << 25,      // 33554432
    partner: 1 << 26,     // 67108864
    participant: 1 << 27, // 134217728
    member: 1 << 28,      // 268435456
    creator: 1 << 29,     // 536870912 (renamed from "owner")
    admin: 1 << 31        // -2147483648 (negative due to sign bit)
} as const

// Legacy aliases for backward compatibility
const ROLE_BITS = RELATION_BITS
const ROLE_VALUES = RELATION_VALUES

// Helper functions for relation detection
function hasRelation(configValue: number, relation: keyof typeof RELATION_BITS): boolean {
    const bit = RELATION_BITS[relation]
    return (configValue & (1 << bit)) !== 0
}

function getRelations(configValue: number): string[] {
    const relations: string[] = []
    for (const [relation, bit] of Object.entries(RELATION_BITS)) {
        if (relation === 'admin') continue // Skip admin for now (v0.5)
        if ((configValue & (1 << bit)) !== 0) {
            relations.push(relation)
        }
    }
    return relations
}

function setRelations(relations: string[]): number {
    let value = 0
    for (const relation of relations) {
        const bit = RELATION_BITS[relation as keyof typeof RELATION_BITS]
        if (bit !== undefined && relation !== 'admin') {
            value |= (1 << bit)
        }
    }
    return value
}

// Legacy aliases
const hasRole = hasRelation
const getRoles = getRelations
const setRoles = setRelations

// ============================================================================
// Test Suite
// ============================================================================

vDescribe({ version: '0.3' })('config.relations', () => {

    describe('Relation Bit Constants', () => {
        v({ version: '0.3' })('should have correct bit positions', () => {
            expect(RELATION_BITS.anonym).toBe(25)
            expect(RELATION_BITS.partner).toBe(26)
            expect(RELATION_BITS.participant).toBe(27)
            expect(RELATION_BITS.member).toBe(28)
            expect(RELATION_BITS.creator).toBe(29)
        })

        v({ version: '0.3' })('should have correct bit values', () => {
            expect(RELATION_VALUES.anonym).toBe(33554432)
            expect(RELATION_VALUES.partner).toBe(67108864)
            expect(RELATION_VALUES.participant).toBe(134217728)
            expect(RELATION_VALUES.member).toBe(268435456)
            expect(RELATION_VALUES.creator).toBe(536870912)
        })

        v({ version: '0.5', draft: true })('should handle admin on sign bit (v0.5)', () => {
            expect(RELATION_BITS.admin).toBe(31)
            expect(RELATION_VALUES.admin).toBeLessThan(0)
        })
    })

    describe('hasRelation()', () => {
        v({ version: '0.3' })('should detect single relation', () => {
            const configWithAnonym = RELATION_VALUES.anonym
            expect(hasRelation(configWithAnonym, 'anonym')).toBe(true)
            expect(hasRelation(configWithAnonym, 'member')).toBe(false)
            expect(hasRelation(configWithAnonym, 'creator')).toBe(false)
        })

        v({ version: '0.3' })('should detect multiple relations', () => {
            const configWithMemberAndCreator = RELATION_VALUES.member | RELATION_VALUES.creator
            expect(hasRelation(configWithMemberAndCreator, 'member')).toBe(true)
            expect(hasRelation(configWithMemberAndCreator, 'creator')).toBe(true)
            expect(hasRelation(configWithMemberAndCreator, 'anonym')).toBe(false)
            expect(hasRelation(configWithMemberAndCreator, 'participant')).toBe(false)
        })

        v({ version: '0.3' })('should handle all relations set', () => {
            const allRelations = RELATION_VALUES.anonym | RELATION_VALUES.partner |
                RELATION_VALUES.participant | RELATION_VALUES.member | RELATION_VALUES.creator
            expect(hasRelation(allRelations, 'anonym')).toBe(true)
            expect(hasRelation(allRelations, 'partner')).toBe(true)
            expect(hasRelation(allRelations, 'participant')).toBe(true)
            expect(hasRelation(allRelations, 'member')).toBe(true)
            expect(hasRelation(allRelations, 'creator')).toBe(true)
        })

        v({ version: '0.3' })('should handle zero (no relations)', () => {
            const noRelations = 0
            expect(hasRelation(noRelations, 'anonym')).toBe(false)
            expect(hasRelation(noRelations, 'member')).toBe(false)
            expect(hasRelation(noRelations, 'creator')).toBe(false)
        })
    })

    describe('getRelations()', () => {
        v({ version: '0.3' })('should return empty array for zero', () => {
            expect(getRelations(0)).toEqual([])
        })

        v({ version: '0.3' })('should return single relation', () => {
            expect(getRelations(RELATION_VALUES.creator)).toEqual(['creator'])
        })

        v({ version: '0.3' })('should return multiple relations', () => {
            const value = RELATION_VALUES.anonym | RELATION_VALUES.member
            const relations = getRelations(value)
            expect(relations).toContain('anonym')
            expect(relations).toContain('member')
            expect(relations.length).toBe(2)
        })

        v({ version: '0.3' })('should ignore non-relation bits', () => {
            const value = 0b111 | RELATION_VALUES.creator
            const relations = getRelations(value)
            expect(relations).toEqual(['creator'])
        })
    })

    describe('setRelations()', () => {
        v({ version: '0.3' })('should return zero for empty array', () => {
            expect(setRelations([])).toBe(0)
        })

        v({ version: '0.3' })('should set single relation', () => {
            expect(setRelations(['creator'])).toBe(RELATION_VALUES.creator)
        })

        v({ version: '0.3' })('should set multiple relations', () => {
            const value = setRelations(['anonym', 'member', 'creator'])
            expect(value).toBe(RELATION_VALUES.anonym | RELATION_VALUES.member | RELATION_VALUES.creator)
        })

        v({ version: '0.3' })('should ignore invalid relation names', () => {
            const value = setRelations(['creator', 'invalid', 'member'])
            expect(value).toBe(RELATION_VALUES.creator | RELATION_VALUES.member)
        })

        v({ version: '0.3' })('should be reversible with getRelations()', () => {
            const relations = ['anonym', 'partner', 'participant', 'member', 'creator']
            const value = setRelations(relations)
            const retrieved = getRelations(value)
            expect(retrieved.sort()).toEqual(relations.sort())
        })
    })

    describe('Relation Hierarchy', () => {
        v({ version: '0.3' })('should understand relation priority order', () => {
            // Creator > Member > Participant > Partner > Anonym
            const relationPriority = ['anonym', 'partner', 'participant', 'member', 'creator']

            for (let i = 0; i < relationPriority.length - 1; i++) {
                const lowerRelation = relationPriority[i]!
                const higherRelation = relationPriority[i + 1]!
                const lowerBit = RELATION_BITS[lowerRelation as keyof typeof RELATION_BITS]
                const higherBit = RELATION_BITS[higherRelation as keyof typeof RELATION_BITS]
                expect(higherBit).toBeGreaterThan(lowerBit)
            }
        })

        v({ version: '0.3' })('should resolve highest relation from multiple', () => {
            function getHighestRelation(configValue: number): string | null {
                const relations = getRelations(configValue)
                if (relations.length === 0) return null

                const priority = ['creator', 'member', 'participant', 'partner', 'anonym']
                for (const relation of priority) {
                    if (relations.includes(relation)) return relation
                }
                return null
            }

            expect(getHighestRelation(RELATION_VALUES.anonym | RELATION_VALUES.member)).toBe('member')
            expect(getHighestRelation(RELATION_VALUES.creator | RELATION_VALUES.participant)).toBe('creator')
            expect(getHighestRelation(RELATION_VALUES.anonym)).toBe('anonym')
            expect(getHighestRelation(0)).toBe(null)
        })
    })

    describe('Relation + Other Bits Integration', () => {
        v({ version: '0.3' })('should preserve relation bits when other bits are set', () => {
            // New bit layout: project(0-2), entity(3-7), state(8-10), caps(11-24), relations(25-29)
            const projectType = 0b010
            const entity = 0b00100 << 3 // post
            const state = 0b101 << 8 // released
            const relations = RELATION_VALUES.member | RELATION_VALUES.creator

            const fullConfig = projectType | entity | state | relations

            expect(hasRelation(fullConfig, 'member')).toBe(true)
            expect(hasRelation(fullConfig, 'creator')).toBe(true)
            expect(hasRelation(fullConfig, 'anonym')).toBe(false)
        })

        v({ version: '0.3' })('should correctly extract relations from full config', () => {
            const fullConfig = 0b010 | (0b00100 << 3) | (0b101 << 8) |
                RELATION_VALUES.anonym | RELATION_VALUES.partner | RELATION_VALUES.member

            const relations = getRelations(fullConfig)
            expect(relations).toContain('anonym')
            expect(relations).toContain('partner')
            expect(relations).toContain('member')
            expect(relations).not.toContain('participant')
            expect(relations).not.toContain('creator')
        })
    })

    describe('Legacy Alias Compatibility', () => {
        v({ version: '0.3' })('should support legacy role functions', () => {
            // hasRole should work the same as hasRelation
            expect(hasRole(RELATION_VALUES.creator, 'creator')).toBe(true)
            expect(getRoles(RELATION_VALUES.member)).toEqual(['member'])
            expect(setRoles(['creator'])).toBe(RELATION_VALUES.creator)
        })
    })
})

// ============================================================================
// Future Tests (v0.5)
// ============================================================================

vDescribe({ version: '0.5', draft: true })('config.relations.admin', () => {
    v({ version: '0.5', draft: true })('should detect admin relation on sign bit', () => {
        const configWithAdmin = RELATION_VALUES.admin
        expect(hasRelation(configWithAdmin, 'admin')).toBe(true)
        expect(configWithAdmin).toBeLessThan(0)
    })

    v({ version: '0.5', draft: true })('should handle admin combined with other relations', () => {
        const configWithAdminAndCreator = RELATION_VALUES.admin | RELATION_VALUES.creator
        expect(hasRelation(configWithAdminAndCreator, 'admin')).toBe(true)
        expect(hasRelation(configWithAdminAndCreator, 'creator')).toBe(true)
    })
})
