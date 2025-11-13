/**
 * Keyboard Interaction Helpers
 * 
 * Utilities for testing keyboard navigation and input behavior.
 * Essential for catching focus/blur bugs like the ShapeEditor JUMP issue.
 * 
 * @module tests/utils/keyboard-helpers
 */

import type { VueWrapper, DOMWrapper } from '@vue/test-utils'
import { expect } from 'vitest'

/**
 * Keyboard modifier keys
 */
export interface KeyModifiers {
    ctrl?: boolean
    alt?: boolean
    shift?: boolean
    meta?: boolean
}

/**
 * Options for simulating user typing
 */
export interface TypingOptions {
    /** Delay between keystrokes in milliseconds (default: 0) */
    delay?: number
    /** Trigger input event after each keystroke (default: true) */
    triggerInput?: boolean
    /** Clear field before typing (default: false) */
    clearFirst?: boolean
}

/**
 * Press a single key with optional modifiers
 * 
 * Triggers keydown and keyup events with proper event details.
 * 
 * @param element - Element to receive key events
 * @param key - Key to press (e.g., 'a', 'Enter', 'ArrowDown')
 * @param modifiers - Optional modifier keys (ctrl, alt, shift, meta)
 * 
 * @example
 * import { pressKey } from '../../utils/keyboard-helpers'
 * 
 * const input = wrapper.find('input')
 * await pressKey(input, 'a')
 * await pressKey(input, 'Enter')
 * await pressKey(input, 's', { ctrl: true }) // Ctrl+S
 */
export async function pressKey(
    element: DOMWrapper<Element>,
    key: string,
    modifiers: KeyModifiers = {}
): Promise<void> {
    // Only pass properties that Vue Test Utils trigger() supports
    const eventOptions = {
        key,
        code: getKeyCode(key),
        ctrlKey: modifiers.ctrl || false,
        altKey: modifiers.alt || false,
        shiftKey: modifiers.shift || false,
        metaKey: modifiers.meta || false
    }

    await element.trigger('keydown', eventOptions)
    await element.trigger('keyup', eventOptions)
}

/**
 * Type text into an input field character by character
 * 
 * Simulates realistic user typing with optional delays.
 * Essential for testing reactivity issues like the JUMP bug.
 * 
 * @param element - Input element to type into
 * @param text - Text to type
 * @param options - Typing behavior options
 * 
 * @example
 * import { typeText } from '../../utils/keyboard-helpers'
 * 
 * const urlField = wrapper.find('.url-input')
 * await typeText(urlField, 'https://example.com/image.jpg')
 * 
 * // Simulate slow typing (50ms between keys)
 * await typeText(urlField, 'test', { delay: 50 })
 * 
 * // Clear field before typing
 * await typeText(urlField, 'new value', { clearFirst: true })
 */
export async function typeText(
    element: DOMWrapper<Element>,
    text: string,
    options: TypingOptions = {}
): Promise<void> {
    const {
        delay = 0,
        triggerInput = true,
        clearFirst = false
    } = options

    const inputElement = element.element as HTMLInputElement | HTMLTextAreaElement

    // Track current value manually to avoid race conditions
    let currentValue = clearFirst ? '' : inputElement.value

    if (clearFirst) {
        await element.setValue('')
    }

    for (const char of text) {
        // Type character
        await pressKey(element, char)

        // Update input value using setValue (proper Vue Test Utils method)
        currentValue += char
        await element.setValue(currentValue)

        // Delay between keystrokes if specified
        if (delay > 0) {
            await new Promise(resolve => setTimeout(resolve, delay))
        }
    }
}

/**
 * Type text into a field found by selector
 * 
 * Convenience wrapper that finds element and types into it.
 * 
 * @param wrapper - Component wrapper
 * @param selector - CSS selector for input field
 * @param text - Text to type
 * @param options - Typing behavior options
 * 
 * @example
 * import { typeTextInField } from '../../utils/keyboard-helpers'
 * 
 * await typeTextInField(wrapper, '.param-x', '50')
 * await typeTextInField(wrapper, '.url-input', 'https://example.com')
 */
