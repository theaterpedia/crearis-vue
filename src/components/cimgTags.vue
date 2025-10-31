<template>
    <div class="cimg-tags">
        <div class="tags-label">Image Tags</div>
        <div class="tags-grid">
            <label v-for="(name, value) in tagDefinitions" :key="value" class="tag-checkbox"
                :class="{ active: hasTag(Number(value)) }">
                <input type="checkbox" :checked="hasTag(Number(value))" @change="toggleTag(Number(value))" />
                <span class="tag-name">{{ name }}</span>
            </label>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

/**
 * CimgTags Component
 * 
 * Bitmatrix tag selection for images
 * Tags: adult(1), teen(2), child(4), group(8), portrait(16), detail(32), location(64), system(128)
 */

interface Props {
    modelValue: number // bitmatrix value
}

interface Emits {
    (e: 'update:modelValue', value: number): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Tag definitions matching server/utils/image-helpers.ts
const tagDefinitions: Record<number, string> = {
    1: 'adult',
    2: 'teen',
    4: 'child',
    8: 'group',
    16: 'portrait',
    32: 'detail',
    64: 'location',
    128: 'system'
}

// Check if specific tag is active
const hasTag = (tagValue: number): boolean => {
    return (props.modelValue & tagValue) === tagValue
}

// Toggle specific tag
const toggleTag = (tagValue: number) => {
    const newValue = props.modelValue ^ tagValue
    emit('update:modelValue', newValue)
}
</script>

<style scoped>
.cimg-tags {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.tags-label {
    font-weight: 600;
    font-size: 0.875rem;
    color: var(--color-text-secondary, #666);
}

.tags-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 0.5rem;
}

.tag-checkbox {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--color-border, #ddd);
    border-radius: 0.375rem;
    cursor: pointer;
    transition: all 0.2s;
    user-select: none;
}

.tag-checkbox:hover {
    border-color: var(--color-primary, #3b82f6);
    background-color: var(--color-bg-hover, #f9fafb);
}

.tag-checkbox.active {
    border-color: var(--color-primary, #3b82f6);
    background-color: var(--color-primary-light, #dbeafe);
}

.tag-checkbox input[type="checkbox"] {
    margin: 0;
    cursor: pointer;
}

.tag-name {
    font-size: 0.875rem;
    text-transform: capitalize;
}
</style>
