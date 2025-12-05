<template>
    <BasePanel :is-open="isOpen" :title="title" :subtitle="subtitle" :sidebar-mode="sidebarMode" @close="handleClose">
        <form @submit.prevent="handleSave" class="edit-form">
            <!-- Heading + Header Type Row -->
            <div class="form-row">
                <div class="form-group form-group-flex">
                    <label class="form-label" for="edit-heading">
                        Heading
                        <span class="required">*</span>
                    </label>
                    <input id="edit-heading" v-model="formData.heading" type="text" class="form-input"
                        placeholder="Enter heading..." required />
                </div>
                <!-- Header Type disabled
                <div class="form-group form-group-fixed">
                    <label class="form-label" for="edit-header-type">Header Type</label>
                    <select id="edit-header-type" v-model="formData.header_type" class="form-select">
                        <option value="">Default</option>
                        <option value="hero">Hero</option>
                        <option value="banner">Banner</option>
                        <option value="minimal">Minimal</option>
                    </select>
                </div> -->
            </div>

            <!-- Status and Image Selection Row -->
            <div class="form-row">
                <div class="form-group form-group-flex">
                    <label class="form-label" for="edit-status">Status</label>
                    <select id="edit-status" v-model="formData.status" class="form-input">
                        <option :value="null">-- Select status --</option>
                        <option v-for="status in availableStatuses" :key="status.hex_value" :value="status.raw_value">
                            {{ status.display_name }}
                        </option>
                    </select>
                </div>
                
                <div class="form-group form-group-flex">
                    <label class="form-label">Cover Image</label>
                    <DropdownList 
                        entity="images"
                        title="Select Cover Image"
                        :project="projectDomaincode"
                        size="small"
                        width="medium"
                        :dataMode="true"
                        :multiSelect="false"
                        v-model:selectedIds="formData.img_id"
                        :displayXml="true"
                    />
                </div>
            </div>

            <!-- Teaser -->
            <div class="form-group">
                <label class="form-label" for="edit-teaser">Teaser</label>
                <textarea id="edit-teaser" v-model="formData.teaser" class="form-textarea" rows="3"
                    placeholder="Brief description..."></textarea>
            </div>

            <!-- Header Size (if available) -->
            <div v-if="hasField('header_size')" class="form-group">
                <label class="form-label" for="edit-header-size">Header Size</label>
                <select id="edit-header-size" v-model="formData.header_size" class="form-select">
                    <option :value="null">Default</option>
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                </select>
            </div>

            <!-- Markdown Content -->
            <div class="form-group">
                <label class="form-label" for="edit-md">
                    Content (Markdown)
                    <span class="field-hint">Supports **bold**, *italic*, and basic markdown</span>
                </label>
                <textarea id="edit-md" v-model="formData.md" class="form-textarea form-textarea-large" rows="12"
                    placeholder="# Your content here..."></textarea>
            </div>

            <!-- Extension Fields Slot -->
            <slot name="extension-fields" :formData="formData" />

            <!-- Sysreg Tags -->
            <SysregTagDisplay v-model:all-tags="allTags" v-model:config-visibility="configVisibility"
                v-model:age-group="ageGroup" v-model:subject-type="subjectType" v-model:core-themes="coreThemes"
                v-model:domains="domains" />

            <!-- Action Buttons -->
            <div class="form-actions">
                <button type="button" class="btn-secondary" @click="handleClose" :disabled="isSaving">
                    Cancel
                </button>
                <button type="submit" class="btn-primary" :disabled="isSaving">
                    <span v-if="isSaving" class="btn-spinner"></span>
                    <span>{{ isSaving ? 'Saving...' : 'Save Changes' }}</span>
                </button>
            </div>
        </form>
    </BasePanel>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import BasePanel from './BasePanel.vue'
import SysregTagDisplay from './sysreg/SysregTagDisplay.vue'
import { DropdownList } from '@/components/clist'
import { sanitizeStatusVal } from '@/composables/useSysreg'

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
    entityType?: string // Entity table name (e.g., 'posts', 'events', 'projects')
    projectDomaincode?: string // Project domaincode for filtering images
}

