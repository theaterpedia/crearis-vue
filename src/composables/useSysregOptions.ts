/**
 * Composable: useSysregOptions
 * 
 * Fetches and caches sysreg metadata for dropdowns and filters.
 * Provides translated labels with i18n fallback chain.
 * 
 * Features:
 * - Fetch options for specific tagfamily
 * - Get translated labels (de → en → base name)
 * - Filter options by entity type
 * - Cache management
 */

import { ref, computed, readonly, onMounted, type Ref, type ComputedRef } from 'vue'
import { useSysregTags } from './useSysregTags'

// ============================================================================
// Types
// ============================================================================

export interface SysregOption {
    value: string       // BYTEA hex string
    name: string        // Internal name
    label: string       // Translated label
    description?: string // Translated description
    taglogic: string    // category | subcategory | option | toggle
    is_default: boolean
    color?: string      // Optional UI color hint
}

export interface BitGroupOption {
    value: number       // 0-3
    label: string       // Translated label
    description?: string
}

// ============================================================================
// Main Composable
// ============================================================================

export function useSysregOptions(entity?: Ref<string> | string, lang: Ref<string> | string = 'de') {
    const { sysregCache, cacheInitialized, initCache } = useSysregTags()

    const loading = ref(false)
    const error = ref<string | null>(null)

    // Auto-initialize cache on mount
    onMounted(async () => {
        if (!cacheInitialized.value) {
            try {
                loading.value = true
                await initCache()
            } catch (e: any) {
                error.value = e.message
            } finally {
                loading.value = false
            }
        }
    })

    /**
     * Get translated label with fallback chain
     */
    function getLabel(entry: any, langCode: string): string {
        if (!entry) return ''

        // Try i18n with fallback chain: requested lang → de → en → base name
        return entry.name_i18n?.[langCode]
            || entry.name_i18n?.['de']
            || entry.name_i18n?.['en']
            || entry.name
            || ''
    }

    /**
     * Get translated description with fallback chain
     */
    function getDescription(entry: any, langCode: string): string | undefined {
        if (!entry?.desc_i18n) return undefined

        return entry.desc_i18n[langCode]
            || entry.desc_i18n['de']
            || entry.desc_i18n['en']
            || undefined
    }

    /**
     * Get options for a specific tagfamily
     */
    function getOptions(tagfamily: string): ComputedRef<SysregOption[]> {
        return computed(() => {
            if (!sysregCache.value) return []

            const entries = sysregCache.value[tagfamily as keyof typeof sysregCache.value]
            if (!entries) return []

            const langCode = typeof lang === 'string' ? lang : lang.value

            return entries.map((entry: any) => ({
                value: entry.value,
                name: entry.name,
                label: getLabel(entry, langCode),
                description: getDescription(entry, langCode),
                taglogic: entry.taglogic,
                is_default: entry.is_default
            }))
        })
    }

    /**
     * Get status options
     */
    const statusOptions = getOptions('status')

    /**
     * Get config options
     */
    const configOptions = getOptions('config')

    /**
     * Get rtags options
     */
    const rtagsOptions = getOptions('rtags')

    /**
     * Get ctags options (flat list)
     */
    const ctagsOptions = getOptions('ctags')

    /**
     * Get ttags options
     */
    const ttagsOptions = getOptions('ttags')

    /**
     * Get dtags options
     */
    const dtagsOptions = getOptions('dtags')

    /**
     * Get CTags bit group options (hardcoded for now, can be moved to DB later)
     */
    const ctagsBitGroupOptions = {
        age_group: computed((): BitGroupOption[] => [
            { value: 0, label: 'Andere' },
            { value: 1, label: 'Kind' },
            { value: 2, label: 'Jugendlich' },
            { value: 3, label: 'Erwachsen' }
        ]),
        subject_type: computed((): BitGroupOption[] => [
            { value: 0, label: 'Andere' },
            { value: 1, label: 'Gruppe' },
            { value: 2, label: 'Person' },
            { value: 3, label: 'Portrait' }
        ]),
        access_level: computed((): BitGroupOption[] => [
            { value: 0, label: 'Projekt' },
            { value: 1, label: 'Öffentlich' },
            { value: 2, label: 'Privat' },
            { value: 3, label: 'Intern' }
        ]),
        quality: computed((): BitGroupOption[] => [
            { value: 0, label: 'OK' },
            { value: 1, label: 'Veraltet' },
            { value: 2, label: 'Technischer Fehler' },
            { value: 3, label: 'Qualität prüfen' }
        ])
    }

    /**
     * Get label for a specific tag value
     */
    function getTagLabel(tagfamily: string, value: string): string {
        if (!sysregCache.value) return ''

        const entries = sysregCache.value[tagfamily as keyof typeof sysregCache.value]
        if (!entries) return ''

        const entry = entries.find((e: any) => e.value === value)
        if (!entry) return ''

        const langCode = typeof lang === 'string' ? lang : lang.value
        return getLabel(entry, langCode)
    }

    /**
     * Get option by name
     */
    function getOptionByName(tagfamily: string, name: string): SysregOption | null {
        const options = getOptions(tagfamily).value
        return options.find(opt => opt.name === name) || null
    }

    /**
     * Get option by value
     */
    function getOptionByValue(tagfamily: string, value: string): SysregOption | null {
        const options = getOptions(tagfamily).value
        return options.find(opt => opt.value === value) || null
    }

    return {
        // State
        loading: readonly(loading),
        error: readonly(error),
        cacheInitialized,

        // Options getters
        statusOptions,
        configOptions,
        rtagsOptions,
        ctagsOptions,
        ttagsOptions,
        dtagsOptions,
        ctagsBitGroupOptions,

        // Utility functions
        getOptions,
        getTagLabel,
        getOptionByName,
        getOptionByValue,

        // Cache control
        initCache
    }
}
