<template>
    <div class="datetime-edit" :class="{ stacked }">
        <label v-if="label" class="datetime-label">{{ label }}</label>
        <input v-if="type === 'date' || type === 'datetime'" type="date" :value="dateValue" @input="handleDateInput"
            class="datetime-input date-input" :class="`size-${size}`" />
        <input v-if="type === 'time' || type === 'datetime'" type="time" :value="timeValue" @input="handleTimeInput"
            class="datetime-input time-input" :class="`size-${size}`" />
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
    label?: string
    type?: 'date' | 'time' | 'datetime'
    stacked?: boolean
    size?: 'small' | 'medium' | 'large'
    modelValue?: string
}

const props = withDefaults(defineProps<Props>(), {
    type: 'datetime',
    stacked: true,
    size: 'medium',
    modelValue: ''
})

const emit = defineEmits<{
    'update:modelValue': [value: string]
}>()

// Parse the modelValue into date and time components
const dateValue = computed(() => {
    if (!props.modelValue) return ''

    // Handle ISO datetime format (YYYY-MM-DDTHH:mm)
    if (props.modelValue.includes('T')) {
        return props.modelValue.split('T')[0]
    }

    // Handle date-only format
    if (/^\d{4}-\d{2}-\d{2}$/.test(props.modelValue)) {
        return props.modelValue
    }

    // Try to parse as Date
    try {
        const date = new Date(props.modelValue)
        if (!isNaN(date.getTime())) {
            const year = date.getFullYear()
            const month = String(date.getMonth() + 1).padStart(2, '0')
            const day = String(date.getDate()).padStart(2, '0')
            return `${year}-${month}-${day}`
        }
    } catch (e) {
        console.warn('Could not parse date:', props.modelValue, e)
    }

    return ''
})

const timeValue = computed(() => {
    if (!props.modelValue) return ''

    // Handle ISO datetime format (YYYY-MM-DDTHH:mm)
    if (props.modelValue.includes('T')) {
        const timePart = props.modelValue.split('T')[1]
        return timePart ? timePart.substring(0, 5) : ''
    }

    // Handle time-only format (HH:mm)
    if (/^\d{2}:\d{2}/.test(props.modelValue)) {
        return props.modelValue.substring(0, 5)
    }

    // Try to parse as Date
    try {
        const date = new Date(props.modelValue)
        if (!isNaN(date.getTime())) {
            const hours = String(date.getHours()).padStart(2, '0')
            const minutes = String(date.getMinutes()).padStart(2, '0')
            return `${hours}:${minutes}`
        }
    } catch (e) {
        console.warn('Could not parse time:', props.modelValue, e)
    }

    return ''
})

const handleDateInput = (event: Event) => {
    const target = event.target as HTMLInputElement
    const newDate = target.value

    if (props.type === 'date') {
        // Date only
        emit('update:modelValue', newDate)
    } else {
        // DateTime - combine with existing time or default to 09:00
        const time = timeValue.value || '09:00'
        emit('update:modelValue', `${newDate}T${time}`)
    }
}

const handleTimeInput = (event: Event) => {
    const target = event.target as HTMLInputElement
    const newTime = target.value

    if (props.type === 'time') {
        // Time only
        emit('update:modelValue', newTime)
    } else {
        // DateTime - combine with existing date or default to today
        const date = dateValue.value || new Date().toISOString().split('T')[0]
        emit('update:modelValue', `${date}T${newTime}`)
    }
}
</script>

<style scoped>
.datetime-edit {
    display: flex;
    gap: 0.5rem;
    align-items: center;
}

.datetime-edit.stacked {
    flex-direction: column;
    align-items: stretch;
}

.datetime-label {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--color-text);
    white-space: nowrap;
    flex-shrink: 0;
}

.datetime-input {
    flex: 1;
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--color-border);
    border-radius: 6px;
    font-size: 0.875rem;
    font-family: inherit;
    background: var(--color-background);
    color: var(--color-text);
    transition: all 0.2s ease;
}

.datetime-input:focus {
    outline: none;
    border-color: var(--color-primary, #3b82f6);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.datetime-input:hover {
    border-color: var(--color-border-hover, #d1d5db);
}

/* Size variants */
.datetime-input.size-small {
    padding: 0.375rem 0.5rem;
    font-size: 0.8125rem;
}

.datetime-input.size-medium {
    padding: 0.5rem 0.75rem;
    font-size: 0.875rem;
}

.datetime-input.size-large {
    padding: 0.625rem 1rem;
    font-size: 1rem;
}

/* Adjust date/time input widths when not stacked */
.datetime-edit:not(.stacked) .date-input {
    min-width: 150px;
}

.datetime-edit:not(.stacked) .time-input {
    min-width: 100px;
}

/* Responsive: stack on very narrow screens */
@media (max-width: 480px) {
    .datetime-edit:not(.stacked) {
        flex-direction: column;
        align-items: stretch;
    }
}
</style>
