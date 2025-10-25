<!-- PageOptionsPanel.vue - Edit page-level options for projects -->
<template>
    <div class="options-panel">
        <h3 class="panel-title">Page Options</h3>

        <div class="field-group">
            <h4>Basic Options</h4>

            <div class="field-row">
                <label for="page_background">Background</label>
                <input id="page_background" v-model="localData.page_background" type="text"
                    placeholder="CSS background value" @input="emitChange" />
            </div>

            <div class="field-row">
                <label for="page_cssvars">CSS Variables</label>
                <textarea id="page_cssvars" v-model="localData.page_cssvars" rows="4"
                    placeholder="--var-name: value;" @input="emitChange"></textarea>
            </div>

            <div class="field-row">
                <label for="page_navigation">Navigation</label>
                <select id="page_navigation" v-model="localData.page_navigation" @change="emitChange">
                    <option value="">Default</option>
                    <option value="sidebar">Sidebar</option>
                    <option value="tabs">Tabs</option>
                    <option value="breadcrumb">Breadcrumb</option>
                </select>
            </div>
        </div>

        <div class="field-group">
            <h4>Extended Options (JSON)</h4>
            <JsonFieldEditor v-model="localData.page_options_ext" :fields="extendedFields" @update:modelValue="emitChange" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import JsonFieldEditor from './JsonFieldEditor.vue'

interface PageOptions {
    page_background?: string
    page_cssvars?: string
    page_navigation?: string
    page_options_ext?: Record<string, any>
}

interface Props {
    modelValue: PageOptions
}

interface Emits {
    (e: 'update:modelValue', value: PageOptions): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const localData = ref<PageOptions>({ ...props.modelValue })

const extendedFields = [
    { key: 'fullwidth', type: 'Boolean' as const },
    { key: 'max_width', type: 'Number' as const },
    { key: 'padding', type: 'Text' as const },
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

.field-row input,
.field-row select,
.field-row textarea {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid var(--color-border);
    border-radius: 0.375rem;
    font-family: inherit;
    font-size: 1rem;
    background: var(--color-card-bg);
    color: var(--color-card-contrast);
}

.field-row textarea {
    resize: vertical;
}

@media (max-width: 768px) {
    .field-row {
        grid-template-columns: 1fr;
    }
}
</style>
