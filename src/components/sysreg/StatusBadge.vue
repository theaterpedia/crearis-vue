<template>
    <span class="status-badge" :class="[`badge-${variant}`, sizeClass, { 'has-icon': showIcon }]" :style="badgeStyle">
        <svg v-if="showIcon && icon" :fill="iconColor" height="16" viewBox="0 0 256 256" width="16"
            xmlns="http://www.w3.org/2000/svg">
            <circle cx="128" cy="128" r="96" />
        </svg>
        <span class="badge-label">{{ displayLabel }}</span>
    </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { parseByteaHex } from '@/composables/useSysregTags'

interface Props {
    value: string | null | undefined      // BYTEA hex string
    label?: string                         // Pre-computed label (from status_label)
    variant?: 'solid' | 'outline' | 'soft' // Visual style
    size?: 'small' | 'medium' | 'large'   // Size variant
    showIcon?: boolean                     // Show status indicator dot
    color?: string                         // Custom color override
}

const props = withDefaults(defineProps<Props>(), {
    label: '',
    variant: 'soft',
    size: 'medium',
    showIcon: true,
    color: undefined
})

// Size classes
const sizeClass = computed(() => {
    switch (props.size) {
        case 'small':
            return 'badge-small'
        case 'large':
            return 'badge-large'
        default:
            return 'badge-medium'
    }
})

// Display label
const displayLabel = computed(() => {
    if (props.label) return props.label

    // Fallback if no label provided
    const num = parseByteaHex(props.value)
    return `Status 0x${num.toString(16).padStart(2, '0')}`
})

// Color mapping based on status value
const statusColors = computed(() => {
    if (props.color) {
        return { bg: props.color, text: '#fff', border: props.color }
    }

    const num = parseByteaHex(props.value)

    // Default color mapping (can be customized per project)
    switch (num) {
        case 0x00: // new
            return { bg: '#94a3b8', text: '#1e293b', border: '#64748b' }
        case 0x01: // draft
            return { bg: '#fbbf24', text: '#78350f', border: '#f59e0b' }
        case 0x02: // in progress / scheduled
            return { bg: '#60a5fa', text: '#1e3a8a', border: '#3b82f6' }
        case 0x04: // active / published
            return { bg: '#34d399', text: '#064e3b', border: '#10b981' }
        case 0x08: // completed / archived
            return { bg: '#a78bfa', text: '#4c1d95', border: '#8b5cf6' }
        case 0x10: // cancelled / deprecated
            return { bg: '#f87171', text: '#7f1d1d', border: '#ef4444' }
        default:
            return { bg: '#e5e7eb', text: '#374151', border: '#d1d5db' }
    }
})

// Dynamic badge styling
const badgeStyle = computed(() => {
    const colors = statusColors.value

    switch (props.variant) {
        case 'solid':
            return {
                backgroundColor: colors.bg,
                color: colors.text,
                borderColor: colors.border
            }
        case 'outline':
            return {
                backgroundColor: 'transparent',
                color: colors.border,
                borderColor: colors.border
            }
        case 'soft':
        default:
            return {
                backgroundColor: `${colors.bg}20`, // 20% opacity
                color: colors.border,
                borderColor: `${colors.border}40` // 40% opacity
            }
    }
})

// Icon color
const iconColor = computed(() => {
    const colors = statusColors.value
    return props.variant === 'solid' ? colors.text : colors.border
})

// Show icon
const icon = computed(() => props.showIcon)
</script>

<style scoped>
.status-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    border: 1px solid;
    font-size: 0.875rem;
    font-weight: 500;
    line-height: 1.25rem;
    white-space: nowrap;
    transition: all 0.2s ease;
}

/* Size variants */
.badge-small {
    padding: 0.125rem 0.5rem;
    font-size: 0.75rem;
    gap: 0.25rem;
}

.badge-small svg {
    width: 12px;
    height: 12px;
}

.badge-medium {
    padding: 0.25rem 0.75rem;
    font-size: 0.875rem;
    gap: 0.375rem;
}

.badge-medium svg {
    width: 16px;
    height: 16px;
}

.badge-large {
    padding: 0.5rem 1rem;
    font-size: 1rem;
    gap: 0.5rem;
}

.badge-large svg {
    width: 20px;
    height: 20px;
}

/* Variant styles are applied via inline styles for dynamic colors */
.badge-solid {
    border-width: 1px;
}

.badge-outline {
    border-width: 1.5px;
    font-weight: 600;
}

.badge-soft {
    border-width: 1px;
}

/* Icon styling */
.status-badge svg {
    flex-shrink: 0;
}

.badge-label {
    user-select: none;
}
</style>
