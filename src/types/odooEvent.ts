/**
 * Odoo Event Types
 * 
 * Types for Odoo events integration.
 * December 2025 - Alpha workaround
 * 
 * Based on Crearis custom event.event model extending standard Odoo events.
 */

/**
 * Header type options (from Odoo model)
 */
export type OdooHeaderType = 'simple' | 'columns' | 'banner' | 'cover' | 'bauchbinde'

/**
 * Header size options
 */
export type OdooHeaderSize = 'mini' | 'medium' | 'prominent' | 'full'

/**
 * Edit mode options
 */
export type OdooEditMode = 'locked' | 'blocks' | 'content' | 'full'

/**
 * Kanban state (Odoo 16)
 */
export type OdooKanbanState = 'normal' | 'done' | 'blocked'

/**
 * Related entity (many2one from Odoo returns [id, name])
 */
export interface OdooRelation {
    id: number
    name: string
}

/**
 * Odoo event as returned from API
 */
export interface OdooEvent {
    id: number
    odoo_id: number
    name: string
    date_begin: string
    date_end: string
    timezone: string
    stage_id: OdooRelation | null       // Event stage (replaces 'state' in Odoo 16)
    kanban_state: OdooKanbanState       // Kanban state
    // Seats
    seats_max: number
    seats_available: number
    seats_reserved: number
    seats_used: number
    seats_limited: boolean
    // Relations
    location: OdooRelation | null
    organizer: OdooRelation | null
    responsible: OdooRelation | null
    event_type_id: OdooRelation | null  // Standard Odoo event.type
    domain_code: OdooRelation | null    // Website/domain
    // Content
    description: string | null
    note: string | null
    // Status
    active: boolean
    is_published: boolean
    website_url: string | null
    // Crearis custom fields
    cid: string | null                  // Crearis ID (domain.event-TYPE__id)
    rectitle: string                    // Display title with domain prefix
    teasertext: string | null           // Short teaser
    cimg: string | null                 // Hero image URL
    md: string | null                   // Markdown content
    schedule: string | null             // Schedule text
    header_type: OdooHeaderType         // Header style
    header_size: OdooHeaderSize         // Header size
    edit_mode: OdooEditMode             // Edit permissions
    version: number                     // Version counter
}

/**
 * Create event input
 */
export interface CreateOdooEventInput {
    name: string
    date_begin: string
    date_end: string
    seats_max?: number
    description?: string
    teasertext?: string
    timezone?: string
    event_type_id?: number  // Odoo event.type ID
}

/**
 * API response for events list
 */
export interface OdooEventsResponse {
    success: boolean
    events: OdooEvent[]
    total: number
    limit: number
    offset: number
    hasMore: boolean
}

/**
 * API response for event creation
 */
export interface CreateOdooEventResponse {
    success: boolean
    event: OdooEvent
    message: string
}

/**
 * Event state display info (based on stage name)
 * Note: Odoo 16 uses stage_id (many2one to event.stage) instead of state field
 */
export function getStageDisplayInfo(stageName: string | null): { label: string; color: string } {
    if (!stageName) return { label: 'Neu', color: 'var(--color-info, #3b82f6)' }

    const normalizedName = stageName.toLowerCase()
    if (normalizedName.includes('draft') || normalizedName.includes('neu') || normalizedName.includes('new')) {
        return { label: stageName, color: 'var(--color-warning, #f59e0b)' }
    }
    if (normalizedName.includes('confirm') || normalizedName.includes('bestätigt')) {
        return { label: stageName, color: 'var(--color-success, #22c55e)' }
    }
    if (normalizedName.includes('done') || normalizedName.includes('abgeschlossen') || normalizedName.includes('ended')) {
        return { label: stageName, color: 'var(--color-dimmed, #6b7280)' }
    }
    if (normalizedName.includes('cancel') || normalizedName.includes('abgesagt')) {
        return { label: stageName, color: 'var(--color-danger, #ef4444)' }
    }
    return { label: stageName, color: 'var(--color-primary, #3b82f6)' }
}

/**
 * Kanban state display info
 */
export const KANBAN_STATE_INFO: Record<string, { label: string; color: string }> = {
    normal: { label: 'Normal', color: 'var(--color-dimmed, #6b7280)' },
    done: { label: 'Bereit', color: 'var(--color-success, #22c55e)' },
    blocked: { label: 'Blockiert', color: 'var(--color-danger, #ef4444)' }
}

/**
 * Header type display info
 */
export const HEADER_TYPE_INFO: Record<OdooHeaderType, { label: string; icon: string }> = {
    simple: { label: 'Einfach', icon: '📝' },
    columns: { label: 'Text-Bild', icon: '📰' },
    banner: { label: 'Banner', icon: '🖼️' },
    cover: { label: 'Cover', icon: '🎬' },
    bauchbinde: { label: 'Bauchbinde', icon: '🎞️' }
}

/**
 * Format date for display
 */
export function formatEventDate(dateStr: string): string {
    if (!dateStr) return ''
    const date = new Date(dateStr.replace(' ', 'T'))
    return date.toLocaleDateString('de-DE', {
        weekday: 'short',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })
}

/**
 * Format date short (without time)
 */
export function formatEventDateShort(dateStr: string): string {
    if (!dateStr) return ''
    const date = new Date(dateStr.replace(' ', 'T'))
    return date.toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    })
}

/**
 * Check if event is single day
 */
export function isSingleDayEvent(event: OdooEvent): boolean {
    if (!event.date_begin || !event.date_end) return true
    const begin = new Date(event.date_begin.replace(' ', 'T'))
    const end = new Date(event.date_end.replace(' ', 'T'))
    return begin.toDateString() === end.toDateString()
}

/**
 * Get duration string
 */
export function getEventDuration(event: OdooEvent): string {
    if (!event.date_begin || !event.date_end) return ''
    const begin = new Date(event.date_begin.replace(' ', 'T'))
    const end = new Date(event.date_end.replace(' ', 'T'))
    const diffMs = end.getTime() - begin.getTime()
    const diffHours = Math.round(diffMs / (1000 * 60 * 60))

    if (diffHours < 24) {
        return `${diffHours}h`
    }
    const diffDays = Math.round(diffHours / 24)
    return `${diffDays} day${diffDays > 1 ? 's' : ''}`
}
