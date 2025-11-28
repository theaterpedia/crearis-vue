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
 * Complete mock sysreg options (73 entries total)
 * - Status: 6 entries
 * - TTags: 8 entries  
 * - DTags: 43 entries (Migration 037 V2 structure - 31 bits, 4 groups, 16 categories, 27 subcategories)
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

    // DTags - Didactic Model Tags (43 entries: 16 categories + 27 subcategories)
    // Migration 037 V2: 31 bits total (bit 31 unused/sign bit)

    // Group 1: spielform (bits 0-7, 8 bits, 4 categories + 8 subcategories = 12 entries)
    { bit: 0, tagfamily: 'dtags', value: 1, label: 'Kreisspiele', bit_group: 'spielform', taglogic: 'category', name: 'kreisspiele' },
    { bit: 1, tagfamily: 'dtags', value: 2, label: 'Kreisspiel > Impulskreis', bit_group: 'spielform', taglogic: 'subcategory', parent_bit: 0, name: 'kreisspiel_impulskreis' },
    { bit: 1, tagfamily: 'dtags', value: 3, label: 'Kreisspiel > Synchronkreis', bit_group: 'spielform', taglogic: 'subcategory', parent_bit: 0, name: 'kreisspiel_synchronkreis' },

    { bit: 2, tagfamily: 'dtags', value: 4, label: 'Raumlauf', bit_group: 'spielform', taglogic: 'category', name: 'raumlauf' },
    { bit: 3, tagfamily: 'dtags', value: 8, label: 'Raumlauf > Einzelgänger', bit_group: 'spielform', taglogic: 'subcategory', parent_bit: 2, name: 'raumlauf_einzelgaenger' },
    { bit: 3, tagfamily: 'dtags', value: 12, label: 'Raumlauf > Begegnungen', bit_group: 'spielform', taglogic: 'subcategory', parent_bit: 2, name: 'raumlauf_begegnungen' },

    { bit: 4, tagfamily: 'dtags', value: 16, label: 'Kleingruppen', bit_group: 'spielform', taglogic: 'category', name: 'kleingruppen' },

    { bit: 5, tagfamily: 'dtags', value: 32, label: 'Forum', bit_group: 'spielform', taglogic: 'category', name: 'forum' },
    { bit: 6, tagfamily: 'dtags', value: 64, label: 'Forum > Abklatschspiel', bit_group: 'spielform', taglogic: 'subcategory', parent_bit: 5, name: 'forum_abklatschspiel' },
    { bit: 6, tagfamily: 'dtags', value: 96, label: 'Forum > Werkstattprobe', bit_group: 'spielform', taglogic: 'subcategory', parent_bit: 5, name: 'forum_werkstattprobe' },
    { bit: 7, tagfamily: 'dtags', value: 128, label: 'Forum > Showing', bit_group: 'spielform', taglogic: 'subcategory', parent_bit: 5, name: 'forum_showing' },
    { bit: 7, tagfamily: 'dtags', value: 160, label: 'Forum > Durchlaufproben', bit_group: 'spielform', taglogic: 'subcategory', parent_bit: 5, name: 'forum_durchlaufproben' },

    // Group 2: animiertes_theaterspiel (bits 8-14, 7 bits, 4 categories + 6 subcategories = 10 entries)
    { bit: 8, tagfamily: 'dtags', value: 256, label: 'El. Animation', bit_group: 'animiertes_theaterspiel', taglogic: 'category', name: 'el_animation' },
    { bit: 9, tagfamily: 'dtags', value: 512, label: 'El. Animation > Zwei-Kreise-Modell', bit_group: 'animiertes_theaterspiel', taglogic: 'subcategory', parent_bit: 8, name: 'el_animation_zwei_kreise_modell' },
    { bit: 9, tagfamily: 'dtags', value: 768, label: 'El. Animation > Variante 2', bit_group: 'animiertes_theaterspiel', taglogic: 'subcategory', parent_bit: 8, name: 'el_animation_variante_2' },

    { bit: 10, tagfamily: 'dtags', value: 1024, label: 'Sz. Animation', bit_group: 'animiertes_theaterspiel', taglogic: 'category', name: 'sz_animation' },
    { bit: 11, tagfamily: 'dtags', value: 2048, label: 'Sz. Animation > Variante 1', bit_group: 'animiertes_theaterspiel', taglogic: 'subcategory', parent_bit: 10, name: 'sz_animation_variante_1' },
    { bit: 11, tagfamily: 'dtags', value: 3072, label: 'Sz. Animation > Variante 2', bit_group: 'animiertes_theaterspiel', taglogic: 'subcategory', parent_bit: 10, name: 'sz_animation_variante_2' },

    { bit: 12, tagfamily: 'dtags', value: 4096, label: 'Impro', bit_group: 'animiertes_theaterspiel', taglogic: 'category', name: 'impro' },

    { bit: 13, tagfamily: 'dtags', value: 8192, label: 'animiert', bit_group: 'animiertes_theaterspiel', taglogic: 'category', name: 'animiert' },
    { bit: 14, tagfamily: 'dtags', value: 16384, label: 'animiert > SAFARI', bit_group: 'animiertes_theaterspiel', taglogic: 'subcategory', parent_bit: 13, name: 'animiert_safari' },
    { bit: 14, tagfamily: 'dtags', value: 24576, label: 'animiert > Variante 2', bit_group: 'animiertes_theaterspiel', taglogic: 'subcategory', parent_bit: 13, name: 'animiert_variante_2' },

    // Group 3: szenische_themenarbeit (bits 15-24, 10 bits, 5 categories + 8 subcategories = 13 entries)
    { bit: 15, tagfamily: 'dtags', value: 32768, label: 'Standbilder', bit_group: 'szenische_themenarbeit', taglogic: 'category', name: 'standbilder' },
    { bit: 16, tagfamily: 'dtags', value: 65536, label: 'Standbilder > variante 1', bit_group: 'szenische_themenarbeit', taglogic: 'subcategory', parent_bit: 15, name: 'standbilder_variante_1' },
    { bit: 16, tagfamily: 'dtags', value: 98304, label: 'Standbilder > variante 2', bit_group: 'szenische_themenarbeit', taglogic: 'subcategory', parent_bit: 15, name: 'standbilder_variante_2' },
    { bit: 17, tagfamily: 'dtags', value: 131072, label: 'Standbilder > variante 3', bit_group: 'szenische_themenarbeit', taglogic: 'subcategory', parent_bit: 15, name: 'standbilder_variante_3' },

    { bit: 18, tagfamily: 'dtags', value: 262144, label: 'Rollenspiel', bit_group: 'szenische_themenarbeit', taglogic: 'category', name: 'rollenspiel' },
    { bit: 19, tagfamily: 'dtags', value: 524288, label: 'Rollenspiel > variante 1', bit_group: 'szenische_themenarbeit', taglogic: 'subcategory', parent_bit: 18, name: 'rollenspiel_variante_1' },
    { bit: 19, tagfamily: 'dtags', value: 786432, label: 'Rollenspiel > variante 2', bit_group: 'szenische_themenarbeit', taglogic: 'subcategory', parent_bit: 18, name: 'rollenspiel_variante_2' },
    { bit: 20, tagfamily: 'dtags', value: 1048576, label: 'Rollenspiel > variante 3', bit_group: 'szenische_themenarbeit', taglogic: 'subcategory', parent_bit: 18, name: 'rollenspiel_variante_3' },

    { bit: 21, tagfamily: 'dtags', value: 2097152, label: 'TdU', bit_group: 'szenische_themenarbeit', taglogic: 'category', name: 'tdu' },
    { bit: 22, tagfamily: 'dtags', value: 4194304, label: 'TdU > Forumtheater', bit_group: 'szenische_themenarbeit', taglogic: 'subcategory', parent_bit: 21, name: 'tdu_forumtheater' },
    { bit: 22, tagfamily: 'dtags', value: 6291456, label: 'TdU > Regenbogen der Wünsche', bit_group: 'szenische_themenarbeit', taglogic: 'subcategory', parent_bit: 21, name: 'tdu_regenbogen_der_wuensche' },

    { bit: 23, tagfamily: 'dtags', value: 8388608, label: 'Soziometrie', bit_group: 'szenische_themenarbeit', taglogic: 'category', name: 'soziometrie' },

    { bit: 24, tagfamily: 'dtags', value: 16777216, label: 'bewegte Themenarbeit', bit_group: 'szenische_themenarbeit', taglogic: 'category', name: 'bewegte_themenarbeit' },

    // Group 4: paedagogische_regie (bits 25-30, 6 bits, 3 categories + 5 subcategories = 8 entries)
    { bit: 25, tagfamily: 'dtags', value: 33554432, label: 'zyklisch', bit_group: 'paedagogische_regie', taglogic: 'category', name: 'zyklisch' },
    { bit: 26, tagfamily: 'dtags', value: 67108864, label: 'zyklisch > RSVP-Zyklus-Modell', bit_group: 'paedagogische_regie', taglogic: 'subcategory', parent_bit: 25, name: 'zyklisch_rsvp_zyklus_modell' },
    { bit: 26, tagfamily: 'dtags', value: 100663296, label: 'zyklisch > variante 2', bit_group: 'paedagogische_regie', taglogic: 'subcategory', parent_bit: 25, name: 'zyklisch_variante_2' },
    { bit: 27, tagfamily: 'dtags', value: 134217728, label: 'zyklisch > Theatrales Mischpult', bit_group: 'paedagogische_regie', taglogic: 'subcategory', parent_bit: 25, name: 'zyklisch_theatrales_mischpult' },

    { bit: 28, tagfamily: 'dtags', value: 268435456, label: 'linear', bit_group: 'paedagogische_regie', taglogic: 'category', name: 'linear' },
    { bit: 29, tagfamily: 'dtags', value: 536870912, label: 'linear > 7-Tage-Modell', bit_group: 'paedagogische_regie', taglogic: 'subcategory', parent_bit: 28, name: 'linear_7_tage_modell' },
    { bit: 29, tagfamily: 'dtags', value: 805306368, label: 'linear > variante 2', bit_group: 'paedagogische_regie', taglogic: 'subcategory', parent_bit: 28, name: 'linear_variante_2' },

    { bit: 30, tagfamily: 'dtags', value: 1073741824, label: 'klassisch', bit_group: 'paedagogische_regie', taglogic: 'category', name: 'klassisch' },

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
