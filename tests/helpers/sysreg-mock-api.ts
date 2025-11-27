/**
 * Mock API Helpers for Sysreg Testing
 * 
 * Provides mock fetch responses for sysreg API endpoints.
 * Includes mock data for all 38 sysreg entries.
 */

import { vi } from 'vitest'
import type { TestEntity } from './sysreg-test-data'
import { useSysregTags } from '../../src/composables/useSysregTags'

export interface SysregOption {
    bit: number
    tagfamily: string
    value: string
    label: string
    bit_group?: string
}

/**
 * Complete mock sysreg options (all 38 entries)
 */
export const mockSysregOptions: SysregOption[] = [
    // Status (6 entries) - uses direct hex values, not bit positions
    { bit: 0x00, tagfamily: 'status', value: 'raw', label: 'Raw' },
    { bit: 0x01, tagfamily: 'status', value: 'processing', label: 'Processing' },
    { bit: 0x02, tagfamily: 'status', value: 'approved', label: 'Approved' },
    { bit: 0x04, tagfamily: 'status', value: 'published', label: 'Published' },
    { bit: 0x08, tagfamily: 'status', value: 'deprecated', label: 'Deprecated' },
    { bit: 0x10, tagfamily: 'status', value: 'archived', label: 'Archived' },

    // TTags - Topic Tags (8 entries) - uses bit positions
    { bit: 0, tagfamily: 'ttags', value: 'democracy', label: 'Democracy' },
    { bit: 1, tagfamily: 'ttags', value: 'environment', label: 'Environment' },
    { bit: 2, tagfamily: 'ttags', value: 'education', label: 'Education' },
    { bit: 3, tagfamily: 'ttags', value: 'human_rights', label: 'Human Rights' },
    { bit: 4, tagfamily: 'ttags', value: 'health', label: 'Health' },
    { bit: 5, tagfamily: 'ttags', value: 'technology', label: 'Technology' },
    { bit: 6, tagfamily: 'ttags', value: 'arts_culture', label: 'Arts & Culture' },
    { bit: 7, tagfamily: 'ttags', value: 'economy', label: 'Economy' },

    // DTags - Domain Tags (8 entries)
    { bit: 0, tagfamily: 'dtags', value: 'education', label: 'Education' },
    { bit: 1, tagfamily: 'dtags', value: 'media', label: 'Media' },
    { bit: 2, tagfamily: 'dtags', value: 'advocacy', label: 'Advocacy' },
    { bit: 3, tagfamily: 'dtags', value: 'research', label: 'Research' },
    { bit: 4, tagfamily: 'dtags', value: 'community', label: 'Community' },
    { bit: 5, tagfamily: 'dtags', value: 'policy', label: 'Policy' },
    { bit: 6, tagfamily: 'dtags', value: 'awareness', label: 'Awareness' },
    { bit: 7, tagfamily: 'dtags', value: 'training', label: 'Training' },

    // RTags - Resource Tags (4 entries)
    { bit: 0, tagfamily: 'rtags', value: 'guide', label: 'Guide' },
    { bit: 1, tagfamily: 'rtags', value: 'toolkit', label: 'Toolkit' },
    { bit: 2, tagfamily: 'rtags', value: 'report', label: 'Report' },
    { bit: 3, tagfamily: 'rtags', value: 'case_study', label: 'Case Study' },

    // CTags - Config/Classification Tags (12 entries with bit_groups)
    // age_group bit group (4 entries)
    { bit: 0, tagfamily: 'ctags', value: 'children', label: 'Children', bit_group: 'age_group' },
    { bit: 1, tagfamily: 'ctags', value: 'youth', label: 'Youth', bit_group: 'age_group' },
    { bit: 2, tagfamily: 'ctags', value: 'adults', label: 'Adults', bit_group: 'age_group' },
    { bit: 3, tagfamily: 'ctags', value: 'seniors', label: 'Seniors', bit_group: 'age_group' },

    // subject_type bit group (4 entries)
    { bit: 4, tagfamily: 'ctags', value: 'photo', label: 'Photo', bit_group: 'subject_type' },
    { bit: 5, tagfamily: 'ctags', value: 'illustration', label: 'Illustration', bit_group: 'subject_type' },
    { bit: 6, tagfamily: 'ctags', value: 'infographic', label: 'Infographic', bit_group: 'subject_type' },
    { bit: 7, tagfamily: 'ctags', value: 'diagram', label: 'Diagram', bit_group: 'subject_type' },

    // access_level bit group (2 entries)
    { bit: 8, tagfamily: 'ctags', value: 'public', label: 'Public', bit_group: 'access_level' },
    { bit: 9, tagfamily: 'ctags', value: 'restricted', label: 'Restricted', bit_group: 'access_level' },

    // quality bit group (2 entries)
    { bit: 10, tagfamily: 'ctags', value: 'featured', label: 'Featured', bit_group: 'quality' },
    { bit: 11, tagfamily: 'ctags', value: 'needs_review', label: 'Needs Review', bit_group: 'quality' }
]

/**
 * Mock fetch function that returns sysreg options
 */
export function mockFetchSysregOptions() {
    // Convert flat mockSysregOptions to SysregCache format
    const cache = {
        status: mockSysregOptions.filter(opt => opt.tagfamily === 'status').map(toSysregEntry),
        config: [], // Empty but present - no config tags in test data yet
        rtags: mockSysregOptions.filter(opt => opt.tagfamily === 'rtags').map(toSysregEntry),
        ctags: mockSysregOptions.filter(opt => opt.tagfamily === 'ctags').map(toSysregEntry),
        ttags: mockSysregOptions.filter(opt => opt.tagfamily === 'ttags').map(toSysregEntry),
        dtags: mockSysregOptions.filter(opt => opt.tagfamily === 'dtags').map(toSysregEntry)
    }

    return vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => cache
    })
}

