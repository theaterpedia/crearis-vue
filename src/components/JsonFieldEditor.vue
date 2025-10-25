<!-- JsonFieldEditor.vue - CRUD operations on simple JSON fields -->
<template>
    <div class="json-field-editor">
        <div v-for="field in fields" :key="field.key" class="field-row">
            <label :for="field.key" class="field-label">
                {{ formatLabel(field.key) }}
            </label>

            <!-- Boolean: Checkbox -->
            <div v-if="field.type === 'Boolean'" class="field-input">
                <input :id="field.key" type="checkbox" :checked="localData[field.key] || false"
                    @change="updateField(field.key, ($event.target as HTMLInputElement).checked)" />
            </div>

            <!-- Text: Single line input -->
            <div v-else-if="field.type === 'Text'" class="field-input">
                <input :id="field.key" type="text" :value="localData[field.key] || ''"
                    @input="updateField(field.key, ($event.target as HTMLInputElement).value)" />
            </div>

            <!-- Number: Number input -->
            <div v-else-if="field.type === 'Number'" class="field-input">
                <input :id="field.key" type="number" :value="localData[field.key] || 0"
                    @input="updateField(field.key, parseFloat(($event.target as HTMLInputElement).value))" />
            </div>

            <!-- Textarea: Multi-line input -->
            <div v-else-if="field.type === 'Textarea'" class="field-input">
                <textarea :id="field.key" :value="localData[field.key] || ''" rows="4"
                    @input="updateField(field.key, ($event.target as HTMLTextAreaElement).value)"></textarea>
            </div>

            <!-- Select: Dropdown -->
            <div v-else-if="field.type === 'Select'" class="field-input">
                <select :id="field.key" :value="localData[field.key] || ''"
                    @change="updateField(field.key, ($event.target as HTMLSelectElement).value)">
                    <option value="">-- Select --</option>
                    <option v-for="option in field.options" :key="option" :value="option">
                        {{ option }}
                    </option>
                </select>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

interface FieldDefinition {
    key: string
    type: 'Boolean' | 'Text' | 'Select' | 'Textarea' | 'Number'
    options?: string[]
}

interface Props {
    fields: FieldDefinition[]
    modelValue: Record<string, any>
}

interface Emits {
    (e: 'update:modelValue', value: Record<string, any>): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Local copy of data
const localData = ref<Record<string, any>>({ ...props.modelValue })

// Watch for external changes
watch(() => props.modelValue, (newValue) => {
    localData.value = { ...newValue }
}, { deep: true })

// Update field and emit change
function updateField(key: string, value: any) {
    localData.value[key] = value
    emit('update:modelValue', { ...localData.value })
}

// Format label from key (snake_case to Title Case)
function formatLabel(key: string): string {
    return key
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
}
</script>

<style scoped>
.json-field-editor {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.field-row {
    display: grid;
    grid-template-columns: 200px 1fr;
    gap: 1rem;
    align-items: start;
}

.field-label {
    font-family: var(--headings);
    font-weight: 500;
    color: var(--color-card-contrast);
    padding-top: 0.5rem;
}

.field-input {
    display: flex;
}

.field-input input[type="text"],
.field-input input[type="number"],
.field-input select,
.field-input textarea {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid var(--color-border);
    border-radius: 0.375rem;
    font-family: inherit;
    font-size: 1rem;
    background: var(--color-card-bg);
    color: var(--color-card-contrast);
}

.field-input input[type="checkbox"] {
    width: 1.25rem;
    height: 1.25rem;
    cursor: pointer;
}

.field-input textarea {
    resize: vertical;
    min-height: 4rem;
}

.field-input input:focus,
.field-input select:focus,
.field-input textarea:focus {
    outline: 2px solid var(--color-accent-bg);
    outline-offset: 2px;
}

@media (max-width: 768px) {
    .field-row {
        grid-template-columns: 1fr;
    }
}
</style>
