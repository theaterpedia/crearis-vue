<template>
    <div class="cimg-preview" v-if="image">
        <div class="preview-header">
            <h3 class="preview-title">{{ image.name }}</h3>
            <button v-if="closeable" @click="$emit('close')" class="close-btn" aria-label="Close">
                ×
            </button>
        </div>

        <div class="preview-body">
            <!-- Image Display -->
            <div class="image-container">
                <cimg-rendition :image="image" :rendition="rendition" class="preview-image" />
            </div>

            <!-- Metadata Display -->
            <div class="metadata">
                <div class="metadata-section">
                    <h4 class="section-title">Details</h4>
                    <dl class="metadata-list">
                        <div v-if="image.id" class="metadata-item">
                            <dt>ID</dt>
                            <dd>{{ image.id }}</dd>
                        </div>
                        <div v-if="image.xmlid" class="metadata-item">
                            <dt>XML ID</dt>
                            <dd>{{ image.xmlid }}</dd>
                        </div>
                        <div v-if="image.url" class="metadata-item">
                            <dt>URL</dt>
                            <dd class="url-text">{{ image.url }}</dd>
                        </div>
                        <div v-if="image.fileformat" class="metadata-item">
                            <dt>Format</dt>
                            <dd>{{ image.fileformat }}</dd>
                        </div>
                        <div v-if="image.mediaformat" class="metadata-item">
                            <dt>Media Format</dt>
                            <dd>{{ image.mediaformat }}</dd>
                        </div>
                        <div v-if="image.function" class="metadata-item">
                            <dt>Function</dt>
                            <dd>{{ image.function }}</dd>
                        </div>
                        <div v-if="image.provider" class="metadata-item">
                            <dt>Provider</dt>
                            <dd>{{ image.provider }}</dd>
                        </div>
                        <div v-if="image.domaincode" class="metadata-item">
                            <dt>Project</dt>
                            <dd>{{ image.domaincode }}</dd>
                        </div>
                        <div v-if="image.owner_username" class="metadata-item">
                            <dt>Owner</dt>
                            <dd>{{ image.owner_username }}</dd>
                        </div>
                        <div v-if="image.status_name" class="metadata-item">
                            <dt>Status</dt>
                            <dd>
                                <span class="status-badge">{{ image.status_name }}</span>
                            </dd>
                        </div>
                    </dl>
                </div>

                <!-- Flags -->
                <div class="metadata-section" v-if="hasFlags">
                    <h4 class="section-title">Properties</h4>
                    <div class="flags-grid">
                        <span v-if="image.has_video" class="flag">📹 Video</span>
                        <span v-if="image.has_audio" class="flag">🔊 Audio</span>
                        <span v-if="image.is_public" class="flag">🌐 Public</span>
                        <span v-if="image.is_private" class="flag">🔒 Private</span>
                        <span v-if="image.is_dark" class="flag">🌙 Dark</span>
                        <span v-if="image.is_light" class="flag">☀️ Light</span>
                    </div>
                </div>

                <!-- Tags -->
                <div class="metadata-section" v-if="activeTags.length > 0">
                    <h4 class="section-title">Tags</h4>
                    <div class="tags-list">
                        <span v-for="tag in activeTags" :key="tag" class="tag-badge">
                            {{ tag }}
                        </span>
                    </div>
                </div>

                <!-- Text Fields -->
                <div class="metadata-section" v-if="image.title || image.alt_text || image.copyright">
                    <h4 class="section-title">Content</h4>
                    <dl class="metadata-list">
                        <div v-if="image.title" class="metadata-item">
                            <dt>Title</dt>
                            <dd>{{ image.title }}</dd>
                        </div>
                        <div v-if="image.alt_text" class="metadata-item">
                            <dt>Alt Text</dt>
                            <dd>{{ image.alt_text }}</dd>
                        </div>
                        <div v-if="image.copyright" class="metadata-item">
                            <dt>Copyright</dt>
                            <dd>{{ image.copyright }}</dd>
                        </div>
                    </dl>
                </div>

                <!-- Dimensions -->
                <div class="metadata-section" v-if="image.x || image.y">
                    <h4 class="section-title">Dimensions</h4>
                    <dl class="metadata-list">
                        <div v-if="image.x" class="metadata-item">
                            <dt>Width</dt>
                            <dd>{{ image.x }}px</dd>
                        </div>
                        <div v-if="image.y" class="metadata-item">
                            <dt>Height</dt>
                            <dd>{{ image.y }}px</dd>
                        </div>
                    </dl>
                </div>

                <!-- Crop Coordinates -->
                <div class="metadata-section" v-if="hasCropCoords">
                    <h4 class="section-title">Crop Coordinates</h4>
                    <div class="crop-section">
                        <div v-if="image.av_x !== null || image.av_y !== null" class="crop-group">
                            <strong>Avatar:</strong>
                            <span>x: {{ image.av_x ?? '-' }}, y: {{ image.av_y ?? '-' }}, z: {{ image.av_z ?? 100
                                }}</span>
                        </div>
                        <div v-if="image.ca_x !== null || image.ca_y !== null" class="crop-group">
                            <strong>Card:</strong>
                            <span>x: {{ image.ca_x ?? '-' }}, y: {{ image.ca_y ?? '-' }}, z: {{ image.ca_z ?? 100
                                }}</span>
                        </div>
                        <div v-if="image.he_x !== null || image.he_y !== null" class="crop-group">
                            <strong>Hero:</strong>
                            <span>x: {{ image.he_x ?? '-' }}, y: {{ image.he_y ?? '-' }}, z: {{ image.he_z ?? 100
                                }}</span>
                        </div>
                    </div>
                </div>

                <!-- Timestamps -->
                <div class="metadata-section">
                    <h4 class="section-title">Timestamps</h4>
                    <dl class="metadata-list">
                        <div v-if="image.date" class="metadata-item">
                            <dt>Date</dt>
                            <dd>{{ formatDate(image.date) }}</dd>
                        </div>
                        <div v-if="image.created_at" class="metadata-item">
                            <dt>Created</dt>
                            <dd>{{ formatDate(image.created_at) }}</dd>
                        </div>
                        <div v-if="image.updated_at" class="metadata-item">
                            <dt>Updated</dt>
                            <dd>{{ formatDate(image.updated_at) }}</dd>
                        </div>
                    </dl>
                </div>
            </div>
        </div>

        <div v-if="showActions" class="preview-actions">
            <slot name="actions">
                <button @click="$emit('edit', image)" class="action-btn primary">
                    Edit
                </button>
                <button @click="$emit('delete', image)" class="action-btn danger">
                    Delete
                </button>
            </slot>
        </div>
    </div>
    <div v-else class="cimg-preview empty">
        <p>No image selected</p>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import CimgRendition from './cimgRendition.vue'

