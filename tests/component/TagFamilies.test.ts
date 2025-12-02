/**
 * TagFamilies Component Tests
 * 
 * Tests the tag families gallery component for displaying multiple tag family tiles
 * 
 * Test Categories:
 * 1. Basic Rendering
 * 2. Multiple Family Display
 * 3. Editor Modal Management
 * 4. v-model Updates
 * 5. enableEdit Handling
 * 6. Layout Variants
 * 7. Events
 */

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import TagFamilies from '@/components/sysreg/TagFamilies.vue'
import { setupMockSysregApi } from '../helpers/sysreg-mock-api'

describe('TagFamilies Component', () => {
    beforeEach(() => {
        setupMockSysregApi()
    })

    describe('Basic Rendering', () => {
        it('should render with no families', () => {
            const wrapper = mount(TagFamilies, {
                props: {}
            })

            expect(wrapper.find('.tag-families').exists()).toBe(true)
            expect(wrapper.findAll('.tag-family-tile').length).toBe(0)
        })

        it('should only render provided families', async () => {
            const wrapper = mount(TagFamilies, {
                props: {
                    ttags: 1,
                    dtags: 1
                }
            })

            await wrapper.vm.$nextTick()

            const tiles = wrapper.findAll('.tag-family-tile')
            expect(tiles.length).toBe(2)
        })

        it('should not render undefined families', async () => {
            const wrapper = mount(TagFamilies, {
                props: {
                    ttags: 1,
                    ctags: undefined,
                    dtags: 1
                }
            })

            await wrapper.vm.$nextTick()

            const tiles = wrapper.findAll('.tag-family-tile')
            expect(tiles.length).toBe(2)
        })
    })

    describe('Multiple Family Display', () => {
        it('should render all 6 families when provided', async () => {
            const wrapper = mount(TagFamilies, {
                props: {
                    status: 1,
                    config: 1,
                    rtags: 1,
                    ttags: 1,
                    ctags: 1,
                    dtags: 1
                }
            })

            await wrapper.vm.$nextTick()

            const tiles = wrapper.findAll('.tag-family-tile')
            expect(tiles.length).toBe(6)
        })

        it('should pass correct familyName to each tile', async () => {
            const wrapper = mount(TagFamilies, {
                props: {
                    ttags: 1,
                    dtags: 1
                }
            })

            await wrapper.vm.$nextTick()

            const tiles = wrapper.findAll('.tag-family-tile')
            expect(tiles[0].props('familyName')).toBe('ttags')
            expect(tiles[1].props('familyName')).toBe('dtags')
        })

        it('should pass modelValue to each tile', async () => {
            const wrapper = mount(TagFamilies, {
                props: {
                    ttags: 42,
                    dtags: 123
                }
            })

            await wrapper.vm.$nextTick()

            const tiles = wrapper.findAll('.tag-family-tile')
            expect(tiles[0].props('modelValue')).toBe(42)
            expect(tiles[1].props('modelValue')).toBe(123)
        })
    })

    describe('Editor Modal Management', () => {
        it('should not show editor initially', () => {
            const wrapper = mount(TagFamilies, {
                props: {
                    ttags: 1,
                    enableEdit: true
                }
            })

            expect(wrapper.find('.tag-family-editor').exists()).toBe(false)
        })

        it('should open editor when tile emits activated', async () => {
            const wrapper = mount(TagFamilies, {
                props: {
                    ttags: 1,
                    enableEdit: true
                }
            })

            await wrapper.vm.$nextTick()

            const tile = wrapper.findComponent({ name: 'TagFamilyTile' })
            await tile.vm.$emit('activated')
            await wrapper.vm.$nextTick()

            expect(wrapper.find('.tag-family-editor').exists()).toBe(true)
        })

        it('should close editor when save is clicked', async () => {
            const wrapper = mount(TagFamilies, {
                props: {
                    ttags: 1,
                    enableEdit: true
                }
            })

            await wrapper.vm.$nextTick()

            // Open editor
            const tile = wrapper.findComponent({ name: 'TagFamilyTile' })
            await tile.vm.$emit('activated')
            await wrapper.vm.$nextTick()

            // Close editor
            const editor = wrapper.findComponent({ name: 'TagFamilyEditor' })
            await editor.vm.$emit('save', 42)
            await wrapper.vm.$nextTick()

            expect(wrapper.find('.tag-family-editor').exists()).toBe(false)
        })

        it('should close editor when cancel is clicked', async () => {
            const wrapper = mount(TagFamilies, {
                props: {
                    ttags: 1,
                    enableEdit: true
                }
            })

            await wrapper.vm.$nextTick()

            // Open editor
            const tile = wrapper.findComponent({ name: 'TagFamilyTile' })
            await tile.vm.$emit('activated')
            await wrapper.vm.$nextTick()

            // Cancel editor
            const editor = wrapper.findComponent({ name: 'TagFamilyEditor' })
            await editor.vm.$emit('cancel')
            await wrapper.vm.$nextTick()

            expect(wrapper.find('.tag-family-editor').exists()).toBe(false)
        })
    })

    describe('v-model Updates', () => {
        it('should emit update:ttags when ttags changes', async () => {
            const wrapper = mount(TagFamilies, {
                props: {
                    ttags: 1,
                    enableEdit: true
                }
            })

            await wrapper.vm.$nextTick()

            // Open editor and save with new value
            const tile = wrapper.findComponent({ name: 'TagFamilyTile' })
            await tile.vm.$emit('activated')
            await wrapper.vm.$nextTick()

            const editor = wrapper.findComponent({ name: 'TagFamilyEditor' })
            await editor.vm.$emit('save', 42)

            expect(wrapper.emitted('update:ttags')).toBeTruthy()
            expect(wrapper.emitted('update:ttags')?.[0]).toEqual([42])
        })

        it('should emit update:dtags when dtags changes', async () => {
            const wrapper = mount(TagFamilies, {
                props: {
                    dtags: 1,
                    enableEdit: true
                }
            })

            await wrapper.vm.$nextTick()

            // Open editor and save with new value
            const tile = wrapper.findComponent({ name: 'TagFamilyTile' })
            await tile.vm.$emit('activated')
            await wrapper.vm.$nextTick()

            const editor = wrapper.findComponent({ name: 'TagFamilyEditor' })
            await editor.vm.$emit('save', 123)

            expect(wrapper.emitted('update:dtags')).toBeTruthy()
            expect(wrapper.emitted('update:dtags')?.[0]).toEqual([123])
        })

        it('should not emit update when editor is cancelled', async () => {
            const wrapper = mount(TagFamilies, {
                props: {
                    ttags: 1,
                    enableEdit: true
                }
            })

            await wrapper.vm.$nextTick()

            // Open editor and cancel
            const tile = wrapper.findComponent({ name: 'TagFamilyTile' })
            await tile.vm.$emit('activated')
            await wrapper.vm.$nextTick()

            const editor = wrapper.findComponent({ name: 'TagFamilyEditor' })
            await editor.vm.$emit('cancel')

            expect(wrapper.emitted('update:ttags')).toBeFalsy()
        })
    })

    describe('enableEdit Handling', () => {
        it('should pass enableEdit=true when enableEdit=true', async () => {
            const wrapper = mount(TagFamilies, {
                props: {
                    ttags: 1,
                    dtags: 1,
                    enableEdit: true
                }
            })

            await wrapper.vm.$nextTick()

            const tiles = wrapper.findAllComponents({ name: 'TagFamilyTile' })
            tiles.forEach(tile => {
                expect(tile.props('enableEdit')).toBe(true)
            })
        })

        it('should pass enableEdit=false when enableEdit=false', async () => {
            const wrapper = mount(TagFamilies, {
                props: {
                    ttags: 1,
                    dtags: 1,
                    enableEdit: false
                }
            })

            await wrapper.vm.$nextTick()

            const tiles = wrapper.findAllComponents({ name: 'TagFamilyTile' })
            tiles.forEach(tile => {
                expect(tile.props('enableEdit')).toBe(false)
            })
        })

        it('should enable specific families when enableEdit is array', async () => {
            const wrapper = mount(TagFamilies, {
                props: {
                    ttags: 1,
                    ctags: 1,
                    dtags: 1,
                    enableEdit: ['ttags', 'dtags']
                }
            })

            await wrapper.vm.$nextTick()

            const tiles = wrapper.findAllComponents({ name: 'TagFamilyTile' })
            expect(tiles[0].props('enableEdit')).toBe(true) // ttags
            expect(tiles[1].props('enableEdit')).toBe(false) // ctags
            expect(tiles[2].props('enableEdit')).toBe(true) // dtags
        })
    })

    describe('Layout Variants', () => {
        it('should apply row layout class', () => {
            const wrapper = mount(TagFamilies, {
                props: {
                    ttags: 1,
                    layout: 'row'
                }
            })

            expect(wrapper.find('.tag-families').classes()).toContain('layout-row')
        })

        it('should apply wrap layout class', () => {
            const wrapper = mount(TagFamilies, {
                props: {
                    ttags: 1,
                    layout: 'wrap'
                }
            })

            expect(wrapper.find('.tag-families').classes()).toContain('layout-wrap')
        })

        it('should apply vertical layout class', () => {
            const wrapper = mount(TagFamilies, {
                props: {
                    ttags: 1,
                    layout: 'vertical'
                }
            })

            expect(wrapper.find('.tag-families').classes()).toContain('layout-vertical')
        })

        it('should default to row layout', () => {
            const wrapper = mount(TagFamilies, {
                props: {
                    ttags: 1
                }
            })

            expect(wrapper.find('.tag-families').classes()).toContain('layout-row')
        })
    })

    describe('Events', () => {
        it('should emit status:activated when status tile is clicked', async () => {
            const wrapper = mount(TagFamilies, {
                props: {
                    status: 1
                }
            })

            await wrapper.vm.$nextTick()

            const tile = wrapper.findComponent({ name: 'TagFamilyTile' })
            await tile.vm.$emit('activated')

            expect(wrapper.emitted('status:activated')).toBeTruthy()
        })

        it('should emit config:activated when config tile is clicked', async () => {
            const wrapper = mount(TagFamilies, {
                props: {
                    config: 1
                }
            })

            await wrapper.vm.$nextTick()

            const tile = wrapper.findComponent({ name: 'TagFamilyTile' })
            await tile.vm.$emit('activated')

            expect(wrapper.emitted('config:activated')).toBeTruthy()
        })

        it('should not emit activated events for editable families', async () => {
            const wrapper = mount(TagFamilies, {
                props: {
                    ttags: 1,
                    enableEdit: true
                }
            })

            await wrapper.vm.$nextTick()

            const tile = wrapper.findComponent({ name: 'TagFamilyTile' })
            await tile.vm.$emit('activated')

            expect(wrapper.emitted('ttags:activated')).toBeFalsy()
        })
    })

    describe('Group Selection', () => {
        it('should pass groupSelection to all tiles', async () => {
            const wrapper = mount(TagFamilies, {
                props: {
                    ttags: 1,
                    dtags: 1,
                    groupSelection: 'core'
                }
            })

            await wrapper.vm.$nextTick()

            const tiles = wrapper.findAllComponents({ name: 'TagFamilyTile' })
            tiles.forEach(tile => {
                expect(tile.props('groupSelection')).toBe('core')
            })
        })

        it('should default to "all" groupSelection', async () => {
            const wrapper = mount(TagFamilies, {
                props: {
                    ttags: 1
                }
            })

            await wrapper.vm.$nextTick()

            const tile = wrapper.findComponent({ name: 'TagFamilyTile' })
            expect(tile.props('groupSelection')).toBe('all')
        })
    })
})
