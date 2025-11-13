/**
 * Selection State Helpers
 * 
 * Utilities for testing selection behavior in CList components.
 * Works with ItemRow, ItemTile, ItemCard layouts.
 * 
 * @module tests/utils/selection-helpers
 */

import type { VueWrapper } from '@vue/test-utils'
import { expect } from 'vitest'

/**
 * Select an item in a list by index
 * 
 * Triggers click event on item or checkbox.
 * 
 * @param listWrapper - Wrapper containing items
 * @param index - Zero-based index of item to select
 * 
 * @example
 * import { selectItem } from '../../utils/selection-helpers'
 * 
 * const wrapper = mount(ItemList, { props: { items: mockItems }})
 * 
 * await selectItem(wrapper, 0) // Select first item
 * await selectItem(wrapper, 2) // Select third item
 */
export async function selectItem(
    listWrapper: VueWrapper,
    index: number
): Promise<void> {
    const items = listWrapper.findAll('.item-row, .item-tile, .item-card')

    if (index >= items.length || index < 0) {
        throw new Error(`Item index ${index} out of range (0-${items.length - 1})`)
    }

    const item = items[index]

    // Check if already selected to avoid unnecessary actions
    if (isItemSelected(listWrapper, index)) {
        return
    }

    // Try to find and trigger checkbox change
    const checkbox = item.find('input[type="checkbox"]')
    if (checkbox.exists()) {
        // Trigger change event on checkbox (most components listen to @change)
        await checkbox.trigger('change')
    } else {
        // Otherwise click the item itself
        await item.trigger('click')
    }
}

/**
 * Deselect an item in a list by index
 * 
 * @param listWrapper - Wrapper containing items
 * @param index - Zero-based index of item to deselect
 * 
 * @example
 * import { deselectItem } from '../../utils/selection-helpers'
 * 
 * await deselectItem(wrapper, 0)
 */
export async function deselectItem(
    listWrapper: VueWrapper,
    index: number
): Promise<void> {
    const items = listWrapper.findAll('.item-row, .item-tile, .item-card')

    if (index >= items.length || index < 0) {
        throw new Error(`Item index ${index} out of range (0-${items.length - 1})`)
    }

    const item = items[index]

    // Check if already deselected to avoid unnecessary actions
    if (!isItemSelected(listWrapper, index)) {
        return
    }

    const checkbox = item.find('input[type="checkbox"]')
    if (checkbox.exists()) {
        await checkbox.trigger('change')
    } else {
        await item.trigger('click')
    }
}

/**
 * Toggle selection state of an item
 * 
 * @param listWrapper - Wrapper containing items
 * @param index - Zero-based index of item to toggle
 * 
 * @example
 * import { toggleSelection } from '../../utils/selection-helpers'
 * 
 * await toggleSelection(wrapper, 0) // Toggle first item
 */
export async function toggleSelection(
    listWrapper: VueWrapper,
    index: number
): Promise<void> {
    if (isItemSelected(listWrapper, index)) {
        await deselectItem(listWrapper, index)
    } else {
        await selectItem(listWrapper, index)
    }
}

/**
 * Select multiple items by indices
 * 
 * @param listWrapper - Wrapper containing items
 * @param indices - Array of item indices to select
 * 
 * @example
 * import { selectItems } from '../../utils/selection-helpers'
 * 
 * await selectItems(wrapper, [0, 2, 4]) // Select items 0, 2, 4
 */
export async function selectItems(
    listWrapper: VueWrapper,
    indices: number[]
): Promise<void> {
    for (const index of indices) {
        await selectItem(listWrapper, index)
    }
}

/**
 * Select all items in a list
 * 
 * @param listWrapper - Wrapper containing items
 * 
 * @example
 * import { selectAll } from '../../utils/selection-helpers'
 * 
 * await selectAll(wrapper)
 * 
 * expect(getSelectedCount(wrapper)).toBe(items.length)
 */
export async function selectAll(listWrapper: VueWrapper): Promise<void> {
    const items = listWrapper.findAll('.item-row, .item-tile, .item-card')

    for (let i = 0; i < items.length; i++) {
        await selectItem(listWrapper, i)
    }
}

/**
 * Deselect all items in a list
 * 
 * @param listWrapper - Wrapper containing items
 * 
 * @example
 * import { deselectAll } from '../../utils/selection-helpers'
 * 
 * await deselectAll(wrapper)
 * 
 * expect(getSelectedCount(wrapper)).toBe(0)
 */
export async function deselectAll(listWrapper: VueWrapper): Promise<void> {
    const items = listWrapper.findAll('.item-row, .item-tile, .item-card')

    for (let i = 0; i < items.length; i++) {
        await deselectItem(listWrapper, i)
    }
}

