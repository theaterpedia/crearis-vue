import { ref, computed, readonly } from 'vue'
import { createDebugger } from '@/utils/debug'

const debug = createDebugger('useI18n')

/**
 * i18n Composable for Multi-language Support
 * 
 * Supports 3 languages: de (German), en (English), cz (Czech)
 * 4 translation types: button, nav, field, desc
 * 
 * Strategy:
 * - Preload: button/nav types on app startup
 * - Lazy-load: field/desc types on demand
 * - Caching: All translations cached in memory
 * - Fallback: requested lang → de → first available
 */

type Language = 'de' | 'en' | 'cz'
type TranslationType = 'button' | 'nav' | 'field' | 'desc'

interface I18nCode {
    id: number
    name: string
    variation: string
    type: TranslationType
    text: Record<string, string>
    status: string
}

interface I18nCache {
    [key: string]: I18nCode
}

// Global reactive state
const currentLanguage = ref<Language>('de')
const isPreloaded = ref(false)
const isLoading = ref(false)
const cache = ref<I18nCache>({})

// Error tracking
const errors = ref<string[]>([])

/**
 * Generate cache key for lookup
 */
function getCacheKey(name: string, variation: string, type: TranslationType): string {
    return `${type}:${name}:${variation}`
}

/**
 * Extract text from i18n code entry with fallback chain
 */
function resolveText(entry: I18nCode | undefined, lang: Language): string {
    if (!entry || !entry.text) {
        return ''
    }

    // Try requested language
    if (entry.text[lang]) {
        return entry.text[lang]
    }

    // Fallback to German (default)
    if (entry.text.de) {
        return entry.text.de
    }

    // Fallback to first available
    const firstKey = Object.keys(entry.text)[0]
    if (firstKey && entry.text[firstKey]) {
        return entry.text[firstKey]
    }

    return ''
}

/**
 * Fetch and cache translations from API
 */
async function fetchI18nCodes(queryParams: Record<string, string> = {}): Promise<I18nCode[]> {
    try {
        const query = new URLSearchParams(queryParams).toString()
        const url = `/api/i18n${query ? '?' + query : ''}`

        const response = await fetch(url)

        if (!response.ok) {
            throw new Error(`Failed to fetch i18n codes: ${response.statusText}`)
        }

        const data = await response.json()

        if (!data.success || !data.i18n_codes) {
            throw new Error('Invalid response format from i18n API')
        }

        return data.i18n_codes
    } catch (error: any) {
        const errorMsg = `Error fetching i18n codes: ${error.message}`
        console.error(errorMsg)
        errors.value.push(errorMsg)
        return []
    }
}

/**
 * Add entries to cache
 */
function addToCache(entries: I18nCode[]) {
    for (const entry of entries) {
        const key = getCacheKey(entry.name, entry.variation, entry.type)
        cache.value[key] = entry
    }
}

/**
 * Preload button and nav translations
 * Called on app startup
 */
async function preload(): Promise<void> {
    if (isPreloaded.value) {
        return
    }

    isLoading.value = true

    try {
        if (debug.isEnabled()) debug.log('🌍 Preloading i18n translations (button, nav)...')

        const entries = await fetchI18nCodes({ preload: 'true' })

        addToCache(entries)

        isPreloaded.value = true

        if (debug.isEnabled()) debug.log(`✅ Preloaded ${entries.length} i18n entries`)
    } catch (error: any) {
        console.error('Failed to preload i18n translations:', error)
        errors.value.push(`Preload failed: ${error.message}`)
    } finally {
        isLoading.value = false
    }
}

/**
 * Lazy-load specific translation if not in cache
 */
async function lazyLoad(name: string, variation: string, type: TranslationType): Promise<I18nCode | null> {
    try {
        const entries = await fetchI18nCodes({ name, variation, type })

        if (entries.length > 0) {
            addToCache(entries)
            return entries[0] || null
        }

        return null
    } catch (error: any) {
        console.error(`Failed to lazy-load i18n code: ${name}`, error)
        return null
    }
}

/**
 * Get or create translation (inline creation support)
 */
