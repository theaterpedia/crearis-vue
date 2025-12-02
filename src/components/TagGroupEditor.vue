<template>
    <div class="tag-group-editor">
        <!-- Category selection -->
        <div v-if="hasCategories" class="tag-group-editor__categories">
            <div v-for="category in categories" :key="category.bit" class="tag-group-editor__option" :class="{
                'tag-group-editor__option--selected': isCategorySelected(category),
                'tag-group-editor__option--category': true
            }" @click="handleCategoryClick(category)">
                <div class="tag-group-editor__option-label">
                    {{ category.label }}
                </div>
                <div v-if="category.description" class="tag-group-editor__option-desc">
                    {{ category.description }}
                </div>
            </div>
        </div>

        <!-- Subcategory selection (shown only if category is selected) -->
        <div v-if="hasSubcategories && selectedCategory" class="tag-group-editor__subcategories">
            <div class="tag-group-editor__subcategories-header">
                Subcategories for {{ selectedCategory.label }}
            </div>
            <div v-for="subcategory in availableSubcategories" :key="subcategory.bit" class="tag-group-editor__option"
                :class="{
                    'tag-group-editor__option--selected': isSubcategorySelected(subcategory),
                    'tag-group-editor__option--subcategory': true
                }" @click="handleSubcategoryClick(subcategory)">
                <div class="tag-group-editor__option-label">
                    {{ subcategory.label }}
                </div>
                <div v-if="subcategory.description" class="tag-group-editor__option-desc">
                    {{ subcategory.description }}
                </div>
            </div>
        </div>

        <!-- Simple options (no category/subcategory logic) -->
        <div v-if="hasSimpleOptions" class="tag-group-editor__options">
            <div v-for="option in simpleOptions" :key="option.bit" class="tag-group-editor__option" :class="{
                'tag-group-editor__option--selected': isOptionSelected(option)
            }" @click="handleOptionClick(option)">
                <div class="tag-group-editor__option-label">
                    {{ option.label }}
                </div>
                <div v-if="option.description" class="tag-group-editor__option-desc">
                    {{ option.description }}
                </div>
            </div>
        </div>

        <!-- Clear button -->
        <div v-if="modelValue !== 0" class="tag-group-editor__clear">
            <button class="tag-group-editor__clear-btn" @click="handleClear">
                Clear Selection
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useSysregOptions } from '@/composables/useSysregOptions'
import type { SysregOption } from '@/composables/useSysregOptions'
import type { TagGroup } from '@/composables/useTagFamily'
import { normalizeToInteger, hasBit } from '@/composables/useSysregTags'

type FamilyName = 'status' | 'config' | 'rtags' | 'ttags' | 'ctags' | 'dtags'

export interface TagGroupEditorProps {
    familyName: FamilyName
    group: TagGroup
    modelValue: number
}

const props = defineProps<TagGroupEditorProps>()

const emit = defineEmits<{
    (e: 'update:modelValue', value: number): void
}>()

// Get options
const { getOptionsByFamily } = useSysregOptions()

// All options for this family
const allOptions = computed(() => getOptionsByFamily(props.familyName))

// Filter options for this group
const groupOptions = computed(() => {
    return allOptions.value.filter((opt: SysregOption) =>
        opt.bit !== undefined && props.group.bits.includes(opt.bit)
    )
})

// Categories
const categories = computed(() => {
    return groupOptions.value.filter((opt: SysregOption) => opt.taglogic === 'category')
})

const hasCategories = computed(() => categories.value.length > 0)

// Subcategories
const subcategories = computed(() => {
    return groupOptions.value.filter((opt: SysregOption) => opt.taglogic === 'subcategory')
})

const hasSubcategories = computed(() => subcategories.value.length > 0)

// Simple options (not category or subcategory)
const simpleOptions = computed(() => {
    return groupOptions.value.filter((opt: SysregOption) =>
        opt.taglogic !== 'category' && opt.taglogic !== 'subcategory'
    )
})

const hasSimpleOptions = computed(() => simpleOptions.value.length > 0)

// Selected category
const selectedCategory = computed(() => {
    return categories.value.find((cat: SysregOption) =>
        cat.bit !== undefined && hasBit(props.modelValue, cat.bit)
    ) || null
})

// Available subcategories (for selected category)
const availableSubcategories = computed(() => {
    if (!selectedCategory.value) return []

    const categoryName = selectedCategory.value.name
    return subcategories.value.filter((sub: SysregOption) => {
        // Match subcategories with same prefix as category
        return sub.name.startsWith(categoryName + '_')
    })
})

