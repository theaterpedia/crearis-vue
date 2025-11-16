/**
 * Floating Post-It System Types
 * 
 * This module defines the core types for the floating post-it system.
 * Floating post-its are interactive elements that display additional content
 * when triggered, similar to tooltips but more feature-rich.
 */

/**
 * Horizontal positioning logic for floating post-its
 */
export type HorizontalLogic = 'default' | 'element' | 'right' | 'left'

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
