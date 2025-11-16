<template>
    <span :class="['status-badge', colorClass]">
        {{ statusLabel }}
    </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useStatus } from '../composables/useStatus'

type TaskStatus = 'idea' | 'new' | 'draft' | 'final' | 'reopen' | 'trash'
type ColorVariant = 'muted' | 'primary' | 'warning' | 'positive' | 'secondary' | 'negative'

const props = withDefaults(defineProps<{
    status: TaskStatus
    table?: string
    lang?: string
}>(), {
    table: 'tasks',
    lang: 'de'
})

const { getStatusIdByName, status4Lang } = useStatus()

// Status color mapping remains the same for visual styling
const colorMap: Record<TaskStatus, ColorVariant> = {
    idea: 'muted',
    new: 'primary',
    draft: 'warning',
    final: 'positive',
    reopen: 'secondary',
    trash: 'negative'
}

// Get translated status label using status helpers
const statusLabel = computed(() => {
    const statusId = getStatusIdByName(props.status, props.table)
    if (!statusId) {
        return props.status // Fallback to raw value
    }

    const statusInfo = status4Lang(statusId, props.table, props.lang)
    return statusInfo?.displayName || props.status
})

const colorClass = computed(() => {
    const color: ColorVariant = colorMap[props.status as TaskStatus] || 'muted'
    return `status-${color}`
})
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
