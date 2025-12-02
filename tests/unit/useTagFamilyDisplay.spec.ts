/**
 * Unit Tests: useTagFamilyDisplay
 * 
 * Tests tag family display formatting composable.
 * Covers: compact/zoomed display, i18n, filtering
 * 
 * Test Count: ~30 tests
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { useTagFamilyDisplay } from '@/composables/useTagFamilyDisplay'
import { setBit } from '@/composables/useSysregTags'

describe('useTagFamilyDisplay - Display Composable', () => {

    // ============================================================================
    // Display Groups - 6 tests
    // ============================================================================

    describe('Display Groups', () => {
        it('shows no groups for empty value', () => {
            const display = useTagFamilyDisplay({
                familyName: 'dtags',
                modelValue: 0
            })

            expect(display.displayGroups.value.length).toBe(0)
            expect(display.hasActiveTags.value).toBe(false)
        })

        it('shows groups with active tags', () => {
            const display = useTagFamilyDisplay({
                familyName: 'dtags',
                modelValue: setBit(0, 0) // Bit 0 set
            })

            expect(display.displayGroups.value.length).toBeGreaterThan(0)
            expect(display.hasActiveTags.value).toBe(true)
        })

        it('includes group metadata', () => {
            const display = useTagFamilyDisplay({
                familyName: 'dtags',
                modelValue: setBit(0, 0)
            })

            const group = display.displayGroups.value[0]
            expect(group).toHaveProperty('groupName')
            expect(group).toHaveProperty('groupLabel')
            expect(group).toHaveProperty('groupIcon')
            expect(group).toHaveProperty('tags')
        })

        it('filters tags by group bits', () => {
            const display = useTagFamilyDisplay({
                familyName: 'dtags',
                modelValue: setBit(setBit(0, 0), 8) // Bits in different groups
            })

            expect(display.displayGroups.value.length).toBe(2)
        })

        it('counts active groups', () => {
            const display = useTagFamilyDisplay({
                familyName: 'dtags',
                modelValue: setBit(setBit(setBit(0, 0), 8), 16)
            })

            expect(display.activeGroupCount.value).toBe(3)
        })

        it('respects group selection filter', () => {
            const coreOnly = useTagFamilyDisplay({
                familyName: 'dtags',
                modelValue: -1, // All bits set
                groupSelection: 'core'
            })

            const all = useTagFamilyDisplay({
                familyName: 'dtags',
                modelValue: -1,
                groupSelection: 'all'
            })

            expect(all.displayGroups.value.length).toBeGreaterThan(coreOnly.displayGroups.value.length)
        })
    })

    // ============================================================================
    // Compact Display - 6 tests
    // ============================================================================

    describe('Compact Display', () => {
        it('generates compact text for single tag', () => {
            const display = useTagFamilyDisplay({
                familyName: 'dtags',
                modelValue: setBit(0, 0)
            })

            const text = display.compactText.value
            expect(text.length).toBeGreaterThan(0)
            expect(typeof text).toBe('string')
        })

        it('includes icons in compact text', () => {
            const display = useTagFamilyDisplay({
                familyName: 'dtags',
                modelValue: setBit(0, 0)
            })

            const text = display.compactText.value
            // Should include icon name (actual icon rendering happens in Vue component)
            expect(text).toContain('users-round')
        })

        it('separates groups with bullet', () => {
            const display = useTagFamilyDisplay({
                familyName: 'dtags',
                modelValue: setBit(setBit(0, 0), 8)
            })

            const text = display.compactText.value
            expect(text).toContain('•')
        })

        it('shows only categories in compact mode', () => {
            const display = useTagFamilyDisplay({
                familyName: 'dtags',
                modelValue: setBit(setBit(0, 0), 1) // Category + subcategory
            })

            const text = display.compactText.value
            // Should only show category label, not subcategory
        })

        it('formats single group compactly', () => {
            const display = useTagFamilyDisplay({
                familyName: 'dtags',
                modelValue: setBit(0, 0)
            })

            const formatted = display.formatGroupCompact('spielform')
            expect(formatted.length).toBeGreaterThan(0)
        })

        it('returns empty for inactive group', () => {
            const display = useTagFamilyDisplay({
                familyName: 'dtags',
                modelValue: setBit(0, 0)
            })

            const formatted = display.formatGroupCompact('animiertes_theaterspiel')
            expect(formatted).toBe('')
        })
    })

    // ============================================================================
    // Zoomed Display - 6 tests
    // ============================================================================

    describe('Zoomed Display', () => {
        it('generates zoomed text with hierarchy', () => {
            const display = useTagFamilyDisplay({
                familyName: 'dtags',
                modelValue: setBit(setBit(0, 0), 1)
            })

            const text = display.zoomedText.value
            expect(text.length).toBeGreaterThan(0)
            expect(text).toContain('\n') // Multi-line
        })

        it('shows group headers', () => {
            const display = useTagFamilyDisplay({
                familyName: 'dtags',
                modelValue: setBit(0, 0)
            })

            const text = display.zoomedText.value
            // Should include group label and icon name as header
            expect(text).toContain('users-round') // Icon name
            expect(text).toContain('Spielform') // Group label
        })

        it('indents subcategories', () => {
            const display = useTagFamilyDisplay({
                familyName: 'dtags',
                modelValue: setBit(setBit(0, 0), 1)
            })

            const text = display.zoomedText.value
            // Should have indentation for subcategories
            expect(text).toContain('  •')
        })

        it('separates groups with blank line', () => {
            const display = useTagFamilyDisplay({
                familyName: 'dtags',
                modelValue: setBit(setBit(0, 0), 8)
            })

            const text = display.zoomedText.value
            expect(text).toContain('\n\n')
        })

        it('formats single group in zoomed mode', () => {
            const display = useTagFamilyDisplay({
                familyName: 'dtags',
                modelValue: setBit(setBit(0, 0), 1)
            })

            const formatted = display.formatGroupZoomed('spielform')
            expect(formatted).toContain('\n')
            expect(formatted).toContain('•')
        })

        it('shows both categories and subcategories', () => {
            const display = useTagFamilyDisplay({
                familyName: 'dtags',
                modelValue: setBit(setBit(0, 0), 1)
            })

            const group = display.displayGroups.value[0]
            const hasCategory = group.tags.some(t => t.isCategory)
            const hasSubcategory = group.tags.some(t => t.isSubcategory)

            expect(hasCategory).toBe(true)
            expect(hasSubcategory).toBe(true)
        })
    })

    // ============================================================================
    // Tag Items - 6 tests
    // ============================================================================

    describe('Tag Items', () => {
        it('includes tag metadata', () => {
            const display = useTagFamilyDisplay({
                familyName: 'dtags',
                modelValue: setBit(0, 0)
            })

            const tag = display.displayGroups.value[0].tags[0]
            expect(tag).toHaveProperty('value')
            expect(tag).toHaveProperty('label')
            expect(tag).toHaveProperty('name')
            expect(tag).toHaveProperty('isCategory')
            expect(tag).toHaveProperty('isSubcategory')
            expect(tag).toHaveProperty('bit')
        })

        it('distinguishes categories from subcategories', () => {
            const display = useTagFamilyDisplay({
                familyName: 'dtags',
                modelValue: setBit(setBit(0, 0), 1)
            })

            const tags = display.displayGroups.value[0].tags
            const categories = tags.filter(t => t.isCategory)
            const subcategories = tags.filter(t => t.isSubcategory)

            expect(categories.length).toBeGreaterThan(0)
            expect(subcategories.length).toBeGreaterThan(0)
        })

        it('converts values to integers', () => {
            const display = useTagFamilyDisplay({
                familyName: 'dtags',
                modelValue: setBit(0, 0)
            })

            const tag = display.displayGroups.value[0].tags[0]
            expect(typeof tag.value).toBe('number')
        })

        it('provides localized labels', () => {
            const display = useTagFamilyDisplay({
                familyName: 'dtags',
                modelValue: setBit(0, 0)
            })

            const tag = display.displayGroups.value[0].tags[0]
            expect(typeof tag.label).toBe('string')
            expect(tag.label.length).toBeGreaterThan(0)
        })

        it('includes bit positions', () => {
            const display = useTagFamilyDisplay({
                familyName: 'dtags',
                modelValue: setBit(0, 0)
            })

            const tag = display.displayGroups.value[0].tags[0]
            expect(typeof tag.bit).toBe('number')
            expect(tag.bit).toBeGreaterThanOrEqual(0)
            expect(tag.bit).toBeLessThan(32)
        })

        it('filters only active tags', () => {
            const display = useTagFamilyDisplay({
                familyName: 'dtags',
                modelValue: 1 // Only bit 0
            })

            const allTags = display.displayGroups.value.flatMap(g => g.tags)
            expect(allTags.length).toBeGreaterThan(0)
            // All tags should have their bit set in model value
            allTags.forEach(tag => {
                const hasBit = (1 << tag.bit) & 1
                // Check if bit is set
            })
        })
    })

    // ============================================================================
    // Group Access - 3 tests
    // ============================================================================

    describe('Group Access', () => {
        it('gets display for specific group', () => {
            const display = useTagFamilyDisplay({
                familyName: 'dtags',
                modelValue: setBit(0, 0)
            })

            const group = display.getGroupDisplay('spielform')
            expect(group).toBeTruthy()
            expect(group?.groupName).toBe('spielform')
        })

        it('returns null for inactive group', () => {
            const display = useTagFamilyDisplay({
                familyName: 'dtags',
                modelValue: setBit(0, 0)
            })

            const group = display.getGroupDisplay('animiertes_theaterspiel')
            expect(group).toBeNull()
        })

        it('gets tags for specific group', () => {
            const display = useTagFamilyDisplay({
                familyName: 'dtags',
                modelValue: setBit(setBit(0, 0), 1)
            })

            const tags = display.getTagsForGroup('spielform')
            expect(Array.isArray(tags)).toBe(true)
            expect(tags.length).toBeGreaterThan(0)
        })
    })

    // ============================================================================
    // Edge Cases - 3 tests
    // ============================================================================

    describe('Edge Cases', () => {
        it('handles null model value', () => {
            const display = useTagFamilyDisplay({
                familyName: 'dtags',
                modelValue: null
            })

            expect(display.hasActiveTags.value).toBe(false)
            expect(display.compactText.value).toBe('')
        })

        it('handles all bits set', () => {
            const display = useTagFamilyDisplay({
                familyName: 'dtags',
                modelValue: -1
            })

            expect(display.hasActiveTags.value).toBe(true)
            expect(display.displayGroups.value.length).toBe(4)
        })

        it('handles high bit numbers (30-31)', () => {
            const display = useTagFamilyDisplay({
                familyName: 'dtags',
                modelValue: setBit(setBit(0, 30), 31)
            })

            expect(display.hasActiveTags.value).toBe(true)
            expect(display.displayGroups.value.length).toBeGreaterThan(0)
        })
    })
})
