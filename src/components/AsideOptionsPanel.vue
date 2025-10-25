<!-- AsideOptionsPanel.vue - Edit sidebar/aside options for projects -->
<template>
    <div class="options-panel">
        <h3 class="panel-title">Aside Options</h3>

        <div class="field-group">
            <h4>Basic Options</h4>

            <div class="field-row">
                <label for="aside_toc">Table of Contents</label>
                <select id="aside_toc" v-model="localData.aside_toc" @change="emitChange">
                    <option value="">Disabled</option>
                    <option value="auto">Auto-generate</option>
                    <option value="manual">Manual</option>
                </select>
            </div>

            <div class="field-row">
                <label for="aside_list">List Type</label>
                <select id="aside_list" v-model="localData.aside_list" @change="emitChange">
                    <option value="">None</option>
                    <option value="related">Related Items</option>
                    <option value="recent">Recent Items</option>
                    <option value="popular">Popular Items</option>
                </select>
            </div>

            <div class="field-row">
                <label for="aside_context">Context Info</label>
                <textarea id="aside_context" v-model="localData.aside_context" rows="3"
                    placeholder="Additional context (markdown supported)" @input="emitChange"></textarea>
            </div>
        </div>

        <div class="field-group">
            <h4>Post-it Note (JSON)</h4>
            <JsonFieldEditor v-model="localData.aside_postit" :fields="postitFields" @update:modelValue="emitChange" />
        </div>

        <div class="field-group">
            <h4>Extended Options (JSON)</h4>
            <JsonFieldEditor v-model="localData.aside_options_ext" :fields="extendedFields"
                @update:modelValue="emitChange" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import JsonFieldEditor from './JsonFieldEditor.vue'

interface AsideOptions {
    aside_toc?: string
    aside_list?: string
    aside_context?: string
    aside_postit?: Record<string, any>
    aside_options_ext?: Record<string, any>
}

interface Props {
    modelValue: AsideOptions
}

interface Emits {
    (e: 'update:modelValue', value: AsideOptions): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const localData = ref<AsideOptions>({ ...props.modelValue })

const postitFields = [
    { key: 'enabled', type: 'Boolean' as const },
    { key: 'title', type: 'Text' as const },
    { key: 'content', type: 'Textarea' as const },
    { key: 'color', type: 'Select' as const, options: ['yellow', 'blue', 'green', 'pink'] }
]

const extendedFields = [
    { key: 'sticky', type: 'Boolean' as const },
    { key: 'position', type: 'Select' as const, options: ['left', 'right'] },
    { key: 'width', type: 'Text' as const },
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
