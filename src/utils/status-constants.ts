/**
 * Status Constants
 * 
 * Bit-based status values from sysreg_config.
 * Matches Migration 040/041 bit allocation.
 * 
 * Single source of truth for status values across the application.
 */

export const STATUS = {
    /** Newly created, needs verification */
    NEW: 1,        // bits 0-2
    
    /** Demo/testing mode */
    DEMO: 8,       // bits 3-5
    
    /** Draft/unverified */
    DRAFT: 64,     // bits 6-8
    
    /** Confirmed (generic) */
    CONFIRMED: 512, // bits 9-11
    
    /** Confirmed user subcategory */
    CONFIRMED_USER: 1024,
    
    /** Released/published */
    RELEASED: 4096, // bits 12-14
    
    /** Archived/inactive */
    ARCHIVED: 32768, // bit 15
    
    /** Marked for deletion */
    TRASH: 65536   // bit 16
} as const

export type StatusValue = typeof STATUS[keyof typeof STATUS]

/**
 * Status display names (German)
 */
export const STATUS_LABELS_DE: Record<StatusValue, string> = {
    [STATUS.NEW]: 'Neu',
    [STATUS.DEMO]: 'Demo',
    [STATUS.DRAFT]: 'Entwurf',
    [STATUS.CONFIRMED]: 'Bestätigt',
    [STATUS.CONFIRMED_USER]: 'Verifiziert',
    [STATUS.RELEASED]: 'Veröffentlicht',
    [STATUS.ARCHIVED]: 'Archiviert',
    [STATUS.TRASH]: 'Gelöscht'
}

/**
 * Status display names (English)
 */
export const STATUS_LABELS_EN: Record<StatusValue, string> = {
    [STATUS.NEW]: 'New',
    [STATUS.DEMO]: 'Demo',
    [STATUS.DRAFT]: 'Draft',
    [STATUS.CONFIRMED]: 'Confirmed',
    [STATUS.CONFIRMED_USER]: 'Verified',
    [STATUS.RELEASED]: 'Released',
    [STATUS.ARCHIVED]: 'Archived',
    [STATUS.TRASH]: 'Trash'
}

/**
 * Get status label
 */
export function getStatusLabel(status: StatusValue, lang: 'de' | 'en' = 'de'): string {
    const labels = lang === 'de' ? STATUS_LABELS_DE : STATUS_LABELS_EN
    return labels[status] || 'Unknown'
}

/**
 * Check if status is at least a certain level
 */
export function isStatusAtLeast(current: number, minimum: StatusValue): boolean {
    return current >= minimum
}

/**
 * Check if status is active (not archived or trashed)
 */
export function isStatusActive(status: number): boolean {
    return status < STATUS.ARCHIVED
}

/**
 * Map usermode string to status value (for StartPage.vue compatibility)
 */
export function usermodeToStatus(usermode: string): StatusValue | null {
    switch (usermode) {
        case 'no': return null
        case 'guest': return STATUS.NEW
        case 'user': return STATUS.DRAFT
        case 'verified': return STATUS.CONFIRMED_USER
        case 'loggedin': return STATUS.RELEASED
        default: return null
    }
}

/**
 * Map status value to usermode string (for StartPage.vue compatibility)
 */
export function statusToUsermode(status: number | null): 'no' | 'guest' | 'user' | 'verified' | 'loggedin' {
    if (status === null) return 'no'
    if (status === STATUS.NEW) return 'guest'
    if (status === STATUS.DEMO || status === STATUS.DRAFT) return 'user'
    if (status === STATUS.CONFIRMED || status === STATUS.CONFIRMED_USER) return 'verified'
    if (status >= STATUS.RELEASED) return 'loggedin'
    return 'no'
}
