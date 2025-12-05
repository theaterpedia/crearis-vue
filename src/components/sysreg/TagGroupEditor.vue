<template>
    <div class="tag-group-editor">
        <div class="group-header">
            <component :is="displayIcon" class="group-icon" :size="24" />
            <div class="group-info">
                <h4 class="group-label">{{ getLabel(group.label) }}</h4>
                <p v-if="group.description" class="group-description">
                    {{ getLabel(group.description) }}
                </p>
            </div>
            <!-- Clear button (x) to deselect all -->
            <button v-if="hasSelection" class="clear-button" @click="clearSelection" title="Clear selection">
                <XIcon :size="16" />
            </button>
        </div>

        <div class="group-controls">
            <!-- Category selection (2-bit encoding: category + subcategories) -->
            <div v-if="categories.length > 0" class="category-controls">
                <!-- Horizontal buttons for ≤4 categories -->
                <div v-if="categories.length <= 4" class="category-buttons">
                    <button v-for="cat in categories" :key="cat.value" class="category-button"
                        :class="{ active: selectedCategory === cat.value }" @click="selectCategory(cat.value)">
                        {{ getTagLabel(cat) }}
                    </button>
                </div>

                <!-- Dropdown for 5+ categories -->
                <select v-else class="category-select" :value="selectedCategory"
                    @change="selectCategory(Number(($event.target as HTMLSelectElement).value))">
                    <option :value="0">Select category...</option>
                    <option v-for="cat in categories" :key="cat.value" :value="cat.value">
                        {{ getTagLabel(cat) }}
                    </option>
                </select>

                <!-- Subcategory selection (if category selected) -->
                <div v-if="selectedCategory && availableSubcategories.length > 0" class="subcategory-controls">
                    <span class="subcategory-separator">&gt;</span>
                    <div v-if="availableSubcategories.length <= 4" class="subcategory-buttons">
                        <button v-for="sub in availableSubcategories" :key="sub.value" class="subcategory-button"
                            :class="{ active: selectedSubcategory === sub.value }"
                            @click="selectSubcategory(sub.value)">
                            {{ getSubcategoryLabel(sub) }}
                        </button>
                    </div>
                    <select v-else class="subcategory-select" :value="selectedSubcategory"
                        @change="selectSubcategory(Number(($event.target as HTMLSelectElement).value))">
                        <option :value="0">Select subcategory...</option>
                        <option v-for="sub in availableSubcategories" :key="sub.value" :value="sub.value">
                            {{ getSubcategoryLabel(sub) }}
                        </option>
                    </select>
                </div>
            </div>

            <!-- Toggle controls (for multiselect groups) -->
            <div v-else-if="toggles.length > 0" class="toggle-controls">
                <button v-for="toggle in toggles" :key="toggle.value" class="toggle-button"
                    :class="{ active: hasToggle(toggle.value) }" @click="toggleOption(toggle.value)">
                    {{ getTagLabel(toggle) }}
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useSysregOptions } from '@/composables/useSysregOptions'
import type { TagGroup } from '@/composables/useTagFamily'
import { UsersRound, Sparkles, Theater, Clapperboard, Tag, X as XIcon } from 'lucide-vue-next'
import type { LucideIcon } from 'lucide-vue-next'

const props = defineProps<{
    group: TagGroup
    modelValue: number
    familyName: string
}>()

const emit = defineEmits<{
    'update:modelValue': [value: number]
}>()

const { getOptionsByFamily } = useSysregOptions()

// Simple locale - default to 'de'
const locale = 'de'

// Icon name to lucide component mapping
const iconMap: Record<string, LucideIcon> = {
    'users-round': UsersRound,
    'sparkles': Sparkles,
    'theater': Theater,
    'clapperboard': Clapperboard,
    'tag': Tag,
    'default': Tag
}

const displayIcon = computed(() => {
    return iconMap[props.group.icon] || iconMap['default']
})

// Get all tags for this family
const allTags = computed(() => {
    return getOptionsByFamily(props.familyName)
})

// Filter tags by group bits
// Tags use 2-bit encoding per category (values 0-3 within each 2-bit group)
// Categories have power-of-2 values, subcategories have parent_bit pointing to category
const groupTags = computed(() => {
    const filtered = allTags.value.filter((tag: any) => {
        // Skip if value is 0 or invalid
        if (!tag.value || tag.value === 0) return false

        // For subcategories: check if parent_bit is in group's bit range
        if (tag.taglogic === 'subcategory' && tag.parent_bit !== null && tag.parent_bit !== undefined) {
            return props.group.bits.includes(tag.parent_bit)
        }

        // For categories: check if bit position (log2 of value) is in group's bit range
        const bitPos = Math.log2(tag.value)
        // Only valid if bitPos is an integer (power-of-2 value)
        if (!Number.isInteger(bitPos)) {
            return false
        }

        return props.group.bits.includes(bitPos)
    })
    return filtered
})

