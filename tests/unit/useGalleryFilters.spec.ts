/**
 * Unit Tests: useGalleryFilters
 * 
 * Tests filter state management and API integration for gallery views.
 * Total: 30 tests covering filter state, persistence, and API calls.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useGalleryFilters } from '@/composables/useGalleryFilters'
import {
    createTestImages,
    createImageWithStatus,
    createImageWithTags
} from '../helpers/sysreg-test-data'
import {
    mockFetchEntities,
    mockFetchError,
    getMockOptionsByFamily
} from '../helpers/sysreg-mock-api'

describe('useGalleryFilters - Filter State Management', () => {

    beforeEach(() => {
        vi.clearAllMocks()
        localStorage.clear()
    })

    afterEach(() => {
        localStorage.clear()
    })

    // ============================================================================
    // Filter Initialization - 5 tests
    // ============================================================================

    describe('Filter initialization', () => {
        it('initializes with default filter state', () => {
            const { filters } = useGalleryFilters()

            expect(filters.value.status).toEqual([])
            expect(filters.value.ttags).toEqual([])
            expect(filters.value.dtags).toEqual([])
            expect(filters.value.rtags).toEqual([])
            expect(filters.value.searchText).toBe('')
        })

        it('loads filters from localStorage if available', () => {
            const savedFilters = {
                status: ['\\x04'],
                ttags: ['\\x01', '\\x02'],
                searchText: 'democracy'
            }
            localStorage.setItem('gallery_filters', JSON.stringify(savedFilters))

            const { filters } = useGalleryFilters()

            expect(filters.value.status).toEqual(['\\x04'])
            expect(filters.value.ttags).toEqual(['\\x01', '\\x02'])
            expect(filters.value.searchText).toBe('democracy')
        })

        it('ignores invalid localStorage data', () => {
            localStorage.setItem('gallery_filters', 'invalid json{')

            const { filters } = useGalleryFilters()

            expect(filters.value.status).toEqual([])
        })

        it('initializes with no active filters', () => {
            const { hasActiveFilters } = useGalleryFilters()

            expect(hasActiveFilters.value).toBe(false)
        })

        it('loads default view mode', () => {
            const { viewMode } = useGalleryFilters()

            expect(viewMode.value).toBe('grid')
        })
    })

    // ============================================================================
    // Filter Updates - 8 tests
    // ============================================================================

    describe('Filter updates', () => {
        it('updates status filter', () => {
            const { filters, setStatusFilter } = useGalleryFilters()

            setStatusFilter(['\\x04', '\\x08'])

            expect(filters.value.status).toEqual(['\\x04', '\\x08'])
        })

        it('updates ttags filter', () => {
            const { filters, setTtagsFilter } = useGalleryFilters()

            setTtagsFilter(['\\x01', '\\x02'])

            expect(filters.value.ttags).toEqual(['\\x01', '\\x02'])
        })

        it('updates dtags filter', () => {
            const { filters, setDtagsFilter } = useGalleryFilters()

            setDtagsFilter(['\\x01'])

            expect(filters.value.dtags).toEqual(['\\x01'])
        })

        it('updates rtags filter', () => {
            const { filters, setRtagsFilter } = useGalleryFilters()

            setRtagsFilter(['\\x01', '\\x02'])

            expect(filters.value.rtags).toEqual(['\\x01', '\\x02'])
        })

        it('updates search text filter', () => {
            const { filters, setSearchText } = useGalleryFilters()

            setSearchText('environment')

            expect(filters.value.searchText).toBe('environment')
        })

        it('persists filters to localStorage on update', () => {
            const { setStatusFilter, setSearchText } = useGalleryFilters()

            setStatusFilter(['\\x04'])
            setSearchText('test')

            const saved = JSON.parse(localStorage.getItem('gallery_filters') || '{}')
            expect(saved.status).toEqual(['\\x04'])
            expect(saved.searchText).toBe('test')
        })

        it('marks filters as active when set', () => {
            const { setStatusFilter, hasActiveFilters } = useGalleryFilters()

            setStatusFilter(['\\x04'])

            expect(hasActiveFilters.value).toBe(true)
        })

        it('resets all filters', () => {
            const { filters, setStatusFilter, setTtagsFilter, setSearchText, clearFilters } = useGalleryFilters()

            setStatusFilter(['\\x04'])
            setTtagsFilter(['\\x01'])
            setSearchText('test')

            clearFilters()

            expect(filters.value.status).toEqual([])
            expect(filters.value.ttags).toEqual([])
            expect(filters.value.searchText).toBe('')
        })
    })

    // ============================================================================
    // API Integration - 8 tests
    // ============================================================================

    describe('API integration', () => {
        it('fetches images with no filters', async () => {
            const mockImages = createTestImages(5)
            global.fetch = mockFetchEntities(mockImages)

            const { fetchFilteredImages, images } = useGalleryFilters()
            await fetchFilteredImages()

            expect(images.value).toHaveLength(5)
        })

        it('includes status filter in API call', async () => {
            const publishedImages = [createImageWithStatus('published')]
            let capturedUrl = ''

            global.fetch = vi.fn().mockImplementation((url) => {
                capturedUrl = url
                return Promise.resolve({
                    ok: true,
                    json: async () => publishedImages
                })
            })

            const { setStatusFilter, fetchFilteredImages } = useGalleryFilters()
            setStatusFilter(['\\x04'])
            await fetchFilteredImages()

            expect(capturedUrl).toContain('status=')
        })

        it('includes ttags filter in API call', async () => {
            const taggedImages = [createImageWithTags(['\\x01'])]
            let capturedUrl = ''

            global.fetch = vi.fn().mockImplementation((url) => {
                capturedUrl = url
                return Promise.resolve({
                    ok: true,
                    json: async () => taggedImages
                })
            })

            const { setTtagsFilter, fetchFilteredImages } = useGalleryFilters()
            setTtagsFilter(['\\x01'])
            await fetchFilteredImages()

            expect(capturedUrl).toContain('ttags=')
        })

        it('includes search text in API call', async () => {
            const mockImages = createTestImages(3)
            let capturedUrl = ''

            global.fetch = vi.fn().mockImplementation((url) => {
                capturedUrl = url
                return Promise.resolve({
                    ok: true,
                    json: async () => mockImages
                })
            })

            const { setSearchText, fetchFilteredImages } = useGalleryFilters()
            setSearchText('democracy')
            await fetchFilteredImages()

            expect(capturedUrl).toContain('search=democracy')
        })

        it('sets loading state during fetch', async () => {
            const mockImages = createTestImages(2)
            global.fetch = mockFetchEntities(mockImages)

            const { fetchFilteredImages, loading } = useGalleryFilters()

            const promise = fetchFilteredImages()
            expect(loading.value).toBe(true)

            await promise
            expect(loading.value).toBe(false)
        })

        it('handles API errors gracefully', async () => {
            global.fetch = mockFetchError('Network error')

            const { fetchFilteredImages, error } = useGalleryFilters()
            await fetchFilteredImages()

            expect(error.value).toBeTruthy()
            expect(error.value).toContain('Network error')
        })

        it('paginates results', async () => {
            const mockImages = createTestImages(20)
            global.fetch = mockFetchEntities(mockImages)

            const { fetchFilteredImages, pagination } = useGalleryFilters()
            await fetchFilteredImages()

            expect(pagination.value.total).toBe(20)
            expect(pagination.value.page).toBe(1)
        })

        it('loads next page', async () => {
            const firstPage = createTestImages(10)
            const secondPage = createTestImages(10)
            let callCount = 0

            global.fetch = vi.fn().mockImplementation(() => {
                callCount++
                return Promise.resolve({
                    ok: true,
                    json: async () => callCount === 1 ? firstPage : secondPage
                })
            })

            const { fetchFilteredImages, loadMore, images } = useGalleryFilters()

            await fetchFilteredImages()
            expect(images.value).toHaveLength(10)

            await loadMore()
            expect(images.value).toHaveLength(20)
        })
    })

    // ============================================================================
    // Client-Side Filtering - 5 tests
    // ============================================================================

    describe('Client-side filtering', () => {
        it('filters images by status locally', () => {
            const publishedImage = createImageWithStatus('published')
            const rawImage = createImageWithStatus('raw')
            const images = [publishedImage, rawImage]

            const { setImages, filterByStatus, filteredImages } = useGalleryFilters()
            setImages(images)
            filterByStatus(['\\x04'])

            expect(filteredImages.value).toHaveLength(1)
            expect(filteredImages.value[0].status).toBe('\\x04')
        })

        it('filters images by ttags locally', () => {
            const democracyImage = createImageWithTags(['\\x01'])
            const environmentImage = createImageWithTags(['\\x02'])
            const images = [democracyImage, environmentImage]

            const { setImages, filterByTtags, filteredImages } = useGalleryFilters()
            setImages(images)
            filterByTtags(['\\x01'])

            expect(filteredImages.value).toHaveLength(1)
        })

        it('filters by search text (title)', () => {
            const matchingImage = createTestImages(1)[0]
            matchingImage.title = 'Democracy in Action'
            const nonMatchingImage = createTestImages(1)[0]
            nonMatchingImage.title = 'Technology'

            const { setImages, filterBySearchText, filteredImages } = useGalleryFilters()
            setImages([matchingImage, nonMatchingImage])
            filterBySearchText('democracy')

            expect(filteredImages.value).toHaveLength(1)
            expect(filteredImages.value[0].title).toContain('Democracy')
        })

        it('combines multiple filters (AND logic)', () => {
            const matchingImage = createImageWithStatus('published')
            matchingImage.ttags = '\\x01'
            matchingImage.title = 'Democracy'

            const wrongStatus = createImageWithStatus('raw')
            wrongStatus.ttags = '\\x01'
            wrongStatus.title = 'Democracy'

            const wrongTag = createImageWithStatus('published')
            wrongTag.ttags = '\\x02'
            wrongTag.title = 'Democracy'

            const { setImages, applyFilters, filteredImages } = useGalleryFilters()
            setImages([matchingImage, wrongStatus, wrongTag])

            applyFilters({
                status: ['\\x04'],
                ttags: ['\\x01'],
                searchText: 'democracy'
            })

            expect(filteredImages.value).toHaveLength(1)
        })

        it('returns all images when no filters active', () => {
            const images = createTestImages(5)

            const { setImages, filteredImages } = useGalleryFilters()
            setImages(images)

            expect(filteredImages.value).toHaveLength(5)
        })
    })

    // ============================================================================
    // View Mode & Sorting - 4 tests
    // ============================================================================

    describe('View mode and sorting', () => {
        it('switches view mode', () => {
            const { viewMode, setViewMode } = useGalleryFilters()

            setViewMode('list')

            expect(viewMode.value).toBe('list')
        })

        it('persists view mode to localStorage', () => {
            const { setViewMode } = useGalleryFilters()

            setViewMode('masonry')

            const saved = localStorage.getItem('gallery_view_mode')
            expect(saved).toBe('masonry')
        })

        it('sorts images by date', () => {
            const older = createTestImages(1)[0]
            older.created_at = '2024-01-01T00:00:00Z'
            const newer = createTestImages(1)[0]
            newer.created_at = '2024-12-01T00:00:00Z'

            const { setImages, sortBy, sortedImages } = useGalleryFilters()
            setImages([older, newer])
            sortBy('date', 'desc')

            expect(sortedImages.value[0].created_at).toBe(newer.created_at)
        })

        it('sorts images by title', () => {
            const imageA = createTestImages(1)[0]
            imageA.title = 'Apple'
            const imageB = createTestImages(1)[0]
            imageB.title = 'Banana'

            const { setImages, sortBy, sortedImages } = useGalleryFilters()
            setImages([imageB, imageA])
            sortBy('title', 'asc')

            expect(sortedImages.value[0].title).toBe('Apple')
        })
    })
})
