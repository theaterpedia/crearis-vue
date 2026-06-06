/**
 * Floating Post-It Controller Composable
 * 
 * Singleton controller for managing floating post-its across the application.
 * Provides methods for creating, opening, closing, and discovering post-its.
 */

import { ref, reactive, readonly } from 'vue'
import type {
    FpostitData,
    FpostitController,
    FpostitAction,
    DiscoveryOptions
} from '../types'
import { getRandomRotation } from '../utils/positioning'

/**
 * Soft-cap on simultaneously-OPEN trigger post-its: opening beyond this closes
 * the oldest, keeping the floating UX sane. Board-mode (`static-board`) renders
 * locally inside its container and is NOT routed through this controller, so it
 * is unaffected.
 */
const MAX_OPEN_POSTITS = 9

/**
 * Registration headroom. Post-its are starting to back scientific-citation use,
 * so a page may register many triggers up-front (well past the legacy 9) even
 * though only a few are open at once. Registration ceiling sits well above the
 * open soft-cap; the concurrency limit (MAX_OPEN_POSTITS) is the real guard.
 */
const MAX_REGISTERED_POSTITS = 29

/** Valid key format: free-form identifier (superset of the legacy p1-p9 keys). */
const KEY_PATTERN = /^[a-zA-Z][a-zA-Z0-9_-]*$/

/**
 * Singleton instance
 */
let _controllerInstance: FpostitController | null = null

/**
 * Process title to remove markdown formatting
 * 1. Extract headline from "Overline**Headline**" format
 * 2. Strip H1-H4 markdown syntax (# ## ### ####)
 */