export async function typeTextInField(
    wrapper: VueWrapper,
    selector: string,
    text: string,
    options: TypingOptions = {}
): Promise<void> {
    const element = wrapper.find(selector)

    if (!element.exists()) {
        throw new Error(`Element not found: ${selector}`)
    }

    await typeText(element, text, options)
}

/**
 * Focus an element
 * 
 * @param element - Element to focus
 * 
 * @example
 * import { focusField } from '../../utils/keyboard-helpers'
 * 
 * const input = wrapper.find('input')
 * await focusField(input)
 */
export async function focusField(
    element: DOMWrapper<Element>
): Promise<void> {
    await element.trigger('focus')
}

/**
 * Blur (unfocus) an element
 * 
 * @param element - Element to blur
 * 
 * @example
 * import { blurField } from '../../utils/keyboard-helpers'
 * 
 * await blurField(input)
 */
export async function blurField(
    element: DOMWrapper<Element>
): Promise<void> {
    await element.trigger('blur')
}

/**
 * Focus a field by selector
 * 
 * @param wrapper - Component wrapper
 * @param selector - CSS selector for field
 * 
 * @example
 * import { focusFieldBySelector } from '../../utils/keyboard-helpers'
 * 
 * await focusFieldBySelector(wrapper, '.param-x')
 */
export async function focusFieldBySelector(
    wrapper: VueWrapper,
    selector: string
): Promise<void> {
    const element = wrapper.find(selector)
    if (!element.exists()) {
        throw new Error(`Element not found: ${selector}`)
    }
    await focusField(element)
}

/**
 * Blur a field by selector
 * 
 * @param wrapper - Component wrapper
 * @param selector - CSS selector for field
 * 
 * @example
 * import { blurFieldBySelector } from '../../utils/keyboard-helpers'
 * 
 * await blurFieldBySelector(wrapper, '.param-x')
 */
export async function blurFieldBySelector(
    wrapper: VueWrapper,
    selector: string
): Promise<void> {
    const element = wrapper.find(selector)
    if (!element.exists()) {
        throw new Error(`Element not found: ${selector}`)
    }
    await blurField(element)
}

/**
 * Press Enter key
 * 
 * @param element - Element to receive Enter key
 * 
 * @example
 * import { pressEnter } from '../../utils/keyboard-helpers'
 * 
 * await pressEnter(wrapper.find('input'))
 */
export async function pressEnter(
    element: DOMWrapper<Element>
): Promise<void> {
    await pressKey(element, 'Enter')
}

/**
 * Press Escape key
 * 
 * @param element - Element to receive Escape key
 * 
 * @example
 * import { pressEscape } from '../../utils/keyboard-helpers'
 * 
 * await pressEscape(wrapper.find('.modal'))
 */
export async function pressEscape(
    element: DOMWrapper<Element>
): Promise<void> {
    await pressKey(element, 'Escape')
}

/**
 * Press Tab key
 * 
 * @param element - Element to receive Tab key
 * @param reverse - Press Shift+Tab to go backwards (default: false)
 * 
 * @example
 * import { pressTab } from '../../utils/keyboard-helpers'
 * 
 * await pressTab(wrapper.find('input'))
 * await pressTab(wrapper.find('input'), true) // Shift+Tab
 */
export async function pressTab(
    element: DOMWrapper<Element>,
    reverse = false
): Promise<void> {
    await pressKey(element, 'Tab', { shift: reverse })
}

/**
 * Press Space key
 * 
 * @param element - Element to receive Space key
 * 
 * @example
 * import { pressSpace } from '../../utils/keyboard-helpers'
 * 
 * await pressSpace(wrapper.find('button'))
 */
export async function pressSpace(
    element: DOMWrapper<Element>
): Promise<void> {
    await pressKey(element, ' ')
}

/**
 * Press Arrow Down key
 * 
 * @param element - Element to receive key
 * @param count - Number of times to press (default: 1)
 * 
 * @example
 * import { pressArrowDown } from '../../utils/keyboard-helpers'
 * 
 * await pressArrowDown(wrapper.find('.dropdown'))
 * await pressArrowDown(wrapper.find('.list'), 3) // Press 3 times
 */
