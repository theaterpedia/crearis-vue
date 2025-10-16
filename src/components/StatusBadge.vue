<template>
    <span :class="['status-badge', colorClass]">
        {{ statusLabel }}
    </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

type TaskStatus = 'idea' | 'new' | 'draft' | 'final' | 'reopen' | 'trash'
type ColorVariant = 'muted' | 'primary' | 'warning' | 'positive' | 'secondary' | 'negative'

const props = defineProps<{
    status: TaskStatus
}>()

const statusMap: Record<TaskStatus, { label: string; color: ColorVariant }> = {
    idea: { label: 'Idea', color: 'muted' },
    new: { label: 'New', color: 'primary' },
    draft: { label: 'Draft', color: 'warning' },
    final: { label: 'Final', color: 'positive' },
    reopen: { label: 'Reopen', color: 'secondary' },
    trash: { label: 'Trash', color: 'negative' }
}

const statusLabel = computed(() => statusMap[props.status]?.label || props.status)
const colorClass = computed(() => `status-${statusMap[props.status]?.color || 'muted'}`)
</script>

<style scoped>
.status-badge {
    display: inline-flex;
    align-items: center;
    padding: 0.125rem 0.375rem;
    border-radius: 0;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    white-space: nowrap;
}

.status-muted {
    background: var(--color-muted-bg);
    color: var(--color-muted-contrast);
}

.status-primary {
    background: var(--color-primary-bg);
    color: var(--color-primary-contrast);
}

.status-warning {
    background: var(--color-warning-bg);
    color: var(--color-warning-contrast);
}

.status-positive {
    background: var(--color-positive-bg);
    color: var(--color-positive-contrast);
}

.status-secondary {
    background: var(--color-secondary-bg);
    color: var(--color-secondary-contrast);
}

.status-negative {
    background: var(--color-negative-bg);
    color: var(--color-negative-contrast);
}
</style>
