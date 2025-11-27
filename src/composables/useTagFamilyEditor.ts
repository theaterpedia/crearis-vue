/**
 * useTagFamilyEditor - Composable for editing tag family values
 * 
 * Provides:
 * - Separate editing state (editValue) from model value
 * - Category → subcategory transition logic
 * - Multi-select validation for groups
 * - Save/cancel/reset operations
 * - Dirty state tracking
 */

import { computed, ref, watch, type Ref } from 'vue'
import { useTagFamily } from './useTagFamily'
import { useSysregOptions } from './useSysregOptions'
import type { SysregOption } from './useSysregOptions'
import { normalizeToInteger, hasBit, setBit, clearBit } from './useSysregTags'
import type { TagGroup } from './useTagFamily'

export interface UseTagFamilyEditorOptions {
    familyName: 'status' | 'config' | 'rtags' | 'ttags' | 'ctags' | 'dtags'
    modelValue: Ref<number> | number
    groupSelection?: 'all' | 'core' | 'options'
    autoSave?: boolean // Auto-save on every change
}

export interface UseTagFamilyEditorReturn {
    // State
    editValue: Ref<number>
    isDirty: Ref<boolean>
    isValid: Ref<boolean>

    // Tag family data
    familyConfig: ReturnType<typeof useTagFamily>['familyConfig']
    groups: ReturnType<typeof useTagFamily>['groups']

    // Group operations
    getGroupValue: (groupName: string) => number
    setGroupValue: (groupName: string, value: number) => void
    clearGroup: (groupName: string) => void
    toggleTag: (groupName: string, tagValue: number) => void

    // Category/subcategory logic
    selectCategory: (groupName: string, categoryValue: number) => void
    selectSubcategory: (groupName: string, subcategoryValue: number) => void
    getCategoryForSubcategory: (groupName: string, subcategoryValue: number) => SysregOption | null

    // Edit operations
    save: () => void
    cancel: () => void
    reset: () => void

    // Validation
    validateGroup: (groupName: string) => boolean
    getValidationErrors: () => string[]
}

