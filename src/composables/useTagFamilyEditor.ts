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

import { computed, ref, watch, isRef, isReadonly, type Ref } from 'vue'
import { useTagFamily } from './useTagFamily'
import { useSysregOptions } from './useSysregOptions'
import type { SysregOption } from './useSysregOptions'
import { normalizeToInteger, hasBit, setBit, clearBit } from './useSysregTags'
import type { TagGroup } from './useTagFamily'

/**
 * Validation error for tag naming conventions
 */
export interface TagNamingError {
    tagName: string
    categoryName: string
    expectedPrefix: string
    message: string
}

export interface UseTagFamilyEditorOptions {
    familyName: 'status' | 'config' | 'rtags' | 'ttags' | 'ctags' | 'dtags'
    modelValue: Ref<number> | number
    groupSelection?: 'all' | 'core' | 'options'
    autoSave?: boolean // Auto-save on every change
}

export interface UseTagFamilyEditorReturn {
    // State
    editValue: Ref<number>
    editingValue: Ref<number> // Alias for editValue
    isDirty: Ref<boolean>
    isValid: Ref<boolean>

    // Tag family data
    familyConfig: ReturnType<typeof useTagFamily>['familyConfig']
    groups: ReturnType<typeof useTagFamily>['groups']
    activeGroupNames: Ref<string[]>
    inactiveGroupNames: Ref<string[]>

    // Group operations
    getGroupValue: (groupName: string) => number
    setGroupValue: (groupName: string, value: number) => void
    updateGroup: (groupName: string, value: number) => void // Alias for setGroupValue
    clearGroup: (groupName: string) => void
    addGroup: (groupName: string) => void
    removeGroup: (groupName: string) => void
    toggleTag: (groupName: string, tagValue: number) => void

    // Category/subcategory logic
    selectCategory: (groupName: string, categoryValue: number) => void
    selectSubcategory: (groupName: string, subcategoryValue: number) => void
    getCategoryForSubcategory: (groupName: string, subcategoryValue: number) => SysregOption | null

    // Edit operations
    save: () => number
    cancel: () => void
    reset: () => void

    // Validation
    validateGroup: (groupName: string) => boolean
    getValidationErrors: () => string[]

    // Naming convention validation
    namingErrors: Ref<TagNamingError[]>
    hasNamingErrors: Ref<boolean>
}

export function useTagFamilyEditor(options: UseTagFamilyEditorOptions): UseTagFamilyEditorReturn {
    const { familyName, modelValue, groupSelection = 'all', autoSave = false } = options

    // Check if modelValue is a writable ref
    const isWritableRef = isRef(modelValue) && !isReadonly(modelValue)

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

    // Naming convention validation state
    const namingErrors = ref<TagNamingError[]>([])
    const hasNamingErrors = computed(() => namingErrors.value.length > 0)

    // Dirty state - computed from edit vs model values
    const isDirty = computed(() => editValue.value !== modelValueRef.value)

    // Watch model value changes
    watch(() => typeof modelValue === 'number' ? modelValue : modelValue.value, (newVal: number) => {
        modelValueRef.value = newVal
        // Don't auto-update editValue if user is editing (dirty)
        if (!isDirty.value) {
            editValue.value = newVal
        }
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

        // PRIMARY: Use parent_bit field (Migration 037 structure)
        let category: SysregOption | null = null

        if (subcategory.parent_bit !== undefined) {
            category = options.find((opt: SysregOption) =>
                opt.bit === subcategory.parent_bit &&
                opt.taglogic === 'category'
            ) || null
        }

        // VALIDATION: Check naming convention (subcategory should start with category name)
        if (category && subcategory.name && category.name) {
            const expectedPrefix = category.name
            const subcategoryName = subcategory.name

            // Naming convention: subcategory should be "category_something"
            if (!subcategoryName.startsWith(expectedPrefix + '_')) {
                // User error: naming convention violated
                const error: TagNamingError = {
                    tagName: subcategoryName,
                    categoryName: category.name,
                    expectedPrefix: expectedPrefix,
                    message: `Tag ${subcategoryName} muss umbenannt werden: ${category.name} > ${subcategoryName.split('_').pop() || subcategoryName}`
                }

                // Add to naming errors if not already present
                if (!namingErrors.value.find((e: TagNamingError) => e.tagName === subcategoryName)) {
                    namingErrors.value.push(error)
                }
            }
        }

        return category
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

        // With 2-bit/3-bit category encoding, when a subcategory is selected,
        // the category bit itself may not be set (e.g., subcategory value 4 = bit 2 only).
        // The encoding is: 1=category, 2+=subcategories within the category slot.
        // So if ANY bit in a category's slot is set, that category slot is active.
        // We don't need to validate category/subcategory consistency because
        // the encoding inherently represents either "category only" or "specific subcategory".
        // Both are valid selections.

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
            // Only validate groups that have active selections
            // (Don't require non-optional groups to be filled - allow partial editing)
            if (hasActiveGroup(group.name) && !validateGroup(group.name)) {
                errors.push(`${group.label.en || group.name} has invalid selection`)
            }
        }

        return errors
    }

    // Validation state
    const isValid = computed(() => {
        return getValidationErrors().length === 0
    })

    // Computed: Active group names (groups with at least one active bit)
    const activeGroupNames = computed<string[]>(() => {
        return tagFamily.groups.value
            .filter((group: TagGroup) => hasActiveGroup(group.name))
            .map((group: TagGroup) => group.name)
    })

    // Computed: Inactive group names (groups with no active bits)
    const inactiveGroupNames = computed<string[]>(() => {
        return tagFamily.groups.value
            .filter((group: TagGroup) => !hasActiveGroup(group.name))
            .map((group: TagGroup) => group.name)
    })

    // Add a group (activate it with default/first tag)
    const addGroup = (groupName: string): void => {
        const group = tagFamily.groups.value.find((g: TagGroup) => g.name === groupName)
        if (!group || group.bits.length === 0) return

        // Set first bit in the group
        let newVal = editValue.value
        newVal = setBit(newVal, group.bits[0])
        editValue.value = newVal

        if (autoSave) {
            save()
        }
    }

    // Remove a group (clear all its bits)
    const removeGroup = (groupName: string): void => {
        clearGroup(groupName)
    }

    // Save changes to model and return the new value
    const saveAndReturn = (): number => {
        if (!isValid.value) {
            const errors = getValidationErrors()
            console.warn('Cannot save: validation errors exist', errors)
            return modelValueRef.value
        }

        // Update our internal tracking ref
        modelValueRef.value = editValue.value

        // Only try to update the original ref if it's a writable ref
        if (isWritableRef && 'value' in modelValue) {
            (modelValue as Ref<number>).value = editValue.value
        }

        return editValue.value
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
        editingValue: editValue, // Alias
        isDirty,
        isValid,

        // Tag family data
        familyConfig: tagFamily.familyConfig,
        groups: tagFamily.groups,
        activeGroupNames,
        inactiveGroupNames,

        // Group operations
        getGroupValue,
        setGroupValue,
        updateGroup: setGroupValue, // Alias
        clearGroup,
        addGroup,
        removeGroup,
        toggleTag,

        // Category/subcategory logic
        selectCategory,
        selectSubcategory,
        getCategoryForSubcategory,

        // Edit operations
        save: saveAndReturn,
        cancel,
        reset,

        // Validation
        validateGroup,
        getValidationErrors,

        // Naming convention validation
        namingErrors,
        hasNamingErrors
    }
}