export async function pressArrowDown(
    element: DOMWrapper<Element>,
    count = 1
): Promise<void> {
    for (let i = 0; i < count; i++) {
        await pressKey(element, 'ArrowDown')
    }
}

/**
 * Press Arrow Up key
 * 
 * @param element - Element to receive key
 * @param count - Number of times to press (default: 1)
 * 
 * @example
 * import { pressArrowUp } from '../../utils/keyboard-helpers'
 * 
 * await pressArrowUp(wrapper.find('.dropdown'))
 */
export async function pressArrowUp(
    element: DOMWrapper<Element>,
    count = 1
): Promise<void> {
    for (let i = 0; i < count; i++) {
        await pressKey(element, 'ArrowUp')
    }
}

/**
 * Press Arrow Left key
 * 
 * @param element - Element to receive key
 * @param count - Number of times to press (default: 1)
 * 
 * @example
 * import { pressArrowLeft } from '../../utils/keyboard-helpers'
 * 
 * await pressArrowLeft(wrapper.find('input'))
 */
export async function pressArrowLeft(
    element: DOMWrapper<Element>,
    count = 1
): Promise<void> {
    for (let i = 0; i < count; i++) {
        await pressKey(element, 'ArrowLeft')
    }
}

/**
 * Press Arrow Right key
 * 
 * @param element - Element to receive key
 * @param count - Number of times to press (default: 1)
 * 
 * @example
 * import { pressArrowRight } from '../../utils/keyboard-helpers'
 * 
 * await pressArrowRight(wrapper.find('input'))
 */
export async function pressArrowRight(
    element: DOMWrapper<Element>,
    count = 1
): Promise<void> {
    for (let i = 0; i < count; i++) {
        await pressKey(element, 'ArrowRight')
    }
}

/**
 * Check if element is focused
 * 
 * @param wrapper - Component wrapper
 * @param selector - CSS selector for element
 * @returns True if element is focused
 * 
 * @example
 * import { isElementFocused } from '../../utils/keyboard-helpers'
 * 
 * expect(isElementFocused(wrapper, 'input')).toBe(true)
 */
export function isElementFocused(
    wrapper: VueWrapper,
    selector: string
): boolean {
    const element = wrapper.find(selector)
    if (!element.exists()) {
        return false
    }

    // Check if element is the active element in document
    const domElement = element.element as HTMLElement
    return document.activeElement === domElement
}

/**
 * Expect element to be focused
 * 
 * Assertion helper that fails if element is not focused.
 * 
 * @param wrapper - Component wrapper
 * @param selector - CSS selector for element
 * 
 * @example
 * import { expectElementFocused } from '../../utils/keyboard-helpers'
 * 
 * await focusFieldBySelector(wrapper, '.param-x')
 * expectElementFocused(wrapper, '.param-x')
 */
export function expectElementFocused(
    wrapper: VueWrapper,
    selector: string
): void {
    const element = wrapper.find(selector)
    expect(element.exists()).toBe(true)

    const domElement = element.element as HTMLElement
    expect(document.activeElement).toBe(domElement)
}

/**
 * Expect element to not be focused
 * 
 * @param wrapper - Component wrapper
 * @param selector - CSS selector for element
 * 
 * @example
 * import { expectElementNotFocused } from '../../utils/keyboard-helpers'
 * 
 * expectElementNotFocused(wrapper, '.param-x')
 */
export function expectElementNotFocused(
    wrapper: VueWrapper,
    selector: string
): void {
    const element = wrapper.find(selector)
    if (!element.exists()) {
        return // Element doesn't exist, so it's not focused
    }

    const domElement = element.element as HTMLElement
    expect(document.activeElement).not.toBe(domElement)
}

