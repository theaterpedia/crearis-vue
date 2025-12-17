<template>
    <div class="slug-editor">
        <!-- Template Selection (optional) -->
        <div v-if="showTemplate" class="slug-editor-row">
            <label class="slug-label">{{ templateLabel }}</label>
            <div class="template-select-wrapper">
                <select v-model="selectedTemplate" class="template-select" @change="emitUpdate">
                    <option value="">{{ noTemplateText }}</option>
                    <option v-for="tmpl in availableTemplates" :key="tmpl" :value="tmpl">
                        {{ formatTemplate(tmpl) }}
                    </option>
                </select>
            </div>
        </div>

        <!-- Slug Input -->
        <div class="slug-editor-row">
            <label class="slug-label">{{ slugLabel }}</label>
            <div class="slug-input-wrapper">
                <input type="text" v-model="slugValue" class="slug-input" :placeholder="slugPlaceholder"
                    @input="handleSlugInput" @blur="sanitizeSlug" />
                <button v-if="showGenerate && title" type="button" class="generate-btn" @click="generateFromTitle"
                    title="Aus Titel generieren">
                    <svg fill="currentColor" height="16" viewBox="0 0 256 256" width="16"
                        xmlns="http://www.w3.org/2000/svg">
                        <path
                            d="M197.67,186.37a8,8,0,0,1,0,11.29C196.58,198.73,170.82,224,128,224c-37.39,0-64.53-22.4-80-39.85V208a8,8,0,0,1-16,0V160a8,8,0,0,1,8-8H88a8,8,0,0,1,0,16H55.44C67.76,183.35,93,208,128,208c36,0,58.14-21.46,58.36-21.68A8,8,0,0,1,197.67,186.37ZM216,40a8,8,0,0,0-8,8V71.85C192.53,54.4,165.39,32,128,32,85.18,32,59.42,57.27,58.34,58.34a8,8,0,0,0,11.3,11.34C69.86,69.46,92,48,128,48c35,0,60.24,24.65,72.56,40H168a8,8,0,0,0,0,16h48a8,8,0,0,0,8-8V48A8,8,0,0,0,216,40Z">
                        </path>
                    </svg>
                </button>
            </div>
            <small v-if="slugError" class="slug-error">{{ slugError }}</small>
        </div>

        <!-- XMLID Preview -->
        <div v-if="showPreview" class="slug-preview">
            <span class="preview-label">xmlid:</span>
            <code class="preview-value">{{ previewXmlid }}</code>
        </div>

        <!-- Page Type Preview (for page options) -->
        <div v-if="showPageType && (selectedTemplate || entity)" class="page-type-preview">
            <span class="preview-label">page_type:</span>
            <code class="preview-value">{{ pageTypePreview }}</code>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import {
    generateSlug,
    buildXmlid,
    isValidSlug,
    ENTITY_TEMPLATES,
    type EntityType
} from '@/utils/xmlid'

interface Props {
    /** Current domaincode (project) */
    domaincode: string
    /** Entity type: post, event, image, partner */
    entity: EntityType
    /** Current template value (v-model) */
    modelValue?: { template?: string; slug: string }
    /** Title to generate slug from */
    title?: string
    /** Show template dropdown */
    showTemplate?: boolean
    /** Show generate button */
    showGenerate?: boolean
    /** Show xmlid preview */
    showPreview?: boolean
    /** Show page_type preview */
    showPageType?: boolean
    /** Custom available templates */
    templates?: string[]
    /** Labels */
    templateLabel?: string
    slugLabel?: string
    slugPlaceholder?: string
    noTemplateText?: string
}

const props = withDefaults(defineProps<Props>(), {
    showTemplate: true,
    showGenerate: true,
    showPreview: true,
    showPageType: false,
    templateLabel: 'Variante',
    slugLabel: 'Slug',
    slugPlaceholder: 'mein_artikel',
    noTemplateText: '(keine)'
})

const emit = defineEmits<{
    (e: 'update:modelValue', value: { template?: string; slug: string }): void
}>()

// Local state
const selectedTemplate = ref<string>(props.modelValue?.template || '')
const slugValue = ref<string>(props.modelValue?.slug || '')
const slugError = ref<string>('')

