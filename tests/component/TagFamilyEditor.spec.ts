/**
 * Component Tests: TagFamilyEditor
 * 
 * Tests tag family editor modal component.
 * Covers: validation, save/cancel, group editors
 * 
 * Test Count: ~30 tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import TagFamilyEditor from '@/components/TagFamilyEditor.vue'
import { setBit } from '@/composables/useSysregTags'

describe('TagFamilyEditor - Modal Component', () => {

    // ============================================================================
    // Initialization - 5 tests
    // ============================================================================

    describe('Initialization', () => {
        it('renders modal dialog', () => {
            const wrapper = mount(TagFamilyEditor, {
                props: {
                    familyName: 'dtags',
                    modelValue: setBit(0, 0),
                    open: true
                }
            })

            expect(wrapper.find('.modal-dialog').exists()).toBe(true)
        })

        it('loads initial value', () => {
            const wrapper = mount(TagFamilyEditor, {
                props: {
                    familyName: 'dtags',
                    modelValue: setBit(0, 0),
                    open: true
                }
            })

            expect(wrapper.vm.editValue).toBeDefined()
        })

        it('hides modal when closed', () => {
            const wrapper = mount(TagFamilyEditor, {
                props: {
                    familyName: 'dtags',
                    modelValue: setBit(0, 0),
                    open: false
                }
            })

            expect(wrapper.find('.modal-dialog').isVisible()).toBe(false)
        })

        it('renders group editors', () => {
            const wrapper = mount(TagFamilyEditor, {
                props: {
                    familyName: 'dtags',
                    modelValue: setBit(0, 0),
                    open: true
                }
            })

            expect(wrapper.findAll('.tag-group-editor').length).toBeGreaterThan(0)
        })

        it('shows family title', () => {
            const wrapper = mount(TagFamilyEditor, {
                props: {
                    familyName: 'dtags',
                    modelValue: setBit(0, 0),
                    open: true
                }
            })

            expect(wrapper.find('.modal-title').text()).toContain('dtags')
        })
    })

    // ============================================================================
    // Validation Display - 6 tests
    // ============================================================================

    describe('Validation Display', () => {
        it('shows validation errors', async () => {
            const wrapper = mount(TagFamilyEditor, {
                props: {
                    familyName: 'dtags',
                    modelValue: 0,
                    open: true
                }
            })

            // Trigger validation
            await wrapper.find('.save-button').trigger('click')

            expect(wrapper.find('.validation-errors').exists()).toBe(true)
        })

        it('highlights invalid groups', async () => {
            const wrapper = mount(TagFamilyEditor, {
                props: {
                    familyName: 'dtags',
                    modelValue: 0,
                    open: true
                }
            })

            await wrapper.find('.save-button').trigger('click')

            const invalidGroups = wrapper.findAll('.tag-group-editor.invalid')
            expect(invalidGroups.length).toBeGreaterThan(0)
        })

        it('shows error messages', async () => {
            const wrapper = mount(TagFamilyEditor, {
                props: {
                    familyName: 'dtags',
                    modelValue: 0,
                    open: true
                }
            })

            await wrapper.find('.save-button').trigger('click')

            const errorText = wrapper.find('.error-message').text()
            expect(errorText.length).toBeGreaterThan(0)
        })

        it('clears errors on valid input', async () => {
            const wrapper = mount(TagFamilyEditor, {
                props: {
                    familyName: 'dtags',
                    modelValue: 0,
                    open: true
                }
            })

            await wrapper.find('.save-button').trigger('click')
            expect(wrapper.find('.validation-errors').exists()).toBe(true)

            // Set valid value
            await wrapper.find('.tag-group-editor').trigger('update:model-value', setBit(0, 0))

            expect(wrapper.find('.validation-errors').exists()).toBe(false)
        })

        it('disables save button when invalid', async () => {
            const wrapper = mount(TagFamilyEditor, {
                props: {
                    familyName: 'dtags',
                    modelValue: 0,
                    open: true
                }
            })

            const saveButton = wrapper.find('.save-button')
            expect(saveButton.attributes('disabled')).toBeDefined()
        })

        it('enables save button when valid', async () => {
            const wrapper = mount(TagFamilyEditor, {
                props: {
                    familyName: 'dtags',
                    modelValue: setBit(0, 0),
                    open: true
                }
            })

            const saveButton = wrapper.find('.save-button')
            expect(saveButton.attributes('disabled')).toBeUndefined()
        })
    })

    // ============================================================================
    // Group Editors - 6 tests
    // ============================================================================

    describe('Group Editors', () => {
        it('renders all groups', () => {
            const wrapper = mount(TagFamilyEditor, {
                props: {
                    familyName: 'dtags',
                    modelValue: setBit(0, 0),
                    open: true
                }
            })

            // dtags has 4 groups
            expect(wrapper.findAll('.tag-group-editor').length).toBe(4)
        })

        it('passes group configuration', () => {
            const wrapper = mount(TagFamilyEditor, {
                props: {
                    familyName: 'dtags',
                    modelValue: setBit(0, 0),
                    open: true
                }
            })

            const editor = wrapper.find('.tag-group-editor')
            expect(editor.attributes('group-name')).toBeDefined()
        })

        it('updates on group change', async () => {
            const wrapper = mount(TagFamilyEditor, {
                props: {
                    familyName: 'dtags',
                    modelValue: setBit(0, 0),
                    open: true
                }
            })

            const editor = wrapper.find('.tag-group-editor')
            await editor.trigger('update:model-value', setBit(0, 8))

            expect(wrapper.vm.isDirty).toBe(true)
        })

        it('marks dirty on edit', async () => {
            const wrapper = mount(TagFamilyEditor, {
                props: {
                    familyName: 'dtags',
                    modelValue: setBit(0, 0),
                    open: true
                }
            })

            expect(wrapper.vm.isDirty).toBe(false)

            await wrapper.find('.tag-group-editor').trigger('update:model-value', setBit(0, 8))

            expect(wrapper.vm.isDirty).toBe(true)
        })

        it('shows required indicators', () => {
            const wrapper = mount(TagFamilyEditor, {
                props: {
                    familyName: 'dtags',
                    modelValue: setBit(0, 0),
                    open: true
                }
            })

            const requiredGroups = wrapper.findAll('.tag-group-editor.required')
            expect(requiredGroups.length).toBeGreaterThan(0)
        })

        it('orders groups correctly', () => {
            const wrapper = mount(TagFamilyEditor, {
                props: {
                    familyName: 'dtags',
                    modelValue: setBit(0, 0),
                    open: true
                }
            })

            const editors = wrapper.findAll('.tag-group-editor')
            const groupNames = editors.map(e => e.attributes('group-name'))

            // Should be in order: spielform, animiertes_theaterspiel, dramaturgie, sujets
            expect(groupNames[0]).toBe('spielform')
        })
    })

    // ============================================================================
    // Save/Cancel - 6 tests
    // ============================================================================

    describe('Save/Cancel', () => {
        it('emits update on save', async () => {
            const wrapper = mount(TagFamilyEditor, {
                props: {
                    familyName: 'dtags',
                    modelValue: setBit(0, 0),
                    open: true
                }
            })

            await wrapper.find('.save-button').trigger('click')

            expect(wrapper.emitted('update:model-value')).toBeTruthy()
        })

        it('passes edited value on save', async () => {
            const wrapper = mount(TagFamilyEditor, {
                props: {
                    familyName: 'dtags',
                    modelValue: setBit(0, 0),
                    open: true
                }
            })

            await wrapper.find('.tag-group-editor').trigger('update:model-value', setBit(0, 8))
            await wrapper.find('.save-button').trigger('click')

            const emitted = wrapper.emitted('update:model-value')
            expect(emitted?.[0]?.[0]).toBeDefined()
        })

        it('closes modal on save', async () => {
            const wrapper = mount(TagFamilyEditor, {
                props: {
                    familyName: 'dtags',
                    modelValue: setBit(0, 0),
                    open: true
                }
            })

            await wrapper.find('.save-button').trigger('click')

            expect(wrapper.emitted('update:open')).toContainEqual([false])
        })

        it('does not emit update on cancel', async () => {
            const wrapper = mount(TagFamilyEditor, {
                props: {
                    familyName: 'dtags',
                    modelValue: setBit(0, 0),
                    open: true
                }
            })

            await wrapper.find('.tag-group-editor').trigger('update:model-value', setBit(0, 8))
            await wrapper.find('.cancel-button').trigger('click')

            expect(wrapper.emitted('update:model-value')).toBeFalsy()
        })

        it('closes modal on cancel', async () => {
            const wrapper = mount(TagFamilyEditor, {
                props: {
                    familyName: 'dtags',
                    modelValue: setBit(0, 0),
                    open: true
                }
            })

            await wrapper.find('.cancel-button').trigger('click')

            expect(wrapper.emitted('update:open')).toContainEqual([false])
        })

        it('resets dirty state on cancel', async () => {
            const wrapper = mount(TagFamilyEditor, {
                props: {
                    familyName: 'dtags',
                    modelValue: setBit(0, 0),
                    open: true
                }
            })

            await wrapper.find('.tag-group-editor').trigger('update:model-value', setBit(0, 8))
            expect(wrapper.vm.isDirty).toBe(true)

            await wrapper.find('.cancel-button').trigger('click')

            // Reopening should reset
            await wrapper.setProps({ open: true })
            expect(wrapper.vm.isDirty).toBe(false)
        })
    })

    // ============================================================================
    // Reset Functionality - 4 tests
    // ============================================================================

    describe('Reset Functionality', () => {
        it('shows reset button', () => {
            const wrapper = mount(TagFamilyEditor, {
                props: {
                    familyName: 'dtags',
                    modelValue: setBit(0, 0),
                    open: true
                }
            })

            expect(wrapper.find('.reset-button').exists()).toBe(true)
        })

        it('resets to initial value', async () => {
            const wrapper = mount(TagFamilyEditor, {
                props: {
                    familyName: 'dtags',
                    modelValue: setBit(0, 0),
                    open: true
                }
            })

            await wrapper.find('.tag-group-editor').trigger('update:model-value', setBit(0, 8))
            await wrapper.find('.reset-button').trigger('click')

            expect(wrapper.vm.editValue).toBe(setBit(0, 0))
        })

        it('clears dirty flag on reset', async () => {
            const wrapper = mount(TagFamilyEditor, {
                props: {
                    familyName: 'dtags',
                    modelValue: setBit(0, 0),
                    open: true
                }
            })

            await wrapper.find('.tag-group-editor').trigger('update:model-value', setBit(0, 8))
            expect(wrapper.vm.isDirty).toBe(true)

            await wrapper.find('.reset-button').trigger('click')

            expect(wrapper.vm.isDirty).toBe(false)
        })

        it('disables reset when not dirty', () => {
            const wrapper = mount(TagFamilyEditor, {
                props: {
                    familyName: 'dtags',
                    modelValue: setBit(0, 0),
                    open: true
                }
            })

            const resetButton = wrapper.find('.reset-button')
            expect(resetButton.attributes('disabled')).toBeDefined()
        })
    })

    // ============================================================================
    // Modal Behavior - 3 tests
    // ============================================================================

    describe('Modal Behavior', () => {
        it('closes on overlay click', async () => {
            const wrapper = mount(TagFamilyEditor, {
                props: {
                    familyName: 'dtags',
                    modelValue: setBit(0, 0),
                    open: true
                }
            })

            await wrapper.find('.modal-overlay').trigger('click')

            expect(wrapper.emitted('update:open')).toContainEqual([false])
        })

        it('prevents close on content click', async () => {
            const wrapper = mount(TagFamilyEditor, {
                props: {
                    familyName: 'dtags',
                    modelValue: setBit(0, 0),
                    open: true
                }
            })

            await wrapper.find('.modal-content').trigger('click')

            expect(wrapper.emitted('update:open')).toBeFalsy()
        })

        it('closes on escape key', async () => {
            const wrapper = mount(TagFamilyEditor, {
                props: {
                    familyName: 'dtags',
                    modelValue: setBit(0, 0),
                    open: true
                }
            })

            await wrapper.trigger('keydown.esc')

            expect(wrapper.emitted('update:open')).toContainEqual([false])
        })
    })
})
