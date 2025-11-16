/**
 * ItemCard Component Tests
 * 
 * Tests the card layout component (336×224px cards)
 * Used in ItemList with size="medium" or ItemGallery
 * 
 * Test Categories:
 * 1. Basic Rendering
 * 2. Size Variants (small/medium/large)
 * 3. Image Display (background images)
 * 4. Visual Indicators (icons, badges, checkboxes, markers)
 * 5. Selection State
 * 6. Slot Support
 * 7. Integration Tests
 * 8. Accessibility
 * 9. Edge Cases
 */

import { describe, it, expect } from 'vitest'
import ItemCard from '@/components/clist/ItemCard.vue'
import { mountCListComponent } from '../utils/mount-helpers'
import {
    createMockEvent,
    createMockUser,
    createMockProject,
    createMockImageData
} from '../utils/clist-test-data'

describe('ItemCard Component', () => {
    describe('Basic Rendering', () => {
        it('should render with minimal props', () => {
            const { wrapper } = mountCListComponent(ItemCard, {
                props: {
                    heading: 'Test Card'
                }
            })

            expect(wrapper.find('.item-card').exists()).toBe(true)
            expect(wrapper.text()).toContain('Test Card')
        })

        it('should render HeadingParser with correct level', () => {
            const { wrapper } = mountCListComponent(ItemCard, {
                props: {
                    heading: 'Test Heading',
                    size: 'medium'
                }
            })

            const heading = wrapper.find('h4')
            expect(heading.exists()).toBe(true)
        })

        it('should apply size class', () => {
            const { wrapper } = mountCListComponent(ItemCard, {
                props: {
                    heading: 'Test',
                    size: 'large'
                }
            })

            expect(wrapper.find('.size-large').exists()).toBe(true)
        })
    })

    describe('Size Variants', () => {
        it('should use h5 for small size', () => {
            const { wrapper } = mountCListComponent(ItemCard, {
                props: {
                    heading: 'Small Card',
                    size: 'small'
                }
            })

            expect(wrapper.find('h5').exists()).toBe(true)
            expect(wrapper.find('.size-small').exists()).toBe(true)
        })

        it('should use h4 for medium size (default)', () => {
            const { wrapper } = mountCListComponent(ItemCard, {
                props: {
                    heading: 'Medium Card'
                }
            })

            expect(wrapper.find('h4').exists()).toBe(true)
            expect(wrapper.find('.size-medium').exists()).toBe(true)
        })

        it('should use h3 for large size', () => {
            const { wrapper } = mountCListComponent(ItemCard, {
                props: {
                    heading: 'Large Card',
                    size: 'large'
                }
            })

            expect(wrapper.find('h3').exists()).toBe(true)
            expect(wrapper.find('.size-large').exists()).toBe(true)
        })
    })

    describe('Image Display', () => {
        it('should render ImgShape with data mode', () => {
            const imageData = createMockImageData('wide')

            const { wrapper } = mountCListComponent(ItemCard, {
                props: {
                    heading: 'Test Card',
                    data: imageData,
                    shape: 'wide'
                }
            })

            expect(wrapper.findComponent({ name: 'ImgShape' }).exists()).toBe(true)
            expect(wrapper.find('.card-background-image').exists()).toBe(true)
            expect(wrapper.find('.has-background').exists()).toBe(true)
        })

        it('should render legacy img with cimg prop', () => {
            const { wrapper } = mountCListComponent(ItemCard, {
                props: {
                    heading: 'Test Card',
                    cimg: 'https://example.com/image.jpg'
                }
            })

            const img = wrapper.find('img.card-background-image')
            expect(img.exists()).toBe(true)
            expect(img.attributes('src')).toBe('https://example.com/image.jpg')
        })

        it('should not render background image when no image provided', () => {
            const { wrapper } = mountCListComponent(ItemCard, {
                props: {
                    heading: 'Test Card'
                }
            })

            expect(wrapper.find('.card-background-image').exists()).toBe(false)
            expect(wrapper.find('.has-background').exists()).toBe(false)
        })

        it('should render background fade overlay when image present', () => {
            const { wrapper } = mountCListComponent(ItemCard, {
                props: {
                    heading: 'Test Card',
                    cimg: 'https://example.com/image.jpg'
                }
            })

            expect(wrapper.find('.card-background-fade').exists()).toBe(true)
        })

        it('should show deprecated warning with cimg', () => {
            const { wrapper } = mountCListComponent(ItemCard, {
                props: {
                    heading: 'Test Card',
                    cimg: 'https://example.com/image.jpg',
                    deprecated: true
                }
            })

            expect(wrapper.find('.deprecated-warning').exists()).toBe(true)
        })

        it('should not show deprecated warning without flag', () => {
            const { wrapper } = mountCListComponent(ItemCard, {
                props: {
                    heading: 'Test Card',
                    cimg: 'https://example.com/image.jpg'
                }
            })

            expect(wrapper.find('.deprecated-warning').exists()).toBe(false)
        })
    })

    describe('Visual Indicators - Entity Icons', () => {
        it('should show instructor icon', () => {
            const { wrapper } = mountCListComponent(ItemCard, {
                props: {
                    heading: 'Instructor Card',
                    options: { entityIcon: true },
                    models: { entityType: 'instructor' }
                }
            })

            const icon = wrapper.find('.entity-icon')
            expect(icon.exists()).toBe(true)
            expect(icon.text()).toBe('👤')
        })

        it('should show event icon', () => {
            const { wrapper } = mountCListComponent(ItemCard, {
                props: {
                    heading: 'Event Card',
                    options: { entityIcon: true },
                    models: { entityType: 'event' }
                }
            })

            const icon = wrapper.find('.entity-icon')
            expect(icon.exists()).toBe(true)
            expect(icon.text()).toBe('👥')
        })

        it('should show project icon', () => {
            const { wrapper } = mountCListComponent(ItemCard, {
                props: {
                    heading: 'Project Card',
                    options: { entityIcon: true },
                    models: { entityType: 'project' }
                }
            })

            const icon = wrapper.find('.entity-icon')
            expect(icon.exists()).toBe(true)
            expect(icon.text()).toBe('📁')
        })

        it('should not show icon when entityIcon option is false', () => {
            const { wrapper } = mountCListComponent(ItemCard, {
                props: {
                    heading: 'Test Card',
                    models: { entityType: 'event' }
                }
            })

            expect(wrapper.find('.entity-icon').exists()).toBe(false)
        })
    })

    describe('Visual Indicators - Badges', () => {
        it('should show badge when option enabled', () => {
            const { wrapper } = mountCListComponent(ItemCard, {
                props: {
                    heading: 'Test Card',
                    options: { badge: true }
                }
            })

            expect(wrapper.find('.badge').exists()).toBe(true)
        })

        it('should show counter in badge', () => {
            const { wrapper } = mountCListComponent(ItemCard, {
                props: {
                    heading: 'Test Card',
                    options: { badge: true, counter: true },
                    models: { count: 8 }
                }
            })

            const badge = wrapper.find('.badge')
            expect(badge.exists()).toBe(true)
            expect(badge.text()).toBe('8')
        })

        it('should apply badge color classes', () => {
            const { wrapper } = mountCListComponent(ItemCard, {
                props: {
                    heading: 'Test Card',
                    options: { badge: true },
                    models: { badgeColor: 'warning' }
                }
            })

            expect(wrapper.find('.badge-warning').exists()).toBe(true)
        })

        it('should default to primary badge color', () => {
            const { wrapper } = mountCListComponent(ItemCard, {
                props: {
                    heading: 'Test Card',
                    options: { badge: true }
                }
            })

            expect(wrapper.find('.badge-primary').exists()).toBe(true)
        })
    })

    describe('Visual Indicators - Selection Checkbox', () => {
        it('should show checkbox when selectable option enabled', () => {
            const { wrapper } = mountCListComponent(ItemCard, {
                props: {
                    heading: 'Test Card',
                    options: { selectable: true }
                }
            })

            expect(wrapper.find('.checkbox').exists()).toBe(true)
        })

        it('should show checked state when selected', () => {
            const { wrapper } = mountCListComponent(ItemCard, {
                props: {
                    heading: 'Test Card',
                    options: { selectable: true },
                    models: { selected: true }
                }
            })

            const checkbox = wrapper.find('.checkbox')
            expect(checkbox.classes()).toContain('checked')
            expect(checkbox.find('svg').exists()).toBe(true)
        })

        it('should not show checkmark when unselected', () => {
            const { wrapper } = mountCListComponent(ItemCard, {
                props: {
                    heading: 'Test Card',
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
            const { wrapper } = mountCListComponent(ItemCard, {
                props: {
                    heading: 'Test Card',
                    options: { marker: true },
                    models: { marked: 'primary' }
                }
            })

            expect(wrapper.find('.marker-primary').exists()).toBe(true)
        })

        it('should show accent marker by default', () => {
            const { wrapper } = mountCListComponent(ItemCard, {
                props: {
                    heading: 'Test Card',
                    options: { marker: true }
                }
            })

            expect(wrapper.find('.marker-accent').exists()).toBe(true)
        })

        it('should show secondary marker', () => {
            const { wrapper } = mountCListComponent(ItemCard, {
                props: {
                    heading: 'Test Card',
                    options: { marker: true },
                    models: { marked: 'secondary' }
                }
            })

            expect(wrapper.find('.marker-secondary').exists()).toBe(true)
        })

        it('should not show marker when option disabled', () => {
            const { wrapper } = mountCListComponent(ItemCard, {
                props: {
                    heading: 'Test Card',
                    models: { marked: 'primary' }
                }
            })

            expect(wrapper.find('[class*="marker-"]').exists()).toBe(false)
        })
    })

    describe('Selection State', () => {
        it('should apply is-selected class when selected', () => {
            const { wrapper } = mountCListComponent(ItemCard, {
                props: {
                    heading: 'Test Card',
                    models: { selected: true }
                }
            })

            expect(wrapper.find('.is-selected').exists()).toBe(true)
        })

        it('should not apply is-selected class when unselected', () => {
            const { wrapper } = mountCListComponent(ItemCard, {
                props: {
                    heading: 'Test Card',
                    models: { selected: false }
                }
            })

            expect(wrapper.find('.is-selected').exists()).toBe(false)
        })

        it('should show visual feedback for selected state', () => {
            const { wrapper } = mountCListComponent(ItemCard, {
                props: {
                    heading: 'Test Card',
                    models: { selected: true }
                }
            })

            const card = wrapper.find('.item-card')
            expect(card.classes()).toContain('is-selected')
        })
    })

    describe('Slot Support', () => {
        it('should render meta slot content', () => {
            const { wrapper } = mountCListComponent(ItemCard, {
                props: {
                    heading: 'Test Card'
                },
                slots: {
                    default: '<div class="meta-info">Extra info</div>'
                }
            })

            expect(wrapper.find('.card-meta').exists()).toBe(true)
            expect(wrapper.find('.meta-info').text()).toBe('Extra info')
        })

        it('should not render meta slot when no slot provided', () => {
            const { wrapper } = mountCListComponent(ItemCard, {
                props: {
                    heading: 'Test Card'
                }
            })

            expect(wrapper.find('.card-meta').exists()).toBe(false)
        })

        it('should support complex slot content', () => {
            const { wrapper } = mountCListComponent(ItemCard, {
                props: {
                    heading: 'Test Card'
                },
                slots: {
                    default: `
            <div class="card-details">
              <span class="date">Jan 15, 2024</span>
              <span class="location">Online</span>
            </div>
          `
                }
            })

            expect(wrapper.find('.card-details').exists()).toBe(true)
            expect(wrapper.find('.date').text()).toBe('Jan 15, 2024')
            expect(wrapper.find('.location').text()).toBe('Online')
        })
    })

    describe('Integration Tests - Real Data', () => {
        it('should render event card with all visual indicators', () => {
            const event = createMockEvent({
                title: 'Theater Workshop 2024'
            })

            const imageData = createMockImageData('wide')

            const { wrapper } = mountCListComponent(ItemCard, {
                props: {
                    heading: event.title,
                    data: imageData,
                    shape: 'wide',
                    size: 'medium',
                    options: {
                        entityIcon: true,
                        badge: true,
                        counter: true,
                        selectable: true,
                        marker: true
                    },
                    models: {
                        entityType: 'event',
                        count: 25,
                        selected: true,
                        marked: 'primary',
                        badgeColor: 'accent'
                    }
                }
            })

            // Verify all indicators present
            expect(wrapper.find('.entity-icon').text()).toBe('👥')
            expect(wrapper.find('.badge').exists()).toBe(true)
            expect(wrapper.find('.badge').text()).toBe('25')
            expect(wrapper.find('.checkbox.checked').exists()).toBe(true)
            expect(wrapper.find('.marker-primary').exists()).toBe(true)
            expect(wrapper.find('.is-selected').exists()).toBe(true)
            expect(wrapper.find('.card-background-image').exists()).toBe(true)
        })

        it('should render user card with minimal options', () => {
            const user = createMockUser({
                title: 'Sarah Johnson'
            })

            const { wrapper } = mountCListComponent(ItemCard, {
                props: {
                    heading: user.title,
                    options: { entityIcon: true },
                    models: { entityType: 'instructor' }
                }
            })

            expect(wrapper.text()).toContain('Sarah Johnson')
            expect(wrapper.find('.entity-icon').text()).toBe('👤')
            expect(wrapper.find('.badge').exists()).toBe(false)
            expect(wrapper.find('.checkbox').exists()).toBe(false)
        })

        it('should render project card without image', () => {
            const project = createMockProject({
                title: 'Database Migration'
            })

            const { wrapper } = mountCListComponent(ItemCard, {
                props: {
                    heading: project.title,
                    size: 'large',
                    options: { marker: true },
                    models: { marked: 'secondary' }
                }
            })

            expect(wrapper.text()).toContain('Database Migration')
            expect(wrapper.find('.card-background-image').exists()).toBe(false)
            expect(wrapper.find('.has-background').exists()).toBe(false)
            expect(wrapper.find('.marker-secondary').exists()).toBe(true)
            expect(wrapper.find('h3').exists()).toBe(true)
        })
    })

    describe('Accessibility', () => {
        it('should have proper image alt text', () => {
            const { wrapper } = mountCListComponent(ItemCard, {
                props: {
                    heading: 'Workshop Photo',
                    cimg: 'https://example.com/workshop.jpg'
                }
            })

            const img = wrapper.find('img.card-background-image')
            expect(img.attributes('alt')).toBe('Workshop Photo')
        })

        it('should have lazy loading on images', () => {
            const { wrapper } = mountCListComponent(ItemCard, {
                props: {
                    heading: 'Test Card',
                    cimg: 'https://example.com/image.jpg'
                }
            })

            const img = wrapper.find('img.card-background-image')
            expect(img.attributes('loading')).toBe('lazy')
        })

        it('should have card structure for screen readers', () => {
            const { wrapper } = mountCListComponent(ItemCard, {
                props: {
                    heading: 'Test Card'
                }
            })

            expect(wrapper.find('.card-content').exists()).toBe(true)
            expect(wrapper.find('.card-header').exists()).toBe(true)
        })
    })

    describe('Edge Cases', () => {
        it('should handle empty heading', () => {
            const { wrapper } = mountCListComponent(ItemCard, {
                props: {
                    heading: ''
                }
            })

            expect(wrapper.find('.item-card').exists()).toBe(true)
        })

        it('should handle counter value of 0', () => {
            const { wrapper } = mountCListComponent(ItemCard, {
                props: {
                    heading: 'Test Card',
                    options: { badge: true, counter: true },
                    models: { count: 0 }
                }
            })

            const badge = wrapper.find('.badge')
            expect(badge.text()).toBe('0')
        })

        it('should handle unknown entity type gracefully', () => {
            const { wrapper } = mountCListComponent(ItemCard, {
                props: {
                    heading: 'Test Card',
                    options: { entityIcon: true },
                    models: { entityType: 'unknown-type' as any }
                }
            })

            const icon = wrapper.find('.entity-icon')
            expect(icon.exists() ? icon.text() : '').toBe('')
        })

        it('should handle missing models object', () => {
            const { wrapper } = mountCListComponent(ItemCard, {
                props: {
                    heading: 'Test Card',
                    options: { selectable: true, badge: true }
                }
            })

            expect(wrapper.find('.item-card').exists()).toBe(true)
            expect(wrapper.find('.checkbox').exists()).toBe(true)
        })

        it('should handle missing options object', () => {
            const { wrapper } = mountCListComponent(ItemCard, {
                props: {
                    heading: 'Test Card'
                }
            })

            expect(wrapper.find('.item-card').exists()).toBe(true)
            expect(wrapper.find('.entity-icon').exists()).toBe(false)
            expect(wrapper.find('.badge').exists()).toBe(false)
            expect(wrapper.find('.checkbox').exists()).toBe(false)
        })
    })
})
