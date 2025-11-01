<template>
    <div class="cimg-registry">
        <div class="registry-header">
            <h3>Image Registry</h3>
            <div class="registry-actions">
                <button @click="handleImport" class="action-btn primary">
                    Json-Img-Import
                </button>
                <button @click="showImportDialog = true" class="action-btn primary">
                    + Add Images
                </button>
                <button @click="loadImages" :disabled="loading" class="action-btn">
                    ↻ Refresh
                </button>
            </div>
        </div>

        <!-- Import Dialog -->
        <div v-if="showImportDialog" class="modal-overlay" @click.self="showImportDialog = false">
            <div class="modal-content">
                <div class="modal-header">
                    <button @click="showImportDialog = false" class="close-btn">✕</button>
                </div>
                <CimgImport @imported="handleImported" />
            </div>
        </div>

        <!-- Filters -->
        <div class="filters-section">
            <div class="filters-grid">
                <div class="filter-field">
                    <input v-model="filters.search" type="text" placeholder="Search by name..."
                        @input="debouncedSearch" />
                </div>

                <div class="filter-field">
                    <select v-model="filters.domaincode" @change="loadImages">
                        <option value="">All Projects</option>
                        <option v-for="project in projects" :key="project" :value="project">
                            {{ project }}
                        </option>
                    </select>
                </div>

                <div class="filter-field">
                    <select v-model="filters.status_id" @change="loadImages">
                        <option value="">All Statuses</option>
                        <option value="0">New</option>
                        <option value="1">Demo</option>
                        <option value="2">Draft</option>
                        <option value="4">Done</option>
                        <option value="16">Trash</option>
                        <option value="32">Archived</option>
                    </select>
                </div>

                <div class="filter-field">
                    <label class="checkbox-label">
                        <input v-model="filters.is_public" type="checkbox" @change="loadImages" />
                        Public only
                    </label>
                </div>
            </div>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="loading-state">
            <div class="loading-spinner"></div>
            <p>Loading images...</p>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="error-state">
            <p>{{ error }}</p>
            <button @click="loadImages" class="action-btn">
                Try Again
            </button>
        </div>

        <!-- Empty State -->
        <div v-else-if="filteredImages.length === 0" class="empty-state">
            <div class="empty-icon">📷</div>
            <p>No images found</p>
            <button @click="$emit('import')" class="action-btn primary">
                Import Images
            </button>
        </div>

        <!-- Images Grid -->
        <div v-else class="images-grid">
            <div v-for="image in paginatedImages" :key="image.id" class="image-card" @click="$emit('select', image)">
                <div class="image-preview">
                    <cimg-rendition :image="image" rendition="card" :alt="image.name" />
                </div>
                <div class="image-info">
                    <div class="image-name" :title="image.name">{{ image.name }}</div>
                    <div class="image-meta">
                        <span v-if="image.domaincode" class="meta-item">
                            📦 {{ image.domaincode }}
                        </span>
                        <span v-if="image.status_name" class="meta-item">
                            {{ image.status_name }}
                        </span>
                        <span v-if="image.is_public" class="meta-item">
                            🌐
                        </span>
                    </div>
                </div>
                <div class="image-actions">
                    <button @click.stop="$emit('preview', image)" class="icon-btn" title="Preview">
                        👁
                    </button>
                    <button @click.stop="$emit('edit', image)" class="icon-btn" title="Edit">
                        ✏️
                    </button>
                    <button @click.stop="handleDelete(image)" class="icon-btn danger" title="Delete">
                        🗑
                    </button>
                </div>
            </div>
        </div>

        <!-- Pagination -->
        <div v-if="totalPages > 1" class="pagination">
            <button @click="currentPage--" :disabled="currentPage === 1" class="page-btn">
                ← Previous
            </button>
            <div class="page-info">
                Page {{ currentPage }} of {{ totalPages }}
                ({{ filteredImages.length }} images)
            </div>
            <button @click="currentPage++" :disabled="currentPage >= totalPages" class="page-btn">
                Next →
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import CimgRendition from './cimgRendition.vue'
import CimgImport from './cimgImport.vue'

