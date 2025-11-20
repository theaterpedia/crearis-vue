<template>
    <div class="step-component">
        <div class="step-header">
            <h3>Images</h3>
            <p class="step-subtitle">Upload and manage images for your project</p>
        </div>

        <!-- Error State -->
        <div v-if="error" class="error-banner">
            <svg fill="currentColor" height="20" viewBox="0 0 256 256" width="20" xmlns="http://www.w3.org/2000/svg">
                <path
                    d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm-8-80V80a8,8,0,0,1,16,0v56a8,8,0,0,1-16,0Zm20,36a12,12,0,1,1-12-12A12,12,0,0,1,140,172Z">
                </path>
            </svg>
            <span>{{ error }}</span>
        </div>

        <!-- Loading State -->
        <div v-if="isLoading" class="loading-container">
            <div class="spinner"></div>
            <p>Loading images...</p>
        </div>

        <div v-else class="step-content-container">
            <!-- Left: Image Gallery -->
            <div class="images-gallery">
                <div v-if="projectImages.length === 0" class="empty-state">
                    <svg fill="currentColor" height="48" viewBox="0 0 256 256" width="48"
                        xmlns="http://www.w3.org/2000/svg">
                        <path
                            d="M216,40H72A16,16,0,0,0,56,56V72H40A16,16,0,0,0,24,88V200a16,16,0,0,0,16,16H184a16,16,0,0,0,16-16V184h16a16,16,0,0,0,16-16V56A16,16,0,0,0,216,40ZM72,56H216v62.75l-10.07-10.06a16,16,0,0,0-22.63,0l-20,20-44-44a16,16,0,0,0-22.62,0L72,109.37ZM184,200H40V88H56v80a16,16,0,0,0,16,16H184Zm32-32H72V132l36-36,49.66,49.66a8,8,0,0,0,11.31,0L194.63,120,216,141.38V168ZM160,84a12,12,0,1,1,12,12A12,12,0,0,1,160,84Z">
                        </path>
                    </svg>
                    <p class="empty-title">No images yet</p>
                    <p class="empty-text">Upload images using the panel on the right</p>
                </div>

                <div v-else class="images-grid">
                    <div v-for="img in projectImages" :key="img.id" class="image-card" @click="openImageModal(img)">
                        <button class="delete-btn" @click.stop="handleImageDelete(img.id)" title="Delete image">
                            <svg fill="currentColor" height="16" viewBox="0 0 256 256" width="16"
                                xmlns="http://www.w3.org/2000/svg">
                                <path
                                    d="M216,48H176V40a24,24,0,0,0-24-24H104A24,24,0,0,0,80,40v8H40a8,8,0,0,0,0,16h8V208a16,16,0,0,0,16,16H192a16,16,0,0,0,16-16V64h8a8,8,0,0,0,0-16ZM96,40a8,8,0,0,1,8-8h48a8,8,0,0,1,8,8v8H96Zm96,168H64V64H192ZM112,104v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Zm48,0v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Z">
                                </path>
                            </svg>
                        </button>
                        <div class="image-card-thumb">
                            <img :src="getImageUrl(img)" :alt="img.alt_text || img.xmlid" loading="lazy" />
                        </div>
                        <div class="image-card-info">
                            <div class="image-xmlid">{{ img.xmlid }}</div>
                            <div class="image-meta">
                                <span v-if="getAuthorName(img)" class="meta-item">{{ getAuthorName(img) }}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Right: Import Panel -->
            <div class="import-panel-container">
                <cimgImportStepper :project-id="props.projectId" @images-imported="handleImagesImported" />
            </div>
        </div>

        <div v-if="!hideActions" class="step-actions">
            <button class="action-btn primary-btn" @click="handleNext">
                <span>Next</span>
                <svg fill="currentColor" height="16" viewBox="0 0 256 256" width="16"
                    xmlns="http://www.w3.org/2000/svg">
                    <path
                        d="M221.66,133.66l-72,72a8,8,0,0,1-11.32-11.32L196.69,136H40a8,8,0,0,1,0-16H196.69L138.34,61.66a8,8,0,0,1,11.32-11.32l72,72A8,8,0,0,1,221.66,133.66Z">
                    </path>
                </svg>
            </button>
        </div>

        <!-- Image Preview Modal -->
        <ImagePreviewModal v-model:is-open="previewModalOpen" :image="selectedImage" />
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import cimgImportStepper from '@/components/images/cimgImportStepper.vue'
import ImagePreviewModal from '@/components/images/ImagePreviewModal.vue'

interface Props {
    projectId: string
    isLocked?: boolean
    hideActions?: boolean
}

interface Emits {
    (e: 'next'): void
}

const props = withDefaults(defineProps<Props>(), {
    isLocked: false,
    hideActions: false
})
const emit = defineEmits<Emits>()

const projectImages = ref<any[]>([])
const isLoading = ref(true)
const error = ref<string | null>(null)

// Preview modal
const previewModalOpen = ref(false)
const selectedImage = ref<any>(null)

