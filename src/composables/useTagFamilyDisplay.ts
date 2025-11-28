/**
 * useTagFamilyDisplay - Composable for formatting tag family display
 * 
 * Provides:
 * - Compact display format (icons + minimal text)
 * - Zoomed display format (full labels)
 * - Filtering by core/options/all
 * - Icon and color support
 * - i18n label handling
 */

import { computed, type ComputedRef } from 'vue'
import { useTagFamily } from './useTagFamily'
import type { TagGroup } from './useTagFamily'
import { useSysregOptions } from './useSysregOptions'
import type { SysregOption } from './useSysregOptions'
import { useI18n } from './useI18n'
import { normalizeToInteger, hasBit } from './useSysregTags'

export interface TagDisplay {
    groupName: string
    groupLabel: string
    groupIcon: string
    tags: TagItemDisplay[]
    isOptional: boolean
}

export interface TagItemDisplay {
    value: number
    label: string
    name: string
    isCategory: boolean
    isSubcategory: boolean
    bit: number
}

export interface UseTagFamilyDisplayOptions {
    familyName: 'status' | 'config' | 'rtags' | 'ttags' | 'ctags' | 'dtags'
    modelValue: Ref<number | null> | number | null
    groupSelection?: 'all' | 'core' | 'options'
    zoom?: Ref<boolean> | boolean
    locale?: string // Override i18n locale
}

export interface ZoomedBlock {
    icon: string
    groupLabel: string
    tags: string
}

export interface UseTagFamilyDisplayReturn {
    // Display data
    displayGroups: ComputedRef<TagDisplay[]>
    compactText: ComputedRef<string>
    zoomedText: ComputedRef<string>
    optionalTagsText: ComputedRef<string>
    zoomedBlocks: ComputedRef<ZoomedBlock[]>

    // Utilities
    getGroupDisplay: (groupName: string) => TagDisplay | null
    getTagsForGroup: (groupName: string) => TagItemDisplay[]
    formatGroupCompact: (groupName: string) => string
    formatGroupZoomed: (groupName: string) => string

    // State
    hasActiveTags: ComputedRef<boolean>
    isEmpty: ComputedRef<boolean>
    activeGroupCount: ComputedRef<number>
}