/**
 * CimgPreview Component
 * 
 * Displays comprehensive image metadata and preview
 */

interface ImageData {
    id: number
    xmlid?: string | null
    name: string
    url: string
    fileformat?: string
    mediaformat?: string | null
    function?: string | null
    length?: number | null
    provider?: number | null
    has_video?: boolean
    has_audio?: boolean
    is_public?: boolean
    is_private?: boolean
    is_dark?: boolean
    is_light?: boolean
    domaincode?: string | null
    owner_id?: number | null
    owner_username?: string
    date?: string
    geo?: Record<string, any> | null
    x?: number | null
    y?: number | null
    copyright?: string | null
    alt_text?: string | null
    title?: string | null
    status_id?: number
    status_name?: string
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
    created_at?: string | null
    updated_at?: string | null
}

interface Props {
    image?: ImageData | null
    rendition?: 'avatar' | 'card' | 'hero'
    closeable?: boolean
    showActions?: boolean
}

interface Emits {
    (e: 'close'): void
    (e: 'edit', image: ImageData): void
    (e: 'delete', image: ImageData): void
}

const props = withDefaults(defineProps<Props>(), {
    rendition: 'card',
    closeable: false,
    showActions: false
})

defineEmits<Emits>()

// Tag names
const tagNames: Record<number, string> = {
    1: 'adult',
    2: 'teen',
    4: 'child',
    8: 'group',
    16: 'portrait',
    32: 'detail',
    64: 'location',
    128: 'system'
}

// Get active tags
const activeTags = computed(() => {
    if (!props.image?.tags) return []

    const tags: string[] = []
    for (const [value, name] of Object.entries(tagNames)) {
        if ((props.image.tags & Number(value)) === Number(value)) {
            tags.push(name)
        }
    }
    return tags
})