// Load images for this project
async function loadProjectImages() {
    try {
        error.value = null
        const response = await fetch(`/api/images?project=${props.projectId}`)
        if (!response.ok) {
            throw new Error(`Failed to load images: ${response.statusText}`)
        }
        projectImages.value = await response.json()
    } catch (err) {
        console.error('Error loading images:', err)
        error.value = 'Failed to load images'
    }
}

// Handle images imported
async function handleImagesImported(imageIds: string[]) {
    console.log('✅ Images imported:', imageIds)
    // Reload project images
    await loadProjectImages()
}

// Handle image delete
async function handleImageDelete(imageId: number) {
    if (!confirm('Delete this image?')) return

    try {
        error.value = null
        const response = await fetch(`/api/images/${imageId}`, {
            method: 'DELETE'
        })

        if (!response.ok) {
            throw new Error(`Failed to delete image: ${response.statusText}`)
        }

        console.log('✅ Image deleted:', imageId)
        await loadProjectImages()
    } catch (err) {
        console.error('Error deleting image:', err)
        error.value = 'Failed to delete image'
        alert('Failed to delete image')
    }
}

// Get image URL
function getImageUrl(image: any): string {
    const imgData = image.img_square
    if (!imgData) return ''

    try {
        const parsed = typeof imgData === 'string' ? JSON.parse(imgData) : imgData
        return parsed.url || ''
    } catch (e) {
        console.error('Failed to parse image data:', e)
        return ''
    }
}

// Get author name
function getAuthorName(image: any): string {
    if (!image.author) return ''

    try {
        const author = typeof image.author === 'string' ? JSON.parse(image.author) : image.author
        return author.name || author[0] || ''
    } catch (e) {
        return ''
    }
}

// Open image modal
function openImageModal(image: any) {
    selectedImage.value = image
    previewModalOpen.value = true
}

function handleNext() {
    emit('next')
}

onMounted(async () => {
    isLoading.value = true
    try {
        await loadProjectImages()
    } finally {
        isLoading.value = false
    }
})
</script>

<style scoped>
.step-component {
    display: flex;
    flex-direction: column;
    gap: 2rem;
    height: 100%;
}

.step-header h3 {
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--color-text);
    margin: 0 0 0.5rem 0;
}

.step-subtitle {
    font-size: 0.875rem;
    color: var(--color-dimmed);
    margin: 0;
}

/* Error Banner */
.error-banner {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem;
    background: #fee;
    border: 1px solid #fcc;
    border-radius: 6px;
    color: #c33;
}

.error-banner svg {
    flex-shrink: 0;
}

/* Loading State */
.loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 4rem 2rem;
    gap: 1rem;
}

.spinner {
    width: 40px;
    height: 40px;
    border: 4px solid var(--color-border);
    border-top-color: var(--color-primary, #3b82f6);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

.loading-container p {
    color: var(--color-text-muted);
    font-size: 0.875rem;
}

.step-content-container {
    display: grid;
    grid-template-columns: 1fr 400px;
    gap: 2rem;
    flex: 1;
    min-height: 500px;
}

/* Left: Images Gallery */
.images-gallery {
    display: flex;
    flex-direction: column;
}

.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem 2rem;
    background: var(--color-background-soft);
    border: 2px dashed var(--color-border);
    border-radius: 8px;
    text-align: center;
    min-height: 400px;
}

.empty-state svg {
    color: var(--color-primary, #3b82f6);
    opacity: 0.5;
    margin-bottom: 1rem;
}

.empty-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--color-heading);
    margin: 0 0 0.5rem 0;
}

.empty-text {
    font-size: 0.875rem;
    color: var(--color-text-muted);
    margin: 0;
    max-width: 400px;
}

.images-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1.5rem;
}

.image-card {
    position: relative;
    display: flex;
    flex-direction: column;
    background: var(--color-background-soft);
    border: 1px solid var(--color-border);
    border-radius: 8px;
    overflow: hidden;
    transition: all 0.2s ease;
    cursor: pointer;
}

.delete-btn {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    z-index: 10;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.9);
    border: 1px solid var(--color-border);
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
    opacity: 0;
}

.image-card:hover .delete-btn {
    opacity: 1;
}

.delete-btn:hover {
    background: #fee;
    border-color: #fcc;
    color: #c33;
    transform: scale(1.1);
}

.image-card:hover {
    border-color: var(--color-border-hover);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
}

.image-card-thumb {
    aspect-ratio: 1;
    overflow: hidden;
    background: var(--color-muted-bg);
}

.image-card-thumb img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.image-card-info {
    padding: 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.image-xmlid {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--color-text);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.image-meta {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
}

.meta-item {
    font-size: 0.7rem;
    color: var(--color-muted-contrast);
}

/* Right: Import Panel */
.import-panel-container {
    display: flex;
    flex-direction: column;
}

.step-actions {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    padding-top: 1rem;
    border-top: var(--border) solid var(--color-border);
}

.action-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: var(--radius-button);
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
}

.primary-btn {
    background: var(--color-primary-bg);
    color: var(--color-primary-contrast);
}

.primary-btn:hover {
    opacity: 0.9;
    transform: translateY(-1px);
}

.primary-btn:active {
    transform: translateY(0);
}

@media (max-width: 1200px) {
    .step-content-container {
        grid-template-columns: 1fr;
    }

    .images-grid {
        grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    }
}
</style>
