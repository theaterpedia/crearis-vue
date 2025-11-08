/**
 * ImgShape Component Core Tests
 * 
 * Tests dimension validation, avatar shape detection,
 * preview state management, and click-to-edit behavior
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import ImgShape from '@/components/images/ImgShape.vue'
import type { Image } from '@/types/database'
import { setupCSSVariableMocks } from '../utils/test-helpers'

// Sample test data
const sampleImage: Image = {
  id: 1,
  xmlid: 'img001',
  user_id: 1,
  adapter: 'unsplash',
  urlpath: 'photo-1234567890',
  blurhash: 'LEHV6nWB2yk8pyo0adR*.7kCMdnj',
  width: 3000,
  height: 2000,
  tpar: 'fit=crop&w={W}&h={H}',
  turl: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
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
  it('should show error overlay when dimensions are invalid', async () => {
    // Temporarily break CSS variables
    const originalGetComputedStyle = window.getComputedStyle
    window.getComputedStyle = function() {
      return {
        getPropertyValue: () => ''
      } as CSSStyleDeclaration
    } as typeof window.getComputedStyle
    
    const wrapper = mount(ImgShape, {
      props: {
        image: sampleImage,
        shape: 'card',
        context: 'project'
      }
    })
    
    await wrapper.vm.$nextTick()
    
    const errorOverlay = wrapper.find('.error-overlay')
    expect(errorOverlay.exists()).toBe(true)
    expect(errorOverlay.text()).toContain('Invalid dimensions')
    
    // Restore
    window.getComputedStyle = originalGetComputedStyle
  })
  
  it('should not show error overlay when dimensions are valid', async () => {
    const wrapper = mount(ImgShape, {
      props: {
        image: sampleImage,
        shape: 'card',
        context: 'project'
      }
    })
    
    await wrapper.vm.$nextTick()
    
    const errorOverlay = wrapper.find('.error-overlay')
    expect(errorOverlay.exists()).toBe(false)
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

  describe('Click-to-Edit Behavior', () => {
  it('should emit activate event when clicked and editable', async () => {
    const wrapper = mount(ImgShape, {
      props: {
        image: sampleImage,
        shape: 'card',
        context: 'project',
        editable: true
      }
    })
    
    await wrapper.vm.$nextTick()
    
    const wrapperDiv = wrapper.find('.img-shape-wrapper')
    await wrapperDiv.trigger('click')
    
    expect(wrapper.emitted('activate')).toBeTruthy()
    expect(wrapper.emitted('activate')![0]).toEqual([{
      shape: 'card',
      context: 'project',
      adapter: 'unsplash'
    }])
  })
  
  it('should NOT emit activate when not editable', async () => {
    const wrapper = mount(ImgShape, {
      props: {
        image: sampleImage,
        shape: 'card',
        context: 'project',
        editable: false
      }
    })
    
    await wrapper.vm.$nextTick()
    
    const wrapperDiv = wrapper.find('.img-shape-wrapper')
    await wrapperDiv.trigger('click')
    
    expect(wrapper.emitted('activate')).toBeFalsy()
  })
  
  it('should NOT emit activate when in error state', async () => {
    // Temporarily break CSS variables to trigger error state
    const originalGetComputedStyle = window.getComputedStyle
    window.getComputedStyle = function() {
      return {
        getPropertyValue: () => ''
      } as CSSStyleDeclaration
    } as typeof window.getComputedStyle
    
    const wrapper = mount(ImgShape, {
      props: {
        image: sampleImage,
        shape: 'card',
        context: 'project',
        editable: true
      }
    })
    
    await wrapper.vm.$nextTick()
    
    const wrapperDiv = wrapper.find('.img-shape-wrapper')
    await wrapperDiv.trigger('click')
    
    expect(wrapper.emitted('activate')).toBeFalsy()
    
    // Restore
    window.getComputedStyle = originalGetComputedStyle
  })
  
  it('should pass shape/context/adapter in activate event', async () => {
    const wrapper = mount(ImgShape, {
      props: {
        image: sampleImage,
        shape: 'tile',
        context: 'user',
        editable: true
      }
    })
    
    await wrapper.vm.$nextTick()
    
    const wrapperDiv = wrapper.find('.img-shape-wrapper')
    await wrapperDiv.trigger('click')
    
    const emitted = wrapper.emitted('activate')
    expect(emitted).toBeTruthy()
    expect(emitted![0][0]).toEqual({
      shape: 'tile',
      context: 'user',
      adapter: 'unsplash'
    })
  })
  
  it('should add editable class when editable prop is true', async () => {
    const wrapper = mount(ImgShape, {
      props: {
        image: sampleImage,
        shape: 'card',
        context: 'project',
        editable: true
      }
    })
    
    await wrapper.vm.$nextTick()
    
    expect(wrapper.html()).toContain('editable')
  })
  
  it('should add active class when activeEdit is true', async () => {
    const wrapper = mount(ImgShape, {
      props: {
        image: sampleImage,
        shape: 'card',
        context: 'project',
        editable: true,
        activeEdit: true
      }
    })
    
    await wrapper.vm.$nextTick()
    
    expect(wrapper.html()).toContain('active')
  })
  })
})
