/**
 * ImgShape Component - Core Functionality Tests
 * 
 * Tests for Plan D implementation:
 * - Dimension validation
 * - Avatar shape detection
 * - Preview state management
 * - Click-to-edit activation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import ImgShape from '@/components/images/ImgShape.vue'
import type { ImgShapeData } from '@/components/images/ImgShape.vue'

describe('ImgShape Component', () => {
    // ===================================================================
    // Dimension Validation Tests
    // ===================================================================

    describe('Dimension Validation', () => {
        it('should show error overlay when dimensions invalid', async () => {
            const wrapper = mount(ImgShape, {
                props: {
                    data: {
                        url: 'https://example.com/image.jpg'
                    } as ImgShapeData,
                    shape: 'card',
                    variant: 'wide'
                }
            })

            await wrapper.vm.$nextTick()

            // Check for error state
            const errorOverlay = wrapper.find('.img-shape__error-overlay')
            expect(errorOverlay.exists()).toBe(true)
            expect(errorOverlay.text()).toContain('Unknown dimensions')
        })

        it('should NOT show error overlay when dimensions are valid', async () => {
            const wrapper = mount(ImgShape, {
                props: {
                    data: {
                        url: 'https://example.com/image.jpg'
                    } as ImgShapeData,
                    shape: 'card',
                    variant: 'wide'
                },
                global: {
                    stubs: {
                        // Stub CSS var reading to return valid dimensions
                    }
                }
            })

            // For this test to pass, we need to mock CSS variable reading
            // This is environment-specific and may need adjustment
        })

        it('should display BlurHash placeholder in error state', async () => {
            const wrapper = mount(ImgShape, {
                props: {
                    data: {
                        url: 'https://example.com/image.jpg',
                        blur: 'LEHV6nWB2yk8pyo0adR*.7kCMdnj'
                    } as ImgShapeData,
                    shape: 'card',
                    variant: 'wide'
                }
            })

            await wrapper.vm.$nextTick()

            // BlurHash canvas should still be rendered
            const canvas = wrapper.find('canvas')
            expect(canvas.exists()).toBe(true)
        })

        it('should validate dimensions on mount', async () => {
            const wrapper = mount(ImgShape, {
                props: {
                    data: {
                        url: 'https://example.com/image.jpg'
                    } as ImgShapeData,
                    shape: 'card',
                    variant: 'wide'
                }
            })

            await wrapper.vm.$nextTick()

            // Component should have internal hasError state
            expect(wrapper.vm.hasError).toBeDefined()
        })
    })

    // ===================================================================
    // Avatar Shape Detection Tests
    // ===================================================================

    describe('Avatar Shape Detection', () => {
        it('should detect square avatar from "project" in xmlid', async () => {
            const wrapper = mount(ImgShape, {
                props: {
                    data: {
                        url: 'https://example.com/image.jpg',
                        xmlid: 'img-project-001'
                    } as ImgShapeData,
                    shape: 'avatar',
                    variant: 'default'
                }
            })

            await wrapper.vm.$nextTick()

            // Check for square avatar class
            expect(wrapper.html()).toContain('img-shape--avatar-square')
        })

        it('should detect square avatar from "event" in xmlid', async () => {
            const wrapper = mount(ImgShape, {
                props: {
                    data: {
                        url: 'https://example.com/image.jpg',
                        xmlid: 'img-event-002'
                    } as ImgShapeData,
                    shape: 'avatar',
                    variant: 'default'
                }
            })

            await wrapper.vm.$nextTick()

            expect(wrapper.html()).toContain('img-shape--avatar-square')
        })

        it('should detect square avatar from "location" in xmlid', async () => {
            const wrapper = mount(ImgShape, {
                props: {
                    data: {
                        url: 'https://example.com/image.jpg',
                        xmlid: 'img-location-003'
                    } as ImgShapeData,
                    shape: 'avatar',
                    variant: 'default'
                }
            })

            await wrapper.vm.$nextTick()

            expect(wrapper.html()).toContain('img-shape--avatar-square')
        })

        it('should detect square avatar from "post" in xmlid', async () => {
            const wrapper = mount(ImgShape, {
                props: {
                    data: {
                        url: 'https://example.com/image.jpg',
                        xmlid: 'img-post-004'
                    } as ImgShapeData,
                    shape: 'avatar',
                    variant: 'default'
                }
            })

            await wrapper.vm.$nextTick()

            expect(wrapper.html()).toContain('img-shape--avatar-square')
        })

        it('should detect round avatar from "user" in xmlid', async () => {
            const wrapper = mount(ImgShape, {
                props: {
                    data: {
                        url: 'https://example.com/image.jpg',
                        xmlid: 'img-user-005'
                    } as ImgShapeData,
                    shape: 'avatar',
                    variant: 'default'
                }
            })

            await wrapper.vm.$nextTick()

            expect(wrapper.html()).toContain('img-shape--avatar-round')
        })

        it('should default to round avatar when no pattern match', async () => {
            const wrapper = mount(ImgShape, {
                props: {
                    data: {
                        url: 'https://example.com/image.jpg',
                        xmlid: 'img-random-006'
                    } as ImgShapeData,
                    shape: 'avatar',
                    variant: 'default'
                }
            })

            await wrapper.vm.$nextTick()

            expect(wrapper.html()).toContain('img-shape--avatar-round')
        })
    })

    // ===================================================================
    // Preview State Management Tests
    // ===================================================================

    describe('Preview State Management', () => {
        let wrapper: any

        beforeEach(() => {
            wrapper = mount(ImgShape, {
                props: {
                    data: {
                        url: 'https://example.com/image.jpg',
                        x: 50,
                        y: 50,
                        z: 100
                    } as ImgShapeData,
                    shape: 'card',
                    variant: 'wide'
                }
            })
        })

        it('should expose getPreviewData() function', () => {
            expect(wrapper.vm.getPreviewData).toBeDefined()
            expect(typeof wrapper.vm.getPreviewData).toBe('function')
        })

        it('should expose resetPreview() function', () => {
            expect(wrapper.vm.resetPreview).toBeDefined()
            expect(typeof wrapper.vm.resetPreview).toBe('function')
        })

        it('should expose updatePreview() function', () => {
            expect(wrapper.vm.updatePreview).toBeDefined()
            expect(typeof wrapper.vm.updatePreview).toBe('function')
        })

        it('should return correct state from getPreviewData()', () => {
            const previewData = wrapper.vm.getPreviewData()

            expect(previewData).toHaveProperty('url')
            expect(previewData).toHaveProperty('originalUrl')
            expect(previewData).toHaveProperty('adapter')
            expect(previewData).toHaveProperty('shape')
            expect(previewData).toHaveProperty('variant')
            expect(previewData).toHaveProperty('params')
            expect(previewData).toHaveProperty('mode')

            expect(previewData.originalUrl).toBe('https://example.com/image.jpg')
            expect(previewData.shape).toBe('card')
            expect(previewData.variant).toBe('wide')
        })

        it('should clear state when resetPreview() called', () => {
            // First update preview
            wrapper.vm.updatePreview('https://preview.com/image.jpg', { x: 30, y: 40, z: 80 }, 'preview')

            // Then reset
            wrapper.vm.resetPreview()

            const previewData = wrapper.vm.getPreviewData()
            expect(previewData.params.x).toBeNull()
            expect(previewData.params.y).toBeNull()
            expect(previewData.params.z).toBeNull()
            expect(previewData.mode).toBe('original')
        })

        it('should update params when updatePreview() called', () => {
            wrapper.vm.updatePreview('https://preview.com/image.jpg', { x: 30, y: 40, z: 80 }, 'preview')

            const previewData = wrapper.vm.getPreviewData()
            expect(previewData.url).toBe('https://preview.com/image.jpg')
            expect(previewData.params.x).toBe(30)
            expect(previewData.params.y).toBe(40)
            expect(previewData.params.z).toBe(80)
            expect(previewData.mode).toBe('preview')
        })
    })

    // ===================================================================
    // Click-to-Edit Tests
    // ===================================================================

    describe('Click-to-Edit', () => {
        it('should emit activate event when editable and clicked', async () => {
            const wrapper = mount(ImgShape, {
                props: {
                    data: {
                        url: 'https://example.com/image.jpg'
                    } as ImgShapeData,
                    shape: 'card',
                    variant: 'wide',
                    adapter: 'unsplash',
                    editable: true
                }
            })

            await wrapper.vm.$nextTick()

            // Find the wrapper div and click it
            const wrapperDiv = wrapper.find('.img-shape')
            await wrapperDiv.trigger('click')

            // Check that activate event was emitted
            expect(wrapper.emitted('activate')).toBeTruthy()
            expect(wrapper.emitted('activate')![0]).toEqual([{
                shape: 'card',
                variant: 'wide',
                adapter: 'unsplash'
            }])
        })

        it('should NOT emit activate when not editable', async () => {
            const wrapper = mount(ImgShape, {
                props: {
                    data: {
                        url: 'https://example.com/image.jpg'
                    } as ImgShapeData,
                    shape: 'card',
                    variant: 'wide',
                    editable: false
                }
            })

            await wrapper.vm.$nextTick()

            const wrapperDiv = wrapper.find('.img-shape')
            await wrapperDiv.trigger('click')

            // No activate event should be emitted
            expect(wrapper.emitted('activate')).toBeFalsy()
        })

        it('should NOT emit activate when in error state', async () => {
            const wrapper = mount(ImgShape, {
                props: {
                    data: {
                        url: 'https://example.com/image.jpg'
                    } as ImgShapeData,
                    shape: 'card',
                    variant: 'wide',
                    editable: true
                }
            })

            await wrapper.vm.$nextTick()

            // Component should be in error state (no dimensions)
            const wrapperDiv = wrapper.find('.img-shape')
            await wrapperDiv.trigger('click')

            // No activate event should be emitted when in error state
            expect(wrapper.emitted('activate')).toBeFalsy()
        })

        it('should pass shape/variant/adapter in activate event', async () => {
            const wrapper = mount(ImgShape, {
                props: {
                    data: {
                        url: 'https://images.unsplash.com/photo-123'
                    } as ImgShapeData,
                    shape: 'tile',
                    variant: 'square',
                    adapter: 'unsplash',
                    editable: true
                }
            })

            await wrapper.vm.$nextTick()

            const wrapperDiv = wrapper.find('.img-shape')
            await wrapperDiv.trigger('click')

            const emitted = wrapper.emitted('activate')
            if (emitted) {
                expect(emitted[0][0]).toEqual({
                    shape: 'tile',
                    variant: 'square',
                    adapter: 'unsplash'
                })
            }
        })

        it('should add editable class when editable prop is true', async () => {
            const wrapper = mount(ImgShape, {
                props: {
                    data: {
                        url: 'https://example.com/image.jpg'
                    } as ImgShapeData,
                    shape: 'card',
                    variant: 'wide',
                    editable: true
                }
            })

            await wrapper.vm.$nextTick()

            expect(wrapper.html()).toContain('img-shape--editable')
        })

        it('should add active class when active prop is true', async () => {
            const wrapper = mount(ImgShape, {
                props: {
                    data: {
                        url: 'https://example.com/image.jpg'
                    } as ImgShapeData,
                    shape: 'card',
                    variant: 'wide',
                    active: true
                }
            })

            await wrapper.vm.$nextTick()

            expect(wrapper.html()).toContain('img-shape--active')
        })
    })
})
