<script setup lang="ts">
import { ref, computed } from 'vue'
import { Dropdown } from 'floating-vue'

interface TagsMultiToggleProps {
    modelValue: number[] // byte values (0-255)
    mode?: 'free' | 'choose-one' | 'toggle-two'
    size?: 'small' | 'medium' | 'large'
    maxTags?: number
    availableTags?: Array<{ label: string; value: number }>
    placeholder?: string
}

const props = withDefaults(defineProps<TagsMultiToggleProps>(), {
    mode: 'free',
    size: 'medium',
    maxTags: 10,
    availableTags: () => [],
    placeholder: 'Add tags...'
})

const emit = defineEmits<{
    'update:modelValue': [value: number[]]
}>()

// Local state
const isDropdownOpen = ref(false)
const searchQuery = ref('')
const inputRef = ref<HTMLInputElement | null>(null)

// Computed tags from byte values
const selectedTags = computed(() => {
    return props.modelValue.map(value => {
        const found = props.availableTags.find(t => t.value === value)
        return found || { label: `Tag ${value}`, value }
    })
})

// Filtered available tags
const filteredTags = computed(() => {
    if (!searchQuery.value) return props.availableTags
    const query = searchQuery.value.toLowerCase()
    return props.availableTags.filter(tag =>
        tag.label.toLowerCase().includes(query)
    )
})

// Check if tag is selected
const isTagSelected = (value: number) => {
    return props.modelValue.includes(value)
}

// Add tag
const addTag = (value: number) => {
    if (props.mode === 'choose-one') {
        // Replace all tags with this one
        emit('update:modelValue', [value])
        closeDropdown()
    } else if (props.mode === 'toggle-two') {
        // Toggle between two tags
        if (isTagSelected(value)) {
            emit('update:modelValue', [])
        } else {
            emit('update:modelValue', [value])
        }
        closeDropdown()
    } else {
        // Free mode - add if not at max
        if (!isTagSelected(value) && props.modelValue.length < props.maxTags) {
            emit('update:modelValue', [...props.modelValue, value])
        }
    }
    searchQuery.value = ''
}

// Remove tag
const removeTag = (value: number) => {
    emit('update:modelValue', props.modelValue.filter(v => v !== value))
}

// Toggle dropdown
const toggleDropdown = () => {
    isDropdownOpen.value = !isDropdownOpen.value
    if (isDropdownOpen.value) {
        setTimeout(() => inputRef.value?.focus(), 50)
    }
}

const closeDropdown = () => {
    isDropdownOpen.value = false
    searchQuery.value = ''
}

// Handle click outside
const handleClickOutside = () => {
    closeDropdown()
}
</script>

<template>
    <div class="tags-multi-toggle" :class="`size-${size}`">
        <Dropdown v-model:shown="isDropdownOpen" :triggers="[]" :autoHide="true" placement="bottom-start"
            @apply-hide="handleClickOutside">
            <!-- Trigger: Input field with selected tags -->
            <div class="tags-input" @click="toggleDropdown">
                <div class="tags-pills">
                    <span v-for="tag in selectedTags" :key="tag.value" class="tag-pill">
                        {{ tag.label }}
                        <button class="tag-remove" @click.stop="removeTag(tag.value)"
                            :aria-label="`Remove ${tag.label}`">
                            ×
                        </button>
                    </span>
                </div>
                <input ref="inputRef" v-model="searchQuery" type="text"
                    :placeholder="selectedTags.length === 0 ? placeholder : ''" class="tag-search-input"
                    @focus="isDropdownOpen = true" />
            </div>

            <!-- Dropdown content -->
            <template #popper>
                <div class="tags-dropdown">
                    <div v-if="filteredTags.length === 0" class="tags-empty">
                        <p>No tags found</p>
                    </div>
                    <ul v-else class="tags-list">
                        <li v-for="tag in filteredTags" :key="tag.value" class="tag-option"
                            :class="{ 'selected': isTagSelected(tag.value) }" @click="addTag(tag.value)">
                            <span class="tag-label">{{ tag.label }}</span>
                            <span class="tag-value">({{ tag.value }})</span>
                            <span v-if="isTagSelected(tag.value)" class="tag-check">✓</span>
                        </li>
                    </ul>

                    <div class="tags-footer">
                        <span class="tags-count">
                            {{ selectedTags.length }}/{{ maxTags }} selected
                        </span>
                        <button v-if="mode === 'free'" class="btn-clear" @click="emit('update:modelValue', [])">
                            Clear all
                        </button>
                    </div>
                </div>
            </template>
        </Dropdown>
    </div>
