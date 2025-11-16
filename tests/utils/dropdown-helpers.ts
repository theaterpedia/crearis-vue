/**
 * Dropdown Interaction Helpers
 * 
 * Utilities for testing dropdown menus in CList components.
 * Works with FilterControls dropdowns and ItemOptions menus.
 * 
 * @module tests/utils/dropdown-helpers
 */

import type { VueWrapper, DOMWrapper } from '@vue/test-utils'
import { expect } from 'vitest'

/**
 * Open a dropdown menu
 * 
 * Triggers click on dropdown trigger element.
 * If selector not provided, finds first dropdown trigger.
 * 
 * @param wrapper - Component wrapper containing dropdown
 * @param selector - Optional CSS selector for specific dropdown trigger
 * 
 * @example
 * import { openDropdown } from '../../utils/dropdown-helpers'
 * 
 * const wrapper = mount(FilterControls)
 * 
 * await openDropdown(wrapper) // Open first dropdown
 * await openDropdown(wrapper, '.entity-type-filter') // Open specific dropdown
 */
export async function openDropdown(
    wrapper: VueWrapper,
    selector?: string
): Promise<void> {
    const trigger = selector
        ? wrapper.find(selector)
        : wrapper.find('.dropdown-trigger, .filter-button, button[aria-haspopup="true"]')

    if (!trigger.exists()) {
        throw new Error(
            selector
                ? `Dropdown trigger not found: ${selector}`
                : 'No dropdown trigger found'
        )
    }

    await trigger.trigger('click')
}

/**
 * Close a dropdown menu
 * 
 * Attempts to close dropdown by:
 * 1. Clicking close button if exists
 * 2. Clicking trigger again (toggle)
 * 3. Clicking outside dropdown
 * 
 * @param wrapper - Component wrapper containing dropdown
 * @param selector - Optional CSS selector for specific dropdown
 * 
 * @example
 * import { closeDropdown } from '../../utils/dropdown-helpers'
 * 
 * await closeDropdown(wrapper)
 */
export async function closeDropdown(
    wrapper: VueWrapper,
    selector?: string
): Promise<void> {
    // Try to find close button
    const closeBtn = wrapper.find('.dropdown-close, .close-button, button[aria-label="Close"]')
    if (closeBtn.exists()) {
        await closeBtn.trigger('click')
        return
    }

    // Otherwise toggle via trigger
    const trigger = selector
        ? wrapper.find(selector)
        : wrapper.find('.dropdown-trigger, .filter-button, button[aria-haspopup="true"]')

    if (trigger.exists()) {
        await trigger.trigger('click')
        return
    }

    // Last resort: click outside
    await wrapper.trigger('click')
}

/**
 * Check if dropdown is currently open
 * 
 * Checks for dropdown content visibility via:
 * - .dropdown-menu or .dropdown-content element exists and visible
 * - aria-expanded="true" on trigger
 * - .is-open or .show class on dropdown
 * 
 * @param wrapper - Component wrapper containing dropdown
 * @param selector - Optional CSS selector for specific dropdown
 * @returns True if dropdown is open
 * 
 * @example
 * import { isDropdownOpen } from '../../utils/dropdown-helpers'
 * 
 * expect(isDropdownOpen(wrapper)).toBe(false)
 * await openDropdown(wrapper)
 * expect(isDropdownOpen(wrapper)).toBe(true)
 */
export function isDropdownOpen(
    wrapper: VueWrapper,
    selector?: string
): boolean {
    // Check for visible dropdown menu
    const menu = selector
        ? wrapper.find(`${selector} .dropdown-menu, ${selector} .dropdown-content`)
        : wrapper.find('.dropdown-menu, .dropdown-content, .menu-items')

    if (menu.exists() && menu.isVisible()) {
        return true
    }

    // Check aria-expanded
    const trigger = selector
        ? wrapper.find(selector)
        : wrapper.find('.dropdown-trigger, .filter-button, button[aria-haspopup="true"]')

    if (trigger.exists()) {
        const expanded = trigger.attributes('aria-expanded')
        if (expanded === 'true') {
            return true
        }
    }

    // Check for open classes
    const dropdown = selector
        ? wrapper.find(selector)
        : wrapper.find('.dropdown, .filter-dropdown, .item-options')

    if (dropdown.exists()) {
        const classes = dropdown.classes()
        return classes.includes('is-open') || classes.includes('show') || classes.includes('active')
    }

    return false
}

/**
 * Get all items in a dropdown menu
 * 
 * Returns array of menu item wrappers.
 * 
 * @param wrapper - Component wrapper containing dropdown
 * @param selector - Optional CSS selector for specific dropdown
 * @returns Array of menu item wrappers
 * 
 * @example
 * import { getDropdownItems } from '../../utils/dropdown-helpers'
 * 
 * await openDropdown(wrapper)
 * const items = getDropdownItems(wrapper)
 * expect(items).toHaveLength(5)
 */
