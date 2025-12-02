/**
 * Status Value Helper Utilities
 * 
 * Helper functions for working with INTEGER status values in the sysreg system.
 * Uses 32-bit integer bitmask encoding (after Migration 036).
 */

import type { DatabaseAdapter } from '../database/adapter'

/**
 * Return type for status lookups
 */
export interface StatusInfo {
    name: string          // e.g., "new", "draft", "published"
    value: number         // INTEGER value (bitmask)
    fullName: string      // e.g., "events > new"
    description: string
    nameI18n: Record<string, string>
    descI18n: Record<string, string>
}

/**
 * Get status info by INTEGER value
 */
export async function getStatusByValue(
    db: DatabaseAdapter,
    value: number
): Promise<StatusInfo | null> {
    const result = await db.get(
        `SELECT 
            name,
            value,
            description,
            name_i18n as "nameI18n",
            desc_i18n as "descI18n"
        FROM sysreg_status
        WHERE value = $1`,
        [value]
    )

    if (!result) return null

    const row = result as any
    return {
        name: row.name.split(' > ')[1] || row.name,
        value: row.value,
        fullName: row.name,
        description: row.description || '',
        nameI18n: row.nameI18n || {},
        descI18n: row.descI18n || {}
    }
}

/**
 * Get status info by name (e.g., "draft", "published")
 * Optionally specify family/table (e.g., "events", "posts", "users")
 * 
 * Supports two naming patterns:
 * 1. Legacy: "family > name" (e.g., "events > new")
 * 2. Current: "name_family" (e.g., "new_user", "draft_user")
 */
export async function getStatusByName(
    db: DatabaseAdapter,
    statusName: string,
    family?: string
): Promise<StatusInfo | null> {
    let query: string
    let params: any[]

    if (family) {
        // Search for multiple patterns:
        // 1. Exact match: "name_family" (e.g., "new_user")
        // 2. Legacy: "family > name" (e.g., "users > new")
        // 3. Generic name without suffix (e.g., "new" for any table)
        query = `SELECT 
            name,
            value,
            description,
            name_i18n as "nameI18n",
            desc_i18n as "descI18n"
        FROM sysreg_status
        WHERE name = $1 
           OR name = $2
           OR name = $3
        ORDER BY 
            CASE 
                WHEN name = $1 THEN 1  -- Exact family match first
                WHEN name = $2 THEN 2  -- Legacy pattern second
                ELSE 3                  -- Generic name last
            END
        LIMIT 1`
        // Convert family to singular for suffix pattern (users -> user)
        const familySingular = family.endsWith('s') ? family.slice(0, -1) : family
        params = [
            `${statusName}_${familySingular}`,  // e.g., "new_user"
            `${family} > ${statusName}`,         // e.g., "users > new"
            statusName                            // e.g., "new"
        ]
    } else {
        // Search by name only (may match multiple families)
        query = `SELECT 
            name,
            value,
            description,
            name_i18n as "nameI18n",
            desc_i18n as "descI18n"
        FROM sysreg_status
        WHERE name = $1 OR name LIKE $2
        LIMIT 1`
        params = [statusName, `% > ${statusName}`]
    }

    const result = await db.get(query, params)

    if (!result) return null

    const row = result as any
    return {
        name: row.name.split(' > ')[1] || row.name,
        value: row.value,
        fullName: row.name,
        description: row.description || '',
        nameI18n: row.nameI18n || {},
        descI18n: row.descI18n || {}
    }
}

/**
 * Check if entity has a specific status
 */
export function hasStatus(
    entity: { status?: number | null },
    statusValue: number
): boolean {
    if (entity.status == null) return false
    return entity.status === statusValue
}

/**
 * Check if entity has status by name (requires status info lookup first)
 */
export async function hasStatusByName(
    db: DatabaseAdapter,
    entity: { status?: number | null },
    statusName: string,
    family?: string
): Promise<boolean> {
    if (entity.status == null) return false

    const statusInfo = await getStatusByName(db, statusName, family)
    if (!statusInfo) return false

    return entity.status === statusInfo.value
}

/**
 * Get all statuses for a specific family (e.g., "events", "tasks")
 */
export async function getStatusesForFamily(
    db: DatabaseAdapter,
    family: string
): Promise<StatusInfo[]> {
    const results = await db.all(
        `SELECT 
            name,
            value,
            description,
            name_i18n as "nameI18n",
            desc_i18n as "descI18n"
        FROM sysreg_status
        WHERE name LIKE $1
        ORDER BY name`,
        [`${family} > %`]
    )

    return (results as any[]).map(row => ({
        name: row.name.split(' > ')[1] || row.name,
        value: row.value,
        fullName: row.name,
        description: row.description || '',
        nameI18n: row.nameI18n || {},
        descI18n: row.descI18n || {}
    }))
}

/**
 * Format status for display (uses i18n if available)
 */
export function formatStatus(
    statusInfo: StatusInfo,
    lang: string = 'de'
): string {
    return statusInfo.nameI18n[lang] || statusInfo.name
}

/**
 * Create status value from bit position (e.g., 0 -> 1, 1 -> 2, 2 -> 4)
 */
export function statusValueFromBit(bit: number): number {
    return 1 << bit
}

/**
 * Get bit position from status value (e.g., 1 -> 0, 2 -> 1, 4 -> 2)
 */
export function statusValueToBit(value: number): number {
    return Math.log2(value)
}

/**
 * Check if a specific bit is set in a status value
 */
export function hasBit(value: number | null, bit: number): boolean {
    if (value == null) return false
    return (value & (1 << bit)) !== 0
}

/**
 * Set a specific bit in a status value
 */
export function setBit(value: number | null, bit: number): number {
    return (value ?? 0) | (1 << bit)
}

/**
 * Clear a specific bit in a status value
 */
export function clearBit(value: number | null, bit: number): number {
    return (value ?? 0) & ~(1 << bit)
}
