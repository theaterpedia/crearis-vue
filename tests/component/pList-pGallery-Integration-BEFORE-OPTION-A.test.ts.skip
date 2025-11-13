/**
 * pList/pGallery → ItemList Integration Tests
 * 
 * These tests verify correct prop forwarding and data flow from page-level
 * components (pList, pGallery) to ItemList.
 * 
 * Expected Issues to Reproduce:
 * - pList/pGallery not visible when entity has no data
 * - Multi-select not working through pList wrapper
 * - Selection events not bubbling correctly
 * - dataMode prop handling between pList and ItemList
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import pList from '@/components/page/pList.vue'
import pGallery from '@/components/page/pGallery.vue'
import ItemList from '@/components/clist/ItemList.vue'
import Heading from '@/components/Heading.vue'
import { mockUseTheme, resetMockThemeDimensions } from '../utils/test-helpers'

// Mock useTheme composable
vi.mock('@/composables/useTheme', () => ({
  useTheme: mockUseTheme
}))

// Mock fetch for entity data
const mockFetch = vi.fn()
global.fetch = mockFetch as any

describe('pList → ItemList Integration', () => {
  beforeEach(() => {
    resetMockThemeDimensions()
    mockFetch.mockReset()
  })

  describe('Basic Prop Forwarding', () => {
    it('forwards entity type correctly to ItemList', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          items: [
            { id: 1, title: 'Test Event 1', xmlID: 'tp.event.001' },
            { id: 2, title: 'Test Event 2', xmlID: 'tp.event.002' }
          ]
        })
      })

      const wrapper = mount(pList, {
        props: {
          type: 'events',
          projectDomaincode: 'tp'
        },
        global: {
          components: { Heading }
        }
      })

      await wrapper.vm.$nextTick()
      await new Promise(resolve => setTimeout(resolve, 50))

      const itemList = wrapper.findComponent(ItemList)
      expect(itemList.exists()).toBe(true)
      expect(itemList.props('entity')).toBe('events')
      expect(itemList.props('project')).toBe('tp')
    })

    it('forwards size prop to ItemList', () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ items: [] })
      })

      const wrapper = mount(pList, {
        props: {
          type: 'instructors',
          size: 'small'
        },
        global: {
          components: { Heading }
        }
      })

      const itemList = wrapper.findComponent(ItemList)
      expect(itemList.props('size')).toBe('small')
    })

    it('forwards interaction prop to ItemList', () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ items: [] })
      })

      const wrapper = mount(pList, {
        props: {
          type: 'events',
          interaction: 'previewmodal'
        },
        global: {
          components: { Heading }
        }
      })

      const itemList = wrapper.findComponent(ItemList)
      expect(itemList.props('interaction')).toBe('previewmodal')
    })
  })

  describe('Data Mode and Selection Props', () => {
    it('defaults dataMode to false (display-focused)', () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ items: [] })
      })

      const wrapper = mount(pList, {
        props: {
          type: 'instructors'
        },
        global: {
          components: { Heading }
        }
      })

      const itemList = wrapper.findComponent(ItemList)
      expect(itemList.props('dataMode')).toBe(false)
    })

    it('forwards dataMode=true when explicitly set', () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ items: [] })
      })

      const wrapper = mount(pList, {
        props: {
          type: 'instructors',
          dataMode: true
        },
        global: {
          components: { Heading }
        }
      })

      const itemList = wrapper.findComponent(ItemList)
      expect(itemList.props('dataMode')).toBe(true)
    })

    it('forwards multiSelect prop to ItemList', () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ items: [] })
      })

      const wrapper = mount(pList, {
        props: {
          type: 'instructors',
          dataMode: true,
          multiSelect: true
        },
        global: {
          components: { Heading }
        }
      })

      const itemList = wrapper.findComponent(ItemList)
      expect(itemList.props('multiSelect')).toBe(true)
    })

    it('forwards selectedIds prop to ItemList', () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          items: [
            { id: 1, title: 'Instructor 1', xmlID: 'tp.instructor.001' },
            { id: 2, title: 'Instructor 2', xmlID: 'tp.instructor.002' }
          ]
        })
      })

      const wrapper = mount(pList, {
        props: {
          type: 'instructors',
          dataMode: true,
          multiSelect: true,
          selectedIds: [1, 2]
        },
        global: {
          components: { Heading }
        }
      })

      const itemList = wrapper.findComponent(ItemList)
      expect(itemList.props('selectedIds')).toEqual([1, 2])
    })
  })

  describe('Selection Event Bubbling', () => {
    it('bubbles update:selectedIds event from ItemList to pList', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          items: [
            { id: 1, title: 'Instructor 1', xmlID: 'tp.instructor.001' }
          ]
        })
      })

      const wrapper = mount(pList, {
        props: {
          type: 'instructors',
          dataMode: true,
          multiSelect: true
        },
        global: {
          components: { Heading }
        }
      })

      const itemList = wrapper.findComponent(ItemList)

      // Simulate ItemList emitting selection update
      await itemList.vm.$emit('update:selectedIds', [1])

      // Check that pList bubbled the event
      expect(wrapper.emitted('update:selectedIds')).toBeTruthy()
      expect(wrapper.emitted('update:selectedIds')?.[0]).toEqual([[1]])
    })

    it('bubbles selectedXml event from ItemList to pList', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          items: [
            { id: 1, title: 'Event 1', xmlID: 'tp.event.001' }
          ]
        })
      })

      const wrapper = mount(pList, {
        props: {
          type: 'events',
          dataMode: true
        },
        global: {
          components: { Heading }
        }
      })

      const itemList = wrapper.findComponent(ItemList)

      await itemList.vm.$emit('selectedXml', 'tp.event.001')

      expect(wrapper.emitted('selectedXml')).toBeTruthy()
      expect(wrapper.emitted('selectedXml')?.[0]).toEqual(['tp.event.001'])
    })

    it('bubbles selected event from ItemList to pList', async () => {
      const mockItem = { id: 1, title: 'Instructor 1', xmlID: 'tp.instructor.001' }

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          items: [mockItem]
        })
      })

      const wrapper = mount(pList, {
        props: {
          type: 'instructors',
          dataMode: true
        },
        global: {
          components: { Heading }
        }
      })

      const itemList = wrapper.findComponent(ItemList)

      await itemList.vm.$emit('selected', mockItem)

      expect(wrapper.emitted('selected')).toBeTruthy()
      expect(wrapper.emitted('selected')?.[0]).toEqual([mockItem])
    })

    it('bubbles item-click event from ItemList to pList', async () => {
      const mockItem = { id: 1, title: 'Event 1', xmlID: 'tp.event.001' }
      const mockEvent = new MouseEvent('click')

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          items: [mockItem]
        })
      })

      const wrapper = mount(pList, {
        props: {
          type: 'events',
          interaction: 'static'
        },
        global: {
          components: { Heading }
        }
      })

      const itemList = wrapper.findComponent(ItemList)

      await itemList.vm.$emit('item-click', mockItem, mockEvent)

      expect(wrapper.emitted('item-click')).toBeTruthy()
      expect(wrapper.emitted('item-click')?.[0]).toEqual([mockItem, mockEvent])
    })
  })

  describe('XML Filtering Props', () => {
    it('forwards filterXmlPrefix to ItemList', () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ items: [] })
      })

      const wrapper = mount(pList, {
        props: {
          type: 'instructors',
          filterXmlPrefix: 'tp.instructor'
        },
        global: {
          components: { Heading }
        }
      })

      const itemList = wrapper.findComponent(ItemList)
      expect(itemList.props('filterXmlPrefix')).toBe('tp.instructor')
    })

    it('forwards filterXmlPrefixes array to ItemList', () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ items: [] })
      })

      const wrapper = mount(pList, {
        props: {
          type: 'events',
          filterXmlPrefixes: ['tp.event', 'tp.instructor']
        },
        global: {
          components: { Heading }
        }
      })

      const itemList = wrapper.findComponent(ItemList)
      expect(itemList.props('filterXmlPrefixes')).toEqual(['tp.event', 'tp.instructor'])
    })

    it('forwards filterXmlPattern regex to ItemList', () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ items: [] })
      })

      const pattern = /^tp\.event\.\d+$/

      const wrapper = mount(pList, {
        props: {
          type: 'events',
          filterXmlPattern: pattern
        },
        global: {
          components: { Heading }
        }
      })

      const itemList = wrapper.findComponent(ItemList)
      expect(itemList.props('filterXmlPattern')).toBe(pattern)
    })
  })

  describe('Header and Heading Display', () => {
    it('shows header when isAside=true', () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ items: [] })
      })

      const wrapper = mount(pList, {
        props: {
          type: 'events',
          isAside: true,
          header: 'Upcoming Events'
        },
        global: {
          components: { Heading }
        }
      })

      const heading = wrapper.findComponent(Heading)
      expect(heading.exists()).toBe(true)
      expect(heading.props('headline')).toBe('Upcoming Events')
      expect(heading.props('as')).toBe('h4') // Aside uses h4
    })

    it('shows header when isFooter=true', () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ items: [] })
      })

      const wrapper = mount(pList, {
        props: {
          type: 'events',
          isFooter: true,
          header: 'Related Events'
        },
        global: {
          components: { Heading }
        }
      })

      const heading = wrapper.findComponent(Heading)
      expect(heading.exists()).toBe(true)
      expect(heading.props('headline')).toBe('Related Events')
      expect(heading.props('as')).toBe('h3') // Footer uses h3
    })

    it('does not show header when neither isAside nor isFooter', () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ items: [] })
      })

      const wrapper = mount(pList, {
        props: {
          type: 'events',
          header: 'Events'
        },
        global: {
          components: { Heading }
        }
      })

      const heading = wrapper.findComponent(Heading)
      expect(heading.exists()).toBe(false)
    })
  })

  describe('Entity Type Mapping', () => {
    it('maps "posts" type correctly', () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ items: [] })
      })

      const wrapper = mount(pList, {
        props: {
          type: 'posts'
        },
        global: {
          components: { Heading }
        }
      })

      const itemList = wrapper.findComponent(ItemList)
      expect(itemList.props('entity')).toBe('posts')
    })

    it('maps "events" type correctly', () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ items: [] })
      })

      const wrapper = mount(pList, {
        props: {
          type: 'events'
        },
        global: {
          components: { Heading }
        }
      })

      const itemList = wrapper.findComponent(ItemList)
      expect(itemList.props('entity')).toBe('events')
    })

    it('maps "instructors" type correctly', () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ items: [] })
      })

      const wrapper = mount(pList, {
        props: {
          type: 'instructors'
        },
        global: {
          components: { Heading }
        }
      })

      const itemList = wrapper.findComponent(ItemList)
      expect(itemList.props('entity')).toBe('instructors')
    })

    it('handles unsupported "projects" type with warning', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => { })

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ items: [] })
      })

      const wrapper = mount(pList, {
        props: {
          type: 'projects'
        },
        global: {
          components: { Heading }
        }
      })

      const itemList = wrapper.findComponent(ItemList)
      // Falls back to 'posts' when type not supported
      expect(itemList.props('entity')).toBe('posts')

      consoleWarnSpy.mockRestore()
    })
  })
})

describe('pGallery → ItemList Integration', () => {
  beforeEach(() => {
    resetMockThemeDimensions()
    mockFetch.mockReset()
  })

  describe('pGallery Specific Behavior', () => {
    it('uses ItemList with gallery-optimized settings', () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          items: [
            { id: 1, title: 'Image 1', xmlID: 'tp.image.001' },
            { id: 2, title: 'Image 2', xmlID: 'tp.image.002' }
          ]
        })
      })

      const wrapper = mount(pGallery, {
        props: {
          type: 'events',
          projectDomaincode: 'tp',
          size: 'medium'
        },
        global: {
          components: { Heading }
        }
      })

      const itemList = wrapper.findComponent(ItemList)
      expect(itemList.exists()).toBe(true)

      // pGallery should pass size='medium' for tile-based layout
      expect(itemList.props('size')).toBe('medium')
    })

    it('supports multi-select for batch operations', () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ items: [] })
      })

      const wrapper = mount(pGallery, {
        props: {
          type: 'events',
          dataMode: true,
          multiSelect: true,
          selectedIds: [1, 2, 3]
        },
        global: {
          components: { Heading }
        }
      })

      const itemList = wrapper.findComponent(ItemList)
      expect(itemList.props('dataMode')).toBe(true)
      expect(itemList.props('multiSelect')).toBe(true)
      expect(itemList.props('selectedIds')).toEqual([1, 2, 3])
    })
  })
})

describe('ISSUE: pList/pGallery Visibility Problems', () => {
  beforeEach(() => {
    resetMockThemeDimensions()
    mockFetch.mockReset()
  })

  it('ISSUE: pList not visible when API returns empty items array', async () => {
    // Reproduce issue from DemoListItem.vue where pList doesn't show
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        items: [] // Empty array
      })
    })

    const wrapper = mount(pList, {
      props: {
        type: 'events',
        projectDomaincode: 'tp',
        header: 'Upcoming Events',
        isFooter: true
      },
      global: {
        components: { Heading }
      }
    })

    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 50))

    // pList container should exist
    expect(wrapper.find('.p-list').exists()).toBe(true)

    // ItemList should exist even with no data
    const itemList = wrapper.findComponent(ItemList)
    expect(itemList.exists()).toBe(true)

    // ItemList should show loading or empty state
    // This might be where the visibility issue occurs
  })

  it('ISSUE: pGallery not visible with valid data', async () => {
    // Reproduce issue where pGallery doesn't display items
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        items: [
          { id: 1, title: 'Event 1', xmlID: 'tp.event.001' },
          { id: 2, title: 'Event 2', xmlID: 'tp.event.002' }
        ]
      })
    })

    const wrapper = mount(pGallery, {
      props: {
        type: 'events',
        projectDomaincode: 'tp',
        size: 'medium',
        header: 'Event Gallery',
        interaction: 'static'
      },
      global: {
        components: { Heading }
      }
    })

    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 50))

    const itemList = wrapper.findComponent(ItemList)
    expect(itemList.exists()).toBe(true)

    // ItemList should have received the data
    // If not visible, check if ItemList is rendering items
  })
})

describe('Comparison: pList vs DropdownList Prop Forwarding', () => {
  beforeEach(() => {
    resetMockThemeDimensions()
    mockFetch.mockReset()
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ items: [] })
    })
  })

  it('pList forwards entity, project, size, interaction correctly', () => {
    const wrapper = mount(pList, {
      props: {
        type: 'events',
        projectDomaincode: 'tp',
        size: 'small',
        interaction: 'previewmodal'
      },
      global: {
        components: { Heading }
      }
    })

    const itemList = wrapper.findComponent(ItemList)
    expect(itemList.props('entity')).toBe('events')
    expect(itemList.props('project')).toBe('tp')
    expect(itemList.props('size')).toBe('small')
    expect(itemList.props('interaction')).toBe('previewmodal')
  })

  it('pList forwards XML filtering props correctly', () => {
    const wrapper = mount(pList, {
      props: {
        type: 'instructors',
        filterXmlPrefix: 'tp.instructor',
        filterXmlPrefixes: ['tp.instructor', 'tp.event'],
        filterXmlPattern: /^tp\./
      },
      global: {
        components: { Heading }
      }
    })

    const itemList = wrapper.findComponent(ItemList)
    expect(itemList.props('filterXmlPrefix')).toBe('tp.instructor')
    expect(itemList.props('filterXmlPrefixes')).toEqual(['tp.instructor', 'tp.event'])
    expect(itemList.props('filterXmlPattern')).toBeInstanceOf(RegExp)
  })

  it('pList forwards selection props correctly', () => {
    const wrapper = mount(pList, {
      props: {
        type: 'instructors',
        dataMode: true,
        multiSelect: true,
        selectedIds: [1, 2, 3]
      },
      global: {
        components: { Heading }
      }
    })

    const itemList = wrapper.findComponent(ItemList)
    expect(itemList.props('dataMode')).toBe(true)
    expect(itemList.props('multiSelect')).toBe(true)
    expect(itemList.props('selectedIds')).toEqual([1, 2, 3])
  })

  it('NOTE: Both pList and DropdownList lack width/columns forwarding', () => {
    // This is a shared limitation between both components
    // Neither pList nor DropdownList accept or forward width/columns props
    // ItemList supports these props but wrapper components don't expose them

    const wrapper = mount(pList, {
      props: {
        type: 'events'
        // Cannot pass width/columns - not in pList Props interface
      },
      global: {
        components: { Heading }
      }
    })

    const itemList = wrapper.findComponent(ItemList)
    expect(itemList.props('width')).toBeUndefined()
    expect(itemList.props('columns')).toBeUndefined()
  })
})
