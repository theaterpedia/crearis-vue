<template>
    <div v-if="isOpen" class="image-preview-modal-overlay" @click.self="handleClose">
        <div class="image-preview-modal">
            <div class="modal-header">
                <h3>{{ image?.xmlid || 'Image Preview' }}</h3>
                <div class="header-actions">
                    <button v-if="!isEditMode" class="btn-toggle" @click="toggleFullResolution"
                        :title="isFullResolution ? 'Show optimized' : 'Show full resolution'">
                        <svg v-if="!isFullResolution" fill="currentColor" height="20" viewBox="0 0 256 256" width="20"
                            xmlns="http://www.w3.org/2000/svg">
                            <path
                                d="M224,48H32a8,8,0,0,0-8,8V192a8,8,0,0,0,8,8H224a8,8,0,0,0,8-8V56A8,8,0,0,0,224,48Zm-8,136H40V64H216ZM96,136a8,8,0,0,1-8,8H72v16a8,8,0,0,1-16,0V136a8,8,0,0,1,8-8H88A8,8,0,0,1,96,136Zm104,0v24a8,8,0,0,1-8,8H168a8,8,0,0,1-8-8,8,8,0,0,1,8-8h16V136a8,8,0,0,1,16,0ZM96,96v24a8,8,0,0,1-8,8H64a8,8,0,0,1,0-16H80V96a8,8,0,0,1,16,0Zm104,0a8,8,0,0,1-8,8H176v16a8,8,0,0,1-16,0V96a8,8,0,0,1,8-8h24A8,8,0,0,1,200,96Z" />
                        </svg>
                        <svg v-else fill="currentColor" height="20" viewBox="0 0 256 256" width="20"
                            xmlns="http://www.w3.org/2000/svg">
                            <path
                                d="M168,48V88a8,8,0,0,1-16,0V67.31l-26.34,26.35a8,8,0,0,1-11.32-11.32L140.69,56H120a8,8,0,0,1,0-16h40a8,8,0,0,1,8,8Zm-53.66,93.66L88,168v-20.69a8,8,0,0,0-16,0V168a8,8,0,0,0,8,8h40a8,8,0,0,0,0-16H99.31l26.35-26.34a8,8,0,0,0-11.32-11.32ZM208,40H48A16,16,0,0,0,32,56V200a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V56A16,16,0,0,0,208,40Zm0,160H48V56H208V200Z" />
                        </svg>
                    </button>
                    <button v-if="editable && !isEditMode" class="btn-edit" @click="enterEditMode" title="Edit image">
                        <svg fill="currentColor" height="20" viewBox="0 0 256 256" width="20"
                            xmlns="http://www.w3.org/2000/svg">
                            <path
                                d="M227.31,73.37,182.63,28.68a16,16,0,0,0-22.63,0L36.69,152A15.86,15.86,0,0,0,32,163.31V208a16,16,0,0,0,16,16H92.69A15.86,15.86,0,0,0,104,219.31L227.31,96a16,16,0,0,0,0-22.63ZM92.69,208H48V163.31l88-88L180.69,120ZM192,108.68,147.31,64l24-24L216,84.68Z" />
                        </svg>
                    </button>
                    <button class="btn-close" @click="handleClose">×</button>
                </div>
            </div>
            <div class="modal-body">
                <div class="image-container" :class="{ 'full-resolution': isFullResolution }">
                    <img v-if="transformUrl" :key="imageKey" :src="transformUrl" :alt="image?.alt_text || image?.xmlid"
                        @error="handleImageError" />
                    <div v-else class="loading-spinner">
                        <div class="spinner"></div>
                        <p>Loading image...</p>
                    </div>
                </div>

                <!-- View Mode: Read-only details -->
                <div v-if="!isEditMode" class="image-details">
                    <div class="detail-row">
                        <span class="detail-label">XMLID:</span>
                        <span class="detail-value">{{ image?.xmlid }}</span>
                    </div>
                    <div v-if="image?.author" class="detail-row">
                        <span class="detail-label">Author:</span>
                        <span class="detail-value">
                            {{ typeof image.author === 'string' ? image.author : image.author.name || 'Unknown' }}
                        </span>
                    </div>
                    <div v-if="image?.owner" class="detail-row">
                        <span class="detail-label">Image Admin:</span>
                        <span class="detail-value">User #{{ image.owner }}</span>
                    </div>
                    <div v-if="image?.project" class="detail-row">
                        <span class="detail-label">Project:</span>
                        <span class="detail-value">{{ image.project }}</span>
                    </div>
                    <div v-if="image?.alt_text" class="detail-row">
                        <span class="detail-label">Alt Text:</span>
                        <span class="detail-value">{{ image.alt_text }}</span>
                    </div>
                    <!-- Tag Families Display (no resources) -->
                    <div class="detail-row detail-row-tags">
                        <span class="detail-label">Tags:</span>
                        <TagFamilies :ttags="imageTtags" :ctags="imageCtags" :dtags="imageDtags" :rtags="0"
                            layout="wrap" />
                    </div>
                </div>

                <!-- Edit Mode: Editable form -->
                <div v-else class="image-edit-form">
                    <div class="form-group">
                        <label class="form-label">XMLID</label>
                        <input v-model="editForm.xmlid" type="text" class="form-input" placeholder="Image identifier" />
                    </div>

                    <div class="form-group">
                        <label class="form-label">Author</label>
                        <input v-model="editForm.author" type="text" class="form-input" placeholder="Author name" />
                    </div>

                    <div class="form-group">
                        <label class="form-label">Image Admin</label>
                        <select v-model="editForm.owner" class="form-select">
                            <option :value="image?.owner">User #{{ image?.owner }} (current)</option>
                            <!-- TODO: Load project users -->
                        </select>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Alt Text</label>
                        <input v-model="editForm.alt_text" type="text" class="form-input"
                            placeholder="Alternative text for accessibility" />
                    </div>

                    <!-- Tag Families Editor (no resources - rtags excluded) -->
                    <div class="form-group">
                        <label class="form-label">Tags</label>
                        <div class="tags-editor">
                            <TagFamilies :ttags="editForm.ttags" :ctags="editForm.ctags" :dtags="editForm.dtags"
                                :rtags="0" layout="wrap" :editable="true" @update:ttags="editForm.ttags = $event"
                                @update:ctags="editForm.ctags = $event" @update:dtags="editForm.dtags = $event" />
                            <p class="form-hint">Click tags to toggle. Resources tag family is hidden.</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Action Bar (Edit Mode only) -->
            <div v-if="isEditMode" class="modal-actions">
                <button class="btn-cancel" @click="cancelEdit" :disabled="isSaving">
                    Abbrechen
                </button>
                <button class="btn-save" @click="saveChanges" :disabled="isSaving || !hasChanges">
                    <span v-if="isSaving" class="btn-spinner"></span>
                    {{ isSaving ? 'Speichern...' : 'Speichern' }}
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, reactive } from 'vue'
import { useTheme } from '@/composables/useTheme'
import TagFamilies from '@/components/sysreg/TagFamilies.vue'