</template>

<style scoped>
.tags-multi-toggle {
    width: 100%;
}

.tags-input {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem;
    background: hsl(var(--color-card-bg));
    border: 1px solid hsl(var(--color-border));
    border-radius: var(--radius-small);
    cursor: text;
    min-height: 2.5rem;
    transition: border-color var(--duration) var(--ease);
}

/* Size variants */
.tags-multi-toggle.size-small .tags-input {
    padding: 0.25rem 0.5rem;
    min-height: 2rem;
    gap: 0.25rem;
}

.tags-multi-toggle.size-small .tag-pill {
    padding: 0.125rem 0.5rem;
    font-size: 0.75rem;
}

.tags-multi-toggle.size-small .tag-search-input {
    font-size: 0.75rem;
    min-width: 80px;
}

.tags-multi-toggle.size-medium .tags-input {
    padding: 0.5rem;
    min-height: 2.5rem;
}

.tags-multi-toggle.size-medium .tag-pill {
    padding: 0.25rem 0.75rem;
    font-size: 0.875rem;
}

.tags-multi-toggle.size-large .tags-input {
    padding: 0.75rem;
    min-height: 3rem;
    gap: 0.75rem;
}

.tags-multi-toggle.size-large .tag-pill {
    padding: 0.375rem 1rem;
    font-size: 1rem;
}

.tags-multi-toggle.size-large .tag-search-input {
    font-size: 1rem;
}

.tags-input:focus-within {
    border-color: hsl(var(--color-primary-base));
}

.tags-pills {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    flex: 0 1 auto;
}

.tag-pill {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.25rem 0.75rem;
    background: hsl(var(--color-accent-bg));
    color: hsl(var(--color-accent-contrast));
    border-radius: 999px;
    font-size: 0.875rem;
    white-space: nowrap;
}

.tag-remove {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1rem;
    height: 1rem;
    border: none;
    background: transparent;
    color: inherit;
    cursor: pointer;
    font-size: 1.125rem;
    line-height: 1;
    border-radius: 50%;
    transition: background var(--duration) var(--ease);
}

.tag-remove:hover {
    background: hsla(var(--color-danger), 0.2);
}

.tag-search-input {
    flex: 1 1 auto;
    min-width: 120px;
    border: none;
    background: transparent;
    outline: none;
    font-size: 0.875rem;
}

.tag-search-input::placeholder {
    color: hsl(var(--color-muted-contrast));
}

/* Dropdown */
.tags-dropdown {
    min-width: 250px;
    max-width: 400px;
    background: hsl(var(--color-card-bg));
    border: 1px solid hsl(var(--color-border));
    border-radius: var(--radius-medium);
    box-shadow: 0 4px 12px hsla(0, 0%, 0%, 0.15);
    overflow: hidden;
}

.tags-empty {
    padding: 2rem;
    text-align: center;
    color: hsl(var(--color-muted-contrast));
}

.tags-list {
    list-style: none;
    padding: 0;
    margin: 0;
    max-height: 300px;
    overflow-y: auto;
}

.tag-option {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    cursor: pointer;
    transition: background var(--duration) var(--ease);
}

.tag-option:hover {
    background: hsl(var(--color-muted-bg));
}

.tag-option.selected {
    background: hsla(var(--color-primary-base), 0.1);
}

.tag-label {
    flex: 1;
    font-size: 0.875rem;
}

.tag-value {
    font-size: 0.75rem;
    color: hsl(var(--color-muted-contrast));
    font-family: monospace;
}

.tag-check {
    color: hsl(var(--color-success));
    font-size: 1rem;
}

.tags-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 1rem;
    border-top: 1px solid hsl(var(--color-border));
    background: hsl(var(--color-muted-bg));
}

.tags-count {
    font-size: 0.75rem;
    color: hsl(var(--color-muted-contrast));
}

.btn-clear {
    padding: 0.25rem 0.75rem;
    background: transparent;
    border: 1px solid hsl(var(--color-border));
    border-radius: var(--radius-small);
    font-size: 0.75rem;
    cursor: pointer;
    transition: all var(--duration) var(--ease);
}

.btn-clear:hover {
    background: hsl(var(--color-danger-bg));
    color: hsl(var(--color-danger-contrast));
    border-color: hsl(var(--color-danger));
}
</style>
