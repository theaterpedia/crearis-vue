<template>
    <div class="cimg-browser-overlay" @click.self="$emit('close')">
        <div class="cimg-browser">
            <div class="browser-header">
                <h3>Select Image</h3>
                <button @click="$emit('close')" class="close-btn">×</button>
            </div>

            <div class="browser-body">
                <!-- Search and Filters -->
                <div class="browser-search">
                    <input v-model="searchQuery" type="text" placeholder="Search images..." class="search-input"
                        @input="debouncedSearch" />
                    <select v-model="filterProject" @change="loadImages" class="filter-select">
                        <option value="">All Projects</option>
                        <option v-for="project in projects" :key="project" :value="project">
                            {{ project }}
                        </option>
                    </select>
                </div>

                <!-- Loading -->
                <div v-if="loading" class="loading-state">
                    <div class="loading-spinner"></div>
                    <p>Loading images...</p>
                </div>

                <!-- Empty -->
                <div v-else-if="filteredImages.length === 0" class="empty-state">
                    <p>No images found</p>
                </div>

                <!-- Images Grid -->
                <div v-else class="browser-grid">
                    <div v-for="image in paginatedImages" :key="image.id" class="browser-item"
                        :class="{ selected: selectedImage?.id === image.id }" @click="selectImage(image)"
                        @dblclick="confirmSelection(image)">
                        <div class="item-preview">
                            <cimg-rendition :image="image" rendition="avatar" />
                        </div>
                        <div class="item-info">
                            <div class="item-name" :title="image.name">{{ image.name }}</div>
                            <div v-if="image.domaincode" class="item-project">
                                {{ image.domaincode }}
                            </div>
                        </div>
                        <div v-if="selectedImage?.id === image.id" class="selection-indicator">
                            ✓
                        </div>
                    </div>
                </div>

                <!-- Pagination -->
                <div v-if="totalPages > 1" class="browser-pagination">
                    <button @click="currentPage--" :disabled="currentPage === 1" class="page-btn">
                        ←
                    </button>
                    <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>
                    <button @click="currentPage++" :disabled="currentPage >= totalPages" class="page-btn">
                        →
                    </button>
                </div>
            </div>

            <div class="browser-footer">
                <div class="selected-preview" v-if="selectedImage">
                    <cimg-rendition :image="selectedImage" rendition="card" class="preview-image" />
                    <div class="preview-info">
                        <div class="preview-name">{{ selectedImage.name }}</div>
                        <div class="preview-url">{{ selectedImage.url }}</div>
                    </div>
                </div>
                <div v-else class="no-selection">
                    No image selected
                </div>

                <div class="footer-actions">
                    <button @click="$emit('close')" class="action-btn">
                        Cancel
                    </button>
                    <button @click="confirmSelection(selectedImage)" :disabled="!selectedImage"
                        class="action-btn primary">
                        Select
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import CimgRendition from './cimgRendition.vue'

/**
 * CimgBrowser Component
 * 
 * Modal dialog for browsing and selecting images
 */

interface ImageData {
    id: number
    name: string
    url: string
    domaincode?: string | null
    [key: string]: any
}

interface Props {
    projectFilter?: string
}

