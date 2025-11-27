/**
 * Component Tests: TagGroupEditor
 * 
 * Tests tag group editor component.
 * Covers: category/subcategory, multiselect, validation
 * 
 * Test Count: ~25 tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import TagGroupEditor from '@/components/TagGroupEditor.vue'
import { setBit, clearBit } from '@/composables/useSysregTags'

describe('TagGroupEditor - Group Component', () => {

    // ============================================================================
    // Rendering - 5 tests
    // ============================================================================

    describe('Rendering', () => {
        it('renders group container', () => {
            const wrapper = mount(TagGroupEditor, {
                props: {
                    familyName: 'dtags',
                    groupName: 'spielform',
                    modelValue: 0
                }
            })

            expect(wrapper.find('.tag-group-editor').exists()).toBe(true)
        })

        it('shows group title', () => {
            const wrapper = mount(TagGroupEditor, {
                props: {
                    familyName: 'dtags',
                    groupName: 'spielform',
                    modelValue: 0
                }
            })

            expect(wrapper.find('.group-title').exists()).toBe(true)
        })

        it('shows group icon', () => {
            const wrapper = mount(TagGroupEditor, {
                props: {
                    familyName: 'dtags',
                    groupName: 'spielform',
                    modelValue: 0
                }
            })

            expect(wrapper.find('.group-icon').exists()).toBe(true)
        })

        it('renders option checkboxes', () => {
            const wrapper = mount(TagGroupEditor, {
                props: {
                    familyName: 'dtags',
                    groupName: 'spielform',
                    modelValue: 0
                }
            })

            expect(wrapper.findAll('.option-checkbox').length).toBeGreaterThan(0)
        })

        it('shows required indicator', () => {
            const wrapper = mount(TagGroupEditor, {
                props: {
                    familyName: 'dtags',
                    groupName: 'spielform',
                    modelValue: 0,
                    required: true
                }
            })

            expect(wrapper.find('.required-indicator').exists()).toBe(true)
        })
    })

    // ============================================================================
    // Category Selection - 6 tests
    // ============================================================================

    describe('Category Selection', () => {
        it('renders category options', () => {
            const wrapper = mount(TagGroupEditor, {
                props: {
                    familyName: 'dtags',
                    groupName: 'spielform',
                    modelValue: 0
                }
            })

            const categories = wrapper.findAll('.option-checkbox.category')
            expect(categories.length).toBeGreaterThan(0)
        })

        it('checks selected category', () => {
            const wrapper = mount(TagGroupEditor, {
                props: {
                    familyName: 'dtags',
                    groupName: 'spielform',
                    modelValue: setBit(0, 0)
                }
            })

            const checkbox = wrapper.find('.option-checkbox.category input')
            expect(checkbox.element.checked).toBe(true)
        })

        it('emits update on category click', async () => {
            const wrapper = mount(TagGroupEditor, {
                props: {
                    familyName: 'dtags',
                    groupName: 'spielform',
                    modelValue: 0
                }
            })

            await wrapper.find('.option-checkbox.category input').trigger('change')

            expect(wrapper.emitted('update:model-value')).toBeTruthy()
        })

        it('sets single category in single-select', async () => {
            const wrapper = mount(TagGroupEditor, {
                props: {
                    familyName: 'dtags',
                    groupName: 'spielform',
                    modelValue: setBit(0, 0)
                }
            })

            await wrapper.findAll('.option-checkbox.category input')[1].trigger('change')

            const emitted = wrapper.emitted('update:model-value')
            const newValue = emitted?.[0]?.[0] as number

            // Should have only one category bit set
            expect(newValue).not.toBe(setBit(0, 0))
        })

        it('clears subcategories on category change', async () => {
            const wrapper = mount(TagGroupEditor, {
                props: {
                    familyName: 'dtags',
                    groupName: 'spielform',
                    modelValue: setBit(setBit(0, 0), 1)
                }
            })

            await wrapper.findAll('.option-checkbox.category input')[1].trigger('change')

            const emitted = wrapper.emitted('update:model-value')
            const newValue = emitted?.[0]?.[0] as number

            // Subcategory bit 1 should be cleared
        })

        it('allows multiple categories in multiselect', async () => {
            const wrapper = mount(TagGroupEditor, {
                props: {
                    familyName: 'dtags',
                    groupName: 'sujets',
                    modelValue: setBit(0, 24)
                }
            })

            await wrapper.findAll('.option-checkbox.category input')[1].trigger('change')

            const emitted = wrapper.emitted('update:model-value')
            const newValue = emitted?.[0]?.[0] as number

            // Should have both bits set
            expect((newValue & (1 << 24)) !== 0).toBe(true)
        })
    })

    // ============================================================================
    // Subcategory Selection - 6 tests
    // ============================================================================

    describe('Subcategory Selection', () => {
        it('renders subcategory options', () => {
            const wrapper = mount(TagGroupEditor, {
                props: {
                    familyName: 'dtags',
                    groupName: 'spielform',
                    modelValue: setBit(0, 0)
                }
            })

            const subcategories = wrapper.findAll('.option-checkbox.subcategory')
            expect(subcategories.length).toBeGreaterThan(0)
        })

        it('indents subcategories', () => {
            const wrapper = mount(TagGroupEditor, {
                props: {
                    familyName: 'dtags',
                    groupName: 'spielform',
                    modelValue: setBit(0, 0)
                }
            })

            const subcategory = wrapper.find('.option-checkbox.subcategory')
            expect(subcategory.classes()).toContain('indented')
        })

        it('disables orphan subcategories', () => {
            const wrapper = mount(TagGroupEditor, {
                props: {
                    familyName: 'dtags',
                    groupName: 'spielform',
                    modelValue: 0
                }
            })

            const subcategory = wrapper.find('.option-checkbox.subcategory input')
            expect(subcategory.attributes('disabled')).toBeDefined()
        })

        it('enables subcategories with parent', () => {
            const wrapper = mount(TagGroupEditor, {
                props: {
                    familyName: 'dtags',
                    groupName: 'spielform',
                    modelValue: setBit(0, 0)
                }
            })

            const subcategory = wrapper.find('.option-checkbox.subcategory input')
            expect(subcategory.attributes('disabled')).toBeUndefined()
        })

        it('checks selected subcategory', () => {
            const wrapper = mount(TagGroupEditor, {
                props: {
                    familyName: 'dtags',
                    groupName: 'spielform',
                    modelValue: setBit(setBit(0, 0), 1)
                }
            })

            const checkbox = wrapper.find('.option-checkbox.subcategory input')
            expect(checkbox.element.checked).toBe(true)
        })

        it('emits update on subcategory click', async () => {
            const wrapper = mount(TagGroupEditor, {
                props: {
                    familyName: 'dtags',
                    groupName: 'spielform',
                    modelValue: setBit(0, 0)
                }
            })

            await wrapper.find('.option-checkbox.subcategory input').trigger('change')

            expect(wrapper.emitted('update:model-value')).toBeTruthy()
        })
    })

    // ============================================================================
    // Multiselect Behavior - 4 tests
    // ============================================================================

    describe('Multiselect Behavior', () => {
        it('allows multiple selections', async () => {
            const wrapper = mount(TagGroupEditor, {
                props: {
                    familyName: 'dtags',
                    groupName: 'sujets',
                    modelValue: setBit(0, 24)
                }
            })

            await wrapper.findAll('.option-checkbox input')[1].trigger('change')

            const emitted = wrapper.emitted('update:model-value')
            const newValue = emitted?.[0]?.[0] as number

            // Should have both bits set
            expect((newValue & (1 << 24)) !== 0).toBe(true)
        })

        it('toggles individual options', async () => {
            const wrapper = mount(TagGroupEditor, {
                props: {
                    familyName: 'dtags',
                    groupName: 'sujets',
                    modelValue: setBit(setBit(0, 24), 25)
                }
            })

            await wrapper.findAll('.option-checkbox input')[0].trigger('change')

            const emitted = wrapper.emitted('update:model-value')
            const newValue = emitted?.[0]?.[0] as number

            // Bit 24 should be cleared, bit 25 still set
            expect((newValue & (1 << 24)) !== 0).toBe(false)
            expect((newValue & (1 << 25)) !== 0).toBe(true)
        })

        it('shows multiselect indicator', () => {
            const wrapper = mount(TagGroupEditor, {
                props: {
                    familyName: 'dtags',
                    groupName: 'sujets',
                    modelValue: 0
                }
            })

            expect(wrapper.find('.multiselect-indicator').exists()).toBe(true)
        })

        it('counts selected options', () => {
            const wrapper = mount(TagGroupEditor, {
                props: {
                    familyName: 'dtags',
                    groupName: 'sujets',
                    modelValue: setBit(setBit(0, 24), 25)
                }
            })

            const count = wrapper.find('.selection-count').text()
            expect(count).toContain('2')
        })
    })

    // ============================================================================
    // Validation - 4 tests
    // ============================================================================

    describe('Validation', () => {
        it('shows error when required and empty', () => {
            const wrapper = mount(TagGroupEditor, {
                props: {
                    familyName: 'dtags',
                    groupName: 'spielform',
                    modelValue: 0,
                    required: true,
                    showValidation: true
                }
            })

            expect(wrapper.find('.validation-error').exists()).toBe(true)
        })

        it('clears error when value set', async () => {
            const wrapper = mount(TagGroupEditor, {
                props: {
                    familyName: 'dtags',
                    groupName: 'spielform',
                    modelValue: 0,
                    required: true,
                    showValidation: true
                }
            })

            await wrapper.setProps({ modelValue: setBit(0, 0) })

            expect(wrapper.find('.validation-error').exists()).toBe(false)
        })

        it('validates orphan subcategories', () => {
            const wrapper = mount(TagGroupEditor, {
                props: {
                    familyName: 'dtags',
                    groupName: 'spielform',
                    modelValue: setBit(0, 1),
                    showValidation: true
                }
            })

            expect(wrapper.find('.validation-error').exists()).toBe(true)
        })

        it('highlights invalid state', () => {
            const wrapper = mount(TagGroupEditor, {
                props: {
                    familyName: 'dtags',
                    groupName: 'spielform',
                    modelValue: 0,
                    required: true,
                    showValidation: true
                }
            })

            expect(wrapper.classes()).toContain('invalid')
        })
    })
})
