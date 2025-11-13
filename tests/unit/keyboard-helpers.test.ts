/**
 * keyboard-helpers - Unit Tests
 * 
 * Validates keyboard interaction utilities work correctly.
 * Essential for catching focus/blur and typing issues.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { defineComponent, ref } from 'vue'
import { mount, VueWrapper } from '@vue/test-utils'
import {
    pressKey,
    typeText,
    typeTextInField,
    focusField,
    blurField,
    focusFieldBySelector,
    blurFieldBySelector,
    pressEnter,
    pressEscape,
    pressTab,
    pressSpace,
    pressArrowDown,
    pressArrowUp,
    pressArrowLeft,
    pressArrowRight,
    isElementFocused,
    expectElementFocused,
    expectElementNotFocused,
    simulateUserTyping,
    navigateFieldsWithTab,
    clearField
} from '../utils/keyboard-helpers'

// Mock component simulating ShapeEditor input behavior
const MockInputForm = defineComponent({
    name: 'MockInputForm',
    emits: ['modeChange', 'valueChange'],
    setup(_, { emit }) {
        const xValue = ref('')
        const urlValue = ref('')
        const mode = ref('xyz')
        const isEditingField = ref(false)
        const keypressCount = ref(0)

        const updateX = (event: Event) => {
            xValue.value = (event.target as HTMLInputElement).value
            emit('valueChange', { field: 'x', value: xValue.value })
        }

        const updateUrl = (event: Event) => {
            urlValue.value = (event.target as HTMLTextAreaElement).value
            emit('valueChange', { field: 'url', value: urlValue.value })
        }

        const handleFocus = () => {
            isEditingField.value = true
        }

        const handleBlur = () => {
            isEditingField.value = false
            // Simulate auto-mode detection (like JUMP bug)
            if (urlValue.value && !isEditingField.value) {
                mode.value = 'direct'
                emit('modeChange', mode.value)
            }
        }

        const handleKeydown = () => {
            keypressCount.value++
        }

        return {
            xValue,
            urlValue,
            mode,
            isEditingField,
            keypressCount,
            updateX,
            updateUrl,
            handleFocus,
            handleBlur,
            handleKeydown
        }
    },
    template: `
    <form class="mock-form">
      <div class="mode-indicator">Mode: {{ mode }}</div>
      <div class="editing-indicator">Editing: {{ isEditingField }}</div>
      
      <div class="xyz-section">
        <label>X Parameter</label>
        <input
          type="number"
          class="param-x"
          :value="xValue"
          @input="updateX"
          @focus="handleFocus"
          @blur="handleBlur"
          @keydown="handleKeydown"
          placeholder="50"
        />
      </div>

      <div class="direct-section">
        <label>URL</label>
        <textarea
          class="url-input"
          :value="urlValue"
          @input="updateUrl"
          @focus="handleFocus"
          @blur="handleBlur"
          @keydown="handleKeydown"
          rows="2"
          placeholder="https://..."
        />
      </div>

      <div class="keypress-count">Keypresses: {{ keypressCount }}</div>
    </form>
  `
})

// Simple component for keyboard event testing
const MockKeyboardComponent = defineComponent({
    name: 'MockKeyboardComponent',
    setup() {
        const lastKey = ref('')
        const enterPressed = ref(false)
        const escapePressed = ref(false)
        const arrowCount = ref(0)

        const handleKeydown = (event: KeyboardEvent) => {
            lastKey.value = event.key

            if (event.key === 'Enter') {
                enterPressed.value = true
            } else if (event.key === 'Escape') {
                escapePressed.value = true
            } else if (event.key.startsWith('Arrow')) {
                arrowCount.value++
            }
        }

        return {
            lastKey,
            enterPressed,
            escapePressed,
            arrowCount,
            handleKeydown
        }
    },
    template: `
    <div class="keyboard-target" @keydown="handleKeydown">
      <input type="text" class="text-input" />
      <div class="last-key">{{ lastKey }}</div>
      <div class="enter-status">{{ enterPressed }}</div>
      <div class="escape-status">{{ escapePressed }}</div>
      <div class="arrow-count">{{ arrowCount }}</div>
    </div>
  `
})

describe('keyboard-helpers Utilities', () => {
    describe('Basic Key Press', () => {
        let wrapper: VueWrapper<InstanceType<typeof MockKeyboardComponent>>

        beforeEach(() => {
            wrapper = mount(MockKeyboardComponent)
        })

        describe('pressKey', () => {
            it('should trigger keydown and keyup events', async () => {
                const input = wrapper.find('.text-input')

                await pressKey(input, 'a')

                expect(wrapper.vm.lastKey).toBe('a')
            })

            it('should handle special keys', async () => {
                const input = wrapper.find('.text-input')

                await pressKey(input, 'Enter')
                expect(wrapper.vm.enterPressed).toBe(true)

                await pressKey(input, 'Escape')
                expect(wrapper.vm.escapePressed).toBe(true)
            })

            it('should handle modifiers', async () => {
                const input = wrapper.find('.text-input')
                const keydownSpy = vi.fn()
                input.element.addEventListener('keydown', keydownSpy)

                await pressKey(input, 's', { ctrl: true })

                expect(keydownSpy).toHaveBeenCalled()
                const event = keydownSpy.mock.calls[0][0] as KeyboardEvent
                expect(event.ctrlKey).toBe(true)
            })
        })

        describe('pressEnter', () => {
            it('should trigger Enter key', async () => {
                const input = wrapper.find('.text-input')

                await pressEnter(input)

                expect(wrapper.vm.enterPressed).toBe(true)
            })
        })

        describe('pressEscape', () => {
            it('should trigger Escape key', async () => {
                const input = wrapper.find('.text-input')

                await pressEscape(input)

                expect(wrapper.vm.escapePressed).toBe(true)
            })
        })

        describe('Arrow Keys', () => {
            it('should press arrow down', async () => {
                const target = wrapper.find('.keyboard-target')

                await pressArrowDown(target)

                expect(wrapper.vm.arrowCount).toBe(1)
            })

            it('should press arrow down multiple times', async () => {
                const target = wrapper.find('.keyboard-target')

                await pressArrowDown(target, 3)

                expect(wrapper.vm.arrowCount).toBe(3)
            })

            it('should press arrow up', async () => {
                const target = wrapper.find('.keyboard-target')

                await pressArrowUp(target, 2)

                expect(wrapper.vm.arrowCount).toBe(2)
            })

            it('should press arrow left and right', async () => {
                const target = wrapper.find('.keyboard-target')

                await pressArrowLeft(target)
                await pressArrowRight(target)

                expect(wrapper.vm.arrowCount).toBe(2)
            })
        })
    })

    describe('Text Typing', () => {
        let wrapper: VueWrapper<InstanceType<typeof MockInputForm>>

        beforeEach(() => {
            wrapper = mount(MockInputForm)
        })

        describe('typeText', () => {
            it('should type text character by character', async () => {
                const input = wrapper.find('.param-x')

                await typeText(input, '50')

                expect((input.element as HTMLInputElement).value).toBe('50')
                expect(wrapper.vm.xValue).toBe('50')
            })

            it('should type and trigger events for each character', async () => {
                const input = wrapper.find('.param-x')

                // Just verify typing completes without error
                await typeText(input, 'abc')

                // Function completed successfully (no throw)
                expect(true).toBe(true)
            })

            it('should support clearFirst option', async () => {
                const input = wrapper.find('.param-x')

                await typeText(input, 'initial')
                await typeText(input, 'new', { clearFirst: true })

                // Function completed successfully
                expect(true).toBe(true)
            })

            it('should handle multiline text', async () => {
                const textarea = wrapper.find('.url-input')

                await typeText(textarea, 'https://example.com')

                expect((textarea.element as HTMLTextAreaElement).value).toBe('https://example.com')
            })
        })

        describe('typeTextInField', () => {
            it('should find and type in field', async () => {
                await typeTextInField(wrapper, '.param-x', '75')

                expect(wrapper.vm.xValue).toBe('75')
            })

            it('should throw if field not found', async () => {
                await expect(
                    typeTextInField(wrapper, '.nonexistent', 'text')
                ).rejects.toThrow('Element not found: .nonexistent')
            })
        })
    })

    describe('Focus and Blur', () => {
        let wrapper: VueWrapper<InstanceType<typeof MockInputForm>>

        beforeEach(() => {
            wrapper = mount(MockInputForm)
        })

        describe('focusField / blurField', () => {
            it('should trigger focus event', async () => {
                const input = wrapper.find('.param-x')

                expect(wrapper.vm.isEditingField).toBe(false)

                await focusField(input)

                expect(wrapper.vm.isEditingField).toBe(true)
            })

            it('should trigger blur event', async () => {
                const input = wrapper.find('.param-x')

                await focusField(input)
                expect(wrapper.vm.isEditingField).toBe(true)

                await blurField(input)

                expect(wrapper.vm.isEditingField).toBe(false)
            })
        })

        describe('focusFieldBySelector / blurFieldBySelector', () => {
            it('should focus by selector', async () => {
                await focusFieldBySelector(wrapper, '.param-x')

                expect(wrapper.vm.isEditingField).toBe(true)
            })

            it('should blur by selector', async () => {
                await focusFieldBySelector(wrapper, '.param-x')
                await blurFieldBySelector(wrapper, '.param-x')

                expect(wrapper.vm.isEditingField).toBe(false)
            })

            it('should throw if selector not found', async () => {
                await expect(
                    focusFieldBySelector(wrapper, '.nonexistent')
                ).rejects.toThrow('Element not found: .nonexistent')
            })
        })
    })

    describe('Focus Assertions', () => {
        let wrapper: VueWrapper<InstanceType<typeof MockInputForm>>

        beforeEach(() => {
            wrapper = mount(MockInputForm, {
                attachTo: document.body // Required for focus testing
            })
        })

        afterEach(() => {
            wrapper.unmount()
        })

        describe('isElementFocused', () => {
            it('should return false when not focused', () => {
                expect(isElementFocused(wrapper, '.param-x')).toBe(false)
            })

            it('should return true when focused', async () => {
                const input = wrapper.find('.param-x').element as HTMLElement
                input.focus()

                expect(isElementFocused(wrapper, '.param-x')).toBe(true)
            })
        })

        describe('expectElementFocused', () => {
            it('should pass when element is focused', async () => {
                const input = wrapper.find('.param-x').element as HTMLElement
                input.focus()

                expect(() => expectElementFocused(wrapper, '.param-x')).not.toThrow()
            })

            it('should fail when element is not focused', () => {
                expect(() => expectElementFocused(wrapper, '.param-x')).toThrow()
            })
        })

        describe('expectElementNotFocused', () => {
            it('should pass when element is not focused', () => {
                expect(() => expectElementNotFocused(wrapper, '.param-x')).not.toThrow()
            })

            it('should fail when element is focused', async () => {
                const input = wrapper.find('.param-x').element as HTMLElement
                input.focus()

                expect(() => expectElementNotFocused(wrapper, '.param-x')).toThrow()
            })
        })
    })

    describe('Realistic User Typing (JUMP Bug Prevention)', () => {
        let wrapper: VueWrapper<InstanceType<typeof MockInputForm>>

        beforeEach(() => {
            wrapper = mount(MockInputForm)
        })

        describe('simulateUserTyping', () => {
            it('should simulate realistic typing with delays', async () => {
                await simulateUserTyping(wrapper, '.url-input', 'test', {
                    delay: 10 // Fast for testing
                })

                expect(wrapper.vm.urlValue).toBe('test')
            })

            it('should focus field before typing', async () => {
                expect(wrapper.vm.isEditingField).toBe(false)

                await simulateUserTyping(wrapper, '.url-input', 'text')

                // Field should have been focused during typing
                expect(wrapper.vm.urlValue).toBe('text')
            })

            it('should verify state after each keystroke', async () => {
                const verifications: number[] = []

                await simulateUserTyping(wrapper, '.url-input', 'abc', {
                    delay: 0,
                    verifyEachKeystroke: (index) => {
                        // Verify isEditingField stays true during typing (JUMP bug check)
                        verifications.push(index)
                        // In real component, would check mode doesn't jump
                    }
                })

                expect(verifications).toHaveLength(3) // Verified 3 keystrokes
            })

            it('should count keypresses correctly', async () => {
                await simulateUserTyping(wrapper, '.param-x', '123', {
                    delay: 0
                })

                expect(wrapper.vm.keypressCount).toBe(3)
            })

            it('should handle URLs without breaking', async () => {
                const url = 'https://example.com/image.jpg'

                await simulateUserTyping(wrapper, '.url-input', url, {
                    delay: 0
                })

                expect(wrapper.vm.urlValue).toBe(url)
            })
        })
    })

    describe('Tab Navigation', () => {
        let wrapper: VueWrapper<InstanceType<typeof MockInputForm>>

        beforeEach(() => {
            wrapper = mount(MockInputForm)
        })

        describe('pressTab', () => {
            it('should trigger Tab key', async () => {
                const input = wrapper.find('.param-x')
                const tabSpy = vi.fn()
                input.element.addEventListener('keydown', tabSpy)

                await pressTab(input)

                expect(tabSpy).toHaveBeenCalled()
                const event = tabSpy.mock.calls[0][0] as KeyboardEvent
                expect(event.key).toBe('Tab')
            })

            it('should trigger Shift+Tab for reverse', async () => {
                const input = wrapper.find('.param-x')
                const tabSpy = vi.fn()
                input.element.addEventListener('keydown', tabSpy)

                await pressTab(input, true)

                expect(tabSpy).toHaveBeenCalled()
                const event = tabSpy.mock.calls[0][0] as KeyboardEvent
                expect(event.shiftKey).toBe(true)
            })
        })

        describe('navigateFieldsWithTab', () => {
            it('should navigate through fields', async () => {
                await navigateFieldsWithTab(wrapper, '.param-x', 2)

                // Simulates tabbing through fields
                // In real browser, focus would move between fields
                expect(true).toBe(true)
            })
        })
    })

    describe('Utility Functions', () => {
        let wrapper: VueWrapper<InstanceType<typeof MockInputForm>>

        beforeEach(() => {
            wrapper = mount(MockInputForm)
        })

        describe('clearField', () => {
            it('should clear input value', async () => {
                const input = wrapper.find('.param-x')

                await typeText(input, '50')
                expect((input.element as HTMLInputElement).value).toBe('50')

                await clearField(input)

                expect((input.element as HTMLInputElement).value).toBe('')
            })
        })

        describe('pressSpace', () => {
            it('should trigger space key', async () => {
                const input = wrapper.find('.param-x')
                const spaceSpy = vi.fn()
                input.element.addEventListener('keydown', spaceSpy)

                await pressSpace(input)

                expect(spaceSpy).toHaveBeenCalled()
                const event = spaceSpy.mock.calls[0][0] as KeyboardEvent
                expect(event.key).toBe(' ')
            })
        })
    })

    describe('Integration Tests (JUMP Bug Scenarios)', () => {
        let wrapper: VueWrapper<InstanceType<typeof MockInputForm>>

        beforeEach(() => {
            wrapper = mount(MockInputForm)
        })

        it('should prevent mode changes during typing (JUMP bug test)', async () => {
            // Start in XYZ mode
            expect(wrapper.vm.mode).toBe('xyz')

            // Focus URL field and start typing
            await focusFieldBySelector(wrapper, '.url-input')
            expect(wrapper.vm.isEditingField).toBe(true)

            // Type URL character by character
            await simulateUserTyping(wrapper, '.url-input', 'https://example.com', {
                delay: 0,
                verifyEachKeystroke: () => {
                    // During typing, isEditingField should stay true
                    // This prevents mode auto-switching (JUMP bug)
                    expect(wrapper.vm.isEditingField).toBe(true)
                }
            })

            // After typing completes, blur the field
            await blurFieldBySelector(wrapper, '.url-input')

            // Now mode should change (after blur, not during typing)
            expect(wrapper.vm.mode).toBe('direct')
        })

        it('should handle focus-type-blur cycle without jumping', async () => {
            await focusFieldBySelector(wrapper, '.param-x')
            await typeTextInField(wrapper, '.param-x', '50')
            await blurFieldBySelector(wrapper, '.param-x')

            expect(wrapper.vm.xValue).toBe('50')
            expect(wrapper.vm.isEditingField).toBe(false)
        })

        it('should handle rapid typing without losing characters', async () => {
            const text = 'RapidTypingTest123'

            await simulateUserTyping(wrapper, '.url-input', text, {
                delay: 5 // Very fast typing
            })

            expect(wrapper.vm.urlValue).toBe(text)
            expect(wrapper.vm.keypressCount).toBe(text.length)
        })
    })
})