export function useTagFamilyDisplay(options: UseTagFamilyDisplayOptions): UseTagFamilyDisplayReturn {
    const { familyName, groupSelection = 'all', locale } = options

    // Normalize modelValue to ref
    const modelValueRef = computed(() => {
        const val = options.modelValue
        if (typeof val === 'object' && val !== null && 'value' in val) {
            return val.value
        }
        return val
    })

    // Get i18n composable
    const { language } = useI18n()
    const displayLocale = locale || language.value

    // Get tag family composable - pass the ref for reactivity
    const tagFamily = useTagFamily({
        familyName,
        modelValue: modelValueRef,  // Pass the computed ref, not the value
        groupSelection
    })

    const { getOptionsByFamily } = useSysregOptions()

    // Get display data for all groups
    const displayGroups = computed<TagDisplay[]>(() => {
        const result: TagDisplay[] = []
        const options = getOptionsByFamily(familyName)

        for (const group of tagFamily.groups.value) {
            const tags: TagItemDisplay[] = []

            // Get all tags for this group
            for (const option of options) {
                if (option.bit !== undefined && group.bits.includes(option.bit)) {
                    // Check if this tag is active
                    if (hasBit(modelValueRef.value ?? 0, option.bit)) {
                        tags.push({
                            value: normalizeToInteger(option.value),
                            label: getLocalizedLabel(option, displayLocale),
                            name: option.name,
                            isCategory: option.taglogic === 'category',
                            isSubcategory: option.taglogic === 'subcategory',
                            bit: option.bit
                        })
                    }
                }
            }

            // Only include group if it has active tags
            if (tags.length > 0) {
                result.push({
                    groupName: group.name,
                    groupLabel: getLocalizedLabel(group, displayLocale),
                    groupIcon: group.icon || '',
                    tags,
                    isOptional: group.optional || false
                })
            }
        }

        return result
    })

    // Get localized label from i18n object
    function getLocalizedLabel(item: any, locale: string): string {
        if (item.label) {
            // If label is already a string (pre-translated), use it
            if (typeof item.label === 'string') {
                return item.label
            }

            // If label is an i18n object, get the locale version
            if (typeof item.label === 'object') {
                return item.label[locale] || item.label.en || item.name || ''
            }
        }

        return item.name || ''
    }

    // Compact display text (short labels only, no icons)
    // Shows ONLY non-optional (core/required) groups normally
    // Falls back to showing optional groups if there are NO core groups
    // Icons are rendered separately as components in the tile
    // Shows the most specific selection: subcategory if selected, otherwise category
    const compactText = computed<string>(() => {
        const parts: string[] = []

        // Filter to only non-optional groups for compact text
        const coreGroups = displayGroups.value.filter(d => !d.isOptional)

        // If no core groups, fall back to optional groups (for 'options' groupSelection mode)
        const groupsToShow = coreGroups.length > 0 ? coreGroups : displayGroups.value.filter(d => d.isOptional)

        for (const display of groupsToShow) {
            // If there's a subcategory, show it (it already includes category context in its label)
            // Otherwise show the category
            // For toggles (neither category nor subcategory), show all of them
            const hasSubcategory = display.tags.some(tag => tag.isSubcategory)
            const hasCategory = display.tags.some(tag => tag.isCategory)

            const tagLabels = display.tags
                .filter(tag => {
                    if (hasSubcategory) return tag.isSubcategory
                    if (hasCategory) return tag.isCategory
                    // Neither category nor subcategory = toggles, show all
                    return true
                })
                .map(tag => tag.label)
                .join(', ')

            if (tagLabels) {
                parts.push(tagLabels)
            }
        }

        return parts.join(' • ')
    })

    // Zoomed display text (full labels with group headers)
    const zoomedText = computed<string>(() => {
        const parts: string[] = []

        for (const display of displayGroups.value) {
            const header = `${display.groupIcon || '📌'} ${display.groupLabel}`
            const tags = display.tags.map(tag => {
                const prefix = tag.isSubcategory ? '  • ' : '• '
                return `${prefix}${tag.label}`
            }).join('\n')

            parts.push(`${header}\n${tags}`)
        }

        return parts.join('\n\n')
    })

    // Optional tags text (for bottom row in compact view)
    // Only shown if there are ALSO core groups (otherwise optional is shown in compactText)
    const optionalTagsText = computed<string>(() => {
        const coreGroups = displayGroups.value.filter(d => !d.isOptional)
        const optionalGroups = displayGroups.value.filter(d => d.isOptional)

        // If there are no core groups, don't show optional in secondary area
        // (they'll be shown in the primary compactText area via fallback)
        if (coreGroups.length === 0) return ''
        if (optionalGroups.length === 0) return ''

        // Show optional groups with their most specific selection
        const parts: string[] = []
        for (const display of optionalGroups) {
            const hasSubcategory = display.tags.some(tag => tag.isSubcategory)
            const hasCategory = display.tags.some(tag => tag.isCategory)
            const tagLabels = display.tags
                .filter(tag => {
                    if (hasSubcategory) return tag.isSubcategory
                    if (hasCategory) return tag.isCategory
                    // Neither category nor subcategory = toggles, show all
                    return true
                })
                .map(tag => tag.label)
                .join(', ')
            if (tagLabels) {
                parts.push(tagLabels)
            }
        }
        return parts.join(', ')
    })

    // Zoomed blocks (for structured zoomed view)
    const zoomedBlocks = computed<ZoomedBlock[]>(() => {
        return displayGroups.value.map(display => ({
            icon: display.groupIcon || 'tag',
            groupLabel: display.groupLabel,
            tags: display.tags.map(tag => tag.label).join(', ')
        }))
    })

    // Check if empty (no active tags)
    const isEmpty = computed<boolean>(() => {
        return displayGroups.value.length === 0
    })

    // Get display for a specific group
    const getGroupDisplay = (groupName: string): TagDisplay | null => {
        return displayGroups.value.find((d: TagDisplay) => d.groupName === groupName) || null
    }

    // Get tags for a specific group
    const getTagsForGroup = (groupName: string): TagItemDisplay[] => {
        const display = getGroupDisplay(groupName)
        return display?.tags || []
    }

    // Format a group in compact mode
    const formatGroupCompact = (groupName: string): string => {
        const display = getGroupDisplay(groupName)
        if (!display) return ''

        const icon = display.groupIcon ? `${display.groupIcon} ` : ''
        const tagLabels = display.tags
            .filter((tag: TagItemDisplay) => tag.isCategory)
            .map((tag: TagItemDisplay) => tag.label)
            .join(', ')

        return tagLabels ? `${icon}${tagLabels}` : ''
    }

    // Format a group in zoomed mode
    const formatGroupZoomed = (groupName: string): string => {
        const display = getGroupDisplay(groupName)
        if (!display) return ''

        const header = `${display.groupIcon || '📌'} ${display.groupLabel}`
        const tags = display.tags.map((tag: TagItemDisplay) => {
            const prefix = tag.isSubcategory ? '  • ' : '• '
            return `${prefix}${tag.label}`
        }).join('\n')

        return `${header}\n${tags}`
    }

    // Check if there are any active tags
    const hasActiveTags = computed<boolean>(() => {
        return displayGroups.value.length > 0
    })

    // Count of active groups
    const activeGroupCount = computed<number>(() => {
        return displayGroups.value.length
    })

    return {
        // Display data
        displayGroups,
        compactText,
        zoomedText,
        optionalTagsText,
        zoomedBlocks,

        // Utilities
        getGroupDisplay,
        getTagsForGroup,
        formatGroupCompact,
        formatGroupZoomed,

        // State
        hasActiveTags,
        isEmpty,
        activeGroupCount
    }
}
