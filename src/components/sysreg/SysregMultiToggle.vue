<template>
    <div class="sysreg-multi-toggle" :class="{ 'is-disabled': disabled || readonly }">
        <label v-if="label" class="toggle-label">
            {{ label }}
            <span v-if="maxSelection" class="selection-count">({{ selectedCount }}/{{ maxSelection }})</span>
        </label>

        <div class="toggle-grid" :class="gridClass">
            <label v-for="option in displayOptions" :key="option.value" class="toggle-option" :class="{
                'is-active': isSelected(option.value),
                'is-disabled': isDisabled(option.value)
            }">
                <input type="checkbox" :checked="isSelected(option.value)"
                    :disabled="disabled || readonly || isDisabled(option.value)" @change="toggleOption(option.value)"
                    class="toggle-input" />
                <span class="toggle-content">
                    <svg v-if="showCheckmark && isSelected(option.value)" class="checkmark" fill="currentColor"
                        height="16" viewBox="0 0 256 256" width="16" xmlns="http://www.w3.org/2000/svg">
                        <path
                            d="M229.66,77.66l-128,128a8,8,0,0,1-11.32,0l-56-56a8,8,0,0,1,11.32-11.32L96,188.69,218.34,66.34a8,8,0,0,1,11.32,11.32Z" />
                    </svg>
                    <span class="toggle-label-text">{{ option.label }}</span>
                </span>
            </label>
        </div>

        <p v-if="hint" class="toggle-hint">{{ hint }}</p>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useSysregOptions } from '@/composables/useSysregOptions'
import { byteArrayToBits, bitsToByteArray } from '@/composables/useSysregTags'

interface Props {
    modelValue: string | null | undefined  // BYTEA hex string with multiple bits set
    tagfamily: 'config' | 'rtags' | 'ttags' | 'dtags'  // Multi-bit tagfamilies only
    label?: string
    hint?: string
    maxSelection?: number      // Maximum number of tags that can be selected
    minSelection?: number      // Minimum number of tags required
    disabled?: boolean
    readonly?: boolean
    showCheckmark?: boolean    // Show checkmark icon when selected
    columns?: 1 | 2 | 3 | 4    // Grid layout columns
    suggested?: string[]       // Suggested values (highlighted)
}

const props = withDefaults(defineProps<Props>(), {
    label: '',
    hint: '',
    maxSelection: undefined,
    minSelection: 0,
    disabled: false,
    readonly: false,
    showCheckmark: true,
    columns: 2,
    suggested: () => []
})

const emit = defineEmits<{
    'update:modelValue': [value: string]
    'change': [selectedBits: number[], selectedValues: string[]]
}>()

// Get options for the tagfamily
const { getOptions, cacheInitialized, initCache } = useSysregOptions()

const allOptions = computed(() => {
    return getOptions(props.tagfamily).value
})

// Convert current value to bit positions
const selectedBits = computed(() => {
    return byteArrayToBits(props.modelValue || null)
})

const selectedCount = computed(() => selectedBits.value.length)

// Display options (can be filtered or sorted)
const displayOptions = computed(() => {
    // For now, show all options
    // Future: could filter by entity, sort by usage, etc.
    return allOptions.value
})

// Grid layout class
const gridClass = computed(() => {
    return `toggle-grid-${props.columns}`
})

// Check if option is selected
function isSelected(value: string): boolean {
    // Extract bit position from the value (assumes single-bit values in options)
    // For multi-bit toggle, each option represents one bit
    const optionBit = byteArrayToBits(value)[0]
    return selectedBits.value.includes(optionBit)
}

// Check if option should be disabled
function isDisabled(value: string): boolean {
    if (props.disabled || props.readonly) return true

    const optionBit = byteArrayToBits(value)[0]
    const isCurrentlySelected = selectedBits.value.includes(optionBit)

    // Disable if max selection reached and this option is not selected
    if (props.maxSelection && selectedCount.value >= props.maxSelection && !isCurrentlySelected) {
        return true
    }

    // Disable if removing would go below min selection
    if (props.minSelection && selectedCount.value <= props.minSelection && isCurrentlySelected) {
        return true
    }

    return false
}

// Toggle option
function toggleOption(value: string) {
    const optionBit = byteArrayToBits(value)[0]
    const isCurrentlySelected = selectedBits.value.includes(optionBit)

    let newBits: number[]

    if (isCurrentlySelected) {
        // Remove bit
        newBits = selectedBits.value.filter(bit => bit !== optionBit)
    } else {
        // Add bit
        newBits = [...selectedBits.value, optionBit]
    }

    // Convert back to BYTEA hex string
    const newValue = bitsToByteArray(newBits)

    emit('update:modelValue', newValue)
    emit('change', newBits, newBits.map(bit => bitsToByteArray([bit])))
}

// Initialize cache
onMounted(async () => {
    if (!cacheInitialized.value) {
        await initCache()
    }
})
</script>

<style scoped>
.sysreg-multi-toggle {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.toggle-label {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--color-text);
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.selection-count {
    font-size: 0.75rem;
    font-weight: 400;
    color: var(--color-dimmed);
}

.toggle-grid {
    display: grid;
    gap: 0.75rem;
}

.toggle-grid-1 {
    grid-template-columns: 1fr;
}

.toggle-grid-2 {
    grid-template-columns: repeat(2, 1fr);
}

.toggle-grid-3 {
    grid-template-columns: repeat(3, 1fr);
}

.toggle-grid-4 {
    grid-template-columns: repeat(4, 1fr);
}

.toggle-option {
    position: relative;
    display: flex;
    align-items: center;
    padding: 0.75rem;
    background: var(--color-background);
    border: 2px solid var(--color-border);
    border-radius: var(--radius-input, 6px);
    cursor: pointer;
    transition: all 0.2s ease;
    user-select: none;
}

.toggle-option:hover:not(.is-disabled) {
    border-color: var(--color-primary, #3b82f6);
    background: var(--color-background-soft);
}

.toggle-option.is-active {
    border-color: var(--color-primary, #3b82f6);
    background: rgba(59, 130, 246, 0.05);
}

.toggle-option.is-disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background: var(--color-background-soft);
}

.toggle-input {
    position: absolute;
    opacity: 0;
    width: 0;
    height: 0;
}

.toggle-content {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    width: 100%;
}

.checkmark {
    flex-shrink: 0;
    color: var(--color-primary, #3b82f6);
}

.toggle-label-text {
    font-size: 0.875rem;
    color: var(--color-text);
}

.toggle-option.is-active .toggle-label-text {
    font-weight: 500;
    color: var(--color-primary, #3b82f6);
}

.toggle-hint {
    font-size: 0.75rem;
    color: var(--color-dimmed);
    margin: 0;
}

.is-disabled {
    opacity: 0.6;
    pointer-events: none;
}

@media (max-width: 640px) {

    .toggle-grid-2,
    .toggle-grid-3,
    .toggle-grid-4 {
        grid-template-columns: 1fr;
    }
}
</style>