export function useTagFamilyEditor(options: UseTagFamilyEditorOptions): UseTagFamilyEditorReturn {
    const { familyName, modelValue, groupSelection = 'all', autoSave = false } = options

    // Convert to ref if needed
    const modelValueRef = ref(typeof modelValue === 'number' ? modelValue : modelValue.value)

    // Editing state (separate from model)
    const editValue = ref(modelValueRef.value)

    // Get tag family composable
    const tagFamily = useTagFamily({
        familyName,
        modelValue: editValue,
        groupSelection
    })

    const { getOptionsByFamily, getOptionByValue } = useSysregOptions()

    // Watch model value changes
    watch(() => typeof modelValue === 'number' ? modelValue : modelValue.value, (newVal) => {
        modelValueRef.value = newVal
        if (!isDirty.value) {
            editValue.value = newVal
        }
    })

    // Dirty state
    const isDirty = computed(() => {
        return editValue.value !== modelValueRef.value
    })

    // Get value for a specific group from edit state
    const getGroupValue = (groupName: string): number => {
        const group = tagFamily.groups.value.find((g: TagGroup) => g.name === groupName)
        if (!group) return 0

        let groupVal = 0
        for (const bit of group.bits) {
            if (hasBit(editValue.value, bit)) {
                groupVal |= (1 << (bit - group.bits[0]))
            }
        }

        return groupVal
    }

    // Set value for a specific group in edit state
    const setGroupValue = (groupName: string, value: number): void => {
        const group = tagFamily.groups.value.find((g: TagGroup) => g.name === groupName)
        if (!group) return

        let newVal = editValue.value

        // Clear all bits in this group first
        for (const bit of group.bits) {
            newVal = clearBit(newVal, bit)
        }

        // Set new bits based on value
        for (let i = 0; i < group.bits.length; i++) {
            if ((value >> i) & 1) {
                newVal = setBit(newVal, group.bits[i])
            }
        }

        editValue.value = newVal

        if (autoSave) {
            save()
        }
    }

    // Clear all bits for a specific group
    const clearGroup = (groupName: string): void => {
        const group = tagFamily.groups.value.find((g: TagGroup) => g.name === groupName)
        if (!group) return

        let newVal = editValue.value
        for (const bit of group.bits) {
            newVal = clearBit(newVal, bit)
        }

        editValue.value = newVal

        if (autoSave) {
            save()
        }
    }

    // Toggle a tag in a group (for multi-select groups)
    const toggleTag = (groupName: string, tagValue: number): void => {
        const group = tagFamily.groups.value.find((g: TagGroup) => g.name === groupName)
        if (!group) return

        // Find the option for this tag value
        const options = getOptionsByFamily(familyName)
        const option = options.find((opt: SysregOption) => {
            const optValue = normalizeToInteger(opt.value)
            return optValue === tagValue && opt.bit !== undefined && group.bits.includes(opt.bit)
        })

        if (!option || option.bit === undefined) return

        // Toggle the bit
        let newVal = editValue.value
        if (hasBit(newVal, option.bit)) {
            newVal = clearBit(newVal, option.bit)
        } else {
            // If not multiselect, clear other bits in group first
            if (!group.multiselect) {
                for (const bit of group.bits) {
                    newVal = clearBit(newVal, bit)
                }
            }
            newVal = setBit(newVal, option.bit)
        }

        editValue.value = newVal

        if (autoSave) {
            save()
        }
    }

    // Select a category (clears subcategories)
    const selectCategory = (groupName: string, categoryValue: number): void => {
        const group = tagFamily.groups.value.find((g: TagGroup) => g.name === groupName)
        if (!group) return

        const options = getOptionsByFamily(familyName)
        const category = options.find((opt: SysregOption) => {
            const optValue = normalizeToInteger(opt.value)
            return optValue === categoryValue &&
                opt.taglogic === 'category' &&
                opt.bit !== undefined &&
                group.bits.includes(opt.bit)
        })

        if (!category || category.bit === undefined) return

        let newVal = editValue.value

        // Clear all bits in this group
        for (const bit of group.bits) {
            newVal = clearBit(newVal, bit)
        }

        // Set category bit
        newVal = setBit(newVal, category.bit)

        editValue.value = newVal

        if (autoSave) {
            save()
        }
    }

    // Select a subcategory (ensures parent category is set)
    const selectSubcategory = (groupName: string, subcategoryValue: number): void => {
        const group = tagFamily.groups.value.find((g: TagGroup) => g.name === groupName)
        if (!group) return

        const options = getOptionsByFamily(familyName)
        const subcategory = options.find((opt: SysregOption) => {
            const optValue = normalizeToInteger(opt.value)
            return optValue === subcategoryValue &&
                opt.taglogic === 'subcategory' &&
                opt.bit !== undefined &&
                group.bits.includes(opt.bit)
        })

        if (!subcategory || subcategory.bit === undefined) return

        // Find parent category
        const parentCategory = getCategoryForSubcategory(groupName, subcategoryValue)
        if (!parentCategory || parentCategory.bit === undefined) return

        let newVal = editValue.value

        // Clear all bits in this group
        for (const bit of group.bits) {
            newVal = clearBit(newVal, bit)
        }

        // Set parent category bit
        newVal = setBit(newVal, parentCategory.bit)

        // Set subcategory bit
        newVal = setBit(newVal, subcategory.bit)

        editValue.value = newVal

        if (autoSave) {
            save()
        }
    }

    // Get parent category for a subcategory
    const getCategoryForSubcategory = (groupName: string, subcategoryValue: number): SysregOption | null => {
        const options = getOptionsByFamily(familyName)
        const subcategory = options.find((opt: SysregOption) => {
            const optValue = normalizeToInteger(opt.value)
            return optValue === subcategoryValue && opt.taglogic === 'subcategory'
        })

        if (!subcategory) return null

        // Find category with same name prefix (before underscore)
        const subcategoryName = subcategory.name
        const categoryPrefix = subcategoryName.split('_')[0]

        const category = options.find((opt: SysregOption) =>
            opt.taglogic === 'category' &&
            opt.name === categoryPrefix
        )

        return category || null
    }

    // Validate a group
    const validateGroup = (groupName: string): boolean => {
        const group = tagFamily.groups.value.find((g: TagGroup) => g.name === groupName)
        if (!group) return true

        // If group is optional and empty, that's valid
        if (group.optional && !hasActiveGroup(groupName)) {
            return true
        }

        // If group is not optional and empty, that's invalid
        if (!group.optional && !hasActiveGroup(groupName)) {
            return false
        }

        // Check category/subcategory consistency
        const options = getOptionsByFamily(familyName)
        const groupOptions = options.filter((opt: SysregOption) =>
            opt.bit !== undefined && group.bits.includes(opt.bit)
        )

        let hasCategory = false
        let hasSubcategory = false

        for (const option of groupOptions) {
            if (option.bit !== undefined && hasBit(editValue.value, option.bit)) {
                if (option.taglogic === 'category') {
                    hasCategory = true
                } else if (option.taglogic === 'subcategory') {
                    hasSubcategory = true
                }
            }
        }

        // If has subcategory, must have category
        if (hasSubcategory && !hasCategory) {
            return false
        }

        return true
    }

    // Check if a group has any active tags
    const hasActiveGroup = (groupName: string): boolean => {
        const group = tagFamily.groups.value.find((g: TagGroup) => g.name === groupName)
        if (!group) return false

        for (const bit of group.bits) {
            if (hasBit(editValue.value, bit)) {
                return true
            }
        }

        return false
    }

    // Get all validation errors
    const getValidationErrors = (): string[] => {
        const errors: string[] = []

        for (const group of tagFamily.groups.value) {
            if (!validateGroup(group.name)) {
                if (!group.optional && !hasActiveGroup(group.name)) {
                    errors.push(`${group.label.en || group.name} is required`)
                } else {
                    errors.push(`${group.label.en || group.name} has invalid selection`)
                }
            }
        }

        return errors
    }

    // Validation state
    const isValid = computed(() => {
        return getValidationErrors().length === 0
    })

    // Save changes to model
    const save = (): void => {
        if (!isValid.value) {
            console.warn('Cannot save: validation errors exist')
            return
        }

        modelValueRef.value = editValue.value

        // Update original ref if it's a ref
        if (typeof modelValue !== 'number' && 'value' in modelValue) {
            modelValue.value = editValue.value
        }
    }

    // Cancel editing (revert to model value)
    const cancel = (): void => {
        editValue.value = modelValueRef.value
    }

    // Reset to zero
    const reset = (): void => {
        editValue.value = 0

        if (autoSave) {
            save()
        }
    }

    return {
        // State
        editValue,
        isDirty,
        isValid,

        // Tag family data
        familyConfig: tagFamily.familyConfig,
        groups: tagFamily.groups,

        // Group operations
        getGroupValue,
        setGroupValue,
        clearGroup,
        toggleTag,

        // Category/subcategory logic
        selectCategory,
        selectSubcategory,
        getCategoryForSubcategory,

        // Edit operations
        save,
        cancel,
        reset,

        // Validation
        validateGroup,
        getValidationErrors
    }
}