/**
 * CimgRegistry Component
 * 
 * Sortable/filterable list of all images in registry
 */

interface ImageData {
    id: number
    name: string
    url: string
    domaincode?: string | null
    owner_id?: number | null
    owner_username?: string
    status_id?: number
    status_name?: string
    is_public?: boolean
    tags?: number
    [key: string]: any
}

interface Emits {
    (e: 'select', image: ImageData): void
    (e: 'preview', image: ImageData): void
    (e: 'edit', image: ImageData): void
    (e: 'delete', image: ImageData): void
    (e: 'import'): void
}

const emit = defineEmits<Emits>()

// State
const images = ref<ImageData[]>([])
const loading = ref(false)
const error = ref('')
const currentPage = ref(1)
const pageSize = 24
const showImportDialog = ref(false)

// Filters
const filters = ref({
    search: '',
    domaincode: '',
    status_id: '',
    is_public: false
})

// Unique projects from images
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

    // Search filter
    if (filters.value.search) {
        const search = filters.value.search.toLowerCase()
        result = result.filter(img =>
            img.name.toLowerCase().includes(search) ||
            img.url.toLowerCase().includes(search)
        )
    }

    // Project filter
    if (filters.value.domaincode) {
        result = result.filter(img => img.domaincode === filters.value.domaincode)
    }

    // Status filter
    if (filters.value.status_id) {
        result = result.filter(img => img.status_id === Number(filters.value.status_id))
    }

    // Public filter
    if (filters.value.is_public) {
        result = result.filter(img => img.is_public === true)
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
        loadImages()
    }, 300)
}

// Load images from API
const loadImages = async () => {
    loading.value = true
    error.value = ''

    try {
        const params = new URLSearchParams()
        if (filters.value.domaincode) params.set('domaincode', filters.value.domaincode)
        if (filters.value.status_id) params.set('status_id', filters.value.status_id)
        if (filters.value.is_public) params.set('is_public', 'true')

        const url = `/api/images${params.toString() ? '?' + params.toString() : ''}`
        const response = await fetch(url)

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const data = await response.json()
        images.value = data
        currentPage.value = 1
    } catch (err) {
        console.error('Error loading images:', err)
        error.value = err instanceof Error ? err.message : 'Failed to load images'
    } finally {
        loading.value = false
    }
}