// Available templates for this entity
const availableTemplates = computed(() => {
    if (props.templates && props.templates.length > 0) {
        return props.templates
    }
    return ENTITY_TEMPLATES[props.entity] || []
})

// Preview xmlid
const previewXmlid = computed(() => {
    if (!props.domaincode || !slugValue.value) {
        return `${props.domaincode || '?'}.${props.entity}${selectedTemplate.value ? `-${selectedTemplate.value}` : ''}__...`
    }
    return buildXmlid({
        domaincode: props.domaincode,
        entity: props.entity,
        template: selectedTemplate.value || undefined,
        slug: slugValue.value
    })
})

// Preview page_type
const pageTypePreview = computed(() => {
    if (selectedTemplate.value) {
        return `${props.entity}-${selectedTemplate.value}`
    }
    return props.entity
})

// Format template for display
function formatTemplate(tmpl: string): string {
    return tmpl.charAt(0).toUpperCase() + tmpl.slice(1)
}

// Handle slug input - sanitize on the fly
function handleSlugInput() {
    // Remove hyphens immediately
    slugValue.value = slugValue.value.replace(/-/g, '_')
    validateSlug()
    emitUpdate()
}

// Full sanitize on blur
function sanitizeSlug() {
    if (slugValue.value) {
        slugValue.value = generateSlug(slugValue.value)
    }
    validateSlug()
    emitUpdate()
}

// Validate slug
function validateSlug() {
    slugError.value = ''

    if (!slugValue.value) {
        return
    }

    if (slugValue.value.includes('-')) {
        slugError.value = 'Bindestriche nicht erlaubt, verwende Unterstriche'
        return
    }

    if (slugValue.value.includes('__')) {
        slugError.value = 'Doppelte Unterstriche nicht erlaubt'
        return
    }

    if (!isValidSlug(slugValue.value)) {
        slugError.value = 'Nur Kleinbuchstaben, Zahlen und einzelne Unterstriche'
    }
}

// Generate slug from title
function generateFromTitle() {
    if (props.title) {
        slugValue.value = generateSlug(props.title)
        validateSlug()
        emitUpdate()
    }
}

// Emit update to parent
function emitUpdate() {
    emit('update:modelValue', {
        template: selectedTemplate.value || undefined,
        slug: slugValue.value
    })
}

// Watch for external changes
watch(() => props.modelValue, (newVal) => {
    if (newVal) {
        selectedTemplate.value = newVal.template || ''
        slugValue.value = newVal.slug || ''
    }
}, { deep: true })

// Initialize from title if no slug provided
onMounted(() => {
    if (!slugValue.value && props.title) {
        generateFromTitle()
    }
})
</script>

<style scoped>
.slug-editor {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.slug-editor-row {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.slug-label {
    font-size: 0.75rem;
    font-weight: 500;
    color: var(--color-dimmed, #6b7280);
}

.template-select-wrapper,
.slug-input-wrapper {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.template-select,
.slug-input {
    flex: 1;
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--color-border, #e5e7eb);
    border-radius: 6px;
    font-size: 0.875rem;
    background: var(--color-background, #fff);
    color: var(--color-text, #111);
}

.template-select:focus,
.slug-input:focus {
    outline: none;
    border-color: var(--color-primary, #3b82f6);
}

.generate-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    padding: 0;
    border: 1px solid var(--color-border, #e5e7eb);
    border-radius: 6px;
    background: var(--color-background-soft, #f9fafb);
    color: var(--color-dimmed, #6b7280);
    cursor: pointer;
    transition: all 0.2s;
}

.generate-btn:hover {
    background: var(--color-primary, #3b82f6);
    color: white;
    border-color: var(--color-primary, #3b82f6);
}

.slug-error {
    font-size: 0.75rem;
    color: var(--color-error, #ef4444);
}

.slug-preview,
.page-type-preview {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    background: var(--color-background-soft, #f9fafb);
    border-radius: 6px;
    font-size: 0.75rem;
}

.preview-label {
    color: var(--color-dimmed, #6b7280);
}

.preview-value {
    font-family: monospace;
    font-size: 0.75rem;
    color: var(--color-primary, #3b82f6);
    background: transparent;
}
</style>
