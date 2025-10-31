<template>
    <div class="cimg-editor">
        <div class="editor-header">
            <h3>{{ isNew ? 'Add New Image' : 'Edit Image' }}</h3>
            <button v-if="closeable" @click="$emit('close')" class="close-btn">×</button>
        </div>

        <form @submit.prevent="handleSubmit" class="editor-form">
            <!-- Basic Information -->
            <section class="form-section">
                <h4 class="section-title">Basic Information</h4>

                <div class="form-row">
                    <div class="form-field required">
                        <label for="name">Name</label>
                        <input id="name" v-model="formData.name" type="text" required placeholder="Image name" />
                    </div>

                    <div class="form-field">
                        <label for="xmlid">XML ID</label>
                        <input id="xmlid" v-model="formData.xmlid" type="text" placeholder="Legacy identifier" />
                    </div>
                </div>

                <div class="form-field required">
                    <label for="url">URL</label>
                    <input id="url" v-model="formData.url" type="url" required
                        placeholder="https://example.com/image.jpg" />
                </div>

                <div class="form-row">
                    <div class="form-field">
                        <label for="fileformat">File Format</label>
                        <select id="fileformat" v-model="formData.fileformat">
                            <option value="none">Select format</option>
                            <option value="jpg">JPG</option>
                            <option value="jpeg">JPEG</option>
                            <option value="png">PNG</option>
                            <option value="gif">GIF</option>
                            <option value="webp">WebP</option>
                            <option value="svg">SVG</option>
                            <option value="avif">AVIF</option>
                        </select>
                    </div>

                    <div class="form-field">
                        <label for="mediaformat">Media Format (Video/Audio)</label>
                        <select id="mediaformat" v-model="formData.mediaformat">
                            <option :value="null">None</option>
                            <option value="mp4">MP4</option>
                            <option value="webm">WebM</option>
                            <option value="mp3">MP3</option>
                            <option value="wav">WAV</option>
                        </select>
                    </div>
                </div>
            </section>

            <!-- Project and Ownership -->
            <section class="form-section">
                <h4 class="section-title">Project & Ownership</h4>

                <div class="form-row">
                    <div class="form-field">
                        <label for="domaincode">Project (domaincode)</label>
                        <input id="domaincode" v-model="formData.domaincode" type="text" placeholder="project_name" />
                    </div>

                    <div class="form-field">
                        <label for="owner">Owner (email/username)</label>
                        <input id="owner" v-model="formData.owner" type="text" placeholder="user@example.com" />
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-field">
                        <label for="status_id">Status</label>
                        <select id="status_id" v-model="formData.status_id">
                            <option :value="0">New</option>
                            <option :value="1">Demo</option>
                            <option :value="2">Draft</option>
                            <option :value="4">Done</option>
                            <option :value="16">Trash</option>
                            <option :value="32">Archived</option>
                        </select>
                    </div>

                    <div class="form-field">
                        <label for="provider">Provider</label>
                        <input id="provider" v-model.number="formData.provider" type="number"
                            placeholder="Provider ID" />
                    </div>
                </div>
            </section>

            <!-- Text Content -->
            <section class="form-section">
                <h4 class="section-title">Text Content</h4>

                <div class="form-field">
                    <label for="title">Title</label>
                    <input id="title" v-model="formData.title" type="text" placeholder="Image title" />
                </div>

                <div class="form-field">
                    <label for="alt_text">Alt Text (Accessibility)</label>
                    <textarea id="alt_text" v-model="formData.alt_text" rows="2"
                        placeholder="Description for screen readers"></textarea>
                </div>

                <div class="form-field">
                    <label for="copyright">Copyright</label>
                    <input id="copyright" v-model="formData.copyright" type="text" placeholder="© Copyright info" />
                </div>

                <div class="form-field">
                    <label for="function">Function</label>
                    <input id="function" v-model="formData.function" type="text" placeholder="Image function/purpose" />
                </div>
            </section>

            <!-- Properties -->
            <section class="form-section">
                <h4 class="section-title">Properties</h4>

                <div class="form-row">
                    <div class="form-field">
                        <label for="x">Width (px)</label>
                        <input id="x" v-model.number="formData.x" type="number" placeholder="Width" />
                    </div>

                    <div class="form-field">
                        <label for="y">Height (px)</label>
                        <input id="y" v-model.number="formData.y" type="number" placeholder="Height" />
                    </div>
                </div>

                <div class="flags-grid">
                    <label class="checkbox-field">
                        <input v-model="formData.has_video" type="checkbox" />
                        Has Video
                    </label>
                    <label class="checkbox-field">
                        <input v-model="formData.has_audio" type="checkbox" />
                        Has Audio
                    </label>
                    <label class="checkbox-field">
                        <input v-model="formData.is_public" type="checkbox" />
                        Public
                    </label>
                    <label class="checkbox-field">
                        <input v-model="formData.is_private" type="checkbox" />
                        Private
                    </label>
                    <label class="checkbox-field">
                        <input v-model="formData.is_dark" type="checkbox" />
                        Dark Theme
                    </label>
                    <label class="checkbox-field">
                        <input v-model="formData.is_light" type="checkbox" />
                        Light Theme
                    </label>
                </div>
            </section>

            <!-- Tags -->
            <section class="form-section">
                <h4 class="section-title">Tags</h4>
                <cimg-tags v-model="formData.tags" />
            </section>

            <!-- Crop Coordinates -->
            <section class="form-section">
                <h4 class="section-title">Crop Coordinates</h4>
                <p class="section-description">
                    x, y: position (0-100%), z: zoom level (default 100)
                </p>

                <div class="crop-sections">
                    <!-- Avatar Crop -->
                    <div class="crop-group">
                        <h5>Avatar (64x64)</h5>
                        <div class="form-row">
                            <div class="form-field">
                                <label for="av_x">X</label>
                                <input id="av_x" v-model.number="formData.av_x" type="number" min="0" max="100"
                                    placeholder="0-100" />
                            </div>
                            <div class="form-field">
                                <label for="av_y">Y</label>
                                <input id="av_y" v-model.number="formData.av_y" type="number" min="0" max="100"
                                    placeholder="0-100" />
                            </div>
                            <div class="form-field">
                                <label for="av_z">Zoom</label>
                                <input id="av_z" v-model.number="formData.av_z" type="number" min="1"
                                    placeholder="100" />
                            </div>
                        </div>
                    </div>

                    <!-- Card Crop -->
                    <div class="crop-group">
                        <h5>Card (320x180)</h5>
                        <div class="form-row">
                            <div class="form-field">
                                <label for="ca_x">X</label>
                                <input id="ca_x" v-model.number="formData.ca_x" type="number" min="0" max="100"
                                    placeholder="0-100" />
                            </div>
                            <div class="form-field">
                                <label for="ca_y">Y</label>
                                <input id="ca_y" v-model.number="formData.ca_y" type="number" min="0" max="100"
                                    placeholder="0-100" />
                            </div>
                            <div class="form-field">
                                <label for="ca_z">Zoom</label>
                                <input id="ca_z" v-model.number="formData.ca_z" type="number" min="1"
                                    placeholder="100" />
                            </div>
                        </div>
                    </div>

                    <!-- Hero Crop -->
                    <div class="crop-group">
                        <h5>Hero (1280x720)</h5>
                        <div class="form-row">
                            <div class="form-field">
                                <label for="he_x">X</label>
                                <input id="he_x" v-model.number="formData.he_x" type="number" min="0" max="100"
                                    placeholder="0-100" />
                            </div>
                            <div class="form-field">
                                <label for="he_y">Y</label>
                                <input id="he_y" v-model.number="formData.he_y" type="number" min="0" max="100"
                                    placeholder="0-100" />
                            </div>
                            <div class="form-field">
                                <label for="he_z">Zoom</label>
                                <input id="he_z" v-model.number="formData.he_z" type="number" min="1"
                                    placeholder="100" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Actions -->
            <div class="editor-actions">
                <button type="submit" :disabled="saving" class="action-btn primary">
                    {{ saving ? 'Saving...' : (isNew ? 'Create Image' : 'Update Image') }}
                </button>
                <button type="button" @click="handleReset" class="action-btn">
                    Reset
                </button>
                <button v-if="closeable" type="button" @click="$emit('close')" class="action-btn">
                    Cancel
                </button>
            </div>

            <!-- Error Message -->
            <div v-if="error" class="error-message">
                {{ error }}
            </div>

            <!-- Success Message -->
            <div v-if="success" class="success-message">
                {{ success }}
            </div>
        </form>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import CimgTags from './cimgTags.vue'

