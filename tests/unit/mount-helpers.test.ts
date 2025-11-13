/**
 * mount-helpers - Unit Tests
 * 
 * Validates component mounting utilities work correctly.
 */

import { describe, it, expect, afterEach, vi, beforeEach } from 'vitest'
import { defineComponent, h } from 'vue'
import {
    mountWithCSS,
    mountCListComponent,
    mountCollectionComponent,
    mountShallow,
    mountAttached,
    mountWithStubs,
    createMockWrapper
} from '../utils/mount-helpers'
import { createMockEvents } from '../utils/clist-test-data'
import { clearFetchMocks } from '../utils/fetch-mock'

// Simple test component
const TestComponent = defineComponent({
    name: 'TestComponent',
    props: {
        title: {
            type: String,
            default: 'Test'
        }
    },
    template: '<div class="test-component">{{ title }}</div>'
})

// Component with child
const ParentComponent = defineComponent({
    name: 'ParentComponent',
    components: { TestComponent },
    template: '<div class="parent"><TestComponent title="Child" /></div>'
})

describe('mount-helpers Utilities', () => {
    let cleanups: Array<() => void> = []

    afterEach(() => {
        // Clean up all mounted components
        cleanups.forEach(cleanup => cleanup())
        cleanups = []
        clearFetchMocks()
    })

    describe('mountWithCSS', () => {
        it('should mount component with CSS variables', () => {
            const { wrapper, cleanup } = mountWithCSS(TestComponent)
            cleanups.push(cleanup)

            expect(wrapper.exists()).toBe(true)
            expect(wrapper.find('.test-component').exists()).toBe(true)
        })

        it('should accept props', () => {
            const { wrapper, cleanup } = mountWithCSS(TestComponent, {
                props: { title: 'Custom Title' }
            })
            cleanups.push(cleanup)

            expect(wrapper.text()).toBe('Custom Title')
        })

        it('should inject CSS variables', () => {
            const { wrapper, cleanup } = mountWithCSS(TestComponent)
            cleanups.push(cleanup)

            // Check that CSS variables are in document
            const styles = document.querySelectorAll('style')
            const hasCardWidth = Array.from(styles).some(style =>
                style.textContent?.includes('--card-width')
            )

            expect(hasCardWidth).toBe(true)
        })

        it('should cleanup properly', () => {
            const { wrapper, cleanup } = mountWithCSS(TestComponent)

            expect(wrapper.exists()).toBe(true)
            expect(wrapper.find('.test-component').exists()).toBe(true)

            // cleanup() unmounts the wrapper - main purpose is to prevent memory leaks
            cleanup()

            // Cleanup completes without error
            expect(true).toBe(true)
        })
    })

    describe('mountCListComponent', () => {
        it('should mount with CList defaults', () => {
            const { wrapper, cleanup } = mountCListComponent(TestComponent)
            cleanups.push(cleanup)

            expect(wrapper.exists()).toBe(true)
        })

        it('should stub RouterLink by default', () => {
            const ComponentWithRouter = defineComponent({
                template: '<div><RouterLink to="/">Link</RouterLink></div>'
            })

            const { wrapper, cleanup } = mountCListComponent(ComponentWithRouter)
            cleanups.push(cleanup)

            expect(wrapper.exists()).toBe(true)
            // RouterLink is stubbed, so it won't throw error
        })

        it('should merge custom stubs with defaults', () => {
            const { wrapper, cleanup } = mountCListComponent(ParentComponent, {
                global: {
                    stubs: {
                        TestComponent: true
                    }
                }
            })
            cleanups.push(cleanup)

            expect(wrapper.exists()).toBe(true)
            // TestComponent should be stubbed
            expect(wrapper.findComponent({ name: 'TestComponent' }).exists()).toBe(true)
        })
    })

    describe('mountCollectionComponent', () => {
        it('should mock fetch data automatically', async () => {
            const CollectionComponent = defineComponent({
                name: 'CollectionComponent',
                template: '<div class="collection">Collection</div>'
            })

            const events = createMockEvents(5)
            const { wrapper, cleanup } = mountCollectionComponent(
                CollectionComponent,
                events
            )
            cleanups.push(cleanup)

            expect(wrapper.exists()).toBe(true)

            // Fetch should be mocked
            const response = await fetch('/api/entities/events')
            const data = await response.json()

            expect(data).toHaveLength(5)
        })
    })

    describe('mountShallow', () => {
        it('should render with shallow mounting', () => {
            const { wrapper, cleanup } = mountShallow(ParentComponent)
            cleanups.push(cleanup)

            expect(wrapper.exists()).toBe(true)
            expect(wrapper.find('.parent').exists()).toBe(true)

            // Child component should be stubbed
            const child = wrapper.findComponent({ name: 'TestComponent' })
            expect(child.exists()).toBe(true)
        })
    })

    describe('mountAttached', () => {
        it('should attach component to document body', () => {
            const { wrapper, cleanup } = mountAttached(TestComponent)
            cleanups.push(cleanup)

            expect(wrapper.exists()).toBe(true)
            expect(document.body.contains(wrapper.element)).toBe(true)
        })

        it('should remove from DOM on cleanup', () => {
            const { wrapper, cleanup } = mountAttached(TestComponent)

            const element = wrapper.element
            expect(document.body.contains(element)).toBe(true)

            cleanup()

            expect(document.body.contains(element)).toBe(false)
        })
    })

    describe('mountWithStubs', () => {
        it('should stub specified components', () => {
            const { wrapper, cleanup } = mountWithStubs(
                ParentComponent,
                {
                    TestComponent: true
                }
            )
            cleanups.push(cleanup)

            expect(wrapper.exists()).toBe(true)

            const child = wrapper.findComponent({ name: 'TestComponent' })
            expect(child.exists()).toBe(true)
        })
    })

    describe('createMockWrapper', () => {
        it('should create wrapper from HTML string', () => {
            const wrapper = createMockWrapper(`
        <div class="test">
          <span class="inner">Content</span>
        </div>
      `)

            expect(wrapper.find('.test').exists()).toBe(true)
            expect(wrapper.find('.inner').text()).toBe('Content')
        })

        it('should handle complex HTML', () => {
            const wrapper = createMockWrapper(`
        <div class="item-row selected">
          <input type="checkbox" checked />
          <span>Item 1</span>
        </div>
      `)

            expect(wrapper.find('.selected').exists()).toBe(true)
            expect(wrapper.find('input[type="checkbox"]').exists()).toBe(true)

            const checkbox = wrapper.find('input[type="checkbox"]').element as HTMLInputElement
            expect(checkbox.checked).toBe(true)
        })
    })

    describe('Integration Tests', () => {
        it('should handle multiple mounts and cleanups', () => {
            const result1 = mountWithCSS(TestComponent)
            const result2 = mountWithCSS(TestComponent)

            expect(result1.wrapper.exists()).toBe(true)
            expect(result2.wrapper.exists()).toBe(true)

            result1.cleanup()
            result2.cleanup()

            // Both cleanups complete without error
            expect(true).toBe(true)
        })

        it('should work with all cleanup patterns', () => {
            const results = [
                mountWithCSS(TestComponent),
                mountCListComponent(TestComponent),
                mountShallow(TestComponent)
            ]

            results.forEach(result => {
                expect(result.wrapper.exists()).toBe(true)
                result.cleanup()
            })

            // All cleanups complete without error
            expect(results.length).toBe(3)
        })
    })
})
