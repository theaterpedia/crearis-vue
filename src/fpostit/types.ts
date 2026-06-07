/**
 * Floating Post-It System Types
 * 
 * This module defines the core types for the floating post-it system.
 * Floating post-its are interactive elements that display additional content
 * when triggered, similar to tooltips but more feature-rich.
 */

/**
 * Horizontal positioning logic for floating post-its.
 *
 * `static-board` is the pinned-board mode (see BoardItem + utils/board.ts):
 * the post-it renders in-place inside a positioned board container at authored
 * top/left percentages instead of floating relative to a trigger element.
 */
export type HorizontalLogic = 'default' | 'element' | 'right' | 'left' | 'static-board'

/**
 * Theme colors matching the PostIt component
 */
export type PostitColor =
    | 'primary'
    | 'secondary'
    | 'warning'
    | 'positive'
    | 'negative'
    | 'accent'
    | 'muted'
    | 'dimmed'

/**
 * Rotation options for visual variety
 */
export type PostitRotation =
    | 'rotate-0'
    | '-rotate-1'
    | '-rotate-2'
    | '-rotate-3'
    | 'rotate-1'
    | 'rotate-2'
    | 'rotate-3'

/**
 * Action button configuration
 */
export interface FpostitAction {
    label: string
    handler?: (closePostit: () => void) => void
    href?: string
    target?: '_blank' | '_self'
}

/**
 * Core data structure for a floating post-it
 */
export interface FpostitData {
    /** Unique key (p1-p9) */
    key: string

    /** Display title */
    title: string

    /** HTML content to display */
    content: string

    /** Optional image URL */
    image?: string

    /** Optional SVG icon (raw SVG string) */
    svg?: string

    /** Theme color */
    color?: PostitColor

    /** Rotation for visual variety */
    rotation?: PostitRotation

    /** Horizontal positioning logic */
    hlogic?: HorizontalLogic

    /** Horizontal offset in rem (for stacking post-its at same position) */
    hOffset?: number

    /** Action buttons (max 2) */
    actions?: FpostitAction[]

    /** Trigger element reference (set during opening) */
    triggerElement?: HTMLElement

    /**
     * Authored CSS `top` (e.g. `'32.5%'`) — used by `static-board` hlogic only,
     * where the post-it pins inside a positioned board container instead of
     * floating relative to a trigger. Ignored by the trigger-based hlogics.
     */
    top?: string

    /** Authored CSS `left` (e.g. `'25%'`) — `static-board` hlogic only. */
    left?: string
}

/**
 * Item shape for the pinned `static-board` mode (e.g. the magnifica
 * cards-blackboard). A board renders many post-its at authored top/left
 * percentages inside its own positioned container — distinct from the
 * trigger-floating `FpostitData` lifecycle (no open/close, no teleport,
 * no p1-p9 / max-9 constraints). Positions are typically filled by
 * `distributeAcrossLanes()` in `utils/board.ts`.
 */
export interface BoardItem {
    /** Stable key for v-for (board keys are free-form, not p1-p9). */
    key: string

    /** Display title (overline**headline** or plain). */
    title: string

    /** HTML content. */
    content: string

    /** Theme color (OKLCH token via `.bg-{color}`). Default 'primary'. */
    color?: PostitColor

    /** Rotation class for visual variety. */
    rotation?: PostitRotation

    /** CSS `top` position (percentage string · lane-distribution output). */
    top: string

    /** CSS `left` position (percentage string · lane-distribution output). */
    left: string

    /** Optional image URL. */
    image?: string

    /** Optional raw SVG. */
    svg?: string

    /** Optional action buttons (max 2). */
    actions?: FpostitAction[]
}

/**
 * Position calculation result
 */
export interface FpostitPosition {
    /** CSS top position */
    top: string

    /** CSS left position (if positioning left) */
    left?: string

    /** CSS right position (if positioning right) */
    right?: string

    /** Max width constraint */
    maxWidth: string

    /** Whether positioned on mobile */
    isMobile: boolean

    /** Horizontal offset in rem (for stacking) */
    hOffset: number
}

/**
 * Controller interface for managing floating post-its
 */
export interface FpostitController {
    /**
     * Register a new floating post-it
     */
    create(data: FpostitData): void

    /**
     * Open a floating post-it by key
     */
    openPostit(key: string, triggerElement?: HTMLElement): void

    /**
     * Close a specific floating post-it
     */
    closePostit(key: string): void

    /**
     * Close all open floating post-its
     */
    closeAll(): void

    /**
     * Unregister a post-it entirely (close + delete its registration). Pair with
     * `create()` on a per-page lifecycle so controller-routed pages (glossary-mode)
     * don't accumulate registrations across route navigation.
     */
    remove(key: string): void

    /**
     * Check if a post-it is currently open
     */
    isOpen(key: string): boolean

    /**
     * Get all registered post-it keys
     */
    getKeys(): string[]

    /**
     * Discover and initialize post-its from DOM (HTML data attributes)
     * Returns the number of post-its discovered
     */
    discoverFromDOM(options?: DiscoveryOptions): number

    /**
     * Reactive map of all post-its
     */
    readonly postits: Map<string, FpostitData>

    /**
     * Reactive set of currently open keys
     */
    readonly openKeys: Set<string>
}

/**
 * Options for HTML discovery
 */
export interface DiscoveryOptions {
    /** Root element to search within (defaults to document.body) */
    root?: HTMLElement

    /** Whether to auto-attach click handlers (default: true) */
    attachHandlers?: boolean
}
