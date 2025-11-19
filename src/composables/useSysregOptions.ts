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
    value: string       // BYTEA hex string (e.g., '\\x01', '\\x02')
    name: string        // Internal name (e.g., 'democracy', 'raw')
    label: string       // Translated label
    bit?: number        // Bit position for bit-based tags (0-7)
    description?: string // Translated description
    taglogic: string    // category | subcategory | option | toggle
    is_default: boolean
    tagfamily: string   // tagfamily name
    bit_group?: string  // For ctags: age_group, subject_type, etc.
    color?: string      // Optional UI color hint
}

export interface BitGroupOption {
    value: number       // 0-3 (bit position within group)
    label: string       // Translated label
    description?: string
    bit_group?: string  // age_group, subject_type, etc.
}

// ============================================================================
// Main Composable
// ============================================================================

export function useSysregOptions(entity?: Ref<string> | string, lang: Ref<string> | string = 'de') {
    const { sysregCache, cacheInitialized, initCache } = useSysregTags()

    const loading = ref(false)
    const error = ref<string | null>(null)
    const options = ref<SysregOption[]>([])

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
     * Populate options array from cache
     */
    function populateOptions(): void {
        if (!sysregCache.value) {
            options.value = []
            return
        }

        const langCode = typeof lang === 'string' ? lang : lang.value
        const allOptions: SysregOption[] = []

        // Aggregate all options from all tagfamilies
        Object.entries(sysregCache.value).forEach(([tagfamily, entries]) => {
            if (Array.isArray(entries)) {
                entries.forEach((entry: any) => {
                    // Extract bit position from hex value (if bit-based)
                    const hexValue = entry.value || '\\x00'
                    const byteValue = parseInt(hexValue.replace(/^\\x/, ''), 16)
                    const bit = byteValue > 0 ? Math.log2(byteValue) : undefined
                    const bitPosition = bit !== undefined && Number.isInteger(bit) ? bit : undefined

                    allOptions.push({
                        value: hexValue,
                        name: entry.name,
                        label: getLabel(entry, langCode),
                        bit: bitPosition,
                        description: getDescription(entry, langCode),
                        taglogic: entry.taglogic,
                        is_default: entry.is_default,
                        tagfamily: tagfamily,
                        bit_group: entry.bit_group
                    })
                })
            }
        })

        options.value = allOptions
    }

    // Populate options from cache if already initialized
    if (cacheInitialized.value) {
        populateOptions()
    }

    /**
     * Fetch all sysreg options from API
     * @param force - Force refresh bypassing cache
     */
    async function fetchOptions(force: boolean = false): Promise<void> {
        try {
            loading.value = true
            error.value = null

            // Force refresh if requested
            if (force || !cacheInitialized.value) {
                // Reset cache flag to allow re-initialization
                if (force) {
                    const { resetCache } = useSysregTags()
                    resetCache()
                }
                await initCache()
            }

            populateOptions()
        } catch (e: any) {
            error.value = e.message
            console.error('Failed to fetch sysreg options:', e)
        } finally {
            loading.value = false
        }
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
        const opts = getOptionsByFamily(tagfamily)
        return opts.find((opt: SysregOption) => opt.name === name) || null
    }

    /**
     * Get option by value (accepts both hex string and name string)
     */
    function getOptionByValue(tagfamily: string, value: string): SysregOption | null {
        const opts = getOptionsByFamily(tagfamily)
        // Try exact match on value field (hex) first
        let found = opts.find((opt: SysregOption) => opt.value === value)
        // If not found, try matching by name (for convenience)
        if (!found) {
            found = opts.find((opt: SysregOption) => opt.name === value)
        }
        return found || null
    }

    /**
     * Get options for a specific tagfamily
     */
    function getOptionsByFamily(tagfamily: string): SysregOption[] {
        if (!sysregCache.value) return []

        const entries = sysregCache.value[tagfamily as keyof typeof sysregCache.value]
        if (!entries || !Array.isArray(entries)) return []

        const langCode = typeof lang === 'string' ? lang : lang.value

        // Only ttags, dtags, rtags use bit positions (power-of-2 values)
        // Status, config use direct byte values
        const isBitBased = ['ttags', 'dtags', 'rtags', 'ctags'].includes(tagfamily)

        return entries.map((entry: any) => {
            const hexValue = entry.value || '\\x00'
            const byteValue = parseInt(hexValue.replace(/^\\x/, ''), 16)

            // Extract bit position only for bit-based tagfamilies
            // Check if value is a power of 2: (byteValue & (byteValue - 1)) === 0
            let bitPosition: number | undefined = undefined
            if (isBitBased && byteValue > 0 && (byteValue & (byteValue - 1)) === 0) {
                bitPosition = Math.log2(byteValue)
            }

            return {
                value: hexValue,
                name: entry.name,
                label: getLabel(entry, langCode),
                bit: bitPosition,
                description: getDescription(entry, langCode),
                taglogic: entry.taglogic,
                is_default: entry.is_default,
                tagfamily: tagfamily,
                bit_group: entry.bit_group
            }
        })
    }    /**
     * Get CTags bit group options (filtered from cache)
     */
    function getCtagsBitGroup(group: 'age_group' | 'subject_type' | 'access_level' | 'quality'): BitGroupOption[] {
        // Filter ctags options by bit_group
        const ctagsOpts = getOptionsByFamily('ctags')
        const filtered = ctagsOpts.filter(opt => opt.bit_group === group)

        // Convert to BitGroupOption format
        return filtered.map(opt => ({
            value: opt.bit ?? 0,
            label: opt.label,
            description: opt.description,
            bit_group: opt.bit_group
        }))
    }

    return {
        // State
        loading: readonly(loading),
        error: readonly(error),
        options: readonly(options),
        cacheInitialized,

        // Fetch function
        fetchOptions,

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
        getOptionsByFamily,
        getCtagsBitGroup,

        // Cache control
        initCache
    }
}
