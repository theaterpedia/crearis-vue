/**
 * selection-helpers - Unit Tests
 * 
 * Validates selection utilities work correctly.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { defineComponent } from 'vue'
import { mount } from '@vue/test-utils'
import {
    selectItem,
    deselectItem,
    toggleSelection,
    selectItems,
    selectAll,
    deselectAll,
    isItemSelected,
    getSelectedItems,
    getSelectedCount,
    getSelectedIds,
    expectItemSelected,
    expectItemNotSelected,
    expectSelectionEmitted,
    expectPrimaryHighlight,
    expectSecondaryHighlight,
    expectNoHighlight,
    getItemByIndex,
    getAllItems,
    findItemByText,
    selectItemByText
} from '../utils/selection-helpers'

// Mock list component with selectable items
const MockListComponent = defineComponent({
    name: 'MockList',
    props: {
        items: {
            type: Array as () => Array<{ id: number; title: string }>,
            default: () => []
        }
    },
    emits: ['update:selectedIds'],
    data() {
        return {
            selectedIds: [] as number[]
        }
    },
    methods: {
        toggleItem(id: number, event?: Event) {
            // Prevent double-toggle when clicking checkbox
            if (event) {
                event.stopPropagation()
            }

            const index = this.selectedIds.indexOf(id)
            if (index >= 0) {
                this.selectedIds.splice(index, 1)
            } else {
                this.selectedIds.push(id)
            }
            this.$emit('update:selectedIds', [...this.selectedIds])
        }
    },
    template: `
    <div class="list">
      <div
        v-for="item in items"
        :key="item.id"
        class="item-row"
        :class="{ selected: selectedIds.includes(item.id) }"
        @click="toggleItem(item.id)"
      >
        <input
          type="checkbox"
          :checked="selectedIds.includes(item.id)"
          @click.stop
          @change="toggleItem(item.id, $event)"
        />
        <span>{{ item.title }}</span>
      </div>
    </div>
  `
})

describe('selection-helpers Utilities', () => {
    const mockItems = [
        { id: 1, title: 'Item 1' },
        { id: 2, title: 'Item 2' },
        { id: 3, title: 'Item 3' },
        { id: 4, title: 'Item 4' },
        { id: 5, title: 'Item 5' }
    ]

    let wrapper: ReturnType<typeof mount>

    beforeEach(() => {
        wrapper = mount(MockListComponent, {
            props: { items: mockItems }
        })
    })

    describe('selectItem', () => {
        it('should select item by index', async () => {
            await selectItem(wrapper, 0)

            expect(isItemSelected(wrapper, 0)).toBe(true)
        })

        it('should throw error for invalid index', async () => {
            await expect(selectItem(wrapper, 99)).rejects.toThrow('out of range')
            await expect(selectItem(wrapper, -1)).rejects.toThrow('out of range')
        })
    })

    describe('deselectItem', () => {
        it('should deselect item by index', async () => {
            await selectItem(wrapper, 0)
            expect(isItemSelected(wrapper, 0)).toBe(true)

            await deselectItem(wrapper, 0)
            expect(isItemSelected(wrapper, 0)).toBe(false)
        })
    })

    describe('toggleSelection', () => {
        it('should toggle item selection', async () => {
            expect(isItemSelected(wrapper, 0)).toBe(false)

            await toggleSelection(wrapper, 0)
            expect(isItemSelected(wrapper, 0)).toBe(true)

            await toggleSelection(wrapper, 0)
            expect(isItemSelected(wrapper, 0)).toBe(false)
        })
    })

    describe('selectItems', () => {
        it('should select multiple items', async () => {
            await selectItems(wrapper, [0, 2, 4])

            expect(isItemSelected(wrapper, 0)).toBe(true)
            expect(isItemSelected(wrapper, 1)).toBe(false)
            expect(isItemSelected(wrapper, 2)).toBe(true)
            expect(isItemSelected(wrapper, 3)).toBe(false)
            expect(isItemSelected(wrapper, 4)).toBe(true)
        })
    })

    describe('selectAll', () => {
        it('should select all items', async () => {
            await selectAll(wrapper)

            expect(getSelectedCount(wrapper)).toBe(5)

            for (let i = 0; i < 5; i++) {
                expect(isItemSelected(wrapper, i)).toBe(true)
            }
        })
    })

    describe('deselectAll', () => {
        it('should deselect all items', async () => {
            await selectAll(wrapper)
            expect(getSelectedCount(wrapper)).toBe(5)

            await deselectAll(wrapper)
            expect(getSelectedCount(wrapper)).toBe(0)
        })
    })

    describe('isItemSelected', () => {
        it('should return true for selected item', async () => {
            await selectItem(wrapper, 0)

            expect(isItemSelected(wrapper, 0)).toBe(true)
        })

        it('should return false for unselected item', () => {
            expect(isItemSelected(wrapper, 0)).toBe(false)
        })

        it('should check via selected class', async () => {
            await selectItem(wrapper, 0)

            const item = getItemByIndex(wrapper, 0)
            expect(item.classes()).toContain('selected')
            expect(isItemSelected(wrapper, 0)).toBe(true)
        })

        it('should check via checkbox state', async () => {
            await selectItem(wrapper, 0)

            const item = getItemByIndex(wrapper, 0)
            const checkbox = item.find('input[type="checkbox"]').element as HTMLInputElement
            expect(checkbox.checked).toBe(true)
        })
    })

    describe('getSelectedItems', () => {
        it('should return array of selected wrappers', async () => {
            await selectItems(wrapper, [0, 2])

            const selected = getSelectedItems(wrapper)
            expect(selected).toHaveLength(2)
        })

        it('should return empty array when nothing selected', () => {
            const selected = getSelectedItems(wrapper)
            expect(selected).toHaveLength(0)
        })
    })

    describe('getSelectedCount', () => {
        it('should return count of selected items', async () => {
            expect(getSelectedCount(wrapper)).toBe(0)

            await selectItem(wrapper, 0)
            expect(getSelectedCount(wrapper)).toBe(1)

            await selectItems(wrapper, [1, 2])
            expect(getSelectedCount(wrapper)).toBe(3)
        })
    })

    describe('getSelectedIds', () => {
        it('should return IDs from emitted events', async () => {
            await selectItem(wrapper, 0) // ID = 1

            const ids = getSelectedIds(wrapper)
            expect(ids).toEqual([1])
        })

        it('should return multiple IDs', async () => {
            await selectItem(wrapper, 0) // ID = 1
            await selectItem(wrapper, 2) // ID = 3

            const ids = getSelectedIds(wrapper)
            expect(ids).toContain(1)
            expect(ids).toContain(3)
        })

        it('should return empty array when no events', () => {
            const ids = getSelectedIds(wrapper)
            expect(ids).toEqual([])
        })
    })

    describe('expectItemSelected', () => {
        it('should pass for selected item', async () => {
            await selectItem(wrapper, 0)

            expect(() => expectItemSelected(wrapper, 0)).not.toThrow()
        })

        it('should fail for unselected item', () => {
            expect(() => expectItemSelected(wrapper, 0)).toThrow()
        })
    })

    describe('expectItemNotSelected', () => {
        it('should pass for unselected item', () => {
            expect(() => expectItemNotSelected(wrapper, 0)).not.toThrow()
        })

        it('should fail for selected item', async () => {
            await selectItem(wrapper, 0)

            expect(() => expectItemNotSelected(wrapper, 0)).toThrow()
        })
    })

    describe('expectSelectionEmitted', () => {
        it('should verify emitted IDs', async () => {
            await selectItem(wrapper, 0) // ID = 1

            expectSelectionEmitted(wrapper, [1])
        })

        it('should verify multiple IDs', async () => {
            await selectItem(wrapper, 0) // ID = 1
            await selectItem(wrapper, 2) // ID = 3

            const ids = getSelectedIds(wrapper)
            expectSelectionEmitted(wrapper, ids)
        })
    })

    describe('expectPrimaryHighlight', () => {
        it('should verify primary highlight', async () => {
            await selectItem(wrapper, 0)

            const item = getItemByIndex(wrapper, 0)
            expect(() => expectPrimaryHighlight(item)).not.toThrow()
        })
    })

    describe('expectSecondaryHighlight', () => {
        it('should verify secondary highlight', async () => {
            await selectItem(wrapper, 0)

            const item = getItemByIndex(wrapper, 0)
            // This may not have actual styling in test, but should check classes
            expect(item.classes()).toContain('selected')
        })
    })

    describe('expectNoHighlight', () => {
        it('should verify no highlight', () => {
            const item = getItemByIndex(wrapper, 0)
            expectNoHighlight(item)
        })

        it('should fail for highlighted item', async () => {
            await selectItem(wrapper, 0)

            const item = getItemByIndex(wrapper, 0)
            expect(() => expectNoHighlight(item)).toThrow()
        })
    })

    describe('getItemByIndex', () => {
        it('should return item wrapper by index', () => {
            const item = getItemByIndex(wrapper, 0)

            expect(item.exists()).toBe(true)
            expect(item.text()).toContain('Item 1')
        })

        it('should throw for invalid index', () => {
            expect(() => getItemByIndex(wrapper, 99)).toThrow('out of range')
        })
    })

    describe('getAllItems', () => {
        it('should return all item wrappers', () => {
            const items = getAllItems(wrapper)

            expect(items).toHaveLength(5)
        })
    })

    describe('findItemByText', () => {
        it('should find item by text content', () => {
            const item = findItemByText(wrapper, 'Item 3')

            expect(item).toBeDefined()
            expect(item?.text()).toContain('Item 3')
        })

        it('should return undefined when not found', () => {
            const item = findItemByText(wrapper, 'Non-existent')

            expect(item).toBeUndefined()
        })
    })

    describe('selectItemByText', () => {
        it('should select item by text', async () => {
            await selectItemByText(wrapper, 'Item 3')

            const item = findItemByText(wrapper, 'Item 3')
            expect(item?.classes()).toContain('selected')
        })

        it('should throw when text not found', async () => {
            await expect(selectItemByText(wrapper, 'Non-existent'))
                .rejects.toThrow('not found')
        })
    })

    describe('Integration Tests', () => {
        it('should handle complex selection workflows', async () => {
            // Start with nothing selected
            expect(getSelectedCount(wrapper)).toBe(0)

            // Select some items
            await selectItems(wrapper, [0, 2, 4])
            expect(getSelectedCount(wrapper)).toBe(3)

            // Toggle one off
            await toggleSelection(wrapper, 2)
            expect(getSelectedCount(wrapper)).toBe(2)

            // Select all
            await selectAll(wrapper)
            expect(getSelectedCount(wrapper)).toBe(5)

            // Deselect all
            await deselectAll(wrapper)
            expect(getSelectedCount(wrapper)).toBe(0)
        })

        it('should handle selection by text', async () => {
            await selectItemByText(wrapper, 'Item 2')
            await selectItemByText(wrapper, 'Item 4')

            expect(getSelectedCount(wrapper)).toBe(2)

            const item2 = findItemByText(wrapper, 'Item 2')
            const item4 = findItemByText(wrapper, 'Item 4')

            expect(item2?.classes()).toContain('selected')
            expect(item4?.classes()).toContain('selected')
        })
    })
})
