/**
 * Sysreg Plugin for Vue
 * 
 * Preloads all sysreg status data on app startup and caches it in localStorage.
 * This enables synchronous access to status names, labels, and translations
 * throughout the application without async overhead.
 * 
 * Features:
 * - Fetches all status data for all tables (posts, events, projects, tasks, etc.)
 * - Loads all languages (de, en, cz) for i18n support
 * - Caches in localStorage with TTL (24 hours default)
 * - Provides synchronous API via useSysregStatus composable
 * - Automatically refreshes on cache expiry
 */

import type { App } from 'vue'
import { createDebugger } from '@/utils/debug'

const debug = createDebugger('sysreg-plugin')

export interface SysregStatusEntry {
    id: number
    value: number          // Numeric value (e.g., 1, 2, 4, 8)
    hex_value: string      // Hex representation (e.g., '0000', '0001')
    name: string           // Internal name (e.g., 'new', 'progress')
    table: string          // Entity table (e.g., 'posts', 'events')
    name_de: string        // German translation
    name_en: string        // English translation
    name_cz: string        // Czech translation
    desc_de?: string       // German description
    desc_en?: string       // English description
    desc_cz?: string       // Czech description
}

export interface SysregCache {
    statuses: SysregStatusEntry[]
    timestamp: number
    version: string
}

// Global state (shared across all composable instances)
const CACHE_KEY = 'sysreg_status_cache'
const CACHE_VERSION = '1.0'
const CACHE_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours

let globalCache: SysregStatusEntry[] = []
let cacheInitialized = false
let initializationPromise: Promise<void> | null = null

/**
 * Load cache from localStorage
 */
function loadFromStorage(): SysregStatusEntry[] | null {
    try {
        const stored = localStorage.getItem(CACHE_KEY)
        if (!stored) return null

        const cache: SysregCache = JSON.parse(stored)

        // Check version
        if (cache.version !== CACHE_VERSION) {
            if (debug.isEnabled()) debug.log('Cache version mismatch, invalidating')
            localStorage.removeItem(CACHE_KEY)
            return null
        }

        // Check TTL
        const age = Date.now() - cache.timestamp
        if (age > CACHE_TTL_MS) {
            if (debug.isEnabled()) debug.log('Cache expired, invalidating')
            localStorage.removeItem(CACHE_KEY)
            return null
        }

        if (debug.isEnabled()) debug.log(`✅ Loaded ${cache.statuses.length} entries from localStorage cache`)
        return cache.statuses
    } catch (error) {
        console.error('❌ Failed to load sysreg cache from localStorage:', error)
        localStorage.removeItem(CACHE_KEY)
        return null
    }
}

/**
 * Save cache to localStorage
 */
function saveToStorage(statuses: SysregStatusEntry[]) {
    try {
        const cache: SysregCache = {
            statuses,
            timestamp: Date.now(),
            version: CACHE_VERSION
        }
        localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
        if (debug.isEnabled()) debug.log(`💾 Saved ${statuses.length} entries to localStorage cache`)
    } catch (error) {
        console.error('❌ Failed to save sysreg cache to localStorage:', error)
    }
}

/**
 * Fetch status data from server
 */
async function fetchFromServer(): Promise<SysregStatusEntry[]> {
    if (debug.isEnabled()) debug.log('🌐 Fetching status data from server...')

    const response = await fetch('/api/status/all')
    if (!response.ok) {
        throw new Error(`Failed to fetch status data: ${response.statusText}`)
    }

    const data = await response.json()
    const statuses: SysregStatusEntry[] = data.statuses || []

    if (debug.isEnabled()) debug.log(`✅ Fetched ${statuses.length} status entries from server`)

    // Transform to ensure consistent structure
    return statuses.map((entry: any) => ({
        id: entry.id,
        value: entry.value,
        hex_value: entry.hex_value || entry.value.toString(16).padStart(4, '0'),
        name: entry.name,
        table: entry.table,
        name_de: entry.name_i18n?.de || entry.name_de || entry.name,
        name_en: entry.name_i18n?.en || entry.name_en || entry.name,
        name_cz: entry.name_i18n?.cz || entry.name_cz || entry.name,
        desc_de: entry.desc_i18n?.de || entry.desc_de,
        desc_en: entry.desc_i18n?.en || entry.desc_en,
        desc_cz: entry.desc_i18n?.cz || entry.desc_cz
    }))
}