function processTitle(title: string): string {
    let processed = title.trim()

    // Extract headline from "Overline**Headline**" format
    const headlineMatch = processed.match(/\*\*(.+?)\*\*/)
    if (headlineMatch && headlineMatch[1]) {
        processed = headlineMatch[1]
    }

    // Strip H1-H4 markdown syntax
    processed = processed.replace(/^#{1,4}\s+/, '')

    return processed.trim()
}

/**
 * Extract actions from DOM content element
 */
function extractActionsFromDOM(contentElement: HTMLElement): FpostitAction[] {
    const actions: FpostitAction[] = []

    // Find action elements
    const action1 = contentElement.querySelector('[data-fpostact1]') as HTMLAnchorElement
    const action2 = contentElement.querySelector('[data-fpostact2]') as HTMLAnchorElement

    if (action1) {
        actions.push({
            label: action1.textContent?.trim() || 'Action 1',
            href: action1.href || undefined,
            target: action1.target as '_blank' | '_self' || '_self',
            handler: action1.href && action1.href !== 'javascript:void(0)'
                ? undefined
                : () => action1.click()
        })
    }

    if (action2) {
        actions.push({
            label: action2.textContent?.trim() || 'Action 2',
            href: action2.href || undefined,
            target: action2.target as '_blank' | '_self' || '_self',
            handler: action2.href && action2.href !== 'javascript:void(0)'
                ? undefined
                : () => action2.click()
        })
    }

    return actions
}

/**
 * Create the controller implementation
 */
function createFpostitController(): FpostitController {
    const postits = reactive(new Map<string, FpostitData>())
    const openKeys = reactive(new Set<string>())

    const controller: FpostitController = {
        postits: readonly(postits) as Map<string, FpostitData>,
        openKeys: readonly(openKeys) as Set<string>,

        create(data: FpostitData) {
            // Skip in SSR
            if (typeof window === 'undefined') return

            // Validate key format (free-form identifier · superset of legacy p1-p9)
            if (!KEY_PATTERN.test(data.key)) {
                console.warn(`[fpostit] Invalid key format: ${data.key}. Must match ${KEY_PATTERN}.`)
                return
            }

            // Check if already exists
            if (postits.has(data.key)) {
                console.warn(`[fpostit] Post-it with key ${data.key} already exists. Skipping.`)
                return
            }

            // Check registration ceiling
            if (postits.size >= MAX_REGISTERED_POSTITS) {
                console.warn(`[fpostit] Maximum of ${MAX_REGISTERED_POSTITS} registered post-its reached. Cannot create more.`)
                return
            }

            // Set defaults
            const fpostitData: FpostitData = {
                ...data,
                color: data.color || 'primary',
                rotation: data.rotation || getRandomRotation(),
                hlogic: data.hlogic || 'default',
                actions: (data.actions || []).slice(0, 2) // Max 2 actions
            }

            postits.set(data.key, fpostitData)
        },

        openPostit(key: string, triggerElement?: HTMLElement) {
            // Skip in SSR
            if (typeof window === 'undefined') return

            // Check if post-it exists
            if (!postits.has(key)) {
                console.warn(`[fpostit] Post-it with key ${key} not found.`)
                return
            }

            // Check if already open
            if (openKeys.has(key)) {
                return
            }

            // Close oldest if at the open soft-cap
            if (openKeys.size >= MAX_OPEN_POSTITS) {
                const oldestKey = Array.from(openKeys)[0] as string
                this.closePostit(oldestKey)
            }

            const postit = postits.get(key)!

            // Store trigger element reference
            if (triggerElement) {
                postit.triggerElement = triggerElement
            }

            // Calculate hOffset for stacking (only if not explicitly set in programmatic mode)
            if (postit.hOffset === undefined) {
                // Count open post-its with same hlogic
                let countAtSamePosition = 0
                openKeys.forEach((openKey: string) => {
                    const openPostit = postits.get(openKey)
                    if (openPostit && openPostit.hlogic === postit.hlogic) {
                        countAtSamePosition++
                    }
                })

                // Apply offset: 3.75rem (60px) per post-it at same position
                postit.hOffset = countAtSamePosition * 3.75
            }

            openKeys.add(key)
        },

        closePostit(key: string) {
            openKeys.delete(key)

            // Clear trigger element reference
            const postit = postits.get(key)
            if (postit) {
                postit.triggerElement = undefined
            }
        },

        closeAll() {
            openKeys.clear()

            // Clear all trigger element references
            postits.forEach((postit: FpostitData) => {
                postit.triggerElement = undefined
            })
        },

        isOpen(key: string): boolean {
            return openKeys.has(key)
        },

        getKeys(): string[] {
            return Array.from(postits.keys())
        },

        discoverFromDOM(options: DiscoveryOptions = {}): number {
            // Skip in SSR
            if (typeof window === 'undefined') return 0

            const { root = document.body, attachHandlers = true } = options

            // Find all containers
            const containers = root.querySelectorAll('[data-fpostcontainer]')
            let discovered = 0

            containers.forEach(container => {
                const keyAttr = container.getAttribute('data-fpostkey')
                const link = container.querySelector('[data-fpostlink]') as HTMLElement
                const content = container.querySelector('[data-fpostcontent]') as HTMLElement

                // Validate required elements
                if (!keyAttr || !link || !content) {
                    console.warn('[fpostit] Invalid container structure. Skipping:', container)
                    return
                }

                // Skip if already registered
                if (postits.has(keyAttr)) {
                    return
                }

                // Extract and process title
                const rawTitle = link.textContent?.trim() || 'Learn More'
                const processedTitle = processTitle(rawTitle)

                // Extract data
                const data: FpostitData = {
                    key: keyAttr,
                    title: processedTitle,
                    content: content.innerHTML,
                    color: content.getAttribute('data-color') as any || 'primary',
                    hlogic: link.getAttribute('data-hlogic') as any || 'default',
                    rotation: getRandomRotation(),
                    image: content.getAttribute('data-image') || undefined,
                    svg: link.querySelector('svg')?.outerHTML || undefined,
                    actions: extractActionsFromDOM(content)
                }

                // Register the post-it
                this.create(data)
                discovered++

                // Attach click handler
                if (attachHandlers) {
                    link.addEventListener('click', (e) => {
                        e.preventDefault()
                        this.openPostit(keyAttr, link)
                    })
                }
            })

            return discovered
        }
    }

    return controller
}

/**
 * Get or create the singleton floating post-it controller
 * 
 * @returns The global floating post-it controller instance
 */
export function useFpostitController(): FpostitController {
    if (!_controllerInstance) {
        _controllerInstance = createFpostitController()
    }

    return _controllerInstance
}

/**
 * Reset the controller (useful for testing)
 * @internal
 */
export function _resetController() {
    _controllerInstance = null
}
