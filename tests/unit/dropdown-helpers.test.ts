/**
 * dropdown-helpers - Unit Tests
 * 
 * Validates dropdown interaction utilities work correctly.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { defineComponent, ref } from 'vue'
import { mount } from '@vue/test-utils'
import {
    openDropdown,
    closeDropdown,
    isDropdownOpen,
    getDropdownItems,
    selectDropdownItem,
    selectDropdownItemByIndex,
    getDropdownItemTexts,
    findDropdownItem,
    expectDropdownOpen,
    expectDropdownClosed,
    expectDropdownHasItem,
    expectDropdownItemCount,
    getSelectedDropdownItem,
    expectDropdownItemSelected
} from '../utils/dropdown-helpers'

// Mock dropdown component
const MockDropdown = defineComponent({
    name: 'MockDropdown',
    props: {
        items: {
            type: Array as () => string[],
            default: () => ['Option 1', 'Option 2', 'Option 3']
        }
    },
    emits: ['select'],
    setup(props, { emit }) {
        const isOpen = ref(false)
        const selectedItem = ref<string | null>(null)

        const toggle = () => {
            isOpen.value = !isOpen.value
        }

        const selectItem = (item: string) => {
            selectedItem.value = item
            isOpen.value = false
            emit('select', item)
        }

        return {
            isOpen,
            selectedItem,
            toggle,
            selectItem
        }
    },
    template: `
    <div class="dropdown" :class="{ 'is-open': isOpen }">
      <button 
        class="dropdown-trigger"
        @click="toggle"
        aria-haspopup="true"
        :aria-expanded="isOpen"
      >
        {{ selectedItem || 'Select...' }}
      </button>
      <div v-if="isOpen" class="dropdown-menu">
        <div
          v-for="item in items"
          :key="item"
          class="dropdown-item"
          :class="{ active: item === selectedItem }"
          @click="selectItem(item)"
        >
          {{ item }}
        </div>
      </div>
    </div>
  `
})

// Mock filter dropdown component (different structure)
const MockFilterDropdown = defineComponent({
    name: 'MockFilterDropdown',
    setup() {
        const isOpen = ref(false)
        const selectedType = ref<string>('all')

        const entityTypes = ['all', 'event', 'instructor', 'project', 'post']

        const toggle = () => {
            isOpen.value = !isOpen.value
        }

        const selectType = (type: string) => {
            selectedType.value = type
            isOpen.value = false
        }

        return {
            isOpen,
            selectedType,
            entityTypes,
            toggle,
            selectType
        }
    },
    template: `
    <div class="filter-dropdown">
      <button 
        class="filter-button entity-type-filter"
        @click="toggle"
        aria-haspopup="true"
        :aria-expanded="isOpen"
      >
        Filter: {{ selectedType }}
      </button>
      <div v-if="isOpen" class="dropdown-content">
        <button
          v-for="type in entityTypes"
          :key="type"
          class="menu-item"
          :class="{ selected: type === selectedType }"
          :aria-selected="type === selectedType"
          @click="selectType(type)"
        >
          {{ type }}
        </button>
      </div>
    </div>
  `
})

describe('dropdown-helpers Utilities', () => {
    describe('Basic Dropdown Operations', () => {
        let wrapper: ReturnType<typeof mount>

        beforeEach(() => {
            wrapper = mount(MockDropdown, {
                props: { items: ['Apple', 'Banana', 'Cherry', 'Date'] }
            })
        })

        describe('openDropdown', () => {
            it('should open dropdown by clicking trigger', async () => {
                expect(isDropdownOpen(wrapper)).toBe(false)

                await openDropdown(wrapper)

                expect(isDropdownOpen(wrapper)).toBe(true)
            })

            it('should throw error if trigger not found', async () => {
                await expect(openDropdown(wrapper, '.nonexistent')).rejects.toThrow(
                    'Dropdown trigger not found: .nonexistent'
                )
            })
        })

        describe('closeDropdown', () => {
            it('should close dropdown by toggling trigger', async () => {
                await openDropdown(wrapper)
                expect(isDropdownOpen(wrapper)).toBe(true)

                await closeDropdown(wrapper)

                expect(isDropdownOpen(wrapper)).toBe(false)
            })
        })

        describe('isDropdownOpen', () => {
            it('should return false when closed', () => {
                expect(isDropdownOpen(wrapper)).toBe(false)
            })

            it('should return true when open', async () => {
                await openDropdown(wrapper)

                expect(isDropdownOpen(wrapper)).toBe(true)
            })

            it('should check aria-expanded attribute', async () => {
                await openDropdown(wrapper)

                const trigger = wrapper.find('.dropdown-trigger')
                expect(trigger.attributes('aria-expanded')).toBe('true')
                expect(isDropdownOpen(wrapper)).toBe(true)
            })

            it('should check is-open class', async () => {
                await openDropdown(wrapper)

                const dropdown = wrapper.find('.dropdown')
                expect(dropdown.classes()).toContain('is-open')
                expect(isDropdownOpen(wrapper)).toBe(true)
            })
        })

        describe('getDropdownItems', () => {
            it('should return empty array when closed', () => {
                const items = getDropdownItems(wrapper)
                expect(items).toHaveLength(0)
            })

            it('should return all items when open', async () => {
                await openDropdown(wrapper)

                const items = getDropdownItems(wrapper)
                expect(items).toHaveLength(4)
            })
        })

        describe('getDropdownItemTexts', () => {
            it('should return item text content', async () => {
                await openDropdown(wrapper)

                const texts = getDropdownItemTexts(wrapper)
                expect(texts).toEqual(['Apple', 'Banana', 'Cherry', 'Date'])
            })

            it('should return empty array when closed', () => {
                const texts = getDropdownItemTexts(wrapper)
                expect(texts).toEqual([])
            })
        })

        describe('findDropdownItem', () => {
            it('should find item by text', async () => {
                await openDropdown(wrapper)

                const item = findDropdownItem(wrapper, 'Banana')
                expect(item).toBeDefined()
                expect(item?.text()).toBe('Banana')
            })

            it('should return undefined if not found', async () => {
                await openDropdown(wrapper)

                const item = findDropdownItem(wrapper, 'Watermelon')
                expect(item).toBeUndefined()
            })
        })

        describe('selectDropdownItem', () => {
            it('should open dropdown and select item', async () => {
                await selectDropdownItem(wrapper, 'Cherry')

                expect(wrapper.emitted('select')).toBeTruthy()
                expect(wrapper.emitted('select')?.[0]).toEqual(['Cherry'])
            })

            it('should throw if item not found', async () => {
                await expect(selectDropdownItem(wrapper, 'Watermelon')).rejects.toThrow(
                    'Dropdown item not found: "Watermelon"'
                )
            })

            it('should work when dropdown already open', async () => {
                await openDropdown(wrapper)

                await selectDropdownItem(wrapper, 'Date')

                expect(wrapper.emitted('select')?.[0]).toEqual(['Date'])
            })
        })

        describe('selectDropdownItemByIndex', () => {
            it('should select item by index', async () => {
                await selectDropdownItemByIndex(wrapper, 1) // Banana

                expect(wrapper.emitted('select')?.[0]).toEqual(['Banana'])
            })

            it('should throw for invalid index', async () => {
                await expect(selectDropdownItemByIndex(wrapper, 10)).rejects.toThrow(
                    'Dropdown item index 10 out of range'
                )
            })

            it('should open dropdown if closed', async () => {
                expect(isDropdownOpen(wrapper)).toBe(false)

                await selectDropdownItemByIndex(wrapper, 0)

                expect(wrapper.emitted('select')).toBeTruthy()
            })
        })

        describe('getSelectedDropdownItem', () => {
            it('should return undefined when nothing selected', async () => {
                await openDropdown(wrapper)

                const selected = getSelectedDropdownItem(wrapper)
                expect(selected).toBeUndefined()
            })

            it('should return selected item', async () => {
                await selectDropdownItem(wrapper, 'Apple')
                await openDropdown(wrapper)

                const selected = getSelectedDropdownItem(wrapper)
                expect(selected?.text()).toBe('Apple')
            })
        })
    })

    describe('Assertion Helpers', () => {
        let wrapper: ReturnType<typeof mount>

        beforeEach(() => {
            wrapper = mount(MockDropdown, {
                props: { items: ['Red', 'Green', 'Blue'] }
            })
        })

        describe('expectDropdownOpen', () => {
            it('should pass when dropdown is open', async () => {
                await openDropdown(wrapper)

                expect(() => expectDropdownOpen(wrapper)).not.toThrow()
            })

            it('should fail when dropdown is closed', () => {
                expect(() => expectDropdownOpen(wrapper)).toThrow()
            })
        })

        describe('expectDropdownClosed', () => {
            it('should pass when dropdown is closed', () => {
                expect(() => expectDropdownClosed(wrapper)).not.toThrow()
            })

            it('should fail when dropdown is open', async () => {
                await openDropdown(wrapper)

                expect(() => expectDropdownClosed(wrapper)).toThrow()
            })
        })

        describe('expectDropdownHasItem', () => {
            it('should pass when item exists', async () => {
                await openDropdown(wrapper)

                expect(() => expectDropdownHasItem(wrapper, 'Green')).not.toThrow()
            })

            it('should fail when item does not exist', async () => {
                await openDropdown(wrapper)

                expect(() => expectDropdownHasItem(wrapper, 'Yellow')).toThrow()
            })
        })

        describe('expectDropdownItemCount', () => {
            it('should pass with correct count', async () => {
                await openDropdown(wrapper)

                expect(() => expectDropdownItemCount(wrapper, 3)).not.toThrow()
            })

            it('should fail with incorrect count', async () => {
                await openDropdown(wrapper)

                expect(() => expectDropdownItemCount(wrapper, 5)).toThrow()
            })
        })

        describe('expectDropdownItemSelected', () => {
            it('should pass when item is selected', async () => {
                await selectDropdownItem(wrapper, 'Blue')
                await openDropdown(wrapper)

                expect(() => expectDropdownItemSelected(wrapper, 'Blue')).not.toThrow()
            })

            it('should fail when different item selected', async () => {
                await selectDropdownItem(wrapper, 'Red')
                await openDropdown(wrapper)

                expect(() => expectDropdownItemSelected(wrapper, 'Blue')).toThrow()
            })
        })
    })

    describe('Filter Dropdown (Different Structure)', () => {
        let wrapper: ReturnType<typeof mount>

        beforeEach(() => {
            wrapper = mount(MockFilterDropdown)
        })

        it('should work with filter button selector', async () => {
            await openDropdown(wrapper, '.entity-type-filter')

            expect(isDropdownOpen(wrapper, '.entity-type-filter')).toBe(true)
        })

        it('should get items from dropdown-content', async () => {
            await openDropdown(wrapper, '.entity-type-filter')

            const items = getDropdownItems(wrapper, '.entity-type-filter')
            expect(items).toHaveLength(5)
        })

        it('should select item from filter dropdown', async () => {
            await selectDropdownItem(wrapper, 'event', '.entity-type-filter')

            const trigger = wrapper.find('.filter-button')
            expect(trigger.text()).toContain('event')
        })

        it('should find selected item by aria-selected', async () => {
            await selectDropdownItem(wrapper, 'instructor', '.entity-type-filter')
            await openDropdown(wrapper, '.entity-type-filter')

            const selected = getSelectedDropdownItem(wrapper, '.entity-type-filter')
            expect(selected?.text()).toBe('instructor')
        })
    })

    describe('Integration Tests', () => {
        let wrapper: ReturnType<typeof mount>

        beforeEach(() => {
            wrapper = mount(MockDropdown, {
                props: { items: ['First', 'Second', 'Third', 'Fourth', 'Fifth'] }
            })
        })

        it('should handle complete dropdown interaction flow', async () => {
            // Initially closed
            expectDropdownClosed(wrapper)

            // Open dropdown
            await openDropdown(wrapper)
            expectDropdownOpen(wrapper)
            expectDropdownItemCount(wrapper, 5)

            // Check available items
            const texts = getDropdownItemTexts(wrapper)
            expect(texts).toContain('Second')
            expectDropdownHasItem(wrapper, 'Fourth')

            // Select an item
            await selectDropdownItem(wrapper, 'Third')
            expectDropdownClosed(wrapper) // Should close after selection

            // Reopen and verify selection
            await openDropdown(wrapper)
            expectDropdownItemSelected(wrapper, 'Third')

            // Select by index
            await selectDropdownItemByIndex(wrapper, 0) // First
            await openDropdown(wrapper)
            expectDropdownItemSelected(wrapper, 'First')
        })

        it('should handle multiple open/close cycles', async () => {
            for (let i = 0; i < 3; i++) {
                await openDropdown(wrapper)
                expect(isDropdownOpen(wrapper)).toBe(true)

                await closeDropdown(wrapper)
                expect(isDropdownOpen(wrapper)).toBe(false)
            }
        })

        it('should handle finding and selecting items', async () => {
            await openDropdown(wrapper)

            const item = findDropdownItem(wrapper, 'Second')
            expect(item).toBeDefined()

            await item!.trigger('click')
            expect(wrapper.emitted('select')?.[0]).toEqual(['Second'])
        })
    })
})
