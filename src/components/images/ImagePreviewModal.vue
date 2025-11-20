<template>
    <div v-if="isOpen" class="image-preview-modal-overlay" @click.self="handleClose">
        <div class="image-preview-modal">
            <div class="modal-header">
                <h3>{{ image?.xmlid || 'Image Preview' }}</h3>
                <button class="btn-close" @click="handleClose">×</button>
            </div>
            <div class="modal-body">
                <div class="image-container">
                    <img v-if="transformUrl" :src="transformUrl" :alt="image?.alt_text || image?.xmlid"
                        @error="handleImageError" />
                    <div v-else class="loading-spinner">
                        <div class="spinner"></div>
                        <p>Loading image...</p>
                    </div>
                </div>
                <div class="image-details">
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
                        <span class="detail-label">Owner:</span>
                        <span class="detail-value">User #{{ image.owner }}</span>
                    </div>
                    <div v-if="image?.project" class="detail-row">
                        <span class="detail-label">Project:</span>
                        <span class="detail-value">{{ image.project }}</span>
                    </div>
                    <div v-if="sysregTag" class="detail-row">
                        <span class="detail-label">Sysreg:</span>
                        <span class="tag">{{ sysregTag }}</span>
                    </div>
                    <div v-if="image?.alt_text" class="detail-row">
                        <span class="detail-label">Alt Text:</span>
                        <span class="detail-value">{{ image.alt_text }}</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'

interface ImageData {
    id: number
    xmlid: string
    owner: number
    project?: string
    author?: any
    alt_text?: string
    sysreg?: number
    img_source?: any
}

interface Props {
    isOpen: boolean
    image: ImageData | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
    'update:isOpen': [value: boolean]
}>()

// Transform URL: For now, show source image scaled to max 800px width
// TODO: Implement actual 800px transformation endpoint
const transformUrl = computed(() => {
    if (!props.image?.img_source) return null

    try {
        const sourceData = typeof props.image.img_source === 'string'
            ? JSON.parse(props.image.img_source)
            : props.image.img_source

        // For now: Return source URL directly
        // TODO: Call transform endpoint with width=800
        return sourceData.url || null
    } catch (e) {
        console.error('Failed to parse img_source:', e)
        return null
    }
})

// Parse sysreg tag
const sysregTag = computed(() => {
    if (!props.image?.sysreg) return null

    // Decode sysreg byte (bits 0-3 for now)
    const byte = props.image.sysreg
    const ageGroup = byte & 0x03
    const subjectType = (byte >> 2) & 0x03

    const ageLabels = ['Other', 'Child', 'Teen', 'Adult']
    const subjectLabels = ['Other', 'Group', 'Person', 'Portrait']

    return `${ageLabels[ageGroup]} / ${subjectLabels[subjectType]}`
})

const handleClose = () => {
    emit('update:isOpen', false)
}

const handleImageError = () => {
    console.error('Failed to load image')
}

// Reset scroll on open
watch(() => props.isOpen, (isOpen) => {
    if (isOpen) {
        document.body.style.overflow = 'hidden'
    } else {
        document.body.style.overflow = ''
    }
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

.modal-header h3 {
    margin: 0;
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--color-text);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
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
    color: var(--color-text);
}

.btn-close:hover {
    background: var(--color-border);
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

.detail-label {
    font-weight: 600;
    color: var(--color-text);
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

@media (max-width: 768px) {
    .modal-body {
        padding: 1rem;
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