/**
 * Simulate realistic user typing with delays
 * 
 * This is the key function for catching JUMP-like bugs.
 * Simulates real user typing behavior with natural delays.
 * 
 * @param wrapper - Component wrapper
 * @param selector - CSS selector for input field
 * @param text - Text to type
 * @param options - Typing options
 * 
 * @example
 * import { simulateUserTyping } from '../../utils/keyboard-helpers'
 * 
 * // Test that mode doesn't jump during typing (JUMP bug test)
 * await simulateUserTyping(wrapper, '.url-input', 'https://example.com', {
 *   delay: 50, // 50ms between keystrokes (realistic)
 *   verifyEachKeystroke: (keystrokeIndex) => {
 *     // Check mode after each keystroke
 *     expect(getCurrentMode(wrapper)).toBe('direct')
 *   }
 * })
 */
export async function simulateUserTyping(
    wrapper: VueWrapper,
    selector: string,
    text: string,
    options: TypingOptions & {
        verifyEachKeystroke?: (keystrokeIndex: number) => void
    } = {}
): Promise<void> {
    const element = wrapper.find(selector)

    if (!element.exists()) {
        throw new Error(`Element not found: ${selector}`)
    }

    // Focus field first
    await focusField(element)

    const {
        delay = 50, // Default realistic delay
        triggerInput = true,
        clearFirst = false,
        verifyEachKeystroke
    } = options

    const inputElement = element.element as HTMLInputElement | HTMLTextAreaElement

    if (clearFirst) {
        inputElement.value = ''
        if (triggerInput) {
            await element.trigger('input')
        }
    }

    let currentValue = inputElement.value

    for (let i = 0; i < text.length; i++) {
        const char = text[i]

        // Type character
        await pressKey(element, char)

        // Update input value
        currentValue += char
        inputElement.value = currentValue

        // Trigger input event
        if (triggerInput) {
            await element.trigger('input')
        }

        // Allow component to react
        await wrapper.vm.$nextTick()

        // Custom verification after each keystroke (for JUMP bug testing)
        if (verifyEachKeystroke) {
            verifyEachKeystroke(i)
        }

        // Delay between keystrokes
        if (delay > 0 && i < text.length - 1) {
            await new Promise(resolve => setTimeout(resolve, delay))
        }
    }
}

/**
 * Navigate through fields using Tab key
 * 
 * @param wrapper - Component wrapper
 * @param startSelector - CSS selector for starting field
 * @param tabCount - Number of times to press Tab
 * 
 * @example
 * import { navigateFieldsWithTab } from '../../utils/keyboard-helpers'
 * 
 * // Navigate from X field to Y field to Z field
 * await navigateFieldsWithTab(wrapper, '.param-x', 2)
 */
export async function navigateFieldsWithTab(
    wrapper: VueWrapper,
    startSelector: string,
    tabCount: number
): Promise<void> {
    const startElement = wrapper.find(startSelector)

    if (!startElement.exists()) {
        throw new Error(`Start element not found: ${startSelector}`)
    }

    await focusField(startElement)

    let currentElement = startElement
    for (let i = 0; i < tabCount; i++) {
        await pressTab(currentElement)
        await wrapper.vm.$nextTick()

        // Note: In tests, Tab key doesn't actually move focus in jsdom
        // This simulates the Tab behavior for testing Tab key handling
    }
}

/**
 * Clear input field value
 * 
 * @param element - Input element to clear
 * 
 * @example
 * import { clearField } from '../../utils/keyboard-helpers'
 * 
 * await clearField(wrapper.find('.param-x'))
 */
export async function clearField(
    element: DOMWrapper<Element>
): Promise<void> {
    const inputElement = element.element as HTMLInputElement | HTMLTextAreaElement
    inputElement.value = ''
    await element.trigger('input')
}

/**
 * Get KeyboardEvent code from key name
 * 
 * @param key - Key name
 * @returns KeyboardEvent code
 */
function getKeyCode(key: string): string {
    const keyCodeMap: Record<string, string> = {
        'Enter': 'Enter',
        'Escape': 'Escape',
        'Tab': 'Tab',
        'ArrowUp': 'ArrowUp',
        'ArrowDown': 'ArrowDown',
        'ArrowLeft': 'ArrowLeft',
        'ArrowRight': 'ArrowRight',
        ' ': 'Space',
        'Backspace': 'Backspace',
        'Delete': 'Delete'
    }

    return keyCodeMap[key] || `Key${key.toUpperCase()}`
}