// Check if category is selected
function isCategorySelected(category: SysregOption): boolean {
    return category.bit !== undefined && hasBit(props.modelValue, category.bit)
}

// Check if subcategory is selected
function isSubcategorySelected(subcategory: SysregOption): boolean {
    return subcategory.bit !== undefined && hasBit(props.modelValue, subcategory.bit)
}

// Check if option is selected
function isOptionSelected(option: SysregOption): boolean {
    return option.bit !== undefined && hasBit(props.modelValue, option.bit)
}

// Handle category click
function handleCategoryClick(category: SysregOption) {
    if (category.bit === undefined) return

    let newValue = 0

    // If this category is already selected, deselect it
    if (isCategorySelected(category)) {
        newValue = 0
    } else {
        // Select this category (clear others in group first)
        newValue = 1 << category.bit
    }

    emit('update:modelValue', newValue)
}

// Handle subcategory click
function handleSubcategoryClick(subcategory: SysregOption) {
    if (subcategory.bit === undefined || !selectedCategory.value) return

    let newValue = props.modelValue

    // Toggle subcategory bit
    if (isSubcategorySelected(subcategory)) {
        // Deselect subcategory
        newValue = newValue & ~(1 << subcategory.bit)
    } else {
        // If not multiselect, clear other subcategories first
        if (!props.group.multiselect) {
            // Clear all subcategory bits
            for (const sub of availableSubcategories.value) {
                if (sub.bit !== undefined) {
                    newValue = newValue & ~(1 << sub.bit)
                }
            }
        }
        // Set subcategory bit
        newValue = newValue | (1 << subcategory.bit)
    }

    emit('update:modelValue', newValue)
}

// Handle simple option click
function handleOptionClick(option: SysregOption) {
    if (option.bit === undefined) return

    let newValue = props.modelValue

    // Toggle option bit
    if (isOptionSelected(option)) {
        // Deselect option
        newValue = newValue & ~(1 << option.bit)
    } else {
        // If not multiselect, clear other options first
        if (!props.group.multiselect) {
            // Clear all bits in this group
            for (const bit of props.group.bits) {
                newValue = newValue & ~(1 << bit)
            }
        }
        // Set option bit
        newValue = newValue | (1 << option.bit)
    }

    emit('update:modelValue', newValue)
}

// Handle clear
function handleClear() {
    emit('update:modelValue', 0)
}
</script>

<style scoped>
.tag-group-editor {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.tag-group-editor__categories,
.tag-group-editor__subcategories,
.tag-group-editor__options {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.tag-group-editor__subcategories-header {
    font-size: 13px;
    font-weight: 600;
    color: var(--color-text-secondary, #666666);
    margin-bottom: 4px;
}

.tag-group-editor__option {
    padding: 12px 14px;
    border: 2px solid var(--color-border, #e0e0e0);
    border-radius: 6px;
    background: var(--color-background, #ffffff);
    cursor: pointer;
    transition: all 0.2s ease;
}

.tag-group-editor__option:hover {
    border-color: var(--color-primary, #4a90e2);
    background: var(--color-background-hover, #f8f9fa);
}

.tag-group-editor__option--selected {
    border-color: var(--color-primary, #4a90e2);
    background: var(--color-primary-light, #e3f2fd);
}

.tag-group-editor__option--category {
    font-weight: 500;
}

.tag-group-editor__option--subcategory {
    margin-left: 20px;
    font-size: 14px;
}

.tag-group-editor__option-label {
    font-size: 14px;
    color: var(--color-text-primary, #333333);
    line-height: 1.4;
}

.tag-group-editor__option--selected .tag-group-editor__option-label {
    color: var(--color-primary, #4a90e2);
    font-weight: 600;
}

.tag-group-editor__option-desc {
    font-size: 12px;
    color: var(--color-text-muted, #999999);
    margin-top: 4px;
    line-height: 1.3;
}

.tag-group-editor__clear {
    display: flex;
    justify-content: flex-start;
}

.tag-group-editor__clear-btn {
    padding: 8px 16px;
    background: var(--color-background, #ffffff);
    border: 1px solid var(--color-border, #e0e0e0);
    border-radius: 6px;
    font-size: 13px;
    color: var(--color-text-secondary, #666666);
    cursor: pointer;
    transition: all 0.2s ease;
}

.tag-group-editor__clear-btn:hover {
    background: var(--color-background-hover, #f5f5f5);
    border-color: var(--color-danger, #e74c3c);
    color: var(--color-danger, #e74c3c);
}
</style>