async function getOrCreate(
    name: string,
    type: TranslationType,
    variation: string = 'false',
    defaultText?: string
): Promise<I18nCode | null> {
    try {
        const response = await fetch('/api/i18n/get-or-create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, type, variation, defaultText })
        })

        if (!response.ok) {
            throw new Error(`Failed to get-or-create i18n code: ${response.statusText}`)
        }

        const data = await response.json()

        if (!data.success || !data.i18n_code) {
            throw new Error('Invalid response from get-or-create API')
        }

        // Add to cache
        const entry = data.i18n_code
        const key = getCacheKey(entry.name, entry.variation, entry.type)
        cache.value[key] = entry

        if (data.created) {
            if (debug.isEnabled()) debug.log(`📝 Created new i18n code: ${name} (${type})`)
        }

        return entry
    } catch (error: any) {
        console.error('Failed to get-or-create i18n code:', error)
        errors.value.push(`get-or-create failed: ${error.message}`)
        return null
    }
}

/**
 * Get translation with fallback to lazy-load
 */
async function getTranslation(
    name: string,
    type: TranslationType,
    variation: string = 'false'
): Promise<string> {
    const key = getCacheKey(name, variation, type)

    // Check cache first
    let entry = cache.value[key]

    // Lazy-load if not in cache
    if (!entry) {
        entry = await lazyLoad(name, variation, type) || undefined
    }

    // Get-or-create if still not found (for inline creation)
    if (!entry) {
        entry = await getOrCreate(name, type, variation, name) || undefined
    }

    // Resolve text with fallback chain
    return resolveText(entry, currentLanguage.value)
}

/**
 * Get button translation
 */
async function button(name: string, variation: string = 'false'): Promise<string> {
    return getTranslation(name, 'button', variation)
}

/**
 * Get navigation translation
 */
async function nav(name: string, variation: string = 'false'): Promise<string> {
    return getTranslation(name, 'nav', variation)
}

/**
 * Get field label translation
 */
async function field(name: string, variation: string = 'false'): Promise<string> {
    return getTranslation(name, 'field', variation)
}

/**
 * Get description translation
 */
async function desc(name: string, variation: string = 'false'): Promise<string> {
    return getTranslation(name, 'desc', variation)
}

/**
 * Set current language
 */
function setLanguage(lang: Language): void {
    if (lang !== currentLanguage.value) {
        if (debug.isEnabled()) debug.log(`🌍 Language changed: ${currentLanguage.value} → ${lang}`)
        currentLanguage.value = lang

        // Persist to localStorage
        try {
            localStorage.setItem('i18n:language', lang)
        } catch (error) {
            console.warn('Failed to persist language to localStorage:', error)
        }
    }
}

/**
 * Load language from localStorage or user preferences
 */
function initializeLanguage(): void {
    try {
        // Try localStorage first
        const stored = localStorage.getItem('i18n:language')
        if (stored && ['de', 'en', 'cz'].includes(stored)) {
            currentLanguage.value = stored as Language
            return
        }
    } catch (error) {
        console.warn('Failed to read language from localStorage:', error)
    }

    // Default to German
    currentLanguage.value = 'de'
}

/**
 * Clear cache (useful for testing or force-refresh)
 */
function clearCache(): void {
    cache.value = {}
    isPreloaded.value = false
    if (debug.isEnabled()) debug.log('🗑️ i18n cache cleared')
}

/**
 * Get cache statistics
 */
function getCacheStats() {
    const entries = Object.values(cache.value) as I18nCode[]
    const byType = {
        button: entries.filter((e: I18nCode) => e.type === 'button').length,
        nav: entries.filter((e: I18nCode) => e.type === 'nav').length,
        field: entries.filter((e: I18nCode) => e.type === 'field').length,
        desc: entries.filter((e: I18nCode) => e.type === 'desc').length
    }

    return {
        total: entries.length,
        byType,
        isPreloaded: isPreloaded.value
    }
}

/**
 * Main composable export
 */
export function useI18n() {
    // Initialize language on first use
    if (!currentLanguage.value) {
        initializeLanguage()
    }

    return {
        // State (readonly for external access)
        language: readonly(currentLanguage),
        isPreloaded: readonly(isPreloaded),
        isLoading: readonly(isLoading),
        errors: readonly(errors),

        // Computed
        cacheStats: computed(() => getCacheStats()),

        // Translation functions
        button,
        nav,
        field,
        desc,

        // Language management
        setLanguage,

        // Lifecycle
        preload,
        clearCache,

        // Direct access (for advanced use)
        getTranslation,
        getOrCreate
    }
}
