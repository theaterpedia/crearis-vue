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
    name?: string
    taglogic?: string
    parent_bit?: number
}

/**
 * Complete mock sysreg options (62 entries total)
 * - Status: 6 entries
 * - TTags: 8 entries  
 * - DTags: 32 entries (Migration 037 structure with 4 groups)
 * - RTags: 4 entries
 * - CTags: 12 entries
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

    // DTags - Didactic Model Tags (32 entries across 4 groups)
    // Group 1: spielform (bits 0-7)
    { bit: 0, tagfamily: 'dtags', value: 'freies_spiel', label: 'Freies Spiel', bit_group: 'spielform', taglogic: 'category', name: 'freies_spiel' },
    { bit: 1, tagfamily: 'dtags', value: 'improvisationstheater', label: 'Improvisationstheater', bit_group: 'spielform', taglogic: 'subcategory', parent_bit: 0, name: 'improvisationstheater' },
    { bit: 2, tagfamily: 'dtags', value: 'rollenspiel', label: 'Rollenspiel', bit_group: 'spielform', taglogic: 'category', name: 'rollenspiel' },
    { bit: 3, tagfamily: 'dtags', value: 'szenisches_spiel', label: 'Szenisches Spiel', bit_group: 'spielform', taglogic: 'subcategory', parent_bit: 2, name: 'szenisches_spiel' },
    { bit: 4, tagfamily: 'dtags', value: 'theater_machen', label: 'Theater machen', bit_group: 'spielform', taglogic: 'category', name: 'theater_machen' },
    { bit: 5, tagfamily: 'dtags', value: 'stueck_entwickeln', label: 'Stück entwickeln', bit_group: 'spielform', taglogic: 'subcategory', parent_bit: 4, name: 'stueck_entwickeln' },
    { bit: 6, tagfamily: 'dtags', value: 'performatives_spiel', label: 'Performatives Spiel', bit_group: 'spielform', taglogic: 'category', name: 'performatives_spiel' },
    { bit: 7, tagfamily: 'dtags', value: 'tanztheater', label: 'Tanztheater', bit_group: 'spielform', taglogic: 'subcategory', parent_bit: 6, name: 'tanztheater' },

    // Group 2: animiertes_theaterspiel (bits 8-15)
    { bit: 8, tagfamily: 'dtags', value: 'puppen_objekte', label: 'Puppen & Objekte', bit_group: 'animiertes_theaterspiel', taglogic: 'category', name: 'puppen_objekte' },
    { bit: 9, tagfamily: 'dtags', value: 'figurentheater', label: 'Figurentheater', bit_group: 'animiertes_theaterspiel', taglogic: 'subcategory', parent_bit: 8, name: 'figurentheater' },
    { bit: 10, tagfamily: 'dtags', value: 'schattentheater', label: 'Schattentheater', bit_group: 'animiertes_theaterspiel', taglogic: 'category', name: 'schattentheater' },
    { bit: 11, tagfamily: 'dtags', value: 'licht_schatten', label: 'Licht & Schatten', bit_group: 'animiertes_theaterspiel', taglogic: 'subcategory', parent_bit: 10, name: 'licht_schatten' },
    { bit: 12, tagfamily: 'dtags', value: 'maskentheater', label: 'Maskentheater', bit_group: 'animiertes_theaterspiel', taglogic: 'category', name: 'maskentheater' },
    { bit: 13, tagfamily: 'dtags', value: 'charaktermasken', label: 'Charaktermasken', bit_group: 'animiertes_theaterspiel', taglogic: 'subcategory', parent_bit: 12, name: 'charaktermasken' },
    { bit: 14, tagfamily: 'dtags', value: 'materialtheater', label: 'Materialtheater', bit_group: 'animiertes_theaterspiel', taglogic: 'category', name: 'materialtheater' },
    { bit: 15, tagfamily: 'dtags', value: 'objekttheater', label: 'Objekttheater', bit_group: 'animiertes_theaterspiel', taglogic: 'subcategory', parent_bit: 14, name: 'objekttheater' },

    // Group 3: szenische_themenarbeit (bits 16-25)
    { bit: 16, tagfamily: 'dtags', value: 'biografisches_theater', label: 'Biografisches Theater', bit_group: 'szenische_themenarbeit', taglogic: 'category', name: 'biografisches_theater' },
    { bit: 17, tagfamily: 'dtags', value: 'lebensgeschichten', label: 'Lebensgeschichten', bit_group: 'szenische_themenarbeit', taglogic: 'subcategory', parent_bit: 16, name: 'lebensgeschichten' },
    { bit: 18, tagfamily: 'dtags', value: 'dokumentartheater', label: 'Dokumentartheater', bit_group: 'szenische_themenarbeit', taglogic: 'category', name: 'dokumentartheater' },
    { bit: 19, tagfamily: 'dtags', value: 'recherche_basiert', label: 'Recherche-basiert', bit_group: 'szenische_themenarbeit', taglogic: 'subcategory', parent_bit: 18, name: 'recherche_basiert' },
    { bit: 20, tagfamily: 'dtags', value: 'forum_theater', label: 'Forum Theater', bit_group: 'szenische_themenarbeit', taglogic: 'category', name: 'forum_theater' },
    { bit: 21, tagfamily: 'dtags', value: 'theater_der_unterdr', label: 'Theater der Unterdrückten', bit_group: 'szenische_themenarbeit', taglogic: 'subcategory', parent_bit: 20, name: 'theater_der_unterdr' },
    { bit: 22, tagfamily: 'dtags', value: 'politisches_theater', label: 'Politisches Theater', bit_group: 'szenische_themenarbeit', taglogic: 'category', name: 'politisches_theater' },
    { bit: 23, tagfamily: 'dtags', value: 'gesellschaftskritik', label: 'Gesellschaftskritik', bit_group: 'szenische_themenarbeit', taglogic: 'subcategory', parent_bit: 22, name: 'gesellschaftskritik' },
    { bit: 24, tagfamily: 'dtags', value: 'inklusives_theater', label: 'Inklusives Theater', bit_group: 'szenische_themenarbeit', taglogic: 'category', name: 'inklusives_theater' },
    { bit: 25, tagfamily: 'dtags', value: 'diversity_theater', label: 'Diversity Theater', bit_group: 'szenische_themenarbeit', taglogic: 'subcategory', parent_bit: 24, name: 'diversity_theater' },

    // Group 4: paedagogische_regie (bits 26-31)
    { bit: 26, tagfamily: 'dtags', value: 'theatervermittlung', label: 'Theatervermittlung', bit_group: 'paedagogische_regie', taglogic: 'category', name: 'theatervermittlung' },
    { bit: 27, tagfamily: 'dtags', value: 'publikumsgespraech', label: 'Publikumsgespräch', bit_group: 'paedagogische_regie', taglogic: 'subcategory', parent_bit: 26, name: 'publikumsgespraech' },
    { bit: 28, tagfamily: 'dtags', value: 'inszenierung', label: 'Inszenierung', bit_group: 'paedagogische_regie', taglogic: 'category', name: 'inszenierung' },
    { bit: 29, tagfamily: 'dtags', value: 'regie_fuehrung', label: 'Regieführung', bit_group: 'paedagogische_regie', taglogic: 'subcategory', parent_bit: 28, name: 'regie_fuehrung' },
    { bit: 30, tagfamily: 'dtags', value: 'dramaturgie', label: 'Dramaturgie', bit_group: 'paedagogische_regie', taglogic: 'category', name: 'dramaturgie' },
    { bit: 31, tagfamily: 'dtags', value: 'stueckanalyse', label: 'Stückanalyse', bit_group: 'paedagogische_regie', taglogic: 'subcategory', parent_bit: 30, name: 'stueckanalyse' },

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
export function toSysregEntry(opt: SysregOption): any {
    let intValue: number

    // Status uses direct bit values, tags use bit positions
    if (opt.tagfamily === 'status') {
        // Use bit value directly (already in correct format)
        intValue = opt.bit
    } else {
        // Convert bit position to byte value (bit 0 = 1, bit 1 = 2, etc.)
        intValue = 1 << opt.bit
    }

    const entry: any = {
        value: intValue,
        name: opt.name || opt.value,
        label: opt.label, // Add direct label field
        tagfamily: opt.tagfamily,
        taglogic: opt.taglogic || 'option',
        is_default: false,
        name_i18n: { en: opt.label, de: opt.label },
        desc_i18n: {},
        bit: opt.bit
    }

    // Add optional fields
    if (opt.bit_group) entry.bit_group = opt.bit_group
    if (opt.parent_bit !== undefined) entry.parent_bit = opt.parent_bit

    return entry
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
