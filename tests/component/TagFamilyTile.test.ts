/**
 * TagFamilyTile Component Tests
 * 
 * Tests the tag family tile component for displaying and editing sysreg tag families
 * 
 * Test Categories:
 * 1. Basic Rendering
 * 2. Compact Layout
 * 3. Zoomed Layout
 * 4. Zoom Toggle Behavior
 * 5. Edit Button
 * 6. Group Filtering (core/options/all)
 * 7. Overflow Handling
 * 8. Events
 */

import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import TagFamilyTile from '@/components/sysreg/TagFamilyTile.vue'
import { setupMockSysregApi } from '../helpers/sysreg-mock-api'

describe('TagFamilyTile Component', () => {
    beforeEach(() => {
        setupMockSysregApi()
    })

    describe('Basic Rendering', () => {
        it('should render with minimal props', async () => {
            const wrapper = mount(TagFamilyTile, {
                props: {
                    familyName: 'dtags',
                    modelValue: null
                }
            })

            await wrapper.vm.$nextTick()

            expect(wrapper.find('.tag-family-tile').exists()).toBe(true)
        })

        it('should display family label', async () => {
            const wrapper = mount(TagFamilyTile, {
                props: {
                    familyName: 'dtags',
                    modelValue: null
                }
            })

            await wrapper.vm.$nextTick()

            expect(wrapper.text()).toContain('Didaktisches Modell')
        })

        it('should handle null value', async () => {
            const wrapper = mount(TagFamilyTile, {
                props: {
                    familyName: 'ttags',
                    modelValue: null
                }
            })

            await wrapper.vm.$nextTick()

            expect(wrapper.find('.tag-family-tile').exists()).toBe(true)
            expect(wrapper.find('.empty-state').exists()).toBe(true)
        })
    })

    describe('Compact Layout', () => {
        it('should show compact layout when zoom=false', async () => {
            const wrapper = mount(TagFamilyTile, {
                props: {
                    familyName: 'dtags',
                    modelValue: 1, // Kreisspiele
                    zoom: false
                }
            })

            await wrapper.vm.$nextTick()

            expect(wrapper.find('.tag-family-tile--compact').exists()).toBe(true)
            expect(wrapper.find('.tag-family-tile--zoomed').exists()).toBe(false)
        })

        it('should display tags inline in compact mode', async () => {
            const wrapper = mount(TagFamilyTile, {
                props: {
                    familyName: 'dtags',
                    modelValue: 1, // Kreisspiele
                    zoom: false
                }
            })

            await wrapper.vm.$nextTick()

            const tagDisplay = wrapper.find('.tag-display')
            expect(tagDisplay.exists()).toBe(true)
            expect(tagDisplay.text()).toContain('Kreisspiele')
        })

        it('should show optional tags in bottom row', async () => {
            const wrapper = mount(TagFamilyTile, {
                props: {
                    familyName: 'dtags',
                    modelValue: 0b1000000000000000000000000000001, // Category in TagGroup 1 + TagGroup 4 (optional)
                    zoom: false,
                    groupSelection: 'all'
                }
            })

            await wrapper.vm.$nextTick()

            const optionalRow = wrapper.find('.optional-tags-row')
            expect(optionalRow.exists()).toBe(true)
        })
    })

    describe('Zoomed Layout', () => {
        it('should show zoomed layout when zoom=true', async () => {
            const wrapper = mount(TagFamilyTile, {
                props: {
                    familyName: 'dtags',
                    modelValue: 1,
                    zoom: true
                }
            })

            await wrapper.vm.$nextTick()

            expect(wrapper.find('.tag-family-tile--zoomed').exists()).toBe(true)
            expect(wrapper.find('.tag-family-tile--compact').exists()).toBe(false)
        })

        it('should display grouped blocks in zoomed mode', async () => {
            const wrapper = mount(TagFamilyTile, {
                props: {
                    familyName: 'dtags',
                    modelValue: 0b10001, // Kreisspiele + Raumlauf
                    zoom: true
                }
            })

            await wrapper.vm.$nextTick()

            const blocks = wrapper.findAll('.tag-group-block')
            expect(blocks.length).toBeGreaterThan(0)
        })

        it('should display family description in zoomed mode', async () => {
            const wrapper = mount(TagFamilyTile, {
                props: {
                    familyName: 'dtags',
                    modelValue: 1,
                    zoom: true
                }
            })

            await wrapper.vm.$nextTick()

            expect(wrapper.find('.family-description').exists()).toBe(true)
        })

        it('should show edit button in zoomed mode when enableEdit=true', async () => {
            const wrapper = mount(TagFamilyTile, {
                props: {
                    familyName: 'dtags',
                    modelValue: 1,
                    zoom: true,
                    enableEdit: true
                }
            })

            await wrapper.vm.$nextTick()

            expect(wrapper.find('.edit-button').exists()).toBe(true)
        })
    })

    describe('Zoom Toggle Behavior', () => {
        it('should emit update:zoom when tile is clicked', async () => {
            const wrapper = mount(TagFamilyTile, {
                props: {
                    familyName: 'dtags',
                    modelValue: 1,
                    zoom: false
                }
            })

            await wrapper.vm.$nextTick()

            await wrapper.find('.tag-family-tile').trigger('click')

            expect(wrapper.emitted('update:zoom')).toBeTruthy()
            expect(wrapper.emitted('update:zoom')?.[0]).toEqual([true])
        })

        it('should not toggle zoom when edit button is clicked', async () => {
            const wrapper = mount(TagFamilyTile, {
                props: {
                    familyName: 'dtags',
                    modelValue: 1,
                    zoom: true,
                    enableEdit: true
                }
            })

            await wrapper.vm.$nextTick()

            const editButton = wrapper.find('.edit-button')
            await editButton.trigger('click')

            // Should emit activated, not update:zoom
            expect(wrapper.emitted('activated')).toBeTruthy()
            expect(wrapper.emitted('update:zoom')).toBeFalsy()
        })
    })

    describe('Edit Button', () => {
        it('should show edit button when enableEdit=true and zoomed', async () => {
            const wrapper = mount(TagFamilyTile, {
                props: {
                    familyName: 'dtags',
                    modelValue: 1,
                    zoom: true,
                    enableEdit: true
                }
            })

            await wrapper.vm.$nextTick()

            expect(wrapper.find('.edit-button').exists()).toBe(true)
        })

        it('should not show edit button when enableEdit=false', async () => {
            const wrapper = mount(TagFamilyTile, {
                props: {
                    familyName: 'dtags',
                    modelValue: 1,
                    zoom: true,
                    enableEdit: false
                }
            })

            await wrapper.vm.$nextTick()

            expect(wrapper.find('.edit-button').exists()).toBe(false)
        })

        it('should not show edit button in compact mode', async () => {
            const wrapper = mount(TagFamilyTile, {
                props: {
                    familyName: 'dtags',
                    modelValue: 1,
                    zoom: false,
                    enableEdit: true
                }
            })

            await wrapper.vm.$nextTick()

            expect(wrapper.find('.edit-button').exists()).toBe(false)
        })

        it('should emit activated when edit button clicked', async () => {
            const wrapper = mount(TagFamilyTile, {
                props: {
                    familyName: 'dtags',
                    modelValue: 1,
                    zoom: true,
                    enableEdit: true
                }
            })

            await wrapper.vm.$nextTick()

            await wrapper.find('.edit-button').trigger('click')

            expect(wrapper.emitted('activated')).toBeTruthy()
        })
    })

    describe('Group Filtering', () => {
        it('should show only core groups when groupSelection="core"', async () => {
            const wrapper = mount(TagFamilyTile, {
                props: {
                    familyName: 'dtags',
                    modelValue: 0b1000000000000000000000000000001, // TagGroup 1 + TagGroup 4
                    zoom: true,
                    groupSelection: 'core'
                }
            })

            await wrapper.vm.$nextTick()

            // Should only show TagGroup 1, 2, 3 (core groups)
            const blocks = wrapper.findAll('.tag-group-block')
            expect(blocks.length).toBeLessThanOrEqual(3)
        })

        it('should show only optional groups when groupSelection="options"', async () => {
            const wrapper = mount(TagFamilyTile, {
                props: {
                    familyName: 'dtags',
                    modelValue: 0b1000000000000000000000000000001,
                    zoom: true,
                    groupSelection: 'options'
                }
            })

            await wrapper.vm.$nextTick()

            // Should only show TagGroup 4 (optional group)
            const blocks = wrapper.findAll('.tag-group-block')
            expect(blocks.length).toBeLessThanOrEqual(1)
        })

        it('should show all groups when groupSelection="all"', async () => {
            const wrapper = mount(TagFamilyTile, {
                props: {
                    familyName: 'dtags',
                    modelValue: 0b1000000000000000000000000000001,
                    zoom: true,
                    groupSelection: 'all'
                }
            })

            await wrapper.vm.$nextTick()

            // Should show all active groups
            const blocks = wrapper.findAll('.tag-group-block')
            expect(blocks.length).toBeGreaterThan(0)
        })
    })

    describe('Overflow Handling', () => {
        it('should truncate long tag lists with ellipsis in compact mode', async () => {
            const wrapper = mount(TagFamilyTile, {
                props: {
                    familyName: 'dtags',
                    modelValue: 0b111111111, // Multiple tags
                    zoom: false
                }
            })

            await wrapper.vm.$nextTick()

            const tagDisplay = wrapper.find('.tag-display')
            expect(tagDisplay.exists()).toBe(true)
            // Check for CSS overflow or ellipsis
            expect(tagDisplay.attributes('class')).toContain('overflow')
        })

        it('should show all tags in zoomed mode', async () => {
            const wrapper = mount(TagFamilyTile, {
                props: {
                    familyName: 'dtags',
                    modelValue: 0b111111111,
                    zoom: true
                }
            })

            await wrapper.vm.$nextTick()

            // All tags should be visible in separate blocks
            const blocks = wrapper.findAll('.tag-group-block')
            expect(blocks.length).toBeGreaterThan(1)
        })
    })

    describe('Events', () => {
        it('should emit update:zoom when clicked in compact mode', async () => {
            const wrapper = mount(TagFamilyTile, {
                props: {
                    familyName: 'dtags',
                    modelValue: 1,
                    zoom: false
                }
            })

            await wrapper.vm.$nextTick()
            await wrapper.find('.tag-family-tile').trigger('click')

            expect(wrapper.emitted('update:zoom')).toBeTruthy()
            expect(wrapper.emitted('update:zoom')?.[0]).toEqual([true])
        })

        it('should emit activated when edit button clicked', async () => {
            const wrapper = mount(TagFamilyTile, {
                props: {
                    familyName: 'dtags',
                    modelValue: 1,
                    zoom: true,
                    enableEdit: true
                }
            })

            await wrapper.vm.$nextTick()
            await wrapper.find('.edit-button').trigger('click')

            expect(wrapper.emitted('activated')).toBeTruthy()
        })
    })
})
