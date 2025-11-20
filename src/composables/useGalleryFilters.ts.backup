/**
 * Composable: useGalleryFilters
 * 
 * Manages filter state for image galleries with sysreg support.
 * Provides active filter tracking, query building, and saved filter sets.
 * 
 * Features:
 * - Status filtering (single select)
 * - TTags filtering (multi-select topics)
 * - DTags filtering (multi-select domains)
 * - CTags bit group filtering (age_group, subject_type, etc.)
 * - Active filter chips with remove functionality
 * - Saved filter sets with localStorage persistence
 * - Query string generation for API calls
 */

import { ref, computed, watch, onMounted, type Ref } from 'vue'
import {
    parseByteaHex,
    byteArrayToBits,
    bitsToByteArray
} from './useSysregTags'
import { useSysregOptions } from './useSysregOptions'

export interface GalleryFilters {
    status: string | null
    ttags: number[]  // Topic tag bit positions
    dtags: number[]  // Domain tag bit positions
    ctags_age_group: number | null  // 0-3
    ctags_subject_type: number | null  // 0-3
    ctags_access_level: number | null  // 0-3
    ctags_quality: number | null  // 0-3
}

export interface ActiveFilterChip {
    type: 'status' | 'ttags' | 'dtags' | 'ctags_age_group' | 'ctags_subject_type' | 'ctags_access_level' | 'ctags_quality'
    value: string | number
    label: string
    removable: boolean
}