const props = withDefaults(defineProps<Props>(), {
    sidebarMode: 'none',
    availableFields: () => ['heading', 'teaser', 'cimg', 'header_type', 'md'],
    entityType: 'posts' // Default to posts
})

const emit = defineEmits<{
    close: []
    save: [data: EditPanelData]
}>()

const anchorRef = ref<HTMLElement>()
const formData = ref<EditPanelData>({ ...props.data })
const isSaving = ref(false)
const imageError = ref(false)
const isInitializing = ref(false)
const availableStatuses = ref<Array<{ hex_value: string; raw_value: any; display_name: string; name: string }>>([])
const allTags = ref(false)
const configVisibility = ref(0)
const ageGroup = ref(0)
const subjectType = ref(0)
const coreThemes = ref('\\x00')
const domains = ref('\\x00')

// Check if screen height is small (hide image preview if < 900px)
const isSmallHeight = computed(() => {
    if (typeof window === 'undefined') return false
    return window.innerHeight < 900
})

// Check if field is available
function hasField(fieldName: string): boolean {
    return props.availableFields.includes(fieldName)
}

// Handle close (delegated to BasePanel)
function handleClose() {
    emit('close')
}

// Load available statuses for the entity type
async function loadStatuses() {
    try {
        const response = await fetch(`/api/sysreg/status?family=${props.entityType}`)
        if (!response.ok) throw new Error('Failed to load statuses')
        const data = await response.json()
        // Map status items to display format
        availableStatuses.value = (data.items || []).map((item: any) => {
            const hexValue = item.value || '0000'
            const displayName = item.displayNameDe || item.name || `Status 0x${hexValue}`
            return {
                hex_value: hexValue,
                raw_value: item.value,
                display_name: displayName,
                name: item.name
            }
        })
    } catch (error) {
        console.error('[EditPanel] Error loading statuses:', error)
        availableStatuses.value = []
    }
}

// Handle save
function handleSave() {
    isSaving.value = true
    
    // Sanitize data to prevent NULL bytes and ensure proper types
    const saveData: any = {
        ...formData.value,
        ttags: coreThemes.value,
        ctags: String.fromCharCode(configVisibility.value | (ageGroup.value << 2) | (subjectType.value << 4)),
        dtags: domains.value
    }
    
    // Ensure img_id is a valid number or null (not undefined or 0)
    if (saveData.img_id === undefined || saveData.img_id === 0) {
        saveData.img_id = null
    }
    
    // Properly sanitize status_val to prevent Buffer stringification
    saveData.status = sanitizeStatusVal(saveData.status)
    
    emit('save', saveData)
}

// Handle image load error
function handleImageError() {
    imageError.value = true
}

// Watch for data changes from parent
watch(() => props.data, (newData) => {
    formData.value = { ...newData }
}, { deep: true })

// Reset form when panel opens/closes
watch(() => props.isOpen, (isOpen) => {
    if (isOpen) {
        isInitializing.value = true
        formData.value = { ...props.data }
        imageError.value = false
        isSaving.value = false
        loadStatuses()
        // Clear initialization flag after components have mounted
        setTimeout(() => {
            isInitializing.value = false
        }, 500)
    } else {
        // Reset saving state when closing
        isSaving.value = false
        isInitializing.value = false
    }
})
</script>

<style scoped>
/* Form Styles */
.edit-form {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.form-row {
    display: flex;
    gap: 1rem;
    align-items: flex-start;
}

.form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.form-group-flex {
    flex: 1;
    min-width: 0;
}

.form-group-fixed {
    width: 120px;
    flex-shrink: 0;
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

/* Filter Row Styles */
.filter-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-top: -0.5rem;
}

.filter-label {
    font-size: 0.75rem;
    font-weight: 500;
    color: var(--color-dimmed);
    white-space: nowrap;
}

.filter-input {
    flex: 1;
    padding: 0.375rem 0.75rem;
    font-size: 0.8125rem;
    border: 1px solid var(--color-border);
    border-radius: 0.375rem;
    background-color: var(--color-background);
    color: var(--color-text);
    transition: border-color 0.15s ease-in-out;
}

.filter-input:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* DropdownList integration */
.form-group :deep(.dropdown-trigger) {
    width: 100%;
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
