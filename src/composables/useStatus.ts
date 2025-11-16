/**
 * Status Composable
 * 
 * Provides client-side status helpers for Vue components.
 * Caches status data from server to avoid repeated API calls.
 */

import { ref, computed } from 'vue'
import { createDebugger } from '@/utils/debug'

const debug = createDebugger('useStatus')

/**
 * Status information structure
 */
export interface StatusInfo {
    id: number
    value: number
    name: string
    displayName: string
    displayDesc: string | null
}

/**
 * Raw status entry from database
 */
interface StatusEntry {
    id: number
    value: number
    name: string
    table: string
    name_i18n: Record<string, string>
    desc_i18n: Record<string, string> | null
}

// Global cache for status data
const statusCache = ref<StatusEntry[]>([])
const cacheInitialized = ref(false)
const cacheLoading = ref(false)

/**
 * Initialize status cache from server
 */
async function initializeCache() {
    if (cacheInitialized.value || cacheLoading.value) return

    cacheLoading.value = true

    try {
        const response = await fetch('/api/status/all')
        if (!response.ok) {
            throw new Error(`Failed to fetch status data: ${response.statusText}`)
        }

        const data = await response.json()
        statusCache.value = data.statuses || []
        cacheInitialized.value = true
        if (debug.isEnabled()) debug.log(`✅ Status cache initialized: ${statusCache.value.length} entries`)
    } catch (error) {
        console.error('❌ Failed to initialize status cache:', error)
    } finally {
        cacheLoading.value = false
    }
}

/**
 * Status composable for Vue components
 */
export function useStatus() {
    /**
     * Get status information with translation
     * @param value - Status value (e.g., 1, 2, 4, 8, 16)
     * @param table - Table name (e.g., 'tasks', 'users', 'events')
     * @param lang - Language code ('de', 'en', 'cz')
     * @returns StatusInfo object or null if not found
     */
    function status4Lang(value: number, table: string, lang: string = 'de'): StatusInfo | null {
        if (!cacheInitialized.value) {
            // Auto-initialize on first use
            initializeCache()
            return null
        }

        // Find status entry
        const status = statusCache.value.find(
            (s: StatusEntry) => s.value === value && s.table === table
        )

        if (!status) return null

        // Get translated name with fallback chain: lang -> de -> en -> base name
        const displayName = status.name_i18n?.[lang]
            || status.name_i18n?.['de']
            || status.name_i18n?.['en']
            || status.name

        // Get translated description with same fallback
        const displayDesc = status.desc_i18n?.[lang]
            || status.desc_i18n?.['de']
            || status.desc_i18n?.['en']
            || null

        return {
            id: status.id,
            value: status.value,
            name: status.name,
            displayName,
            displayDesc
        }
    }

    /**
     * Get status ID by value
     */
    function getStatusIdByVal(value: number, table: string): number | null {
        const status = statusCache.value.find(
            (s: StatusEntry) => s.value === value && s.table === table
        )
        return status?.id ?? null
    }

    /**
     * Get status ID by name
     */
    function getStatusIdByName(name: string, table: string): number | null {
        const status = statusCache.value.find(
            (s: StatusEntry) => s.name === name && s.table === table
        )
        return status?.id ?? null
    }

    /**
     * Get display name for a status value
     */
    function getStatusDisplayName(value: number, table: string, lang: string = 'de'): string {
        const info = status4Lang(value, table, lang)
        return info?.displayName || `Status ${value}`
    }

    /**
     * Get all statuses for a table
     */
    function getStatusesForTable(table: string): StatusEntry[] {
        return statusCache.value.filter((s: StatusEntry) => s.table === table)
    }

    /**
     * Get matching statuses from other tables by value
     * Returns unique localized texts only (excluding tasks table)
     * @param value - Status value to match
     * @param lang - Language code
     * @returns Array of {table, text} objects with unique texts
     */
    function getMatchingStatusesForOtherTables(value: number, lang: string = 'de'): Array<{ table: string; text: string }> {
        if (!cacheInitialized.value) {
            return []
        }

        const otherTables = ['events', 'posts', 'users', 'projects']
        const matchingStatuses = statusCache.value
            .filter((s: StatusEntry) => s.value === value && otherTables.includes(s.table))
            .map((s: StatusEntry) => ({
                table: s.table,
                text: s.name_i18n?.[lang] || s.name_i18n?.['de'] || s.name_i18n?.['en'] || s.name
            }))

        // Filter out duplicates by text
        const uniqueTexts = new Set<string>()
        const result: Array<{ table: string; text: string }> = []

        for (const status of matchingStatuses) {
            if (!uniqueTexts.has(status.text)) {
                uniqueTexts.add(status.text)
                result.push(status)
            }
        }

        return result
    }

    /**
     * Get default language based on user role
     */
    function getDefaultLanguage(userRole?: string): 'de' | 'en' | 'cz' {
        if (userRole === 'admin') return 'en'
        return 'de' // Default for project users and others
    }

    return {
        status4Lang,
        getStatusIdByVal,
        getStatusIdByName,
        getStatusDisplayName,
        getStatusesForTable,
        getMatchingStatusesForOtherTables,
        getDefaultLanguage,
        cacheInitialized: computed(() => cacheInitialized.value),
        cacheLoading: computed(() => cacheLoading.value),
        initializeCache
    }
}
