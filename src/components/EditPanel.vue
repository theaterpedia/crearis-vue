<template>
    <VDropdown :shown="isOpen" :auto-hide="false" :placement="placement" theme="edit-panel" :triggers="[]" :distance="0"
        strategy="fixed" @apply-hide="$emit('close')">
        <!-- Invisible anchor point -->
        <div ref="anchorRef" style="position: fixed; top: 0; right: 0; width: 0; height: 0;"></div>

        <template #popper="{ hide }">
            <div class="edit-panel" :class="`edit-panel-${panelSize}`" :style="panelStyles">
                <!-- Header -->
                <div class="edit-panel-header">
                    <div class="header-content">
                        <h2 class="panel-title">{{ title }}</h2>
                        <p v-if="subtitle" class="panel-subtitle">{{ subtitle }}</p>
                    </div>
                    <button class="close-btn" @click="handleClose(hide)" aria-label="Close">
                        <svg fill="currentColor" height="24" viewBox="0 0 256 256" width="24"
                            xmlns="http://www.w3.org/2000/svg">
                            <path
                                d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z">
                            </path>
                        </svg>
                    </button>
                </div>

                <!-- Body with scroll -->
                <div class="edit-panel-body">
                    <form @submit.prevent="handleSave" class="edit-form">
                        <!-- Heading -->
                        <div class="form-group">
                            <label class="form-label" for="edit-heading">
                                Heading
                                <span class="required">*</span>
                            </label>
                            <input id="edit-heading" v-model="formData.heading" type="text" class="form-input"
                                placeholder="Enter heading..." required />
                        </div>

                        <!-- Teaser -->
                        <div class="form-group">
                            <label class="form-label" for="edit-teaser">Teaser</label>
                            <textarea id="edit-teaser" v-model="formData.teaser" class="form-textarea" rows="3"
                                placeholder="Brief description..."></textarea>
                        </div>

                        <!-- Cover Image URL -->
                        <div class="form-group">
                            <label class="form-label" for="edit-cimg">Cover Image URL</label>
                            <input id="edit-cimg" v-model="formData.cimg" type="url" class="form-input"
                                placeholder="https://..." />
                            <div v-if="formData.cimg" class="image-preview">
                                <img :src="formData.cimg" alt="Preview" @error="handleImageError" />
                            </div>
                        </div>

                        <!-- Header Type -->
                        <div class="form-group">
                            <label class="form-label" for="edit-header-type">Header Type</label>
                            <select id="edit-header-type" v-model="formData.header_type" class="form-select">
                                <option value="">Default</option>
                                <option value="hero">Hero</option>
                                <option value="banner">Banner</option>
                                <option value="minimal">Minimal</option>
                            </select>
                        </div>

                        <!-- Header Size (if available) -->
                        <div v-if="hasField('header_size')" class="form-group">
                            <label class="form-label" for="edit-header-size">Header Size</label>
                            <select id="edit-header-size" v-model="formData.header_size" class="form-select">
                                <option value="">Default</option>
                                <option value="small">Small</option>
                                <option value="medium">Medium</option>
                                <option value="large">Large</option>
                                <option value="full">Full</option>
                            </select>
                        </div>

                        <!-- Markdown Content -->
                        <div class="form-group">
                            <label class="form-label" for="edit-md">
                                Content (Markdown)
                                <span class="field-hint">Supports **bold**, *italic*, and basic markdown</span>
                            </label>
                            <textarea id="edit-md" v-model="formData.md" class="form-textarea form-textarea-large"
                                rows="12" placeholder="# Your content here..."></textarea>
                        </div>

                        <!-- Extension Fields Slot -->
                        <slot name="extension-fields" :formData="formData" />

                        <!-- Action Buttons -->
                        <div class="form-actions">
                            <button type="button" class="btn-secondary" @click="handleClose(hide)" :disabled="isSaving">
                                Cancel
                            </button>
                            <button type="submit" class="btn-primary" :disabled="isSaving">
                                <span v-if="isSaving" class="btn-spinner"></span>
                                <span>{{ isSaving ? 'Saving...' : 'Save Changes' }}</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </template>
    </VDropdown>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useTheme } from '@/composables/useTheme'

