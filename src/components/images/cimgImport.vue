<script setup lang="ts">
import { ref, computed } from 'vue'
import { Dropdown } from 'floating-vue'
import tagsMultiToggle from './tagsMultiToggle.vue'

interface ImportedImage {
    url: string
    previewUrl: string
    status: 'pending' | 'loading' | 'success' | 'error'
}

const props = defineProps<{
    isOpen: boolean
}>()

const emit = defineEmits<{
    'update:isOpen': [value: boolean]
    save: [images: ImportedImage[]]
}>()

// Form state
const urlInput = ref('')
const importedImages = ref<ImportedImage[]>([])
const selectedProject = ref<number | null>(null)
const selectedOwner = ref<number | null>(null)
const ctags = ref<number[]>([])
const rtags = ref<number[]>([])
const keepOpen = ref(false)

// Mock data for dropdowns
const projects = ref([
    { id: 1, name: 'Project Alpha' },
    { id: 2, name: 'Project Beta' },
    { id: 3, name: 'Project Gamma' }
])

const owners = ref([
    { id: 1, name: 'John Doe' },
    { id: 2, name: 'Jane Smith' },
    { id: 3, name: 'Bob Johnson' }
])

// Mock tag options
const ctagOptions = [
    { label: 'Nature', value: 1 },
    { label: 'Architecture', value: 2 },
    { label: 'People', value: 3 },
    { label: 'Technology', value: 4 }
]

const rtagOptions = [
    { label: 'Featured', value: 10 },
    { label: 'Hero', value: 20 },
    { label: 'Thumbnail', value: 30 },
    { label: 'Background', value: 40 }
]

// Validate URL
const isValidUrl = (url: string) => {
    try {
        new URL(url)
        return true
    } catch {
        return false
    }
}

// Add URL to import list
const addUrl = () => {
    const url = urlInput.value.trim()
    if (!url || !isValidUrl(url)) {
        alert('Please enter a valid URL')
        return
    }

    // Check if already added
    if (importedImages.value.some(img => img.url === url)) {
        alert('This URL is already in the list')
        return
    }

    // Add to list
    importedImages.value.push({
        url,
        previewUrl: url,
        status: 'pending'
    })

    urlInput.value = ''
}

// Remove image from list
const removeImage = (index: number) => {
    importedImages.value.splice(index, 1)
}

// Handle save
const handleSave = () => {
    if (importedImages.value.length === 0) {
        alert('Please add at least one image URL')
        return
    }

    if (!selectedProject.value || !selectedOwner.value) {
        alert('Please select a project and owner')
        return
    }

    emit('save', importedImages.value)

    if (!keepOpen.value) {
        handleClose()
    } else {
        // Clear only the images, keep other settings
        importedImages.value = []
        urlInput.value = ''
    }
}

// Handle close
const handleClose = () => {
    emit('update:isOpen', false)
    // Reset form
    setTimeout(() => {
        urlInput.value = ''
        importedImages.value = []
        selectedProject.value = null
        selectedOwner.value = null
        ctags.value = []
        rtags.value = []
        keepOpen.value = false
    }, 300)
}

// Computed validation
const canSave = computed(() => {
    return importedImages.value.length > 0 &&
        selectedProject.value !== null &&
        selectedOwner.value !== null
})
</script>

<template>
    <Dropdown :shown="isOpen" :triggers="[]" :autoHide="false" placement="center">
        <template #popper>
            <div class="cimg-import-modal">
                <div class="modal-header">
                    <h3>Import Images from URLs</h3>
                    <button class="btn-close" @click="handleClose">×</button>
                </div>

                <div class="modal-content">
                    <!-- URL input -->
                    <div class="form-section">
                        <label>Image URL</label>
                        <div class="url-input-group">
                            <input v-model="urlInput" type="url" placeholder="https://example.com/image.jpg"
                                @keydown.enter="addUrl" class="url-input" />
                            <button class="btn-add" @click="addUrl">Add</button>
                        </div>
                    </div>

                    <!-- Image previews list -->
                    <div v-if="importedImages.length > 0" class="preview-list">
                        <div class="preview-list-header">
                            <span>{{ importedImages.length }} image(s)</span>
                            <button class="btn-clear-all" @click="importedImages = []">
                                Clear all
                            </button>
                        </div>
                        <div class="preview-grid">
                            <div v-for="(image, index) in importedImages" :key="index" class="preview-item">
                                <img :src="image.previewUrl" alt="Preview" class="preview-image" loading="lazy" />
                                <button class="btn-remove-image" @click="removeImage(index)" aria-label="Remove image">
                                    ×
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Project and owner selection -->
                    <div class="form-row">
                        <div class="form-group">
                            <label>Project</label>
                            <select v-model="selectedProject" class="form-select">
                                <option :value="null">Select project...</option>
                                <option v-for="project in projects" :key="project.id" :value="project.id">
                                    {{ project.name }}
                                </option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label>Owner</label>
                            <select v-model="selectedOwner" class="form-select">
                                <option :value="null">Select owner...</option>
                                <option v-for="owner in owners" :key="owner.id" :value="owner.id">
                                    {{ owner.name }}
                                </option>
                            </select>
                        </div>
                    </div>

                    <!-- Tags -->
                    <div class="form-section">
                        <label>Content Tags (ctags)</label>
                        <tagsMultiToggle v-model="ctags" mode="free" :availableTags="ctagOptions"
                            placeholder="Select content tags..." />
                    </div>

                    <div class="form-section">
                        <label>Role Tags (rtags)</label>
                        <tagsMultiToggle v-model="rtags" mode="choose-one" :availableTags="rtagOptions"
                            placeholder="Select role tag..." />
                    </div>

                    <!-- Keep open checkbox -->
                    <div class="form-section">
                        <label class="checkbox-label">
                            <input v-model="keepOpen" type="checkbox" />
                            <span>Keep me open after save (for batch imports)</span>
                        </label>
                    </div>
                </div>

                <div class="modal-footer">
                    <button class="btn-cancel" @click="handleClose">
                        Cancel
                    </button>
                    <button class="btn-save" :disabled="!canSave" @click="handleSave">
                        Save {{ importedImages.length }} image(s)
                    </button>
                </div>
            </div>
        </template>
    </Dropdown>
