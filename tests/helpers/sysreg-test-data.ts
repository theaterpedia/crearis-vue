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
    status_val?: string
    ttags_val?: string
    dtags_val?: string
    rtags_val?: string
    ctags_val?: string
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
        status_val: '\\x02', // approved
        ttags_val: '\\x05', // bits 0,2: democracy, environment
        dtags_val: '\\x03', // bits 0,1: education, media
        rtags_val: '\\x00',
        ctags_val: '\\x06', // age_group=youth, subject_type=photo
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
        status_val: '\\x04', // active
        ttags_val: '\\x11', // bits 0,4
        dtags_val: '\\x05', // bits 0,2
        rtags_val: '\\x00',
        ctags_val: '\\x08', // has_funding=true
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
        status_val: '\\x02', // planned
        ttags_val: '\\x09', // bits 0,3
        dtags_val: '\\x06', // bits 1,2
        rtags_val: '\\x00',
        ctags_val: '\\x01', // registration_open=true
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
        status_val: '\\x04', // published
        ttags_val: '\\x03', // bits 0,1
        dtags_val: '\\x02', // bit 1
        rtags_val: '\\x00',
        ctags_val: '\\x00',
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
    return createTestImage({ status_val: statusMap[status] || status })
}

/**
 * Create test image with specific tags
 */
export function createImageWithTags(
    ttags: number[] = [],
    dtags: number[] = [],
    ctags: number[] = []
): TestEntity {
    return createTestImage({
        ttags_val: bitsToHex(ttags),
        dtags_val: bitsToHex(dtags),
        ctags_val: bitsToHex(ctags)
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
    return createTestProject({ status_val: statusMap[status] || status })
}

/**
 * Create varied test images for filtering tests
 */
export function createVariedTestImages(): TestEntity[] {
    return [
        createTestImage({ id: 1, name: 'Raw Image', status_val: '\\x00', ttags_val: '\\x01' }),
        createTestImage({ id: 2, name: 'Approved Image', status_val: '\\x02', ttags_val: '\\x03' }),
        createTestImage({ id: 3, name: 'Published Image', status_val: '\\x04', ttags_val: '\\x05' }),
        createTestImage({ id: 4, name: 'Featured Image', status_val: '\\x04', ctags_val: '\\x02' }),
        createTestImage({ id: 5, name: 'Archived Image', status_val: '\\x10', ttags_val: '\\x01' })
    ]
}

/**
 * Helper: Convert bit array to hex string
 */
function bitsToHex(bits: number[]): string {
    if (bits.length === 0) return '\\x00'

    // Calculate byte value from bit positions
    let byte = 0
    bits.forEach(bit => {
        if (bit >= 0 && bit <= 7) {
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
        status_val: '\\x00',
        ttags_val: '\\x00',
        dtags_val: '\\x00',
        rtags_val: '\\x00',
        ctags_val: '\\x00',
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
        status_val: '\\xff',
        ttags_val: '\\xff',
        dtags_val: '\\xff',
        rtags_val: '\\xff',
        ctags_val: '\\xff',
        itags_val: '\\xff'
    })
}
