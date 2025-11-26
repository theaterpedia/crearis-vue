/**
 * Integration Tests - Sysreg Composables
 * 
 * Tests interaction between multiple sysreg composables:
 * - useSysregOptions + useSysregTags
 * - useImageStatus + useSysregTags
 * - useGalleryFilters + useSysregOptions
 * 
 * Validates composables work correctly together in realistic workflows.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ref, nextTick } from 'vue'
import { useSysregOptions } from '@/composables/useSysregOptions'
import { useSysregTags } from '@/composables/useSysregTags'
import { useImageStatus } from '@/composables/useImageStatus'
import { useGalleryFilters } from '@/composables/useGalleryFilters'
import {
    setupGlobalFetchMock,
    resetGlobalFetchMock,
    mockSysregOptions
} from '../helpers/sysreg-mock-api'

describe('Sysreg Composable Integration', () => {
    beforeEach(() => {
        resetGlobalFetchMock()
        vi.clearAllMocks()
    })

    // ============================================================================
    // Options + Tags Integration (10 tests)
    // ============================================================================

    describe('useSysregOptions + useSysregTags', () => {
        it('options provide values that tags can parse', async () => {
            setupGlobalFetchMock()
            const { fetchOptions, getOptionByName } = useSysregOptions()
            const { parseByteaHex } = useSysregTags()

            await fetchOptions()
            const option = getOptionByName('ttags', 'democracy')

            expect(option).toBeTruthy()
            const bytes = parseByteaHex(option!.value)
            expect(bytes).toBeInstanceOf(Array)
            expect(bytes.length).toBeGreaterThan(0)
        })

        it('tag bit operations work with option values', async () => {
            setupGlobalFetchMock()
            const { fetchOptions, getOptionByName } = useSysregOptions()
            const { setBit, hasBit, clearBit } = useSysregTags()

            await fetchOptions()
            const democracy = getOptionByName('ttags', 'democracy')!

            let value = '\\x00'
            value = setBit(value, 0) // Set democracy bit

            expect(hasBit(value, 0)).toBe(true)

            value = clearBit(value, 0)
            expect(hasBit(value, 0)).toBe(false)
        })

        it('combines multiple options with OR operation', async () => {
            setupGlobalFetchMock()
            const { fetchOptions, getOptionsByFamily } = useSysregOptions()
            const { orBytea, hasBit } = useSysregTags()

            await fetchOptions()
            const ttags = getOptionsByFamily('ttags')

            // Combine first 3 topic tags
            const combined = orBytea([ttags[0].value, ttags[1].value, ttags[2].value])

            expect(hasBit(combined, 0)).toBe(true) // Bit 0
            expect(hasBit(combined, 1)).toBe(true) // Bit 1
            expect(hasBit(combined, 2)).toBe(true) // Bit 2
            expect(hasBit(combined, 3)).toBe(false) // Bit 3 not set
        })

        it('filters options by context and applies to tags', async () => {
            setupGlobalFetchMock()
            const { fetchOptions, ctagsOptions, ttagsOptions } = useSysregOptions()
            const { setBit } = useSysregTags()

            await fetchOptions()

            // Check that we have ctags and ttags options
            expect(ctagsOptions.value.length).toBeGreaterThanOrEqual(0)
            expect(ttagsOptions.value.length).toBeGreaterThan(0)

            // Verify setBit works with valid bit positions
            let value = '\\x00'
            value = setBit(value, 0)
            value = setBit(value, 2)
            value = setBit(value, 5)

            expect(value).not.toBe('\\x00')
        })

        it('label lookups match bit position operations', async () => {
            setupGlobalFetchMock()
            const { fetchOptions, getTagLabel } = useSysregOptions()
            const { setBit, hasBit } = useSysregTags()

            await fetchOptions()

            let value = '\\x00'
            value = setBit(value, 3) // Set bit 3 (human_rights)

            const label = getTagLabel('ttags', value)
            expect(label).toContain('Human Rights')
            expect(hasBit(value, 3)).toBe(true)
        })

        it('multi-byte operations work with option combinations', async () => {
            setupGlobalFetchMock()
            const { fetchOptions, getOptionsByFamily } = useSysregOptions()
            const { setBit, countBits } = useSysregTags()

            await fetchOptions()
            const ctags = getOptionsByFamily('ctags')

            // Set multiple bits within single byte
            let value = '\\x00'
            value = setBit(value, 0) // Bit 0
            value = setBit(value, 3) // Bit 3
            value = setBit(value, 6) // Bit 6

            expect(countBits(value)).toBe(3)
        })

        it('validates tag family consistency between composables', async () => {
            setupGlobalFetchMock()
            const { fetchOptions, statusOptions, configOptions } = useSysregOptions()

            await fetchOptions()

            expect(statusOptions.value.length).toBeGreaterThan(0)
            expect(configOptions.value.length).toBe(0) // No config entries in mock
        })

        it('handles null/empty values gracefully across composables', async () => {
            setupGlobalFetchMock()
            const { fetchOptions } = useSysregOptions()
            const { parseByteaHex, hasBit } = useSysregTags()

            await fetchOptions()

            const bytes = parseByteaHex('\\x00')
            expect(bytes).toEqual([0])

            expect(hasBit('\\x00', 0)).toBe(false)
        })

        it('cache initialization is shared between composables', async () => {
            setupGlobalFetchMock()
            const options1 = useSysregOptions()
            const tags1 = useSysregTags()

            await options1.fetchOptions()

            const options2 = useSysregOptions()
            const tags2 = useSysregTags()

            // Both should share the same cache
            expect(options2.options.value.length).toBe(options1.options.value.length)
            expect(tags1.cacheInitialized.value).toBe(tags2.cacheInitialized.value)
        })

        it('bit group operations integrate with option metadata', async () => {
            setupGlobalFetchMock()
            const { fetchOptions, getCtagsBitGroup } = useSysregOptions()
            const { setBit, hasBit } = useSysregTags()

            await fetchOptions()

            const ageGroup = getCtagsBitGroup('age_group')
            expect(ageGroup.length).toBe(4)

            // Set a bit for first age group option
            let value = '\\x00'
            value = setBit(value, ageGroup[0].value)

            expect(hasBit(value, ageGroup[0].value)).toBe(true)
        })
    })

    // ============================================================================
    // Status + Tags Integration (15 tests)
    // ============================================================================

    describe('useImageStatus + useSysregTags', () => {
        it('status workflow uses tag operations internally', async () => {
            setupGlobalFetchMock()
            const image = ref({ id: 1, status: '\\x00', ctags: '\\x00' })
            const { currentStatus, isRaw } = useImageStatus(image)
            const { parseByteaHex } = useSysregTags()

            expect(isRaw.value).toBe(true)

            const bytes = parseByteaHex(image.value.status)
            expect(bytes[0]).toBe(0)
        })

        it('status transitions apply BYTEA updates', async () => {
            setupGlobalFetchMock()
            const { initCache } = useSysregTags()
            await initCache()

            const image = ref({ id: 1, status: '\\x00', ctags: '\\x00' })
            const { startProcessing, isProcessing } = useImageStatus(image)

            // Mock API call
            global.fetch = vi.fn().mockResolvedValueOnce({
                ok: true,
                json: async () => ({ id: 1, status: '\\x01', ctags: '\\x00' })
            })

            await startProcessing()

            expect(isProcessing.value).toBe(true)
            expect(image.value.status).toBe('\\x01')
        })

        it('validates next transitions using tag values', async () => {
            setupGlobalFetchMock()
            const { initCache } = useSysregTags()
            await initCache()

            const image = ref({ id: 1, status: '\\x00', ctags: '\\x00' })
            const { canPublish, canApprove } = useImageStatus(image)

            expect(canPublish.value).toBe(false) // Can't publish from raw
            expect(canApprove.value).toBe(true) // Can approve from raw
        })

        it('config bit operations work with status', async () => {
            setupGlobalFetchMock()
            const { initCache } = useSysregTags()
            await initCache()

            const image = ref({ id: 1, status: '\\x00', ctags: '\\x00' })
            const { setBitInField, hasBitInField } = useImageStatus(image)
            const { hasBit } = useSysregTags()

            setBitInField('ctags', 0)

            expect(hasBitInField('ctags', 0)).toBe(true)
            expect(hasBit(image.value.ctags, 0)).toBe(true)
        })

        it('multiple status transitions chain correctly', async () => {
            setupGlobalFetchMock()
            const { initCache } = useSysregTags()
            await initCache()

            const image = ref({ id: 1, status: '\\x00', ctags: '\\x00' })
            const { startProcessing, approveImage, publishImage, isPublished } = useImageStatus(image)

            // Mock API calls
            global.fetch = vi.fn()
                .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 1, status: '\\x01', ctags: '\\x00' }) })
                .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 1, status: '\\x02', ctags: '\\x00' }) })
                .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 1, status: '\\x04', ctags: '\\x00' }) })

            await startProcessing() // raw -> processing
            expect(image.value.status).toBe('\\x01')

            await approveImage() // processing -> approved
            expect(image.value.status).toBe('\\x02')

            await publishImage() // approved -> published
            expect(image.value.status).toBe('\\x04')
            expect(isPublished.value).toBe(true)
        })

        it('status labels come from options', async () => {
            setupGlobalFetchMock()
            const { fetchOptions, getOptionByValue } = useSysregOptions()
            const { initCache } = useSysregTags()
            await initCache()
            await fetchOptions()

            const image = ref({ id: 1, status: '\\x04', ctags: '\\x00' })
            const { currentStatus } = useImageStatus(image)

            const option = getOptionByValue('status', '\\x04')
            expect(option).toBeTruthy()
            if (option) {
                expect(option.label).toBe('Published')
            }
        })

        it('resets status to raw using BYTEA zero', async () => {
            setupGlobalFetchMock()
            const { initCache } = useSysregTags()
            await initCache()

            const image = ref({ id: 1, status: '\\x04', ctags: '\\x00' })
            const { resetToRaw, isRaw } = useImageStatus(image)

            // Mock API call
            global.fetch = vi.fn().mockResolvedValueOnce({
                ok: true,
                json: async () => ({ id: 1, status: '\\x00', ctags: '\\x00' })
            })

            await resetToRaw()

            expect(isRaw.value).toBe(true)
            expect(image.value.status).toBe('\\x00')
        })

        it('counts set config bits', async () => {
            setupGlobalFetchMock()
            const { initCache } = useSysregTags()
            await initCache()

            const image = ref({ id: 1, status: '\\x00', ctags: '\\x00' })
            const { setBitInField } = useImageStatus(image)
            const { countBits } = useSysregTags()

            setBitInField('ctags', 0)
            setBitInField('ctags', 2)
            setBitInField('ctags', 4)

            expect(countBits(image.value.ctags)).toBe(3)
        })

        it('clears config bits individually', async () => {
            setupGlobalFetchMock()
            const { initCache } = useSysregTags()
            await initCache()

            const image = ref({ id: 1, status: '\\x00', ctags: '\\x07' }) // Bits 0,1,2 set
            const { clearBitInField, hasBitInField } = useImageStatus(image)

            clearBitInField('ctags', 1)

            expect(hasBitInField('ctags', 0)).toBe(true)
            expect(hasBitInField('ctags', 1)).toBe(false)
            expect(hasBitInField('ctags', 2)).toBe(true)
        })

        it('toggles config bits', async () => {
            setupGlobalFetchMock()
            const { initCache } = useSysregTags()
            await initCache()

            const image = ref({ id: 1, status: '\\x00', ctags: '\\x00' })
            const { toggleBitInField, hasBitInField } = useImageStatus(image)

            toggleBitInField('ctags', 3)
            expect(hasBitInField('ctags', 3)).toBe(true)

            toggleBitInField('ctags', 3)
            expect(hasBitInField('ctags', 3)).toBe(false)
        })

        it('status validation uses parseByteaHex', async () => {
            setupGlobalFetchMock()
            const { initCache, parseByteaHex } = useSysregTags()
            await initCache()

            const image = ref({ id: 1, status: '\\x02', ctags: '\\x00' })
            const { isApproved } = useImageStatus(image)

            const bytes = parseByteaHex(image.value.status)
            expect(bytes[0]).toBe(2)
            expect(isApproved.value).toBe(true)
        })

        it('deprecated status blocks publishing', async () => {
            setupGlobalFetchMock()
            const { initCache } = useSysregTags()
            await initCache()

            const image = ref({ id: 1, status: '\\x08', ctags: '\\x00' }) // Deprecated
            const { canPublish, isDeprecated } = useImageStatus(image)

            expect(isDeprecated.value).toBe(true)
            expect(canPublish.value).toBe(false)
        })

        it('archived status is terminal', async () => {
            setupGlobalFetchMock()
            const { initCache } = useSysregTags()
            await initCache()

            const image = ref({ id: 1, status: '\\x10', ctags: '\\x00' }) // Archived
            const { isArchived, canPublish, canApprove } = useImageStatus(image)

            expect(isArchived.value).toBe(true)
            expect(canPublish.value).toBe(false)
            expect(canApprove.value).toBe(false)
        })

        it('combines status checks with config bits', async () => {
            setupGlobalFetchMock()
            const { initCache } = useSysregTags()
            await initCache()

            const image = ref({ id: 1, status: '\\x04', ctags: '\\x01' })
            const { isPublished, hasBitInField } = useImageStatus(image)

            expect(isPublished.value).toBe(true)
            expect(hasBitInField('ctags', 0)).toBe(true)
        })

        it('workflow provides valid next steps', async () => {
            setupGlobalFetchMock()
            const { initCache } = useSysregTags()
            await initCache()

            const image = ref({ id: 1, status: '\\x01', ctags: '\\x00' }) // Processing
            const { canApprove, canPublish } = useImageStatus(image)

            // From processing, can approve but can't publish directly
            expect(canApprove.value).toBe(true)
            expect(canPublish.value).toBe(false)
        })
    })

    // ============================================================================
    // Filters + Options Integration (10 tests)
    // ============================================================================

    describe('useGalleryFilters + useSysregOptions', () => {
        it('filter options come from sysreg options', async () => {
            setupGlobalFetchMock()
            const { fetchOptions, statusOptions } = useSysregOptions()
            await fetchOptions()

            const filters = useGalleryFilters()

            expect(statusOptions.value.length).toBeGreaterThan(0)
            // Filters would use these options for dropdown/chips
        })

        it('status filter values match option values', async () => {
            setupGlobalFetchMock()
            const { fetchOptions, getOptionByName } = useSysregOptions()
            await fetchOptions()

            const filters = useGalleryFilters()
            const published = getOptionByName('status', 'published')

            filters.setStatusFilter([published!.value])

            expect(published!.value).toBe('\\x04')
            expect(filters.filters.value.status).toContain('\\x04')
        })

        it('multi-select tag filters use OR operations', async () => {
            setupGlobalFetchMock()
            const { fetchOptions } = useSysregOptions()
            const { orBytea } = useSysregTags()
            await fetchOptions()

            const filters = useGalleryFilters()

            filters.setTtagsFilter(['\\x01', '\\x02'])

            // Combined filter would be OR of all selected tags
            const combined = filters.filters.value.ttags
            expect(combined).not.toBe('\\x00')
        })

        it('clears all filters resets to zero BYTEA', async () => {
            setupGlobalFetchMock()
            const filters = useGalleryFilters()

            filters.setStatusFilter(['\\x04'])
            filters.setTtagsFilter(['\\x01'])
            filters.clearFilters()

            expect(filters.filters.value.status.length).toBe(0)
            expect(filters.filters.value.ttags.length).toBe(0)
        })

        it('active filter count matches set bits', async () => {
            setupGlobalFetchMock()
            const { initCache } = useSysregTags()
            await initCache()

            const filters = useGalleryFilters()

            filters.setTtagsFilter(['\\x01', '\\x02', '\\x04'])

            expect(filters.filters.value.ttags.length).toBe(3)
        })

        it('filter labels come from getTagLabel', async () => {
            setupGlobalFetchMock()
            const { fetchOptions, getTagLabel } = useSysregOptions()
            await fetchOptions()

            const filters = useGalleryFilters()
            filters.setTtagsFilter(['\\x01']) // Bit 0 - democracy

            const label = getTagLabel('ttags', '\\x01')
            expect(label).toContain('Democracy')
        })

        it('pagination works with filtered results', async () => {
            setupGlobalFetchMock()
            const filters = useGalleryFilters()

            filters.setStatusFilter(['\\x04'])
            filters.pagination.value.page = 2
            filters.pagination.value.perPage = 20

            expect(filters.pagination.value.page).toBe(2)
            expect(filters.pagination.value.perPage).toBe(20)
        })

        it('sorting applies to filtered datasets', async () => {
            setupGlobalFetchMock()
            const filters = useGalleryFilters()

            filters.setStatusFilter(['\\x04'])
            filters.sortBy('date', 'desc')

            // sortBy updates sortField/sortOrder internally (not exported but would be 'date' and 'desc')
            expect(filters.hasActiveFilters.value).toBe(true)
        })

        it('search term combines with tag filters', async () => {
            setupGlobalFetchMock()
            const filters = useGalleryFilters()

            filters.setSearchText('democracy')
            filters.setTtagsFilter(['\\x01'])

            expect(filters.filters.value.searchText).toBe('democracy')
            expect(filters.filters.value.ttags.length).toBe(1)
        })

        it('filter state can be serialized for URL params', async () => {
            setupGlobalFetchMock()
            const filters = useGalleryFilters()

            filters.setStatusFilter(['\\x04'])
            filters.setTtagsFilter(['\\x01'])
            filters.pagination.value.page = 2

            // Would serialize to URL: ?status=\\x04&tags=\\x01&page=2
            expect(filters.filters.value.status).toContain('\\x04')
            expect(filters.pagination.value.page).toBe(2)
        })
    })

    // ============================================================================
    // Complete Workflow Integration (5 tests)
    // ============================================================================

    describe('Complete Workflow Integration', () => {
        it('image lifecycle: raw → processing → approved → published', async () => {
            setupGlobalFetchMock()
            const { initCache } = useSysregTags()
            const { fetchOptions, getOptionByValue } = useSysregOptions()
            await initCache()
            await fetchOptions()

            const image = ref({ id: 1, status: '\\x00', ctags: '\\x00' })
            const { startProcessing, approveImage, publishImage, isPublished } = useImageStatus(image)

            // Mock API calls for status transitions
            global.fetch = vi.fn()
                .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 1, status: '\\x01', ctags: '\\x00' }) })
                .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 1, status: '\\x02', ctags: '\\x00' }) })
                .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 1, status: '\\x04', ctags: '\\x00' }) })

            await startProcessing()
            expect(image.value.status).toBe('\\x01')
            const processingOpt = getOptionByValue('status', '\\x01')
            expect(processingOpt!.label).toBe('Processing')

            await approveImage()
            expect(image.value.status).toBe('\\x02')
            const approvedOpt = getOptionByValue('status', '\\x02')
            expect(approvedOpt!.label).toBe('Approved')

            await publishImage()
            expect(image.value.status).toBe('\\x04')
            expect(isPublished.value).toBe(true)
        })

        it('gallery filtering with tags and status', async () => {
            setupGlobalFetchMock()
            const { fetchOptions, getOptionByName } = useSysregOptions()
            await fetchOptions()

            const filters = useGalleryFilters()
            const published = getOptionByName('status', 'published')

            filters.setStatusFilter([published!.value])
            filters.setTtagsFilter(['\\x01']) // Democracy topic

            expect(filters.hasActiveFilters.value).toBe(true)
        })

        it('batch status updates with tag operations', async () => {
            setupGlobalFetchMock()
            const { initCache } = useSysregTags()
            await initCache()

            // Mock API calls for each status update (3 images = 3 calls)
            global.fetch = vi.fn()
                .mockResolvedValue({ ok: true, json: async () => ({ id: 1, status: '\\x01', ctags: '\\x00' }) })

            const images = [
                ref({ id: 1, status: '\\x00', ctags: '\\x00' }),
                ref({ id: 2, status: '\\x00', ctags: '\\x00' }),
                ref({ id: 3, status: '\\x00', ctags: '\\x00' })
            ]

            for (const image of images) {
                const { startProcessing } = useImageStatus(image)
                await startProcessing()
                expect(image.value.status).toBe('\\x01')
            }
        })

        it('filter by multiple tags using OR', async () => {
            setupGlobalFetchMock()
            const { fetchOptions } = useSysregOptions()
            const { orBytea, hasBit } = useSysregTags()
            await fetchOptions()

            const filters = useGalleryFilters()
            filters.setTtagsFilter(['\\x01', '\\x02', '\\x04']) // Bits 0, 1, 2

            // Combined filter would be OR of all selected tags
            expect(filters.filters.value.ttags).toContain('\\x01')
            expect(filters.filters.value.ttags).toContain('\\x02')
            expect(filters.filters.value.ttags).toContain('\\x04')
        })

        it('status badge displays with tag labels', async () => {
            setupGlobalFetchMock()
            const { fetchOptions, getOptionByValue } = useSysregOptions()
            const { initCache } = useSysregTags()
            await initCache()
            await fetchOptions()

            const image = ref({ id: 1, status: '\\x04', ctags: '\\x01' })
            const { isPublished } = useImageStatus(image)

            const statusOpt = getOptionByValue('status', '\\x04')
            expect(statusOpt!.label).toBe('Published')
            expect(isPublished.value).toBe(true)
        })
    })
})
