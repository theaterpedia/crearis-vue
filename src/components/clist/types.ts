/**
 * CList Component Type Definitions
 * 
 * Shared types for ItemTile, ItemRow, and ItemCard components
 */

/**
 * Theme color options for badges and markers
 */
export type ThemeColor =
    | 'primary'
    | 'secondary'
    | 'accent'
    | 'muted'
    | 'warning'
    | 'positive'
    | 'negative'

/**
 * Entity type for icon display
 */
export type EntityType =
    | 'instructor'
    | 'user'
    | 'event'
    | 'location'
    | 'blog-post'
    | 'project'

/**
 * Options for visual indicators on list items
 * All default to false if not provided
 */
export interface ItemOptions {
    /** Show entity icon (top-left corner) */
    entityIcon?: boolean

    /** Show badge (top-right corner) */
    badge?: boolean

    /** Show counter inside badge */
    counter?: boolean

    /** Show selection checkbox (bottom-left corner) */
    selectable?: boolean

    /** Show colored marker bar (left side accent) */
    marker?: boolean
}

/**
 * Models for list item state
 */
export interface ItemModels {
    /** Selection state */
    selected?: boolean

    /** Counter value (shown in badge if counter option is enabled) */
    count?: number

    /** Marker color (shown if marker option is enabled) */
    marked?: ThemeColor

    /** Entity type (determines which icon to show if entityIcon option is enabled) */
    entityType?: EntityType

    /** Badge color (defaults to 'primary' if badge option is enabled) */
    badgeColor?: ThemeColor
}
