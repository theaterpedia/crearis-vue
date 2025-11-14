import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import ItemGallery from '@/components/clist/ItemGallery.vue'
import { nextTick } from 'vue'

// Mock fetch for API calls
global.fetch = vi.fn()

describe('ItemGallery - Event Sorting', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('Sort by date_begin ascending', () => {
        it('sorts events by date_begin with earliest first', async () => {
            const mockEvents = [
                { id: 3, name: 'Event C', date_begin: '2025-12-15', img_square: '{"url":"test.jpg"}' },
                { id: 1, name: 'Event A', date_begin: '2025-11-10', img_square: '{"url":"test.jpg"}' },
                { id: 2, name: 'Event B', date_begin: '2025-11-20', img_square: '{"url":"test.jpg"}' }
            ]

                ; (global.fetch as any).mockResolvedValueOnce({
                    ok: true,
                    json: async () => mockEvents
                })

            const wrapper = mount(ItemGallery, {
                props: {
                    entity: 'events',
                    dataMode: true
                }
            })

            await nextTick()
            await new Promise(resolve => setTimeout(resolve, 100))

            const items = wrapper.vm.entities
            expect(items[0].id).toBe(1) // Event A - earliest
            expect(items[1].id).toBe(2) // Event B - middle
            expect(items[2].id).toBe(3) // Event C - latest
        })

        it('places events with null date_begin at the end', async () => {
            const mockEvents = [
                { id: 2, name: 'Event B', date_begin: '2025-11-20', img_square: '{"url":"test.jpg"}' },
                { id: 4, name: 'Event No Date', date_begin: null, img_square: '{"url":"test.jpg"}' },
                { id: 1, name: 'Event A', date_begin: '2025-11-10', img_square: '{"url":"test.jpg"}' },
                { id: 3, name: 'Event Another No Date', date_begin: null, img_square: '{"url":"test.jpg"}' }
            ]

                ; (global.fetch as any).mockResolvedValueOnce({
                    ok: true,
                    json: async () => mockEvents
                })

            const wrapper = mount(ItemGallery, {
                props: {
                    entity: 'events',
                    dataMode: true
                }
            })

            await nextTick()
            await new Promise(resolve => setTimeout(resolve, 100))

            const items = wrapper.vm.entities
            expect(items[0].id).toBe(1) // Event A - has date
            expect(items[1].id).toBe(2) // Event B - has date
            expect(items[2].id).toBe(4) // Event No Date - null
            expect(items[3].id).toBe(3) // Event Another No Date - null
        })
    })

    describe('Only sorts events entity', () => {
        it('does not sort posts by date', async () => {
            const mockPosts = [
                { id: 3, name: 'Post C', date_begin: '2025-12-15', img_square: '{"url":"test.jpg"}' },
                { id: 1, name: 'Post A', date_begin: '2025-11-10', img_square: '{"url":"test.jpg"}' },
                { id: 2, name: 'Post B', date_begin: '2025-11-20', img_square: '{"url":"test.jpg"}' }
            ]

                ; (global.fetch as any).mockResolvedValueOnce({
                    ok: true,
                    json: async () => mockPosts
                })

            const wrapper = mount(ItemGallery, {
                props: {
                    entity: 'posts',
                    dataMode: true
                }
            })

            await nextTick()
            await new Promise(resolve => setTimeout(resolve, 100))

            const items = wrapper.vm.entities
            // Posts should maintain original order from API
            expect(items[0].id).toBe(3)
            expect(items[1].id).toBe(1)
            expect(items[2].id).toBe(2)
        })
    })

    describe('Edge cases', () => {
        it('handles empty events array', async () => {
            ; (global.fetch as any).mockResolvedValueOnce({
                ok: true,
                json: async () => []
            })

            const wrapper = mount(ItemGallery, {
                props: {
                    entity: 'events',
                    dataMode: true
                }
            })

            await nextTick()
            await new Promise(resolve => setTimeout(resolve, 100))

            expect(wrapper.vm.entities).toEqual([])
        })
    })
})