/**
 * CimgEditor Component
 * 
 * Comprehensive image editor with all metadata and crop coordinates
 */

interface ImageData {
    id?: number
    xmlid?: string | null
    name: string
    url: string
    fileformat?: string
    mediaformat?: string | null
    function?: string | null
    provider?: number | null
    has_video?: boolean
    has_audio?: boolean
    is_public?: boolean
    is_private?: boolean
    is_dark?: boolean
    is_light?: boolean
    domaincode?: string | null
    owner?: string
    owner_id?: number | null
    title?: string | null
    alt_text?: string | null
    copyright?: string | null
    x?: number | null
    y?: number | null
    status_id?: number
    tags?: number
    av_x?: number | null
    av_y?: number | null
    av_z?: number | null
    ca_x?: number | null
    ca_y?: number | null
    ca_z?: number | null
    he_x?: number | null
    he_y?: number | null
    he_z?: number | null
}

interface Props {
    image?: ImageData | null
    closeable?: boolean
}

interface Emits {
    (e: 'close'): void
    (e: 'saved', image: any): void
}

const props = withDefaults(defineProps<Props>(), {
    closeable: false
})

const emit = defineEmits<Emits>()

// State
const saving = ref(false)
const error = ref('')
const success = ref('')

const isNew = computed(() => !props.image?.id)