// Separate categories and subcategories
const categories = computed(() => {
    return groupTags.value.filter((tag: any) =>
        tag.taglogic === 'category' && !tag.name.includes('>')
    )
})

const subcategories = computed(() => {
    return groupTags.value.filter((tag: any) =>
        tag.taglogic === 'subcategory'
    )
    return subs
})

const toggles = computed(() => {
    return groupTags.value.filter((tag: any) =>
        tag.taglogic === 'toggle'
    )
})

// Calculate bit width needed for a category (based on subcategory count)
// 0 subs = 1 bit (just the category)
// 1-2 subs = 2 bits (0=empty, 1=cat, 2-3=subs)
// 3-6 subs = 3 bits (0=empty, 1=cat, 2-7=subs)
function getCategoryBitWidth(categoryValue: number): number {
    const catBitPos = Math.log2(categoryValue)
    const subsForCat = subcategories.value.filter((s: any) => s.parent_bit === catBitPos)
    const subCount = subsForCat.length
    if (subCount === 0) return 1
    if (subCount <= 2) return 2
    return 3 // up to 6 subcategories
}

// Create a bit mask for a category's slot
function getCategoryMask(categoryValue: number): number {
    const catBitPos = Math.log2(categoryValue)
    const relativeBitPos = catBitPos - props.group.bits[0]
    const bitWidth = getCategoryBitWidth(categoryValue)
    return ((1 << bitWidth) - 1) << relativeBitPos
}

// Current selections
// NOTE: modelValue is RELATIVE to the group (already shifted by getGroupValue in useTagFamilyEditor)
// So for animiertes_theaterspiel with bits [8,9,10,11,12,13,14]:
// - If bit 8 is set in entity, modelValue = 1 (shifted by 8)
// - If bit 10 is set, modelValue = 4 (1 << (10-8))
const selectedCategory = computed(() => {
    // Find which category is selected based on current relative value
    for (const cat of categories.value) {
        // Get the category's bit position (absolute)
        const catBitPos = Math.log2(cat.value)
        if (!Number.isInteger(catBitPos)) continue

        // Convert to relative position within group
        const relativeBitPos = catBitPos - props.group.bits[0]

        // Create mask based on actual bit width for this category
        const mask = getCategoryMask(cat.value)
        // Extract the value at this position from modelValue (which is already relative)
        const extractedValue = props.modelValue & mask

        // If extracted value is non-zero, this category slot is active
        if (extractedValue !== 0) {
            return cat.value
        }
    }
    return 0
})

const selectedSubcategory = computed(() => {
    if (!selectedCategory.value) return 0

    // Find the category's absolute bit position
    const catBitPos = Math.log2(selectedCategory.value)
    if (!Number.isInteger(catBitPos)) return 0

    // Convert to relative position
    const relativeBitPos = catBitPos - props.group.bits[0]

    // Create mask based on actual bit width for this category
    const mask = getCategoryMask(selectedCategory.value)
    // Extract the actual relative value stored in modelValue for this slot
    const extractedRelativeValue = props.modelValue & mask

    // Convert back to absolute value for comparison with subcategory values
    // The extracted relative value needs to be shifted back to absolute
    const extractedAbsoluteValue = extractedRelativeValue << props.group.bits[0]

    // Find which subcategory matches this extracted absolute value
    for (const sub of availableSubcategories.value) {
        if (sub.value === extractedAbsoluteValue) {
            return sub.value
        }
    }

    return 0
})

// Get filtered subcategories for the selected category
const availableSubcategories = computed(() => {
    if (!selectedCategory.value) {
        return []
    }

    const parentBit = Math.log2(selectedCategory.value)
    return subcategories.value.filter((s: any) => s.parent_bit === parentBit)
})

// Helper functions
// NOTE: modelValue is RELATIVE to group (shifted by group.bits[0])
function hasBit(relativeBit: number): boolean {
    return (props.modelValue & (1 << relativeBit)) !== 0
}

function setBits(relativeBits: number[]): number {
    let value = props.modelValue
    relativeBits.forEach(bit => {
        value |= (1 << bit)
    })
    return value
}

// Clear all bits in the group's range (working with relative modelValue)
function clearGroupBits(): number {
    // modelValue is relative, so we clear bits 0 to (group.bits.length - 1)
    let value = props.modelValue
    for (let i = 0; i < props.group.bits.length; i++) {
        value &= ~(1 << i)
    }
    return value
}

// Convert absolute tag value to relative value for this group
function toRelativeValue(absoluteValue: number): number {
    // absoluteValue is like 256 (bit 8 set)
    // We need to shift it down by the group's starting bit
    return absoluteValue >> props.group.bits[0]
}

