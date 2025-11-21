<template>
    <div v-if="isOpen" class="image-preview-modal-overlay" @click.self="handleClose">
        <div class="image-preview-modal">
            <div class="modal-header">
                <h3>{{ image?.xmlid || 'Image Preview' }}</h3>
                <div class="header-actions">
                    <button class="btn-toggle" @click="toggleFullResolution"
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
                    <div class="detail-row detail-row-full">
                        <SysregTagDisplay v-model:all-tags="allTags" v-model:config-visibility="configVisibility"
                            v-model:age-group="ageGroup" v-model:subject-type="subjectType"
                            v-model:core-themes="coreThemes" v-model:domains="domains" />
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useTheme } from '@/composables/useTheme'
import SysregTagDisplay from '@/components/sysreg/SysregTagDisplay.vue'

interface ImageData {
    id: number
    xmlid: string
    owner: number
    project?: string
    author?: any
    alt_text?: string
    sysreg?: number
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
}

const props = withDefaults(defineProps<Props>(), {
    fullResolution: false
})

const emit = defineEmits<{
    'update:isOpen': [value: boolean]
}>()

const { cardWidth } = useTheme()
const isFullResolution = ref(props.fullResolution)
const imageKey = ref(0)
const allTags = ref(false)
const configVisibility = ref(0)
const ageGroup = ref(0)
const subjectType = ref(0)
const coreThemes = ref('\\x00')
const domains = ref('\\x00')

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

const toggleFullResolution = () => {
    isFullResolution.value = !isFullResolution.value
    imageKey.value++ // Force image reload
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

// Sync internal state with prop
watch(() => props.fullResolution, (newVal) => {
    isFullResolution.value = newVal
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
    color: var(--color-text);
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
    color: var(--color-text);
    display: flex;
    align-items: center;
    justify-content: center;
}

.btn-toggle:hover {
    background: var(--color-border);
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

.detail-row-full {
    flex-direction: column;
    gap: 0.5rem;
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
