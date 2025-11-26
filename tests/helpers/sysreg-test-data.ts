/**
 * Test Data Factory for Sysreg System
 * 
 * Provides factory functions for generating test entities with sysreg fields.
 * Supports images, projects, events, and batch creation.
 */

import { parseByteaHex, setBit, clearBit, bitsToByteArray } from '@/composables/useSysregTags'

export interface TestEntity {
    id: number
    name: string
    status?: string
    ttags?: string
    dtags?: string
    rtags?: string
    ctags?: string
    itags_val?: string
    [key: string]: any
}

/**
 * Create test image with default sysreg values
 */
export function createTestImage(overrides?: Partial<TestEntity>): TestEntity {
    return {
        id: 1,
        name: 'Test Image',
        status: '\\x02', // approved
        ttags: '\\x05', // bits 0,2: democracy, environment
        dtags: '\\x03', // bits 0,1: education, media
        rtags: '\\x00',
        ctags: '\\x06', // age_group=youth, subject_type=photo
        itags_val: '\\x00',
        img_square: '{"url":"test.jpg"}',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...overrides
    }
}

/**
 * Create test project with default sysreg values
 */
export function createTestProject(overrides?: Partial<TestEntity>): TestEntity {
    return {
        id: 1,
        name: 'Test Project',
        status: '\\x04', // active
        ttags: '\\x11', // bits 0,4
        dtags: '\\x05', // bits 0,2
        rtags: '\\x00',
        ctags: '\\x08', // has_funding=true
        itags_val: '\\x00',
        description: 'Test project description',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...overrides
    }
}

/**
 * Create test event with default sysreg values
 */
export function createTestEvent(overrides?: Partial<TestEntity>): TestEntity {
    return {
        id: 1,
        name: 'Test Event',
        status: '\\x02', // planned
        ttags: '\\x09', // bits 0,3
        dtags: '\\x06', // bits 1,2
        rtags: '\\x00',
        ctags: '\\x01', // registration_open=true
        itags_val: '\\x00',
        date_begin: '2025-12-01',
        date_end: '2025-12-03',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...overrides
    }
}

/**
 * Create test post with default sysreg values
 */
export function createTestPost(overrides?: Partial<TestEntity>): TestEntity {
    return {
        id: 1,
        name: 'Test Post',
        status: '\\x04', // published
        ttags: '\\x03', // bits 0,1
        dtags: '\\x02', // bit 1
        rtags: '\\x00',
        ctags: '\\x00',
        itags_val: '\\x00',
        content: 'Test post content',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...overrides
    }
}

/**
 * Create batch of test images
 */
export function createTestImages(count: number, baseOverrides?: Partial<TestEntity>): TestEntity[] {
    return Array.from({ length: count }, (_, i) =>
        createTestImage({
            id: i + 1,
            name: `Test Image ${i + 1}`,
            ...baseOverrides
        })
    )
}

/**
 * Create batch of test projects
 */
export function createTestProjects(count: number, baseOverrides?: Partial<TestEntity>): TestEntity[] {
    return Array.from({ length: count }, (_, i) =>
        createTestProject({
            id: i + 1,
            name: `Test Project ${i + 1}`,
            ...baseOverrides
        })
    )
}

/**
 * Create batch of test events
 */
export function createTestEvents(count: number, baseOverrides?: Partial<TestEntity>): TestEntity[] {
    return Array.from({ length: count }, (_, i) =>
        createTestEvent({
            id: i + 1,
            name: `Test Event ${i + 1}`,
            date_begin: `2025-12-${String(i + 1).padStart(2, '0')}`,
            ...baseOverrides
        })
    )
}

/**
 * Create test image with specific status
 */
export function createImageWithStatus(status: string): TestEntity {
    const statusMap: Record<string, string> = {
        raw: '\\x00',
        processing: '\\x01',
        approved: '\\x02',
        published: '\\x04',
        deprecated: '\\x08',
        archived: '\\x10'
    }
    return createTestImage({ status: statusMap[status] || status })
}

/**
 * Create test image with specific tags
 */
export function createImageWithTags(
    ttags: (number | string)[] = [],
    dtags: (number | string)[] = [],
    ctags: (number | string)[] = []
): TestEntity {
    return createTestImage({
        ttags: bitsToHex(ttags),
        dtags: bitsToHex(dtags),
        ctags: bitsToHex(ctags)
    })
}

/**
 * Create test project with specific status
 */
export function createProjectWithStatus(status: string): TestEntity {
    const statusMap: Record<string, string> = {
        idea: '\\x00',
        draft: '\\x01',
        planned: '\\x02',
        active: '\\x04',
        completed: '\\x08',
        archived: '\\x10'
    }
    return createTestProject({ status: statusMap[status] || status })
}

/**
 * Create varied test images for filtering tests
 */
export function createVariedTestImages(): TestEntity[] {
    return [
        createTestImage({ id: 1, name: 'Raw Image', status: '\\x00', ttags: '\\x01' }),
        createTestImage({ id: 2, name: 'Approved Image', status: '\\x02', ttags: '\\x03' }),
        createTestImage({ id: 3, name: 'Published Image', status: '\\x04', ttags: '\\x05' }),
        createTestImage({ id: 4, name: 'Featured Image', status: '\\x04', ctags: '\\x02' }),
        createTestImage({ id: 5, name: 'Archived Image', status: '\\x10', ttags: '\\x01' })
    ]
}

/**
 * Helper: Convert bit array to hex string
 */
function bitsToHex(bits: (number | string)[]): string {
    if (bits.length === 0) return '\\x00'

    // If first element is a hex string, just return it
    if (typeof bits[0] === 'string' && bits[0].startsWith('\\x')) {
        return bits[0]
    }

    // Calculate byte value from bit positions
    let byte = 0
    bits.forEach(bit => {
        if (typeof bit === 'number' && bit >= 0 && bit <= 7) {
            byte |= (1 << bit)
        }
    })

    return `\\x${byte.toString(16).padStart(2, '0')}`
}

/**
 * Create minimal entity (only required fields)
 */
export function createMinimalEntity(type: 'image' | 'project' | 'event' = 'image'): TestEntity {
    const base = {
        id: 1,
        name: 'Minimal Entity',
        status: '\\x00',
        ttags: '\\x00',
        dtags: '\\x00',
        rtags: '\\x00',
        ctags: '\\x00',
        itags_val: '\\x00'
    }

    switch (type) {
        case 'project':
            return { ...base, description: '' }
        case 'event':
            return { ...base, date_begin: null, date_end: null }
        default:
            return base
    }
}

/**
 * Create entity with all tags set (for testing clear operations)
 */
export function createEntityWithAllTags(): TestEntity {
    return createTestImage({
        status: '\\xff',
        ttags: '\\xff',
        dtags: '\\xff',
        rtags: '\\xff',
        ctags: '\\xff',
        itags_val: '\\xff'
    })
}
