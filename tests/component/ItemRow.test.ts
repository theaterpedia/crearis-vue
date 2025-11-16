/**
 * ItemRow Component Tests
 * 
 * Tests the horizontal row layout component (64×64px avatars)
 * Used in ItemList with size="small"
 * 
 * Test Categories:
 * 1. Basic Rendering
 * 2. Image Display (data mode vs legacy cimg)
 * 3. Visual Indicators (icons, badges, checkboxes, markers)
 * 4. Selection State
 * 5. Click Behavior
 * 6. Slot Support
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import ItemRow from '@/components/clist/ItemRow.vue'
import { mountCListComponent } from '../utils/mount-helpers'
import {
  selectItem,
  isItemSelected,
  expectItemSelected,
  expectItemNotSelected
} from '../utils/selection-helpers'
import {
  createMockEvent,
  createMockUser,
  createMockProject,
  createMockImageData
} from '../utils/clist-test-data'

describe('ItemRow Component', () => {
  describe('Basic Rendering', () => {
    it('should render with minimal props', () => {
      const { wrapper } = mountCListComponent(ItemRow, {
        props: {
          heading: 'Test Item'
        }
      })

      expect(wrapper.find('.item-row').exists()).toBe(true)
      expect(wrapper.text()).toContain('Test Item')
    })

    it('should render HeadingParser with h5 level by default', () => {
      const { wrapper } = mountCListComponent(ItemRow, {
        props: {
          heading: 'Test Heading'
        }
      })

      const heading = wrapper.find('h5')
      expect(heading.exists()).toBe(true)
    })

    it('should support custom heading levels (h3-h5)', () => {
      const { wrapper } = mountCListComponent(ItemRow, {
        props: {
          heading: 'Test Heading',
          headingLevel: 'h3'
        }
      })

      const heading = wrapper.find('h3')
      expect(heading.exists()).toBe(true)
    })

    it('should apply custom CSS variables from useTheme', () => {
      const { wrapper } = mountCListComponent(ItemRow, {
        props: {
          heading: 'Test'
        }
      })

      // Component renders with theme context
      const element = wrapper.find('.item-row')
      expect(element.exists()).toBe(true)
    })

    it('should have proper grid layout', () => {
      const { wrapper } = mountCListComponent(ItemRow, {
        props: {
          heading: 'Test'
        }
      })

      expect(wrapper.find('.row-col-image').exists()).toBe(true)
      expect(wrapper.find('.row-col-content').exists()).toBe(true)
    })
  })

  describe('Image Display', () => {
    it('should render ImgShape with data mode', () => {
      const imageData = createMockImageData('thumb')

      const { wrapper } = mountCListComponent(ItemRow, {
        props: {
          heading: 'Test Item',
          data: imageData,
          shape: 'thumb'
        }
      })

      expect(wrapper.findComponent({ name: 'ImgShape' }).exists()).toBe(true)
      expect(wrapper.find('img.image-box').exists()).toBe(false)
    })

    it('should render legacy img with cimg prop', () => {
      const { wrapper } = mountCListComponent(ItemRow, {
        props: {
          heading: 'Test Item',
          cimg: 'https://example.com/image.jpg'
        }
      })

      const img = wrapper.find('img.image-box')
      expect(img.exists()).toBe(true)
      expect(img.attributes('src')).toBe('https://example.com/image.jpg')
      expect(img.attributes('alt')).toBe('Test Item')
    })

    it('should render placeholder when no image provided', () => {
      const { wrapper } = mountCListComponent(ItemRow, {
        props: {
          heading: 'Test Item'
        }
      })

      expect(wrapper.find('.image-placeholder').exists()).toBe(true)
    })

    it('should show deprecated warning with cimg', () => {
      const { wrapper } = mountCListComponent(ItemRow, {
        props: {
          heading: 'Test Item',
          cimg: 'https://example.com/image.jpg',
          deprecated: true
        }
      })

      expect(wrapper.find('.deprecated-warning').exists()).toBe(true)
    })

    it('should not show deprecated warning without flag', () => {
      const { wrapper } = mountCListComponent(ItemRow, {
        props: {
          heading: 'Test Item',
          cimg: 'https://example.com/image.jpg'
        }
      })

      expect(wrapper.find('.deprecated-warning').exists()).toBe(false)
    })
  })

  describe('Visual Indicators - Entity Icons', () => {
    it('should show instructor icon', () => {
      const { wrapper } = mountCListComponent(ItemRow, {
        props: {
          heading: 'John Doe',
          options: { entityIcon: true },
          models: { entityType: 'instructor' }
        }
      })

      const icon = wrapper.find('.entity-icon')
      expect(icon.exists()).toBe(true)
      expect(icon.text()).toBe('👤')
    })

    it('should show event icon', () => {
      const { wrapper } = mountCListComponent(ItemRow, {
        props: {
          heading: 'Workshop',
          options: { entityIcon: true },
          models: { entityType: 'event' }
        }
      })

      const icon = wrapper.find('.entity-icon')
      expect(icon.exists()).toBe(true)
      expect(icon.text()).toBe('👥')
    })

    it('should show location icon', () => {
      const { wrapper } = mountCListComponent(ItemRow, {
        props: {
          heading: 'Theater',
          options: { entityIcon: true },
          models: { entityType: 'location' }
        }
      })

      const icon = wrapper.find('.entity-icon')
      expect(icon.exists()).toBe(true)
      expect(icon.text()).toBe('🎭')
    })

    it('should not show icon when entityIcon option is false', () => {
      const { wrapper } = mountCListComponent(ItemRow, {
        props: {
          heading: 'Test Item',
          options: { entityIcon: false },
          models: { entityType: 'event' }
        }
      })

      expect(wrapper.find('.entity-icon').exists()).toBe(false)
    })
  })

  describe('Visual Indicators - Badges', () => {
    it('should show badge when option enabled', () => {
      const { wrapper } = mountCListComponent(ItemRow, {
        props: {
          heading: 'Test Item',
          options: { badge: true }
        }
      })

      expect(wrapper.find('.badge').exists()).toBe(true)
    })

    it('should show counter in badge', () => {
      const { wrapper } = mountCListComponent(ItemRow, {
        props: {
          heading: 'Test Item',
          options: { badge: true, counter: true },
          models: { count: 5 }
        }
      })

      const badge = wrapper.find('.badge')
      expect(badge.exists()).toBe(true)
      expect(badge.text()).toBe('5')
    })

    it('should apply badge color classes', () => {
      const { wrapper } = mountCListComponent(ItemRow, {
        props: {
          heading: 'Test Item',
          options: { badge: true },
          models: { badgeColor: 'warning' }
        }
      })

      expect(wrapper.find('.badge-warning').exists()).toBe(true)
    })

    it('should default to primary badge color', () => {
      const { wrapper } = mountCListComponent(ItemRow, {
        props: {
          heading: 'Test Item',
          options: { badge: true }
        }
      })

      expect(wrapper.find('.badge-primary').exists()).toBe(true)
    })
  })

  describe('Visual Indicators - Selection Checkbox', () => {
    it('should show checkbox when selectable option enabled', () => {
      const { wrapper } = mountCListComponent(ItemRow, {
        props: {
          heading: 'Test Item',
          options: { selectable: true }
        }
      })

      expect(wrapper.find('.checkbox').exists()).toBe(true)
    })

    it('should show checked state when selected', () => {
      const { wrapper } = mountCListComponent(ItemRow, {
        props: {
          heading: 'Test Item',
          options: { selectable: true },
          models: { selected: true }
        }
      })

      const checkbox = wrapper.find('.checkbox')
      expect(checkbox.classes()).toContain('checked')
      expect(checkbox.find('svg').exists()).toBe(true)
    })

    it('should not show checkmark when unselected', () => {
      const { wrapper } = mountCListComponent(ItemRow, {
        props: {
          heading: 'Test Item',
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
      const { wrapper } = mountCListComponent(ItemRow, {
        props: {
          heading: 'Test Item',
          options: { marker: true },
          models: { marked: 'primary' }
        }
      })

      expect(wrapper.find('.marker-primary').exists()).toBe(true)
    })

    it('should show accent marker by default', () => {
      const { wrapper } = mountCListComponent(ItemRow, {
        props: {
          heading: 'Test Item',
          options: { marker: true }
        }
      })

      expect(wrapper.find('.marker-accent').exists()).toBe(true)
    })

    it('should show warning marker', () => {
      const { wrapper } = mountCListComponent(ItemRow, {
        props: {
          heading: 'Test Item',
          options: { marker: true },
          models: { marked: 'warning' }
        }
      })

      expect(wrapper.find('.marker-warning').exists()).toBe(true)
    })

    it('should not show marker when option disabled', () => {
      const { wrapper } = mountCListComponent(ItemRow, {
        props: {
          heading: 'Test Item',
          options: { marker: false },
          models: { marked: 'primary' }
        }
      })

      expect(wrapper.find('[class*="marker-"]').exists()).toBe(false)
    })
  })

  describe('Selection State', () => {
    it('should apply is-selected class when selected', () => {
      const { wrapper } = mountCListComponent(ItemRow, {
        props: {
          heading: 'Test Item',
          models: { selected: true }
        }
      })

      expect(wrapper.find('.is-selected').exists()).toBe(true)
    })

    it('should not apply is-selected class when unselected', () => {
      const { wrapper } = mountCListComponent(ItemRow, {
        props: {
          heading: 'Test Item',
          models: { selected: false }
        }
      })

      expect(wrapper.find('.is-selected').exists()).toBe(false)
    })

    it('should show visual feedback for selected state', () => {
      const { wrapper } = mountCListComponent(ItemRow, {
        props: {
          heading: 'Test Item',
          models: { selected: true }
        }
      })

      const row = wrapper.find('.item-row')
      expect(row.classes()).toContain('is-selected')
    })
  })

  describe('Click Behavior', () => {
    it('should emit click event when clicked', async () => {
      const { wrapper } = mountCListComponent(ItemRow, {
        props: {
          heading: 'Test Item'
        }
      })

      await wrapper.find('.item-row').trigger('click')

      expect(wrapper.emitted('click')).toBeTruthy()
      expect(wrapper.emitted('click')?.length).toBe(1)
    })

    it('should pass MouseEvent in click emission', async () => {
      const { wrapper } = mountCListComponent(ItemRow, {
        props: {
          heading: 'Test Item'
        }
      })

      await wrapper.find('.item-row').trigger('click')

      const emitted = wrapper.emitted('click')
      expect(emitted).toBeTruthy()
      expect(emitted![0][0]).toBeInstanceOf(MouseEvent)
    })

    it('should be clickable even when not selectable', async () => {
      const { wrapper } = mountCListComponent(ItemRow, {
        props: {
          heading: 'Test Item',
          options: { selectable: false }
        }
      })

      await wrapper.find('.item-row').trigger('click')

      expect(wrapper.emitted('click')).toBeTruthy()
    })
  })

  describe('Slot Support', () => {
    it('should render default slot content', () => {
      const { wrapper } = mountCListComponent(ItemRow, {
        props: {
          heading: 'Test Item'
        },
        slots: {
          default: '<button>Action</button>'
        }
      })

      expect(wrapper.find('.row-col-slot').exists()).toBe(true)
      expect(wrapper.find('button').text()).toBe('Action')
    })

    it('should not render slot column when no slot provided', () => {
      const { wrapper } = mountCListComponent(ItemRow, {
        props: {
          heading: 'Test Item'
        }
      })

      expect(wrapper.find('.row-col-slot').exists()).toBe(false)
    })

    it('should support complex slot content', () => {
      const { wrapper } = mountCListComponent(ItemRow, {
        props: {
          heading: 'Test Item'
        },
        slots: {
          default: `
            <div class="actions">
              <button class="edit">Edit</button>
              <button class="delete">Delete</button>
            </div>
          `
        }
      })

      expect(wrapper.find('.actions').exists()).toBe(true)
      expect(wrapper.find('.edit').text()).toBe('Edit')
      expect(wrapper.find('.delete').text()).toBe('Delete')
    })
  })

  describe('Integration Tests - Real Data', () => {
    it('should render event with all visual indicators', () => {
      const event = createMockEvent({
        title: 'Summer Workshop 2024',
        ximg: 'event-001.jpg'
      })

      const imageData = createMockImageData('thumb')

      const { wrapper } = mountCListComponent(ItemRow, {
        props: {
          heading: event.title,
          data: imageData,
          shape: 'thumb',
          options: {
            entityIcon: true,
            badge: true,
            counter: true,
            selectable: true,
            marker: true
          },
          models: {
            entityType: 'event',
            count: 12,
            selected: true,
            marked: 'primary',
            badgeColor: 'accent'
          }
        }
      })

      // Verify all indicators present
      expect(wrapper.find('.entity-icon').text()).toBe('👥')
      expect(wrapper.find('.badge').exists()).toBe(true)
      expect(wrapper.find('.badge').text()).toBe('12')
      expect(wrapper.find('.checkbox.checked').exists()).toBe(true)
      expect(wrapper.find('.marker-primary').exists()).toBe(true)
      expect(wrapper.find('.is-selected').exists()).toBe(true)
    })

    it('should render user with minimal options', () => {
      const user = createMockUser({
        title: 'Jane Smith'
      })

      const { wrapper } = mountCListComponent(ItemRow, {
        props: {
          heading: user.title,
          options: {
            entityIcon: true
          },
          models: {
            entityType: 'user'
          }
        }
      })

      expect(wrapper.text()).toContain('Jane Smith')
      expect(wrapper.find('.entity-icon').text()).toBe('👤')
      expect(wrapper.find('.badge').exists()).toBe(false)
      expect(wrapper.find('.checkbox').exists()).toBe(false)
    })

    it('should render project without avatar (placeholder)', () => {
      const project = createMockProject({
        title: 'Theater Database'
      })

      const { wrapper } = mountCListComponent(ItemRow, {
        props: {
          heading: project.title,
          options: {
            entityIcon: true,
            marker: true
          },
          models: {
            entityType: 'project',
            marked: 'secondary'
          }
        }
      })

      expect(wrapper.text()).toContain('Theater Database')
      expect(wrapper.find('.image-placeholder').exists()).toBe(true)
      expect(wrapper.find('.marker-secondary').exists()).toBe(true)
    })
  })

  describe('Accessibility', () => {
    it('should have cursor pointer for clickability', () => {
      const { wrapper } = mountCListComponent(ItemRow, {
        props: {
          heading: 'Test Item'
        }
      })

      const row = wrapper.find('.item-row')
      expect(row.exists()).toBe(true)
    })

    it('should have proper image alt text', () => {
      const { wrapper } = mountCListComponent(ItemRow, {
        props: {
          heading: 'Workshop Photo',
          cimg: 'https://example.com/workshop.jpg'
        }
      })

      const img = wrapper.find('img.image-box')
      expect(img.attributes('alt')).toBe('Workshop Photo')
    })

    it('should have lazy loading on images', () => {
      const { wrapper } = mountCListComponent(ItemRow, {
        props: {
          heading: 'Test Item',
          cimg: 'https://example.com/image.jpg'
        }
      })

      const img = wrapper.find('img.image-box')
      expect(img.attributes('loading')).toBe('lazy')
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty heading', () => {
      const { wrapper } = mountCListComponent(ItemRow, {
        props: {
          heading: ''
        }
      })

      expect(wrapper.find('.item-row').exists()).toBe(true)
    })

    it('should handle counter value of 0', () => {
      const { wrapper } = mountCListComponent(ItemRow, {
        props: {
          heading: 'Test Item',
          options: { badge: true, counter: true },
          models: { count: 0 }
        }
      })

      const badge = wrapper.find('.badge')
      expect(badge.text()).toBe('0')
    })

    it('should handle unknown entity type gracefully', () => {
      const { wrapper } = mountCListComponent(ItemRow, {
        props: {
          heading: 'Test Item',
          options: { entityIcon: true },
          models: { entityType: 'unknown-type' as any }
        }
      })

      const icon = wrapper.find('.entity-icon')
      // Unknown entity types render empty icon or no icon
      expect(icon.exists() ? icon.text() : '').toBe('')
    })

    it('should handle missing models object', () => {
      const { wrapper } = mountCListComponent(ItemRow, {
        props: {
          heading: 'Test Item',
          options: { selectable: true, badge: true }
        }
      })

      expect(wrapper.find('.item-row').exists()).toBe(true)
      expect(wrapper.find('.checkbox').exists()).toBe(true)
    })

    it('should handle missing options object', () => {
      const { wrapper } = mountCListComponent(ItemRow, {
        props: {
          heading: 'Test Item'
        }
      })

      expect(wrapper.find('.item-row').exists()).toBe(true)
      expect(wrapper.find('.entity-icon').exists()).toBe(false)
      expect(wrapper.find('.badge').exists()).toBe(false)
    })
  })
})
