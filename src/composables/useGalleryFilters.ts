/**
 * Composable: useGalleryFilters
 * 
 * Manages filter state for image galleries with sysreg support.
 * Provides active filter tracking, query building, and client-side filtering.
 */

import { ref, computed, watch } from 'vue'
import { hasBit } from './useSysregTags'

export interface GalleryFilters {
    status: string[]
    ttags: string[]
    dtags: string[]
    rtags: string[]
    searchText: string
}

export interface Pagination {
    page: number
    perPage: number
    total: number
    hasMore: boolean
}

type ViewMode = 'grid' | 'list' | 'masonry'
type SortField = 'date' | 'title' | 'status'
type SortOrder = 'asc' | 'desc'

const STORAGE_KEY = 'gallery_filters'
const VIEW_MODE_KEY = 'gallery_view_mode'

export function useGalleryFilters() {
    // Filter state
    const filters = ref<GalleryFilters>({
        status: [],
        ttags: [],
        dtags: [],
        rtags: [],
        searchText: ''
    })

    // Images state
    const images = ref<any[]>([])
    const loading = ref(false)
    const error = ref<string | null>(null)

    // Pagination state
    const pagination = ref<Pagination>({
        page: 1,
        perPage: 20,
        total: 0,
        hasMore: false
    })

    // View state
    const viewMode = ref<ViewMode>('grid')
    const sortField = ref<SortField>('date')
    const sortOrder = ref<SortOrder>('desc')

    // Load filters from localStorage
    function loadFiltersFromStorage() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY)
            if (saved) {
                const parsed = JSON.parse(saved)
                filters.value = { ...filters.value, ...parsed }
            }
        } catch (err) {
            console.warn('Failed to load filters from localStorage:', err)
        }
    }

    // Load view mode from localStorage
    function loadViewModeFromStorage() {
        try {
            const saved = localStorage.getItem(VIEW_MODE_KEY)
            if (saved && ['grid', 'list', 'masonry'].includes(saved)) {
                viewMode.value = saved as ViewMode
            }
        } catch (err) {
            console.warn('Failed to load view mode from localStorage:', err)
        }
    }

    // Initialize from localStorage (but don't use onMounted - causes test warnings)
    loadFiltersFromStorage()
    loadViewModeFromStorage()

    // Save filters to localStorage on change
    watch(filters, (newFilters) => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(newFilters))
        } catch (err) {
            console.warn('Failed to save filters to localStorage:', err)
        }
    }, { deep: true, flush: 'sync' })

    // Save view mode to localStorage
    watch(viewMode, (newMode) => {
        try {
            localStorage.setItem(VIEW_MODE_KEY, newMode)
        } catch (err) {
            console.warn('Failed to save view mode to localStorage:', err)
        }
    }, { flush: 'sync' })

    // Computed: Has active filters
    const hasActiveFilters = computed(() => {
        return (
            filters.value.status.length > 0 ||
            filters.value.ttags.length > 0 ||
            filters.value.dtags.length > 0 ||
            filters.value.rtags.length > 0 ||
            filters.value.searchText.length > 0
        )
    })

    // Filter update functions
    function setStatusFilter(values: string[]) {
        filters.value.status = values
    }

    function setTtagsFilter(values: string[]) {
        filters.value.ttags = values
    }

    function setDtagsFilter(values: string[]) {
        filters.value.dtags = values
    }

    function setRtagsFilter(values: string[]) {
        filters.value.rtags = values
    }

    function setSearchText(text: string) {
        filters.value.searchText = text
    }

    function clearFilters() {
        filters.value = {
            status: [],
            ttags: [],
            dtags: [],
            rtags: [],
            searchText: ''
        }
    }

    // Set images for client-side filtering
    function setImages(newImages: any[]) {
        images.value = newImages
    }

    // View mode management
    function setViewMode(mode: ViewMode) {
        viewMode.value = mode
    }

    // Sorting
    function sortBy(field: SortField, order: SortOrder) {
        sortField.value = field
        sortOrder.value = order
    }

    // Build API query string
    function buildQuery(): string {
        const params: string[] = []

        if (filters.value.status.length > 0) {
            params.push(`status=${filters.value.status.join(',')}`)
        }

        if (filters.value.ttags.length > 0) {
            params.push(`ttags=${filters.value.ttags.join(',')}`)
        }

        if (filters.value.dtags.length > 0) {
            params.push(`dtags=${filters.value.dtags.join(',')}`)
        }

        if (filters.value.rtags.length > 0) {
            params.push(`rtags=${filters.value.rtags.join(',')}`)
        }

        if (filters.value.searchText) {
            params.push(`search=${encodeURIComponent(filters.value.searchText)}`)
        }

        params.push(`page=${pagination.value.page}`)
        params.push(`per_page=${pagination.value.perPage}`)

        return params.join('&')
    }

    // Fetch images from API with filters
    async function fetchFilteredImages() {
        loading.value = true
        error.value = null

        try {
            const query = buildQuery()
            const response = await fetch(`/api/images?${query}`)

            if (!response.ok) {
                throw new Error(`Failed to fetch images: ${response.statusText}`)
            }

            const data = await response.json()
            images.value = data

            // Update pagination
            pagination.value.total = data.length
            pagination.value.hasMore = data.length >= pagination.value.perPage

            return data
        } catch (err: any) {
            error.value = err.message
            console.error('Error fetching filtered images:', err)
            return []
        } finally {
            loading.value = false
        }
    }

    // Load more (next page)
    async function loadMore() {
        pagination.value.page++

        loading.value = true
        error.value = null

        try {
            const query = buildQuery()
            const response = await fetch(`/api/images?${query}`)

            if (!response.ok) {
                throw new Error(`Failed to load more images: ${response.statusText}`)
            }

            const data = await response.json()
            images.value = [...images.value, ...data]

            pagination.value.total = images.value.length
            pagination.value.hasMore = data.length >= pagination.value.perPage

            return data
        } catch (err: any) {
            error.value = err.message
            console.error('Error loading more images:', err)
            return []
        } finally {
            loading.value = false
        }
    }

    // Client-side filtering functions
    function filterByStatus(statusValues: string[]) {
        filters.value.status = statusValues
    }

    function filterByTtags(ttagValues: string[]) {
        filters.value.ttags = ttagValues
    }

    function filterBySearchText(text: string) {
        filters.value.searchText = text
    }

    function applyFilters(filterValues: Partial<GalleryFilters>) {
        if (filterValues.status !== undefined) filters.value.status = filterValues.status
        if (filterValues.ttags !== undefined) filters.value.ttags = filterValues.ttags
        if (filterValues.dtags !== undefined) filters.value.dtags = filterValues.dtags
        if (filterValues.rtags !== undefined) filters.value.rtags = filterValues.rtags
        if (filterValues.searchText !== undefined) filters.value.searchText = filterValues.searchText
    }

    // Filtered images (client-side)
    const filteredImages = computed(() => {
        let result = images.value

        // Filter by status
        if (filters.value.status.length > 0) {
            result = result.filter(img =>
                filters.value.status.includes(img.status_val)
            )
        }

        // Filter by ttags (any match)
        if (filters.value.ttags.length > 0) {
            result = result.filter(img => {
                if (!img.ttags_val) return false
                // Check if any filter tag bits are set in image
                return filters.value.ttags.some((filterTag: string) => {
                    // Both are hex strings like '\\x01'
                    // We need bitwise AND - if non-zero, there's overlap
                    const filterByte = parseInt(filterTag.replace(/^\\x/, ''), 16)
                    const imageByte = parseInt(img.ttags_val.replace(/^\\x/, ''), 16)
                    return (filterByte & imageByte) !== 0
                })
            })
        }

        // Filter by dtags (any match)
        if (filters.value.dtags.length > 0) {
            result = result.filter((img: any) => {
                if (!img.dtags_val) return false
                return filters.value.dtags.some((filterTag: string) => {
                    const filterByte = parseInt(filterTag.replace(/^\\x/, ''), 16)
                    const imageByte = parseInt(img.dtags_val.replace(/^\\x/, ''), 16)
                    return (filterByte & imageByte) !== 0
                })
            })
        }

        // Filter by rtags (any match)
        if (filters.value.rtags.length > 0) {
            result = result.filter((img: any) => {
                if (!img.rtags_val) return false
                return filters.value.rtags.some((filterTag: string) => {
                    const filterByte = parseInt(filterTag.replace(/^\\x/, ''), 16)
                    const imageByte = parseInt(img.rtags_val.replace(/^\\x/, ''), 16)
                    return (filterByte & imageByte) !== 0
                })
            })
        }

        // Filter by search text (title)
        if (filters.value.searchText) {
            const searchLower = filters.value.searchText.toLowerCase()
            result = result.filter((img: any) =>
                img.title?.toLowerCase().includes(searchLower) ||
                img.name?.toLowerCase().includes(searchLower)
            )
        }

        return result
    })

    // Sorted images
    const sortedImages = computed(() => {
        const sorted = [...filteredImages.value]

        if (sortField.value === 'date') {
            sorted.sort((a, b) => {
                const dateA = new Date(a.created_at).getTime()
                const dateB = new Date(b.created_at).getTime()
                return sortOrder.value === 'asc' ? dateA - dateB : dateB - dateA
            })
        } else if (sortField.value === 'title') {
            sorted.sort((a, b) => {
                const titleA = (a.title || a.name || '').toLowerCase()
                const titleB = (b.title || b.name || '').toLowerCase()
                const comparison = titleA.localeCompare(titleB)
                return sortOrder.value === 'asc' ? comparison : -comparison
            })
        } else if (sortField.value === 'status') {
            sorted.sort((a, b) => {
                const statusA = a.status_val || '\\x00'
                const statusB = b.status_val || '\\x00'
                const comparison = statusA.localeCompare(statusB)
                return sortOrder.value === 'asc' ? comparison : -comparison
            })
        }

        return sorted
    })

    return {
        // Filter state
        filters,
        hasActiveFilters,

        // Filter updates
        setStatusFilter,
        setTtagsFilter,
        setDtagsFilter,
        setRtagsFilter,
        setSearchText,
        clearFilters,

        // Images
        images,
        setImages,
        filteredImages,
        sortedImages,

        // API integration
        fetchFilteredImages,
        loadMore,
        loading,
        error,

        // Pagination
        pagination,

        // Client-side filtering
        filterByStatus,
        filterByTtags,
        filterBySearchText,
        applyFilters,

        // View & sorting
        viewMode,
        setViewMode,
        sortBy
    }
}