// Handle import
const handleImport = async () => {
    // Show file picker for JSON import
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'

    input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0]
        if (!file) return

        try {
            loading.value = true
            const text = await file.text()
            const importData = JSON.parse(text)

            // Validate it's an array
            if (!Array.isArray(importData)) {
                throw new Error('JSON file must contain an array of images')
            }

            // Batch import via API (max 100 at a time)
            let imported = 0
            let failed = 0

            for (let i = 0; i < importData.length; i += 100) {
                const batch = importData.slice(i, i + 100)

                const response = await fetch('/api/images/batch', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ images: batch })
                })

                if (!response.ok) {
                    throw new Error(`Batch import failed: ${response.statusText}`)
                }

                const result = await response.json()
                imported += result.success.length
                failed += result.failed.length
            }

            alert(`Import complete!\nImported: ${imported}\nFailed: ${failed}`)
            await loadImages()
            emit('import')
        } catch (err) {
            console.error('Import error:', err)
            alert(`Import failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
        } finally {
            loading.value = false
        }
    }

    input.click()
}

// Handle imported event from CimgImport component
const handleImported = async () => {
    showImportDialog.value = false
    await loadImages()
}

// Handle delete
const handleDelete = async (image: ImageData) => {
    if (!confirm(`Delete image "${image.name}"?`)) return

    try {
        const response = await fetch(`/api/images/${image.id}`, {
            method: 'DELETE'
        })

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        emit('delete', image)
        await loadImages()
    } catch (err) {
        console.error('Error deleting image:', err)
        alert(`Failed to delete image: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
}

// Load on mount
onMounted(() => {
    loadImages()
})
</script>

<style scoped>
.cimg-registry {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.registry-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.registry-header h3 {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 600;
}

.registry-actions {
    display: flex;
    gap: 0.75rem;
}

.filters-section {
    padding: 1rem;
    background-color: var(--color-bg-secondary, #f9fafb);
    border-radius: 0.5rem;
}

.filters-grid {
    display: grid;
    grid-template-columns: 2fr 1fr 1fr auto;
    gap: 0.75rem;
    align-items: center;
}

.filter-field input[type="text"],
.filter-field select {
    width: 100%;
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--color-border, #ddd);
    border-radius: 0.375rem;
    font-size: 0.875rem;
}

.checkbox-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    cursor: pointer;
    user-select: none;
}

.loading-state,
.error-state,
.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 4rem 2rem;
    text-align: center;
    gap: 1rem;
}

.loading-spinner {
    width: 3rem;
    height: 3rem;
    border: 4px solid var(--color-border, #ddd);
    border-top-color: var(--color-primary, #3b82f6);
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

.empty-icon {
    font-size: 4rem;
    opacity: 0.5;
}

.images-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1.5rem;
}

.image-card {
    display: flex;
    flex-direction: column;
    background-color: var(--color-bg, #fff);
    border: 1px solid var(--color-border, #ddd);
    border-radius: 0.5rem;
    overflow: hidden;
    cursor: pointer;
    transition: all 0.2s;
}

.image-card:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
}

.image-preview {
    width: 100%;
    aspect-ratio: 16 / 9;
    background-color: var(--color-bg-secondary, #f3f4f6);
    overflow: hidden;
}

.image-info {
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.image-name {
    font-weight: 600;
    font-size: 0.875rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.image-meta {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
}

.meta-item {
    font-size: 0.75rem;
    padding: 0.25rem 0.5rem;
    background-color: var(--color-bg-secondary, #f3f4f6);
    border-radius: 0.25rem;
}

.image-actions {
    display: flex;
    gap: 0.25rem;
    padding: 0.5rem;
    border-top: 1px solid var(--color-border, #ddd);
    background-color: var(--color-bg-secondary, #f9fafb);
}

.icon-btn {
    flex: 1;
    padding: 0.5rem;
    background: none;
    border: 1px solid var(--color-border, #ddd);
    border-radius: 0.25rem;
    cursor: pointer;
    font-size: 1rem;
    transition: all 0.2s;
}

.icon-btn:hover {
    background-color: var(--color-bg, #fff);
}

.icon-btn.danger:hover {
    background-color: var(--color-danger-light, #fee2e2);
    border-color: var(--color-danger, #ef4444);
}

.pagination {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    border-top: 1px solid var(--color-border, #ddd);
}

.page-btn {
    padding: 0.5rem 1rem;
    border: 1px solid var(--color-border, #ddd);
    border-radius: 0.375rem;
    background-color: var(--color-bg, #fff);
    cursor: pointer;
    font-weight: 500;
    transition: all 0.2s;
}

.page-btn:hover:not(:disabled) {
    background-color: var(--color-bg-hover, #f3f4f6);
}

.page-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.page-info {
    font-size: 0.875rem;
    color: var(--color-text-secondary, #666);
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

.action-btn.primary:hover {
    background-color: var(--color-primary-dark, #2563eb);
}

/* Modal styles */
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 2rem;
}

.modal-content {
    background-color: var(--color-bg, #fff);
    border-radius: 0.5rem;
    max-width: 900px;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    position: relative;
}

.modal-header {
    position: sticky;
    top: 0;
    right: 0;
    display: flex;
    justify-content: flex-end;
    padding: 1rem;
    background-color: var(--color-bg, #fff);
    z-index: 10;
}

.close-btn {
    width: 2rem;
    height: 2rem;
    border: none;
    background-color: transparent;
    font-size: 1.5rem;
    cursor: pointer;
    color: var(--color-text-secondary, #666);
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 0.25rem;
    transition: all 0.2s;
}

.close-btn:hover {
    background-color: var(--color-bg-hover, #f3f4f6);
    color: var(--color-text, #000);
}
</style>
