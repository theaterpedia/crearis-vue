/**
 * pSlider.test.ts - Unit tests for pSlider wrapper component
 * 
 * Tests prop forwarding, interaction modes, and CSS customization
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import pSlider from '@/components/page/pSlider.vue'
import ItemSlider from '@/components/clist/ItemSlider.vue'
import Heading from '@/components/Heading.vue'
import ItemModalCard from '@/components/clist/ItemModalCard.vue'

// Mock vue-router
const mockPush = vi.fn()
const mockRouter = {
    push: mockPush,
    replace: vi.fn(),
    go: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    currentRoute: { value: { path: '/', params: {}, query: {} } },
    options: { history: { state: {} } },
    resolve: vi.fn((to) => ({ path: typeof to === 'string' ? to : to.path }))
}

vi.mock('vue-router', () => ({
    useRouter: () => mockRouter
}))

describe('pSlider', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })
    describe('Props Forwarding', () => {
        it('should forward entity prop to ItemSlider', () => {
            const wrapper = mount(pSlider, {
                props: {
                    entity: 'posts'
                }
            })

            const itemSlider = wrapper.findComponent(ItemSlider)
            expect(itemSlider.exists()).toBe(true)
            expect(itemSlider.props('entity')).toBe('posts')
        })

        it('should forward filter props to ItemSlider', () => {
            const wrapper = mount(pSlider, {
                props: {
                    entity: 'events',
                    filterIds: [1, 2, 3],
                    filterXmlPrefix: 'tp.event'
                }
            })

            const itemSlider = wrapper.findComponent(ItemSlider)
            expect(itemSlider.props('filterIds')).toEqual([1, 2, 3])
            expect(itemSlider.props('filterXmlPrefix')).toBe('tp.event')
        })

        it('should forward size, shape, and anatomy props', () => {
            const wrapper = mount(pSlider, {
                props: {
                    entity: 'posts',
                    size: 'large',
                    shape: 'wide',
                    anatomy: 'heroimage'
                }
            })

            const itemSlider = wrapper.findComponent(ItemSlider)
            expect(itemSlider.props('size')).toBe('large')
            expect(itemSlider.props('shape')).toBe('wide')
            expect(itemSlider.props('anatomy')).toBe('heroimage')
        })
    })

    describe('Header Display', () => {
        it('should show header when provided', () => {
            const wrapper = mount(pSlider, {
                props: {
                    entity: 'posts',
                    header: 'Latest Posts',
                    isFooter: true // showHeader requires isAside or isFooter
                }
            })

            const heading = wrapper.findComponent(Heading)
            expect(heading.exists()).toBe(true)
            expect(heading.props('headline')).toBe('Latest Posts')
        })

        it('should not show header when not provided', () => {
            const wrapper = mount(pSlider, {
                props: {
                    entity: 'posts'
                }
            })

            expect(wrapper.findComponent(Heading).exists()).toBe(false)
        })

        it('should use h4 for aside variant', async () => {
            const wrapper = mount(pSlider, {
                props: {
                    entity: 'posts',
                    header: 'Posts',
                    isAside: true
                }
            })

            await wrapper.vm.$nextTick()
            const heading = wrapper.findComponent(Heading)
            expect(heading.exists()).toBe(true)
            expect(heading.props('is')).toBe('h4')
        })

        it('should use h3 for footer variant', async () => {
            const wrapper = mount(pSlider, {
                props: {
                    entity: 'posts',
                    header: 'Posts',
                    isFooter: true
                }
            })

            await wrapper.vm.$nextTick()
            const heading = wrapper.findComponent(Heading)
            expect(heading.exists()).toBe(true)
            expect(heading.props('is')).toBe('h3')
        })
    })

    describe('Interaction Modes', () => {
        it('should use previewmodal interaction when onActivate=modal', () => {
            const wrapper = mount(pSlider, {
                props: {
                    entity: 'posts',
                    onActivate: 'modal'
                }
            })

            const itemSlider = wrapper.findComponent(ItemSlider)
            expect(itemSlider.props('interaction')).toBe('previewmodal')
        })

        it('should use static interaction when onActivate=route', () => {
            const wrapper = mount(pSlider, {
                props: {
                    entity: 'posts',
                    onActivate: 'route',
                    routePath: '/posts/:id'
                }
            })

            const itemSlider = wrapper.findComponent(ItemSlider)
            expect(itemSlider.props('interaction')).toBe('static')
        })

        it('should handle item click for route navigation', async () => {
            const wrapper = mount(pSlider, {
                props: {
                    entity: 'posts',
                    onActivate: 'route',
                    routePath: '/posts/:id'
                }
            })

            const itemSlider = wrapper.findComponent(ItemSlider)

            // Simulate item click
            itemSlider.vm.$emit('item-click', { id: 123, title: 'Test Post' })
            await wrapper.vm.$nextTick()

            // Route modal should be shown
            const modal = wrapper.findComponent({ name: 'ItemModalCard' })
            expect(modal.exists()).toBe(true)
        })
    })

    describe('CSS Variants', () => {
        it('should apply aside class when isAside=true', () => {
            const wrapper = mount(pSlider, {
                props: {
                    entity: 'posts',
                    isAside: true
                }
            })

            expect(wrapper.find('.p-slider').classes()).toContain('is-aside')
        })

        it('should apply footer class when isFooter=true', () => {
            const wrapper = mount(pSlider, {
                props: {
                    entity: 'posts',
                    isFooter: true
                }
            })

            expect(wrapper.find('.p-slider').classes()).toContain('is-footer')
        })
    })

    describe('Modal Options', () => {
        it('should use default heroimage anatomy for modal', () => {
            const wrapper = mount(pSlider, {
                props: {
                    entity: 'posts',
                    onActivate: 'route',
                    routePath: '/posts/:id'
                }
            })

            // Trigger item click to show modal
            const itemSlider = wrapper.findComponent(ItemSlider)
            itemSlider.vm.$emit('item-click', { id: 1, title: 'Test' })

            // Check computed modalOptionsWithDefaults
            expect((wrapper.vm as any).modalOptionsWithDefaults.anatomy).toBe('heroimage')
        })

        it('should use custom modal anatomy when provided', () => {
            const wrapper = mount(pSlider, {
                props: {
                    entity: 'posts',
                    onActivate: 'route',
                    routePath: '/posts/:id',
                    modalOptions: {
                        anatomy: 'fullimage'
                    }
                }
            })

            expect((wrapper.vm as any).modalOptionsWithDefaults.anatomy).toBe('fullimage')
        })
    })

    describe('Route Navigation', () => {
        it('should build route path with item ID', async () => {
            const wrapper = mount(pSlider, {
                props: {
                    entity: 'posts',
                    onActivate: 'route',
                    routePath: '/posts/:id'
                },
                global: {
                    stubs: {
                        ItemModalCard: false,
                        ItemSlider: {
                            template: '<div></div>',
                            emits: ['item-click']
                        }
                    }
                }
            })

                // Set selected item directly
                ; (wrapper.vm as any).selectedItem = { id: 456, title: 'Test' }

                // Call navigateToRoute directly
                ; (wrapper.vm as any).navigateToRoute()

            expect(mockPush).toHaveBeenCalledWith('/posts/456')
        })
    })
})
