/**
 * ShapeEditor Component Unit Tests
 * 
 * Tests mode switching, XYZ input handling, and event emissions
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import ShapeEditor from '@/components/images/ShapeEditor.vue'

describe('ShapeEditor Component', () => {

    // ===================================================================
    // Mode Switching Tests
    // ===================================================================

    describe('Mode Switching', () => {
        it('should render automation mode by default', () => {
            const wrapper = mount(ShapeEditor, {
                props: {
                    shape: 'wide',
                    adapter: 'unsplash',
                    data: {
                        x: null,
                        y: null,
                        z: null,
                        url: 'https://images.unsplash.com/photo-123',
                        tpar: null
                    }
                }
            })

            // Check that automation mode is active
            const buttons = wrapper.findAll('.mode-switcher button')
            expect(buttons[0].classes()).toContain('active')
            expect(wrapper.find('.editor-content h5').text()).toBe('Shape-based Automation')
        })

        it('should switch to XYZ mode when clicked', async () => {
            const wrapper = mount(ShapeEditor, {
                props: {
                    shape: 'wide',
                    adapter: 'unsplash',
                    data: {
                        x: null,
                        y: null,
                        z: null,
                        url: 'https://images.unsplash.com/photo-123',
                        tpar: null
                    }
                }
            })

            const buttons = wrapper.findAll('.mode-switcher button')
            await buttons[1].trigger('click')

            expect(buttons[1].classes()).toContain('active')
            expect(wrapper.find('.editor-content h5').text()).toBe('Manual Parameters')
        })

        it('should switch to direct mode when clicked', async () => {
            const wrapper = mount(ShapeEditor, {
                props: {
                    shape: 'wide',
                    adapter: 'unsplash',
                    data: {
                        x: null,
                        y: null,
                        z: null,
                        url: 'https://images.unsplash.com/photo-123',
                        tpar: null
                    }
                }
            })

            const buttons = wrapper.findAll('.mode-switcher button')
            await buttons[2].trigger('click')

            expect(buttons[2].classes()).toContain('active')
            expect(wrapper.find('.editor-content h5').text()).toBe('Direct Edit')
        })

        it('should maintain mode state when props change', async () => {
            const wrapper = mount(ShapeEditor, {
                props: {
                    shape: 'wide',
                    adapter: 'unsplash',
                    data: {
                        x: null,
                        y: null,
                        z: null,
                        url: 'https://images.unsplash.com/photo-123',
                        tpar: null
                    }
                }
            })

            // Switch to XYZ mode
            const buttons = wrapper.findAll('.mode-switcher button')
            await buttons[1].trigger('click')
            expect(buttons[1].classes()).toContain('active')

            // Change props
            await wrapper.setProps({
                data: {
                    x: 50,
                    y: 50,
                    z: 1,
                    url: 'https://images.unsplash.com/photo-456',
                    tpar: null
                }
            })

            // Mode should still be XYZ
            expect(buttons[1].classes()).toContain('active')
        })
    })

    // ===================================================================
    // XYZ Input Tests
    // ===================================================================

    describe('XYZ Input', () => {
        it('should emit update event with x value', async () => {
            const wrapper = mount(ShapeEditor, {
                props: {
                    shape: 'wide',
                    adapter: 'unsplash',
                    data: {
                        x: null,
                        y: null,
                        z: null,
                        url: 'https://images.unsplash.com/photo-123',
                        tpar: null
                    }
                }
            })

            // Switch to XYZ mode
            const buttons = wrapper.findAll('.mode-switcher button')
            await buttons[1].trigger('click')

            // Find X input and set value
            const paramFields = wrapper.findAll('.param-field')
            const xInput = paramFields[0].find('input[type="number"]')
            await xInput.setValue('50')
            await xInput.trigger('input')

            // Check emitted event
            const updateEvents = wrapper.emitted('update')
            expect(updateEvents).toBeTruthy()
            expect(updateEvents![updateEvents!.length - 1]).toEqual([{ x: 50 }])
        })

        it('should emit update event with y value', async () => {
            const wrapper = mount(ShapeEditor, {
                props: {
                    shape: 'wide',
                    adapter: 'unsplash',
                    data: {
                        x: null,
                        y: null,
                        z: null,
                        url: 'https://images.unsplash.com/photo-123',
                        tpar: null
                    }
                }
            })

            // Switch to XYZ mode
            const buttons = wrapper.findAll('.mode-switcher button')
            await buttons[1].trigger('click')

            // Find Y input and set value
            const paramFields = wrapper.findAll('.param-field')
            const yInput = paramFields[1].find('input[type="number"]')
            await yInput.setValue('75')
            await yInput.trigger('input')

            // Check emitted event
            const updateEvents = wrapper.emitted('update')
            expect(updateEvents).toBeTruthy()
            expect(updateEvents![updateEvents!.length - 1]).toEqual([{ y: 75 }])
        })

        it('should emit update event with z value', async () => {
            const wrapper = mount(ShapeEditor, {
                props: {
                    shape: 'wide',
                    adapter: 'unsplash',
                    data: {
                        x: null,
                        y: null,
                        z: null,
                        url: 'https://images.unsplash.com/photo-123',
                        tpar: null
                    }
                }
            })

            // Switch to XYZ mode
            const buttons = wrapper.findAll('.mode-switcher button')
            await buttons[1].trigger('click')

            // Find Z input and set value
            const paramFields = wrapper.findAll('.param-field')
            const zInput = paramFields[2].find('input[type="number"]')
            await zInput.setValue('2')
            await zInput.trigger('input')

            // Check emitted event
            const updateEvents = wrapper.emitted('update')
            expect(updateEvents).toBeTruthy()
            expect(updateEvents![updateEvents!.length - 1]).toEqual([{ z: 2 }])
        })

        it('should accept values 0-100 for x and y', async () => {
            const wrapper = mount(ShapeEditor, {
                props: {
                    shape: 'wide',
                    adapter: 'unsplash',
                    data: {
                        x: null,
                        y: null,
                        z: null,
                        url: 'https://images.unsplash.com/photo-123',
                        tpar: null
                    }
                }
            })

            // Switch to XYZ mode
            const buttons = wrapper.findAll('.mode-switcher button')
            await buttons[1].trigger('click')

            // Test X input range
            const paramFields = wrapper.findAll('.param-field')
            const xInput = paramFields[0].find('input[type="number"]')
            expect(xInput.attributes('min')).toBe('0')
            expect(xInput.attributes('max')).toBe('100')

            // Test Y input range
            const yInput = paramFields[1].find('input[type="number"]')
            expect(yInput.attributes('min')).toBe('0')
            expect(yInput.attributes('max')).toBe('100')
        })

        it('should emit null when input is cleared', async () => {
            const wrapper = mount(ShapeEditor, {
                props: {
                    shape: 'wide',
                    adapter: 'unsplash',
                    data: {
                        x: 50,
                        y: 50,
                        z: 1,
                        url: 'https://images.unsplash.com/photo-123',
                        tpar: null
                    }
                }
            })

            // Switch to XYZ mode
            const buttons = wrapper.findAll('.mode-switcher button')
            await buttons[1].trigger('click')

            // Clear X input
            const paramFields = wrapper.findAll('.param-field')
            const xInput = paramFields[0].find('input[type="number"]')
            await xInput.setValue('')
            await xInput.trigger('input')

            // Check emitted event
            const updateEvents = wrapper.emitted('update')
            expect(updateEvents).toBeTruthy()
            expect(updateEvents![updateEvents!.length - 1]).toEqual([{ x: null }])
        })

        it('should display current XYZ values from props', async () => {
            const wrapper = mount(ShapeEditor, {
                props: {
                    shape: 'wide',
                    adapter: 'unsplash',
                    data: {
                        x: 45,
                        y: 67,
                        z: 2,
                        url: 'https://images.unsplash.com/photo-123',
                        tpar: null
                    }
                }
            })

            // Switch to XYZ mode
            const buttons = wrapper.findAll('.mode-switcher button')
            await buttons[1].trigger('click')

            // Check input values
            const paramFields = wrapper.findAll('.param-field')
            const xInput = paramFields[0].find('input[type="number"]')
            const yInput = paramFields[1].find('input[type="number"]')
            const zInput = paramFields[2].find('input[type="number"]')

            expect((xInput.element as HTMLInputElement).value).toBe('45')
            expect((yInput.element as HTMLInputElement).value).toBe('67')
            expect((zInput.element as HTMLInputElement).value).toBe('2')
        })
    })

    // ===================================================================
    // Preview/Reset Tests
    // ===================================================================

    describe('Preview/Reset', () => {
        it('should emit preview event when preview button clicked', async () => {
            const wrapper = mount(ShapeEditor, {
                props: {
                    shape: 'wide',
                    adapter: 'unsplash',
                    data: {
                        x: 50,
                        y: 50,
                        z: 1,
                        url: 'https://images.unsplash.com/photo-123',
                        tpar: null
                    }
                }
            })

            // Switch to XYZ mode
            const buttons = wrapper.findAll('.mode-switcher button')
            await buttons[1].trigger('click')

            // Click preview button
            const previewButton = wrapper.find('button.btn-preview')
            await previewButton.trigger('click')

            // Check emitted event
            expect(wrapper.emitted('preview')).toBeTruthy()
            expect(wrapper.emitted('preview')![0]).toEqual([])
        })

        it('should emit reset event when reset button clicked', async () => {
            const wrapper = mount(ShapeEditor, {
                props: {
                    shape: 'wide',
                    adapter: 'unsplash',
                    data: {
                        x: 50,
                        y: 50,
                        z: 1,
                        url: 'https://images.unsplash.com/photo-123',
                        tpar: null
                    }
                }
            })

            // Switch to XYZ mode
            const buttons = wrapper.findAll('.mode-switcher button')
            await buttons[1].trigger('click')

            // Click reset button
            const resetButton = wrapper.find('button.btn-reset')
            await resetButton.trigger('click')

            // Check emitted event
            expect(wrapper.emitted('reset')).toBeTruthy()
            expect(wrapper.emitted('reset')![0]).toEqual([])
        })

        it('should have both preview and reset buttons in XYZ mode', async () => {
            const wrapper = mount(ShapeEditor, {
                props: {
                    shape: 'wide',
                    adapter: 'unsplash',
                    data: {
                        x: 50,
                        y: 50,
                        z: 1,
                        url: 'https://images.unsplash.com/photo-123',
                        tpar: null
                    }
                }
            })

            // Switch to XYZ mode
            const buttons = wrapper.findAll('.mode-switcher button')
            await buttons[1].trigger('click')

            // Check buttons exist
            expect(wrapper.find('button.btn-preview').exists()).toBe(true)
            expect(wrapper.find('button.btn-reset').exists()).toBe(true)
        })
    })

    // ===================================================================
    // Props Handling Tests
    // ===================================================================

    describe('Props Handling', () => {
        it('should display shape name in header', () => {
            const wrapper = mount(ShapeEditor, {
                props: {
                    shape: 'wide',
                    adapter: 'unsplash',
                    data: {
                        x: null,
                        y: null,
                        z: null,
                        url: 'https://images.unsplash.com/photo-123',
                        tpar: null
                    }
                }
            })

            expect(wrapper.find('.shape-name').text()).toContain('wide')
        })

        it('should display variant in header when provided', () => {
            const wrapper = mount(ShapeEditor, {
                props: {
                    shape: 'square',
                    variant: 'tile',
                    adapter: 'unsplash',
                    data: {
                        x: null,
                        y: null,
                        z: null,
                        url: 'https://images.unsplash.com/photo-123',
                        tpar: null
                    }
                }
            })

            expect(wrapper.find('.shape-name').text()).toContain('square')
            expect(wrapper.find('.variant').text()).toBe(':tile')
        })

        it('should display adapter badge', () => {
            const wrapper = mount(ShapeEditor, {
                props: {
                    shape: 'wide',
                    adapter: 'cloudinary',
                    data: {
                        x: null,
                        y: null,
                        z: null,
                        url: 'https://res.cloudinary.com/demo/image/upload/v123/photo.jpg',
                        tpar: null
                    }
                }
            })

            expect(wrapper.find('.adapter-badge').text()).toBe('cloudinary')
        })

        it('should handle different shape types', () => {
            const shapes: Array<'square' | 'wide' | 'vertical' | 'thumb' | 'avatar'> =
                ['square', 'wide', 'vertical', 'thumb', 'avatar']

            shapes.forEach(shape => {
                const wrapper = mount(ShapeEditor, {
                    props: {
                        shape,
                        adapter: 'unsplash',
                        data: {
                            x: null,
                            y: null,
                            z: null,
                            url: 'https://images.unsplash.com/photo-123',
                            tpar: null
                        }
                    }
                })

                expect(wrapper.find('.shape-name').text()).toContain(shape)
            })
        })

        it('should handle different adapters', () => {
            const adapters: Array<'unsplash' | 'cloudinary' | 'vimeo' | 'external'> =
                ['unsplash', 'cloudinary', 'vimeo', 'external']

            adapters.forEach(adapter => {
                const wrapper = mount(ShapeEditor, {
                    props: {
                        shape: 'wide',
                        adapter,
                        data: {
                            x: null,
                            y: null,
                            z: null,
                            url: 'https://example.com/photo.jpg',
                            tpar: null
                        }
                    }
                })

                expect(wrapper.find('.adapter-badge').text()).toBe(adapter)
            })
        })
    })

    // ===================================================================
    // Automation Presets Tests
    // ===================================================================

    describe('Automation Presets', () => {
        it('should show correct presets for unsplash wide', () => {
            const wrapper = mount(ShapeEditor, {
                props: {
                    shape: 'wide',
                    adapter: 'unsplash',
                    data: {
                        x: null,
                        y: null,
                        z: null,
                        url: 'https://images.unsplash.com/photo-123',
                        tpar: null
                    }
                }
            })

            // Should be in automation mode by default
            const presetInfo = wrapper.find('.preset-info')
            expect(presetInfo.exists()).toBe(true)
            expect(presetInfo.text()).toContain('crop')
            expect(presetInfo.text()).toContain('focalpoint')
        })

        it('should show correct presets for cloudinary square', () => {
            const wrapper = mount(ShapeEditor, {
                props: {
                    shape: 'square',
                    adapter: 'cloudinary',
                    data: {
                        x: null,
                        y: null,
                        z: null,
                        url: 'https://res.cloudinary.com/demo/image/upload/v123/photo.jpg',
                        tpar: null
                    }
                }
            })

            // Should be in automation mode by default
            const presetInfo = wrapper.find('.preset-info')
            expect(presetInfo.exists()).toBe(true)
            expect(presetInfo.text()).toContain('gravity')
            expect(presetInfo.text()).toContain('auto')
        })
    })
})
