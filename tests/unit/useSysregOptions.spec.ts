/**
 * Unit Tests: useSysregOptions
 * 
 * Tests sysreg option fetching and lookup utilities.
 * Total: 25 tests covering all option management functions.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useSysregOptions } from '@/composables/useSysregOptions'
import {
    mockFetchSysregOptions,
    mockFetchError,
    mockFetchHttpError,
    mockSysregOptions,
    getMockOption,
    getMockOptionsByFamily,
    getMockOptionsByBitGroup,
    setupGlobalFetchMock,
    resetGlobalFetchMock
} from '../helpers/sysreg-mock-api'

describe('useSysregOptions - Option Management', () => {

    beforeEach(() => {
        // Reset fetch mock before each test
        resetGlobalFetchMock()
        // Clear any cached options
        vi.clearAllMocks()
    })

    // ============================================================================
    // fetchOptions() - 5 tests
    // ============================================================================

    describe('fetchOptions', () => {
        it('fetches sysreg options on first call', async () => {
            global.fetch = mockFetchSysregOptions()
            const { fetchOptions, options } = useSysregOptions()

            await fetchOptions()

            expect(options.value.length).toBe(38)
            expect(global.fetch).toHaveBeenCalledTimes(1)
        })

        it('caches options after first fetch', async () => {
            global.fetch = mockFetchSysregOptions()
            const { fetchOptions, options } = useSysregOptions()

            await fetchOptions()
            const firstCount = options.value.length

            await fetchOptions()

            expect(options.value.length).toBe(firstCount)
            expect(global.fetch).toHaveBeenCalledTimes(1) // Still only 1 call
        })

        it('force refresh bypasses cache', async () => {
            global.fetch = mockFetchSysregOptions()
            const { fetchOptions } = useSysregOptions()

            await fetchOptions()
            await fetchOptions(true) // Force refresh

            expect(global.fetch).toHaveBeenCalledTimes(2)
        })

        it('handles fetch errors gracefully', async () => {
            global.fetch = mockFetchError('Network error')
            const { fetchOptions, error, loading } = useSysregOptions()

            await fetchOptions()

            expect(error.value).toBeTruthy()
            expect(error.value).toContain('Network error')
            expect(loading.value).toBe(false)
        })

        it('sets loading state correctly', async () => {
            global.fetch = mockFetchSysregOptions()
            const { fetchOptions, loading } = useSysregOptions()

            const promise = fetchOptions()
            expect(loading.value).toBe(true)

            await promise
            expect(loading.value).toBe(false)
        })
    })

    // ============================================================================
    // getTagLabel() - 6 tests
    // ============================================================================

    describe('getTagLabel', () => {
        beforeEach(async () => {
            setupGlobalFetchMock()
            const { fetchOptions } = useSysregOptions()
            await fetchOptions()
        })

        it('returns label for valid ttags value', () => {
            const { getTagLabel } = useSysregOptions()
            const label = getTagLabel('ttags', '\\x01')
            expect(label).toBe('Democracy')
        })

        it('returns label for valid dtags value', () => {
            const { getTagLabel } = useSysregOptions()
            const label = getTagLabel('dtags', '\\x01')
            expect(label).toBe('Education')
        })

        it('returns empty string for invalid value', () => {
            const { getTagLabel } = useSysregOptions()
            const label = getTagLabel('ttags', '\\x99')
            expect(label).toBe('')
        })

        it('returns empty string for invalid tagfamily', () => {
            const { getTagLabel } = useSysregOptions()
            const label = getTagLabel('invalid' as any, '\\x01')
            expect(label).toBe('')
        })

        it('handles status values', () => {
            const { getTagLabel } = useSysregOptions()
            const label = getTagLabel('status', '\\x02')
            expect(label).toBe('Approved')
        })

        it('handles ctags bit group values', () => {
            const { getTagLabel } = useSysregOptions()
            const label = getTagLabel('ctags', '\\x01')
            expect(label).toBe('Children')
        })
    })

    // ============================================================================
    // getOptionsByFamily() - 4 tests
    // ============================================================================

    describe('getOptionsByFamily', () => {
        beforeEach(async () => {
            setupGlobalFetchMock()
            const { fetchOptions } = useSysregOptions()
            await fetchOptions()
        })

        it('returns all ttags options', () => {
            const { getOptionsByFamily } = useSysregOptions()
            const ttags = getOptionsByFamily('ttags')

            expect(ttags.length).toBe(8)
            expect(ttags.every(opt => opt.tagfamily === 'ttags')).toBe(true)
            expect(ttags.some(opt => opt.name === 'democracy')).toBe(true)
        })

        it('returns all status options', () => {
            const { getOptionsByFamily } = useSysregOptions()
            const status = getOptionsByFamily('status')

            expect(status.length).toBe(6)
            expect(status.some(opt => opt.name === 'raw')).toBe(true)
            expect(status.some(opt => opt.name === 'published')).toBe(true)
        })

        it('returns empty array for invalid family', () => {
            const { getOptionsByFamily } = useSysregOptions()
            const invalid = getOptionsByFamily('invalid' as any)

            expect(invalid).toEqual([])
        })

        it('filters options correctly', () => {
            const { getOptionsByFamily } = useSysregOptions()
            const dtags = getOptionsByFamily('dtags')

            expect(dtags.length).toBe(8)
            expect(dtags.every(opt => opt.tagfamily === 'dtags')).toBe(true)
            expect(dtags.some(opt => opt.name === 'media')).toBe(true)
        })
    })

    // ============================================================================
    // getOptionByValue() - 5 tests
    // ============================================================================

    describe('getOptionByValue', () => {
        beforeEach(async () => {
            setupGlobalFetchMock()
            const { fetchOptions } = useSysregOptions()
            await fetchOptions()
        })

        it('finds option by hex value', () => {
            const { getOptionByValue } = useSysregOptions()
            const opt = getOptionByValue('ttags', '\\x01')

            expect(opt).toBeTruthy()
            expect(opt?.label).toBe('Democracy')
            expect(opt?.bit).toBe(0)
        })

        it('finds option by string value', () => {
            const { getOptionByValue } = useSysregOptions()
            const opt = getOptionByValue('status', 'approved')

            expect(opt).toBeTruthy()
            expect(opt?.label).toBe('Approved')
        })

        it('returns null for invalid value', () => {
            const { getOptionByValue } = useSysregOptions()
            const opt = getOptionByValue('ttags', '\\x99')

            expect(opt).toBeNull()
        })

        it('returns null for invalid tagfamily', () => {
            const { getOptionByValue } = useSysregOptions()
            const opt = getOptionByValue('invalid' as any, '\\x01')

            expect(opt).toBeNull()
        })

        it('finds status options correctly', () => {
            const { getOptionByValue } = useSysregOptions()
            const opt = getOptionByValue('status', '\\x02')

            expect(opt).toBeTruthy()
            expect(opt?.name).toBe('approved')
            expect(opt?.value).toBe('\\x02')
            expect(opt?.bit).toBe(undefined) // Status uses direct values, not bits
        })
    })

    // ============================================================================
    // getCtagsBitGroup() - 5 tests
    // ============================================================================

    describe('getCtagsBitGroup', () => {
        beforeEach(async () => {
            setupGlobalFetchMock()
            const { fetchOptions } = useSysregOptions()
            await fetchOptions()
        })

        it('returns age_group options', () => {
            const { getCtagsBitGroup } = useSysregOptions()
            const ageGroups = getCtagsBitGroup('age_group')

            expect(ageGroups.length).toBe(4)
            expect(ageGroups[0].label).toBe('Children')
            expect(ageGroups[1].label).toBe('Youth')
            expect(ageGroups.every((opt: any) => opt.bit_group === 'age_group')).toBe(true)
        })

        it('returns subject_type options', () => {
            const { getCtagsBitGroup } = useSysregOptions()
            const types = getCtagsBitGroup('subject_type')

            expect(types.length).toBe(4)
            expect(types.some((t: any) => t.label === 'Photo')).toBe(true)
            expect(types.some((t: any) => t.label === 'Illustration')).toBe(true)
        })

        it('returns empty array for invalid bit group', () => {
            const { getCtagsBitGroup } = useSysregOptions()
            const invalid = getCtagsBitGroup('invalid')

            expect(invalid).toEqual([])
        })

        it('returns access_level options', () => {
            const { getCtagsBitGroup } = useSysregOptions()
            const access = getCtagsBitGroup('access_level')

            expect(access.length).toBe(2)
            expect(access.some((a: any) => a.label === 'Public')).toBe(true)
            expect(access.some((a: any) => a.label === 'Restricted')).toBe(true)
        })

        it('returns quality options', () => {
            const { getCtagsBitGroup } = useSysregOptions()
            const quality = getCtagsBitGroup('quality')

            expect(quality.length).toBe(2)
            expect(quality.some((q: any) => q.label === 'Featured')).toBe(true)
            expect(quality.some((q: any) => q.label === 'Needs Review')).toBe(true)
        })
    })

    // ============================================================================
    // Error Handling & Edge Cases
    // ============================================================================

    describe('Error handling', () => {
        it('handles HTTP 404 error', async () => {
            global.fetch = mockFetchHttpError(404, 'Not Found')
            const { fetchOptions, error } = useSysregOptions()

            await fetchOptions()

            expect(error.value).toBeTruthy()
        })

        it('handles HTTP 500 error', async () => {
            global.fetch = mockFetchHttpError(500, 'Internal Server Error')
            const { fetchOptions, error } = useSysregOptions()

            await fetchOptions()

            expect(error.value).toBeTruthy()
        })

        it('clears error on successful retry', async () => {
            // First call fails
            global.fetch = mockFetchError('Network error')
            const { fetchOptions, error } = useSysregOptions()
            await fetchOptions()
            expect(error.value).toBeTruthy()

            // Second call succeeds
            global.fetch = mockFetchSysregOptions()
            await fetchOptions(true)
            expect(error.value).toBeNull()
        })
    })

    describe('Edge cases', () => {
        it('handles empty options array', async () => {
            global.fetch = vi.fn().mockResolvedValue({
                ok: true,
                status: 200,
                json: async () => ({ sysreg: [] })
            })

            const { fetchOptions, options } = useSysregOptions()
            await fetchOptions()

            expect(options.value).toEqual([])
        })

        it('works before options are fetched', () => {
            const { getTagLabel, options } = useSysregOptions()

            expect(options.value).toEqual([])
            expect(getTagLabel('ttags', '\\x01')).toBe('')
        })

        it('handles malformed response data', async () => {
            global.fetch = vi.fn().mockResolvedValue({
                ok: true,
                status: 200,
                json: async () => ({ invalid: 'data' })
            })

            const { fetchOptions, error } = useSysregOptions()
            await fetchOptions()

            expect(error.value).toBeTruthy()
        })
    })

    // ============================================================================
    // Integration with Mock Data
    // ============================================================================

    describe('Mock data validation', () => {
        beforeEach(async () => {
            setupGlobalFetchMock()
            const { fetchOptions } = useSysregOptions()
            await fetchOptions()
        })

        it('loads all 38 sysreg entries', () => {
            const { options } = useSysregOptions()
            expect(options.value.length).toBe(38)
        })

        it('includes all 6 status values', () => {
            const { getOptionsByFamily } = useSysregOptions()
            const status = getOptionsByFamily('status')

            expect(status).toHaveLength(6)
            const names = status.map((s: any) => s.name)
            expect(names).toContain('raw')
            expect(names).toContain('processing')
            expect(names).toContain('approved')
            expect(names).toContain('published')
            expect(names).toContain('deprecated')
            expect(names).toContain('archived')
        })

        it('includes all 8 ttags', () => {
            const { getOptionsByFamily } = useSysregOptions()
            const ttags = getOptionsByFamily('ttags')

            expect(ttags).toHaveLength(8)
            expect(ttags.some((t: any) => t.name === 'democracy')).toBe(true)
            expect(ttags.some((t: any) => t.name === 'environment')).toBe(true)
        })

        it('includes all 8 dtags', () => {
            const { getOptionsByFamily } = useSysregOptions()
            const dtags = getOptionsByFamily('dtags')

            expect(dtags).toHaveLength(8)
            expect(dtags.some((d: any) => d.name === 'education')).toBe(true)
            expect(dtags.some((d: any) => d.name === 'media')).toBe(true)
        })

        it('includes all 4 rtags', () => {
            const { getOptionsByFamily } = useSysregOptions()
            const rtags = getOptionsByFamily('rtags')

            expect(rtags).toHaveLength(4)
            expect(rtags.some((r: any) => r.name === 'guide')).toBe(true)
            expect(rtags.some((r: any) => r.name === 'toolkit')).toBe(true)
        })

        it('includes all 12 ctags with bit groups', () => {
            const { getOptionsByFamily } = useSysregOptions()
            const ctags = getOptionsByFamily('ctags')

            expect(ctags).toHaveLength(12)
            expect(ctags.every((c: any) => c.bit_group)).toBe(true)
        })
    })
})
