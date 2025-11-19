<template>
    <span 
        class="status-badge" 
        :class="[
            `badge-${variant}`, 
            sizeClass, 
            statusClass,
            { 'has-icon': showIcon, 'badge-clickable': clickable },
            customClass
        ]" 
        :style="badgeStyle"
        @click="handleClick"
    >
        <svg v-if="showIcon && !icon" :fill="iconColor" height="16" viewBox="0 0 256 256" width="16"
            xmlns="http://www.w3.org/2000/svg">
            <circle cx="128" cy="128" r="96" />
        </svg>
        <span v-if="icon" class="badge-icon">{{ icon }}</span>
        <span class="badge-label">{{ displayLabel }}</span>
    </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { parseByteaHex } from '@/composables/useSysregTags'

interface Props {
    status?: string | null | undefined    // BYTEA hex string (legacy)
    value?: string | null | undefined     // BYTEA hex string (preferred)
    label?: string                        // Pre-computed label (from status_label)
    variant?: 'solid' | 'outline' | 'soft' // Visual style
    size?: 'small' | 'medium' | 'large' | 'sm' | 'md' | 'lg'   // Size variant
    showIcon?: boolean                    // Show status indicator dot
    color?: string                        // Custom color override
    clickable?: boolean                   // Enable click interaction
    customClass?: string                  // Additional CSS classes
    icon?: string                         // Icon name/identifier
}

const props = withDefaults(defineProps<Props>(), {
    label: '',
    variant: 'soft',
    size: 'medium',
    showIcon: true,
    color: undefined,
    clickable: false,
    customClass: '',
    icon: undefined,
    status: undefined,
    value: undefined
})

const emit = defineEmits<{
    click: [value: string]
}>()

// Support both 'status' and 'value' props for backward compatibility
const statusValue = computed(() => props.value || props.status || '')

// Size classes
const sizeClass = computed(() => {
    switch (props.size) {
        case 'small':
        case 'sm':
            return 'badge-sm badge-small'
        case 'large':
        case 'lg':
            return 'badge-lg badge-large'
        case 'medium':
        case 'md':
        default:
            return 'badge-md badge-medium'
    }
})

// Status-based CSS classes for semantic styling
const statusClass = computed(() => {
    const val = statusValue.value
    if (!val) return ''
    
    const bytes = parseByteaHex(val)
    const num = bytes[0] || 0
    
    switch (num) {
        case 0x00:
            return 'status-raw'
        case 0x01:
            return 'status-processing'
        case 0x02:
            return 'status-approved'
        case 0x04:
            return 'status-published'
        case 0x08:
            return 'status-deprecated'
        case 0x10:
            return 'status-archived'
        default:
            return ''
    }
})

// Display label
const displayLabel = computed(() => {
    if (props.label) return props.label

    // Fallback if no label provided
    const bytes = parseByteaHex(statusValue.value)
    const num = bytes[0] || 0
    return `Status 0x${num.toString(16).padStart(2, '0')}`
})

// Click handler
function handleClick(event: MouseEvent) {
    if (props.clickable) {
        emit('click', statusValue.value || '\\x00')
    }
}

// Color mapping based on status value
const statusColors = computed(() => {
    if (props.color) {
        return { bg: props.color, text: '#fff', border: props.color }
    }

    const bytes = parseByteaHex(statusValue.value)
    const num = bytes[0] || 0

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

/* Clickable styling */
.badge-clickable {
    cursor: pointer;
    user-select: none;
}

.badge-clickable:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.badge-clickable:active {
    transform: translateY(0);
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
