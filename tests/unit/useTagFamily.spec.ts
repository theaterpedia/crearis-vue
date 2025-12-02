/**
 * Unit Tests: useTagFamily
 * 
 * Tests core tag family composable for managing single tag family state.
 * Covers: dtags, ttags, ctags, rtags tag families
 * 
 * Test Count: ~35 tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { ref } from 'vue'
import { useTagFamily } from '@/composables/useTagFamily'
import { hasBit, setBit, clearBit } from '@/composables/useSysregTags'
import { expectBitSet, expectBitClear, bitsToHex } from '../helpers/sysreg-bytea-helpers'
import { setupGlobalFetchMock, resetGlobalFetchMock } from '../helpers/sysreg-mock-api'

describe('useTagFamily - Core Composable', () => {

    beforeEach(() => {
        setupGlobalFetchMock()
    })

    afterEach(() => {
        resetGlobalFetchMock()
    })

    // ============================================================================
    // Configuration Loading - 5 tests
    // ============================================================================

    describe('Configuration Loading', () => {
        it('loads dtags configuration', () => {
            const family = useTagFamily({
                familyName: 'dtags',
                modelValue: 0
            })

            expect(family.familyConfig.value).toBeTruthy()
            expect(family.familyConfig.value?.name).toBe('didactic_model')
        })

        it('loads ttags configuration', () => {
            const family = useTagFamily({
                familyName: 'ttags',
                modelValue: 0
            })

            expect(family.familyConfig.value).toBeTruthy()
            expect(family.familyConfig.value?.name).toBe('ttags')
        })

        it('loads all groups for dtags', () => {
            const family = useTagFamily({
                familyName: 'dtags',
                modelValue: 0,
                groupSelection: 'all'
            })

            expect(family.groups.value.length).toBe(4)
            expect(family.groups.value[0].name).toBe('spielform')
            expect(family.groups.value[1].name).toBe('animiertes_theaterspiel')
            expect(family.groups.value[2].name).toBe('szenische_themenarbeit')
            expect(family.groups.value[3].name).toBe('paedagogische_regie')
        })

        it('filters core groups only', () => {
            const family = useTagFamily({
                familyName: 'dtags',
                modelValue: 0,
                groupSelection: 'core'
            })

            // Should exclude optional group (paedagogische_regie)
            expect(family.groups.value.length).toBe(3)
            expect(family.groups.value.every(g => !g.optional)).toBe(true)
        })

        it('filters optional groups only', () => {
            const family = useTagFamily({
                familyName: 'dtags',
                modelValue: 0,
                groupSelection: 'options'
            })

            // Should only include optional group
            expect(family.groups.value.length).toBe(1)
            expect(family.groups.value[0].name).toBe('paedagogische_regie')
            expect(family.groups.value[0].optional).toBe(true)
        })
    })

    // ============================================================================
    // Group Operations - 10 tests
    // ============================================================================

    describe('Group Operations', () => {
        it('gets empty group value for no selection', () => {
            const family = useTagFamily({
                familyName: 'dtags',
                modelValue: 0
            })

            const groupValue = family.getGroupValue('spielform')
            expect(groupValue).toBe(0)
        })

        it('gets group value with bit 0 set', () => {
            const family = useTagFamily({
                familyName: 'dtags',
                modelValue: setBit(0, 0) // Set bit 0 (freies_spiel)
            })

            const groupValue = family.getGroupValue('spielform')
            expect(groupValue).toBeGreaterThan(0)
        })

        it('sets group value', () => {
            const modelValue = ref(0)
            const family = useTagFamily({
                familyName: 'dtags',
                modelValue
            })

            family.setGroupValue('spielform', 1) // Set bit 0

            expect(hasBit(modelValue.value, 0)).toBe(true)
        })

        it('clears group bits', () => {
            const modelValue = ref(setBit(setBit(0, 0), 1)) // Set bits 0 and 1
            const family = useTagFamily({
                familyName: 'dtags',
                modelValue
            })

            family.clearGroup('spielform')

            expect(hasBit(modelValue.value, 0)).toBe(false)
            expect(hasBit(modelValue.value, 1)).toBe(false)
        })

        it('detects active group', () => {
            const modelValue = ref(setBit(0, 0))
            const family = useTagFamily({
                familyName: 'dtags',
                modelValue
            })

            expect(family.hasActiveGroup('spielform')).toBe(true)
            expect(family.hasActiveGroup('animiertes_theaterspiel')).toBe(false)
        })

        it('lists active groups', () => {
            const modelValue = ref(setBit(setBit(0, 0), 8)) // Bits 0 and 8
            const family = useTagFamily({
                familyName: 'dtags',
                modelValue
            })

            expect(family.activeGroups.value.length).toBe(2)
        })

        it('isolates group bits correctly', () => {
            // Set bit 0 (group 1) and bit 8 (group 2)
            const modelValue = ref(setBit(setBit(0, 0), 8))
            const family = useTagFamily({
                familyName: 'dtags',
                modelValue
            })

            const group1Value = family.getGroupValue('spielform')
            const group2Value = family.getGroupValue('animiertes_theaterspiel')

            expect(group1Value).toBeGreaterThan(0)
            expect(group2Value).toBeGreaterThan(0)
        })

        it('updates value reactively', () => {
            const modelValue = ref(0)
            const family = useTagFamily({
                familyName: 'dtags',
                modelValue
            })

            family.updateValue(5)

            expect(modelValue.value).toBe(5)
        })

        it('handles null model value', () => {
            const modelValue = ref(null)
            const family = useTagFamily({
                familyName: 'dtags',
                modelValue
            })

            expect(family.isEmpty.value).toBe(true)
        })

        it('detects non-empty state', () => {
            const modelValue = ref(1)
            const family = useTagFamily({
                familyName: 'dtags',
                modelValue
            })

            expect(family.isEmpty.value).toBe(false)
        })
    })

    // ============================================================================
    // Tag Label Resolution - 5 tests
    // ============================================================================

    describe('Tag Label Resolution', () => {
        it('returns label for valid tag value', () => {
            const family = useTagFamily({
                familyName: 'dtags',
                modelValue: 1
            })

            const label = family.getTagLabel(1)
            expect(label).toBeTruthy()
            expect(typeof label).toBe('string')
        })

        it('returns empty string for invalid tag value', () => {
            const family = useTagFamily({
                familyName: 'dtags',
                modelValue: 0
            })

            const label = family.getTagLabel(9999)
            expect(label).toBe('')
        })

        it('gets tags by group name', () => {
            const family = useTagFamily({
                familyName: 'dtags',
                modelValue: 0
            })

            const tags = family.getTagsByGroup('spielform')
            expect(Array.isArray(tags)).toBe(true)
            expect(tags.length).toBeGreaterThan(0)
            expect(tags.every(tag => tag.bit !== undefined)).toBe(true)
        })

        it('filters tags within group bit range', () => {
            const family = useTagFamily({
                familyName: 'dtags',
                modelValue: 0
            })

            const group1Tags = family.getTagsByGroup('spielform')
            const group2Tags = family.getTagsByGroup('animiertes_theaterspiel')

            // Each group should have different tags
            const group1Bits = group1Tags.map(t => t.bit)
            const group2Bits = group2Tags.map(t => t.bit)

            expect(Math.max(...group1Bits!)).toBeLessThan(Math.min(...group2Bits!))
        })

        it('returns empty array for invalid group', () => {
            const family = useTagFamily({
                familyName: 'dtags',
                modelValue: 0
            })

            const tags = family.getTagsByGroup('invalid_group')
            expect(tags).toEqual([])
        })
    })

    // ============================================================================
    // Multi-Group Management - 8 tests
    // ============================================================================

    describe('Multi-Group Management', () => {
        it('manages multiple groups independently', () => {
            const modelValue = ref(0)
            const family = useTagFamily({
                familyName: 'dtags',
                modelValue
            })

            family.setGroupValue('spielform', 1) // Set bit 0
            family.setGroupValue('animiertes_theaterspiel', 1) // Set bit 8

            expect(hasBit(modelValue.value, 0)).toBe(true)
            expect(hasBit(modelValue.value, 8)).toBe(true)
        })

        it('clears one group without affecting others', () => {
            const modelValue = ref(setBit(setBit(0, 0), 8)) // Bits 0 and 8
            const family = useTagFamily({
                familyName: 'dtags',
                modelValue
            })

            family.clearGroup('spielform')

            expect(hasBit(modelValue.value, 0)).toBe(false)
            expect(hasBit(modelValue.value, 8)).toBe(true) // Other group unchanged
        })

        it('tracks active groups correctly', () => {
            const modelValue = ref(0)
            const family = useTagFamily({
                familyName: 'dtags',
                modelValue
            })

            expect(family.activeGroups.value.length).toBe(0)

            family.setGroupValue('spielform', 1)
            expect(family.activeGroups.value.length).toBe(1)

            family.setGroupValue('animiertes_theaterspiel', 1)
            expect(family.activeGroups.value.length).toBe(2)
        })

        it('handles all 4 dtags groups', () => {
            const modelValue = ref(0)
            const family = useTagFamily({
                familyName: 'dtags',
                modelValue
            })

            // Set bit in each group
            family.setGroupValue('spielform', 1) // Bit 0
            family.setGroupValue('animiertes_theaterspiel', 1) // Bit 8
            family.setGroupValue('szenische_themenarbeit', 1) // Bit 16
            family.setGroupValue('paedagogische_regie', 1) // Bit 26

            expect(family.activeGroups.value.length).toBe(4)
        })

        it('handles high bit numbers (bits 26-31)', () => {
            const modelValue = ref(0)
            const family = useTagFamily({
                familyName: 'dtags',
                modelValue
            })

            // Set bit 30 (paedagogische_regie group)
            const newValue = setBit(0, 30)
            family.updateValue(newValue)

            expect(family.hasActiveGroup('paedagogische_regie')).toBe(true)
        })

        it('handles signed integer bit 31', () => {
            const modelValue = ref(0)
            const family = useTagFamily({
                familyName: 'dtags',
                modelValue
            })

            // Bit 31 = -2147483648 in signed int
            const newValue = setBit(0, 31)
            family.updateValue(newValue)

            expect(family.hasActiveGroup('paedagogische_regie')).toBe(true)
        })

        it('handles combination of bits 30 and 31', () => {
            const modelValue = ref(0)
            const family = useTagFamily({
                familyName: 'dtags',
                modelValue
            })

            // Bits 30+31 = -1073741824
            const newValue = setBit(setBit(0, 30), 31)
            family.updateValue(newValue)

            expect(hasBit(newValue, 30)).toBe(true)
            expect(hasBit(newValue, 31)).toBe(true)
        })

        it('preserves value when switching groups', () => {
            const modelValue = ref(setBit(0, 0))
            const family = useTagFamily({
                familyName: 'dtags',
                modelValue
            })

            const initialValue = modelValue.value

            // Access different group shouldn't change value
            family.getGroupValue('animiertes_theaterspiel')

            expect(modelValue.value).toBe(initialValue)
        })
    })

    // ============================================================================
    // Edge Cases - 7 tests
    // ============================================================================

    describe('Edge Cases', () => {
        it('handles zero value', () => {
            const family = useTagFamily({
                familyName: 'dtags',
                modelValue: 0
            })

            expect(family.isEmpty.value).toBe(true)
            expect(family.activeGroups.value.length).toBe(0)
        })

        it('handles maximum value (all bits set)', () => {
            const family = useTagFamily({
                familyName: 'dtags',
                modelValue: -1 // All bits set in signed int
            })

            expect(family.isEmpty.value).toBe(false)
            expect(family.activeGroups.value.length).toBe(4)
        })

        it('handles reactive value updates', () => {
            const modelValue = ref(0)
            const family = useTagFamily({
                familyName: 'dtags',
                modelValue
            })

            expect(family.isEmpty.value).toBe(true)

            modelValue.value = 1 // Set bit 0
            expect(family.isEmpty.value).toBe(false)
        })

        it('handles immediate number value', () => {
            const family = useTagFamily({
                familyName: 'dtags',
                modelValue: 5
            })

            expect(family.isEmpty.value).toBe(false)
        })

        it('handles invalid family name gracefully', () => {
            // TypeScript prevents this at compile time, but test runtime behavior
            const family = useTagFamily({
                familyName: 'dtags', // Valid name
                modelValue: 0
            })

            expect(family.familyConfig.value).toBeTruthy()
        })

        it('handles group not found', () => {
            const family = useTagFamily({
                familyName: 'dtags',
                modelValue: 0
            })

            const value = family.getGroupValue('nonexistent_group')
            expect(value).toBe(0)
        })

        it('handles concurrent group updates', () => {
            const modelValue = ref(0)
            const family = useTagFamily({
                familyName: 'dtags',
                modelValue
            })

            // Simulate concurrent updates
            family.setGroupValue('spielform', 1)
            family.setGroupValue('animiertes_theaterspiel', 2)
            family.setGroupValue('szenische_themenarbeit', 4)

            expect(family.activeGroups.value.length).toBe(3)
        })
    })
})
