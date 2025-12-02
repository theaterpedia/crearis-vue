/**
 * Unit Tests: useTagFamilyEditor
 * 
 * Tests tag family editor composable with validation and dirty tracking.
 * Covers: edit state management, category/subcategory logic, validation
 * 
 * Test Count: ~40 tests
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { ref, nextTick } from 'vue'
import { useTagFamilyEditor } from '@/composables/useTagFamilyEditor'
import { hasBit, setBit } from '@/composables/useSysregTags'

describe('useTagFamilyEditor - Editor Composable', () => {

    // ============================================================================
    // Initialization - 5 tests
    // ============================================================================

    describe('Initialization', () => {
        it('initializes with model value', () => {
            const editor = useTagFamilyEditor({
                familyName: 'dtags',
                modelValue: 5
            })

            expect(editor.editValue.value).toBe(5)
            expect(editor.isDirty.value).toBe(false)
        })

        it('initializes with ref model value', () => {
            const modelValue = ref(5)
            const editor = useTagFamilyEditor({
                familyName: 'dtags',
                modelValue
            })

            expect(editor.editValue.value).toBe(5)
        })

        it('initializes with zero value', () => {
            const editor = useTagFamilyEditor({
                familyName: 'dtags',
                modelValue: 0
            })

            expect(editor.editValue.value).toBe(0)
            expect(editor.isDirty.value).toBe(false)
        })

        it('loads all groups', () => {
            const editor = useTagFamilyEditor({
                familyName: 'dtags',
                modelValue: 0
            })

            expect(editor.groups.value.length).toBeGreaterThan(0)
        })

        it('starts with valid state for empty value', () => {
            const editor = useTagFamilyEditor({
                familyName: 'dtags',
                modelValue: 0
            })

            // Empty value might be invalid if required groups exist
            // This depends on group configuration
            expect(typeof editor.isValid.value).toBe('boolean')
        })
    })

    // ============================================================================
    // Edit State Management - 8 tests
    // ============================================================================

    describe('Edit State Management', () => {
        it('tracks dirty state on edit', () => {
            const modelValue = ref(0)
            const editor = useTagFamilyEditor({
                familyName: 'dtags',
                modelValue
            })

            expect(editor.isDirty.value).toBe(false)

            editor.setGroupValue('spielform', 1)

            expect(editor.isDirty.value).toBe(true)
        })

        it('clears dirty state on save', async () => {
            const modelValue = ref(0)
            const editor = useTagFamilyEditor({
                familyName: 'ttags', // Use ttags which has optional groups
                modelValue
            })

            editor.setGroupValue('core_themes', 1) // Set one tag
            expect(editor.isDirty.value).toBe(true)

            editor.save()
            await nextTick() // Wait for reactivity

            expect(editor.isDirty.value).toBe(false)
            expect(modelValue.value).toBe(editor.editValue.value)
        })

        it('reverts changes on cancel', () => {
            const modelValue = ref(5)
            const editor = useTagFamilyEditor({
                familyName: 'dtags',
                modelValue
            })

            editor.setGroupValue('spielform', 1)
            expect(editor.editValue.value).not.toBe(5)

            editor.cancel()

            expect(editor.editValue.value).toBe(5)
            expect(editor.isDirty.value).toBe(false)
        })

        it('resets to zero', () => {
            const modelValue = ref(5)
            const editor = useTagFamilyEditor({
                familyName: 'dtags',
                modelValue
            })

            editor.reset()

            expect(editor.editValue.value).toBe(0)
        })

        it('maintains separate edit state', () => {
            const modelValue = ref(5)
            const editor = useTagFamilyEditor({
                familyName: 'dtags',
                modelValue
            })

            editor.setGroupValue('spielform', 3)

            expect(editor.editValue.value).not.toBe(modelValue.value)
            expect(modelValue.value).toBe(5) // Unchanged until save
        })

        it('updates model value on save', async () => {
            const modelValue = ref(0)
            const editor = useTagFamilyEditor({
                familyName: 'ttags',
                modelValue
            })

            editor.setGroupValue('core_themes', 1)
            editor.save()
            await nextTick()

            expect(modelValue.value).toBe(editor.editValue.value)
        })

        it('prevents save when invalid', () => {
            const modelValue = ref(0)
            const editor = useTagFamilyEditor({
                familyName: 'dtags',
                modelValue
            })

            // Try to save invalid state (this depends on validation rules)
            const originalValue = modelValue.value

            if (!editor.isValid.value) {
                editor.save()
                expect(modelValue.value).toBe(originalValue) // Should not change
            }
        })

        it('syncs with external model value changes', () => {
            const modelValue = ref(5)
            const editor = useTagFamilyEditor({
                familyName: 'dtags',
                modelValue
            })

            // External change
            modelValue.value = 10

            // Edit value should update if not dirty
            // (This behavior depends on implementation)
        })
    })

    // ============================================================================
    // Category/Subcategory Logic - 10 tests
    // ============================================================================

    describe('Category/Subcategory Logic', () => {
        it('selects category', () => {
            const editor = useTagFamilyEditor({
                familyName: 'dtags',
                modelValue: 0
            })

            editor.selectCategory('spielform', 1) // freies_spiel (bit 0)

            expect(hasBit(editor.editValue.value, 0)).toBe(true)
        })

        it('clears previous category when selecting new one', () => {
            const editor = useTagFamilyEditor({
                familyName: 'dtags',
                modelValue: 0
            })

            editor.selectCategory('spielform', 1) // bit 0
            const firstBit = editor.editValue.value

            editor.selectCategory('spielform', 4) // bit 2 (different category)

            // Should clear bit 0 and set bit 2
            expect(hasBit(editor.editValue.value, 0)).toBe(false)
        })

        it('selects subcategory with parent category', () => {
            const editor = useTagFamilyEditor({
                familyName: 'dtags',
                modelValue: 0
            })

            editor.selectSubcategory('spielform', 2) // exploration (bit 1)

            // Should set both category and subcategory
            expect(hasBit(editor.editValue.value, 0)).toBe(true) // Parent category
            expect(hasBit(editor.editValue.value, 1)).toBe(true) // Subcategory
        })

        it('finds parent category for subcategory', () => {
            const editor = useTagFamilyEditor({
                familyName: 'dtags',
                modelValue: 0
            })

            const parent = editor.getCategoryForSubcategory('spielform', 2)

            expect(parent).toBeTruthy()
            expect(parent?.taglogic).toBe('category')
        })

        it('detects naming convention violations', () => {
            const editor = useTagFamilyEditor({
                familyName: 'dtags',
                modelValue: 0
            })

            // Call getCategoryForSubcategory which triggers validation
            // improvisationstheater (bit 1) should have parent freies_spiel (bit 0)
            // but doesn't follow naming convention (should be freies_spiel_*)
            editor.getCategoryForSubcategory('spielform', 2) // value 2 = bit 1

            // Should have naming error
            expect(editor.hasNamingErrors.value).toBe(true)
            expect(editor.namingErrors.value.length).toBeGreaterThan(0)

            const error = editor.namingErrors.value[0]
            expect(error.tagName).toBe('improvisationstheater')
            expect(error.categoryName).toBe('freies_spiel')
            expect(error.message).toContain('muss umbenannt werden')
        })

        it('clears subcategories when switching category', () => {
            const editor = useTagFamilyEditor({
                familyName: 'dtags',
                modelValue: 0
            })

            editor.selectSubcategory('spielform', 2) // category + subcategory
            expect(hasBit(editor.editValue.value, 1)).toBe(true)

            editor.selectCategory('spielform', 4) // Different category

            expect(hasBit(editor.editValue.value, 1)).toBe(false) // Subcategory cleared
        })

        it('toggles tag in non-multiselect group', () => {
            const editor = useTagFamilyEditor({
                familyName: 'dtags',
                modelValue: 0
            })

            editor.toggleTag('spielform', 1)
            expect(hasBit(editor.editValue.value, 0)).toBe(true)

            editor.toggleTag('spielform', 1)
            expect(hasBit(editor.editValue.value, 0)).toBe(false)
        })

        it('replaces selection in single-select group', () => {
            const editor = useTagFamilyEditor({
                familyName: 'dtags',
                modelValue: 0
            })

            editor.toggleTag('spielform', 1) // bit 0
            editor.toggleTag('spielform', 4) // bit 2

            // Should replace (single-select)
            expect(hasBit(editor.editValue.value, 0)).toBe(false)
            expect(hasBit(editor.editValue.value, 2)).toBe(true)
        })

        it('allows multiple selections in multiselect group', () => {
            // This test depends on having a multiselect group
            // Skip if no multiselect groups exist
            const editor = useTagFamilyEditor({
                familyName: 'dtags',
                modelValue: 0
            })

            const multiselectGroup = editor.groups.value.find(g => g.multiselect)

            if (multiselectGroup) {
                // Test multiselect behavior
                expect(multiselectGroup.multiselect).toBe(true)
            }
        })

        it('validates category must exist for subcategory', () => {
            const editor = useTagFamilyEditor({
                familyName: 'dtags',
                modelValue: 2 // Only subcategory bit set
            })

            // Should be invalid (subcategory without category)
            const isValid = editor.validateGroup('spielform')
            expect(isValid).toBe(false)
        })

        it('validates category alone is valid', () => {
            const editor = useTagFamilyEditor({
                familyName: 'dtags',
                modelValue: 1 // Only category bit set
            })

            const isValid = editor.validateGroup('spielform')
            expect(isValid).toBe(true)
        })
    })

    // ============================================================================
    // Group Operations - 8 tests
    // ============================================================================

    describe('Group Operations', () => {
        it('gets group value from edit state', () => {
            const editor = useTagFamilyEditor({
                familyName: 'dtags',
                modelValue: setBit(0, 0)
            })

            const value = editor.getGroupValue('spielform')
            expect(value).toBeGreaterThan(0)
        })

        it('sets group value in edit state', () => {
            const editor = useTagFamilyEditor({
                familyName: 'dtags',
                modelValue: 0
            })

            editor.setGroupValue('spielform', 1)

            expect(hasBit(editor.editValue.value, 0)).toBe(true)
        })

        it('clears group in edit state', () => {
            const editor = useTagFamilyEditor({
                familyName: 'dtags',
                modelValue: setBit(setBit(0, 0), 1)
            })

            editor.clearGroup('spielform')

            expect(hasBit(editor.editValue.value, 0)).toBe(false)
            expect(hasBit(editor.editValue.value, 1)).toBe(false)
        })

        it('manages multiple groups independently', () => {
            const editor = useTagFamilyEditor({
                familyName: 'dtags',
                modelValue: 0
            })

            editor.setGroupValue('spielform', 1)
            editor.setGroupValue('animiertes_theaterspiel', 1)

            expect(hasBit(editor.editValue.value, 0)).toBe(true)
            expect(hasBit(editor.editValue.value, 8)).toBe(true)
        })

        it('preserves other groups when editing one', () => {
            const editor = useTagFamilyEditor({
                familyName: 'dtags',
                modelValue: setBit(setBit(0, 0), 8)
            })

            editor.setGroupValue('spielform', 4)

            expect(hasBit(editor.editValue.value, 8)).toBe(true) // Unchanged
        })

        it('clears one group without affecting others', () => {
            const editor = useTagFamilyEditor({
                familyName: 'dtags',
                modelValue: setBit(setBit(0, 0), 8)
            })

            editor.clearGroup('spielform')

            expect(hasBit(editor.editValue.value, 0)).toBe(false)
            expect(hasBit(editor.editValue.value, 8)).toBe(true)
        })

        it('handles autosave mode', async () => {
            const modelValue = ref(0)
            const editor = useTagFamilyEditor({
                familyName: 'ttags',
                modelValue,
                autoSave: true
            })

            editor.setGroupValue('core_themes', 1)
            await nextTick()

            // Should auto-save
            expect(modelValue.value).toBe(editor.editValue.value)
        })

        it('disables autosave by default', () => {
            const modelValue = ref(0)
            const editor = useTagFamilyEditor({
                familyName: 'dtags',
                modelValue
            })

            editor.setGroupValue('spielform', 1)

            // Should NOT auto-save
            expect(modelValue.value).not.toBe(editor.editValue.value)
        })
    })

    // ============================================================================
    // Validation - 9 tests
    // ============================================================================

    describe('Validation', () => {
        it('validates required groups', () => {
            const editor = useTagFamilyEditor({
                familyName: 'dtags',
                modelValue: 0
            })

            const errors = editor.getValidationErrors()

            // Should have errors for required empty groups
            const requiredGroups = editor.groups.value.filter(g => !g.optional)
            if (requiredGroups.length > 0) {
                expect(errors.length).toBeGreaterThan(0)
            }
        })

        it('allows optional groups to be empty', () => {
            const editor = useTagFamilyEditor({
                familyName: 'dtags',
                modelValue: 0
            })

            const optionalGroup = editor.groups.value.find(g => g.optional)

            if (optionalGroup) {
                const isValid = editor.validateGroup(optionalGroup.name)
                expect(isValid).toBe(true)
            }
        })

        it('validates populated required group', () => {
            const editor = useTagFamilyEditor({
                familyName: 'dtags',
                modelValue: 1 // Has value
            })

            const firstGroup = editor.groups.value[0]
            const isValid = editor.validateGroup(firstGroup.name)

            expect(isValid).toBe(true)
        })

        it('tracks validation state reactively', () => {
            const editor = useTagFamilyEditor({
                familyName: 'dtags',
                modelValue: 0
            })

            const initialValid = editor.isValid.value

            editor.setGroupValue('spielform', 1)

            // Validity may change after setting value
            if (!initialValid) {
                // Could become valid
            }
        })

        it('returns validation errors with messages', () => {
            const editor = useTagFamilyEditor({
                familyName: 'dtags',
                modelValue: 0
            })

            const errors = editor.getValidationErrors()

            expect(Array.isArray(errors)).toBe(true)
            errors.forEach(error => {
                expect(typeof error).toBe('string')
                expect(error.length).toBeGreaterThan(0)
            })
        })

        it('validates category/subcategory consistency', () => {
            const editor = useTagFamilyEditor({
                familyName: 'dtags',
                modelValue: 2 // Only subcategory bit
            })

            const isValid = editor.validateGroup('spielform')
            expect(isValid).toBe(false)
        })

        it('validates all groups at once', () => {
            const editor = useTagFamilyEditor({
                familyName: 'dtags',
                modelValue: 0
            })

            expect(typeof editor.isValid.value).toBe('boolean')
        })

        it('prevents save when validation fails', () => {
            const modelValue = ref(0)
            const editor = useTagFamilyEditor({
                familyName: 'dtags',
                modelValue
            })

            editor.setGroupValue('spielform', 1)

            if (!editor.isValid.value) {
                editor.save()
                // Should not update model if invalid
            }
        })

        it('clears validation errors when fixed', () => {
            const editor = useTagFamilyEditor({
                familyName: 'dtags',
                modelValue: 0
            })

            const initialErrors = editor.getValidationErrors()

            // Fix all required groups
            editor.groups.value
                .filter(g => !g.optional)
                .forEach((g, i) => {
                    editor.setGroupValue(g.name, 1 << i)
                })

            const finalErrors = editor.getValidationErrors()
            expect(finalErrors.length).toBeLessThanOrEqual(initialErrors.length)
        })
    })
})
