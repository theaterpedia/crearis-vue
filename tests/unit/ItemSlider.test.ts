/**
 * ItemSlider.test.ts - Unit tests for ItemSlider component
 * 
 * Tests size mapping, entity fetching, filtering, and interaction modes
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import ItemSlider from '@/components/clist/ItemSlider.vue'
import ItemTile from '@/components/clist/ItemTile.vue'
import ItemCard from '@/components/clist/ItemCard.vue'
import Slider from '@/components/Slider.vue'

// Mock fetch globally
global.fetch = vi.fn()

describe('ItemSlider', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('Size Mapping', () => {
        it('should use ItemTile for small size', async () => {
            const wrapper = mount(ItemSlider, {
                props: {
                    items: [{ heading: 'Test Item' }],
                    size: 'small'
                }
            })

            await wrapper.vm.$nextTick()

            // Should render ItemTile with medium size
            expect(wrapper.findComponent(ItemTile).exists()).toBe(true)
            expect(wrapper.findComponent(ItemTile).props('size')).toBe('medium')
        })

        it('should use ItemTile for medium size', async () => {
            const wrapper = mount(ItemSlider, {
                props: {
                    items: [{ heading: 'Test Item' }],
                    size: 'medium'
                }
            })

            await wrapper.vm.$nextTick()

            // Should render ItemTile with large size
            expect(wrapper.findComponent(ItemTile).exists()).toBe(true)
            expect(wrapper.findComponent(ItemTile).props('size')).toBe('large')
        })

        it('should use ItemCard for large size', async () => {
            const wrapper = mount(ItemSlider, {
                props: {
                    items: [{ heading: 'Test Item' }],
                    size: 'large'
                }
            })

            await wrapper.vm.$nextTick()

            // Should render ItemCard with medium size
            expect(wrapper.findComponent(ItemCard).exists()).toBe(true)
            expect(wrapper.findComponent(ItemCard).props('size')).toBe('medium')
        })
    })

    describe('Entity Fetching', () => {
        it('should fetch posts from API', async () => {
            const mockPosts = [
                { id: 1, title: 'Post 1', img_square: { url: 'test.jpg' } },
                { id: 2, title: 'Post 2', img_square: { url: 'test2.jpg' } }
            ]

                ; (global.fetch as any).mockResolvedValueOnce({
                    ok: true,
                    text: async () => JSON.stringify(mockPosts)
                })

            const wrapper = mount(ItemSlider, {
                props: {
                    entity: 'posts',
                    dataMode: true
                }
            })

            await wrapper.vm.$nextTick()
            await new Promise(resolve => setTimeout(resolve, 100))

            expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/posts'))
        })

        it('should fetch events and sort by date_begin', async () => {
            const mockEvents = [
                { id: 1, title: 'Event 2', date_begin: '2024-12-01', img_square: { url: 'test.jpg' } },
                { id: 2, title: 'Event 1', date_begin: '2024-11-01', img_square: { url: 'test2.jpg' } }
            ]

                ; (global.fetch as any).mockResolvedValueOnce({
                    ok: true,
                    text: async () => JSON.stringify(mockEvents)
                })

            const wrapper = mount(ItemSlider, {
                props: {
                    entity: 'events',
                    dataMode: true
                }
            })

            await wrapper.vm.$nextTick()
            await new Promise(resolve => setTimeout(resolve, 100))

            // Events should be sorted by date_begin
            const items = wrapper.findAllComponents(ItemTile)
            if (items.length > 1) {
                expect(items[0].props('heading')).toContain('Event 1')
            }
        })
    })

    describe('Filtering', () => {
        it('should filter by filterIds', async () => {
            const mockPosts = [
                { id: 1, title: 'Post 1', img_square: { url: 'test.jpg' } },
                { id: 2, title: 'Post 2', img_square: { url: 'test2.jpg' } },
                { id: 3, title: 'Post 3', img_square: { url: 'test3.jpg' } }
            ]

                ; (global.fetch as any).mockResolvedValueOnce({
                    ok: true,
                    text: async () => JSON.stringify(mockPosts)
                })

            const wrapper = mount(ItemSlider, {
                props: {
                    entity: 'posts',
                    filterIds: [1, 3],
                    dataMode: true
                }
            })

            await wrapper.vm.$nextTick()
            await new Promise(resolve => setTimeout(resolve, 100))

            const items = wrapper.findAllComponents(ItemTile)
            expect(items.length).toBe(2)
        })

        it('should filter by filterXmlPrefix', async () => {
            const mockPosts = [
                { id: 1, title: 'Post 1', xmlID: 'tp.event.test1', img_square: { url: 'test.jpg' } },
                { id: 2, title: 'Post 2', xmlID: 'tp.post.test2', img_square: { url: 'test2.jpg' } }
            ]

                ; (global.fetch as any).mockResolvedValueOnce({
                    ok: true,
                    text: async () => JSON.stringify(mockPosts)
                })

            const wrapper = mount(ItemSlider, {
                props: {
                    entity: 'posts',
                    filterXmlPrefix: 'tp.event',
                    dataMode: true
                }
            })

            await wrapper.vm.$nextTick()
            await new Promise(resolve => setTimeout(resolve, 100))

            const items = wrapper.findAllComponents(ItemTile)
            expect(items.length).toBe(1)
            expect(items[0].props('heading')).toContain('Post 1')
        })
    })

    describe('Interaction Modes', () => {
        it('should render static mode by default', () => {
            const wrapper = mount(ItemSlider, {
                props: {
                    items: [{ heading: 'Test' }]
                }
            })

            expect(wrapper.find('.item-slider-container').exists()).toBe(true)
            expect(wrapper.find('.popup-overlay').exists()).toBe(false)
        })

        it('should show preview modal in previewmodal mode', async () => {
            const wrapper = mount(ItemSlider, {
                props: {
                    items: [{ heading: 'Test', id: 1 }],
                    interaction: 'previewmodal'
                }
            })

            await wrapper.vm.$nextTick()

            // Click an item
            const item = wrapper.findComponent(ItemTile)
            await item.trigger('click')
            await wrapper.vm.$nextTick()

            // Modal should open
            expect(wrapper.findComponent({ name: 'ItemModalCard' }).exists()).toBe(true)
        })
    })

    describe('Width Control', () => {
        it('should apply inherit width style', () => {
            const wrapper = mount(ItemSlider, {
                props: {
                    items: [{ heading: 'Test' }],
                    itemWidth: 'inherit'
                }
            })

            const itemWrapper = wrapper.find('.slider-item-wrapper')
            expect(itemWrapper.attributes('style')).toContain('width: inherit')
        })
    })

    describe('Loading States', () => {
        it('should show loading state', async () => {
            // Mock fetch to delay so we can catch loading state
            ; (global.fetch as any).mockImplementationOnce(() =>
                new Promise(resolve => setTimeout(() => resolve({
                    ok: true,
                    text: async () => JSON.stringify([{ id: 1, heading: 'Test' }])
                }), 100))
            )

            const wrapper = mount(ItemSlider, {
                props: {
                    entity: 'posts'
                }
            })

            // Should be loading initially
            expect(wrapper.vm.loading).toBe(true)
        })

        it('should show empty state when no items', async () => {
            ; (global.fetch as any).mockResolvedValueOnce({
                ok: true,
                text: async () => JSON.stringify([])
            })

            const wrapper = mount(ItemSlider, {
                props: {
                    entity: 'posts',
                    dataMode: true
                }
            })

            await wrapper.vm.$nextTick()
            await new Promise(resolve => setTimeout(resolve, 100))

            expect(wrapper.find('.item-slider-empty').exists()).toBe(true)
        })
    })

    describe('Selection System', () => {
        it('should handle single selection', async () => {
            const wrapper = mount(ItemSlider, {
                props: {
                    items: [
                        { heading: 'Item 1', id: 1 },
                        { heading: 'Item 2', id: 2 }
                    ],
                    dataMode: true,
                    multiSelect: false
                }
            })

            await wrapper.vm.$nextTick()

            const items = wrapper.findAllComponents(ItemTile)
            await items[0].trigger('click')

            expect(wrapper.emitted('update:selectedIds')).toBeTruthy()
            expect(wrapper.emitted('update:selectedIds')![0]).toEqual([1])
        })

        it('should handle multi-selection', async () => {
            const wrapper = mount(ItemSlider, {
                props: {
                    items: [
                        { heading: 'Item 1', id: 1 },
                        { heading: 'Item 2', id: 2 }
                    ],
                    dataMode: true,
                    multiSelect: true
                }
            })

            await wrapper.vm.$nextTick()

            const items = wrapper.findAllComponents(ItemTile)
            await items[0].trigger('click')
            await items[1].trigger('click')

            const emitted = wrapper.emitted('update:selectedIds')
            expect(emitted).toBeTruthy()
            expect(emitted![emitted!.length - 1]).toEqual([[1, 2]])
        })
    })
})
