<template>
    <div class="image-browser">
        <!-- Header with Filters -->
        <div class="browser-header">
            <div class="header-title">
                <h1>Image Browser</h1>
                <span class="image-count">{{ filteredImages.length }} images</span>
            </div>

            <!-- View Toggle -->
            <div class="view-toggle">
                <button class="toggle-btn" :class="{ active: viewMode === 'small' }" @click="viewMode = 'small'"
                    title="Small tiles">
                    <svg fill="currentColor" height="20" viewBox="0 0 256 256" width="20"
                        xmlns="http://www.w3.org/2000/svg">
                        <path
                            d="M104,40H56A16,16,0,0,0,40,56v48a16,16,0,0,0,16,16h48a16,16,0,0,0,16-16V56A16,16,0,0,0,104,40Zm0,64H56V56h48v48Zm96-64H152a16,16,0,0,0-16,16v48a16,16,0,0,0,16,16h48a16,16,0,0,0,16-16V56A16,16,0,0,0,200,40Zm0,64H152V56h48v48Zm-96,32H56a16,16,0,0,0-16,16v48a16,16,0,0,0,16,16h48a16,16,0,0,0,16-16V152A16,16,0,0,0,104,136Zm0,64H56V152h48v48Zm96-64H152a16,16,0,0,0-16,16v48a16,16,0,0,0,16,16h48a16,16,0,0,0,16-16V152A16,16,0,0,0,200,136Zm0,64H152V152h48v48Z">
                        </path>
                    </svg>
                </button>
                <button class="toggle-btn" :class="{ active: viewMode === 'medium' }" @click="viewMode = 'medium'"
                    title="Medium cards">
                    <svg fill="currentColor" height="20" viewBox="0 0 256 256" width="20"
                        xmlns="http://www.w3.org/2000/svg">
                        <path
                            d="M216,48H40A16,16,0,0,0,24,64V192a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V64A16,16,0,0,0,216,48Zm0,144H40V64H216V192Z">
                        </path>
                    </svg>
                </button>
            </div>
        </div>

        <!-- Filters -->
        <div class="browser-filters">
            <div class="filter-group">
                <label>Sysreg</label>
                <select v-model="filters.sysreg" class="filter-select">
                    <option value="">All</option>
                    <option value="adult">Adult</option>
                    <option value="teen">Teen</option>
                    <option value="child">Child</option>
                </select>
            </div>

            <div class="filter-group">
                <label>Owner</label>
                <select v-model="filters.owner" class="filter-select">
                    <option value="">All Owners</option>
                    <option v-for="owner in uniqueOwners" :key="owner" :value="owner">
                        User #{{ owner }}
                    </option>
                </select>
            </div>

            <div class="filter-group">
                <label>Project</label>
                <select v-model="filters.project" class="filter-select">
                    <option value="">All Projects</option>
                    <option v-for="project in uniqueProjects" :key="project" :value="project">
                        {{ project }}
                    </option>
                </select>
            </div>

            <div class="filter-group">
                <label>Author</label>
                <input v-model="filters.author" type="text" class="filter-input" placeholder="Search author..." />
            </div>

            <button class="btn-reset" @click="resetFilters" title="Reset filters">
                <svg fill="currentColor" height="16" viewBox="0 0 256 256" width="16"
                    xmlns="http://www.w3.org/2000/svg">
                    <path
                        d="M222.67,129.67a8,8,0,0,1-11.34,0L192,110.34V128A72.08,72.08,0,0,1,120,200H48a8,8,0,0,1,0-16h72a56.06,56.06,0,0,0,56-56V110.34L156.67,129.67a8,8,0,0,1-11.34-11.34l32-32a8,8,0,0,1,11.34,0l32,32A8,8,0,0,1,222.67,129.67ZM48,80h88a56.06,56.06,0,0,0,56,56v17.66l-19.33-19.33a8,8,0,0,0-11.34,11.34l32,32a8,8,0,0,0,11.34,0l32-32a8,8,0,0,0-11.34-11.34L208,153.66V136A72.08,72.08,0,0,0,136,64H48a8,8,0,0,0,0,16Z">
                    </path>
                </svg>
            </button>
        </div>

        <!-- Loading State -->
        <div v-if="isLoading" class="loading-container">
            <div class="spinner"></div>
            <p>Loading images...</p>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="error-container">
            <svg fill="currentColor" height="48" viewBox="0 0 256 256" width="48" xmlns="http://www.w3.org/2000/svg">
                <path
                    d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm-8-80V80a8,8,0,0,1,16,0v56a8,8,0,0,1-16,0Zm20,36a12,12,0,1,1-12-12A12,12,0,0,1,140,172Z">
                </path>
            </svg>
            <p>{{ error }}</p>
        </div>

        <!-- Empty State -->
        <div v-else-if="filteredImages.length === 0" class="empty-container">
            <svg fill="currentColor" height="64" viewBox="0 0 256 256" width="64" xmlns="http://www.w3.org/2000/svg">
                <path
                    d="M216,40H72A16,16,0,0,0,56,56V72H40A16,16,0,0,0,24,88V200a16,16,0,0,0,16,16H184a16,16,0,0,0,16-16V184h16a16,16,0,0,0,16-16V56A16,16,0,0,0,216,40ZM72,56H216v62.75l-10.07-10.06a16,16,0,0,0-22.63,0l-20,20-44-44a16,16,0,0,0-22.62,0L72,109.37ZM184,200H40V88H56v80a16,16,0,0,0,16,16H184Zm32-32H72V132l36-36,49.66,49.66a8,8,0,0,0,11.31,0L194.63,120,216,141.38V168ZM160,84a12,12,0,1,1,12,12A12,12,0,0,1,160,84Z">
                </path>
            </svg>
            <h3>No images found</h3>
            <p>Try adjusting your filters or add new images to the system</p>
        </div>

        <!-- Image Grid -->
        <div v-else class="image-grid" :class="viewMode">
            <div v-for="image in filteredImages" :key="image.id" class="image-item" @click="openPreview(image)">
                <div class="image-thumb">
                    <img :src="getImageUrl(image)" :alt="image.alt_text || image.xmlid" loading="lazy" />
                </div>
                <div class="image-info">
                    <div class="image-author">{{ getAuthorName(image) }}</div>
                    <div class="image-tags">
                        <span v-if="getSysregTag(image)" class="tag sysreg">{{ getSysregTag(image) }}</span>
                        <span v-if="image.project" class="tag project">{{ image.project }}</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Preview Modal -->
        <ImagePreviewModal v-model:is-open="previewModalOpen" :image="selectedImage" />
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuth } from '@/composables/useAuth'
import ImagePreviewModal from '@/components/images/ImagePreviewModal.vue'

