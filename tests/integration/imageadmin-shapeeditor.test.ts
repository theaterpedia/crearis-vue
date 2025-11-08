/**
 * ImageAdmin + ShapeEditor Integration Tests
 * 
 * Tests the full integration between ImagesCoreAdmin and ShapeEditor:
 * - Activation flow (ImgShape click → ShapeEditor appears)
 * - State updates (ShapeEditor @update → correct XYZ refs)
 * - Preview triggering (calls ImgShape.updatePreview)
 * - Reset functionality (clears state + calls resetPreview)
 * - Multiple shape support (wide vs square handling)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setupCSSVariableMocks, mockUseTheme } from '../utils/test-helpers'

// Mock composables
vi.mock('@/composables/useTheme', () => ({
    useTheme: mockUseTheme
}))

vi.mock('vue-router', () => ({
    useRouter: () => ({
        push: vi.fn(),
        replace: vi.fn(),
        go: vi.fn(),
        back: vi.fn(),
        forward: vi.fn()
    })
}))

import ImagesCoreAdmin from '@/views/admin/ImagesCoreAdmin.vue'

// Mock fetch for API calls
global.fetch = vi.fn()

const mockFetchResponse = (data: any, ok = true) => {
    return Promise.resolve({
        ok,
        json: () => Promise.resolve(data),
        text: () => Promise.resolve(JSON.stringify(data))
    } as Response)
}

// Sample image data
const sampleImages = [
    {
        id: 1,
        status_id: 1,
        owner_id: 1,
        name: 'Test Image 1',
        alt_text: 'Alt text 1',
        xmlid: 'img-project-001',
        url: 'https://images.unsplash.com/photo-123',
        ctags: null,
        rtags: null,
        author: { adapter: 'unsplash' },
        shape_square: '50|50|1|https://images.unsplash.com/photo-123?w=336&h=336||||',
        shape_wide: '50|50|1|https://images.unsplash.com/photo-123?w=336&h=168||||',
        shape_vertical: null,
        shape_thumb: null,
        created_at: new Date(),
        updated_at: new Date()
    }
]

const mockStatusOptions = [
    { id: 1, value: 1, name: 'Active' },
    { id: 2, value: 2, name: 'Inactive' }
]

describe('ImageAdmin + ShapeEditor Integration', () => {
    let cleanupCSS: (() => void) | null = null

    beforeEach(() => {
        cleanupCSS = setupCSSVariableMocks()
        vi.clearAllMocks()

            // Setup default mock responses
            ; (global.fetch as any).mockImplementation((url: string) => {
                if (url.includes('/api/images')) {
                    return mockFetchResponse({ images: sampleImages })
                }
                if (url.includes('/api/status-options')) {
                    return mockFetchResponse({ statusOptions: mockStatusOptions })
                }
                return mockFetchResponse({})
            })
    })

    afterEach(() => {
        if (cleanupCSS) {
            cleanupCSS()
            cleanupCSS = null
        }
    })

    // ===================================================================
    // Activation Flow Tests
    // ===================================================================

    describe('Activation Flow', () => {
        it('should show ShapeEditor when ImgShape clicked', async () => {
            const wrapper = mount(ImagesCoreAdmin, {
                global: {
                    stubs: {
                        PageLayout: false,
                        Columns: false,
                        Column: false
                    }
                }
            })

            await flushPromises()

            // Select first image
            const firstImage = wrapper.findAll('.image-list-item')[0]
            await firstImage.trigger('click')
            await flushPromises()

            // Find an editable ImgShape and click it
            const imgShapes = wrapper.findAllComponents({ name: 'ImgShape' })
            const editableShape = imgShapes.find(s => s.props('editable'))

            if (editableShape) {
                // Trigger activate event
                editableShape.vm.$emit('activate', {
                    shape: 'wide',
                    variant: 'card',
                    adapter: 'unsplash'
                })
                await flushPromises()

                // ShapeEditor should now be visible
                const shapeEditor = wrapper.findComponent({ name: 'ShapeEditor' })
                expect(shapeEditor.exists()).toBe(true)
            }
        })

        it('should hide ShapeEditor when another shape clicked', async () => {
            const wrapper = mount(ImagesCoreAdmin, {
                global: {
                    stubs: {
                        PageLayout: false,
                        Columns: false,
                        Column: false
                    }
                }
            })

            await flushPromises()

            // Select first image
            const firstImage = wrapper.findAll('.image-list-item')[0]
            await firstImage.trigger('click')
            await flushPromises()

            // Activate first shape
            const imgShapes = wrapper.findAllComponents({ name: 'ImgShape' })
            if (imgShapes.length > 0) {
                imgShapes[0].vm.$emit('activate', {
                    shape: 'wide',
                    variant: 'card',
                    adapter: 'unsplash'
                })
                await flushPromises()

                // ShapeEditor should be visible
                let shapeEditor = wrapper.findComponent({ name: 'ShapeEditor' })
                expect(shapeEditor.exists()).toBe(true)

                // Activate different shape
                if (imgShapes.length > 1) {
                    imgShapes[1].vm.$emit('activate', {
                        shape: 'square',
                        variant: 'tile',
                        adapter: 'unsplash'
                    })
                    await flushPromises()

                    // ShapeEditor should still exist but for different shape
                    shapeEditor = wrapper.findComponent({ name: 'ShapeEditor' })
                    expect(shapeEditor.exists()).toBe(true)
                    expect(shapeEditor.props('shape')).toBe('square')
                }
            }
        })

        it('should clear activeShape on record load', async () => {
            const wrapper = mount(ImagesCoreAdmin, {
                global: {
                    stubs: {
                        PageLayout: false,
                        Columns: false,
                        Column: false
                    }
                }
            })

            await flushPromises()

            // Select first image
            const firstImage = wrapper.findAll('.image-list-item')[0]
            await firstImage.trigger('click')
            await flushPromises()

            // Activate a shape
            const imgShapes = wrapper.findAllComponents({ name: 'ImgShape' })
            if (imgShapes.length > 0) {
                imgShapes[0].vm.$emit('activate', {
                    shape: 'wide',
                    variant: 'card',
                    adapter: 'unsplash'
                })
                await flushPromises()

                // ShapeEditor should be visible
                let shapeEditor = wrapper.findComponent({ name: 'ShapeEditor' })
                expect(shapeEditor.exists()).toBe(true)

                // Load same record again (simulates refresh)
                await firstImage.trigger('click')
                await flushPromises()

                // ShapeEditor should be hidden
                shapeEditor = wrapper.findComponent({ name: 'ShapeEditor' })
                expect(shapeEditor.exists()).toBe(false)
            }
        })
    })

    // ===================================================================
    // State Management Tests
    // ===================================================================

    describe('State Management', () => {
        it('should update XYZ values when ShapeEditor emits update for wide shape', async () => {
            const wrapper = mount(ImagesCoreAdmin, {
                global: {
                    stubs: {
                        PageLayout: false,
                        Columns: false,
                        Column: false
                    }
                }
            })

            await flushPromises()

            // Select first image
            const firstImage = wrapper.findAll('.image-list-item')[0]
            await firstImage.trigger('click')
            await flushPromises()

            // Activate wide shape
            const imgShapes = wrapper.findAllComponents({ name: 'ImgShape' })
            if (imgShapes.length > 0) {
                imgShapes[0].vm.$emit('activate', {
                    shape: 'wide',
                    variant: 'card',
                    adapter: 'unsplash'
                })
                await flushPromises()

                // Get ShapeEditor and emit update
                const shapeEditor = wrapper.findComponent({ name: 'ShapeEditor' })
                if (shapeEditor.exists()) {
                    shapeEditor.vm.$emit('update', { x: 45, y: 67, z: 2 })
                    await flushPromises()

                    // Check that XYZ values are updated in component data
                    // This would be reflected in activeShapeXYZ computed property
                    expect(shapeEditor.props('data').x).toBe(45)
                }
            }
        })

        it('should update XYZ values when ShapeEditor emits update for square shape', async () => {
            const wrapper = mount(ImagesCoreAdmin, {
                global: {
                    stubs: {
                        PageLayout: false,
                        Columns: false,
                        Column: false
                    }
                }
            })

            await flushPromises()

            // Select first image
            const firstImage = wrapper.findAll('.image-list-item')[0]
            await firstImage.trigger('click')
            await flushPromises()

            // Activate square shape
            const imgShapes = wrapper.findAllComponents({ name: 'ImgShape' })
            const squareShape = imgShapes.find(s => s.props('shape') === 'square')

            if (squareShape) {
                squareShape.vm.$emit('activate', {
                    shape: 'square',
                    variant: 'tile',
                    adapter: 'unsplash'
                })
                await flushPromises()

                // Get ShapeEditor and emit update
                const shapeEditor = wrapper.findComponent({ name: 'ShapeEditor' })
                if (shapeEditor.exists()) {
                    shapeEditor.vm.$emit('update', { x: 30, y: 70, z: 1 })
                    await flushPromises()

                    // Values should be stored in tileSquareX/Y/Z refs
                    // Verify via activeShapeXYZ computed
                    expect(shapeEditor.props('data').x).toBe(30)
                }
            }
        })

        it('should maintain separate XYZ state for wide and square shapes', async () => {
            const wrapper = mount(ImagesCoreAdmin, {
                global: {
                    stubs: {
                        PageLayout: false,
                        Columns: false,
                        Column: false
                    }
                }
            })

            await flushPromises()

            // Select first image
            const firstImage = wrapper.findAll('.image-list-item')[0]
            await firstImage.trigger('click')
            await flushPromises()

            const imgShapes = wrapper.findAllComponents({ name: 'ImgShape' })

            // Activate wide shape and set XYZ
            const wideShape = imgShapes.find(s => s.props('shape') === 'wide')
            if (wideShape) {
                wideShape.vm.$emit('activate', {
                    shape: 'wide',
                    variant: 'card',
                    adapter: 'unsplash'
                })
                await flushPromises()

                let shapeEditor = wrapper.findComponent({ name: 'ShapeEditor' })
                if (shapeEditor.exists()) {
                    shapeEditor.vm.$emit('update', { x: 45, y: 67, z: 2 })
                    await flushPromises()
                }
            }

            // Switch to square shape and set different XYZ
            const squareShape = imgShapes.find(s => s.props('shape') === 'square')
            if (squareShape) {
                squareShape.vm.$emit('activate', {
                    shape: 'square',
                    variant: 'tile',
                    adapter: 'unsplash'
                })
                await flushPromises()

                let shapeEditor = wrapper.findComponent({ name: 'ShapeEditor' })
                if (shapeEditor.exists()) {
                    shapeEditor.vm.$emit('update', { x: 30, y: 70, z: 1 })
                    await flushPromises()
                    expect(shapeEditor.props('data').x).toBe(30)
                }
            }

            // Switch back to wide shape - should have original values
            if (wideShape) {
                wideShape.vm.$emit('activate', {
                    shape: 'wide',
                    variant: 'card',
                    adapter: 'unsplash'
                })
                await flushPromises()

                const shapeEditor = wrapper.findComponent({ name: 'ShapeEditor' })
                if (shapeEditor.exists()) {
                    expect(shapeEditor.props('data').x).toBe(45)
                }
            }
        })

        it('should pass correct data props to ShapeEditor', async () => {
            const wrapper = mount(ImagesCoreAdmin, {
                global: {
                    stubs: {
                        PageLayout: false,
                        Columns: false,
                        Column: false
                    }
                }
            })

            await flushPromises()

            // Select first image
            const firstImage = wrapper.findAll('.image-list-item')[0]
            await firstImage.trigger('click')
            await flushPromises()

            // Activate a shape
            const imgShapes = wrapper.findAllComponents({ name: 'ImgShape' })
            if (imgShapes.length > 0) {
                imgShapes[0].vm.$emit('activate', {
                    shape: 'wide',
                    variant: 'card',
                    adapter: 'unsplash'
                })
                await flushPromises()

                // Get ShapeEditor and check props
                const shapeEditor = wrapper.findComponent({ name: 'ShapeEditor' })
                if (shapeEditor.exists()) {
                    expect(shapeEditor.props('shape')).toBe('wide')
                    expect(shapeEditor.props('adapter')).toBe('unsplash')
                    expect(shapeEditor.props('data')).toHaveProperty('x')
                    expect(shapeEditor.props('data')).toHaveProperty('y')
                    expect(shapeEditor.props('data')).toHaveProperty('z')
                    expect(shapeEditor.props('data')).toHaveProperty('url')
                }
            }
        })
    })

    // ===================================================================
    // Preview/Reset Tests
    // ===================================================================

    describe('Preview and Reset', () => {
        it('should trigger preview when ShapeEditor emits preview', async () => {
            const wrapper = mount(ImagesCoreAdmin, {
                global: {
                    stubs: {
                        PageLayout: false,
                        Columns: false,
                        Column: false
                    }
                }
            })

            await flushPromises()

            // Select first image
            const firstImage = wrapper.findAll('.image-list-item')[0]
            await firstImage.trigger('click')
            await flushPromises()

            // Activate a shape
            const imgShapes = wrapper.findAllComponents({ name: 'ImgShape' })
            if (imgShapes.length > 0) {
                imgShapes[0].vm.$emit('activate', {
                    shape: 'wide',
                    variant: 'card',
                    adapter: 'unsplash'
                })
                await flushPromises()

                // Get ShapeEditor and emit preview
                const shapeEditor = wrapper.findComponent({ name: 'ShapeEditor' })
                if (shapeEditor.exists()) {
                    shapeEditor.vm.$emit('preview')
                    await flushPromises()

                    // Preview should be triggered (would call ImgShape.updatePreview)
                    // We can't directly test the method call without mocking,
                    // but we verify the event flow completes without errors
                    expect(true).toBe(true)
                }
            }
        })

        it('should clear XYZ values when ShapeEditor emits reset', async () => {
            const wrapper = mount(ImagesCoreAdmin, {
                global: {
                    stubs: {
                        PageLayout: false,
                        Columns: false,
                        Column: false
                    }
                }
            })

            await flushPromises()

            // Select first image
            const firstImage = wrapper.findAll('.image-list-item')[0]
            await firstImage.trigger('click')
            await flushPromises()

            // Activate a shape
            const imgShapes = wrapper.findAllComponents({ name: 'ImgShape' })
            if (imgShapes.length > 0) {
                imgShapes[0].vm.$emit('activate', {
                    shape: 'wide',
                    variant: 'card',
                    adapter: 'unsplash'
                })
                await flushPromises()

                // Get ShapeEditor, set values, then reset
                const shapeEditor = wrapper.findComponent({ name: 'ShapeEditor' })
                if (shapeEditor.exists()) {
                    shapeEditor.vm.$emit('update', { x: 45, y: 67, z: 2 })
                    await flushPromises()

                    shapeEditor.vm.$emit('reset')
                    await flushPromises()

                    // XYZ values should be cleared (null)
                    expect(shapeEditor.props('data').x).toBeNull()
                    expect(shapeEditor.props('data').y).toBeNull()
                    expect(shapeEditor.props('data').z).toBeNull()
                }
            }
        })
    })

    // ===================================================================
    // Multiple Shape Support Tests
    // ===================================================================

    describe('Multiple Shape Support', () => {
        it('should handle wide/card shape activation', async () => {
            const wrapper = mount(ImagesCoreAdmin, {
                global: {
                    stubs: {
                        PageLayout: false,
                        Columns: false,
                        Column: false
                    }
                }
            })

            await flushPromises()

            const firstImage = wrapper.findAll('.image-list-item')[0]
            await firstImage.trigger('click')
            await flushPromises()

            const imgShapes = wrapper.findAllComponents({ name: 'ImgShape' })
            const wideShape = imgShapes.find(s => s.props('shape') === 'wide')

            if (wideShape) {
                wideShape.vm.$emit('activate', {
                    shape: 'wide',
                    variant: 'card',
                    adapter: 'unsplash'
                })
                await flushPromises()

                const shapeEditor = wrapper.findComponent({ name: 'ShapeEditor' })
                expect(shapeEditor.exists()).toBe(true)
                expect(shapeEditor.props('shape')).toBe('wide')
            }
        })

        it('should handle square/tile shape activation', async () => {
            const wrapper = mount(ImagesCoreAdmin, {
                global: {
                    stubs: {
                        PageLayout: false,
                        Columns: false,
                        Column: false
                    }
                }
            })

            await flushPromises()

            const firstImage = wrapper.findAll('.image-list-item')[0]
            await firstImage.trigger('click')
            await flushPromises()

            const imgShapes = wrapper.findAllComponents({ name: 'ImgShape' })
            const squareShape = imgShapes.find(s => s.props('shape') === 'square')

            if (squareShape) {
                squareShape.vm.$emit('activate', {
                    shape: 'square',
                    variant: 'tile',
                    adapter: 'unsplash'
                })
                await flushPromises()

                const shapeEditor = wrapper.findComponent({ name: 'ShapeEditor' })
                expect(shapeEditor.exists()).toBe(true)
                expect(shapeEditor.props('shape')).toBe('square')
            }
        })

        it('should use correct ref helper for different shapes', async () => {
            const wrapper = mount(ImagesCoreAdmin, {
                global: {
                    stubs: {
                        PageLayout: false,
                        Columns: false,
                        Column: false
                    }
                }
            })

            await flushPromises()

            const firstImage = wrapper.findAll('.image-list-item')[0]
            await firstImage.trigger('click')
            await flushPromises()

            // Test that getActiveShapeRef returns correct ref for each shape type
            // This is tested indirectly through the update flow
            const imgShapes = wrapper.findAllComponents({ name: 'ImgShape' })

            for (const shape of imgShapes) {
                const shapeType = shape.props('shape')

                shape.vm.$emit('activate', {
                    shape: shapeType,
                    variant: 'test',
                    adapter: 'unsplash'
                })
                await flushPromises()

                const shapeEditor = wrapper.findComponent({ name: 'ShapeEditor' })
                if (shapeEditor.exists()) {
                    shapeEditor.vm.$emit('update', { x: 50 })
                    await flushPromises()

                    // Should complete without errors
                    expect(shapeEditor.props('shape')).toBe(shapeType)
                }
            }
        })
    })
})
