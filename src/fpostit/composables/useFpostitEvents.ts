/**
 * Post-It Event Bridge System
 * 
 * Provides a clean event system for Post-Its to communicate with Vue components.
 * This solves the problem of cloned HTML content losing Vue reactivity.
 * 
 * ARCHITECTURE:
 * 1. Post-It content (HTML) uses data-fpost-event attributes
 * 2. Event system discovers these elements and attaches DOM listeners
 * 3. DOM events are translated to Vue-compatible callbacks
 * 4. Vue components register handlers using the composable
 * 
 * USAGE IN POST-IT HTML:
 * ```html
 * <button data-fpost-event="theme-rotate" data-fpost-payload='{"direction":"next"}'>
 *   Next Theme
 * </button>
 * ```
 * 
 * USAGE IN VUE COMPONENT:
 * ```typescript
 * const events = useFpostitEvents()
 * events.on('theme-rotate', (payload) => {
 *   console.log('Rotate theme:', payload.direction)
 * })
 * ```
 */

import { onUnmounted } from 'vue'

/**
 * Event handler function type
 */
export type FpostitEventHandler = (payload: any, element: HTMLElement) => void | Promise<void>

/**
 * Event registry (singleton)
 */
class FpostitEventBridge {
    private handlers: Map<string, Set<FpostitEventHandler>> = new Map()
    private discoveredElements: WeakSet<HTMLElement> = new WeakSet()
    private mutationObserver: MutationObserver | null = null

    constructor() {
        if (typeof window !== 'undefined') {
            this.startObserving()
        }
    }

    /**
     * Start observing DOM for new Post-It content
     */
    private startObserving() {
        this.mutationObserver = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((node) => {
                        if (node instanceof HTMLElement) {
                            this.discoverEvents(node)
                        }
                    })
                }
            }
        })

        this.mutationObserver.observe(document.body, {
            childList: true,
            subtree: true
        })

        // Initial discovery
        this.discoverEvents(document.body)
    }

    /**
     * Discover and attach event listeners to elements with data-fpost-event
     */
    private discoverEvents(root: HTMLElement) {
        const elements = root.querySelectorAll('[data-fpost-event]')

        elements.forEach((element) => {
            if (!(element instanceof HTMLElement)) return
            if (this.discoveredElements.has(element)) return

            const eventName = element.getAttribute('data-fpost-event')
            if (!eventName) return

            // Parse payload (optional)
            let payload: any = null
            const payloadAttr = element.getAttribute('data-fpost-payload')
            if (payloadAttr) {
                try {
                    payload = JSON.parse(payloadAttr)
                } catch (e) {
                    console.warn(`[fpostit-events] Invalid JSON in data-fpost-payload:`, payloadAttr)
                }
            }

            // Attach click listener
            const clickHandler = async (e: Event) => {
                e.preventDefault()
                e.stopPropagation()
                await this.emit(eventName, payload, element)
            }

            element.addEventListener('click', clickHandler)
            this.discoveredElements.add(element)

            // Add visual feedback class
            element.classList.add('fpostit-event-element')

            console.log('[fpostit-events] Discovered event element:', eventName, element)
        })
    }

    /**
     * Register an event handler
     */
    on(eventName: string, handler: FpostitEventHandler): () => void {
        if (!this.handlers.has(eventName)) {
            this.handlers.set(eventName, new Set())
        }

        this.handlers.get(eventName)!.add(handler)

        // Return unsubscribe function
        return () => this.off(eventName, handler)
    }

    /**
     * Unregister an event handler
     */
    off(eventName: string, handler: FpostitEventHandler) {
        const handlers = this.handlers.get(eventName)
        if (handlers) {
            handlers.delete(handler)
            if (handlers.size === 0) {
                this.handlers.delete(eventName)
            }
        }
    }

    /**
     * Emit an event to all registered handlers
     */
    async emit(eventName: string, payload: any, element: HTMLElement) {
        const handlers = this.handlers.get(eventName)
        if (!handlers || handlers.size === 0) {
            console.warn(`[fpostit-events] No handlers registered for event: ${eventName}`)
            return
        }

        console.log(`[fpostit-events] Emitting event: ${eventName}`, payload)

        // Call all handlers
        const promises = Array.from(handlers).map(handler => {
            try {
                return handler(payload, element)
            } catch (error) {
                console.error(`[fpostit-events] Handler error for ${eventName}:`, error)
                return null
            }
        })

        await Promise.all(promises)
    }

    /**
     * Manually trigger event discovery (useful after Post-It opens)
     */
    discover(root: HTMLElement = document.body) {
        this.discoverEvents(root)
    }

    /**
     * Clear all handlers (useful for testing/cleanup)
     */
    clear() {
        this.handlers.clear()
    }

    /**
     * Stop observing (cleanup)
     */
    destroy() {
        if (this.mutationObserver) {
            this.mutationObserver.disconnect()
            this.mutationObserver = null
        }
        this.handlers.clear()
    }
}

/**
 * Singleton instance
 */
let _bridgeInstance: FpostitEventBridge | null = null

/**
 * Get the singleton event bridge
 */
function getEventBridge(): FpostitEventBridge {
    if (!_bridgeInstance) {
        _bridgeInstance = new FpostitEventBridge()
    }
    return _bridgeInstance
}

/**
 * Composable for using Post-It events in Vue components
 * 
 * @example
 * ```typescript
 * const events = useFpostitEvents()
 * 
 * // Register handler (auto-cleanup on unmount)
 * events.on('theme-rotate', async (payload) => {
 *   await applyTheme(payload.themeId)
 * })
 * 
 * // Manual emit (usually not needed - DOM elements emit)
 * events.emit('custom-event', { data: 'value' })
 * ```
 */
export function useFpostitEvents() {
    const bridge = getEventBridge()
    const cleanupFunctions: (() => void)[] = []

    // Auto-cleanup on component unmount
    onUnmounted(() => {
        cleanupFunctions.forEach(cleanup => cleanup())
    })

    return {
        /**
         * Register an event handler
         * Automatically cleaned up when component unmounts
         */
        on(eventName: string, handler: FpostitEventHandler) {
            const unsubscribe = bridge.on(eventName, handler)
            cleanupFunctions.push(unsubscribe)
            return unsubscribe
        },

        /**
         * Unregister an event handler
         */
        off(eventName: string, handler: FpostitEventHandler) {
            bridge.off(eventName, handler)
        },

        /**
         * Manually emit an event (usually not needed)
         */
        async emit(eventName: string, payload: any = null) {
            await bridge.emit(eventName, payload, document.body)
        },

        /**
         * Manually trigger event discovery
         * Useful after Post-It opens to ensure all elements are discovered
         */
        discover(root?: HTMLElement) {
            bridge.discover(root)
        }
    }
}

/**
 * Reset the event bridge (for testing)
 * @internal
 */
export function _resetEventBridge() {
    if (_bridgeInstance) {
        _bridgeInstance.destroy()
        _bridgeInstance = null
    }
}
