<template>
    <div class="sysreg-select" :class="{ 'is-disabled': disabled }">
        <label v-if="label" class="select-label">
            {{ label }}
            <span v-if="required" class="required-mark">*</span>
        </label>

        <div class="select-wrapper">
            <select :value="modelValue" @change="handleChange" :disabled="disabled" class="select-input">
                <option v-if="!required" :value="null">
                    {{ placeholder || 'Bitte wählen...' }}
                </option>

                <option v-for="option in options" :key="option.value" :value="option.value">
                    {{ option.label }}
                </option>
            </select>

            <svg class="select-icon" fill="currentColor" height="16" viewBox="0 0 256 256" width="16"
                xmlns="http://www.w3.org/2000/svg">
                <path
                    d="M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z">
                </path>
            </svg>
        </div>

        <p v-if="hint" class="select-hint">{{ hint }}</p>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useSysregOptions } from '@/composables/useSysregOptions'

interface Props {
    modelValue: string | null
    tagfamily: 'status' | 'config' | 'rtags' | 'ctags' | 'ttags' | 'dtags'
    label?: string
    placeholder?: string
    hint?: string
    required?: boolean
    disabled?: boolean
    entity?: string        // Optional: filter by entity type
    defaultValue?: string  // Default BYTEA value to select
}

const props = withDefaults(defineProps<Props>(), {
    label: '',
    placeholder: '',
    hint: '',
    required: false,
    disabled: false,
    entity: undefined,
    defaultValue: undefined
})

const emit = defineEmits<{
    'update:modelValue': [value: string | null]
    'change': [option: { value: string; name: string; label: string }]
}>()

// Get options for the tagfamily
const { getOptions, cacheInitialized, initCache } = useSysregOptions(props.entity)

const options = computed(() => {
    return getOptions(props.tagfamily).value
})

// Handle selection change
function handleChange(event: Event) {
    const target = event.target as HTMLSelectElement
    const value = target.value === '' ? null : target.value

    emit('update:modelValue', value)

    // Emit change event with full option data
    if (value) {
        const option = options.value.find(opt => opt.value === value)
        if (option) {
            emit('change', {
                value: option.value,
                name: option.name,
                label: option.label
            })
        }
    }
}

// Initialize cache and set default value
onMounted(async () => {
    if (!cacheInitialized.value) {
        await initCache()
    }

    // Set default value if provided and no value selected
    if (props.defaultValue && !props.modelValue) {
        emit('update:modelValue', props.defaultValue)
    }
})
</script>

<style scoped>
.sysreg-select {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.select-label {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--color-text);
}

.required-mark {
    color: var(--color-danger, #ef4444);
    margin-left: 0.25rem;
}

.select-wrapper {
    position: relative;
    display: flex;
    align-items: center;
}

.select-input {
    width: 100%;
    padding: 0.625rem 2.5rem 0.625rem 0.75rem;
    font-size: 0.875rem;
    line-height: 1.25rem;
    color: var(--color-text);
    background-color: var(--color-background);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-input, 6px);
    outline: none;
    transition: all 0.2s ease;
    appearance: none;
    cursor: pointer;
}

.select-input:hover:not(:disabled) {
    border-color: var(--color-primary, #3b82f6);
}

.select-input:focus {
    border-color: var(--color-primary, #3b82f6);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.select-input:disabled {
    background-color: var(--color-background-soft);
    color: var(--color-dimmed);
    cursor: not-allowed;
    opacity: 0.6;
}

.select-icon {
    position: absolute;
    right: 0.75rem;
    pointer-events: none;
    color: var(--color-dimmed);
    transition: transform 0.2s ease;
}

.select-input:focus~.select-icon {
    color: var(--color-primary, #3b82f6);
}

.select-hint {
    font-size: 0.75rem;
    color: var(--color-dimmed);
    margin: 0;
}

.is-disabled {
    opacity: 0.6;
    pointer-events: none;
}
</style>
