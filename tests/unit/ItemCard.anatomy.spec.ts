import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ItemCard from '@/components/clist/ItemCard.vue'

describe('ItemCard - Anatomy Variants', () => {
    const mockImageData = {
        type: 'url' as const,
        url: 'https://example.com/image.jpg',
        x: 50,
        y: 50,
        z: 100,
        options: null,
        alt_text: 'Test image'
    }

    describe('fullimage anatomy (default)', () => {
        it('renders background image when anatomy is false (default)', () => {
            const wrapper = mount(ItemCard, {
                props: {
                    heading: '**Test Card**',
                    data: mockImageData,
                    anatomy: false
                }
            })

            expect(wrapper.find('.card-background-image').exists()).toBe(true)
            expect(wrapper.find('.card-image-bottom').exists()).toBe(false)
        })

        it('renders background image when anatomy is "fullimage"', () => {
            const wrapper = mount(ItemCard, {
                props: {
                    heading: '**Test Card**',
                    data: mockImageData,
                    anatomy: 'fullimage'
                }
            })

            expect(wrapper.find('.card-background-image').exists()).toBe(true)
            expect(wrapper.find('.card-image-bottom').exists()).toBe(false)
        })

        it('applies has-background class for fullimage', () => {
            const wrapper = mount(ItemCard, {
                props: {
                    heading: '**Test Card**',
                    data: mockImageData,
                    anatomy: 'fullimage'
                }
            })

            expect(wrapper.find('.item-card').classes()).toContain('has-background')
        })

        it('renders background fade overlay for fullimage', () => {
            const wrapper = mount(ItemCard, {
                props: {
                    heading: '**Test Card**',
                    data: mockImageData,
                    anatomy: 'fullimage'
                }
            })

            expect(wrapper.find('.card-background-fade').exists()).toBe(true)
        })
    })

    describe('bottomimage anatomy', () => {
        it('renders bottom image section when anatomy is "bottomimage"', () => {
            const wrapper = mount(ItemCard, {
                props: {
                    heading: '**Test Card**',
                    data: mockImageData,
                    anatomy: 'bottomimage'
                }
            })

            expect(wrapper.find('.card-image-bottom').exists()).toBe(true)
            expect(wrapper.find('.card-background-image').exists()).toBe(false)
        })

        it('applies layout-bottomimage class', () => {
            const wrapper = mount(ItemCard, {
                props: {
                    heading: '**Test Card**',
                    data: mockImageData,
                    anatomy: 'bottomimage'
                }
            })

            expect(wrapper.find('.item-card').classes()).toContain('layout-bottomimage')
        })

        it('does not apply has-background class for bottomimage', () => {
            const wrapper = mount(ItemCard, {
                props: {
                    heading: '**Test Card**',
                    data: mockImageData,
                    anatomy: 'bottomimage'
                }
            })

            expect(wrapper.find('.item-card').classes()).not.toContain('has-background')
        })

        it('does not render background fade for bottomimage', () => {
            const wrapper = mount(ItemCard, {
                props: {
                    heading: '**Test Card**',
                    data: mockImageData,
                    anatomy: 'bottomimage'
                }
            })

            expect(wrapper.find('.card-background-fade').exists()).toBe(false)
        })

        it('renders heading above image in bottomimage layout', () => {
            const wrapper = mount(ItemCard, {
                props: {
                    heading: '**Test Card**',
                    data: mockImageData,
                    anatomy: 'bottomimage'
                }
            })

            const cardHeader = wrapper.find('.card-header')
            const cardImageBottom = wrapper.find('.card-image-bottom')

            expect(cardHeader.exists()).toBe(true)
            expect(cardImageBottom.exists()).toBe(true)
        })
    })

    describe('Image data handling', () => {
        it('renders ImgShape with data prop', () => {
            const wrapper = mount(ItemCard, {
                props: {
                    heading: '**Test Card**',
                    data: mockImageData,
                    anatomy: 'bottomimage',
                    shape: 'wide'
                }
            })

            const imgShape = wrapper.findComponent({ name: 'ImgShape' })
            expect(imgShape.exists()).toBe(true)
            expect(imgShape.props('data')).toEqual(mockImageData)
            expect(imgShape.props('shape')).toBe('wide')
        })

        it('renders legacy img tag with cimg', () => {
            const wrapper = mount(ItemCard, {
                props: {
                    heading: '**Test Card**',
                    cimg: 'https://example.com/legacy.jpg',
                    anatomy: 'bottomimage'
                }
            })

            const img = wrapper.find('.bottom-image')
            expect(img.exists()).toBe(true)
            expect(img.attributes('src')).toBe('https://example.com/legacy.jpg')
        })

        it('does not render image section without data or cimg', () => {
            const wrapper = mount(ItemCard, {
                props: {
                    heading: '**Test Card**',
                    anatomy: 'bottomimage'
                }
            })

            expect(wrapper.find('.card-image-bottom').exists()).toBe(false)
        })
    })

    describe('Size variants', () => {
        const sizes = ['small', 'medium', 'large'] as const

        sizes.forEach(size => {
            it(`renders correctly with size="${size}"`, () => {
                const wrapper = mount(ItemCard, {
                    props: {
                        heading: '**Test Card**',
                        data: mockImageData,
                        size,
                        anatomy: 'bottomimage'
                    }
                })

                expect(wrapper.find('.item-card').classes()).toContain(`size-${size}`)
            })
        })
    })

    describe('Heading levels', () => {
        it('uses h5 for small size', () => {
            const wrapper = mount(ItemCard, {
                props: {
                    heading: '**Small Card**',
                    size: 'small'
                }
            })

            expect(wrapper.html()).toContain('h5')
        })

        it('uses h4 for medium size', () => {
            const wrapper = mount(ItemCard, {
                props: {
                    heading: '**Medium Card**',
                    size: 'medium'
                }
            })

            expect(wrapper.html()).toContain('h4')
        })

        it('uses h3 for large size', () => {
            const wrapper = mount(ItemCard, {
                props: {
                    heading: '**Large Card**',
                    size: 'large'
                }
            })

            expect(wrapper.html()).toContain('h3')
        })
    })

    describe('Visual indicators', () => {
        it('renders entity icon when option is enabled', () => {
            const wrapper = mount(ItemCard, {
                props: {
                    heading: '**Test Card**',
                    options: { entityIcon: true },
                    models: { entityType: 'event' }
                }
            })

            expect(wrapper.find('.entity-icon').exists()).toBe(true)
        })

        it('renders badge when option is enabled', () => {
            const wrapper = mount(ItemCard, {
                props: {
                    heading: '**Test Card**',
                    options: { badge: true }
                }
            })

            expect(wrapper.find('.badge').exists()).toBe(true)
        })

        it('renders selection checkbox when option is enabled', () => {
            const wrapper = mount(ItemCard, {
                props: {
                    heading: '**Test Card**',
                    options: { selectable: true }
                }
            })

            expect(wrapper.find('.checkbox').exists()).toBe(true)
        })

        it('renders marker border color when option is enabled', () => {
            const wrapper = mount(ItemCard, {
                props: {
                    heading: '**Test Card**',
                    options: { marker: true },
                    models: { marked: 'primary' }
                }
            })

            expect(wrapper.find('.item-card').classes()).toContain('marker-primary')
        })
    })

    describe('Selection state', () => {
        it('applies is-selected class when selected', () => {
            const wrapper = mount(ItemCard, {
                props: {
                    heading: '**Test Card**',
                    models: { selected: true }
                }
            })

            expect(wrapper.find('.item-card').classes()).toContain('is-selected')
        })

        it('shows checked checkbox when selected', () => {
            const wrapper = mount(ItemCard, {
                props: {
                    heading: '**Test Card**',
                    options: { selectable: true },
                    models: { selected: true }
                }
            })

            expect(wrapper.find('.checkbox.checked').exists()).toBe(true)
        })
    })

    describe('Deprecated cimg warning', () => {
        it('shows warning overlay when deprecated flag is true', () => {
            const wrapper = mount(ItemCard, {
                props: {
                    heading: '**Test Card**',
                    deprecated: true
                }
            })

            expect(wrapper.find('.deprecated-warning').exists()).toBe(true)
        })

        it('does not show warning when deprecated flag is false', () => {
            const wrapper = mount(ItemCard, {
                props: {
                    heading: '**Test Card**',
                    deprecated: false
                }
            })

            expect(wrapper.find('.deprecated-warning').exists()).toBe(false)
        })
    })

    describe('CornerBanner integration', () => {
        it('renders CornerBanner with entity data', () => {
            const wrapper = mount(ItemCard, {
                props: {
                    heading: '**Test Card**',
                    models: {
                        entity: {
                            xmlid: 'tp.event.test',
                            status_id: 6,
                            status_value: 6,
                            table: 'events'
                        }
                    }
                }
            })

            const banner = wrapper.findComponent({ name: 'CornerBanner' })
            expect(banner.exists()).toBe(true)
            expect(banner.props('size')).toBe('card')
        })
    })
})