/**
 * Check if an item is selected
 * 
 * Checks for selected class or checked checkbox.
 * 
 * @param listWrapper - Wrapper containing items
 * @param index - Zero-based index of item to check
 * @returns True if item is selected
 * 
 * @example
 * import { isItemSelected } from '../../utils/selection-helpers'
 * 
 * if (isItemSelected(wrapper, 0)) {
 *   console.log('First item is selected')
 * }
 */
export function isItemSelected(
    listWrapper: VueWrapper,
    index: number
): boolean {
    const items = listWrapper.findAll('.item-row, .item-tile, .item-card')

    if (index >= items.length || index < 0) {
        throw new Error(`Item index ${index} out of range (0-${items.length - 1})`)
    }

    const item = items[index]

    // Check for selected class
    if (item.classes().includes('selected')) {
        return true
    }

    // Check for checked checkbox
    const checkbox = item.find('input[type="checkbox"]')
    if (checkbox.exists()) {
        const element = checkbox.element as HTMLInputElement
        return element.checked
    }

    return false
}

/**
 * Get all selected item wrappers
 * 
 * @param listWrapper - Wrapper containing items
 * @returns Array of selected item wrappers
 * 
 * @example
 * import { getSelectedItems } from '../../utils/selection-helpers'
 * 
 * const selected = getSelectedItems(wrapper)
 * console.log(`${selected.length} items selected`)
 */
export function getSelectedItems(listWrapper: VueWrapper): VueWrapper[] {
    const items = listWrapper.findAll('.item-row, .item-tile, .item-card')

    return items.filter((_, index) => isItemSelected(listWrapper, index))
}

/**
 * Get count of selected items
 * 
 * @param listWrapper - Wrapper containing items
 * @returns Number of selected items
 * 
 * @example
 * import { getSelectedCount } from '../../utils/selection-helpers'
 * 
 * expect(getSelectedCount(wrapper)).toBe(3)
 */
export function getSelectedCount(listWrapper: VueWrapper): number {
    return getSelectedItems(listWrapper).length
}

/**
 * Get selected item IDs from emitted events
 * 
 * Retrieves IDs from the last 'update:selectedIds' event.
 * 
 * @param wrapper - Component wrapper
 * @returns Array of selected IDs
 * 
 * @example
 * import { getSelectedIds } from '../../utils/selection-helpers'
 * 
 * await selectItem(wrapper, 0)
 * 
 * const ids = getSelectedIds(wrapper)
 * expect(ids).toEqual([1])
 */
export function getSelectedIds(wrapper: VueWrapper): number[] {
    const events = wrapper.emitted('update:selectedIds')
    if (!events || events.length === 0) {
        return []
    }

    const lastEvent = events[events.length - 1]
    const payload = lastEvent[0]

    // Handle both single ID and array
    if (Array.isArray(payload)) {
        return payload
    } else if (typeof payload === 'number') {
        return [payload]
    }

    return []
}

/**
 * Verify item is selected
 * 
 * Assertion helper that throws if item is not selected.
 * 
 * @param listWrapper - Wrapper containing items
 * @param index - Zero-based index of item
 * 
 * @example
 * import { expectItemSelected } from '../../utils/selection-helpers'
 * 
 * await selectItem(wrapper, 0)
 * 
 * expectItemSelected(wrapper, 0) // Passes
 * expectItemSelected(wrapper, 1) // Fails
 */
export function expectItemSelected(
    listWrapper: VueWrapper,
    index: number
): void {
    expect(isItemSelected(listWrapper, index)).toBe(true)
}

/**
 * Verify item is not selected
 * 
 * @param listWrapper - Wrapper containing items
 * @param index - Zero-based index of item
 * 
 * @example
 * import { expectItemNotSelected } from '../../utils/selection-helpers'
 * 
 * expectItemNotSelected(wrapper, 0) // Passes if not selected
 */
export function expectItemNotSelected(
    listWrapper: VueWrapper,
    index: number
): void {
    expect(isItemSelected(listWrapper, index)).toBe(false)
}

/**
 * Verify selection event was emitted with expected IDs
 * 
 * @param wrapper - Component wrapper
 * @param expectedIds - Expected array of selected IDs
 * 
 * @example
 * import { expectSelectionEmitted } from '../../utils/selection-helpers'
 * 
 * await selectItems(wrapper, [0, 2])
 * 
 * expectSelectionEmitted(wrapper, [1, 3]) // IDs are 1-based
 */
export function expectSelectionEmitted(
    wrapper: VueWrapper,
    expectedIds: number[]
): void {
    const events = wrapper.emitted('update:selectedIds')
    expect(events).toBeTruthy()
    expect(events!.length).toBeGreaterThan(0)

    const lastEvent = events![events!.length - 1]
    const payload = lastEvent[0]

    if (Array.isArray(payload)) {
        expect(payload).toEqual(expectedIds)
    } else {
        expect([payload]).toEqual(expectedIds)
    }
}

