<template>
    <div class="status-toggler">
        <button v-for="status in allowedStatuses" :key="status" type="button" :class="[
            'status-button',
            `status-${getColorVariant(status)}`,
            { active: modelValue === status }
        ]" @click="$emit('update:modelValue', status)">
            {{ getStatusLabel(status) }}
        </button>
    </div>
</template>

<script setup lang="ts">
type TaskStatus = 'idea' | 'new' | 'draft' | 'final' | 'reopen' | 'trash'
type ColorVariant = 'muted' | 'primary' | 'warning' | 'positive' | 'secondary' | 'negative'

defineProps<{
    modelValue: TaskStatus
    allowedStatuses?: TaskStatus[]
}>()

defineEmits<{
    'update:modelValue': [status: TaskStatus]
}>()

const statusMap: Record<TaskStatus, { label: string; color: ColorVariant }> = {
    idea: { label: 'Idea', color: 'muted' },
    new: { label: 'New', color: 'primary' },
    draft: { label: 'Draft', color: 'warning' },
    final: { label: 'Final', color: 'positive' },
    reopen: { label: 'Reopen', color: 'secondary' },
    trash: { label: 'Trash', color: 'negative' }
}

function getStatusLabel(status: TaskStatus): string {
    return statusMap[status]?.label || status
}

function getColorVariant(status: TaskStatus): ColorVariant {
    return statusMap[status]?.color || 'muted'
}
</script>

<style scoped>
.status-toggler {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
}

.status-button {
    padding: 0.5rem 1rem;
    border: 2px solid transparent;
    border-radius: var(--radius-button);
    font-family: var(--font);
    font-size: 0.875rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    cursor: pointer;
    transition: all 0.2s ease;
    opacity: 0.6;
}

.status-button:hover {
    opacity: 0.8;
}

.status-button.active {
    opacity: 1;
    border-color: currentColor;
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
