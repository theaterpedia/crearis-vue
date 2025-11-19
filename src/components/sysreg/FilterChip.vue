<template>
    <div 
        class="filter-chip" 
        :class="[
            `variant-${variant}`, 
            colorClass,
            { 
                'chip-selected': selected,
                removable 
            }
        ]"
        :role="'button'"
        :aria-pressed="selected ? 'true' : 'false'"
        :tabindex="0"
        @click="handleToggle"
        @keydown.enter="handleToggle"
        @keydown.space.prevent="handleToggle"
    >
        <span class="chip-label">{{ label }}</span>
        <span v-if="count && count > 0" class="chip-count">{{ count }}</span>
        <button v-if="removable && selected" class="chip-remove" @click.stop="handleRemove" aria-label="Remove filter">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 3L3 9M3 3L9 9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"
                    stroke-linejoin="round" />
            </svg>
        </button>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
    label: string
    value?: string                      // BYTEA hex value
    variant?: 'default' | 'status' | 'topic' | 'domain' | 'ctags'
    color?: 'primary' | 'secondary' | 'default'  // Color variants
    selected?: boolean                  // Selection state
    removable?: boolean                 // Show remove button
    count?: number                      // Optional count badge
}

const props = withDefaults(defineProps<Props>(), {
    variant: 'default',
    color: 'default',
    selected: false,
    removable: false,
    count: 0,
    value: undefined
})

const emit = defineEmits<{
    toggle: [value: string]
    remove: [value: string]
}>()

// Color class based on color prop
const colorClass = computed(() => {
    return `chip-${props.color}`
})

function handleToggle() {
    emit('toggle', props.value || '')
}

function handleRemove() {
    emit('remove', props.value || '')
}
</script>

<style scoped>
.filter-chip {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.375rem 0.75rem;
    font-size: 0.875rem;
    font-weight: 500;
    border-radius: 9999px;
    transition: all 0.2s ease;
    white-space: nowrap;
    cursor: pointer;
    user-select: none;
}

.filter-chip:focus {
    outline: 2px solid var(--color-primary, #3b82f6);
    outline-offset: 2px;
}

/* Color variants */
.chip-default {
    background: var(--color-background-soft, #f3f4f6);
    color: var(--color-text, #374151);
    border: 1px solid var(--color-border, #d1d5db);
}

.chip-primary {
    background: #dbeafe;
    color: #1e40af;
    border: 1px solid #93c5fd;
}

.chip-secondary {
    background: #f3e8ff;
    color: #6b21a8;
    border: 1px solid #d8b4fe;
}

.chip-selected {
    background: #3b82f6;
    color: white;
    border-color: #2563eb;
}

.chip-selected.chip-primary {
    background: #2563eb;
    border-color: #1d4ed8;
}

.chip-selected.chip-secondary {
    background: #7c3aed;
    border-color: #6d28d9;
}

.filter-chip.variant-default {
    background: var(--color-background-soft);
    color: var(--color-text);
    border: 1px solid var(--color-border);
}

.filter-chip.variant-status {
    background: #dbeafe;
    color: #1e40af;
    border: 1px solid #93c5fd;
}

.filter-chip.variant-topic {
    background: #fef3c7;
    color: #92400e;
    border: 1px solid #fcd34d;
}

.filter-chip.variant-domain {
    background: #d1fae5;
    color: #065f46;
    border: 1px solid #6ee7b7;
}

.filter-chip.variant-ctags {
    background: #e9d5ff;
    color: #6b21a8;
    border: 1px solid #c084fc;
}

.chip-label {
    line-height: 1;
}

.chip-count {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 1.25rem;
    height: 1.25rem;
    padding: 0 0.25rem;
    background: rgba(0, 0, 0, 0.1);
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 600;
    line-height: 1;
}

.chip-selected .chip-count {
    background: rgba(255, 255, 255, 0.2);
}

.chip-remove {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    width: 16px;
    height: 16px;
    background: transparent;
    border: none;
    border-radius: 50%;
    cursor: pointer;
    color: currentColor;
    opacity: 0.6;
    transition: opacity 0.2s ease, background 0.2s ease;
}

.chip-remove:hover {
    opacity: 1;
    background: rgba(0, 0, 0, 0.1);
}

.chip-remove:active {
    transform: scale(0.95);
}

.filter-chip:not(.removable) .chip-remove {
    display: none;
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
    .filter-chip.variant-default {
        background: rgba(255, 255, 255, 0.1);
        border-color: rgba(255, 255, 255, 0.2);
    }

    .filter-chip.variant-status {
        background: rgba(59, 130, 246, 0.2);
        color: #93c5fd;
        border-color: rgba(59, 130, 246, 0.3);
    }

    .filter-chip.variant-topic {
        background: rgba(251, 191, 36, 0.2);
        color: #fcd34d;
        border-color: rgba(251, 191, 36, 0.3);
    }

    .filter-chip.variant-domain {
        background: rgba(52, 211, 153, 0.2);
        color: #6ee7b7;
        border-color: rgba(52, 211, 153, 0.3);
    }

    .filter-chip.variant-ctags {
        background: rgba(168, 85, 247, 0.2);
        color: #c084fc;
        border-color: rgba(168, 85, 247, 0.3);
    }

    .chip-remove:hover {
        background: rgba(255, 255, 255, 0.1);
    }
}
</style>