export function getDropdownItems(
    wrapper: VueWrapper,
    selector?: string
): DOMWrapper<Element>[] {
    if (selector) {
        // Try multiple strategies to find the menu
        // 1. Menu is child of selector
        const context = wrapper.find(selector)
        if (context.exists()) {
            let contextMenu = context.find('.dropdown-menu, .dropdown-content, .menu-items')
            if (contextMenu.exists()) {
                // Found as child - return items
                return contextMenu.findAll('.dropdown-item, .menu-item, li, button, a')
            } else {
                // 2. Menu is sibling of selector (e.g., filter dropdowns)
                const parent = wrapper.find(selector).element.parentElement
                if (parent) {
                    const siblingMenu = wrapper.findAll('.dropdown-content, .dropdown-menu, .menu-items')
                        .find(m => parent.contains(m.element))
                    if (siblingMenu) {
                        return siblingMenu.findAll('.dropdown-item, .menu-item, li, button, a')
                    }
                }
            }
        }
        return []
    } else {
        // Find menu anywhere
        const menu = wrapper.find('.dropdown-menu, .dropdown-content, .menu-items')
        if (!menu.exists()) {
            return []
        }
        return menu.findAll('.dropdown-item, .menu-item, li, button, a')
    }
}

/**
 * Select an item from dropdown by text content
 * 
 * Opens dropdown if closed, finds item by text, clicks it.
 * 
 * @param wrapper - Component wrapper containing dropdown
 * @param text - Text content of item to select
 * @param selector - Optional CSS selector for specific dropdown
 * 
 * @example
 * import { selectDropdownItem } from '../../utils/dropdown-helpers'
 * 
 * await selectDropdownItem(wrapper, 'Events')
 * await selectDropdownItem(wrapper, 'Edit', '.item-options')
 */
export async function selectDropdownItem(
    wrapper: VueWrapper,
    text: string,
    selector?: string
): Promise<void> {
    // Ensure dropdown is open
    if (!isDropdownOpen(wrapper, selector)) {
        await openDropdown(wrapper, selector)
    }

    const items = getDropdownItems(wrapper, selector)
    const item = items.find(el => el.text().includes(text))

    if (!item) {
        throw new Error(
            `Dropdown item not found: "${text}". Available: ${items.map(el => el.text()).join(', ')}`
        )
    }

    await item.trigger('click')
}

/**
 * Select item from dropdown by index
 * 
 * Opens dropdown if closed, clicks item at index.
 * 
 * @param wrapper - Component wrapper containing dropdown
 * @param index - Zero-based index of item to select
 * @param selector - Optional CSS selector for specific dropdown
 * 
 * @example
 * import { selectDropdownItemByIndex } from '../../utils/dropdown-helpers'
 * 
 * await selectDropdownItemByIndex(wrapper, 0) // Select first item
 * await selectDropdownItemByIndex(wrapper, 2, '.entity-type-filter')
 */
export async function selectDropdownItemByIndex(
    wrapper: VueWrapper,
    index: number,
    selector?: string
): Promise<void> {
    // Ensure dropdown is open
    if (!isDropdownOpen(wrapper, selector)) {
        await openDropdown(wrapper, selector)
    }

    const items = getDropdownItems(wrapper, selector)

    if (index < 0 || index >= items.length) {
        throw new Error(`Dropdown item index ${index} out of range (0-${items.length - 1})`)
    }

    await items[index].trigger('click')
}

/**
 * Get text content of all dropdown items
 * 
 * Returns array of text strings from menu items.
 * 
 * @param wrapper - Component wrapper containing dropdown
 * @param selector - Optional CSS selector for specific dropdown
 * @returns Array of item text content
 * 
 * @example
 * import { getDropdownItemTexts } from '../../utils/dropdown-helpers'
 * 
 * await openDropdown(wrapper)
 * const texts = getDropdownItemTexts(wrapper)
 * expect(texts).toContain('Events')
 * expect(texts).toContain('Projects')
 */
export function getDropdownItemTexts(
    wrapper: VueWrapper,
    selector?: string
): string[] {
    const items = getDropdownItems(wrapper, selector)
    return items.map(item => item.text().trim())
}

/**
 * Find dropdown item by text content
 * 
 * Returns wrapper for item matching text, or undefined.
 * 
 * @param wrapper - Component wrapper containing dropdown
 * @param text - Text to search for
 * @param selector - Optional CSS selector for specific dropdown
 * @returns Item wrapper or undefined
 * 
 * @example
 * import { findDropdownItem } from '../../utils/dropdown-helpers'
 * 
 * await openDropdown(wrapper)
 * const item = findDropdownItem(wrapper, 'Delete')
 * expect(item).toBeDefined()
 */
