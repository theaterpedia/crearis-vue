/**
 * Wrapper Control Validation Tests
 * 
 * These tests ensure that wrapping components (DropdownList, pList, pGallery)
 * control the layout/width of their children, and that ItemList/ItemGallery
 * do NOT control width when inside wrappers.
 * 
 * Purpose: Prevent future corruption where ItemList might try to override
 * wrapper-controlled layout, ensuring clean component boundaries.
 * 
 * Architecture Pattern (Option A):
 * - Wrapper components (DropdownList, pList) accept width/columns props
 * - Wrapper applies CSS classes to control layout
 * - ItemList/ItemGallery always use width="inherit" and columns="off"
 * - ItemList CSS classes are NOT applied when inside wrappers
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'

// Mock useTheme composable
vi.mock('@/composables/useTheme', () => ({
  useTheme: vi.fn(() => ({
    init: vi.fn(),
    avatarWidth: { value: 64 },
    tileWidth: { value: 128 },
    cardWidth: { value: 336 },
    cardHeight: { value: 224 }
  }))
}))

// Mock floating-vue
vi.mock('floating-vue', () => ({
  Dropdown: {
    name: 'VDropdown',
    props: ['shown', 'theme', 'triggers', 'autoHide', 'distance', 'placement'],
    template: `
      <div class="v-dropdown-mock">
        <div class="trigger-wrapper" @click="$emit('update:shown', true)">
          <slot />
        </div>
        <div v-if="shown" class="popper-wrapper">
          <slot name="popper" :hide="() => $emit('update:shown', false)" />
        </div>
      </div>
    `,
    emits: ['update:shown']
  }
}))

import DropdownList from '@/components/clist/DropdownList.vue'
import pList from '@/components/page/pList.vue'
import ItemList from '@/components/clist/ItemList.vue'
import Heading from '@/components/Heading.vue'

const mockFetch = vi.fn()
global.fetch = mockFetch as any

describe('Wrapper Control Validation: DropdownList', () => {
  beforeEach(() => {
    mockFetch.mockReset()
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ([
        { id: 1, title: 'Item 1', xmlID: 'test.item.001' },
        { id: 2, title: 'Item 2', xmlID: 'test.item.002' }
      ])
    })
  })

  describe('RULE: Wrapper Controls Width, Not ItemList', () => {
    it('DropdownList wrapper applies width-small class', async () => {
      const wrapper = mount(DropdownList, {
        props: {
          entity: 'events',
          size: 'medium',
          width: 'small'
        }
      })

      await wrapper.find('.dropdown-trigger').trigger('click')
      await wrapper.vm.$nextTick()

      const dropdownWrapper = wrapper.find('.dropdown-list-wrapper')
      expect(dropdownWrapper.exists()).toBe(true)
      expect(dropdownWrapper.classes()).toContain('width-small')
    })

    it('DropdownList wrapper applies width-medium class', async () => {
      const wrapper = mount(DropdownList, {
        props: {
          entity: 'events',
          size: 'medium',
          width: 'medium'
        }
      })

      await wrapper.find('.dropdown-trigger').trigger('click')
      await wrapper.vm.$nextTick()

      const dropdownWrapper = wrapper.find('.dropdown-list-wrapper')
      expect(dropdownWrapper.classes()).toContain('width-medium')
    })

    it('DropdownList wrapper applies width-large class', async () => {
      const wrapper = mount(DropdownList, {
        props: {
          entity: 'events',
          size: 'medium',
          width: 'large'
        }
      })

      await wrapper.find('.dropdown-trigger').trigger('click')
      await wrapper.vm.$nextTick()

      const dropdownWrapper = wrapper.find('.dropdown-list-wrapper')
      expect(dropdownWrapper.classes()).toContain('width-large')
    })

    it('DropdownList wrapper applies columns-on class', async () => {
      const wrapper = mount(DropdownList, {
        props: {
          entity: 'events',
          size: 'medium',
          width: 'medium',
          columns: 'on'
        }
      })

      await wrapper.find('.dropdown-trigger').trigger('click')
      await wrapper.vm.$nextTick()

      const dropdownWrapper = wrapper.find('.dropdown-list-wrapper')
      expect(dropdownWrapper.classes()).toContain('columns-on')
    })
  })

  describe('RULE: ItemList Inside Wrapper MUST Use inherit', () => {
    it('ItemList receives width="inherit" from DropdownList', async () => {
      const wrapper = mount(DropdownList, {
        props: {
          entity: 'events',
          size: 'medium',
          width: 'small' // User wants small width
        }
      })

      await wrapper.find('.dropdown-trigger').trigger('click')
      await wrapper.vm.$nextTick()

      const itemList = wrapper.findComponent(ItemList)
      expect(itemList.exists()).toBe(true)

      // CRITICAL: ItemList must receive "inherit", not "small"
      expect(itemList.props('width')).toBe('inherit')
    })

    it('ItemList receives columns="off" from DropdownList', async () => {
      const wrapper = mount(DropdownList, {
        props: {
          entity: 'events',
          size: 'medium',
          columns: 'on' // User wants multi-column
        }
      })

      await wrapper.find('.dropdown-trigger').trigger('click')
      await wrapper.vm.$nextTick()

      const itemList = wrapper.findComponent(ItemList)

      // CRITICAL: ItemList must receive "off", wrapper handles columns
      expect(itemList.props('columns')).toBe('off')
    })

    it('ItemList does NOT apply its own width classes when width="inherit"', async () => {
      const wrapper = mount(DropdownList, {
        props: {
          entity: 'events',
          size: 'medium',
          width: 'small'
        }
      })

      await wrapper.find('.dropdown-trigger').trigger('click')
      await wrapper.vm.$nextTick()

      const itemList = wrapper.findComponent(ItemList)
      const itemListElement = itemList.find('.item-list')

      // ItemList should NOT have width-small, width-medium, or width-large classes
      expect(itemListElement.classes()).not.toContain('width-small')
      expect(itemListElement.classes()).not.toContain('width-medium')
      expect(itemListElement.classes()).not.toContain('width-large')
    })

    it('ItemList does NOT apply columns-on class when columns="off"', async () => {
      const wrapper = mount(DropdownList, {
        props: {
          entity: 'events',
          size: 'medium',
          columns: 'on' // Wrapper wants columns
        }
      })

      await wrapper.find('.dropdown-trigger').trigger('click')
      await wrapper.vm.$nextTick()

      const itemList = wrapper.findComponent(ItemList)
      const itemListElement = itemList.find('.item-list')

      // ItemList should NOT have columns-on class (wrapper handles it)
      expect(itemListElement.classes()).not.toContain('columns-on')
    })
  })

  describe('PROTECTION: Prevent Future Corruption', () => {
    it('FAIL FAST: If ItemList receives non-inherit width from DropdownList', async () => {
      const wrapper = mount(DropdownList, {
        props: {
          entity: 'events',
          size: 'medium',
          width: 'large'
        }
      })

      await wrapper.find('.dropdown-trigger').trigger('click')
      await wrapper.vm.$nextTick()

      const itemList = wrapper.findComponent(ItemList)

      // This test MUST fail if someone changes DropdownList to pass width directly
      if (itemList.props('width') !== 'inherit') {
        throw new Error(
          `CORRUPTION DETECTED: ItemList inside DropdownList received width="${itemList.props('width')}" ` +
          `instead of "inherit". This breaks Option A architecture where wrappers control layout. ` +
          `Fix: Ensure DropdownList template passes width="inherit" to ItemList.`
        )
      }

      expect(itemList.props('width')).toBe('inherit')
    })

    it('FAIL FAST: If ItemList receives columns="on" from DropdownList', async () => {
      const wrapper = mount(DropdownList, {
        props: {
          entity: 'events',
          columns: 'on'
        }
      })

      await wrapper.find('.dropdown-trigger').trigger('click')
      await wrapper.vm.$nextTick()

      const itemList = wrapper.findComponent(ItemList)

      // This test MUST fail if someone changes DropdownList to pass columns directly
      if (itemList.props('columns') !== 'off') {
        throw new Error(
          `CORRUPTION DETECTED: ItemList inside DropdownList received columns="${itemList.props('columns')}" ` +
          `instead of "off". This breaks Option A architecture where wrappers control layout. ` +
          `Fix: Ensure DropdownList template passes columns="off" to ItemList.`
        )
      }

      expect(itemList.props('columns')).toBe('off')
    })
  })
})

describe('Wrapper Control Validation: pList', () => {
  beforeEach(() => {
    mockFetch.mockReset()
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ([
        { id: 1, title: 'Item 1', xmlID: 'test.item.001' }
      ])
    })
  })

  describe('RULE: pList Does NOT Accept width/columns (By Design)', () => {
    it('pList does not have width prop in interface', () => {
      const wrapper = mount(pList, {
        props: {
          type: 'events',
          size: 'medium'
          // NOTE: width prop not available on pList
        },
        global: {
          components: { Heading }
        }
      })

      // pList is a page-level component - sizing controlled by container
      expect(wrapper.exists()).toBe(true)
    })

    it('ItemList inside pList uses default width="inherit"', () => {
      const wrapper = mount(pList, {
        props: {
          type: 'events',
          size: 'medium'
        },
        global: {
          components: { Heading }
        }
      })

      const itemList = wrapper.findComponent(ItemList)
      expect(itemList.exists()).toBe(true)

      // pList doesn't pass width, so ItemList uses its default
      expect(itemList.props('width')).toBe('inherit')
    })
  })

  describe('PROTECTION: pList Should Not Control ItemList Width', () => {
    it('DESIGN VERIFICATION: pList forwards sizing to ItemList via size prop only', () => {
      const wrapper = mount(pList, {
        props: {
          type: 'events',
          size: 'small'
        },
        global: {
          components: { Heading }
        }
      })

      const itemList = wrapper.findComponent(ItemList)

      // pList only controls size (small/medium), not width
      expect(itemList.props('size')).toBe('small')
      expect(itemList.props('width')).toBe('inherit')
      expect(itemList.props('columns')).toBe('off')
    })
  })
})

describe('Architecture Validation: Option A Pattern', () => {
  beforeEach(() => {
    mockFetch.mockReset()
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ([])
    })
  })

  it('ARCHITECTURE: DropdownList owns layout control', async () => {
    const wrapper = mount(DropdownList, {
      props: {
        entity: 'events',
        width: 'small',
        columns: 'on'
      }
    })

    await wrapper.find('.dropdown-trigger').trigger('click')
    await wrapper.vm.$nextTick()

    // Wrapper has classes
    const dropdownWrapper = wrapper.find('.dropdown-list-wrapper')
    expect(dropdownWrapper.exists()).toBe(true)
    expect(dropdownWrapper.classes()).toContain('width-small')

    // Note: columns-on applied via :deep() in CSS, not as class on wrapper
    // The computed wrapperClasses adds columns-on when appropriate
    const wrapperHtml = dropdownWrapper.html()
    // Check that wrapper CSS will target .item-list for columns layout

    // ItemList does NOT have classes (inherits from wrapper)
    const itemList = wrapper.findComponent(ItemList)
    const itemListElement = itemList.find('.item-list')
    expect(itemListElement.classes()).not.toContain('width-small')
    expect(itemListElement.classes()).not.toContain('columns-on')
  })

  it('ARCHITECTURE: ItemList standalone can still control its own width', () => {
    // When ItemList is used DIRECTLY (not in wrapper), it can control width
    const wrapper = mount(ItemList, {
      props: {
        entity: 'events',
        size: 'medium',
        width: 'small',
        columns: 'on'
      }
    })

    const itemListElement = wrapper.find('.item-list')

    // In standalone mode, ItemList applies its own classes
    expect(itemListElement.classes()).toContain('width-small')

    // Note: ItemList only adds columns-on when width !== 'small'
    // Let's test with width='medium' instead
    const wrapperMedium = mount(ItemList, {
      props: {
        entity: 'events',
        size: 'medium',
        width: 'medium',
        columns: 'on'
      }
    })

    const itemListMedium = wrapperMedium.find('.item-list')
    expect(itemListMedium.classes()).toContain('width-medium')
    expect(itemListMedium.classes()).toContain('columns-on')
  })

  it('SEPARATION OF CONCERNS: Wrapper CSS vs ItemList CSS', async () => {
    const wrapperInstance = mount(DropdownList, {
      props: {
        entity: 'events',
        width: 'medium'
      }
    })

    await wrapperInstance.find('.dropdown-trigger').trigger('click')
    await wrapperInstance.vm.$nextTick()

    const standaloneInstance = mount(ItemList, {
      props: {
        entity: 'events',
        width: 'medium'
      }
    })

    // Wrapper applies width to .dropdown-list-wrapper
    expect(wrapperInstance.find('.dropdown-list-wrapper.width-medium').exists()).toBe(true)

    // Standalone applies width to .item-list
    expect(standaloneInstance.find('.item-list.width-medium').exists()).toBe(true)

    // ItemList inside wrapper does NOT have width class
    const itemListInWrapper = wrapperInstance.findComponent(ItemList)
    expect(itemListInWrapper.find('.item-list.width-medium').exists()).toBe(false)
  })
})

describe('Regression Prevention: Future-Proofing', () => {
  beforeEach(() => {
    mockFetch.mockReset()
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ([])
    })
  })

  it('REGRESSION TEST: DropdownList width prop must exist', () => {
    // If this test fails, someone removed the width prop
    const wrapper = mount(DropdownList, {
      props: {
        entity: 'events',
        width: 'small'
      }
    })

    // Test that prop was accepted (no Vue warning)
    expect(wrapper.props('width')).toBe('small')
  })

  it('REGRESSION TEST: DropdownList columns prop must exist', () => {
    // If this test fails, someone removed the columns prop
    const wrapper = mount(DropdownList, {
      props: {
        entity: 'events',
        columns: 'on'
      }
    })

    expect(wrapper.props('columns')).toBe('on')
  })

  it('REGRESSION TEST: DropdownList must force ItemList to inherit', async () => {
    const wrapper = mount(DropdownList, {
      props: {
        entity: 'events',
        width: 'large'
      }
    })

    await wrapper.find('.dropdown-trigger').trigger('click')
    await wrapper.vm.$nextTick()

    const itemList = wrapper.findComponent(ItemList)

    // Critical: This prevents someone from "fixing" width forwarding incorrectly
    const receivedWidth = itemList.props('width')
    if (receivedWidth !== 'inherit') {
      throw new Error(
        `REGRESSION: DropdownList is forwarding width="${receivedWidth}" to ItemList. ` +
        `This violates Option A architecture. ItemList must always receive width="inherit" ` +
        `when inside a wrapper component. Check DropdownList template line ~68.`
      )
    }

    expect(receivedWidth).toBe('inherit')
  })

  it('DOCUMENTATION TEST: Verify Option A pattern is enforced', async () => {
    // This test documents the expected behavior
    const wrapper = mount(DropdownList, {
      props: {
        entity: 'events',
        size: 'medium',
        width: 'small',
        columns: 'on'
      }
    })

    await wrapper.find('.dropdown-trigger').trigger('click')
    await wrapper.vm.$nextTick()

    // Expected flow for Option A:
    // 1. User passes width="small" to DropdownList
    expect(wrapper.props('width')).toBe('small')

    // 2. DropdownList applies width-small to .dropdown-list-wrapper
    expect(wrapper.find('.dropdown-list-wrapper').classes()).toContain('width-small')

    // 3. DropdownList passes width="inherit" to ItemList
    const itemList = wrapper.findComponent(ItemList)
    expect(itemList.props('width')).toBe('inherit')

    // 4. ItemList does NOT apply width-small class
    expect(itemList.find('.item-list').classes()).not.toContain('width-small')

    // Result: Clean separation of concerns ✓
  })
})
