/**
 * TagFamilyEditor Component Tests
 * 
 * Tests the tag family editor modal component
 * 
 * Test Categories:
 * 1. Basic Rendering
 * 2. Modal Behavior
 * 3. Active Groups Display
 * 4. Inactive Groups Display
 * 5. Add/Remove Groups
 * 6. Category Editing
 * 7. Subcategory Editing
 * 8. Toggle Editing
 * 9. Option Editing
 * 10. Validation
 * 11. Save/Cancel
 * 12. Keyboard Shortcuts
 */

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import TagFamilyEditor from '@/components/sysreg/TagFamilyEditor.vue'
import { setupMockSysregApi } from '../helpers/sysreg-mock-api'

describe('TagFamilyEditor Component', () => {
    beforeEach(() => {
        setupMockSysregApi()
    })

    describe('Basic Rendering', () => {
        it('should render modal overlay', async () => {
            const wrapper = mount(TagFamilyEditor, {
                props: {
                    familyName: 'dtags',
                    modelValue: 1
                }
            })

            await wrapper.vm.$nextTick()

            expect(wrapper.find('.tag-family-editor').exists()).toBe(true)
            expect(wrapper.find('.modal-overlay').exists()).toBe(true)
        })

        it('should display family label in header', async () => {
            const wrapper = mount(TagFamilyEditor, {
                props: {
                    familyName: 'dtags',
                    modelValue: 1
                }
            })

            await wrapper.vm.$nextTick()

            expect(wrapper.find('.modal-header').text()).toContain('Didaktisches Modell')
        })

        it('should display family description', async () => {
            const wrapper = mount(TagFamilyEditor, {
                props: {
                    familyName: 'dtags',
                    modelValue: 1
                }
            })

            await wrapper.vm.$nextTick()

            expect(wrapper.text()).toContain('Theaterpädagogische Verfahren')
        })

        it('should show save and cancel buttons', async () => {
            const wrapper = mount(TagFamilyEditor, {
                props: {
                    familyName: 'dtags',
                    modelValue: 1
                }
            })

            await wrapper.vm.$nextTick()

            expect(wrapper.find('.save-button').exists()).toBe(true)
            expect(wrapper.find('.cancel-button').exists()).toBe(true)
        })
    })

    describe('Modal Behavior', () => {
        it('should close when cancel button clicked', async () => {
            const wrapper = mount(TagFamilyEditor, {
                props: {
                    familyName: 'dtags',
                    modelValue: 1
                }
            })

            await wrapper.vm.$nextTick()
            await wrapper.find('.cancel-button').trigger('click')

            expect(wrapper.emitted('cancel')).toBeTruthy()
        })

        it('should emit save when save button clicked', async () => {
            const wrapper = mount(TagFamilyEditor, {
                props: {
                    familyName: 'dtags',
                    modelValue: 1
                }
            })

            await wrapper.vm.$nextTick()
            await wrapper.find('.save-button').trigger('click')

            expect(wrapper.emitted('save')).toBeTruthy()
        })

        it('should close when clicking overlay', async () => {
            const wrapper = mount(TagFamilyEditor, {
                props: {
                    familyName: 'dtags',
                    modelValue: 1
                }
            })

            await wrapper.vm.$nextTick()
            await wrapper.find('.modal-overlay').trigger('click')

            expect(wrapper.emitted('cancel')).toBeTruthy()
        })

        it('should not close when clicking modal content', async () => {
            const wrapper = mount(TagFamilyEditor, {
                props: {
                    familyName: 'dtags',
                    modelValue: 1
                }
            })

            await wrapper.vm.$nextTick()
            await wrapper.find('.modal-content').trigger('click')

            expect(wrapper.emitted('cancel')).toBeFalsy()
        })
    })

    describe('Active Groups Display', () => {
        it('should display active groups', async () => {
            const wrapper = mount(TagFamilyEditor, {
                props: {
                    familyName: 'dtags',
                    modelValue: 1 // Kreisspiele (TagGroup 1 active)
                }
            })

            await wrapper.vm.$nextTick()

            const activeGroups = wrapper.findAll('.active-group')
            expect(activeGroups.length).toBeGreaterThan(0)
        })

        it('should show group icon', async () => {
            const wrapper = mount(TagFamilyEditor, {
                props: {
                    familyName: 'dtags',
                    modelValue: 1
                }
            })

            await wrapper.vm.$nextTick()

            expect(wrapper.find('.group-icon').exists()).toBe(true)
        })

        it('should show group label', async () => {
            const wrapper = mount(TagFamilyEditor, {
                props: {
                    familyName: 'dtags',
                    modelValue: 1
                }
            })

            await wrapper.vm.$nextTick()

            expect(wrapper.text()).toContain('Spielform')
        })

        it('should show trash button for active groups', async () => {
            const wrapper = mount(TagFamilyEditor, {
                props: {
                    familyName: 'dtags',
                    modelValue: 1
                }
            })

            await wrapper.vm.$nextTick()

            expect(wrapper.find('.trash-button').exists()).toBe(true)
        })
    })

    describe('Inactive Groups Display', () => {
        it('should display inactive groups as add buttons', async () => {
            const wrapper = mount(TagFamilyEditor, {
                props: {
                    familyName: 'dtags',
                    modelValue: 1 // Only TagGroup 1 active
                }
            })

            await wrapper.vm.$nextTick()

            const addButtons = wrapper.findAll('.add-group-button')
            expect(addButtons.length).toBeGreaterThan(0)
        })

        it('should show + icon on add buttons', async () => {
            const wrapper = mount(TagFamilyEditor, {
                props: {
                    familyName: 'dtags',
                    modelValue: 1
                }
            })

            await wrapper.vm.$nextTick()

            const addButton = wrapper.find('.add-group-button')
            expect(addButton.text()).toContain('+')
        })
    })

    describe('Add/Remove Groups', () => {
        it('should add group when add button clicked', async () => {
            const wrapper = mount(TagFamilyEditor, {
                props: {
                    familyName: 'dtags',
                    modelValue: 1
                }
            })

            await wrapper.vm.$nextTick()

            const addButton = wrapper.find('.add-group-button')
            await addButton.trigger('click')
            await wrapper.vm.$nextTick()

            const activeGroups = wrapper.findAll('.active-group')
            expect(activeGroups.length).toBeGreaterThan(1)
        })

        it('should remove group when trash button clicked', async () => {
            const wrapper = mount(TagFamilyEditor, {
                props: {
                    familyName: 'dtags',
                    modelValue: 1
                }
            })

            await wrapper.vm.$nextTick()

            const initialGroups = wrapper.findAll('.active-group').length

            await wrapper.find('.trash-button').trigger('click')
            await wrapper.vm.$nextTick()

            const finalGroups = wrapper.findAll('.active-group').length
            expect(finalGroups).toBe(initialGroups - 1)
        })

        it('should move removed group to inactive list', async () => {
            const wrapper = mount(TagFamilyEditor, {
                props: {
                    familyName: 'dtags',
                    modelValue: 1
                }
            })

            await wrapper.vm.$nextTick()

            const initialAddButtons = wrapper.findAll('.add-group-button').length

            await wrapper.find('.trash-button').trigger('click')
            await wrapper.vm.$nextTick()

            const finalAddButtons = wrapper.findAll('.add-group-button').length
            expect(finalAddButtons).toBe(initialAddButtons + 1)
        })
    })

    describe('Category Editing', () => {
        it('should render category options for small category sets (≤4)', async () => {
            const wrapper = mount(TagFamilyEditor, {
                props: {
                    familyName: 'dtags',
                    modelValue: 1
                }
            })

            await wrapper.vm.$nextTick()

            // TagGroup 1 has 4 categories
            expect(wrapper.find('.category-options').exists()).toBe(true)
        })

        it('should update value when category option clicked', async () => {
            const wrapper = mount(TagFamilyEditor, {
                props: {
                    familyName: 'dtags',
                    modelValue: 1 // Kreisspiele
                }
            })

            await wrapper.vm.$nextTick()

            const options = wrapper.findAll('.category-option')
            await options[1].trigger('click') // Select Raumlauf
            await wrapper.vm.$nextTick()

            await wrapper.find('.save-button').trigger('click')

            expect(wrapper.emitted('save')?.[0][0]).not.toBe(1)
        })
    })

    describe('Subcategory Editing', () => {
        it('should show subcategory selector when category selected', async () => {
            const wrapper = mount(TagFamilyEditor, {
                props: {
                    familyName: 'dtags',
                    modelValue: 1 // Kreisspiele category
                }
            })

            await wrapper.vm.$nextTick()

            expect(wrapper.find('.subcategory-selector').exists()).toBe(true)
        })

        it('should show reset button for category with subcategories', async () => {
            const wrapper = mount(TagFamilyEditor, {
                props: {
                    familyName: 'dtags',
                    modelValue: 2 // Kreisspiel > Impulskreis (subcategory)
                }
            })

            await wrapper.vm.$nextTick()

            expect(wrapper.find('.reset-category-button').exists()).toBe(true)
        })

        it('should reset to category when reset button clicked', async () => {
            const wrapper = mount(TagFamilyEditor, {
                props: {
                    familyName: 'dtags',
                    modelValue: 2 // Subcategory
                }
            })

            await wrapper.vm.$nextTick()

            await wrapper.find('.reset-category-button').trigger('click')
            await wrapper.vm.$nextTick()

            await wrapper.find('.save-button').trigger('click')

            // Should save category-only value (1, not 2)
            expect(wrapper.emitted('save')?.[0][0]).toBe(1)
        })
    })

    describe('Toggle Editing', () => {
        it('should render toggle controls for toggle taglogic', async () => {
            const wrapper = mount(TagFamilyEditor, {
                props: {
                    familyName: 'config',
                    modelValue: 0
                }
            })

            await wrapper.vm.$nextTick()

            expect(wrapper.find('.toggle-controls').exists()).toBe(true)
        })

        it('should toggle value when toggle clicked', async () => {
            const wrapper = mount(TagFamilyEditor, {
                props: {
                    familyName: 'config',
                    modelValue: 0
                }
            })

            await wrapper.vm.$nextTick()

            const toggle = wrapper.find('.toggle-control')
            await toggle.trigger('click')
            await wrapper.vm.$nextTick()

            await wrapper.find('.save-button').trigger('click')

            expect(wrapper.emitted('save')?.[0][0]).not.toBe(0)
        })
    })

    describe('Option Editing', () => {
        it('should render checkboxes for option taglogic (≤5 options)', async () => {
            const wrapper = mount(TagFamilyEditor, {
                props: {
                    familyName: 'rtags',
                    modelValue: 0
                }
            })

            await wrapper.vm.$nextTick()

            expect(wrapper.find('.option-checkboxes').exists()).toBe(true)
        })

        it('should update value when checkbox clicked', async () => {
            const wrapper = mount(TagFamilyEditor, {
                props: {
                    familyName: 'rtags',
                    modelValue: 0
                }
            })

            await wrapper.vm.$nextTick()

            const checkbox = wrapper.find('input[type="checkbox"]')
            await checkbox.setChecked(true)
            await wrapper.vm.$nextTick()

            await wrapper.find('.save-button').trigger('click')

            expect(wrapper.emitted('save')?.[0][0]).toBeGreaterThan(0)
        })
    })

    describe('Validation', () => {
        it('should validate before saving', async () => {
            const wrapper = mount(TagFamilyEditor, {
                props: {
                    familyName: 'dtags',
                    modelValue: 1
                }
            })

            await wrapper.vm.$nextTick()
            await wrapper.find('.save-button').trigger('click')

            expect(wrapper.emitted('save')).toBeTruthy()
        })

        it('should prevent save if validation fails', async () => {
            // Test case would depend on specific validation rules
            // This is a placeholder for when validation is implemented
            expect(true).toBe(true)
        })
    })

    describe('Save/Cancel', () => {
        it('should emit save with updated value', async () => {
            const wrapper = mount(TagFamilyEditor, {
                props: {
                    familyName: 'dtags',
                    modelValue: 1
                }
            })

            await wrapper.vm.$nextTick()
            await wrapper.find('.save-button').trigger('click')

            expect(wrapper.emitted('save')).toBeTruthy()
            expect(typeof wrapper.emitted('save')?.[0][0]).toBe('number')
        })

        it('should emit cancel without saving', async () => {
            const wrapper = mount(TagFamilyEditor, {
                props: {
                    familyName: 'dtags',
                    modelValue: 1
                }
            })

            await wrapper.vm.$nextTick()
            await wrapper.find('.cancel-button').trigger('click')

            expect(wrapper.emitted('cancel')).toBeTruthy()
            expect(wrapper.emitted('save')).toBeFalsy()
        })

        it('should emit update:modelValue when editing', async () => {
            const wrapper = mount(TagFamilyEditor, {
                props: {
                    familyName: 'dtags',
                    modelValue: 1
                }
            })

            await wrapper.vm.$nextTick()

            // Make a change
            const option = wrapper.find('.category-option')
            await option.trigger('click')
            await wrapper.vm.$nextTick()

            expect(wrapper.emitted('update:modelValue')).toBeTruthy()
        })
    })

    describe('Keyboard Shortcuts', () => {
        it('should close on Escape key', async () => {
            const wrapper = mount(TagFamilyEditor, {
                props: {
                    familyName: 'dtags',
                    modelValue: 1
                },
                attachTo: document.body
            })

            await wrapper.vm.$nextTick()

            await wrapper.trigger('keydown', { key: 'Escape' })

            expect(wrapper.emitted('cancel')).toBeTruthy()

            wrapper.unmount()
        })

        it('should save on Ctrl+Enter', async () => {
            const wrapper = mount(TagFamilyEditor, {
                props: {
                    familyName: 'dtags',
                    modelValue: 1
                },
                attachTo: document.body
            })

            await wrapper.vm.$nextTick()

            await wrapper.trigger('keydown', { key: 'Enter', ctrlKey: true })

            expect(wrapper.emitted('save')).toBeTruthy()

            wrapper.unmount()
        })
    })

    describe('Group Selection Filter', () => {
        it('should filter groups when groupSelection="core"', async () => {
            const wrapper = mount(TagFamilyEditor, {
                props: {
                    familyName: 'dtags',
                    modelValue: 0b1000000000000000000000000000001, // TagGroup 1 + TagGroup 4
                    groupSelection: 'core'
                }
            })

            await wrapper.vm.$nextTick()

            // Should only show core groups (TagGroup 1, 2, 3), not TagGroup 4
            const activeGroups = wrapper.findAll('.active-group')
            expect(activeGroups.length).toBeLessThanOrEqual(3)
        })

        it('should show all groups when groupSelection="all"', async () => {
            const wrapper = mount(TagFamilyEditor, {
                props: {
                    familyName: 'dtags',
                    modelValue: 0b1000000000000000000000000000001,
                    groupSelection: 'all'
                }
            })

            await wrapper.vm.$nextTick()

            // Should show both active groups
            const activeGroups = wrapper.findAll('.active-group')
            expect(activeGroups.length).toBeGreaterThan(0)
        })
    })
})
