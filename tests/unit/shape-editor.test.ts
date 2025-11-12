/**
 * ShapeEditor Component Unit Tests (Updated for Phase 6 Refactoring)
 * 
 * Tests the fully refactored ShapeEditor with:
 * - All 8 database fields (x, y, z, url, tpar, turl, json, blur)
 * - Three modes: automation, xyz, direct
 * - Event emissions: @update, @preview, @reset
 * - Exposed method: getCurrentData()
 * - Chained transformation detection (Cloudinary)
 */

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ShapeEditor from '@/components/images/ShapeEditor.vue'

describe('ShapeEditor Component', () => {
    describe('Props and Initialization', () => {
        it('should accept all required props', () => {
            const wrapper = mount(ShapeEditor, {
                props: {
                    shape: 'wide',
                    adapter: 'unsplash',
                    data: {
                        x: 50,
                        y: 50,
                        z: 1,
                        url: 'https://images.unsplash.com/photo-123',
                        tpar: 'fit=crop&w={W}&h={H}',
                        turl: null,
                        json: null,
                        blur: 'LEHV6nWB2yk8pyo0adR*.7kCMdnj'
                    }
                }
            })

            expect(wrapper.exists()).toBe(true)
            expect(wrapper.find('.shape-editor').exists()).toBe(true)
        })

        it('should handle all 4 shape types', () => {
            const shapes: Array<'square' | 'wide' | 'vertical' | 'thumb'> = ['square', 'wide', 'vertical', 'thumb']

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
                            tpar: null,
                            turl: null,
                            json: null,
                            blur: null
                        }
                    }
                })

                expect(wrapper.find('.shape-name').text()).toContain(shape)
            })
        })

        it('should handle all 4 adapter types', () => {
            const adapters: Array<'unsplash' | 'cloudinary' | 'vimeo' | 'external'> = ['unsplash', 'cloudinary', 'vimeo', 'external']

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
                            tpar: null,
                            turl: null,
                            json: null,
                            blur: null
                        }
                    }
                })

                expect(wrapper.find('.adapter-badge').text()).toBe(adapter)
            })
        })
    })

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
                        tpar: null,
                        turl: null,
                        json: null,
                        blur: null
                    }
                }
            })

            const buttons = wrapper.findAll('.mode-switcher button')
            expect(buttons[0].classes()).toContain('active')
        })

        it('should switch to XYZ mode', async () => {
            const wrapper = mount(ShapeEditor, {
                props: {
                    shape: 'wide',
                    adapter: 'unsplash',
                    data: {
                        x: null,
                        y: null,
                        z: null,
                        url: 'https://images.unsplash.com/photo-123',
                        tpar: null,
                        turl: null,
                        json: null,
                        blur: null
                    }
                }
            })

            const buttons = wrapper.findAll('.mode-switcher button')
            await buttons[1].trigger('click')

            expect(buttons[1].classes()).toContain('active')
        })

        it('should switch to direct mode', async () => {
            const wrapper = mount(ShapeEditor, {
                props: {
                    shape: 'wide',
                    adapter: 'unsplash',
                    data: {
                        x: null,
                        y: null,
                        z: null,
                        url: 'https://images.unsplash.com/photo-123',
                        tpar: null,
                        turl: null,
                        json: null,
                        blur: null
                    }
                }
            })

            const buttons = wrapper.findAll('.mode-switcher button')
            await buttons[2].trigger('click')

            expect(buttons[2].classes()).toContain('active')
        })
    })

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
                        tpar: null,
                        turl: null,
                        json: null,
                        blur: null
                    }
                }
            })

            const buttons = wrapper.findAll('.mode-switcher button')
            await buttons[1].trigger('click')

            const paramFields = wrapper.findAll('.param-field')
            const xInput = paramFields[0].find('input[type="number"]')
            await xInput.setValue('50')
            await xInput.trigger('input')

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
                        tpar: null,
                        turl: null,
                        json: null,
                        blur: null
                    }
                }
            })

            const buttons = wrapper.findAll('.mode-switcher button')
            await buttons[1].trigger('click')

            const paramFields = wrapper.findAll('.param-field')
            const yInput = paramFields[1].find('input[type="number"]')
            await yInput.setValue('75')
            await yInput.trigger('input')

            const updateEvents = wrapper.emitted('update')
            expect(updateEvents).toBeTruthy()
            expect(updateEvents![updateEvents!.length - 1]).toEqual([{ y: 75 }])
        })

        it('should validate x and y range 0-100', async () => {
            const wrapper = mount(ShapeEditor, {
                props: {
                    shape: 'wide',
                    adapter: 'unsplash',
                    data: {
                        x: null,
                        y: null,
                        z: null,
                        url: 'https://images.unsplash.com/photo-123',
                        tpar: null,
                        turl: null,
                        json: null,
                        blur: null
                    }
                }
            })

            const buttons = wrapper.findAll('.mode-switcher button')
            await buttons[1].trigger('click')

            const paramFields = wrapper.findAll('.param-field')
            const xInput = paramFields[0].find('input[type="number"]')
            const yInput = paramFields[1].find('input[type="number"]')

            expect(xInput.attributes('min')).toBe('0')
            expect(xInput.attributes('max')).toBe('100')
            expect(yInput.attributes('min')).toBe('0')
            expect(yInput.attributes('max')).toBe('100')
        })
    })

    describe('Event Emissions', () => {
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
                        tpar: null,
                        turl: null,
                        json: null,
                        blur: null
                    }
                }
            })

            const buttons = wrapper.findAll('.mode-switcher button')
            await buttons[1].trigger('click')

            const previewButton = wrapper.find('button.btn-preview')
            await previewButton.trigger('click')

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
                        tpar: null,
                        turl: null,
                        json: null,
                        blur: null
                    }
                }
            })

            const buttons = wrapper.findAll('.mode-switcher button')
            await buttons[1].trigger('click')

            const resetButton = wrapper.find('button.btn-reset')
            await resetButton.trigger('click')

            expect(wrapper.emitted('reset')).toBeTruthy()
            expect(wrapper.emitted('reset')![0]).toEqual([])
        })
    })

    describe('Exposed Methods', () => {
        it('should expose getCurrentData method', () => {
            const wrapper = mount(ShapeEditor, {
                props: {
                    shape: 'wide',
                    adapter: 'unsplash',
                    data: {
                        x: 45,
                        y: 67,
                        z: 2,
                        url: 'https://images.unsplash.com/photo-123',
                        tpar: 'fit=crop&w={W}&h={H}',
                        turl: 'https://example.com/transform',
                        json: { key: 'value' },
                        blur: 'LEHV6nWB2yk8pyo0adR*.7kCMdnj'
                    }
                }
            })

            expect(wrapper.vm.getCurrentData).toBeDefined()
            expect(typeof wrapper.vm.getCurrentData).toBe('function')
        })

        it('should return all 8 fields from getCurrentData', () => {
            const testData = {
                x: 45,
                y: 67,
                z: 2,
                url: 'https://images.unsplash.com/photo-123',
                tpar: 'fit=crop&w={W}&h={H}',
                turl: 'https://example.com/transform',
                json: { key: 'value' },
                blur: 'LEHV6nWB2yk8pyo0adR*.7kCMdnj'
            }

            const wrapper = mount(ShapeEditor, {
                props: {
                    shape: 'wide',
                    adapter: 'unsplash',
                    data: testData
                }
            })

            const currentData = wrapper.vm.getCurrentData()
            expect(currentData).toHaveProperty('x', 45)
            expect(currentData).toHaveProperty('y', 67)
            expect(currentData).toHaveProperty('z', 2)
            expect(currentData).toHaveProperty('url')
            expect(currentData).toHaveProperty('tpar')
            expect(currentData).toHaveProperty('turl')
            expect(currentData).toHaveProperty('json')
            expect(currentData).toHaveProperty('blur')
        })
    })

    describe('Chained Transformation Detection', () => {
        it('should detect chained Cloudinary transformations', () => {
            const wrapper = mount(ShapeEditor, {
                props: {
                    shape: 'thumb',
                    adapter: 'cloudinary',
                    data: {
                        x: null,
                        y: null,
                        z: null,
                        url: 'https://res.cloudinary.com/demo/image/upload/c_crop,g_face,h_200,w_200/c_fill,g_auto,w_128,h_128/v123/sample.jpg',
                        tpar: null,
                        turl: null,
                        json: null,
                        blur: null
                    }
                }
            })

            const warning = wrapper.find('.chained-warning')
            expect(warning.exists()).toBe(true)
        })
    })
})
