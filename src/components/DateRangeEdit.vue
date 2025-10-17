<template>
    <div class="date-range-edit" :class="{ stacked }">
        <div class="date-range-row" :class="{ stacked }">
            <!-- Start DateTime -->
            <div class="range-group">
                <label class="range-label">{{ startLabel }}</label>
                <input v-if="type === 'date' || type === 'datetime'" type="date" :value="startDateValue"
                    @input="handleStartDateInput" class="datetime-input date-input"
                    :class="[`size-${size}`, { error: hasDateRangeError }]" />
                <input v-if="type === 'time' || type === 'datetime'" type="time" :value="startTimeValue"
                    @input="handleStartTimeInput" class="datetime-input time-input"
                    :class="[`size-${size}`, { error: hasTimeRangeError }]" />
            </div>

            <!-- End DateTime -->
            <div class="range-group">
                <label class="range-label">{{ endLabel }}</label>
                <input v-if="type === 'date' || type === 'datetime'" type="date" :value="endDateValue"
                    @input="handleEndDateInput" class="datetime-input date-input"
                    :class="[`size-${size}`, { error: hasDateRangeError }]" />
                <input v-if="type === 'time' || type === 'datetime'" type="time" :value="endTimeValue"
                    @input="handleEndTimeInput" class="datetime-input time-input"
                    :class="[`size-${size}`, { error: hasTimeRangeError }]" />
            </div>
        </div>

        <!-- Validation Error Message -->
        <div v-if="validationError" class="validation-error">
            {{ validationError }}
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

interface Props {
    startLabel?: string
    endLabel?: string
    type?: 'date' | 'time' | 'datetime'
    stacked?: boolean
    size?: 'small' | 'medium' | 'large'
    start?: string
    end?: string
}

const props = withDefaults(defineProps<Props>(), {
    startLabel: 'Beginn',
    endLabel: 'Ende',
    type: 'datetime',
    stacked: true,
    size: 'medium',
    start: '',
    end: ''
})

const emit = defineEmits<{
    'update:start': [value: string]
    'update:end': [value: string]
}>()

const validationError = ref<string>('')

// Parse start value into date and time components
const startDateValue = computed(() => {
    return extractDate(props.start)
})

const startTimeValue = computed(() => {
    return extractTime(props.start)
})

// Parse end value into date and time components
const endDateValue = computed(() => {
    return extractDate(props.end)
})

const endTimeValue = computed(() => {
    return extractTime(props.end)
})

// Check if there's a date range error (end before start)
const hasDateRangeError = computed(() => {
    if (!props.start || !props.end) return false

    if (props.type === 'datetime') {
        const startDateTime = new Date(props.start)
        const endDateTime = new Date(props.end)
        return endDateTime <= startDateTime
    } else if (props.type === 'date') {
        return props.end <= props.start
    }

    return false
})

// Check if there's a time range error (same day, end time before start time)
const hasTimeRangeError = computed(() => {
    if (!props.start || !props.end) return false

    if (props.type === 'time') {
        return props.end <= props.start
    } else if (props.type === 'datetime') {
        const startDate = extractDate(props.start)
        const endDate = extractDate(props.end)
        if (startDate === endDate) {
            const startTime = extractTime(props.start)
            const endTime = extractTime(props.end)
            return endTime <= startTime
        }
    }

    return false
})

// Helper: Extract date portion from various formats
function extractDate(value: string): string {
    if (!value) return ''

    // Handle ISO datetime format (YYYY-MM-DDTHH:mm)
    if (value.includes('T')) {
        const parts = value.split('T')
        return parts[0] || ''
    }

    // Handle date-only format
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return value
    }

    // Try to parse as Date
    try {
        const date = new Date(value)
        if (!isNaN(date.getTime())) {
            const year = date.getFullYear()
            const month = String(date.getMonth() + 1).padStart(2, '0')
            const day = String(date.getDate()).padStart(2, '0')
            return `${year}-${month}-${day}`
        }
    } catch (e) {
        console.warn('Could not parse date:', value, e)
    }

    return ''
}