interface ImageData {
    id: number
    xmlid: string
    owner: number
    project?: string
    author?: any
    alt_text?: string
    ttags?: number
    ctags?: number
    dtags?: number
    rtags?: number
    url?: string
    img_source?: any
    img_wide?: any
    img_square?: any
    img_tall?: any
}

interface Props {
    isOpen: boolean
    image: ImageData | null
    fullResolution?: boolean
    editable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    fullResolution: false,
    editable: false
})

const emit = defineEmits<{
    'update:isOpen': [value: boolean]
    'save': [imageData: Partial<ImageData>]
}>()

const { cardWidth } = useTheme()
const isFullResolution = ref(props.fullResolution)
const imageKey = ref(0)
const isEditMode = ref(false)
const isSaving = ref(false)

// Edit form state
const editForm = reactive({
    xmlid: '',
    author: '',
    owner: 0,
    alt_text: '',
    ttags: 0,
    ctags: 0,
    dtags: 0
})

// Original values for change detection
const originalForm = reactive({
    xmlid: '',
    author: '',
    owner: 0,
    alt_text: '',
    ttags: 0,
    ctags: 0,
    dtags: 0
})

// Computed tag values from image data (rtags excluded - no resources)
const imageTtags = computed(() => props.image?.ttags ?? 0)
const imageCtags = computed(() => props.image?.ctags ?? 0)
const imageDtags = computed(() => props.image?.dtags ?? 0)

// Check if form has changes
const hasChanges = computed(() => {
    return editForm.xmlid !== originalForm.xmlid ||
        editForm.author !== originalForm.author ||
        editForm.owner !== originalForm.owner ||
        editForm.alt_text !== originalForm.alt_text ||
        editForm.ttags !== originalForm.ttags ||
        editForm.ctags !== originalForm.ctags ||
        editForm.dtags !== originalForm.dtags
})