function hasToggle(tagValue: number): boolean {
    const relativeBitPos = Math.log2(tagValue) - props.group.bits[0]
    return hasBit(relativeBitPos)
}

function getLabel(labels: Record<string, string>): string {
    return labels[locale] || labels['en'] || labels['de'] || Object.values(labels)[0] || ''
}

function getTagLabel(tag: any): string {
    if (tag.name_i18n) {
        return getLabel(tag.name_i18n)
    }
    return tag.name
}

function getSubcategoryLabel(tag: any): string {
    const label = getTagLabel(tag)

    // Handle both formats:
    // 1. "category > subcategory" (with separator)
    // 2. "category_subcategory" (with underscore)

    if (label.includes(' > ')) {
        const parts = label.split(' > ')
        return parts[1]?.trim() || label
    } else if (label.includes('_')) {
        // Extract subcategory part after underscore
        const parts = label.split('_')
        return parts.slice(1).join('_') // Join remaining parts in case of multiple underscores
    }

    return label
}

// Actions
function selectCategory(absoluteValue: number) {
    if (absoluteValue === 0) {
        // Clear all group bits
        emit('update:modelValue', clearGroupBits())
    } else {
        // Convert absolute value to relative and set it
        const relativeValue = toRelativeValue(absoluteValue)
        let newValue = clearGroupBits()
        newValue |= relativeValue
        emit('update:modelValue', newValue)
    }
}

function selectSubcategory(absoluteValue: number) {
    if (absoluteValue === 0) return

    // Convert absolute value to relative and set it
    const relativeValue = toRelativeValue(absoluteValue)
    let newValue = clearGroupBits()
    newValue |= relativeValue
    emit('update:modelValue', newValue)
    emit('update:modelValue', newValue)
}

function toggleOption(absoluteValue: number) {
    const relativeValue = toRelativeValue(absoluteValue)
    const relativeBitPos = Math.log2(relativeValue)
    let newValue = props.modelValue

    if (hasBit(relativeBitPos)) {
        newValue &= ~(1 << relativeBitPos)
    } else {
        newValue |= (1 << relativeBitPos)
    }

    emit('update:modelValue', newValue)
}

// Check if there's any selection in this group
const hasSelection = computed(() => {
    return props.modelValue !== 0
})

// Clear all selections in this group
function clearSelection() {
    emit('update:modelValue', 0)
}
</script>

<style scoped>
.tag-group-editor {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding: 1rem;
    border: 1px solid var(--color-border);
    border-radius: 8px;
    background: var(--color-background-soft);
}

.group-header {
    display: flex;
    gap: 0.75rem;
    align-items: flex-start;
}

.group-icon {
    width: 24px;
    height: 24px;
    color: var(--color-primary);
    flex-shrink: 0;
}

.group-info {
    flex: 1;
}

.clear-button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    padding: 0;
    border: none;
    border-radius: 50%;
    background: transparent;
    color: var(--color-text-muted);
    cursor: pointer;
    transition: all 0.2s ease;
    flex-shrink: 0;
}

.clear-button:hover {
    background: var(--color-background);
    color: var(--color-danger, #dc3545);
}

.group-label {
    margin: 0 0 0.25rem 0;
    font-size: 1rem;
    font-weight: 600;
}

.group-description {
    margin: 0;
    font-size: 0.85rem;
    color: var(--color-text-muted);
}

.group-controls {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

/* Category controls */
.category-controls {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.category-buttons,
.subcategory-buttons,
.toggle-controls {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
}

.category-button,
.subcategory-button,
.toggle-button {
    padding: 0.5rem 1rem;
    border: 1px solid var(--color-border);
    border-radius: 4px;
    background: var(--color-background);
    cursor: pointer;
    font-size: 0.9rem;
    transition: all 0.2s ease;
}

.category-button:hover,
.subcategory-button:hover,
.toggle-button:hover {
    border-color: var(--color-primary);
    background: var(--color-background-soft);
}

.category-button.active,
.subcategory-button.active,
.toggle-button.active {
    background: var(--color-primary);
    color: white;
    border-color: var(--color-primary);
}

.category-select,
.subcategory-select {
    padding: 0.5rem;
    border: 1px solid var(--color-border);
    border-radius: 4px;
    background: var(--color-background);
    font-size: 0.9rem;
}

.subcategory-controls {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
    padding-left: 1rem;
    flex-wrap: wrap;
}

.subcategory-buttons {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
    flex: 1;
    min-width: 0;
}

.subcategory-separator {
    font-size: 1.2rem;
    color: var(--color-text-muted);
    flex-shrink: 0;
    line-height: 2.25rem;
}
</style>