// Check if has any flags set
const hasFlags = computed(() => {
    return props.image && (
        props.image.has_video ||
        props.image.has_audio ||
        props.image.is_public ||
        props.image.is_private ||
        props.image.is_dark ||
        props.image.is_light
    )
})

// Check if has crop coordinates
const hasCropCoords = computed(() => {
    if (!props.image) return false
    return (
        props.image.av_x !== null || props.image.av_y !== null ||
        props.image.ca_x !== null || props.image.ca_y !== null ||
        props.image.he_x !== null || props.image.he_y !== null
    )
})

// Format date
const formatDate = (dateString?: string | null) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleString()
}
</script>

<style scoped>
.cimg-preview {
    display: flex;
    flex-direction: column;
    background: var(--color-bg, #fff);
    border: 1px solid var(--color-border, #ddd);
    border-radius: 0.5rem;
    overflow: hidden;
}

.cimg-preview.empty {
    padding: 2rem;
    text-align: center;
    color: var(--color-text-secondary, #666);
}

.preview-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.5rem;
    border-bottom: 1px solid var(--color-border, #ddd);
}

.preview-title {
    margin: 0;
    font-size: 1.25rem;
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
    color: var(--color-text, #000);
}

.preview-body {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    padding: 1.5rem;
    overflow-y: auto;
    max-height: 70vh;
}

.image-container {
    display: flex;
    justify-content: center;
    background-color: var(--color-bg-secondary, #f9fafb);
    border-radius: 0.375rem;
    padding: 1rem;
}

.preview-image {
    max-width: 100%;
    height: auto;
}

.metadata {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.metadata-section {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.section-title {
    margin: 0;
    font-size: 0.875rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-text-secondary, #666);
}

.metadata-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin: 0;
}

.metadata-item {
    display: grid;
    grid-template-columns: 120px 1fr;
    gap: 1rem;
    font-size: 0.875rem;
}

.metadata-item dt {
    font-weight: 600;
    color: var(--color-text-secondary, #666);
}

.metadata-item dd {
    margin: 0;
    word-break: break-word;
}

.url-text {
    font-family: monospace;
    font-size: 0.75rem;
}

.status-badge {
    display: inline-block;
    padding: 0.25rem 0.5rem;
    background-color: var(--color-primary-light, #dbeafe);
    color: var(--color-primary, #3b82f6);
    border-radius: 0.25rem;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: capitalize;
}

.flags-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
}

.flag {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.375rem 0.75rem;
    background-color: var(--color-bg-secondary, #f3f4f6);
    border: 1px solid var(--color-border, #ddd);
    border-radius: 0.375rem;
    font-size: 0.875rem;
}

.tags-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
}

.tag-badge {
    display: inline-block;
    padding: 0.25rem 0.75rem;
    background-color: var(--color-secondary, #f3f4f6);
    border: 1px solid var(--color-border, #ddd);
    border-radius: 999px;
    font-size: 0.75rem;
    text-transform: capitalize;
}

.crop-section {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    font-size: 0.875rem;
}

.crop-group {
    display: flex;
    gap: 0.5rem;
}

.crop-group strong {
    min-width: 70px;
    color: var(--color-text-secondary, #666);
}

.preview-actions {
    display: flex;
    gap: 0.75rem;
    padding: 1rem 1.5rem;
    border-top: 1px solid var(--color-border, #ddd);
    background-color: var(--color-bg-secondary, #f9fafb);
}

.action-btn {
    padding: 0.5rem 1rem;
    border: 1px solid var(--color-border, #ddd);
    border-radius: 0.375rem;
    background-color: var(--color-bg, #fff);
    cursor: pointer;
    font-weight: 500;
    transition: all 0.2s;
}

.action-btn:hover {
    background-color: var(--color-bg-hover, #f3f4f6);
}

.action-btn.primary {
    background-color: var(--color-primary, #3b82f6);
    border-color: var(--color-primary, #3b82f6);
    color: #fff;
}

.action-btn.primary:hover {
    background-color: var(--color-primary-dark, #2563eb);
}

.action-btn.danger {
    background-color: var(--color-danger, #ef4444);
    border-color: var(--color-danger, #ef4444);
    color: #fff;
}

.action-btn.danger:hover {
    background-color: var(--color-danger-dark, #dc2626);
}
</style>