// Transform URL: Show full resolution from images.url if fullResolution=true, otherwise use img_wide or fallback shapes
const transformUrl = computed(() => {
    if (!props.image) return null

    // If fullResolution is true, return the full resolution URL from images.url
    if (isFullResolution.value && props.image.url) {
        return props.image.url
    }

    // Prefer img_wide, then fall back to other shapes
    const imageFields = [
        props.image.img_wide,
        props.image.img_square,
        props.image.img_tall,
        props.image.img_source
    ]

    for (const imgData of imageFields) {
        if (!imgData) continue

        try {
            const sourceData = typeof imgData === 'string'
                ? JSON.parse(imgData)
                : imgData

            if (sourceData.url) {
                return sourceData.url
            }
        } catch (e) {
            console.error('Failed to parse image data:', e)
        }
    }

    return null
})

const handleClose = () => {
    if (isEditMode.value && hasChanges.value) {
        if (!confirm('Änderungen verwerfen?')) {
            return
        }
    }
    isEditMode.value = false
    emit('update:isOpen', false)
}

const toggleFullResolution = () => {
    isFullResolution.value = !isFullResolution.value
    imageKey.value++ // Force image reload
}

const handleImageError = () => {
    console.error('Failed to load image')
}

// Edit mode functions
const enterEditMode = () => {
    if (!props.image) return

    // Populate form with current values
    const authorName = typeof props.image.author === 'string'
        ? props.image.author
        : props.image.author?.name || ''

    editForm.xmlid = props.image.xmlid || ''
    editForm.author = authorName
    editForm.owner = props.image.owner || 0
    editForm.alt_text = props.image.alt_text || ''
    editForm.ttags = props.image.ttags || 0
    editForm.ctags = props.image.ctags || 0
    editForm.dtags = props.image.dtags || 0

    // Store original values
    originalForm.xmlid = editForm.xmlid
    originalForm.author = editForm.author
    originalForm.owner = editForm.owner
    originalForm.alt_text = editForm.alt_text
    originalForm.ttags = editForm.ttags
    originalForm.ctags = editForm.ctags
    originalForm.dtags = editForm.dtags

    isEditMode.value = true
}

const cancelEdit = () => {
    if (hasChanges.value) {
        if (!confirm('Änderungen verwerfen?')) {
            return
        }
    }
    isEditMode.value = false
}