/**
 * Convert SysregOption to SysregEntry format
 */
/**
 * Convert SysregOption to SysregEntry format
 */
function toSysregEntry(opt: SysregOption): any {
    let intValue: number

    // Status uses direct bit values, tags use bit positions
    if (opt.tagfamily === 'status') {
        // Use bit value directly (already in correct format)
        intValue = opt.bit
    } else {
        // Convert bit position to byte value (bit 0 = 1, bit 1 = 2, etc.)
        intValue = 1 << opt.bit
    }

    return {
        value: intValue,
        name: opt.value,
        tagfamily: opt.tagfamily,
        taglogic: 'option',
        is_default: false,
        name_i18n: { en: opt.label },
        desc_i18n: {},
        ...(opt.bit_group ? { bit_group: opt.bit_group } : {})
    }
}

/**
 * Mock fetch function that returns filtered sysreg options
 */
export function mockFetchSysregOptionsByFamily(tagfamily: string) {
    const filtered = mockSysregOptions.filter(opt => opt.tagfamily === tagfamily)
    return vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
            sysreg: filtered
        })
    })
}

/**
 * Mock fetch function that returns a single entity
 */
export function mockFetchEntity(entity: TestEntity) {
    return vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => entity
    })
}

/**
 * Mock fetch function that returns multiple entities
 */
export function mockFetchEntities(entities: TestEntity[]) {
    return vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => entities
    })
}

/**
 * Mock fetch function that returns entities with pagination
 */
export function mockFetchEntitiesWithPagination(
    entities: TestEntity[],
    total: number,
    page: number = 1,
    limit: number = 10
) {
    return vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
            data: entities,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            }
        })
    })
}

/**
 * Mock failed fetch (network error)
 */
export function mockFetchError(message: string = 'Network error') {
    return vi.fn().mockRejectedValue(new Error(message))
}

/**
 * Mock fetch with HTTP error status
 */
export function mockFetchHttpError(status: number, statusText: string) {
    return vi.fn().mockResolvedValue({
        ok: false,
        status,
        statusText,
        json: async () => ({
            error: statusText
        })
    })
}

/**
 * Mock successful POST/PUT/PATCH request
 */
export function mockFetchMutation(updatedEntity: TestEntity) {
    return vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => updatedEntity
    })
}

/**
 * Mock successful DELETE request
 */
export function mockFetchDelete() {
    return vi.fn().mockResolvedValue({
        ok: true,
        status: 204,
        json: async () => ({})
    })
}

/**
 * Create a mock fetch that tracks calls
 */
export function mockFetchWithTracking() {
    const calls: any[] = []

    // Build cache structure
    const cache = {
        status: mockSysregOptions.filter(opt => opt.tagfamily === 'status').map(toSysregEntry),
        config: [],
        rtags: mockSysregOptions.filter(opt => opt.tagfamily === 'rtags').map(toSysregEntry),
        ctags: mockSysregOptions.filter(opt => opt.tagfamily === 'ctags').map(toSysregEntry),
        ttags: mockSysregOptions.filter(opt => opt.tagfamily === 'ttags').map(toSysregEntry),
        dtags: mockSysregOptions.filter(opt => opt.tagfamily === 'dtags').map(toSysregEntry)
    }

    const mockFetch = vi.fn().mockImplementation((url: string, options?: RequestInit) => {
        calls.push({ url, options })
        return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => cache
        })
    })

    return {
        mockFetch,
        calls,
        getCallCount: () => calls.length,
        getLastCall: () => calls[calls.length - 1],
        wasCalledWith: (url: string) => calls.some(call => call.url.includes(url))
    }
}

/**
 * Setup global fetch mock with default sysreg response
 */
export function setupGlobalFetchMock() {
    global.fetch = mockFetchSysregOptions()
}

/**
 * Reset global fetch mock and clear sysreg cache
 */
export function resetGlobalFetchMock() {
    if (global.fetch && vi.isMockFunction(global.fetch)) {
        (global.fetch as any).mockClear()
    }
    // Reset the sysreg cache to ensure clean test state
    const { resetCache } = useSysregTags()
    resetCache()
}

/**
 * Mock fetch for analytics endpoint
 */
export function mockFetchAnalytics(entities: TestEntity[]) {
    return vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => entities
    })
}

/**
 * Mock fetch for search/filter endpoint
 */
export function mockFetchSearch(results: TestEntity[], query: string) {
    return vi.fn().mockImplementation((url: string) => {
        // Only return results if URL contains the query
        const shouldReturn = url.includes(query)
        return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => shouldReturn ? results : []
        })
    })
}

/**
 * Mock fetch with delay (for testing loading states)
 */
export function mockFetchWithDelay(data: any, delayMs: number = 100) {
    return vi.fn().mockImplementation(() =>
        new Promise(resolve =>
            setTimeout(() => resolve({
                ok: true,
                status: 200,
                json: async () => data
            }), delayMs)
        )
    )
}

/**
 * Get mock sysreg option by value
 */
export function getMockOption(tagfamily: string, value: string): SysregOption | undefined {
    return mockSysregOptions.find(
        opt => opt.tagfamily === tagfamily && opt.value === value
    )
}

/**
 * Get mock sysreg options by tagfamily
 */
export function getMockOptionsByFamily(tagfamily: string): SysregOption[] {
    return mockSysregOptions.filter(opt => opt.tagfamily === tagfamily)
}

/**
 * Get mock sysreg options by bit group
 */
export function getMockOptionsByBitGroup(bitGroup: string): SysregOption[] {
    return mockSysregOptions.filter(opt => opt.bit_group === bitGroup)
}
