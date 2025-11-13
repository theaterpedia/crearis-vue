/**
 * Component Mounting Helpers
 * 
 * Simplified mounting with common setup for CList components.
 * Reduces boilerplate by combining CSS variable setup with mounting.
 * 
 * @module tests/utils/mount-helpers
 */

import { mount, type VueWrapper, type MountingOptions } from '@vue/test-utils'
import { setupCSSVariableMocks } from './test-helpers'
import type { Component, ComponentPublicInstance } from 'vue'
import type { MockEntityData } from './clist-test-data'
import { mockFetchSuccess } from './fetch-mock'

/**
 * Extended mounting options for CList components
 */
export interface CListMountOptions<T = any> extends MountingOptions<T> {
    props?: Record<string, any>
    slots?: Record<string, any>
    global?: {
        stubs?: Record<string, any>
        mocks?: Record<string, any>
        provide?: Record<string, any>
        plugins?: any[]
        components?: Record<string, Component>
    }
    attachTo?: Element
    attrs?: Record<string, any>
    shallow?: boolean
}

/**
 * Mount result with cleanup function
 */
export interface MountResult<T extends ComponentPublicInstance = ComponentPublicInstance> {
    wrapper: VueWrapper<T>
    cleanup: () => void
}

/**
 * Mount component with automatic CSS variable setup
 * 
 * Combines component mounting with CSS variable injection.
 * Returns wrapper and cleanup function.
 * 
 * @param component - Vue component to mount
 * @param options - Vue Test Utils mounting options
 * @returns Object with wrapper and cleanup function
 * 
 * @example
 * import { mountWithCSS } from '../../utils/mount-helpers'
 * import MyComponent from '@/components/MyComponent.vue'
 * 
 * describe('MyComponent', () => {
 *   let cleanup: (() => void) | null = null
 * 
 *   afterEach(() => {
 *     if (cleanup) cleanup()
 *   })
 * 
 *   it('should render', () => {
 *     const { wrapper, cleanup: cleanupFn } = mountWithCSS(MyComponent, {
 *       props: { title: 'Test' }
 *     })
 *     cleanup = cleanupFn
 * 
 *     expect(wrapper.exists()).toBe(true)
 *   })
 * })
 */
export function mountWithCSS<T extends ComponentPublicInstance = ComponentPublicInstance>(
    component: Component,
    options: CListMountOptions<T> = {}
): MountResult<T> {
    const cleanupCSS = setupCSSVariableMocks()

    const wrapper = mount(component, options as MountingOptions<T>)

    return {
        wrapper: wrapper as VueWrapper<T>,
        cleanup: () => {
            cleanupCSS()
            wrapper.unmount()
        }
    }
}

/**
 * Mount CList component with common defaults
 * 
 * Pre-configured mounting for CList components with common stubs.
 * Use this for most CList component tests.
 * 
 * @param component - CList component to mount
 * @param options - Mounting options
 * @returns Object with wrapper and cleanup function
 * 
 * @example
 * import { mountCListComponent } from '../../utils/mount-helpers'
 * import ItemRow from '@/components/clist/ItemRow.vue'
 * 
 * const { wrapper, cleanup } = mountCListComponent(ItemRow, {
 *   props: {
 *     heading: 'Test Item',
 *     options: { selectable: true }
 *   }
 * })
 * 
 * expect(wrapper.find('.item-row').exists()).toBe(true)
 * cleanup()
 */
export function mountCListComponent<T extends ComponentPublicInstance = ComponentPublicInstance>(
    component: Component,
    options: CListMountOptions<T> = {}
): MountResult<T> {
    const cleanupCSS = setupCSSVariableMocks()

    // Merge with CList defaults
    const defaultOptions: CListMountOptions<T> = {
        global: {
            stubs: {
                // Stub router components if present
                'RouterLink': true,
                'RouterView': true,
                // Stub transition/teleport if needed
                'Transition': false,
                'Teleport': false
            }
        }
    }

    const mergedOptions: CListMountOptions<T> = {
        ...defaultOptions,
        ...options,
        props: {
            ...defaultOptions.props,
            ...options.props
        },
        global: {
            ...defaultOptions.global,
            ...options.global,
            stubs: {
                ...defaultOptions.global?.stubs,
                ...options.global?.stubs
            },
            mocks: {
                ...defaultOptions.global?.mocks,
                ...options.global?.mocks
            },
            provide: {
                ...defaultOptions.global?.provide,
                ...options.global?.provide
            }
        }
    }

    const wrapper = mount(component, mergedOptions as MountingOptions<T>)

    return {
        wrapper: wrapper as VueWrapper<T>,
        cleanup: () => {
            cleanupCSS()
            wrapper.unmount()
        }
    }
}

