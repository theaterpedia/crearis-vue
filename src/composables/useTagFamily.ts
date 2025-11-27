/**
 * useTagFamily - Core composable for managing a single tag family's state
 * 
 * Provides:
 * - Load family configuration from sysreg-bitgroups.json
 * - Fetch sysreg entries for the family
 * - Parse current value into active tags per group
 * - Group-level operations (get, set, clear)
 * - Integration with useSysregTags for bit operations
 */

import { computed, ref, type ComputedRef, type Ref } from 'vue'
import { useSysregTags, normalizeToInteger } from './useSysregTags'
import { useSysregOptions } from './useSysregOptions'

// Import bitgroups config
// @ts-ignore - JSON import without resolveJsonModule flag
import bitgroupsConfigImport from '@/config/sysreg-bitgroups.json'
const bitgroupsConfig = bitgroupsConfigImport as any

export interface TagGroup {
    name: string
    label: Record<string, string>
    description: Record<string, string>
    icon: string
    bits: number[]
    optional: boolean
    multiselect: boolean
}

export interface TagFamilyConfig {
    name: string
    label: Record<string, string>
    description: Record<string, string>
    groups: TagGroup[]
}

export interface TagGroupSummary {
    groupName: string
    value: number
    label: string
    tags: string[]
}

export interface ActiveTag {
    groupName: string
    value: number
    label: string
    isCategory: boolean
}

export interface UseTagFamilyOptions {
    familyName: 'status' | 'config' | 'rtags' | 'ttags' | 'ctags' | 'dtags'
    modelValue: Ref<number | null> | number | null
    groupSelection?: 'core' | 'options' | 'all'
}

export interface UseTagFamilyReturn {
    // Configuration
    familyConfig: ComputedRef<TagFamilyConfig | null>
    groups: ComputedRef<TagGroup[]>

    // Current state
    activeGroups: ComputedRef<TagGroupSummary[]>
    activeTags: ComputedRef<ActiveTag[]>
    isEmpty: ComputedRef<boolean>

    // Group operations
    getGroupValue: (groupName: string) => number
    setGroupValue: (groupName: string, value: number) => void
    clearGroup: (groupName: string) => void
    hasActiveGroup: (groupName: string) => boolean

    // Tag operations
    getTagLabel: (tagValue: number) => string
    getTagsByGroup: (groupName: string) => any[]

    // Value management
    updateValue: (newValue: number) => void
    currentValue: Ref<number>
}

