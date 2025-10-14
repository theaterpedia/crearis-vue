<template>
    <span :class="['category-badge', colorClass]">
        {{ categoryLabel }}
    </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

type TaskCategory = 'admin' | 'base' | 'project' | 'release'
type ColorVariant = 'accent' | 'primary' | 'secondary' | 'muted'

const props = defineProps<{
    category: TaskCategory
}>()

const categoryMap: Record<TaskCategory, { label: string; color: ColorVariant }> = {
    admin: { label: 'Admin', color: 'accent' },
    base: { label: 'Base', color: 'primary' },
    project: { label: 'Project', color: 'secondary' },
    release: { label: 'Release', color: 'muted' }
}

const categoryLabel = computed(() => categoryMap[props.category]?.label || props.category)
const colorClass = computed(() => `category-${categoryMap[props.category]?.color || 'muted'}`)
</script>

<style scoped>
.category-badge {
    display: inline-flex;
    align-items: center;
    padding: 0.25rem 0.75rem;
    border-radius: var(--radius-button);
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    white-space: nowrap;
}

.category-accent {
    background: var(--color-accent-bg);
    color: var(--color-accent-contrast);
}

.category-primary {
    background: var(--color-primary-bg);
    color: var(--color-primary-contrast);
}

.category-secondary {
    background: var(--color-secondary-bg);
    color: var(--color-secondary-contrast);
}

.category-muted {
    background: var(--color-muted-bg);
    color: var(--color-muted-contrast);
}
</style>