export interface EditPanelData {
    heading: string
    teaser?: string
    cimg?: string
    header_type?: string
    header_size?: string
    md?: string
    [key: string]: any // Allow extension fields
}

interface Props {
    isOpen: boolean
    title: string
    subtitle?: string
    data: EditPanelData
    sidebarMode?: 'left' | 'right' | 'none'
    availableFields?: string[] // Optional list of available fields
}

const props = withDefaults(defineProps<Props>(), {
    sidebarMode: 'none',
    availableFields: () => ['heading', 'teaser', 'cimg', 'header_type', 'md']
})

const emit = defineEmits<{
    close: []
    save: [data: EditPanelData]
}>()

const anchorRef = ref<HTMLElement>()
const formData = ref<EditPanelData>({ ...props.data })
const isSaving = ref(false)
const imageError = ref(false)

// Get theme composable
const { currentVars, isInverted } = useTheme()

// Auto-adjust placement based on sidebar mode
const placement = computed(() => {
    if (props.sidebarMode === 'left') return 'left'
    return 'right'
})

// Responsive panel size
const panelSize = computed(() => {
    if (typeof window === 'undefined') return 'medium'
    const width = window.innerWidth
    if (width < 768) return 'fullscreen'
    if (width < 1440) return 'medium'
    return 'large'
})

// Apply system theme styles to panel (override page theme)
const panelStyles = computed(() => {
    // Use system default styles, not the current page theme
    return {
        '--color-bg': 'var(--system-bg, #ffffff)',
        '--color-card-bg': 'var(--system-card-bg, #ffffff)',
        '--color-border': 'var(--system-border, #e5e7eb)',
        '--color-contrast': 'var(--system-contrast, #1f2937)',
        '--color-dimmed': 'var(--system-dimmed, #6b7280)',
        '--color-primary-bg': 'var(--system-primary, #3b82f6)',
        '--color-primary-contrast': 'var(--system-primary-contrast, #ffffff)',
        '--font': 'var(--system-font, system-ui, -apple-system, sans-serif)',
        '--color-inverted': '0' // Always use non-inverted in editor
    }
})

// Check if field is available
function hasField(fieldName: string): boolean {
    return props.availableFields.includes(fieldName)
}

// Handle close
function handleClose(hideFn: () => void) {
    hideFn()
    emit('close')
}

// Handle save
async function handleSave() {
    isSaving.value = true
    try {
        // Emit save event with form data
        emit('save', { ...formData.value })
        await new Promise(resolve => setTimeout(resolve, 500)) // Simulate API delay
    } finally {
        isSaving.value = false
    }
}

// Handle image load error
function handleImageError() {
    imageError.value = true
}

// Watch for data changes from parent
watch(() => props.data, (newData) => {
    formData.value = { ...newData }
}, { deep: true })

// Reset form when panel opens
watch(() => props.isOpen, (isOpen) => {
    if (isOpen) {
        formData.value = { ...props.data }
        imageError.value = false
    }
})
</script>

<style scoped>
/* Panel Container */
.edit-panel {
    position: fixed;
    top: 0;
    bottom: 0;
    background: var(--color-bg);
    box-shadow: -4px 0 24px rgba(0, 0, 0, 0.15);
    display: flex;
    flex-direction: column;
    z-index: 1000;
    font-family: var(--font);
}

.edit-panel-fullscreen {
    left: 0;
    right: 0;
    width: 100%;
}

.edit-panel-medium {
    width: 25rem;
    /* 400px */
    right: 0;
}

.edit-panel-large {
    width: 37.5rem;
    /* 600px */
    right: 0;
}

/* Panel on left side */
.edit-panel[style*="left"] {
    left: 0;
    right: auto;
    box-shadow: 4px 0 24px rgba(0, 0, 0, 0.15);
}

