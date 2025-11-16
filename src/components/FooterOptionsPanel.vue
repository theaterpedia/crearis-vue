<!-- FooterOptionsPanel.vue - Edit footer options for projects -->
<template>
    <div class="options-panel">
        <h3 class="panel-title">Footer Options</h3>

        <div class="field-group">
            <h4>Basic Options</h4>

            <div class="field-row">
                <label for="footer_gallery">Gallery</label>
                <select id="footer_gallery" v-model="localData.footer_gallery" @change="emitChange">
                    <option value="">Disabled</option>
                    <option value="recent">Recent Images</option>
                    <option value="featured">Featured Images</option>
                    <option value="custom">Custom Gallery</option>
                </select>
            </div>

            <div class="field-row">
                <label for="footer_slider">Slider</label>
                <select id="footer_slider" v-model="localData.footer_slider" @change="emitChange">
                    <option value="">Disabled</option>
                    <option value="partners">Partner Logos</option>
                    <option value="testimonials">Testimonials</option>
                    <option value="custom">Custom Slider</option>
                </select>
            </div>

            <div class="field-row">
                <label for="footer_sitemap">Sitemap</label>
                <select id="footer_sitemap" v-model="localData.footer_sitemap" @change="emitChange">
                    <option value="">Disabled</option>
                    <option value="simple">Simple</option>
                    <option value="detailed">Detailed</option>
                    <option value="columns">Multi-column</option>
                </select>
            </div>
        </div>

        <div class="field-group">
            <h4>Post-it Note (JSON)</h4>
            <JsonFieldEditor v-model="localData.footer_postit" :fields="postitFields" @update:modelValue="emitChange" />
        </div>

        <div class="field-group">
            <h4>Repeat Section (JSON)</h4>
            <JsonFieldEditor v-model="localData.footer_repeat" :fields="repeatFields" @update:modelValue="emitChange" />
        </div>

        <div class="field-group">
            <h4>Extended Options (JSON)</h4>
            <JsonFieldEditor v-model="localData.footer_options_ext" :fields="extendedFields"
                @update:modelValue="emitChange" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import JsonFieldEditor from './JsonFieldEditor.vue'

interface FooterOptions {
    footer_gallery?: string
    footer_slider?: string
    footer_sitemap?: string
    footer_postit?: Record<string, any>
    footer_repeat?: Record<string, any>
    footer_options_ext?: Record<string, any>
}

interface Props {
    modelValue: FooterOptions
}

interface Emits {
    (e: 'update:modelValue', value: FooterOptions): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const localData = ref<FooterOptions>({ ...props.modelValue })

const postitFields = [
    { key: 'enabled', type: 'Boolean' as const },
    { key: 'title', type: 'Text' as const },
    { key: 'content', type: 'Textarea' as const },
    { key: 'color', type: 'Select' as const, options: ['yellow', 'blue', 'green', 'pink'] }
]

const repeatFields = [
    { key: 'enabled', type: 'Boolean' as const },
    { key: 'section_type', type: 'Select' as const, options: ['cta', 'newsletter', 'contact', 'social'] },
    { key: 'columns', type: 'Number' as const },
    { key: 'custom_content', type: 'Textarea' as const }
]

const extendedFields = [
    { key: 'fixed', type: 'Boolean' as const },
    { key: 'height', type: 'Text' as const },
    { key: 'background', type: 'Text' as const },
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

.field-row select {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid var(--color-border);
    border-radius: 0.375rem;
    font-family: inherit;
    font-size: 1rem;
    background: var(--color-card-bg);
    color: var(--color-card-contrast);
}

@media (max-width: 768px) {
    .field-row {
        grid-template-columns: 1fr;
    }
}
</style>
