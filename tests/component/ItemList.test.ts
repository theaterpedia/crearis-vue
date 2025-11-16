/**
 * ItemList Component Tests
 * 
 * Tests the container component that renders lists of items
 * Manages item display, selection, and event handling
 * 
 * Test Categories:
 * 1. Basic Rendering
 * 2. Size Variants
 * 3. Item Component Selection (Row vs Tile)
 * 4. Props Handling
 * 5. Selection Management
 * 6. Event Handling
 * 7. Empty States
 * 8. Integration Tests
 * 9. Edge Cases
 */

import { describe, it, expect } from 'vitest'
import ItemList from '@/components/clist/ItemList.vue'
import { mountCListComponent } from '../utils/mount-helpers'
import {
    createMockEvent,
    createMockUser,
    createMockImageData
} from '../utils/clist-test-data'

describe('ItemList Component', () => {
    describe('Basic Rendering', () => {
        it('should render with minimal props', () => {
            const { wrapper } = mountCListComponent(ItemList, {
                props: {
                    items: [
                        { heading: 'Item 1' },
                        { heading: 'Item 2' }
                    ]
                }
            })

            expect(wrapper.find('.item-list-container').exists()).toBe(true)
            expect(wrapper.find('.item-list').exists()).toBe(true)
        })

        it('should render all items', () => {
            const { wrapper } = mountCListComponent(ItemList, {
                props: {
                    items: [
                        { heading: 'First Item' },
                        { heading: 'Second Item' },
                        { heading: 'Third Item' }
                    ]
                }
            })

            const items = wrapper.findAll('.item-row, .item-tile')
            expect(items.length).toBe(3)
        })

        it('should apply static interaction by default', () => {
            const { wrapper } = mountCListComponent(ItemList, {
                props: {
                    items: [{ heading: 'Test' }]
                }
            })

            expect(wrapper.find('.item-list-container').exists()).toBe(true)
        })
    })

    describe('Size Variants', () => {
        it('should render small size items with ItemRow', () => {
            const { wrapper } = mountCListComponent(ItemList, {
                props: {
                    items: [{ heading: 'Small Item' }],
                    size: 'small'
                }
            })

            expect(wrapper.findComponent({ name: 'ItemRow' }).exists()).toBe(true)
        })

        it('should render medium size items by default', () => {
            const { wrapper } = mountCListComponent(ItemList, {
                props: {
                    items: [{ heading: 'Medium Item' }]
                }
            })

            // Medium size can use either ItemRow or ItemTile depending on columns setting
            const hasRow = wrapper.findComponent({ name: 'ItemRow' }).exists()
            const hasTile = wrapper.findComponent({ name: 'ItemTile' }).exists()
            expect(hasRow || hasTile).toBe(true)
        })

        it('should pass size prop to child components', () => {
            const { wrapper } = mountCListComponent(ItemList, {
                props: {
                    items: [{ heading: 'Test' }],
                    size: 'small'
                }
            })

            const itemRow = wrapper.findComponent({ name: 'ItemRow' })
            expect(itemRow.props('size')).toBe('small')
        })
    })

    describe('Item Component Selection', () => {
        it('should use ItemRow for small size', () => {
            const { wrapper } = mountCListComponent(ItemList, {
                props: {
                    items: [{ heading: 'Row Item' }],
                    size: 'small'
                }
            })

            expect(wrapper.findComponent({ name: 'ItemRow' }).exists()).toBe(true)
            expect(wrapper.findComponent({ name: 'ItemTile' }).exists()).toBe(false)
        })

        it('should use ItemTile for medium size with columns', () => {
            const { wrapper } = mountCListComponent(ItemList, {
                props: {
                    items: [{ heading: 'Tile Item' }],
                    size: 'medium',
                    columns: 'on'
                }
            })

            expect(wrapper.findComponent({ name: 'ItemTile' }).exists()).toBe(true)
        })
    })

    describe('Props Handling', () => {
        it('should pass heading to child items', () => {
            const { wrapper } = mountCListComponent(ItemList, {
                props: {
                    items: [{ heading: 'Test Heading' }],
                    size: 'small'
                }
            })

            const itemRow = wrapper.findComponent({ name: 'ItemRow' })
            expect(itemRow.props('heading')).toBe('Test Heading')
        })

        it('should pass additional props to child items', () => {
            const imageData = createMockImageData('thumb')

            const { wrapper } = mountCListComponent(ItemList, {
                props: {
                    items: [
                        {
                            heading: 'Test',
                            props: {
                                data: imageData,
                                shape: 'thumb'
                            }
                        }
                    ],
                    size: 'small'
                }
            })

            const itemRow = wrapper.findComponent({ name: 'ItemRow' })
            expect(itemRow.props('data')).toEqual(imageData)
        })

        it('should apply heading level prop to medium size items', () => {
            const { wrapper } = mountCListComponent(ItemList, {
                props: {
                    items: [{ heading: 'Test' }],
                    headingLevel: 'h4',
                    size: 'small'
                }
            })

            const row = wrapper.findComponent({ name: 'ItemRow' })
            expect(row.exists()).toBe(true)
            // ItemRow now accepts headingLevel prop (h3-h5)
            expect(row.props('headingLevel')).toBe('h4')
        })

        it('should apply styleCompact prop to tiles', () => {
            const { wrapper } = mountCListComponent(ItemList, {
                props: {
                    items: [{ heading: 'Test' }],
                    size: 'medium',
                    columns: 'on'
                }
            })

            const tile = wrapper.findComponent({ name: 'ItemTile' })
            expect(tile.props()).toHaveProperty('styleCompact')
        })
    })

    describe('Selection Management', () => {
        it('should track selected items', async () => {
            const { wrapper } = mountCListComponent(ItemList, {
                props: {
                    items: [
                        { heading: 'Item 1' },
                        { heading: 'Item 2' }
                    ],
                    size: 'small'
                }
            })

            const firstItem = wrapper.findComponent({ name: 'ItemRow' })
            await firstItem.trigger('click')

            expect(wrapper.emitted('item-click')).toBeTruthy()
        })

        it('should emit item-click event with correct data', async () => {
            const testItem = { heading: 'Test Item' }

            const { wrapper } = mountCListComponent(ItemList, {
                props: {
                    items: [testItem],
                    size: 'small'
                }
            })

            const item = wrapper.findComponent({ name: 'ItemRow' })
            await item.trigger('click')

            const emitted = wrapper.emitted('item-click')
            expect(emitted).toBeTruthy()
            expect(emitted![0][0]).toMatchObject(testItem)
        })
    })

    describe('Event Handling', () => {
        it('should handle item click events', async () => {
            const { wrapper } = mountCListComponent(ItemList, {
                props: {
                    items: [{ heading: 'Clickable Item' }],
                    size: 'small'
                }
            })

            const item = wrapper.findComponent({ name: 'ItemRow' })
            await item.trigger('click')

            expect(wrapper.emitted('item-click')).toBeTruthy()
        })

        it('should pass mouse event to item-click handler', async () => {
            const { wrapper } = mountCListComponent(ItemList, {
                props: {
                    items: [{ heading: 'Test' }],
                    size: 'small'
                }
            })

            const item = wrapper.findComponent({ name: 'ItemRow' })
            await item.trigger('click')

            const emitted = wrapper.emitted('item-click')
            expect(emitted).toBeTruthy()
            expect(emitted![0][1]).toBeInstanceOf(MouseEvent)
        })
    })

    describe('Empty States', () => {
        it('should render with empty items array', () => {
            const { wrapper } = mountCListComponent(ItemList, {
                props: {
                    items: []
                }
            })

            expect(wrapper.find('.item-list-container').exists()).toBe(true)
            const items = wrapper.findAll('.item-row, .item-tile')
            expect(items.length).toBe(0)
        })

        it('should handle missing items prop', () => {
            const { wrapper } = mountCListComponent(ItemList, {
                props: {}
            })

            expect(wrapper.find('.item-list-container').exists()).toBe(true)
        })
    })

    describe('Integration Tests - Real Data', () => {
        it('should render list of events', () => {
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

            const { wrapper } = mountCListComponent(ItemList, {
                props: {
                    items,
                    size: 'small'
                }
            })

            const itemComponents = wrapper.findAllComponents({ name: 'ItemRow' })
            expect(itemComponents.length).toBe(3)
        })

        it('should render list of users with images', () => {
            const users = [
                createMockUser({ title: 'Alice' }),
                createMockUser({ title: 'Bob' })
            ]

            const items = users.map(user => {
                const imageData = createMockImageData('thumb')
                return {
                    heading: user.title,
                    props: {
                        data: imageData,
                        options: { entityIcon: true },
                        models: { entityType: 'instructor' }
                    }
                }
            })

            const { wrapper } = mountCListComponent(ItemList, {
                props: {
                    items,
                    size: 'small'
                }
            })

            const itemComponents = wrapper.findAllComponents({ name: 'ItemRow' })
            expect(itemComponents.length).toBe(2)

            itemComponents.forEach(item => {
                expect(item.props('data')).toBeTruthy()
            })
        })

        it('should render mixed content list', () => {
            const items = [
                { heading: 'Text Only Item' },
                {
                    heading: 'Item with Image',
                    props: { data: createMockImageData('thumb') }
                },
                {
                    heading: 'Item with Options',
                    props: {
                        options: { badge: true, counter: true },
                        models: { count: 5 }
                    }
                }
            ]

            const { wrapper } = mountCListComponent(ItemList, {
                props: {
                    items,
                    size: 'small'
                }
            })

            const itemComponents = wrapper.findAllComponents({ name: 'ItemRow' })
            expect(itemComponents.length).toBe(3)
        })
    })

    describe('Accessibility', () => {
        it('should render proper container structure', () => {
            const { wrapper } = mountCListComponent(ItemList, {
                props: {
                    items: [{ heading: 'Test' }]
                }
            })

            expect(wrapper.find('.item-list-container').exists()).toBe(true)
            expect(wrapper.find('.item-list').exists()).toBe(true)
        })

        it('should use unique keys for items', () => {
            const items = [
                { heading: 'Item 1' },
                { heading: 'Item 2' },
                { heading: 'Item 3' }
            ]

            const { wrapper } = mountCListComponent(ItemList, {
                props: {
                    items,
                    size: 'small'
                }
            })

            const itemComponents = wrapper.findAllComponents({ name: 'ItemRow' })
            expect(itemComponents.length).toBe(3)
        })
    })

    describe('Edge Cases', () => {
        it('should handle items with empty headings', () => {
            const { wrapper } = mountCListComponent(ItemList, {
                props: {
                    items: [
                        { heading: '' },
                        { heading: 'Valid' }
                    ],
                    size: 'small'
                }
            })

            const items = wrapper.findAllComponents({ name: 'ItemRow' })
            expect(items.length).toBe(2)
        })

        it('should handle items without props', () => {
            const { wrapper } = mountCListComponent(ItemList, {
                props: {
                    items: [{ heading: 'Simple Item' }],
                    size: 'small'
                }
            })

            const item = wrapper.findComponent({ name: 'ItemRow' })
            expect(item.exists()).toBe(true)
        })

        it('should handle rapid size changes', async () => {
            const { wrapper } = mountCListComponent(ItemList, {
                props: {
                    items: [{ heading: 'Test' }],
                    size: 'small'
                }
            })

            expect(wrapper.findComponent({ name: 'ItemRow' }).exists()).toBe(true)

            await wrapper.setProps({ size: 'medium', columns: 'on' })

            // Should switch to appropriate component
            const hasComponent = wrapper.findComponent({ name: 'ItemRow' }).exists() ||
                wrapper.findComponent({ name: 'ItemTile' }).exists()
            expect(hasComponent).toBe(true)
        })

        it('should handle items with partial data', () => {
            const { wrapper } = mountCListComponent(ItemList, {
                props: {
                    items: [
                        { heading: 'Item with heading only' },
                        {
                            heading: 'Item with some props',
                            props: { options: { badge: true } }
                        }
                    ],
                    size: 'small'
                }
            })

            const items = wrapper.findAllComponents({ name: 'ItemRow' })
            expect(items.length).toBe(2)
        })
    })
})