export function findDropdownItem(
    wrapper: VueWrapper,
    text: string,
    selector?: string
): DOMWrapper<Element> | undefined {
    const items = getDropdownItems(wrapper, selector)
    return items.find(el => el.text().includes(text))
}

/**
 * Expect dropdown to be open
 * 
 * Assertion helper that fails if dropdown is not open.
 * 
 * @param wrapper - Component wrapper containing dropdown
 * @param selector - Optional CSS selector for specific dropdown
 * 
 * @example
 * import { expectDropdownOpen } from '../../utils/dropdown-helpers'
 * 
 * await openDropdown(wrapper)
 * expectDropdownOpen(wrapper)
 */
export function expectDropdownOpen(
    wrapper: VueWrapper,
    selector?: string
): void {
    expect(isDropdownOpen(wrapper, selector)).toBe(true)
}

/**
 * Expect dropdown to be closed
 * 
 * Assertion helper that fails if dropdown is open.
 * 
 * @param wrapper - Component wrapper containing dropdown
 * @param selector - Optional CSS selector for specific dropdown
 * 
 * @example
 * import { expectDropdownClosed } from '../../utils/dropdown-helpers'
 * 
 * expectDropdownClosed(wrapper)
 * await openDropdown(wrapper)
 * expectDropdownOpen(wrapper)
 */
export function expectDropdownClosed(
    wrapper: VueWrapper,
    selector?: string
): void {
    expect(isDropdownOpen(wrapper, selector)).toBe(false)
}

/**
 * Expect dropdown to contain specific item
 * 
 * Assertion helper that checks if item exists in dropdown.
 * 
 * @param wrapper - Component wrapper containing dropdown
 * @param text - Text to search for
 * @param selector - Optional CSS selector for specific dropdown
 * 
 * @example
 * import { expectDropdownHasItem } from '../../utils/dropdown-helpers'
 * 
 * await openDropdown(wrapper)
 * expectDropdownHasItem(wrapper, 'Events')
 * expectDropdownHasItem(wrapper, 'Edit', '.item-options')
 */
export function expectDropdownHasItem(
    wrapper: VueWrapper,
    text: string,
    selector?: string
): void {
    const items = getDropdownItemTexts(wrapper, selector)
    expect(items).toContain(text)
}

/**
 * Expect dropdown to have specific number of items
 * 
 * Assertion helper for item count.
 * 
 * @param wrapper - Component wrapper containing dropdown
 * @param count - Expected number of items
 * @param selector - Optional CSS selector for specific dropdown
 * 
 * @example
 * import { expectDropdownItemCount } from '../../utils/dropdown-helpers'
 * 
 * await openDropdown(wrapper)
 * expectDropdownItemCount(wrapper, 5)
 */
export function expectDropdownItemCount(
    wrapper: VueWrapper,
    count: number,
    selector?: string
): void {
    const items = getDropdownItems(wrapper, selector)
    expect(items).toHaveLength(count)
}

/**
 * Get currently selected dropdown item
 * 
 * Finds item with .active, .selected, or aria-selected="true".
 * 
 * @param wrapper - Component wrapper containing dropdown
 * @param selector - Optional CSS selector for specific dropdown
 * @returns Selected item wrapper or undefined
 * 
 * @example
 * import { getSelectedDropdownItem } from '../../utils/dropdown-helpers'
 * 
 * await openDropdown(wrapper)
 * const selected = getSelectedDropdownItem(wrapper)
 * expect(selected?.text()).toBe('Events')
 */
export function getSelectedDropdownItem(
    wrapper: VueWrapper,
    selector?: string
): DOMWrapper<Element> | undefined {
    const items = getDropdownItems(wrapper, selector)

    return items.find(item => {
        const classes = item.classes()
        const ariaSelected = item.attributes('aria-selected')

        return classes.includes('active') ||
            classes.includes('selected') ||
            ariaSelected === 'true'
    })
}

/**
 * Expect specific item to be selected in dropdown
 * 
 * @param wrapper - Component wrapper containing dropdown
 * @param text - Text of item that should be selected
 * @param selector - Optional CSS selector for specific dropdown
 * 
 * @example
 * import { expectDropdownItemSelected } from '../../utils/dropdown-helpers'
 * 
 * await openDropdown(wrapper)
 * await selectDropdownItem(wrapper, 'Events')
 * expectDropdownItemSelected(wrapper, 'Events')
 */
export function expectDropdownItemSelected(
    wrapper: VueWrapper,
    text: string,
    selector?: string
): void {
    const selected = getSelectedDropdownItem(wrapper, selector)
    expect(selected).toBeDefined()
    expect(selected?.text()).toContain(text)
}