interface ImageData {
    id: number
    xmlid: string
    owner: number
    project?: string
    author?: any
    alt_text?: string
    sysreg?: number
    img_thumb?: any
    img_square?: any
}

const { user } = useAuth()

const images = ref<ImageData[]>([])
const isLoading = ref(true)
const error = ref<string | null>(null)
const viewMode = ref<'small' | 'medium'>('medium')

// Filters
const filters = ref({
    sysreg: '',
    owner: '',
    project: '',
    author: ''
})

// Preview modal
const previewModalOpen = ref(false)
const selectedImage = ref<ImageData | null>(null)

// Unique filter values
const uniqueOwners = computed(() => {
    const owners = new Set(images.value.map(img => img.owner))
    return Array.from(owners).sort((a, b) => a - b)
})

const uniqueProjects = computed(() => {
    const projects = new Set(images.value.map(img => img.project).filter(Boolean))
    return Array.from(projects).sort()
})

// Filtered images
const filteredImages = computed(() => {
    let result = images.value

    // Filter by sysreg
    if (filters.value.sysreg) {
        result = result.filter(img => {
            if (!img.sysreg) return false
            const ageGroup = img.sysreg & 0x03
            const ageLabels = ['other', 'child', 'teen', 'adult']
            return ageLabels[ageGroup] === filters.value.sysreg
        })
    }

    // Filter by owner
    if (filters.value.owner) {
        result = result.filter(img => String(img.owner) === filters.value.owner)
    }

    // Filter by project
    if (filters.value.project) {
        result = result.filter(img => img.project === filters.value.project)
    }

    // Filter by author (string search in author composite)
    if (filters.value.author) {
        const searchTerm = filters.value.author.toLowerCase()
        result = result.filter(img => {
            const authorName = getAuthorName(img).toLowerCase()
            return authorName.includes(searchTerm)
        })
    }

    return result
})

// Helper functions
const getImageUrl = (image: ImageData): string => {
    const imgField = viewMode.value === 'small' ? 'img_thumb' : 'img_square'
    const imgData = image[imgField]

    if (!imgData) return ''

    try {
        const parsed = typeof imgData === 'string' ? JSON.parse(imgData) : imgData
        return parsed.url || ''
    } catch (e) {
        console.error('Failed to parse image data:', e)
        return ''
    }
}

const getAuthorName = (image: ImageData): string => {
    if (!image.author) return 'Unknown'

    try {
        // Author is a composite: (name, uri, adapter)
        const author = typeof image.author === 'string' ? JSON.parse(image.author) : image.author
        return author.name || author[0] || 'Unknown'
    } catch (e) {
        return 'Unknown'
    }
}

const getSysregTag = (image: ImageData): string | null => {
    if (!image.sysreg) return null

    const byte = image.sysreg
    const ageGroup = byte & 0x03
    const ageLabels = ['Other', 'Child', 'Teen', 'Adult']
    return ageLabels[ageGroup]
}