interface Emits {
    (e: 'close'): void
    (e: 'select', image: ImageData): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// State
const images = ref<ImageData[]>([])
const selectedImage = ref<ImageData | null>(null)
const loading = ref(false)
const searchQuery = ref('')
const filterProject = ref(props.projectFilter || '')
const currentPage = ref(1)
const pageSize = 12

// Projects list
const projects = computed(() => {
    const unique = new Set(
        images.value
            .map(img => img.domaincode)
            .filter((code): code is string => !!code)
    )
    return Array.from(unique).sort()
})

// Filtered images
const filteredImages = computed(() => {
    let result = images.value

    if (searchQuery.value) {
        const search = searchQuery.value.toLowerCase()
        result = result.filter(img =>
            img.name.toLowerCase().includes(search) ||
            img.url.toLowerCase().includes(search)
        )
    }

    if (filterProject.value) {
        result = result.filter(img => img.domaincode === filterProject.value)
    }

    return result
})

// Pagination
const totalPages = computed(() => Math.ceil(filteredImages.value.length / pageSize))

const paginatedImages = computed(() => {
    const start = (currentPage.value - 1) * pageSize
    const end = start + pageSize
    return filteredImages.value.slice(start, end)
})

// Debounced search
let searchTimeout: ReturnType<typeof setTimeout>
const debouncedSearch = () => {
    clearTimeout(searchTimeout)
    searchTimeout = setTimeout(() => {
        currentPage.value = 1
    }, 300)
}

// Load images
const loadImages = async () => {
    loading.value = true

    try {
        const params = new URLSearchParams()
        if (filterProject.value) params.set('domaincode', filterProject.value)

        const url = `/api/images${params.toString() ? '?' + params.toString() : ''}`
        const response = await fetch(url)

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`)
        }

        const data = await response.json()
        images.value = data
    } catch (err) {
        console.error('Error loading images:', err)
    } finally {
        loading.value = false
    }
}

// Select image
const selectImage = (image: ImageData) => {
    selectedImage.value = image
}

// Confirm selection
const confirmSelection = (image: ImageData | null) => {
    if (!image) return
    emit('select', image)
    emit('close')
}

onMounted(() => {
    loadImages()
})
</script>

<style scoped>
.cimg-browser-overlay {
    position: fixed;
    inset: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 1rem;
}

.cimg-browser {
    background-color: var(--color-bg, #fff);
    border-radius: 0.5rem;
    width: 100%;
    max-width: 900px;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.browser-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    border-bottom: 1px solid var(--color-border, #ddd);
}

.browser-header h3 {
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
}

.browser-body {
    flex: 1;
    overflow-y: auto;
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.browser-search {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 0.75rem;
}

.search-input,
.filter-select {
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--color-border, #ddd);
    border-radius: 0.375rem;
    font-size: 0.875rem;
}

.loading-state,
.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem 1rem;
    text-align: center;
}

.loading-spinner {
    width: 2.5rem;
    height: 2.5rem;
    border: 3px solid var(--color-border, #ddd);
    border-top-color: var(--color-primary, #3b82f6);
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

.browser-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 1rem;
}

.browser-item {
    position: relative;
    display: flex;
    flex-direction: column;
    background-color: var(--color-bg, #fff);
    border: 2px solid var(--color-border, #ddd);
    border-radius: 0.375rem;
    overflow: hidden;
    cursor: pointer;
    transition: all 0.2s;
}

.browser-item:hover {
    border-color: var(--color-primary, #3b82f6);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.browser-item.selected {
    border-color: var(--color-primary, #3b82f6);
    background-color: var(--color-primary-light, #dbeafe);
}

.item-preview {
    width: 100%;
    aspect-ratio: 1;
    background-color: var(--color-bg-secondary, #f3f4f6);
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
}

.item-info {
    padding: 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.item-name {
    font-size: 0.75rem;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.item-project {
    font-size: 0.625rem;
    color: var(--color-text-secondary, #666);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.selection-indicator {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    width: 1.5rem;
    height: 1.5rem;
    background-color: var(--color-primary, #3b82f6);
    color: #fff;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.875rem;
    font-weight: 600;
}

.browser-pagination {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 1rem;
    padding-top: 1rem;
}

.page-btn {
    padding: 0.5rem;
    width: 2rem;
    height: 2rem;
    border: 1px solid var(--color-border, #ddd);
    border-radius: 0.25rem;
    background-color: var(--color-bg, #fff);
    cursor: pointer;
    transition: all 0.2s;
}

.page-btn:hover:not(:disabled) {
    background-color: var(--color-bg-hover, #f3f4f6);
}

.page-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
}

.page-info {
    font-size: 0.875rem;
    color: var(--color-text-secondary, #666);
}

.browser-footer {
    border-top: 1px solid var(--color-border, #ddd);
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    background-color: var(--color-bg-secondary, #f9fafb);
}

.selected-preview {
    display: flex;
    gap: 1rem;
    padding: 1rem;
    background-color: var(--color-bg, #fff);
    border: 1px solid var(--color-border, #ddd);
    border-radius: 0.375rem;
}

.preview-image {
    flex-shrink: 0;
}

.preview-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    justify-content: center;
}

.preview-name {
    font-weight: 600;
    font-size: 0.875rem;
}

.preview-url {
    font-size: 0.75rem;
    color: var(--color-text-secondary, #666);
    font-family: monospace;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.no-selection {
    padding: 1rem;
    text-align: center;
    color: var(--color-text-secondary, #666);
    font-size: 0.875rem;
}

.footer-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
}

.action-btn {
    padding: 0.5rem 1.5rem;
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
</style>