const saveChanges = async () => {
    if (!props.image || !hasChanges.value) return

    isSaving.value = true

    try {
        const updateData: Partial<ImageData> = {
            id: props.image.id,
            xmlid: editForm.xmlid,
            author: editForm.author,
            owner: editForm.owner,
            alt_text: editForm.alt_text,
            ttags: editForm.ttags,
            ctags: editForm.ctags,
            dtags: editForm.dtags
        }

        // API call to save
        const response = await fetch(`/api/images/${props.image.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updateData)
        })

        if (!response.ok) {
            throw new Error('Failed to save image')
        }

        emit('save', updateData)
        isEditMode.value = false
    } catch (error) {
        console.error('Failed to save image:', error)
        alert('Fehler beim Speichern')
    } finally {
        isSaving.value = false
    }
}

// Reset scroll on open
watch(() => props.isOpen, (isOpen: boolean) => {
    if (isOpen) {
        document.body.style.overflow = 'hidden'
        isEditMode.value = false // Reset edit mode when opening
    } else {
        document.body.style.overflow = ''
    }
})

// Sync internal state with prop
watch(() => props.fullResolution, (newVal: boolean) => {
    isFullResolution.value = newVal
})

// Reset edit mode when image changes
watch(() => props.image?.id, () => {
    isEditMode.value = false
})
</script>

<style scoped>
.image-preview-modal-overlay {
    position: fixed;
    inset: 0;
    background: oklch(0 0 0 / 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2000;
    padding: 1rem;
}

.image-preview-modal {
    width: 90vw;
    max-width: 900px;
    max-height: 90vh;
    background: var(--color-card-bg);
    border-radius: var(--radius-large);
    box-shadow: 0 8px 32px oklch(0 0 0 / 0.3);
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    border-bottom: 1px solid var(--color-border);
    background: var(--color-muted-bg);
}

.header-actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.modal-header h3 {
    margin: 0;
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--color-contrast);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.btn-toggle {
    width: 2rem;
    height: 2rem;
    border: none;
    background: transparent;
    cursor: pointer;
    border-radius: var(--radius-small);
    transition: background 0.2s ease;
    color: var(--color-contrast);
    display: flex;
    align-items: center;
    justify-content: center;
}

.btn-toggle:hover {
    background: var(--color-muted-bg);
}

.btn-close {
    width: 2rem;
    height: 2rem;
    border: none;
    background: transparent;
    font-size: 1.75rem;
    line-height: 1;
    cursor: pointer;
    border-radius: var(--radius-small);
    transition: background 0.2s ease;
    color: var(--color-contrast);
}

.btn-close:hover {
    background: var(--color-muted-bg);
}

.modal-body {
    flex: 1;
    overflow-y: auto;
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.image-container {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 400px;
    background: var(--color-muted-bg);
    border-radius: var(--radius-medium);
    overflow: hidden;
}

.image-container:not(.full-resolution) {
    max-width: var(--card-width, 21rem);
    margin: 0 auto;
}

.image-container img {
    max-width: 100%;
    max-height: 70vh;
    object-fit: contain;
    border-radius: var(--radius-small);
}

.loading-spinner {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    padding: 4rem;
}

.spinner {
    width: 40px;
    height: 40px;
    border: 4px solid var(--color-border);
    border-top-color: var(--color-primary-bg);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

.loading-spinner p {
    color: var(--color-muted-contrast);
    font-size: 0.875rem;
}

.image-details {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding: 1rem;
    background: var(--color-muted-bg);
    border-radius: var(--radius-medium);
}

.detail-row {
    display: flex;
    gap: 1rem;
    font-size: 0.875rem;
}

.detail-row-tags {
    flex-direction: column;
    gap: 0.5rem;
    padding-top: 0.5rem;
    border-top: 1px solid var(--color-border);
}

.detail-label {
    font-weight: 600;
    color: var(--color-contrast);
    min-width: 100px;
}

.detail-value {
    color: var(--color-muted-contrast);
    flex: 1;
    word-break: break-word;
}

.tag {
    padding: 0.25rem 0.75rem;
    background: var(--color-primary-bg);
    color: var(--color-primary-contrast);
    border-radius: 4px;
    font-weight: 600;
    font-size: 0.75rem;
}

/* Edit Button */
.btn-edit {
    width: 2rem;
    height: 2rem;
    border: none;
    background: transparent;
    cursor: pointer;
    border-radius: var(--radius-small);
    transition: background 0.2s ease;
    color: var(--color-primary-bg);
    display: flex;
    align-items: center;
    justify-content: center;
}

.btn-edit:hover {
    background: var(--color-primary-bg);
    color: var(--color-primary-contrast);
}

/* Edit Form */
.image-edit-form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
    background: var(--color-muted-bg);
    border-radius: var(--radius-medium);
}

.form-group {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
}

.form-label {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--color-contrast);
    text-transform: uppercase;
    letter-spacing: 0.025em;
}

.form-input,
.form-select {
    padding: 0.625rem 0.75rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-small);
    font-size: 0.875rem;
    background: var(--color-card-bg);
    color: var(--color-contrast);
    transition: border-color 0.2s ease;
}

.form-input:focus,
.form-select:focus {
    outline: none;
    border-color: var(--color-primary-bg);
}

.form-hint {
    font-size: 0.75rem;
    color: var(--color-dimmed);
    margin: 0.25rem 0 0;
}

.tags-editor {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

/* Action Bar */
.modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    padding: 1rem 1.5rem;
    border-top: 1px solid var(--color-border);
    background: var(--color-muted-bg);
}

.btn-cancel {
    padding: 0.625rem 1.25rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-small);
    background: transparent;
    color: var(--color-contrast);
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
}

.btn-cancel:hover:not(:disabled) {
    background: var(--color-muted-bg);
    border-color: var(--color-dimmed);
}

.btn-cancel:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.btn-save {
    padding: 0.625rem 1.25rem;
    border: none;
    border-radius: var(--radius-small);
    background: var(--color-primary-bg);
    color: var(--color-primary-contrast);
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.btn-save:hover:not(:disabled) {
    filter: brightness(1.1);
}

.btn-save:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.btn-spinner {
    width: 1rem;
    height: 1rem;
    border: 2px solid currentColor;
    border-top-color: transparent;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
}

/* Tablet: 900px */
@media (max-width: 900px) {
    .image-preview-modal {
        max-width: 95vw;
    }

    .modal-body {
        padding: 1rem;
    }

    .image-container {
        min-height: 300px;
    }
}

/* Mobile: 640px */
@media (max-width: 640px) {
    .image-preview-modal-overlay {
        padding: 0.5rem;
    }

    .image-preview-modal {
        max-height: 95vh;
    }

    .modal-header {
        padding: 1rem;
    }

    .modal-header h3 {
        font-size: 0.875rem;
    }

    .modal-body {
        padding: 0.75rem;
        gap: 1rem;
    }

    .image-container {
        min-height: 200px;
    }

    .image-details {
        padding: 0.75rem;
    }

    .detail-row {
        flex-direction: column;
        gap: 0.25rem;
    }

    .detail-label {
        min-width: auto;
    }
}
</style>
