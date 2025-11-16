/**
 * Status Helpers
 * 
 * Provides fast lookup functions for status table data.
 * Initialized once on server start and cached in memory.
 */

import type { DatabaseAdapter } from '../database/adapter'

/**
 * Return type for getStatus4Lang
 */
export interface StatusInfo {
    id: number
    value: number
    name: string
    displayName: string
    displayDesc: string | null
}

/**
 * Cache structure
 */
interface StatusCache {
    byValue: Map<string, number> // key: `${table}:${value}` -> status.id
    byName: Map<string, number>   // key: `${table}:${name}` -> status.id
    byId: Map<number, {
        value: number
        name: string
        table: string
        name_i18n: Record<string, string>
        desc_i18n: Record<string, string> | null
    }>
}

let cache: StatusCache | null = null

/**
 * Initialize status cache from database
 * Should be called once on server startup
 */
export async function initializeStatusCache(db: DatabaseAdapter): Promise<void> {
    console.log('🔄 Initializing status cache...')

    const statuses = await db.all('SELECT id, value, name, "table", name_i18n, desc_i18n FROM status', [])

    cache = {
        byValue: new Map(),
        byName: new Map(),
        byId: new Map()
    }

    for (const status of statuses as any[]) {
        const key = `${status.table}:${status.value}`
        const nameKey = `${status.table}:${status.name}`

        cache.byValue.set(key, status.id)
        cache.byName.set(nameKey, status.id)

        // Parse i18n data
        let nameI18n: Record<string, string> = {}
        let descI18n: Record<string, string> | null = null

        if (typeof status.name_i18n === 'string') {
            try {
                nameI18n = JSON.parse(status.name_i18n)
            } catch (e) {
                nameI18n = {}
            }
        } else if (status.name_i18n) {
            nameI18n = status.name_i18n
        }

        if (status.desc_i18n) {
            if (typeof status.desc_i18n === 'string') {
                try {
                    descI18n = JSON.parse(status.desc_i18n)
                } catch (e) {
                    descI18n = null
                }
            } else {
                descI18n = status.desc_i18n
            }
        }

        cache.byId.set(status.id, {
            value: status.value,
            name: status.name,
            table: status.table,
            name_i18n: nameI18n,
            desc_i18n: descI18n
        })
    }

    console.log(`✅ Status cache initialized: ${cache.byId.size} entries`)
}

/**
 * Get status ID by value
 * @param value - Status value (e.g., 1, 2, 4, 8, 16)
 * @param table - Table name (e.g., 'tasks', 'users', 'events')
 * @returns Status ID or null if not found
 */
export function getStatusIdByVal(value: number, table: string): number | null {
    if (!cache) {
        throw new Error('Status cache not initialized. Call initializeStatusCache() first.')
    }

    const key = `${table}:${value}`
    return cache.byValue.get(key) ?? null
}

/**
 * Get status ID by name
 * @param name - Status name in English (e.g., 'new', 'idea', 'draft')
 * @param table - Table name (e.g., 'tasks', 'users', 'events')
 * @returns Status ID or null if not found
 */
export function getStatusIdByName(name: string, table: string): number | null {
    if (!cache) {
        throw new Error('Status cache not initialized. Call initializeStatusCache() first.')
    }

    const key = `${table}:${name}`
    return cache.byName.get(key) ?? null
}

/**
 * Get full status information with translations
 * @param value - Status value (e.g., 1, 2, 4, 8, 16)
 * @param table - Table name (e.g., 'tasks', 'users', 'events')
 * @param lang - Language code ('de', 'en', 'cz')
 * @returns StatusInfo object or null if not found
 */
export function getStatus4Lang(value: number, table: string, lang: string = 'de'): StatusInfo | null {
    if (!cache) {
        throw new Error('Status cache not initialized. Call initializeStatusCache() first.')
    }

    const statusId = getStatusIdByVal(value, table)
    if (!statusId) return null

    const status = cache.byId.get(statusId)
    if (!status) return null

    // Get translated name with fallback chain: lang -> de -> en -> base name
    const displayName = status.name_i18n[lang]
        || status.name_i18n['de']
        || status.name_i18n['en']
        || status.name

    // Get translated description with same fallback
    const displayDesc = status.desc_i18n?.[lang]
        || status.desc_i18n?.['de']
        || status.desc_i18n?.['en']
        || null

    return {
        id: statusId,
        value: status.value,
        name: status.name,
        displayName,
        displayDesc
    }
}

/**
 * Get status cache for debugging
 */
export function getStatusCache() {
    return cache
}