</template>

<style scoped>
.cimg-import-modal {
    width: 90vw;
    max-width: 700px;
    max-height: 85vh;
    background: hsl(var(--color-card-bg));
    border-radius: var(--radius-large);
    box-shadow: 0 8px 32px hsla(0, 0%, 0%, 0.2);
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    border-bottom: 1px solid hsl(var(--color-border));
}

.modal-header h3 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
}

.btn-close {
    width: 2rem;
    height: 2rem;
    border: none;
    background: transparent;
    font-size: 1.5rem;
    cursor: pointer;
    border-radius: var(--radius-small);
    transition: background var(--duration) var(--ease);
}

.btn-close:hover {
    background: hsl(var(--color-muted-bg));
}

.modal-content {
    flex: 1;
    overflow-y: auto;
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.form-section {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.form-section label,
.form-group label {
    font-size: 0.875rem;
    font-weight: 600;
    color: hsl(var(--color-text));
}

.url-input-group {
    display: flex;
    gap: 0.5rem;
}

.url-input {
    flex: 1;
    padding: 0.75rem;
    border: 1px solid hsl(var(--color-border));
    border-radius: var(--radius-medium);
    background: hsl(var(--color-card-bg));
    font-size: 0.875rem;
}

.btn-add {
    padding: 0.75rem 1.5rem;
    background: hsl(var(--color-primary-base));
    color: hsl(var(--color-primary-contrast));
    border: none;
    border-radius: var(--radius-medium);
    font-weight: 600;
    cursor: pointer;
    transition: opacity var(--duration) var(--ease);
}

.btn-add:hover {
    opacity: 0.9;
}

.preview-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
    background: hsl(var(--color-muted-bg));
    border-radius: var(--radius-medium);
}

.preview-list-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.875rem;
}

.btn-clear-all {
    padding: 0.25rem 0.75rem;
    background: transparent;
    border: 1px solid hsl(var(--color-border));
    border-radius: var(--radius-small);
    font-size: 0.75rem;
    cursor: pointer;
    transition: all var(--duration) var(--ease);
}

.btn-clear-all:hover {
    background: hsl(var(--color-danger-bg));
    color: hsl(var(--color-danger-contrast));
    border-color: hsl(var(--color-danger));
}

.preview-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
    gap: 1rem;
}

.preview-item {
    position: relative;
    aspect-ratio: 17 / 10;
    border-radius: var(--radius-small);
    overflow: hidden;
    background: hsl(var(--color-card-bg));
}

.preview-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.btn-remove-image {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    width: 1.5rem;
    height: 1.5rem;
    border: none;
    background: hsla(0, 0%, 0%, 0.7);
    color: white;
    border-radius: 50%;
    font-size: 1.25rem;
    line-height: 1;
    cursor: pointer;
    opacity: 0;
    transition: opacity var(--duration) var(--ease);
}

.preview-item:hover .btn-remove-image {
    opacity: 1;
}

.form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
}

.form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.form-select {
    padding: 0.75rem;
    border: 1px solid hsl(var(--color-border));
    border-radius: var(--radius-medium);
    background: hsl(var(--color-card-bg));
    font-size: 0.875rem;
}

.checkbox-label {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    cursor: pointer;
    font-weight: normal;
}

.checkbox-label input[type="checkbox"] {
    width: 1.125rem;
    height: 1.125rem;
    cursor: pointer;
}

.modal-footer {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 1rem;
    padding: 1.5rem;
    border-top: 1px solid hsl(var(--color-border));
    background: hsl(var(--color-muted-bg));
}

.btn-cancel,
.btn-save {
    padding: 0.75rem 1.5rem;
    border-radius: var(--radius-medium);
    font-weight: 600;
    cursor: pointer;
    transition: all var(--duration) var(--ease);
}

.btn-cancel {
    background: transparent;
    border: 1px solid hsl(var(--color-border));
}

.btn-cancel:hover {
    background: hsl(var(--color-muted-bg));
}

.btn-save {
    background: hsl(var(--color-success));
    color: white;
    border: none;
}

.btn-save:hover:not(:disabled) {
    opacity: 0.9;
}

.btn-save:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}
</style>