/**
 * Mount collection component with mocked fetch data
 * 
 * For components that fetch data on mount (ItemList, ItemGallery).
 * Automatically sets up fetch mock with provided data.
 * 
 * @param component - Collection component to mount
 * @param mockData - Array of entity data to return from fetch
 * @param options - Additional mounting options
 * @returns Object with wrapper and cleanup function
 * 
 * @example
 * import { mountCollectionComponent } from '../../utils/mount-helpers'
 * import { createMockEvents } from '../../utils/clist-test-data'
 * import ItemList from '@/components/clist/ItemList.vue'
 * 
 * const events = createMockEvents(5)
 * const { wrapper, cleanup } = mountCollectionComponent(ItemList, events, {
 *   props: {
 *     entity: 'events',
 *     dataMode: true
 *   }
 * })
 * 
 * await flushPromises()
 * 
 * expect(wrapper.findAll('.item-row')).toHaveLength(5)
 * cleanup()
 */
export function mountCollectionComponent<T extends ComponentPublicInstance = ComponentPublicInstance>(
    component: Component,
    mockData: MockEntityData[],
    options: CListMountOptions<T> = {}
): MountResult<T> {
    // Set up fetch mock
    mockFetchSuccess(mockData)

    // Mount with CList defaults
    return mountCListComponent<T>(component, options)
}

/**
 * Mount component with shallow rendering
 * 
 * Renders only the component, stubs all child components.
 * Useful for isolated unit tests.
 * 
 * @param component - Component to mount
 * @param options - Mounting options
 * @returns Object with wrapper and cleanup function
 * 
 * @example
 * import { mountShallow } from '../../utils/mount-helpers'
 * import ItemCard from '@/components/clist/ItemCard.vue'
 * 
 * const { wrapper, cleanup } = mountShallow(ItemCard, {
 *   props: { heading: 'Test' }
 * })
 * 
 * // Child components are stubbed
 * expect(wrapper.findComponent({ name: 'ImgShape' }).exists()).toBe(false)
 */
export function mountShallow<T extends ComponentPublicInstance = ComponentPublicInstance>(
    component: Component,
    options: CListMountOptions<T> = {}
): MountResult<T> {
    return mountWithCSS<T>(component, {
        ...options,
        shallow: true
    })
}

/**
 * Mount component attached to document body
 * 
 * Useful for testing components that need real DOM (dropdowns, modals).
 * Remember to cleanup to remove from DOM.
 * 
 * @param component - Component to mount
 * @param options - Mounting options
 * @returns Object with wrapper and cleanup function
 * 
 * @example
 * import { mountAttached } from '../../utils/mount-helpers'
 * import DropdownList from '@/components/clist/DropdownList.vue'
 * 
 * const { wrapper, cleanup } = mountAttached(DropdownList, {
 *   props: { items: mockItems }
 * })
 * 
 * // Component is in real DOM
 * expect(document.body.contains(wrapper.element)).toBe(true)
 * 
 * cleanup() // Removes from DOM
 */
export function mountAttached<T extends ComponentPublicInstance = ComponentPublicInstance>(
    component: Component,
    options: CListMountOptions<T> = {}
): MountResult<T> {
    const div = document.createElement('div')
    document.body.appendChild(div)

    const result = mountWithCSS<T>(component, {
        ...options,
        attachTo: div
    })

    const originalCleanup = result.cleanup

    return {
        wrapper: result.wrapper,
        cleanup: () => {
            originalCleanup()
            if (div.parentNode) {
                div.parentNode.removeChild(div)
            }
        }
    }
}

/**
 * Mount component with custom stubs
 * 
 * Helper for easily stubbing specific child components.
 * 
 * @param component - Component to mount
 * @param stubs - Components to stub (name -> stub)
 * @param options - Additional mounting options
 * @returns Object with wrapper and cleanup function
 * 
 * @example
 * import { mountWithStubs } from '../../utils/mount-helpers'
 * import ItemCard from '@/components/clist/ItemCard.vue'
 * 
 * const { wrapper, cleanup } = mountWithStubs(ItemCard, {
 *   ImgShape: true, // Stub ImgShape component
 *   ItemOptions: true // Stub ItemOptions component
 * }, {
 *   props: { heading: 'Test' }
 * })
 */
export function mountWithStubs<T extends ComponentPublicInstance = ComponentPublicInstance>(
    component: Component,
    stubs: Record<string, any>,
    options: CListMountOptions<T> = {}
): MountResult<T> {
    return mountCListComponent<T>(component, {
        ...options,
        global: {
            ...options.global,
            stubs: {
                ...options.global?.stubs,
                ...stubs
            }
        }
    })
}

/**
 * Create a mock wrapper for testing
 * 
 * Useful for testing utilities that expect a VueWrapper.
 * 
 * @param html - HTML string to use as template
 * @returns VueWrapper for testing
 * 
 * @example
 * import { createMockWrapper } from '../../utils/mount-helpers'
 * 
 * const wrapper = createMockWrapper(`
 *   <div class="item-row selected">
 *     <input type="checkbox" checked />
 *     <span>Item 1</span>
 *   </div>
 * `)
 * 
 * expect(wrapper.find('.selected').exists()).toBe(true)
 */
export function createMockWrapper(html: string): VueWrapper {
    return mount({
        template: html
    })
}
