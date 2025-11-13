/**
 * ItemTile Component Tests
 * 
 * Tests the tile layout component (128×128px square tiles)
 * Used in ItemGallery
 * 
 * Test Categories:
 * 1. Basic Rendering
 * 2. Layout Modes (compact vs non-compact)
 * 3. Image Display
 * 4. Visual Indicators (icons, badges, checkboxes, markers)
 * 5. Selection State
 * 6. Integration Tests
 * 7. Accessibility
 * 8. Edge Cases
 */

import { describe, it, expect } from 'vitest'
import ItemTile from '@/components/clist/ItemTile.vue'
import { mountCListComponent } from '../utils/mount-helpers'
import {
    createMockEvent,
    createMockUser,
    createMockProject,
    createMockImageData
} from '../utils/clist-test-data'

describe('ItemTile Component', () => {
    describe('Basic Rendering', () => {
        it('should render with minimal props', () => {
            const { wrapper } = mountCListComponent(ItemTile, {
                props: {
                    heading: 'Test Tile'
                }
            })

            expect(wrapper.find('.item-tile').exists()).toBe(true)
            expect(wrapper.text()).toContain('Test Tile')
        })

        it('should render HeadingParser with h4 by default', () => {
            const { wrapper } = mountCListComponent(ItemTile, {
                props: {
                    heading: 'Test Heading'
                }
            })

            const heading = wrapper.find('h4')
            expect(heading.exists()).toBe(true)
        })

        it('should allow custom heading level (h3-h5)', () => {
            const { wrapper } = mountCListComponent(ItemTile, {
                props: {
                    heading: 'Test Heading',
                    headingLevel: 'h5'
                }
            })

            expect(wrapper.find('h5').exists()).toBe(true)
        })
    })

    describe('Layout Modes', () => {
        it('should use compact mode by default', () => {
            const { wrapper } = mountCListComponent(ItemTile, {
                props: {
                    heading: 'Compact Tile'
                }
            })

            expect(wrapper.find('.style-compact').exists()).toBe(true)
            expect(wrapper.find('.tile-content').exists()).toBe(true)
        })

        it('should support non-compact mode', () => {
            const { wrapper } = mountCListComponent(ItemTile, {
                props: {
                    heading: 'Non-Compact Tile',
                    styleCompact: false
                }
            })

            expect(wrapper.find('.style-compact').exists()).toBe(false)
            expect(wrapper.find('.tile-image').exists()).toBe(true)
            expect(wrapper.find('.tile-heading').exists()).toBe(true)
        })

        it('should render image beside heading in non-compact mode', () => {
            const imageData = createMockImageData('square')

            const { wrapper } = mountCListComponent(ItemTile, {
                props: {
                    heading: 'Test Tile',
                    data: imageData,
                    styleCompact: false
                }
            })

            expect(wrapper.find('.tile-image').exists()).toBe(true)
            expect(wrapper.find('.tile-heading').exists()).toBe(true)
        })

        it('should render image as background in compact mode', () => {
            const imageData = createMockImageData('square')

            const { wrapper } = mountCListComponent(ItemTile, {
                props: {
                    heading: 'Test Tile',
                    data: imageData,
                    styleCompact: true
                }
            })

            expect(wrapper.find('.tile-background').exists()).toBe(true)
            expect(wrapper.find('.tile-content').exists()).toBe(true)
        })
    })

    describe('Image Display', () => {
        it('should render ImgShape with data mode', () => {
            const imageData = createMockImageData('square')

            const { wrapper } = mountCListComponent(ItemTile, {
                props: {
                    heading: 'Test Tile',
                    data: imageData,
                    shape: 'square'
                }
            })

            expect(wrapper.findComponent({ name: 'ImgShape' }).exists()).toBe(true)
        })

        it('should render legacy img with cimg prop in compact mode', () => {
            const { wrapper } = mountCListComponent(ItemTile, {
                props: {
                    heading: 'Test Tile',
                    cimg: 'https://example.com/image.jpg',
                    styleCompact: true
                }
            })

            const img = wrapper.find('img.tile-background')
            expect(img.exists()).toBe(true)
            expect(img.attributes('src')).toBe('https://example.com/image.jpg')
        })

        it('should render legacy img in non-compact mode', () => {
            const { wrapper } = mountCListComponent(ItemTile, {
                props: {
                    heading: 'Test Tile',
                    cimg: 'https://example.com/image.jpg',
                    styleCompact: false
                }
            })

            const img = wrapper.find('.tile-image img')
            expect(img.exists()).toBe(true)
            expect(img.attributes('src')).toBe('https://example.com/image.jpg')
        })

        it('should show deprecated warning with cimg', () => {
            const { wrapper } = mountCListComponent(ItemTile, {
                props: {
                    heading: 'Test Tile',
                    cimg: 'https://example.com/image.jpg',
                    deprecated: true
                }
            })

            expect(wrapper.find('.deprecated-warning').exists()).toBe(true)
        })

        it('should not show deprecated warning without flag', () => {
            const { wrapper } = mountCListComponent(ItemTile, {
                props: {
                    heading: 'Test Tile',
                    cimg: 'https://example.com/image.jpg'
                }
            })

            expect(wrapper.find('.deprecated-warning').exists()).toBe(false)
        })
    })

    describe('Visual Indicators - Entity Icons', () => {
        it('should show instructor icon', () => {
            const { wrapper } = mountCListComponent(ItemTile, {
                props: {
                    heading: 'Instructor Tile',
                    options: { entityIcon: true },
                    models: { entityType: 'instructor' }
                }
            })

            const icon = wrapper.find('.entity-icon')
            expect(icon.exists()).toBe(true)
            expect(icon.text()).toBe('👤')
        })

        it('should show event icon', () => {
            const { wrapper } = mountCListComponent(ItemTile, {
                props: {
                    heading: 'Event Tile',
                    options: { entityIcon: true },
                    models: { entityType: 'event' }
                }
            })

            const icon = wrapper.find('.entity-icon')
            expect(icon.exists()).toBe(true)
            expect(icon.text()).toBe('👥')
        })

        it('should not show icon when entityIcon option is false', () => {
            const { wrapper } = mountCListComponent(ItemTile, {
                props: {
                    heading: 'Test Tile',
                    models: { entityType: 'event' }
                }
            })

            expect(wrapper.find('.entity-icon').exists()).toBe(false)
        })
    })

    describe('Visual Indicators - Badges', () => {
        it('should show badge when option enabled', () => {
            const { wrapper } = mountCListComponent(ItemTile, {
                props: {
                    heading: 'Test Tile',
                    options: { badge: true }
                }
            })

            expect(wrapper.find('.badge').exists()).toBe(true)
        })

        it('should show counter in badge', () => {
            const { wrapper } = mountCListComponent(ItemTile, {
                props: {
                    heading: 'Test Tile',
                    options: { badge: true, counter: true },
                    models: { count: 15 }
                }
            })

            const badge = wrapper.find('.badge')
            expect(badge.exists()).toBe(true)
            expect(badge.text()).toBe('15')
        })

        it('should apply badge color classes', () => {
            const { wrapper } = mountCListComponent(ItemTile, {
                props: {
                    heading: 'Test Tile',
                    options: { badge: true },
                    models: { badgeColor: 'warning' }
                }
            })

            expect(wrapper.find('.badge-warning').exists()).toBe(true)
        })
    })

    describe('Visual Indicators - Selection Checkbox', () => {
        it('should show checkbox when selectable option enabled', () => {
            const { wrapper } = mountCListComponent(ItemTile, {
                props: {
                    heading: 'Test Tile',
                    options: { selectable: true }
                }
            })

            expect(wrapper.find('.checkbox').exists()).toBe(true)
        })

        it('should show checked state when selected', () => {
            const { wrapper } = mountCListComponent(ItemTile, {
                props: {
                    heading: 'Test Tile',
                    options: { selectable: true },
                    models: { selected: true }
                }
            })

            const checkbox = wrapper.find('.checkbox')
            expect(checkbox.classes()).toContain('checked')
            expect(checkbox.find('svg').exists()).toBe(true)
        })

        it('should not show checkmark when unselected', () => {
            const { wrapper } = mountCListComponent(ItemTile, {
                props: {
                    heading: 'Test Tile',
                    options: { selectable: true },
                    models: { selected: false }
                }
            })

            const checkbox = wrapper.find('.checkbox')
            expect(checkbox.classes()).not.toContain('checked')
            expect(checkbox.find('svg').exists()).toBe(false)
        })
    })

    describe('Visual Indicators - Marker Bars', () => {
        it('should show primary marker', () => {
            const { wrapper } = mountCListComponent(ItemTile, {
                props: {
                    heading: 'Test Tile',
                    options: { marker: true },
                    models: { marked: 'primary' }
                }
            })

            expect(wrapper.find('.marker-primary').exists()).toBe(true)
        })

        it('should show accent marker by default', () => {
            const { wrapper } = mountCListComponent(ItemTile, {
                props: {
                    heading: 'Test Tile',
                    options: { marker: true }
                }
            })

            expect(wrapper.find('.marker-accent').exists()).toBe(true)
        })

        it('should not show marker when option disabled', () => {
            const { wrapper } = mountCListComponent(ItemTile, {
                props: {
                    heading: 'Test Tile',
                    models: { marked: 'primary' }
                }
            })

            expect(wrapper.find('[class*="marker-"]').exists()).toBe(false)
        })
    })

    describe('Selection State', () => {
        it('should apply is-selected class when selected', () => {
            const { wrapper } = mountCListComponent(ItemTile, {
                props: {
                    heading: 'Test Tile',
                    models: { selected: true }
                }
            })

            expect(wrapper.find('.is-selected').exists()).toBe(true)
        })

        it('should not apply is-selected class when unselected', () => {
            const { wrapper } = mountCListComponent(ItemTile, {
                props: {
                    heading: 'Test Tile',
                    models: { selected: false }
                }
            })

            expect(wrapper.find('.is-selected').exists()).toBe(false)
        })
    })

    describe('Integration Tests - Real Data', () => {
        it('should render event tile with all visual indicators', () => {
            const event = createMockEvent({
                title: 'Dance Workshop'
            })

            const imageData = createMockImageData('square')

            const { wrapper } = mountCListComponent(ItemTile, {
                props: {
                    heading: event.title,
                    data: imageData,
                    shape: 'square',
                    styleCompact: true,
                    options: {
                        entityIcon: true,
                        badge: true,
                        counter: true,
                        selectable: true,
                        marker: true
                    },
                    models: {
                        entityType: 'event',
                        count: 18,
                        selected: true,
                        marked: 'primary',
                        badgeColor: 'accent'
                    }
                }
            })

            expect(wrapper.find('.entity-icon').text()).toBe('👥')
            expect(wrapper.find('.badge').exists()).toBe(true)
            expect(wrapper.find('.badge').text()).toBe('18')
            expect(wrapper.find('.checkbox.checked').exists()).toBe(true)
            expect(wrapper.find('.marker-primary').exists()).toBe(true)
            expect(wrapper.find('.is-selected').exists()).toBe(true)
        })

        it('should render user tile in non-compact mode', () => {
            const user = createMockUser({
                title: 'Mike Chen'
            })

            const { wrapper } = mountCListComponent(ItemTile, {
                props: {
                    heading: user.title,
                    styleCompact: false,
                    options: { entityIcon: true },
                    models: { entityType: 'instructor' }
                }
            })

            expect(wrapper.text()).toContain('Mike Chen')
            expect(wrapper.find('.entity-icon').text()).toBe('👤')
            expect(wrapper.find('.tile-image').exists()).toBe(true)
            expect(wrapper.find('.tile-heading').exists()).toBe(true)
        })

        it('should render project tile with minimal options', () => {
            const project = createMockProject({
                title: 'New Platform'
            })

            const { wrapper } = mountCListComponent(ItemTile, {
                props: {
                    heading: project.title,
                    options: { marker: true },
                    models: { marked: 'secondary' }
                }
            })

            expect(wrapper.text()).toContain('New Platform')
            expect(wrapper.find('.marker-secondary').exists()).toBe(true)
        })
    })

    describe('Accessibility', () => {
        it('should have proper image alt text', () => {
            const { wrapper } = mountCListComponent(ItemTile, {
                props: {
                    heading: 'Workshop Photo',
                    cimg: 'https://example.com/workshop.jpg',
                    styleCompact: true
                }
            })

            const img = wrapper.find('img.tile-background')
            expect(img.attributes('alt')).toBe('Workshop Photo')
        })

        it('should have lazy loading on images', () => {
            const { wrapper } = mountCListComponent(ItemTile, {
                props: {
                    heading: 'Test Tile',
                    cimg: 'https://example.com/image.jpg',
                    styleCompact: false
                }
            })

            const img = wrapper.find('.tile-image img')
            expect(img.attributes('loading')).toBe('lazy')
        })
    })

    describe('Edge Cases', () => {
        it('should handle empty heading', () => {
            const { wrapper } = mountCListComponent(ItemTile, {
                props: {
                    heading: ''
                }
            })

            expect(wrapper.find('.item-tile').exists()).toBe(true)
        })

        it('should handle counter value of 0', () => {
            const { wrapper } = mountCListComponent(ItemTile, {
                props: {
                    heading: 'Test Tile',
                    options: { badge: true, counter: true },
                    models: { count: 0 }
                }
            })

            const badge = wrapper.find('.badge')
            expect(badge.text()).toBe('0')
        })

        it('should handle unknown entity type gracefully', () => {
            const { wrapper } = mountCListComponent(ItemTile, {
                props: {
                    heading: 'Test Tile',
                    options: { entityIcon: true },
                    models: { entityType: 'unknown-type' as any }
                }
            })

            const icon = wrapper.find('.entity-icon')
            expect(icon.exists() ? icon.text() : '').toBe('')
        })

        it('should handle missing models object', () => {
            const { wrapper } = mountCListComponent(ItemTile, {
                props: {
                    heading: 'Test Tile',
                    options: { selectable: true, badge: true }
                }
            })

            expect(wrapper.find('.item-tile').exists()).toBe(true)
            expect(wrapper.find('.checkbox').exists()).toBe(true)
        })

        it('should handle missing options object', () => {
            const { wrapper } = mountCListComponent(ItemTile, {
                props: {
                    heading: 'Test Tile'
                }
            })

            expect(wrapper.find('.item-tile').exists()).toBe(true)
            expect(wrapper.find('.entity-icon').exists()).toBe(false)
            expect(wrapper.find('.badge').exists()).toBe(false)
            expect(wrapper.find('.checkbox').exists()).toBe(false)
        })
    })
})