export function useGalleryFilters(options?: {
    entity?: string
    autoFetch?: boolean
    onFilterChange?: (query: string) => void
}) {
    const entity = options?.entity || 'images'
    const autoFetch = options?.autoFetch ?? true

    // Get sysreg options for labels
    const {
        getTagLabel,
        getOptionByValue,
        ctagsBitGroupOptions
    } = useSysregOptions()

    // Filter state
    const activeFilters = ref<GalleryFilters>({
        status: null,
        ttags: [],
        dtags: [],
        ctags_age_group: null,
        ctags_subject_type: null,
        ctags_access_level: null,
        ctags_quality: null
    })

    // Saved filter sets
    const savedFilters = ref<Record<string, GalleryFilters>>({})

    // Check if any filters are active
    const hasActiveFilters = computed(() => {
        return (
            activeFilters.value.status !== null ||
            activeFilters.value.ttags.length > 0 ||
            activeFilters.value.dtags.length > 0 ||
            activeFilters.value.ctags_age_group !== null ||
            activeFilters.value.ctags_subject_type !== null ||
            activeFilters.value.ctags_access_level !== null ||
            activeFilters.value.ctags_quality !== null
        )
    })

    // Build active filter chips for UI display
    const activeFilterChips = computed<ActiveFilterChip[]>(() => {
        const chips: ActiveFilterChip[] = []

        // Status filter
        if (activeFilters.value.status) {
            const option = getOptionByValue('status', activeFilters.value.status)
            chips.push({
                type: 'status',
                value: activeFilters.value.status,
                label: option?.label || 'Status',
                removable: true
            })
        }

        // TTags filters
        activeFilters.value.ttags.forEach(bit => {
            // Get the BYTEA value for this single bit
            const bytea = bitsToByteArray([bit])
            const label = getTagLabel('ttags', bytea)
            chips.push({
                type: 'ttags',
                value: bit,
                label: label || `Topic ${bit}`,
                removable: true
            })
        })

        // DTags filters
        activeFilters.value.dtags.forEach(bit => {
            const bytea = bitsToByteArray([bit])
            const label = getTagLabel('dtags', bytea)
            chips.push({
                type: 'dtags',
                value: bit,
                label: label || `Domain ${bit}`,
                removable: true
            })
        })

        // CTags bit group filters
        if (activeFilters.value.ctags_age_group !== null) {
            const option = ctagsBitGroupOptions.age_group.find(
                opt => opt.value === activeFilters.value.ctags_age_group
            )
            chips.push({
                type: 'ctags_age_group',
                value: activeFilters.value.ctags_age_group,
                label: `Alter: ${option?.label || activeFilters.value.ctags_age_group}`,
                removable: true
            })
        }

        if (activeFilters.value.ctags_subject_type !== null) {
            const option = ctagsBitGroupOptions.subject_type.find(
                opt => opt.value === activeFilters.value.ctags_subject_type
            )
            chips.push({
                type: 'ctags_subject_type',
                value: activeFilters.value.ctags_subject_type,
                label: `Motiv: ${option?.label || activeFilters.value.ctags_subject_type}`,
                removable: true
            })
        }

        if (activeFilters.value.ctags_access_level !== null) {
            const option = ctagsBitGroupOptions.access_level.find(
                opt => opt.value === activeFilters.value.ctags_access_level
            )
            chips.push({
                type: 'ctags_access_level',
                value: activeFilters.value.ctags_access_level,
                label: `Zugriff: ${option?.label || activeFilters.value.ctags_access_level}`,
                removable: true
            })
        }

        if (activeFilters.value.ctags_quality !== null) {
            const option = ctagsBitGroupOptions.quality.find(
                opt => opt.value === activeFilters.value.ctags_quality
            )
            chips.push({
                type: 'ctags_quality',
                value: activeFilters.value.ctags_quality,
                label: `Qualität: ${option?.label || activeFilters.value.ctags_quality}`,
                removable: true
            })
        }

        return chips
    })

    // Build query string for API
    const queryString = computed(() => {
        const params = new URLSearchParams()

        // Status filter
        if (activeFilters.value.status) {
            params.set('status_eq', activeFilters.value.status)
        }

        // TTags filter (any of these bits set)
        if (activeFilters.value.ttags.length > 0) {
            const bytea = bitsToByteArray(activeFilters.value.ttags)
            params.set('ttags_any', bytea)
        }

        // DTags filter (any of these bits set)
        if (activeFilters.value.dtags.length > 0) {
            const bytea = bitsToByteArray(activeFilters.value.dtags)
            params.set('dtags_any', bytea)
        }

        // CTags bit group filters
        if (activeFilters.value.ctags_age_group !== null) {
            params.set('ctags_age_group', activeFilters.value.ctags_age_group.toString())
        }

        if (activeFilters.value.ctags_subject_type !== null) {
            params.set('ctags_subject_type', activeFilters.value.ctags_subject_type.toString())
        }

        if (activeFilters.value.ctags_access_level !== null) {
            params.set('ctags_access_level', activeFilters.value.ctags_access_level.toString())
        }

        if (activeFilters.value.ctags_quality !== null) {
            params.set('ctags_quality', activeFilters.value.ctags_quality.toString())
        }

        return params.toString()
    })

    // Filter actions
    function setStatusFilter(status: string | null) {
        activeFilters.value.status = status
    }

    function clearStatusFilter() {
        activeFilters.value.status = null
    }

    function addTopicTag(bit: number) {
        if (!activeFilters.value.ttags.includes(bit)) {
            activeFilters.value.ttags.push(bit)
        }
    }

    function removeTopicTag(bit: number) {
        const index = activeFilters.value.ttags.indexOf(bit)
        if (index > -1) {
            activeFilters.value.ttags.splice(index, 1)
        }
    }

    function setTopicTags(bits: number[]) {
        activeFilters.value.ttags = [...bits]
    }

    function clearTopicTags() {
        activeFilters.value.ttags = []
    }

    function addDomainTag(bit: number) {
        if (!activeFilters.value.dtags.includes(bit)) {
            activeFilters.value.dtags.push(bit)
        }
    }

    function removeDomainTag(bit: number) {
        const index = activeFilters.value.dtags.indexOf(bit)
        if (index > -1) {
            activeFilters.value.dtags.splice(index, 1)
        }
    }

    function setDomainTags(bits: number[]) {
        activeFilters.value.dtags = [...bits]
    }

    function clearDomainTags() {
        activeFilters.value.dtags = []
    }

    function setCtagsAgeGroup(value: number | null) {
        activeFilters.value.ctags_age_group = value
    }

    function setCtagsSubjectType(value: number | null) {
        activeFilters.value.ctags_subject_type = value
    }

    function setCtagsAccessLevel(value: number | null) {
        activeFilters.value.ctags_access_level = value
    }

    function setCtagsQuality(value: number | null) {
        activeFilters.value.ctags_quality = value
    }

    function removeFilter(chip: ActiveFilterChip) {
        switch (chip.type) {
            case 'status':
                clearStatusFilter()
                break
            case 'ttags':
                removeTopicTag(chip.value as number)
                break
            case 'dtags':
                removeDomainTag(chip.value as number)
                break
            case 'ctags_age_group':
                setCtagsAgeGroup(null)
                break
            case 'ctags_subject_type':
                setCtagsSubjectType(null)
                break
            case 'ctags_access_level':
                setCtagsAccessLevel(null)
                break
            case 'ctags_quality':
                setCtagsQuality(null)
                break
        }
    }

    function clearAllFilters() {
        activeFilters.value = {
            status: null,
            ttags: [],
            dtags: [],
            ctags_age_group: null,
            ctags_subject_type: null,
            ctags_access_level: null,
            ctags_quality: null
        }
    }

    // Saved filter sets
    function saveFilterSet(name: string) {
        savedFilters.value[name] = { ...activeFilters.value }

        // Persist to localStorage
        localStorage.setItem(
            `gallery-filters-${entity}`,
            JSON.stringify(savedFilters.value)
        )
    }

    function loadFilterSet(name: string) {
        const saved = savedFilters.value[name]
        if (saved) {
            activeFilters.value = { ...saved }
        }
    }

    function deleteFilterSet(name: string) {
        delete savedFilters.value[name]

        // Persist to localStorage
        localStorage.setItem(
            `gallery-filters-${entity}`,
            JSON.stringify(savedFilters.value)
        )
    }

    function getSavedFilterNames(): string[] {
        return Object.keys(savedFilters.value)
    }

    // Load saved filters from localStorage on mount
    onMounted(() => {
        const saved = localStorage.getItem(`gallery-filters-${entity}`)
        if (saved) {
            try {
                savedFilters.value = JSON.parse(saved)
            } catch (error) {
                console.error('Failed to parse saved filters:', error)
            }
        }
    })

    // Watch for filter changes and notify
    if (autoFetch && options?.onFilterChange) {
        watch(
            () => queryString.value,
            (newQuery) => {
                options.onFilterChange!(newQuery)
            }
        )
    }

    return {
        // Filter state
        activeFilters,
        hasActiveFilters,
        activeFilterChips,
        queryString,

        // Status actions
        setStatusFilter,
        clearStatusFilter,

        // Topic tag actions
        addTopicTag,
        removeTopicTag,
        setTopicTags,
        clearTopicTags,

        // Domain tag actions
        addDomainTag,
        removeDomainTag,
        setDomainTags,
        clearDomainTags,

        // CTags bit group actions
        setCtagsAgeGroup,
        setCtagsSubjectType,
        setCtagsAccessLevel,
        setCtagsQuality,

        // General actions
        removeFilter,
        clearAllFilters,

        // Saved filter sets
        savedFilters,
        saveFilterSet,
        loadFilterSet,
        deleteFilterSet,
        getSavedFilterNames
    }
}
