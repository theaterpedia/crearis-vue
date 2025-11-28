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
import { UsersRound, Sparkles, Theater, Clapperboard, Tag } from 'lucide-vue-next'
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
    const tags = getOptionsByFamily(props.familyName)
    console.log('[TagGroupEditor] All tags for', props.familyName, ':', tags.length)
    console.log('[TagGroupEditor] Group bits:', props.group.bits)
    return tags
})

// Filter tags by group bits
// Tags have INTEGER values (power-of-2: 1, 2, 4, 8, etc.)
// We need to check if the tag's bit position is within this group's bit range
const groupTags = computed(() => {
    const filtered = allTags.value.filter((tag: any) => {
        // Skip if value is 0 or invalid
        if (!tag.value || tag.value === 0) return false

        // Calculate bit position from power-of-2 value
        const bitPos = Math.log2(tag.value)

        // Check if this bit position is in the group's bit range
        const matches = props.group.bits.includes(bitPos)

        if (matches) {
            console.log('[TagGroupEditor] Matched tag:', tag.name, 'value:', tag.value, 'bit:', bitPos)
        }

        return matches
    })
    console.log('[TagGroupEditor] Filtered group tags:', filtered.length)
    return filtered
})// Separate categories and subcategories
const categories = computed(() => {
    const cats = groupTags.value.filter((tag: any) =>
        tag.taglogic === 'category' && !tag.name.includes('>')
    )
    console.log('[TagGroupEditor] Categories found:', cats.length, 'for group:', props.group.name)
    return cats
})

const subcategories = computed(() => {
    const subs = groupTags.value.filter((tag: any) =>
        tag.taglogic === 'subcategory'
    )
    console.log('[TagGroupEditor] Subcategories found:', subs.length, subs.map((s: any) => s.name))
    return subs
})

const toggles = computed(() => {
    return groupTags.value.filter((tag: any) =>
        tag.taglogic === 'toggle' || tag.taglogic === 'option'
    )
})

// Current selections
const selectedCategory = computed(() => {
    // Check which category is selected based on current value
    for (const cat of categories.value) {
        const bitPos = Math.log2(cat.value)
        if (hasBit(bitPos)) {
            return cat.value
        }
    }
    return 0
})

const selectedSubcategory = computed(() => {
    if (!selectedCategory.value) return 0

    // Find the parent category's bit position
    const parentBit = Math.log2(selectedCategory.value)

    // Filter subcategories that belong to this category using parent_bit
    const matchingSubcategories = subcategories.value.filter((s: any) => {
        return s.parent_bit === parentBit
    })

    // Find which subcategory is currently selected
    for (const sub of matchingSubcategories) {
        const bitPos = Math.log2(sub.value)
        if (hasBit(bitPos)) {
            return sub.value
        }
    }
    return 0
})

// Get filtered subcategories for the selected category
const availableSubcategories = computed(() => {
    if (!selectedCategory.value) {
        console.log('[TagGroupEditor] No category selected')
        return []
    }

    const parentBit = Math.log2(selectedCategory.value)
    console.log('[TagGroupEditor] Selected category value:', selectedCategory.value, 'parent bit:', parentBit)
    console.log('[TagGroupEditor] All subcategories:', subcategories.value.length)

    const filtered = subcategories.value.filter((s: any) => {
        console.log('[TagGroupEditor] Checking subcategory:', s.name, 'parent_bit:', s.parent_bit, 'matches:', s.parent_bit === parentBit)
        return s.parent_bit === parentBit
    })

    console.log('[TagGroupEditor] Filtered subcategories:', filtered.length)
    return filtered
})

// Helper functions
function hasBit(bit: number): boolean {
    return (props.modelValue & (1 << bit)) !== 0
}

function setBits(bits: number[]): number {
    let value = props.modelValue
    bits.forEach(bit => {
        value |= (1 << bit)
    })
    return value
}

function clearGroupBits(): number {
    let value = props.modelValue
    props.group.bits.forEach((bit: number) => {
        value &= ~(1 << bit)
    })
    return value
}

function hasToggle(tagValue: number): boolean {
    const bitPos = Math.log2(tagValue)
    return hasBit(bitPos)
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
function selectCategory(value: number) {
    if (value === 0) {
        // Clear all group bits
        emit('update:modelValue', clearGroupBits())
    } else {
        // Clear group bits and set category bit
        const bitPos = Math.log2(value)
        let newValue = clearGroupBits()
        newValue |= (1 << bitPos)
        emit('update:modelValue', newValue)
    }
}

function selectSubcategory(value: number) {
    if (value === 0) return

    // Clear group bits and set subcategory bit
    const bitPos = Math.log2(value)
    let newValue = clearGroupBits()
    newValue |= (1 << bitPos)
    emit('update:modelValue', newValue)
}

function toggleOption(value: number) {
    const bitPos = Math.log2(value)
    let newValue = props.modelValue

    if (hasBit(bitPos)) {
        newValue &= ~(1 << bitPos)
    } else {
        newValue |= (1 << bitPos)
    }

    emit('update:modelValue', newValue)
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
    align-items: center;
    gap: 0.5rem;
    padding-left: 1rem;
}

.subcategory-separator {
    font-size: 1.2rem;
    color: var(--color-text-muted);
}
</style>
