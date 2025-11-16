<!-- HeaderOptionsPanel.vue - Edit header options for projects -->
<template>
    <div class="options-panel">
        <h3 class="panel-title">Header Options</h3>

        <div class="field-group">
            <h4>Basic Options</h4>

            <div class="field-row">
                <label for="header_alert">Alert Banner</label>
                <textarea id="header_alert" v-model="localData.header_alert" rows="3"
                    placeholder="Alert message (markdown supported)" @input="emitChange"></textarea>
            </div>
        </div>

        <div class="field-group">
            <h4>Post-it Note (JSON)</h4>
            <JsonFieldEditor v-model="localData.header_postit" :fields="postitFields" @update:modelValue="emitChange" />
        </div>

        <div class="field-group">
            <h4>Extended Options (JSON)</h4>
            <JsonFieldEditor v-model="localData.header_options_ext" :fields="extendedFields"
                @update:modelValue="emitChange" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import JsonFieldEditor from './JsonFieldEditor.vue'

interface HeaderOptions {
    header_alert?: string
    header_postit?: Record<string, any>
    header_options_ext?: Record<string, any>
}

interface Props {
    modelValue: HeaderOptions
}

interface Emits {
    (e: 'update:modelValue', value: HeaderOptions): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const localData = ref<HeaderOptions>({ ...props.modelValue })

const postitFields = [
    { key: 'enabled', type: 'Boolean' as const },
    { key: 'title', type: 'Text' as const },
    { key: 'content', type: 'Textarea' as const },
    { key: 'position', type: 'Select' as const, options: ['top-left', 'top-right', 'center'] },
    { key: 'color', type: 'Select' as const, options: ['yellow', 'blue', 'green', 'pink'] }
]

const extendedFields = [
    { key: 'sticky', type: 'Boolean' as const },
    { key: 'transparent', type: 'Boolean' as const },
    { key: 'height', type: 'Text' as const },
    { key: 'custom_class', type: 'Text' as const }
]

watch(() => props.modelValue, (newValue) => {
    localData.value = { ...newValue }
}, { deep: true })

function emitChange() {
    emit('update:modelValue', { ...localData.value })
}
</script>

<style scoped>
.options-panel {
    padding: 1.5rem;
}

.panel-title {
    font-family: var(--headings);
    font-size: 1.5rem;
    color: var(--color-card-contrast);
    margin-bottom: 1.5rem;
}

.field-group {
    margin-bottom: 2rem;
}

.field-group h4 {
    font-family: var(--headings);
    font-size: 1.125rem;
    color: var(--color-card-contrast);
    margin-bottom: 1rem;
}

.field-row {
    display: grid;
    grid-template-columns: 200px 1fr;
    gap: 1rem;
    align-items: start;
    margin-bottom: 1rem;
}

.field-row label {
    font-family: var(--headings);
    font-weight: 500;
    color: var(--color-card-contrast);
    padding-top: 0.5rem;
}

.field-row textarea {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid var(--color-border);
    border-radius: 0.375rem;
    font-family: inherit;
    font-size: 1rem;
    background: var(--color-card-bg);
    color: var(--color-card-contrast);
    resize: vertical;
}

@media (max-width: 768px) {
    .field-row {
        grid-template-columns: 1fr;
    }
}
</style>
