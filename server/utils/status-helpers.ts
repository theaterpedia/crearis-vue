/**
 * Status Value Helper Utilities
 * 
 * Helper functions for working with BYTEA status values in the sysreg system.
 * Replaces legacy status_id INTEGER lookups with BYTEA value operations.
 */

import type { DatabaseAdapter } from '../database/adapter'

/**
 * Return type for status lookups
 */
export interface StatusInfo {
    name: string          // e.g., "new", "draft", "published"
    value: Buffer         // BYTEA value
    fullName: string      // e.g., "events > new"
    description: string
    nameI18n: Record<string, string>
    descI18n: Record<string, string>
}

/**
 * Get status info by BYTEA value
 */
export async function getStatusByValue(
    db: DatabaseAdapter,
    value: Buffer
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
 * Optionally specify family/table (e.g., "events", "posts")
 */
export async function getStatusByName(
    db: DatabaseAdapter,
    statusName: string,
    family?: string
): Promise<StatusInfo | null> {
    let query: string
    let params: any[]

    if (family) {
        // Search for "family > name" pattern
        query = `SELECT 
            name,
            value,
            description,
            name_i18n as "nameI18n",
            desc_i18n as "descI18n"
        FROM sysreg_status
        WHERE name = $1 OR name LIKE $2
        LIMIT 1`
        params = [`${family} > ${statusName}`, `${family} > ${statusName}`]
    } else {
        // Search by name only (may match multiple families)
        query = `SELECT 
            name,
            value,
            description,
            name_i18n as "nameI18n",
            desc_i18n as "descI18n"
        FROM sysreg_status
        WHERE name LIKE $1
        LIMIT 1`
        params = [`% > ${statusName}`]
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
    entity: { status_val?: Buffer | null },
    statusValue: Buffer
): boolean {
    if (!entity.status_val) return false
    return entity.status_val.equals(statusValue)
}

/**
 * Check if entity has status by name (requires status info lookup first)
 */
export async function hasStatusByName(
    db: DatabaseAdapter,
    entity: { status_val?: Buffer | null },
    statusName: string,
    family?: string
): Promise<boolean> {
    if (!entity.status_val) return false

    const statusInfo = await getStatusByName(db, statusName, family)
    if (!statusInfo) return false

    return entity.status_val.equals(statusInfo.value)
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
 * Create status value from hex string (e.g., "0001" -> Buffer)
 */
export function statusValueFromHex(hex: string): Buffer {
    return Buffer.from(hex, 'hex')
}

/**
 * Convert status value to hex string (e.g., Buffer -> "0001")
 */
export function statusValueToHex(value: Buffer): string {
    return value.toString('hex')
}