/**
 * Verify primary highlight is applied
 * 
 * Checks for selected class and primary color box-shadow.
 * 
 * @param itemWrapper - Item wrapper to check
 * 
 * @example
 * import { expectPrimaryHighlight } from '../../utils/selection-helpers'
 * 
 * const items = wrapper.findAll('.item-row')
 * expectPrimaryHighlight(items[0])
 */
export function expectPrimaryHighlight(itemWrapper: VueWrapper): void {
    expect(itemWrapper.classes()).toContain('selected')

    // Check for primary highlight styling
    const element = itemWrapper.element as HTMLElement
    const style = window.getComputedStyle(element)

    // Box-shadow should contain primary color variable or actual color
    const boxShadow = style.boxShadow
    expect(boxShadow).toBeDefined()
    expect(boxShadow).not.toBe('none')
}

/**
 * Verify secondary highlight is applied
 * 
 * Checks for selected class and secondary background color.
 * 
 * @param itemWrapper - Item wrapper to check
 * 
 * @example
 * import { expectSecondaryHighlight } from '../../utils/selection-helpers'
 * 
 * const items = wrapper.findAll('.item-tile')
 * expectSecondaryHighlight(items[2])
 */
export function expectSecondaryHighlight(itemWrapper: VueWrapper): void {
    expect(itemWrapper.classes()).toContain('selected')

    // Check for secondary highlight styling
    const element = itemWrapper.element as HTMLElement
    const style = window.getComputedStyle(element)

    // Background should be set (not transparent)
    const backgroundColor = style.backgroundColor
    expect(backgroundColor).toBeDefined()
    expect(backgroundColor).not.toBe('transparent')
    expect(backgroundColor).not.toBe('rgba(0, 0, 0, 0)')
}

/**
 * Verify no highlight is applied
 * 
 * @param itemWrapper - Item wrapper to check
 * 
 * @example
 * import { expectNoHighlight } from '../../utils/selection-helpers'
 * 
 * const items = wrapper.findAll('.item-card')
 * expectNoHighlight(items[0])
 */
export function expectNoHighlight(itemWrapper: VueWrapper): void {
    expect(itemWrapper.classes()).not.toContain('selected')
}

/**
 * Get item wrapper by index
 * 
 * @param listWrapper - Wrapper containing items
 * @param index - Zero-based index
 * @returns Item wrapper
 * 
 * @example
 * import { getItemByIndex } from '../../utils/selection-helpers'
 * 
 * const item = getItemByIndex(wrapper, 0)
 * expect(item.text()).toContain('Event 1')
 */
export function getItemByIndex(
    listWrapper: VueWrapper,
    index: number
): VueWrapper {
    const items = listWrapper.findAll('.item-row, .item-tile, .item-card')

    if (index >= items.length || index < 0) {
        throw new Error(`Item index ${index} out of range (0-${items.length - 1})`)
    }

    return items[index]
}

/**
 * Get all item wrappers
 * 
 * @param listWrapper - Wrapper containing items
 * @returns Array of all item wrappers
 * 
 * @example
 * import { getAllItems } from '../../utils/selection-helpers'
 * 
 * const items = getAllItems(wrapper)
 * expect(items).toHaveLength(10)
 */
export function getAllItems(listWrapper: VueWrapper): VueWrapper[] {
    return listWrapper.findAll('.item-row, .item-tile, .item-card')
}

/**
 * Find item by text content
 * 
 * @param listWrapper - Wrapper containing items
 * @param text - Text to search for
 * @returns Item wrapper or undefined
 * 
 * @example
 * import { findItemByText } from '../../utils/selection-helpers'
 * 
 * const item = findItemByText(wrapper, 'Summer Festival')
 * expect(item).toBeDefined()
 */
export function findItemByText(
    listWrapper: VueWrapper,
    text: string
): VueWrapper | undefined {
    const items = getAllItems(listWrapper)

    return items.find(item => item.text().includes(text))
}

/**
 * Select item by text content
 * 
 * @param listWrapper - Wrapper containing items
 * @param text - Text to search for
 * 
 * @example
 * import { selectItemByText } from '../../utils/selection-helpers'
 * 
 * await selectItemByText(wrapper, 'Summer Festival')
 * 
 * const item = findItemByText(wrapper, 'Summer Festival')
 * expect(item?.classes()).toContain('selected')
 */
export async function selectItemByText(
    listWrapper: VueWrapper,
    text: string
): Promise<void> {
    const items = getAllItems(listWrapper)
    const index = items.findIndex(item => item.text().includes(text))

    if (index === -1) {
        throw new Error(`Item with text "${text}" not found`)
    }

    await selectItem(listWrapper, index)
}