// Helper: Extract time portion from various formats
function extractTime(value: string): string {
    if (!value) return ''

    // Handle ISO datetime format (YYYY-MM-DDTHH:mm)
    if (value.includes('T')) {
        const timePart = value.split('T')[1]
        return timePart ? timePart.substring(0, 5) : ''
    }

    // Handle time-only format (HH:mm)
    if (/^\d{2}:\d{2}/.test(value)) {
        return value.substring(0, 5)
    }

    // Try to parse as Date
    try {
        const date = new Date(value)
        if (!isNaN(date.getTime())) {
            const hours = String(date.getHours()).padStart(2, '0')
            const minutes = String(date.getMinutes()).padStart(2, '0')
            return `${hours}:${minutes}`
        }
    } catch (e) {
        console.warn('Could not parse time:', value, e)
    }

    return ''
}

// Helper: Combine date and time into appropriate format
function combineDateTime(date: string, time: string): string {
    if (props.type === 'date') {
        return date
    } else if (props.type === 'time') {
        return time
    } else {
        // datetime
        const defaultDate = date || new Date().toISOString().split('T')[0]
        const defaultTime = time || '09:00'
        return `${defaultDate}T${defaultTime}`
    }
}

// Validate range whenever values change
function validateRange() {
    if (!props.start || !props.end) {
        validationError.value = ''
        return
    }

    if (props.type === 'datetime') {
        const startDateTime = new Date(props.start)
        const endDateTime = new Date(props.end)

        if (endDateTime <= startDateTime) {
            validationError.value = 'Das Enddatum muss nach dem Beginndatum liegen'
            return
        }
    } else if (props.type === 'date') {
        if (props.end <= props.start) {
            validationError.value = 'Das Enddatum muss nach dem Beginndatum liegen'
            return
        }
    } else if (props.type === 'time') {
        if (props.end <= props.start) {
            validationError.value = 'Die Endzeit muss nach der Beginnzeit liegen'
            return
        }
    }

    validationError.value = ''
}

// Watch for changes and validate
watch([() => props.start, () => props.end], validateRange, { immediate: true })

// Event handlers for start date/time
const handleStartDateInput = (event: Event) => {
    const target = event.target as HTMLInputElement
    const newDate = target.value
    const newValue = combineDateTime(newDate, startTimeValue.value)
    emit('update:start', newValue)
}

const handleStartTimeInput = (event: Event) => {
    const target = event.target as HTMLInputElement
    const newTime = target.value
    const newValue = combineDateTime(startDateValue.value, newTime)
    emit('update:start', newValue)
}

// Event handlers for end date/time
const handleEndDateInput = (event: Event) => {
    const target = event.target as HTMLInputElement
    const newDate = target.value
    const newValue = combineDateTime(newDate, endTimeValue.value)
    emit('update:end', newValue)
}

const handleEndTimeInput = (event: Event) => {
    const target = event.target as HTMLInputElement
    const newTime = target.value
    const newValue = combineDateTime(endDateValue.value, newTime)
    emit('update:end', newValue)
}
</script>

<style scoped>
.date-range-edit {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.date-range-row {
    display: flex;
    gap: 1rem;
}

.date-range-row.stacked {
    flex-direction: column;
    gap: 0.75rem;
}

.range-group {
    flex: 1;
    display: flex;
    flex-direction: column;
    /* Always stack label → date → time vertically */
    gap: 0.5rem;
    align-items: stretch;
}

.range-label {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--color-text);
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

.datetime-input.error {
    border-color: #ef4444;
}

.datetime-input.error:focus {
    border-color: #ef4444;
    box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
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

/* Adjust date/time input widths */
.date-input {
    min-width: 150px;
}

.time-input {
    min-width: 100px;
}

/* Validation error message */
.validation-error {
    font-size: 0.8125rem;
    color: #ef4444;
    margin-top: 0.25rem;
    padding-left: 0.25rem;
}

/* Responsive: stack range groups on narrow screens */
@media (max-width: 768px) {
    .date-range-row:not(.stacked) {
        flex-direction: column;
        gap: 0.75rem;
    }
}
</style>
