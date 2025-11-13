/**
 * ItemGallery Component Tests
 * 
 * Tests the gallery container component that displays items in a grid
 * Manages tile/card display, selection, and event handling
 * 
 * Test Categories:
 * 1. Basic Rendering
 * 2. Item Type Selection (tile/card/row)
 * 3. Size Variants
 * 4. Props Handling
 * 5. Selection Management
 * 6. Event Handling
 * 7. Empty States
 * 8. Integration Tests
 * 9. Edge Cases
 */

import { describe, it, expect } from 'vitest'
import ItemGallery from '@/components/clist/ItemGallery.vue'
import { mountCListComponent } from '../utils/mount-helpers'
import {
    createMockEvent,
    createMockUser,
    createMockImageData
} from '../utils/clist-test-data'

describe('ItemGallery Component', () => {
    describe('Basic Rendering', () => {
        it('should render with minimal props', () => {
            const { wrapper } = mountCListComponent(ItemGallery, {
                props: {
                    items: [
                        { heading: 'Item 1' },
                        { heading: 'Item 2' }
                    ]
                }
            })

            expect(wrapper.find('.item-gallery-container').exists()).toBe(true)
            expect(wrapper.find('.item-gallery').exists()).toBe(true)
        })

        it('should render all items', () => {
            const { wrapper } = mountCListComponent(ItemGallery, {
                props: {
                    items: [
                        { heading: 'First Item' },
                        { heading: 'Second Item' },
                        { heading: 'Third Item' }
                    ]
                }
            })

            const items = wrapper.findAll('.item-card, .item-tile')
            expect(items.length).toBe(3)
        })

        it('should apply static interaction by default', () => {
            const { wrapper } = mountCListComponent(ItemGallery, {
                props: {
                    items: [{ heading: 'Test' }]
                }
            })

            expect(wrapper.find('.item-gallery-container').exists()).toBe(true)
        })
    })

    describe('Item Type Selection', () => {
        it('should use ItemCard by default', () => {
            const { wrapper } = mountCListComponent(ItemGallery, {
                props: {
                    items: [{ heading: 'Card Item' }]
                }
            })

            expect(wrapper.findComponent({ name: 'ItemCard' }).exists()).toBe(true)
        })

        it('should use ItemTile when itemType is tile', () => {
            const { wrapper } = mountCListComponent(ItemGallery, {
                props: {
                    items: [{ heading: 'Tile Item' }],
                    itemType: 'tile'
                }
            })

            expect(wrapper.findComponent({ name: 'ItemTile' }).exists()).toBe(true)
        })

        it('should use ItemRow when itemType is row', () => {
            const { wrapper } = mountCListComponent(ItemGallery, {
                props: {
                    items: [{ heading: 'Row Item' }],
                    itemType: 'row'
                }
            })

            expect(wrapper.findComponent({ name: 'ItemRow' }).exists()).toBe(true)
        })

        it('should render ItemCard when itemType is card', () => {
            const { wrapper } = mountCListComponent(ItemGallery, {
                props: {
                    items: [{ heading: 'Card Item' }],
                    itemType: 'card'
                }
            })

            expect(wrapper.findComponent({ name: 'ItemCard' }).exists()).toBe(true)
        })
    })

    describe('Size Variants', () => {
        it('should pass size prop to child items', () => {
            const { wrapper } = mountCListComponent(ItemGallery, {
                props: {
                    items: [{ heading: 'Test' }],
                    itemType: 'card',
                    size: 'large'
                }
            })

            const card = wrapper.findComponent({ name: 'ItemCard' })
            expect(card.props('size')).toBe('large')
        })

        it('should support small size', () => {
            const { wrapper } = mountCListComponent(ItemGallery, {
                props: {
                    items: [{ heading: 'Test' }],
                    size: 'small'
                }
            })

            const card = wrapper.findComponent({ name: 'ItemCard' })
            expect(card.props('size')).toBe('small')
        })

        it('should support medium size', () => {
            const { wrapper } = mountCListComponent(ItemGallery, {
                props: {
                    items: [{ heading: 'Test' }],
                    size: 'medium'
                }
            })

            const card = wrapper.findComponent({ name: 'ItemCard' })
            expect(card.props('size')).toBe('medium')
        })
    })

    describe('Props Handling', () => {
        it('should pass heading to child items', () => {
            const { wrapper } = mountCListComponent(ItemGallery, {
                props: {
                    items: [{ heading: 'Test Heading' }],
                    itemType: 'card'
                }
            })

            const card = wrapper.findComponent({ name: 'ItemCard' })
            expect(card.props('heading')).toBe('Test Heading')
        })

        it('should pass additional props to child items', () => {
            const imageData = createMockImageData('wide')

            const { wrapper } = mountCListComponent(ItemGallery, {
                props: {
                    items: [
                        {
                            heading: 'Test',
                            props: {
                                data: imageData,
                                shape: 'wide'
                            }
                        }
                    ],
                    itemType: 'card'
                }
            })

            const card = wrapper.findComponent({ name: 'ItemCard' })
            expect(card.props('data')).toEqual(imageData)
        })

        it('should apply heading level prop', () => {
            const { wrapper } = mountCListComponent(ItemGallery, {
                props: {
                    items: [{ heading: 'Test' }],
                    headingLevel: 'h4',
                    itemType: 'tile'
                }
            })

            const tile = wrapper.findComponent({ name: 'ItemTile' })
            expect(tile.props('headingLevel')).toBe('h4')
        })
    })

    describe('Selection Management', () => {
        it('should track item clicks', async () => {
            const { wrapper } = mountCListComponent(ItemGallery, {
                props: {
                    items: [
                        { heading: 'Item 1' },
                        { heading: 'Item 2' }
                    ]
                }
            })

            const firstItem = wrapper.findComponent({ name: 'ItemCard' })
            await firstItem.trigger('click')

            expect(wrapper.emitted('item-click')).toBeTruthy()
        })

        it('should emit item-click event with correct data', async () => {
            const testItem = { heading: 'Test Item' }

            const { wrapper } = mountCListComponent(ItemGallery, {
                props: {
                    items: [testItem]
                }
            })

            const item = wrapper.findComponent({ name: 'ItemCard' })
            await item.trigger('click')

            const emitted = wrapper.emitted('item-click')
            expect(emitted).toBeTruthy()
            expect(emitted![0][0]).toMatchObject(testItem)
        })
    })

    describe('Event Handling', () => {
        it('should handle item click events', async () => {
            const { wrapper } = mountCListComponent(ItemGallery, {
                props: {
                    items: [{ heading: 'Clickable Item' }]
                }
            })

            const item = wrapper.findComponent({ name: 'ItemCard' })
            await item.trigger('click')

            expect(wrapper.emitted('item-click')).toBeTruthy()
        })

        it('should pass mouse event to item-click handler', async () => {
            const { wrapper } = mountCListComponent(ItemGallery, {
                props: {
                    items: [{ heading: 'Test' }]
                }
            })

            const item = wrapper.findComponent({ name: 'ItemCard' })
            await item.trigger('click')

            const emitted = wrapper.emitted('item-click')
            expect(emitted).toBeTruthy()
            expect(emitted![0][1]).toBeInstanceOf(MouseEvent)
        })
    })

    describe('Empty States', () => {
        it('should render with empty items array', () => {
            const { wrapper } = mountCListComponent(ItemGallery, {
                props: {
                    items: []
                }
            })

            expect(wrapper.find('.item-gallery-container').exists()).toBe(true)
            const items = wrapper.findAll('.item-card, .item-tile')
            expect(items.length).toBe(0)
        })

        it('should handle missing items prop', () => {
            const { wrapper } = mountCListComponent(ItemGallery, {
                props: {}
            })

            expect(wrapper.find('.item-gallery-container').exists()).toBe(true)
        })
    })

    describe('Integration Tests - Real Data', () => {
        it('should render gallery of events as cards', () => {
            const events = [
                createMockEvent({ title: 'Workshop A' }),
                createMockEvent({ title: 'Workshop B' }),
                createMockEvent({ title: 'Workshop C' })
            ]

            const items = events.map(event => ({
                heading: event.title,
                props: {
                    options: { entityIcon: true },
                    models: { entityType: 'event' }
                }
            }))

            const { wrapper } = mountCListComponent(ItemGallery, {
                props: {
                    items,
                    itemType: 'card'
                }
            })

            const cardComponents = wrapper.findAllComponents({ name: 'ItemCard' })
            expect(cardComponents.length).toBe(3)
        })

        it('should render gallery of users with images as tiles', () => {
            const users = [
                createMockUser({ title: 'Alice' }),
                createMockUser({ title: 'Bob' })
            ]

            const items = users.map(user => {
                const imageData = createMockImageData('square')
                return {
                    heading: user.title,
                    props: {
                        data: imageData,
                        options: { entityIcon: true },
                        models: { entityType: 'instructor' }
                    }
                }
            })

            const { wrapper } = mountCListComponent(ItemGallery, {
                props: {
                    items,
                    itemType: 'tile'
                }
            })

            const tileComponents = wrapper.findAllComponents({ name: 'ItemTile' })
            expect(tileComponents.length).toBe(2)

            tileComponents.forEach(tile => {
                expect(tile.props('data')).toBeTruthy()
            })
        })

        it('should render mixed content gallery', () => {
            const items = [
                { heading: 'Text Only Item' },
                {
                    heading: 'Item with Image',
                    props: { data: createMockImageData('wide') }
                },
                {
                    heading: 'Item with Options',
                    props: {
                        options: { badge: true, counter: true },
                        models: { count: 5 }
                    }
                }
            ]

            const { wrapper } = mountCListComponent(ItemGallery, {
                props: {
                    items,
                    itemType: 'card'
                }
            })

            const cardComponents = wrapper.findAllComponents({ name: 'ItemCard' })
            expect(cardComponents.length).toBe(3)
        })
    })

    describe('Accessibility', () => {
        it('should render proper container structure', () => {
            const { wrapper } = mountCListComponent(ItemGallery, {
                props: {
                    items: [{ heading: 'Test' }]
                }
            })

            expect(wrapper.find('.item-gallery-container').exists()).toBe(true)
            expect(wrapper.find('.item-gallery').exists()).toBe(true)
        })

        it('should use unique keys for items', () => {
            const items = [
                { heading: 'Item 1' },
                { heading: 'Item 2' },
                { heading: 'Item 3' }
            ]

            const { wrapper } = mountCListComponent(ItemGallery, {
                props: { items }
            })

            const itemComponents = wrapper.findAllComponents({ name: 'ItemCard' })
            expect(itemComponents.length).toBe(3)
        })
    })

    describe('Edge Cases', () => {
        it('should handle items with empty headings', () => {
            const { wrapper } = mountCListComponent(ItemGallery, {
                props: {
                    items: [
                        { heading: '' },
                        { heading: 'Valid' }
                    ]
                }
            })

            const items = wrapper.findAllComponents({ name: 'ItemCard' })
            expect(items.length).toBe(2)
        })

        it('should handle items without props', () => {
            const { wrapper } = mountCListComponent(ItemGallery, {
                props: {
                    items: [{ heading: 'Simple Item' }]
                }
            })

            const item = wrapper.findComponent({ name: 'ItemCard' })
            expect(item.exists()).toBe(true)
        })

        it('should handle rapid itemType changes', async () => {
            const { wrapper } = mountCListComponent(ItemGallery, {
                props: {
                    items: [{ heading: 'Test' }],
                    itemType: 'card'
                }
            })

            expect(wrapper.findComponent({ name: 'ItemCard' }).exists()).toBe(true)

            await wrapper.setProps({ itemType: 'tile' })

            expect(wrapper.findComponent({ name: 'ItemTile' }).exists()).toBe(true)
        })

        it('should handle items with partial data', () => {
            const { wrapper } = mountCListComponent(ItemGallery, {
                props: {
                    items: [
                        { heading: 'Item with heading only' },
                        {
                            heading: 'Item with some props',
                            props: { options: { badge: true } }
                        }
                    ]
                }
            })

            const items = wrapper.findAllComponents({ name: 'ItemCard' })
            expect(items.length).toBe(2)
        })

        it('should handle switching between different component types', async () => {
            const { wrapper } = mountCListComponent(ItemGallery, {
                props: {
                    items: [{ heading: 'Test' }],
                    itemType: 'card'
                }
            })

            expect(wrapper.findComponent({ name: 'ItemCard' }).exists()).toBe(true)

            await wrapper.setProps({ itemType: 'row' })
            expect(wrapper.findComponent({ name: 'ItemRow' }).exists()).toBe(true)

            await wrapper.setProps({ itemType: 'tile' })
            expect(wrapper.findComponent({ name: 'ItemTile' }).exists()).toBe(true)
        })
    })
})
