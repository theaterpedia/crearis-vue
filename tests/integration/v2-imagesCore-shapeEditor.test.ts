/**
 * Integration Tests v2: ImagesCoreAdmin + ShapeEditor
 * 
 * Tests the refactored ViewMode architecture and Phase 6/7 integration:
 * - ViewMode transitions (browse → core → shape)
 * - Dirty detection system (core + shape modes)
 * - Edit behavior (autosave/autocancel/prompt)
 * - Facade field binding (img_* vs shape_*)
 * - Hero preview with device mockups
 * - Shape isolation (wide vs square state)
 * - Z-value conversion logic (NEW)
 * - Single source of truth (ShapeEditor calculates, ImgShape displays) (NEW)
 * - Preview URL update bug fix (NEW)
 * - Image loading bug fix (NEW)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setupCSSVariableMocks, mockUseTheme } from '../utils/test-helpers'
import ImagesCoreAdmin from '@/views/admin/ImagesCoreAdmin.vue'
import type { IImageAdminRecord } from '@/types/database-types'

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
  }),
  useRoute: () => ({
    path: '/admin/images',
    query: {},
    params: {}
  })
}))

// Mock alert for happy-dom environment
global.alert = vi.fn()

// Mock fetch for API calls
const mockFetchResponse = (data: any, ok = true) => {
  return Promise.resolve({
    ok,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data))
  } as Response)
}

const mockImageData: IImageAdminRecord = {
  img_id: 1,
  img_name: 'test-image',
  img_title: 'Test Image',
  img_caption: 'Test Caption',
  img_category: 'test',
  img_tags: [],
  img_credits: null,
  img_license: null,
  img_uploader_id: 1,
  img_upload_date: new Date().toISOString(),
  img_file_ext: 'jpg',
  img_adapter: 'unsplash',
  img_external_id: 'photo-123',
  img_base_url: 'https://images.unsplash.com/photo-123',
  img_updated: new Date().toISOString(),
  wide_x: null,
  wide_y: null,
  wide_z: null,
  wide_url: 'https://images.unsplash.com/photo-123',
  wide_tpar: null,
  wide_turl: null,
  wide_json: null,
  wide_blur: null,
  square_x: null,
  square_y: null,
  square_z: null,
  square_url: 'https://images.unsplash.com/photo-123',
  square_tpar: null,
  square_turl: null,
  square_json: null,
  square_blur: null,
  vertical_x: null,
  vertical_y: null,
  vertical_z: null,
  vertical_url: null,
  vertical_tpar: null,
  vertical_turl: null,
  vertical_json: null,
  vertical_blur: null,
  thumb_x: null,
  thumb_y: null,
  thumb_z: null,
  thumb_url: 'https://images.unsplash.com/photo-123',
  thumb_tpar: null,
  thumb_turl: null,
  thumb_json: null,
  thumb_blur: null
}

describe('ImagesCoreAdmin + ShapeEditor Integration v2', () => {
  let cleanupCSS: (() => void) | null = null

  beforeEach(() => {
    cleanupCSS = setupCSSVariableMocks()
    vi.clearAllMocks()

    // Setup default mock responses
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/images')) {
        return mockFetchResponse({ images: [] })
      }
      if (url.includes('/api/status-options')) {
        return mockFetchResponse({ statusOptions: [] })
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

  describe('ViewMode Transitions', () => {
    it('should start in browse mode', () => {
      const wrapper = mount(ImagesCoreAdmin, {
        props: {
          imageData: mockImageData
        }
      })

      expect(wrapper.vm.viewMode).toBe('browse')
      expect(wrapper.find('.hero-preview').exists()).toBe(true)
    })

    it('should transition to core mode on edit button click', async () => {
      const wrapper = mount(ImagesCoreAdmin, {
        props: {
          imageData: mockImageData
        }
      })

      const editButton = wrapper.find('button.edit-metadata')
      await editButton.trigger('click')

      expect(wrapper.vm.viewMode).toBe('core')
      expect(wrapper.find('.core-fields-editor').exists()).toBe(true)
    })

    it('should transition to shape mode when ImgShape activated', async () => {
      const wrapper = mount(ImagesCoreAdmin, {
        props: {
          imageData: mockImageData
        }
      })

      const wideShape = wrapper.find('.img-shape--wide')
      await wideShape.trigger('click')

      expect(wrapper.vm.viewMode).toBe('shape')
      expect(wrapper.vm.activeShape).toBe('wide')
      expect(wrapper.find('.shape-editor').exists()).toBe(true)
    })

    it('should return to browse mode on cancel from core', async () => {
      const wrapper = mount(ImagesCoreAdmin, {
        props: {
          imageData: mockImageData
        }
      })

      // Go to core mode
      const editButton = wrapper.find('button.edit-metadata')
      await editButton.trigger('click')
      expect(wrapper.vm.viewMode).toBe('core')

      // Cancel
      const cancelButton = wrapper.find('button.cancel-edit')
      await cancelButton.trigger('click')

      expect(wrapper.vm.viewMode).toBe('browse')
    })

    it('should return to browse mode on cancel from shape', async () => {
      const wrapper = mount(ImagesCoreAdmin, {
        props: {
          imageData: mockImageData
        }
      })

      // Activate shape mode
      const wideShape = wrapper.find('.img-shape--wide')
      await wideShape.trigger('click')
      expect(wrapper.vm.viewMode).toBe('shape')

      // Cancel
      const closeButton = wrapper.find('button.close-shape-editor')
      await closeButton.trigger('click')

      expect(wrapper.vm.viewMode).toBe('browse')
      expect(wrapper.vm.activeShape).toBeNull()
    })
  })

  describe('Dirty Detection System', () => {
    it('should detect core field changes', async () => {
      const wrapper = mount(ImagesCoreAdmin, {
        props: {
          imageData: mockImageData
        }
      })

      // Enter core mode
      const editButton = wrapper.find('button.edit-metadata')
      await editButton.trigger('click')

      // Initially clean
      expect(wrapper.vm.isDirtyCore).toBe(false)

      // Modify title
      const titleInput = wrapper.find('input#img_title')
      await titleInput.setValue('Modified Title')
      await titleInput.trigger('input')

      // Should be dirty
      expect(wrapper.vm.isDirtyCore).toBe(true)
    })

    it('should detect shape field changes', async () => {
      const wrapper = mount(ImagesCoreAdmin, {
        props: {
          imageData: mockImageData
        }
      })

      // Activate wide shape
      const wideShape = wrapper.find('.img-shape--wide')
      await wideShape.trigger('click')
      await flushPromises()

      // Initially clean
      expect(wrapper.vm.isDirtyShape).toBe(false)

      // Get ShapeEditor and modify X
      const shapeEditor = wrapper.findComponent({ name: 'ShapeEditor' })
      const buttons = shapeEditor.findAll('.mode-switcher button')
      await buttons[1].trigger('click') // XYZ mode

      const xInput = shapeEditor.find('input.param-x')
      await xInput.setValue('50')
      await xInput.trigger('input')

      // Should be dirty
      expect(wrapper.vm.isDirtyShape).toBe(true)
    })

    it('should maintain separate dirty state for core and shape', async () => {
      const wrapper = mount(ImagesCoreAdmin, {
        props: {
          imageData: mockImageData
        }
      })

      // Modify core field
      const editButton = wrapper.find('button.edit-metadata')
      await editButton.trigger('click')
      const titleInput = wrapper.find('input#img_title')
      await titleInput.setValue('Modified Title')
      await titleInput.trigger('input')

      expect(wrapper.vm.isDirtyCore).toBe(true)
      expect(wrapper.vm.isDirtyShape).toBe(false)

      // Exit core without saving
      const cancelButton = wrapper.find('button.cancel-edit')
      await cancelButton.trigger('click')

      // Activate shape
      const wideShape = wrapper.find('.img-shape--wide')
      await wideShape.trigger('click')
      await flushPromises()

      // Core dirty should be reset, shape clean
      expect(wrapper.vm.isDirtyCore).toBe(false)
      expect(wrapper.vm.isDirtyShape).toBe(false)
    })
  })

  describe('Facade Field Binding', () => {
    it('should bind wide shape fields to wide_* database fields', async () => {
      const testData = {
        ...mockImageData,
        wide_x: 45,
        wide_y: 67,
        wide_z: 2
      }

      const wrapper = mount(ImagesCoreAdmin, {
        props: {
          imageData: testData
        }
      })

      const wideShape = wrapper.find('.img-shape--wide')
      await wideShape.trigger('click')
      await flushPromises()

      const shapeEditor = wrapper.findComponent({ name: 'ShapeEditor' })
      expect(shapeEditor.props('shape')).toBe('wide')
      expect(shapeEditor.props('data')).toMatchObject({
        x: 45,
        y: 67,
        z: 2
      })
    })

    it('should bind square shape fields to square_* database fields', async () => {
      const testData = {
        ...mockImageData,
        square_x: 30,
        square_y: 40,
        square_z: 1
      }

      const wrapper = mount(ImagesCoreAdmin, {
        props: {
          imageData: testData
        }
      })

      const squareShape = wrapper.find('.img-shape--square')
      await squareShape.trigger('click')
      await flushPromises()

      const shapeEditor = wrapper.findComponent({ name: 'ShapeEditor' })
      expect(shapeEditor.props('shape')).toBe('square')
      expect(shapeEditor.props('data')).toMatchObject({
        x: 30,
        y: 40,
        z: 1
      })
    })

    it('should update wide_* fields when wide ShapeEditor emits changes', async () => {
      const wrapper = mount(ImagesCoreAdmin, {
        props: {
          imageData: mockImageData
        }
      })

      const wideShape = wrapper.find('.img-shape--wide')
      await wideShape.trigger('click')
      await flushPromises()

      const shapeEditor = wrapper.findComponent({ name: 'ShapeEditor' })
      shapeEditor.vm.$emit('update', { x: 55 })
      await flushPromises()

      expect(wrapper.vm.editableData.wide_x).toBe(55)
    })

    it('should isolate square and wide shape states', async () => {
      const testData = {
        ...mockImageData,
        wide_x: 45,
        wide_y: 67,
        square_x: 30,
        square_y: 40
      }

      const wrapper = mount(ImagesCoreAdmin, {
        props: {
          imageData: testData
        }
      })

      // Edit wide shape
      const wideShape = wrapper.find('.img-shape--wide')
      await wideShape.trigger('click')
      await flushPromises()

      let shapeEditor = wrapper.findComponent({ name: 'ShapeEditor' })
      expect(shapeEditor.props('data').x).toBe(45)

      // Close and edit square
      const closeButton = wrapper.find('button.close-shape-editor')
      await closeButton.trigger('click')

      const squareShape = wrapper.find('.img-shape--square')
      await squareShape.trigger('click')
      await flushPromises()

      shapeEditor = wrapper.findComponent({ name: 'ShapeEditor' })
      expect(shapeEditor.props('data').x).toBe(30)
    })
  })

  describe('Hero Preview with Device Mockups', () => {
    it('should render hero preview with device mockups', () => {
      const wrapper = mount(ImagesCoreAdmin, {
        props: {
          imageData: mockImageData
        }
      })

      const heroPreview = wrapper.find('.hero-preview')
      expect(heroPreview.exists()).toBe(true)

      // Check for device mockup containers
      const phoneMockup = wrapper.find('.device-mockup--phone')
      const tabletMockup = wrapper.find('.device-mockup--tablet')

      expect(phoneMockup.exists() || tabletMockup.exists()).toBe(true)
    })

    it('should not show click-to-edit cursor on hero preview', () => {
      const wrapper = mount(ImagesCoreAdmin, {
        props: {
          imageData: mockImageData
        }
      })

      const heroWide = wrapper.find('.hero-preview .img-shape--wide')
      expect(heroWide.classes()).not.toContain('click-to-edit')
    })
  })

  describe('Edit Behavior', () => {
    it('should handle autosave behavior in core mode', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true })
      })
      global.fetch = mockFetch

      const wrapper = mount(ImagesCoreAdmin, {
        props: {
          imageData: mockImageData,
          editBehavior: 'autosave'
        }
      })

      // Enter core mode and modify
      const editButton = wrapper.find('button.edit-metadata')
      await editButton.trigger('click')

      const titleInput = wrapper.find('input#img_title')
      await titleInput.setValue('Auto Save Title')
      await titleInput.trigger('input')

      // Trigger autosave (implementation-specific)
      await flushPromises()

      // Should have called fetch for autosave
      expect(mockFetch).toHaveBeenCalled()
    })

    it('should handle prompt behavior when closing with unsaved changes', async () => {
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)

      const wrapper = mount(ImagesCoreAdmin, {
        props: {
          imageData: mockImageData,
          editBehavior: 'prompt'
        }
      })

      // Enter core mode and modify
      const editButton = wrapper.find('button.edit-metadata')
      await editButton.trigger('click')

      const titleInput = wrapper.find('input#img_title')
      await titleInput.setValue('Unsaved Title')
      await titleInput.trigger('input')

      // Try to cancel
      const cancelButton = wrapper.find('button.cancel-edit')
      await cancelButton.trigger('click')

      // Should prompt user
      expect(confirmSpy).toHaveBeenCalled()

      confirmSpy.mockRestore()
    })
  })

  describe('ShapeEditor Event Integration', () => {
    it('should trigger preview update on @preview event', async () => {
      const wrapper = mount(ImagesCoreAdmin, {
        props: {
          imageData: mockImageData
        }
      })

      const wideShape = wrapper.find('.img-shape--wide')
      await wideShape.trigger('click')
      await flushPromises()

      const shapeEditor = wrapper.findComponent({ name: 'ShapeEditor' })

      // Emit preview event
      shapeEditor.vm.$emit('preview')
      await flushPromises()

      // Preview should update (check implementation-specific behavior)
      expect(wrapper.find('.shape-preview').exists()).toBe(true)
    })

    it('should reset shape data on @reset event', async () => {
      const testData = {
        ...mockImageData,
        wide_x: 45,
        wide_y: 67
      }

      const wrapper = mount(ImagesCoreAdmin, {
        props: {
          imageData: testData
        }
      })

      const wideShape = wrapper.find('.img-shape--wide')
      await wideShape.trigger('click')
      await flushPromises()

      // Modify data
      const shapeEditor = wrapper.findComponent({ name: 'ShapeEditor' })
      shapeEditor.vm.$emit('update', { x: 90 })
      await flushPromises()

      expect(wrapper.vm.editableData.wide_x).toBe(90)

      // Reset
      shapeEditor.vm.$emit('reset')
      await flushPromises()

      expect(wrapper.vm.editableData.wide_x).toBe(45)
    })
  })

  // ==========================================
  // NEW TESTS: Z-Value Conversion & Bug Fixes
  // ==========================================

  describe('1. Z-Value Conversion Logic (rebuildShapeUrlWithXYZ)', () => {
    describe('Unsplash adapter', () => {
      it('should convert X/Y from 0-100 scale to 0.0-1.0 scale', () => {
        const wrapper = mount(ImagesCoreAdmin, {
          props: { imageData: mockImageData }
        })

        const url = 'https://images.unsplash.com/photo-123?w=1000'
        const result = wrapper.vm.rebuildShapeUrlWithXYZ(url, 50, 30, 100, 'wide', 0.084)

        expect(result).toContain('fp-x=0.50')  // 50 → 0.50
        expect(result).toContain('fp-y=0.30')  // 30 → 0.30
      })

      it('should apply shrink multiplier for Z-value (wide default Z=100)', () => {
        const wrapper = mount(ImagesCoreAdmin, {
          props: { imageData: mockImageData }
        })

        const url = 'https://images.unsplash.com/photo-123?w=1000'

        // Z=100 (wide default) → multiplier=1.0 → fp-z=1.00
        const result1 = wrapper.vm.rebuildShapeUrlWithXYZ(url, 50, 50, 100, 'wide', 0.084)
        expect(result1).toContain('fp-z=1.00')
      })

      it('should apply shrink multiplier for Z-value (square default Z=50)', () => {
        const wrapper = mount(ImagesCoreAdmin, {
          props: { imageData: mockImageData }
        })

        const url = 'https://images.unsplash.com/photo-123?w=1000'

        // Z=50 (square default) → multiplier=0.5 → fp-z=2.00 (show 2x more)
        const result2 = wrapper.vm.rebuildShapeUrlWithXYZ(url, 50, 50, 50, 'square', 0.084)
        expect(result2).toContain('fp-z=2.00')
      })

      it('should apply shrink multiplier for Z-value (thumb default Z=25)', () => {
        const wrapper = mount(ImagesCoreAdmin, {
          props: { imageData: mockImageData }
        })

        const url = 'https://images.unsplash.com/photo-123?w=1000'

        // Z=25 (thumb default) → multiplier=0.25 → fp-z=4.00 (show 4x more)
        const result3 = wrapper.vm.rebuildShapeUrlWithXYZ(url, 50, 50, 25, 'thumb', 0.084)
        expect(result3).toContain('fp-z=4.00')
      })

      it('should apply shrink multiplier for Z-value (zoom in Z=200)', () => {
        const wrapper = mount(ImagesCoreAdmin, {
          props: { imageData: mockImageData }
        })

        const url = 'https://images.unsplash.com/photo-123?w=1000'

        // Z=200 (zoom in 2x) → multiplier=2.0 → fp-z=0.50
        const result4 = wrapper.vm.rebuildShapeUrlWithXYZ(url, 50, 50, 200, 'wide', 0.084)
        expect(result4).toContain('fp-z=0.50')
      })

      it('should use shape parameter correctly (same Z, different shapes)', () => {
        const wrapper = mount(ImagesCoreAdmin, {
          props: { imageData: mockImageData }
        })

        const url = 'https://images.unsplash.com/photo-123?w=1000'

        // Same Z value, different shapes, same result (Z is relative)
        const wideUrl = wrapper.vm.rebuildShapeUrlWithXYZ(url, 50, 50, 100, 'wide', 0.084)
        const squareUrl = wrapper.vm.rebuildShapeUrlWithXYZ(url, 50, 50, 100, 'square', 0.084)

        // Both should have fp-z=1.00 (Z=100 means "use this multiplier")
        expect(wideUrl).toContain('fp-z=1.00')
        expect(squareUrl).toContain('fp-z=1.00')
      })

      it('should remove focal point params when XYZ are null (auto mode)', () => {
        const wrapper = mount(ImagesCoreAdmin, {
          props: { imageData: mockImageData }
        })

        const url = 'https://images.unsplash.com/photo-123?fp-x=0.50&fp-y=0.50&fp-z=1.00'
        const result = wrapper.vm.rebuildShapeUrlWithXYZ(url, null, null, null, 'wide', 0.084)

        expect(result).not.toContain('fp-x=')
        expect(result).not.toContain('fp-y=')
        expect(result).not.toContain('fp-z=')
        expect(result).toContain('crop=entropy')
      })
    })

    describe('Cloudinary adapter', () => {
      it('should convert X/Y from 0-100 to pixel offsets from center', () => {
        const wrapper = mount(ImagesCoreAdmin, {
          props: { imageData: mockImageData }
        })

        const url = 'https://res.cloudinary.com/test/image/upload/c_fill,g_auto,w_336,h_168/v123/image.jpg'
        const result = wrapper.vm.rebuildShapeUrlWithXYZ(url, 80, 30, 100, 'wide', 0.084)

        // x=80 → offset = (80-50) * 3.36 = +101px
        expect(result).toContain('x_101')
        // y=30 → offset = (30-50) * 1.68 = -34px
        expect(result).toContain('y_-34')
      })

      it('should apply shrink multiplier for Z-value (wide default)', () => {
        const wrapper = mount(ImagesCoreAdmin, {
          props: { imageData: mockImageData }
        })

        const url = 'https://res.cloudinary.com/test/image/upload/c_fill,g_auto,w_336,h_168/v123/image.jpg'

        // Z=100 → multiplier=1.0 → z=1.00
        const result1 = wrapper.vm.rebuildShapeUrlWithXYZ(url, 50, 50, 100, 'wide', 0.084)
        expect(result1).toContain('z_1.00')
      })

      it('should apply shrink multiplier for Z-value (square default)', () => {
        const wrapper = mount(ImagesCoreAdmin, {
          props: { imageData: mockImageData }
        })

        const url = 'https://res.cloudinary.com/test/image/upload/c_fill,g_auto,w_336,h_168/v123/image.jpg'

        // Z=50 → multiplier=0.5 → z=2.00
        const result2 = wrapper.vm.rebuildShapeUrlWithXYZ(url, 50, 50, 50, 'square', 0.084)
        expect(result2).toContain('z_2.00')
      })

      it('should apply shrink multiplier for Z-value (thumb default)', () => {
        const wrapper = mount(ImagesCoreAdmin, {
          props: { imageData: mockImageData }
        })

        const url = 'https://res.cloudinary.com/test/image/upload/c_fill,g_auto,w_336,h_168/v123/image.jpg'

        // Z=25 → multiplier=0.25 → z=4.00
        const result3 = wrapper.vm.rebuildShapeUrlWithXYZ(url, 50, 50, 25, 'thumb', 0.084)
        expect(result3).toContain('z_4.00')
      })

      it('should switch from c_fill to c_crop when X/Y set', () => {
        const wrapper = mount(ImagesCoreAdmin, {
          props: { imageData: mockImageData }
        })

        const url = 'https://res.cloudinary.com/test/image/upload/c_fill,g_auto,w_336,h_168/v123/image.jpg'
        const result = wrapper.vm.rebuildShapeUrlWithXYZ(url, 50, 50, 100, 'wide', 0.084)

        expect(result).toContain('c_crop')
        expect(result).toContain('g_xy_center')
        expect(result).not.toContain('c_fill')
      })

      it('should switch back to c_fill when XYZ are null (auto mode)', () => {
        const wrapper = mount(ImagesCoreAdmin, {
          props: { imageData: mockImageData }
        })

        const url = 'https://res.cloudinary.com/test/image/upload/c_crop,g_xy_center,x_100,y_50,z_1.5,w_336,h_168/v123/image.jpg'
        const result = wrapper.vm.rebuildShapeUrlWithXYZ(url, null, null, null, 'wide', 0.084)

        expect(result).toContain('c_fill')
        expect(result).toContain('g_auto')
        expect(result).not.toContain('c_crop')
        expect(result).not.toContain('x_')
        expect(result).not.toContain('y_')
        expect(result).not.toContain('z_')
      })
    })

    describe('xDefaultShrink calculation', () => {
      it('should use image.x when available', () => {
        const testData: IImageAdminRecord = {
          ...mockImageData,
          img_x: 4000  // Original width
        }

        const wrapper = mount(ImagesCoreAdmin, {
          props: { imageData: testData }
        })

        // For image with x=4000, wide width=336
        const shrink = wrapper.vm.xDefaultShrink
        expect(shrink).toBeCloseTo(0.084, 3)  // 336 / 4000
      })

      it('should fallback to 3000 when image.x is NULL', () => {
        const wrapper = mount(ImagesCoreAdmin, {
          props: { imageData: mockImageData }  // img_x is null
        })

        const shrink = wrapper.vm.xDefaultShrink
        expect(shrink).toBeCloseTo(0.112, 3)  // 336 / 3000
      })
    })
  })

  describe('4. Single Source of Truth: ShapeEditor Calculates, ImgShape Displays', () => {
    it('should display URL as-is from database without recalculating XYZ', async () => {
      const preComputedUrl = 'https://images.unsplash.com/photo-123?fp-x=0.80&fp-y=0.30&fp-z=2.00'

      const testData: IImageAdminRecord = {
        ...mockImageData,
        wide_url: preComputedUrl,
        wide_x: 80,  // These are stored but NOT used for recalculation by ImgShape
        wide_y: 30,
        wide_z: 50
      }

      const wrapper = mount(ImagesCoreAdmin, {
        props: { imageData: testData }
      })

      // ImgShape should display the pre-computed URL
      const imgShape = wrapper.findComponent({ name: 'ImgShape' })
      expect(imgShape.exists()).toBe(true)

      // The URL passed to ImgShape should be the pre-computed one
      expect(imgShape.props('data').url).toBe(preComputedUrl)

      // ImgShape should NOT rebuild URL from x/y/z props
      const img = imgShape.find('img')
      expect(img.attributes('src')).toContain('fp-x=0.80')
      expect(img.attributes('src')).toContain('fp-y=0.30')
      expect(img.attributes('src')).toContain('fp-z=2.00')
    })

    it('should emit pre-computed URL without modification', async () => {
      const preComputedUrl = 'https://res.cloudinary.com/test/image/upload/c_crop,g_xy_center,x_101,y_-34,z_2.00,w_336,h_168/v123/image.jpg'

      const testData: IImageAdminRecord = {
        ...mockImageData,
        wide_url: preComputedUrl
      }

      const wrapper = mount(ImagesCoreAdmin, {
        props: { imageData: testData }
      })

      const imgShape = wrapper.findComponent({ name: 'ImgShape' })

      // ImgShape should emit the exact URL it received
      expect(imgShape.emitted('shapeUrl')).toBeTruthy()
      const emittedUrl = imgShape.emitted('shapeUrl')?.[0]?.[0]
      expect(emittedUrl).toBe(preComputedUrl)
    })

    it('should calculate new URL in ShapeEditor and pass to ImgShape on Preview', async () => {
      const wrapper = mount(ImagesCoreAdmin, {
        props: { imageData: mockImageData }
      })

      // Activate wide shape
      const wideShape = wrapper.find('.img-shape--wide')
      await wideShape.trigger('click')
      await flushPromises()

      // Set XYZ values
      const shapeEditor = wrapper.findComponent({ name: 'ShapeEditor' })
      const buttons = shapeEditor.findAll('.mode-switcher button')
      await buttons[1].trigger('click') // Switch to XYZ mode

      const xInput = shapeEditor.find('input.param-x')
      const yInput = shapeEditor.find('input.param-y')
      const zInput = shapeEditor.find('input.param-z')

      await xInput.setValue('80')
      await xInput.trigger('input')
      await yInput.setValue('30')
      await yInput.trigger('input')
      await zInput.setValue('100')
      await zInput.trigger('input')
      await flushPromises()

      // Click Preview button
      const previewButton = shapeEditor.find('button.preview-btn')
      await previewButton.trigger('click')
      await flushPromises()

      // ShapeEditor should have calculated new URL with XYZ
      expect(wrapper.vm.activeShapeData.url).toContain('fp-x=')
      expect(wrapper.vm.activeShapeData.url).toContain('fp-y=')
      expect(wrapper.vm.activeShapeData.url).toContain('fp-z=')

      // ImgShape should display the new calculated URL
      const imgShape = wrapper.findComponent({ name: 'ImgShape' })
      expect(imgShape.props('data').url).toBe(wrapper.vm.activeShapeData.url)
    })
  })

  describe('5. Preview URL Update (Bug Fix: Issue #1)', () => {
    it('should update activeShapeData.url with computed XYZ URL on Preview', async () => {
      const wrapper = mount(ImagesCoreAdmin, {
        props: { imageData: mockImageData }
      })

      // Activate wide shape
      const wideShape = wrapper.find('.img-shape--wide')
      await wideShape.trigger('click')
      await flushPromises()

      const originalUrl = wrapper.vm.activeShapeData.url

      // Set XYZ values
      const shapeEditor = wrapper.findComponent({ name: 'ShapeEditor' })
      const buttons = shapeEditor.findAll('.mode-switcher button')
      await buttons[1].trigger('click') // XYZ mode

      await shapeEditor.find('input.param-x').setValue('80')
      await shapeEditor.find('input.param-x').trigger('input')
      await shapeEditor.find('input.param-y').setValue('30')
      await shapeEditor.find('input.param-y').trigger('input')
      await shapeEditor.find('input.param-z').setValue('100')
      await shapeEditor.find('input.param-z').trigger('input')
      await flushPromises()

      // Click Preview
      const previewButton = shapeEditor.find('button.preview-btn')
      await previewButton.trigger('click')
      await flushPromises()

      // URL should be updated with XYZ transformations
      expect(wrapper.vm.activeShapeData.url).not.toBe(originalUrl)
      expect(wrapper.vm.activeShapeData.url).toContain('fp-x=') // Unsplash
    })

    it('should update PreviewWide when wide shape preview is clicked', async () => {
      const wrapper = mount(ImagesCoreAdmin, {
        props: { imageData: mockImageData }
      })

      // Activate wide shape
      const wideShape = wrapper.find('.img-shape--wide')
      await wideShape.trigger('click')
      await flushPromises()

      // Set XYZ
      const shapeEditor = wrapper.findComponent({ name: 'ShapeEditor' })
      const buttons = shapeEditor.findAll('.mode-switcher button')
      await buttons[1].trigger('click')

      await shapeEditor.find('input.param-x').setValue('80')
      await shapeEditor.find('input.param-x').trigger('input')
      await shapeEditor.find('input.param-y').setValue('30')
      await shapeEditor.find('input.param-y').trigger('input')
      await shapeEditor.find('input.param-z').setValue('100')
      await shapeEditor.find('input.param-z').trigger('input')
      await flushPromises()

      // Click Preview
      const previewButton = shapeEditor.find('button.preview-btn')
      await previewButton.trigger('click')
      await flushPromises()

      // PreviewWide should be updated
      expect(wrapper.vm.PreviewWide).toBeTruthy()
      expect(wrapper.vm.PreviewWide).toContain('fp-x=')
    })

    it('should default NULL XYZ values to 50 before rebuilding URL', async () => {
      const testData: IImageAdminRecord = {
        ...mockImageData,
        wide_x: null,
        wide_y: null,
        wide_z: null
      }

      const wrapper = mount(ImagesCoreAdmin, {
        props: { imageData: testData }
      })

      // Activate wide shape
      const wideShape = wrapper.find('.img-shape--wide')
      await wideShape.trigger('click')
      await flushPromises()

      // Click Preview (without setting XYZ - should use defaults)
      const shapeEditor = wrapper.findComponent({ name: 'ShapeEditor' })
      const previewButton = shapeEditor.find('button.preview-btn')
      await previewButton.trigger('click')
      await flushPromises()

      // Should have used default of 50 for null values
      expect(wrapper.vm.activeShapeData.url).toContain('fp-x=0.50')
      expect(wrapper.vm.activeShapeData.url).toContain('fp-y=0.50')
    })
  })

  describe('6. Image Loading (Bug Fix: Preview Hanging on Blur)', () => {
    it('should reset imageLoaded when displayUrl changes', async () => {
      const testData: IImageAdminRecord = {
        ...mockImageData,
        wide_url: 'https://images.unsplash.com/photo-123?w=336',
        wide_blur: 'LEHV6nWB2yk8pyo0adR*.7kCMdnj'
      }

      const wrapper = mount(ImagesCoreAdmin, {
        props: { imageData: testData }
      })

      const imgShape = wrapper.findComponent({ name: 'ImgShape' })

      // Simulate image loaded
      imgShape.vm.imageLoaded = true
      await flushPromises()

      // URL changes (Preview was clicked)
      await wrapper.setProps({
        imageData: {
          ...testData,
          wide_url: 'https://images.unsplash.com/photo-123?fp-x=0.80&fp-y=0.30'
        }
      })
      await flushPromises()

      // Should have reset imageLoaded to false (show blur placeholder)
      expect(imgShape.vm.imageLoaded).toBe(false)
    })

    it('should set imageLoaded=true on successful load event', async () => {
      const wrapper = mount(ImagesCoreAdmin, {
        props: { imageData: mockImageData }
      })

      const imgShape = wrapper.findComponent({ name: 'ImgShape' })
      const img = imgShape.find('img')

      // Initially not loaded
      expect(imgShape.vm.imageLoaded).toBe(false)

      // Simulate image load event
      await img.trigger('load')
      await flushPromises()

      // Should set imageLoaded to true
      expect(imgShape.vm.imageLoaded).toBe(true)
    })

    it('should set imageLoaded=true even on error (prevent hanging)', async () => {
      const wrapper = mount(ImagesCoreAdmin, {
        props: { imageData: mockImageData }
      })

      const imgShape = wrapper.findComponent({ name: 'ImgShape' })
      const img = imgShape.find('img')

      // Initially not loaded
      expect(imgShape.vm.imageLoaded).toBe(false)

      // Simulate image error event
      await img.trigger('error')
      await flushPromises()

      // Should still set imageLoaded=true to prevent hanging on blur
      expect(imgShape.vm.imageLoaded).toBe(true)
    })

    it('should show placeholder when imageLoaded is false', async () => {
      const testData: IImageAdminRecord = {
        ...mockImageData,
        wide_blur: 'LEHV6nWB2yk8pyo0adR*.7kCMdnj'
      }

      const wrapper = mount(ImagesCoreAdmin, {
        props: { imageData: testData }
      })

      const imgShape = wrapper.findComponent({ name: 'ImgShape' })

      // Initially imageLoaded is false
      imgShape.vm.imageLoaded = false
      await flushPromises()

      // Should show placeholder
      expect(imgShape.vm.showPlaceholder).toBe(true)
    })

    it('should hide placeholder after image loads', async () => {
      const testData: IImageAdminRecord = {
        ...mockImageData,
        wide_blur: 'LEHV6nWB2yk8pyo0adR*.7kCMdnj'
      }

      const wrapper = mount(ImagesCoreAdmin, {
        props: { imageData: testData }
      })

      const imgShape = wrapper.findComponent({ name: 'ImgShape' })
      const img = imgShape.find('img')

      // Initially showing placeholder
      expect(imgShape.vm.showPlaceholder).toBe(true)

      // Image loads
      await img.trigger('load')
      await flushPromises()

      // Should hide placeholder
      expect(imgShape.vm.imageLoaded).toBe(true)
      expect(imgShape.vm.showPlaceholder).toBe(false)
    })
  })
})
