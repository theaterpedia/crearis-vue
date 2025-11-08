/**
 * ImgShape Component Core Tests
 * 
 * Tests dimension validation, avatar shape detection,
 * preview state management, and click-to-edit behavior
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setupCSSVariableMocks, setWrapperDimensions, STANDARD_DIMENSIONS, mockUseTheme, setMockThemeDimensions, resetMockThemeDimensions } from '../utils/test-helpers'

// Mock the useTheme composable so ImgShape receives stable dimensions during tests
vi.mock('@/composables/useTheme', () => ({
    useTheme: mockUseTheme
}))

import ImgShape from '@/components/images/ImgShape.vue'
import type { ImgShapeData } from '@/components/images/ImgShape.vue'

// Sample test data
const sampleImageData: ImgShapeData = {
    type: 'url',
    url: 'https://images.unsplash.com/photo-1234567890',
    xmlid: 'img-project-001',
    blur: 'LEHV6nWB2yk8pyo0adR*.7kCMdnj',
    tpar: 'fit=crop&w={W}&h={H}',
    turl: null,
    x: null,
    y: null,
    z: null
}

let cleanupCSS: (() => void) | null = null

beforeEach(() => {
    cleanupCSS = setupCSSVariableMocks()
})

afterEach(() => {
    if (cleanupCSS) {
        cleanupCSS()
        cleanupCSS = null
    }
})

describe('ImgShape Component', () => {

    // ===================================================================
    // Dimension Validation Tests
    // ===================================================================

    describe('Dimension Validation', () => {
        it('should render BlurHash placeholder when in error state', async () => {
            const wrapper = mount(ImgShape, {
                props: {
                    data: sampleImageData,
                    shape: 'card',
                    variant: 'wide'
                }
            })

            await wrapper.vm.$nextTick()

            // Should have placeholder image
            const placeholder = wrapper.find('.img-shape-placeholder')
            expect(placeholder.exists()).toBe(true)
        })

        it('should validate dimensions on mount', async () => {
            const wrapper = mount(ImgShape, {
                props: {
                    data: sampleImageData,
                    shape: 'card',
                    variant: 'wide'
                }
            })

            // Set dimensions to avoid error state
            setWrapperDimensions(wrapper, STANDARD_DIMENSIONS)

            await wrapper.vm.$nextTick()

            // Component should not be in error state
            expect(wrapper.find('.error-overlay').exists()).toBe(false)
        })

        it('should show error overlay when dimensions are invalid', async () => {
            // Simulate invalid/missing theme dimensions by changing the mocked theme
            setMockThemeDimensions({ cardWidth: 0, cardHeight: 0, tileWidth: 0, tileHeight: 0, avatarWidth: 0 })

            const wrapper = mount(ImgShape, {
                props: {
                    data: sampleImageData,
                    shape: 'card',
                    variant: 'wide'
                }
            })

            await wrapper.vm.$nextTick()

            const errorOverlay = wrapper.find('.error-overlay')
            expect(errorOverlay.exists()).toBe(true)
            expect(errorOverlay.text()).toContain('Image-Shape-Error')

            // Restore mocked theme dims
            resetMockThemeDimensions()
        })

        it('should not show error overlay when dimensions are valid', async () => {
            const wrapper = mount(ImgShape, {
                props: {
                    data: sampleImageData,
                    shape: 'card',
                    variant: 'wide'
                }
            })

            // Set inline styles to provide dimensions
            setWrapperDimensions(wrapper, STANDARD_DIMENSIONS)

            await wrapper.vm.$nextTick()

            const errorOverlay = wrapper.find('.error-overlay')
            expect(errorOverlay.exists()).toBe(false)
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

            // Set avatar dimensions
            setWrapperDimensions(wrapper, STANDARD_DIMENSIONS)

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

            setWrapperDimensions(wrapper, STANDARD_DIMENSIONS)
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

            setWrapperDimensions(wrapper, STANDARD_DIMENSIONS)
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

            setWrapperDimensions(wrapper, STANDARD_DIMENSIONS)
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

            setWrapperDimensions(wrapper, STANDARD_DIMENSIONS)
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

            setWrapperDimensions(wrapper, STANDARD_DIMENSIONS)
            await wrapper.vm.$nextTick()

            expect(wrapper.html()).toContain('img-shape--avatar-round')
        })
    })

    // ===================================================================
    // Preview State Management Tests
    // ===================================================================

    describe('Preview State Management', () => {
        let wrapper: any

        beforeEach(async () => {
            wrapper = mount(ImgShape, {
                props: {
                    data: sampleImageData,
                    shape: 'card',
                    variant: 'wide'
                }
            })

            setWrapperDimensions(wrapper, STANDARD_DIMENSIONS)
            await wrapper.vm.$nextTick()
        })

        it('should expose getPreviewData function', () => {
            expect(wrapper.vm.getPreviewData).toBeDefined()
            expect(typeof wrapper.vm.getPreviewData).toBe('function')
        })

        it('should expose resetPreview function', () => {
            expect(wrapper.vm.resetPreview).toBeDefined()
            expect(typeof wrapper.vm.resetPreview).toBe('function')
        })

        it('should expose updatePreview function', () => {
            expect(wrapper.vm.updatePreview).toBeDefined()
            expect(typeof wrapper.vm.updatePreview).toBe('function')
        })

        it('should return correct preview state from getPreviewData', () => {
            const previewData = wrapper.vm.getPreviewData()

            expect(previewData).toHaveProperty('url')
            expect(previewData).toHaveProperty('params')
            expect(previewData.params).toHaveProperty('x')
            expect(previewData.params).toHaveProperty('y')
            expect(previewData.params).toHaveProperty('z')
        })

        it('should clear preview state when resetPreview is called', () => {
            // Set preview state
            wrapper.vm.updatePreview('https://example.com/preview.jpg', { x: 50, y: 50, z: 1.5 }, 'preview')

            // Reset it
            wrapper.vm.resetPreview()

            // Verify it's cleared
            const previewData = wrapper.vm.getPreviewData()
            expect(previewData.params.x).toBeNull()
            expect(previewData.params.y).toBeNull()
            expect(previewData.params.z).toBeNull()
        })

        it('should update params when updatePreview is called', () => {
            wrapper.vm.updatePreview('https://example.com/updated.jpg', { x: 25, y: 75, z: 2.0 }, 'preview')

            const previewData = wrapper.vm.getPreviewData()
            expect(previewData.params.x).toBe(25)
            expect(previewData.params.y).toBe(75)
            expect(previewData.params.z).toBe(2.0)
        })
    })

    // ===================================================================
    // Click-to-Edit Tests
    // ===================================================================

    describe('Click-to-Edit Behavior', () => {
        it('should emit activate event when clicked and editable', async () => {
            const wrapper = mount(ImgShape, {
                props: {
                    data: {
                        ...sampleImageData,
                        url: 'https://images.unsplash.com/photo-test'
                    },
                    shape: 'card',
                    variant: 'wide',
                    adapter: 'detect',  // Will detect 'unsplash' from URL
                    editable: true
                }
            })

            setWrapperDimensions(wrapper, STANDARD_DIMENSIONS)
            await wrapper.vm.$nextTick()
            await wrapper.vm.$nextTick() // Extra tick for reactivity

            // Debug: Check component state
            expect(wrapper.vm.hasError).toBe(false)

            const wrapperDiv = wrapper.find('.img-shape-wrapper')
            expect(wrapperDiv.exists()).toBe(true)

            await wrapperDiv.trigger('click')

            expect(wrapper.emitted('activate')).toBeTruthy()
            expect(wrapper.emitted('activate')![0]).toEqual([{
                shape: 'card',
                variant: 'wide',
                adapter: 'unsplash'  // Detected from URL
            }])
        })

        it('should NOT emit activate when not editable', async () => {
            const wrapper = mount(ImgShape, {
                props: {
                    data: sampleImageData,
                    shape: 'card',
                    variant: 'wide',
                    editable: false
                }
            })

            setWrapperDimensions(wrapper, STANDARD_DIMENSIONS)
            await wrapper.vm.$nextTick()

            const wrapperDiv = wrapper.find('.img-shape-wrapper')
            await wrapperDiv.trigger('click')

            expect(wrapper.emitted('activate')).toBeFalsy()
        })

        it('should NOT emit activate when in error state', async () => {
            // Simulate invalid/missing theme dims so component enters error state
            setMockThemeDimensions({ cardWidth: 0, cardHeight: 0, tileWidth: 0, tileHeight: 0, avatarWidth: 0 })
            const wrapper = mount(ImgShape, {
                props: {
                    data: sampleImageData,
                    shape: 'card',
                    variant: 'wide',
                    editable: true
                }
            })

            await wrapper.vm.$nextTick()

            const wrapperDiv = wrapper.find('.img-shape-wrapper')
            await wrapperDiv.trigger('click')

            expect(wrapper.emitted('activate')).toBeFalsy()

            // Reset theme dims to avoid leaking to other tests
            resetMockThemeDimensions()
        })

        it('should pass shape/variant/adapter in activate event', async () => {
            const wrapper = mount(ImgShape, {
                props: {
                    data: {
                        ...sampleImageData,
                        url: 'https://res.cloudinary.com/test/image'
                    },
                    shape: 'tile',
                    variant: 'square',
                    adapter: 'detect',  // Will detect 'cloudinary' from URL
                    editable: true
                }
            })

            setWrapperDimensions(wrapper, STANDARD_DIMENSIONS)
            await wrapper.vm.$nextTick()

            const wrapperDiv = wrapper.find('.img-shape-wrapper')
            await wrapperDiv.trigger('click')

            const emitted = wrapper.emitted('activate')
            expect(emitted).toBeTruthy()
            expect(emitted![0][0]).toEqual({
                shape: 'tile',
                variant: 'square',
                adapter: 'cloudinary'  // Detected from URL
            })
        })

        it('should add editable class when editable prop is true', async () => {
            const wrapper = mount(ImgShape, {
                props: {
                    data: sampleImageData,
                    shape: 'card',
                    variant: 'wide',
                    editable: true
                }
            })

            setWrapperDimensions(wrapper, STANDARD_DIMENSIONS)
            await wrapper.vm.$nextTick()

            expect(wrapper.html()).toContain('editable')
        })

        it('should add active class when active prop is true', async () => {
            const wrapper = mount(ImgShape, {
                props: {
                    data: sampleImageData,
                    shape: 'card',
                    variant: 'wide',
                    editable: true,
                    active: true
                }
            })

            setWrapperDimensions(wrapper, STANDARD_DIMENSIONS)
            await wrapper.vm.$nextTick()

            expect(wrapper.html()).toContain('active')
        })
    })
})