// Form data
const formData = ref<ImageData>({
    name: '',
    url: '',
    fileformat: 'none',
    mediaformat: null,
    function: null,
    provider: null,
    has_video: false,
    has_audio: false,
    is_public: false,
    is_private: false,
    is_dark: false,
    is_light: false,
    domaincode: null,
    owner: '',
    title: null,
    alt_text: null,
    copyright: null,
    x: null,
    y: null,
    status_id: 0,
    tags: 0,
    av_x: null,
    av_y: null,
    av_z: 100,
    ca_x: null,
    ca_y: null,
    ca_z: 100,
    he_x: null,
    he_y: null,
    he_z: 100
})

// Initialize form data from prop
const initializeForm = () => {
    if (props.image) {
        formData.value = { ...props.image }
    }
}

// Watch for image changes
watch(() => props.image, () => {
    initializeForm()
}, { immediate: true })

// Handle submit
const handleSubmit = async () => {
    error.value = ''
    success.value = ''
    saving.value = true

    try {
        const method = isNew.value ? 'POST' : 'PUT'
        const url = isNew.value
            ? '/api/images'
            : `/api/images/${props.image!.id}`

        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData.value)
        })

        if (!response.ok) {
            const data = await response.json().catch(() => ({}))
            throw new Error(data.message || `HTTP ${response.status}`)
        }

        const savedImage = await response.json()
        success.value = isNew.value ? 'Image created successfully!' : 'Image updated successfully!'

        emit('saved', savedImage)

        setTimeout(() => {
            if (props.closeable) {
                emit('close')
            }
        }, 1500)
    } catch (err) {
        console.error('Error saving image:', err)
        error.value = err instanceof Error ? err.message : 'Failed to save image'
    } finally {
        saving.value = false
    }
}

// Handle reset
const handleReset = () => {
    if (confirm('Reset all changes?')) {
        initializeForm()
    }
}
</script>

<style scoped>
.cimg-editor {
    max-width: 900px;
    margin: 0 auto;
}

.editor-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
    padding-bottom: 1rem;
    border-bottom: 2px solid var(--color-border, #ddd);
}

.editor-header h3 {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 600;
}

.close-btn {
    background: none;
    border: none;
    font-size: 2rem;
    line-height: 1;
    cursor: pointer;
    color: var(--color-text-secondary, #666);
    padding: 0;
    width: 2rem;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 0.25rem;
}

.close-btn:hover {
    background-color: var(--color-bg-hover, #f3f4f6);
}

.editor-form {
    display: flex;
    flex-direction: column;
    gap: 2rem;
}

.form-section {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1.5rem;
    background-color: var(--color-bg-secondary, #f9fafb);
    border-radius: 0.5rem;
}

.section-title {
    margin: 0 0 0.5rem 0;
    font-size: 1rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-text-secondary, #666);
}

.section-description {
    margin: 0;
    font-size: 0.875rem;
    color: var(--color-text-secondary, #666);
}

.form-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
}

.form-field {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.form-field.required label::after {
    content: ' *';
    color: var(--color-danger, #ef4444);
}

.form-field label {
    font-size: 0.875rem;
    font-weight: 500;
}

.form-field input[type="text"],
.form-field input[type="url"],
.form-field input[type="number"],
.form-field select,
.form-field textarea {
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--color-border, #ddd);
    border-radius: 0.375rem;
    font-size: 0.875rem;
}

.form-field textarea {
    resize: vertical;
    font-family: inherit;
}

.flags-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 0.75rem;
}

.checkbox-field {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    cursor: pointer;
    user-select: none;
}

.checkbox-field input {
    cursor: pointer;
}

.crop-sections {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.crop-group {
    padding: 1rem;
    background-color: var(--color-bg, #fff);
    border: 1px solid var(--color-border, #ddd);
    border-radius: 0.375rem;
}

.crop-group h5 {
    margin: 0 0 0.75rem 0;
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-text-secondary, #666);
}

.editor-actions {
    display: flex;
    gap: 0.75rem;
    padding-top: 1rem;
    border-top: 1px solid var(--color-border, #ddd);
}

.action-btn {
    padding: 0.75rem 1.5rem;
    border: 1px solid var(--color-border, #ddd);
    border-radius: 0.375rem;
    background-color: var(--color-bg, #fff);
    cursor: pointer;
    font-weight: 500;
    transition: all 0.2s;
}

.action-btn:hover:not(:disabled) {
    background-color: var(--color-bg-hover, #f3f4f6);
}

.action-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.action-btn.primary {
    background-color: var(--color-primary, #3b82f6);
    border-color: var(--color-primary, #3b82f6);
    color: #fff;
}

.action-btn.primary:hover:not(:disabled) {
    background-color: var(--color-primary-dark, #2563eb);
}

.error-message {
    padding: 1rem;
    background-color: #fee2e2;
    border: 1px solid var(--color-danger, #ef4444);
    border-radius: 0.375rem;
    color: var(--color-danger, #ef4444);
    font-weight: 500;
}

.success-message {
    padding: 1rem;
    background-color: #dcfce7;
    border: 1px solid #16a34a;
    border-radius: 0.375rem;
    color: #16a34a;
    font-weight: 500;
}
</style>