/**
 * Initialize sysreg cache
 * Can be called multiple times safely (idempotent)
 */
export async function initializeSysregCache(): Promise<void> {
    // Return existing promise if initialization is in progress
    if (initializationPromise) {
        return initializationPromise
    }

    // Already initialized
    if (cacheInitialized) {
        return Promise.resolve()
    }

    initializationPromise = (async () => {
        try {
            if (debug.isEnabled()) debug.log('🚀 Initializing sysreg cache...')

            // Try localStorage first
            const cached = loadFromStorage()
            if (cached && cached.length > 0) {
                globalCache = cached
                cacheInitialized = true
                if (debug.isEnabled()) debug.log('✅ Sysreg cache initialized from localStorage')
                return
            }

            // Fetch from server
            const statuses = await fetchFromServer()
            globalCache = statuses
            cacheInitialized = true

            // Save to localStorage
            saveToStorage(statuses)

            if (debug.isEnabled()) debug.log('✅ Sysreg cache initialized from server')
        } catch (error) {
            console.error('❌ Failed to initialize sysreg cache:', error)
            // Don't throw - allow app to continue with empty cache
            globalCache = []
            cacheInitialized = true
        } finally {
            initializationPromise = null
        }
    })()

    return initializationPromise
}

/**
 * Get all cached status entries (synchronous)
 */
export function getSysregCache(): SysregStatusEntry[] {
    return globalCache
}

/**
 * Check if cache is initialized
 */
export function isSysregCacheInitialized(): boolean {
    return cacheInitialized
}

/**
 * Force refresh cache from server
 */
export async function refreshSysregCache(): Promise<void> {
    try {
        if (debug.isEnabled()) debug.log('🔄 Refreshing sysreg cache...')
        const statuses = await fetchFromServer()
        globalCache = statuses
        saveToStorage(statuses)
        if (debug.isEnabled()) debug.log('✅ Sysreg cache refreshed')
    } catch (error) {
        console.error('❌ Failed to refresh sysreg cache:', error)
        throw error
    }
}

/**
 * Clear cache (useful for logout or cache invalidation)
 */
export function clearSysregCache(): void {
    globalCache = []
    cacheInitialized = false
    localStorage.removeItem(CACHE_KEY)
    if (debug.isEnabled()) debug.log('🗑️ Sysreg cache cleared')
}

/**
 * Vue plugin installation
 */
export interface SysregPluginOptions {
    /** Skip preload on startup (useful for testing) */
    skipPreload?: boolean
    /** Cache TTL in milliseconds (default: 24 hours) */
    cacheTTL?: number
}

export default {
    async install(app: App, options: SysregPluginOptions = {}) {
        if (debug.isEnabled()) debug.log('📦 Installing Sysreg plugin...')

        // Initialize cache unless explicitly skipped
        if (!options.skipPreload) {
            await initializeSysregCache()
        }

        // Make cache functions available globally
        app.config.globalProperties.$sysreg = {
            getCache: getSysregCache,
            isInitialized: isSysregCacheInitialized,
            refresh: refreshSysregCache,
            clear: clearSysregCache
        }

        // Provide for injection
        app.provide('sysreg', {
            getCache: getSysregCache,
            isInitialized: isSysregCacheInitialized,
            refresh: refreshSysregCache,
            clear: clearSysregCache
        })

        if (debug.isEnabled()) debug.log('✅ Sysreg plugin installed')
    }
}

// Type augmentation for global properties
declare module '@vue/runtime-core' {
    export interface ComponentCustomProperties {
        $sysreg: {
            getCache: () => SysregStatusEntry[]
            isInitialized: () => boolean
            refresh: () => Promise<void>
            clear: () => void
        }
    }
}