export function useTagFamily(options: UseTagFamilyOptions): UseTagFamilyReturn {
    const { familyName, modelValue, groupSelection = 'all' } = options

    // Convert modelValue to ref if it's not already
    const valueRef = ref(typeof modelValue === 'object' && 'value' in modelValue ? modelValue.value : modelValue)

    // Get bit operation functions
    const { hasBit, setBit, clearBit } = useSysregTags()

    // Get tag options
    const { getOptionByValue, getOptionsByFamily } = useSysregOptions()

    // Load family configuration
    const familyConfig = computed<TagFamilyConfig | null>(() => {
        const config = (bitgroupsConfig as any)[familyName]
        if (!config) return null

        return {
            name: config.name || familyName,
            label: config.label || { en: familyName, de: familyName },
            description: config.description || { en: '', de: '' },
            groups: config.groups || []
        }
    })

    // Filter groups by selection
    const groups = computed<TagGroup[]>(() => {
        if (!familyConfig.value) return []

        const allGroups = familyConfig.value.groups

        if (groupSelection === 'core') {
            return allGroups.filter((g: TagGroup) => !g.optional)
        } else if (groupSelection === 'options') {
            return allGroups.filter((g: TagGroup) => g.optional)
        }

        return allGroups
    })

    // Current value management
    const currentValue = computed({
        get: () => valueRef.value ?? 0,
        set: (val: number) => {
            valueRef.value = val
        }
    })

    // Get value for a specific group
    const getGroupValue = (groupName: string): number => {
        const group = groups.value.find((g: TagGroup) => g.name === groupName)
        if (!group || currentValue.value === null) return 0

        let groupVal = 0
        for (const bit of group.bits) {
            if (hasBit(currentValue.value, bit)) {
                groupVal |= (1 << (bit - group.bits[0]))
            }
        }

        return groupVal
    }

    // Set value for a specific group
    const setGroupValue = (groupName: string, value: number): void => {
        const group = groups.value.find((g: TagGroup) => g.name === groupName)
        if (!group) return

        let newVal = currentValue.value

        // Clear all bits in this group first
        for (const bit of group.bits) {
            newVal = clearBit(newVal, bit)
        }

        // Set new bits
        for (let i = 0; i < group.bits.length; i++) {
            if ((value >> i) & 1) {
                newVal = setBit(newVal, group.bits[i])
            }
        }

        updateValue(newVal)
    }

    // Clear a group
    const clearGroup = (groupName: string): void => {
        setGroupValue(groupName, 0)
    }

    // Check if group has active tags
    const hasActiveGroup = (groupName: string): boolean => {
        return getGroupValue(groupName) > 0
    }

    // Get all active groups with their tags
    const activeGroups = computed<TagGroupSummary[]>(() => {
        const result: TagGroupSummary[] = []

        for (const group of groups.value) {
            const groupVal = getGroupValue(group.name)
            if (groupVal > 0) {
                const tags = getTagsByGroup(group.name)
                    .filter(tag => {
                        const tagVal = tag.value
                        // Check if this tag matches the group value
                        return (tagVal & ((1 << group.bits.length) - 1)) === groupVal
                    })
                    .map(tag => tag.name_i18n?.en || tag.name)

                result.push({
                    groupName: group.name,
                    value: groupVal,
                    label: group.label.en || group.name,
                    tags
                })
            }
        }

        return result
    })

    // Get all active tags
    const activeTags = computed<ActiveTag[]>(() => {
        const result: ActiveTag[] = []
        const allOptions = getOptionsByFamily(familyName)

        for (const option of allOptions) {
            if (option.bit !== undefined && hasBit(currentValue.value, option.bit)) {
                result.push({
                    groupName: '', // Would need group detection logic
                    value: normalizeToInteger(option.value),
                    label: option.label,
                    isCategory: option.taglogic === 'category'
                })
            }
        }

        return result
    })

    // Check if no tags are set
    const isEmpty = computed<boolean>(() => {
        return currentValue.value === 0 || currentValue.value === null
    })

    // Get label for a tag value
    const getTagLabel = (tagValue: number): string => {
        const allOptions = getOptionsByFamily(familyName)
        // Find option by integer value
        const option = allOptions.find((opt: any) => opt.value === tagValue)
        return option?.label || ''
    }

    // Get all tags for a group
    const getTagsByGroup = (groupName: string): any[] => {
        const allOptions = getOptionsByFamily(familyName)
        const group = groups.value.find((g: TagGroup) => g.name === groupName)

        if (!group) return []

        // Filter tags that fall within this group's bit range
        const minBit = Math.min(...group.bits)
        const maxBit = Math.max(...group.bits)

        return allOptions.filter(opt => {
            if (!opt.bit) return false
            return opt.bit >= minBit && opt.bit <= maxBit
        })
    }

    // Update value
    const updateValue = (newValue: number): void => {
        valueRef.value = newValue
        if (typeof modelValue === 'object' && 'value' in modelValue) {
            (modelValue as Ref<number>).value = newValue
        }
    }

    return {
        familyConfig,
        groups,
        activeGroups,
        activeTags,
        isEmpty,
        getGroupValue,
        setGroupValue,
        clearGroup,
        hasActiveGroup,
        getTagLabel,
        getTagsByGroup,
        updateValue,
        currentValue
    }
}
