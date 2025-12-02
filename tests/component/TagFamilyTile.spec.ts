/**
 * Component Tests: TagFamilyTile
 * 
 * Tests tag family display tile component.
 * Covers: compact/zoomed views, edit mode, empty state
 * 
 * Test Count: ~25 tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import TagFamilyTile from '@/components/TagFamilyTile.vue'
import { setBit } from '@/composables/useSysregTags'

describe('TagFamilyTile - Display Component', () => {

    // ============================================================================
    // Compact View - 6 tests
    // ============================================================================

    describe('Compact View', () => {
        it('renders compact display by default', () => {
            const wrapper = mount(TagFamilyTile, {
                props: {
                    familyName: 'dtags',
                    modelValue: setBit(0, 0),
                    zoomed: false
                }
            })

            expect(wrapper.find('.tag-family-tile').exists()).toBe(true)
            expect(wrapper.find('.compact-view').exists()).toBe(true)
        })

        it('shows compact text', () => {
            const wrapper = mount(TagFamilyTile, {
                props: {
                    familyName: 'dtags',
                    modelValue: setBit(0, 0),
                    zoomed: false
                }
            })

            const text = wrapper.find('.compact-text')
            expect(text.exists()).toBe(true)
            expect(text.text().length).toBeGreaterThan(0)
        })

        it('includes icons in compact view', () => {
            const wrapper = mount(TagFamilyTile, {
                props: {
                    familyName: 'dtags',
                    modelValue: setBit(0, 0),
                    zoomed: false
                }
            })

            const text = wrapper.find('.compact-text').text()
            expect(text).toMatch(/[\u{1F300}-\u{1F9FF}]/u)
        })

        it('shows zoom button in compact mode', () => {
            const wrapper = mount(TagFamilyTile, {
                props: {
                    familyName: 'dtags',
                    modelValue: setBit(0, 0),
                    zoomed: false
                }
            })

            expect(wrapper.find('.zoom-button').exists()).toBe(true)
        })

        it('emits toggle-zoom on button click', async () => {
            const wrapper = mount(TagFamilyTile, {
                props: {
                    familyName: 'dtags',
                    modelValue: setBit(0, 0),
                    zoomed: false
                }
            })

            await wrapper.find('.zoom-button').trigger('click')
            expect(wrapper.emitted('toggle-zoom')).toBeTruthy()
        })

        it('shows single line in compact mode', () => {
            const wrapper = mount(TagFamilyTile, {
                props: {
                    familyName: 'dtags',
                    modelValue: setBit(0, 0),
                    zoomed: false
                }
            })

            const text = wrapper.find('.compact-text').text()
            expect(text.includes('\n')).toBe(false)
        })
    })

    // ============================================================================
    // Zoomed View - 6 tests
    // ============================================================================

    describe('Zoomed View', () => {
        it('renders zoomed display when prop is true', () => {
            const wrapper = mount(TagFamilyTile, {
                props: {
                    familyName: 'dtags',
                    modelValue: setBit(setBit(0, 0), 1),
                    zoomed: true
                }
            })

            expect(wrapper.find('.zoomed-view').exists()).toBe(true)
        })

        it('shows hierarchical text', () => {
            const wrapper = mount(TagFamilyTile, {
                props: {
                    familyName: 'dtags',
                    modelValue: setBit(setBit(0, 0), 1),
                    zoomed: true
                }
            })

            const text = wrapper.find('.zoomed-text')
            expect(text.exists()).toBe(true)
            expect(text.text()).toContain('\n')
        })

        it('shows group headers', () => {
            const wrapper = mount(TagFamilyTile, {
                props: {
                    familyName: 'dtags',
                    modelValue: setBit(0, 0),
                    zoomed: true
                }
            })

            expect(wrapper.findAll('.group-header').length).toBeGreaterThan(0)
        })

        it('shows collapse button in zoomed mode', () => {
            const wrapper = mount(TagFamilyTile, {
                props: {
                    familyName: 'dtags',
                    modelValue: setBit(0, 0),
                    zoomed: true
                }
            })

            expect(wrapper.find('.collapse-button').exists()).toBe(true)
        })

        it('emits toggle-zoom on collapse', async () => {
            const wrapper = mount(TagFamilyTile, {
                props: {
                    familyName: 'dtags',
                    modelValue: setBit(0, 0),
                    zoomed: true
                }
            })

            await wrapper.find('.collapse-button').trigger('click')
            expect(wrapper.emitted('toggle-zoom')).toBeTruthy()
        })

        it('renders multiple groups', () => {
            const wrapper = mount(TagFamilyTile, {
                props: {
                    familyName: 'dtags',
                    modelValue: setBit(setBit(0, 0), 8),
                    zoomed: true
                }
            })

            expect(wrapper.findAll('.group-section').length).toBeGreaterThan(1)
        })
    })

    // ============================================================================
    // Edit Mode - 5 tests
    // ============================================================================

    describe('Edit Mode', () => {
        it('shows edit button when editable', () => {
            const wrapper = mount(TagFamilyTile, {
                props: {
                    familyName: 'dtags',
                    modelValue: setBit(0, 0),
                    editable: true
                }
            })

            expect(wrapper.find('.edit-button').exists()).toBe(true)
        })

        it('hides edit button when not editable', () => {
            const wrapper = mount(TagFamilyTile, {
                props: {
                    familyName: 'dtags',
                    modelValue: setBit(0, 0),
                    editable: false
                }
            })

            expect(wrapper.find('.edit-button').exists()).toBe(false)
        })

        it('emits edit event on button click', async () => {
            const wrapper = mount(TagFamilyTile, {
                props: {
                    familyName: 'dtags',
                    modelValue: setBit(0, 0),
                    editable: true
                }
            })

            await wrapper.find('.edit-button').trigger('click')
            expect(wrapper.emitted('edit')).toBeTruthy()
        })

        it('passes familyName in edit event', async () => {
            const wrapper = mount(TagFamilyTile, {
                props: {
                    familyName: 'dtags',
                    modelValue: setBit(0, 0),
                    editable: true
                }
            })

            await wrapper.find('.edit-button').trigger('click')
            expect(wrapper.emitted('edit')?.[0]).toEqual(['dtags'])
        })

        it('shows edit indicator', () => {
            const wrapper = mount(TagFamilyTile, {
                props: {
                    familyName: 'dtags',
                    modelValue: setBit(0, 0),
                    editable: true
                }
            })

            expect(wrapper.classes()).toContain('editable')
        })
    })

    // ============================================================================
    // Empty State - 4 tests
    // ============================================================================

    describe('Empty State', () => {
        it('shows empty state for zero value', () => {
            const wrapper = mount(TagFamilyTile, {
                props: {
                    familyName: 'dtags',
                    modelValue: 0
                }
            })

            expect(wrapper.find('.empty-state').exists()).toBe(true)
        })

        it('shows empty message', () => {
            const wrapper = mount(TagFamilyTile, {
                props: {
                    familyName: 'dtags',
                    modelValue: 0
                }
            })

            const text = wrapper.find('.empty-message').text()
            expect(text.length).toBeGreaterThan(0)
        })

        it('hides zoom button in empty state', () => {
            const wrapper = mount(TagFamilyTile, {
                props: {
                    familyName: 'dtags',
                    modelValue: 0
                }
            })

            expect(wrapper.find('.zoom-button').exists()).toBe(false)
        })

        it('shows edit button even when empty', () => {
            const wrapper = mount(TagFamilyTile, {
                props: {
                    familyName: 'dtags',
                    modelValue: 0,
                    editable: true
                }
            })

            expect(wrapper.find('.edit-button').exists()).toBe(true)
        })
    })

    // ============================================================================
    // Props & Updates - 4 tests
    // ============================================================================

    describe('Props & Updates', () => {
        it('updates display on value change', async () => {
            const wrapper = mount(TagFamilyTile, {
                props: {
                    familyName: 'dtags',
                    modelValue: setBit(0, 0)
                }
            })

            const initialText = wrapper.find('.compact-text').text()

            await wrapper.setProps({
                modelValue: setBit(0, 8)
            })

            const updatedText = wrapper.find('.compact-text').text()
            expect(updatedText).not.toBe(initialText)
        })

        it('handles null model value', () => {
            const wrapper = mount(TagFamilyTile, {
                props: {
                    familyName: 'dtags',
                    modelValue: null
                }
            })

            expect(wrapper.find('.empty-state').exists()).toBe(true)
        })

        it('supports different family names', () => {
            const wrapper = mount(TagFamilyTile, {
                props: {
                    familyName: 'ttags',
                    modelValue: setBit(0, 0)
                }
            })

            expect(wrapper.find('.tag-family-tile').exists()).toBe(true)
        })

        it('toggles zoom state', async () => {
            const wrapper = mount(TagFamilyTile, {
                props: {
                    familyName: 'dtags',
                    modelValue: setBit(0, 0),
                    zoomed: false
                }
            })

            expect(wrapper.find('.compact-view').exists()).toBe(true)

            await wrapper.setProps({ zoomed: true })

            expect(wrapper.find('.zoomed-view').exists()).toBe(true)
        })
    })
})
