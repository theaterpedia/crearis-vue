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
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import ImagesCoreAdmin from '@/components/images/ImagesCoreAdmin.vue'
import type { IImageAdminRecord } from '@/types/database-types'

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

  beforeEach(() => {
    global.fetch = vi.fn()
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
})
