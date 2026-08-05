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

// ============================================================================
// THE WORKFLOW MASK AND THE RUBICON
// ============================================================================
//
// Lifted here 2026-07-30 from two separate definitions, because the cv↔odoo
// decision thread (§1·D4) makes this predicate a **cross-tier invariant** rather
// than one composable's detail: below 512 CV OWNS the entity, at/above 512 CV
// merely CACHES it and Odoo is the writer. Both tiers must answer "which side of
// the Rubicon is this row on?" identically, so the answer lives in one place.
//
// It was previously `usePostStatusV2.ts:109` (a non-exported function-local, so
// server code could not import it) and `server/utils/odooSync.ts:120` (exported).
// This file already declares itself the single source of truth for status values,
// and it is pure arithmetic with no runtime dependencies — so both tiers can take
// it. Server-side importers use a relative path (nitro has no aliases; see
// `server/utils/odooEventsMock.ts` for the same pattern).

/**
 * Mask for the ordinal workflow bits (0–16), excluding the scope toggles (17–21)
 * and the admin bit (31).
 *
 * `status` is a **hybrid** (CV-Schema audit, 2026-07-28): one INTEGER packing two
 * regimes. Bits 0–16 are an ordinal workflow ENUM — categories are powers of two,
 * but **subcategories are composite ordinals in the gaps** (`new_user=3`,
 * `demo_project=24`), so that portion must **never** be bit-tested. Bits 17–21 and
 * 31 are genuinely independent toggles and *are* bit-tested.
 *
 * Rule of thumb: **ordinal-compare the low 17 bits; bitwise-test the high bits.**
 */
export const WORKFLOW_MASK = (1 << 17) - 1 // 0x1FFFF

/**
 * The ordinal part of `status`, with the scope/admin toggles masked off.
 *
 * The bug this prevents: comparing the **raw** value. A `draft` row carrying
 * `scope_public` is `2097216`, which sorts above every threshold — it would read
 * as released and be pushed through the Rubicon's one-way door.
 *
 * Not `& 7`: that is `compute_role_visibility`'s low-3-bits hack, which collapses
 * everything ≥ demo and is part of why that function misbehaves.
 */
export function lifecycleStatus(status: number | null | undefined): number {
    return (status ?? 0) & WORKFLOW_MASK
}

/**
 * The ownership line (cv↔odoo decision thread · D4).
 *
 * Below it CV owns the entity outright — local drafting, editable even with Odoo
 * unavailable. At or above it CV holds a read copy and Odoo is the system of record.
 */
export const RUBICON: number = STATUS.CONFIRMED // 512

/**
 * Is this row on Odoo's side of the Rubicon?
 *
 * ⚠ Answers the **ownership** question only. It deliberately returns `true` for
 * ARCHIVED (32768) and TRASH (65536) — they *are* at/above 512 on the ladder and CV
 * does not own them either. Callers that need "should this be pushed to Odoo?" must
 * additionally exclude archived/trash; that exclusion is a **separate,
 * non-overridable** guard in `odooSync.ts` and must stay separate, because
 * conflating "CV does not own it" with "send it to Odoo" is what would push a
 * trashed row through a one-way door.
 */
export function isAtOrAboveRubicon(status: number | null | undefined): boolean {
    return lifecycleStatus(status) >= RUBICON
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