const resetFilters = () => {
    filters.value = {
        sysreg: '',
        owner: '',
        project: '',
        author: ''
    }
}

const openPreview = (image: ImageData) => {
    selectedImage.value = image
    previewModalOpen.value = true
}

// Load images
const loadImages = async () => {
    isLoading.value = true
    error.value = null

    try {
        // Fetch images that user has access to
        const response = await fetch('/api/images')

        if (!response.ok) {
            throw new Error(`Failed to load images: ${response.statusText}`)
        }

        images.value = await response.json()
    } catch (err) {
        console.error('Error loading images:', err)
        error.value = 'Failed to load images. Please try again.'
    } finally {
        isLoading.value = false
    }
}

onMounted(() => {
    loadImages()
})
</script>

<style scoped>
.image-browser {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    background: var(--color-bg-soft);
    padding: 2rem;
    gap: 1.5rem;
}

/* Header */
.browser-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    background: var(--color-card-bg);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-large);
}

.header-title {
    display: flex;
    align-items: baseline;
    gap: 1rem;
}

.header-title h1 {
    margin: 0;
    font-size: 1.75rem;
    font-weight: 600;
    color: var(--color-text);
}

.image-count {
    font-size: 0.875rem;
    color: var(--color-muted-contrast);
    font-weight: 500;
}

.view-toggle {
    display: flex;
    gap: 0.5rem;
    padding: 0.25rem;
    background: var(--color-muted-bg);
    border-radius: var(--radius-small);
}

.toggle-btn {
    padding: 0.5rem;
    border: none;
    background: transparent;
    border-radius: var(--radius-small);
    cursor: pointer;
    transition: all 0.2s ease;
    color: var(--color-muted-contrast);
}

.toggle-btn:hover {
    background: var(--color-card-bg);
}

.toggle-btn.active {
    background: var(--color-primary-bg);
    color: var(--color-primary-contrast);
}

/* Filters */
.browser-filters {
    display: flex;
    gap: 1rem;
    padding: 1.5rem;
    background: var(--color-card-bg);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-large);
    flex-wrap: wrap;
    align-items: flex-end;
}

.filter-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    flex: 1;
    min-width: 150px;
}

.filter-group label {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-text);
}

.filter-select,
.filter-input {
    padding: 0.625rem 0.75rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-small);
    background: var(--color-muted-bg);
    color: var(--color-text);
    font-size: 0.875rem;
    font-family: inherit;
}

.filter-select:focus,
.filter-input:focus {
    outline: none;
    border-color: var(--color-primary-bg);
}

.btn-reset {
    padding: 0.625rem 1rem;
    border: 1px solid var(--color-border);
    background: var(--color-card-bg);
    border-radius: var(--radius-small);
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.btn-reset:hover {
    background: var(--color-muted-bg);
    border-color: var(--color-primary-bg);
}

/* Loading, Error, Empty States */
.loading-container,
.error-container,
.empty-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 4rem 2rem;
    gap: 1rem;
    background: var(--color-card-bg);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-large);
    min-height: 400px;
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

.error-container svg {
    color: var(--color-danger);
}

.empty-container svg {
    color: var(--color-muted-contrast);
    opacity: 0.5;
}

.empty-container h3 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--color-text);
}

.empty-container p {
    margin: 0;
    color: var(--color-muted-contrast);
}

/* Image Grid */
.image-grid {
    display: grid;
    gap: 1.5rem;
}

.image-grid.small {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
}

.image-grid.medium {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
}

.image-item {
    display: flex;
    flex-direction: column;
    background: var(--color-card-bg);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-medium);
    overflow: hidden;
    cursor: pointer;
    transition: all 0.2s ease;
}

.image-item:hover {
    border-color: var(--color-primary-bg);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px oklch(0 0 0 / 0.1);
}

.image-thumb {
    aspect-ratio: 1;
    overflow: hidden;
    background: var(--color-muted-bg);
}

.image-thumb img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.image-info {
    padding: 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.image-author {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-text);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.image-tags {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
}

.tag {
    padding: 0.25rem 0.5rem;
    border-radius: 3px;
    font-size: 0.65rem;
    font-weight: 600;
    white-space: nowrap;
}

.tag.sysreg {
    background: var(--color-primary-bg);
    color: var(--color-primary-contrast);
}

.tag.project {
    background: var(--color-muted-bg);
    color: var(--color-muted-contrast);
}

@media (max-width: 768px) {
    .image-browser {
        padding: 1rem;
    }

    .browser-header {
        flex-direction: column;
        gap: 1rem;
        align-items: stretch;
    }

    .browser-filters {
        flex-direction: column;
    }

    .filter-group {
        min-width: 100%;
    }

    .image-grid.small,
    .image-grid.medium {
        grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    }
}
</style>