/* Header */
.edit-panel-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    padding: 1.5rem;
    border-bottom: 1px solid var(--color-border);
    background: var(--color-card-bg);
    flex-shrink: 0;
}

.header-content {
    flex: 1;
    min-width: 0;
}

.panel-title {
    margin: 0 0 0.25rem 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--color-contrast);
    font-family: var(--font);
}

.panel-subtitle {
    margin: 0;
    font-size: 0.875rem;
    color: var(--color-dimmed);
}

.close-btn {
    flex-shrink: 0;
    width: 2rem;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    background: none;
    color: var(--color-dimmed);
    cursor: pointer;
    border-radius: 0.375rem;
    transition: all 0.2s;
    margin-left: 1rem;
}

.close-btn:hover {
    background: var(--color-border);
    color: var(--color-contrast);
}

/* Body */
.edit-panel-body {
    flex: 1;
    overflow-y: auto;
    padding: 1.5rem;
}

/* Form */
.edit-form {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.form-label {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-contrast);
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.required {
    color: #ef4444;
}

.field-hint {
    font-size: 0.75rem;
    font-weight: 400;
    color: var(--color-dimmed);
}

.form-input,
.form-textarea,
.form-select {
    width: 100%;
    padding: 0.625rem 0.875rem;
    font-size: 0.9375rem;
    line-height: 1.5;
    color: var(--color-contrast);
    background: var(--color-card-bg);
    border: 1px solid var(--color-border);
    border-radius: 0.375rem;
    transition: all 0.2s;
    font-family: var(--font);
}

.form-input:focus,
.form-textarea:focus,
.form-select:focus {
    outline: none;
    border-color: var(--color-primary-bg);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-textarea {
    resize: vertical;
    min-height: 4rem;
}

.form-textarea-large {
    min-height: 12rem;
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', monospace;
    font-size: 0.875rem;
}

.form-select {
    cursor: pointer;
}

/* Image Preview */
.image-preview {
    margin-top: 0.5rem;
    border: 1px solid var(--color-border);
    border-radius: 0.375rem;
    overflow: hidden;
    max-width: 100%;
}

.image-preview img {
    width: 100%;
    height: auto;
    max-height: 12rem;
    object-fit: cover;
    display: block;
}

/* Form Actions */
.form-actions {
    display: flex;
    gap: 0.75rem;
    padding-top: 1rem;
    border-top: 1px solid var(--color-border);
    margin-top: 1rem;
}

.btn-primary,
.btn-secondary {
    flex: 1;
    padding: 0.75rem 1.5rem;
    font-size: 0.9375rem;
    font-weight: 600;
    border-radius: 0.375rem;
    border: none;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    font-family: var(--font);
}

.btn-primary {
    background: var(--color-primary-bg);
    color: var(--color-primary-contrast);
}

.btn-primary:hover:not(:disabled) {
    opacity: 0.9;
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.25);
}

.btn-primary:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.btn-secondary {
    background: transparent;
    color: var(--color-contrast);
    border: 1px solid var(--color-border);
}

.btn-secondary:hover:not(:disabled) {
    background: var(--color-border);
}

.btn-secondary:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

/* Spinner */
.btn-spinner {
    width: 1rem;
    height: 1rem;
    border: 2px solid currentColor;
    border-right-color: transparent;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

/* Responsive */
@media (max-width: 767px) {
    .edit-panel-header {
        padding: 1rem;
    }

    .edit-panel-body {
        padding: 1rem;
    }

    .panel-title {
        font-size: 1.125rem;
    }

    .form-actions {
        flex-direction: column;
    }

    .btn-primary,
    .btn-secondary {
        width: 100%;
    }
}

/* Scrollbar styling */
.edit-panel-body::-webkit-scrollbar {
    width: 0.5rem;
}

.edit-panel-body::-webkit-scrollbar-track {
    background: transparent;
}

.edit-panel-body::-webkit-scrollbar-thumb {
    background: var(--color-border);
    border-radius: 0.25rem;
}

.edit-panel-body::-webkit-scrollbar-thumb:hover {
    background: var(--color-dimmed);
}
</style>
