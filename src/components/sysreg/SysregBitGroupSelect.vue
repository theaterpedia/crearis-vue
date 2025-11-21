<template>
    <div class="sysreg-bit-group-select" :class="{ 'is-disabled': disabled }">
        <label v-if="displayLabel" class="bit-group-label">
            {{ displayLabel }}
            <span v-if="displayHint" class="label-hint">({{ displayHint }})</span>
        </label>

        <div class="bit-group-options">
            <label v-for="option in options" :key="option.value" class="bit-group-option"
                :class="{ 'is-selected': modelValue === option.value }">
                <input type="radio" :name="`${bitGroup}-${uniqueId}`" :value="option.value"
                    :checked="modelValue === option.value" :disabled="disabled" @change="handleChange(option.value)"
                    class="bit-group-input" />
                <span class="option-content">
                    <span class="option-label">{{ option.label }}</span>
                    <span v-if="option.description" class="option-description">{{ option.description }}</span>
                </span>
            </label>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useSysregOptions } from '@/composables/useSysregOptions'
import { useSysregBitGroups } from '@/composables/useSysregBitGroups'

interface Props {
    modelValue: number         // Current value (0-3)
    bitGroup: 'age_group' | 'subject_type' | 'access_level' | 'quality'
    label?: string
    hint?: string
    disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    label: '',
    hint: '',
    disabled: false
})

const emit = defineEmits<{
    'update:modelValue': [value: number]
    'change': [value: number, label: string]
}>()

// Get bit group options
const { ctagsBitGroupOptions } = useSysregOptions()
const { getBitGroupLabel, getBitGroupDescription, getBitGroupRange } = useSysregBitGroups()

const options = computed(() => {
    return ctagsBitGroupOptions[props.bitGroup].value
})

// Generate unique ID for radio button grouping
const uniqueId = computed(() => {
    return Math.random().toString(36).substring(2, 9)
})

// Use semantic label and hint from bit group config if not provided
const displayLabel = computed(() => {
    if (props.label) return props.label
    return getBitGroupLabel('ctags', props.bitGroup)
})

const displayHint = computed(() => {
    if (props.hint) return props.hint
    const range = getBitGroupRange('ctags', props.bitGroup)
    const desc = getBitGroupDescription('ctags', props.bitGroup)
    return desc || range
})

// Handle selection change
function handleChange(value: number) {
    emit('update:modelValue', value)

    const option = options.value.find(opt => opt.value === value)
    if (option) {
        emit('change', value, option.label)
    }
}
</script>

<style scoped>
.sysreg-bit-group-select {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.bit-group-label {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--color-text);
}

.label-hint {
    font-size: 0.75rem;
    font-weight: 400;
    color: var(--color-dimmed);
    margin-left: 0.25rem;
}

.bit-group-options {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.5rem;
}

.bit-group-option {
    position: relative;
    display: flex;
    align-items: flex-start;
    padding: 0.75rem;
    background: var(--color-background);
    border: 2px solid var(--color-border);
    border-radius: var(--radius-input, 6px);
    cursor: pointer;
    transition: all 0.2s ease;
    user-select: none;
}

.bit-group-option:hover:not(.is-disabled) {
    border-color: var(--color-primary, #3b82f6);
    background: var(--color-background-soft);
}

.bit-group-option.is-selected {
    border-color: var(--color-primary, #3b82f6);
    background: rgba(59, 130, 246, 0.05);
}

.bit-group-input {
    position: absolute;
    opacity: 0;
    width: 0;
    height: 0;
}

.option-content {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    width: 100%;
}

.option-label {
    font-size: 0.875rem;
    color: var(--color-text);
}

.bit-group-option.is-selected .option-label {
    font-weight: 600;
    color: var(--color-primary, #3b82f6);
}

.option-description {
    font-size: 0.75rem;
    color: var(--color-dimmed);
}

.is-disabled {
    opacity: 0.6;
    pointer-events: none;
}

@media (max-width: 640px) {
    .bit-group-options {
        grid-template-columns: 1fr;
    }
}
</style>
