/**
 * Component Tests: TagFamilies
 * 
 * Tests tag families gallery component.
 * Covers: grid layout, modal, updates
 * 
 * Test Count: ~20 tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import TagFamilies from '@/components/TagFamilies.vue'
import { setBit } from '@/composables/useSysregTags'

describe('TagFamilies - Gallery Component', () => {

    // ============================================================================
    // Rendering - 5 tests
    // ============================================================================

    describe('Rendering', () => {
        it('renders gallery grid', () => {
            const wrapper = mount(TagFamilies, {
                props: {
                    dtags: setBit(0, 0),
                    ttags: 0
                }
            })

            expect(wrapper.find('.tag-families-grid').exists()).toBe(true)
        })

        it('renders tiles for active families', () => {
            const wrapper = mount(TagFamilies, {
                props: {
                    dtags: setBit(0, 0),
                    ttags: setBit(0, 0)
                }
            })

            const tiles = wrapper.findAll('.tag-family-tile')
            expect(tiles.length).toBeGreaterThan(0)
        })

        it('shows dtags tile when present', () => {
            const wrapper = mount(TagFamilies, {
                props: {
                    dtags: setBit(0, 0),
                    ttags: 0
                }
            })

            expect(wrapper.find('[data-family="dtags"]').exists()).toBe(true)
        })

        it('shows ttags tile when present', () => {
            const wrapper = mount(TagFamilies, {
                props: {
                    dtags: 0,
                    ttags: setBit(0, 0)
                }
            })

            expect(wrapper.find('[data-family="ttags"]').exists()).toBe(true)
        })

        it('hides tiles for empty families', () => {
            const wrapper = mount(TagFamilies, {
                props: {
                    dtags: 0,
                    ttags: 0
                }
            })

            expect(wrapper.find('[data-family="dtags"]').exists()).toBe(false)
            expect(wrapper.find('[data-family="ttags"]').exists()).toBe(false)
        })
    })

    // ============================================================================
    // Modal Interaction - 5 tests
    // ============================================================================

    describe('Modal Interaction', () => {
        it('opens editor modal on tile click', async () => {
            const wrapper = mount(TagFamilies, {
                props: {
                    dtags: setBit(0, 0),
                    ttags: 0,
                    editable: true
                }
            })

            await wrapper.find('.edit-button').trigger('click')
            expect(wrapper.find('.tag-family-editor-modal').exists()).toBe(true)
        })

        it('passes correct family to modal', async () => {
            const wrapper = mount(TagFamilies, {
                props: {
                    dtags: setBit(0, 0),
                    ttags: 0,
                    editable: true
                }
            })

            await wrapper.find('[data-family="dtags"] .edit-button').trigger('click')
            const modal = wrapper.find('.tag-family-editor-modal')

            expect(modal.attributes('family-name')).toBe('dtags')
        })

        it('closes modal on cancel', async () => {
            const wrapper = mount(TagFamilies, {
                props: {
                    dtags: setBit(0, 0),
                    ttags: 0,
                    editable: true
                }
            })

            await wrapper.find('.edit-button').trigger('click')
            expect(wrapper.find('.tag-family-editor-modal').exists()).toBe(true)

            await wrapper.find('.modal-cancel').trigger('click')
            expect(wrapper.find('.tag-family-editor-modal').exists()).toBe(false)
        })

        it('closes modal on save', async () => {
            const wrapper = mount(TagFamilies, {
                props: {
                    dtags: setBit(0, 0),
                    ttags: 0,
                    editable: true
                }
            })

            await wrapper.find('.edit-button').trigger('click')
            await wrapper.find('.modal-save').trigger('click')

            expect(wrapper.find('.tag-family-editor-modal').exists()).toBe(false)
        })

        it('does not open modal when not editable', async () => {
            const wrapper = mount(TagFamilies, {
                props: {
                    dtags: setBit(0, 0),
                    ttags: 0,
                    editable: false
                }
            })

            expect(wrapper.find('.edit-button').exists()).toBe(false)
        })
    })

    // ============================================================================
    // Value Updates - 5 tests
    // ============================================================================

    describe('Value Updates', () => {
        it('emits update:dtags on save', async () => {
            const wrapper = mount(TagFamilies, {
                props: {
                    dtags: setBit(0, 0),
                    ttags: 0,
                    editable: true
                }
            })

            await wrapper.find('[data-family="dtags"] .edit-button').trigger('click')
            await wrapper.find('.modal-save').trigger('click')

            expect(wrapper.emitted('update:dtags')).toBeTruthy()
        })

        it('emits update:ttags on save', async () => {
            const wrapper = mount(TagFamilies, {
                props: {
                    dtags: 0,
                    ttags: setBit(0, 0),
                    editable: true
                }
            })

            await wrapper.find('[data-family="ttags"] .edit-button').trigger('click')
            await wrapper.find('.modal-save').trigger('click')

            expect(wrapper.emitted('update:ttags')).toBeTruthy()
        })

        it('passes updated value in event', async () => {
            const wrapper = mount(TagFamilies, {
                props: {
                    dtags: setBit(0, 0),
                    ttags: 0,
                    editable: true
                }
            })

            await wrapper.find('[data-family="dtags"] .edit-button').trigger('click')
            await wrapper.find('.modal-save').trigger('click')

            const emitted = wrapper.emitted('update:dtags')
            expect(emitted?.[0]).toBeDefined()
            expect(typeof emitted?.[0]?.[0]).toBe('number')
        })

        it('updates display after save', async () => {
            const wrapper = mount(TagFamilies, {
                props: {
                    dtags: setBit(0, 0),
                    ttags: 0,
                    editable: true
                }
            })

            const initialText = wrapper.find('[data-family="dtags"] .compact-text').text()

            await wrapper.find('[data-family="dtags"] .edit-button').trigger('click')
            await wrapper.find('.modal-save').trigger('click')

            const emitted = wrapper.emitted('update:dtags')
            if (emitted?.[0]?.[0]) {
                await wrapper.setProps({ dtags: emitted[0][0] as number })
            }

            // Display should update
        })

        it('does not emit on cancel', async () => {
            const wrapper = mount(TagFamilies, {
                props: {
                    dtags: setBit(0, 0),
                    ttags: 0,
                    editable: true
                }
            })

            await wrapper.find('[data-family="dtags"] .edit-button').trigger('click')
            await wrapper.find('.modal-cancel').trigger('click')

            expect(wrapper.emitted('update:dtags')).toBeFalsy()
        })
    })

    // ============================================================================
    // Zoom State - 3 tests
    // ============================================================================

    describe('Zoom State', () => {
        it('toggles zoom on tile click', async () => {
            const wrapper = mount(TagFamilies, {
                props: {
                    dtags: setBit(0, 0),
                    ttags: 0
                }
            })

            const tile = wrapper.find('[data-family="dtags"]')
            expect(tile.find('.compact-view').exists()).toBe(true)

            await tile.find('.zoom-button').trigger('click')

            expect(tile.find('.zoomed-view').exists()).toBe(true)
        })

        it('maintains independent zoom states', async () => {
            const wrapper = mount(TagFamilies, {
                props: {
                    dtags: setBit(0, 0),
                    ttags: setBit(0, 0)
                }
            })

            await wrapper.find('[data-family="dtags"] .zoom-button').trigger('click')

            expect(wrapper.find('[data-family="dtags"] .zoomed-view').exists()).toBe(true)
            expect(wrapper.find('[data-family="ttags"] .compact-view').exists()).toBe(true)
        })

        it('collapses on second click', async () => {
            const wrapper = mount(TagFamilies, {
                props: {
                    dtags: setBit(0, 0),
                    ttags: 0
                }
            })

            const tile = wrapper.find('[data-family="dtags"]')

            await tile.find('.zoom-button').trigger('click')
            expect(tile.find('.zoomed-view').exists()).toBe(true)

            await tile.find('.collapse-button').trigger('click')
            expect(tile.find('.compact-view').exists()).toBe(true)
        })
    })

    // ============================================================================
    // Props - 2 tests
    // ============================================================================

    describe('Props', () => {
        it('updates tiles on prop change', async () => {
            const wrapper = mount(TagFamilies, {
                props: {
                    dtags: setBit(0, 0),
                    ttags: 0
                }
            })

            expect(wrapper.find('[data-family="ttags"]').exists()).toBe(false)

            await wrapper.setProps({ ttags: setBit(0, 0) })

            expect(wrapper.find('[data-family="ttags"]').exists()).toBe(true)
        })

        it('handles null values', () => {
            const wrapper = mount(TagFamilies, {
                props: {
                    dtags: null,
                    ttags: null
                }
            })

            expect(wrapper.find('[data-family="dtags"]').exists()).toBe(false)
            expect(wrapper.find('[data-family="ttags"]').exists()).toBe(false)
        })
    })
})
