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
    status?: number
    ttags?: number
    dtags?: number
    rtags?: number
    ctags?: number
    itags_val?: number
    [key: string]: any
}

/**
 * Create test image with default sysreg values
 */
export function createTestImage(overrides?: Partial<TestEntity>): TestEntity {
    return {
        id: 1,
        name: 'Test Image',
        status: 2, // approved
        ttags: 5, // bits 0,2: democracy, environment
        dtags: 3, // bits 0,1: education, media
        rtags: 0,
        ctags: 6, // age_group=youth, subject_type=photo
        itags_val: 0,
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
        status: 4, // active
        ttags: 17, // bits 0,4 (0x11)
        dtags: 5, // bits 0,2
        rtags: 0,
        ctags: 8, // has_funding=true
        itags_val: 0,
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
        status: 2, // planned
        ttags: 9, // bits 0,3 (0x09)
        dtags: 6, // bits 1,2
        rtags: 0,
        ctags: 1, // registration_open=true
        itags_val: 0,
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
        status: 4, // published
        ttags: 3, // bits 0,1
        dtags: 2, // bit 1
        rtags: 0,
        ctags: 0,
        itags_val: 0,
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
    const statusMap: Record<string, number> = {
        raw: 0,
        processing: 1,
        approved: 2,
        published: 4,
        deprecated: 8,
        archived: 16
    }
    return createTestImage({ status: statusMap[status] || parseInt(status) || 0 })
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
    const statusMap: Record<string, number> = {
        idea: 0,
        draft: 1,
        planned: 2,
        active: 4,
        completed: 8,
        archived: 16
    }
    return createTestProject({ status: statusMap[status] || parseInt(status) || 0 })
}

/**
 * Create varied test images for filtering tests
 */
export function createVariedTestImages(): TestEntity[] {
    return [
        createTestImage({ id: 1, name: 'Raw Image', status: 0, ttags: 1 }),
        createTestImage({ id: 2, name: 'Approved Image', status: 2, ttags: 3 }),
        createTestImage({ id: 3, name: 'Published Image', status: 4, ttags: 5 }),
        createTestImage({ id: 4, name: 'Featured Image', status: 4, ctags: 2 }),
        createTestImage({ id: 5, name: 'Archived Image', status: 16, ttags: 1 })
    ]
}

/**
 * Helper: Convert bit array to integer value
 */
function bitsToHex(bits: (number | string)[]): number {
    if (bits.length === 0) return 0

    // If first element is already a number, return it
    if (typeof bits[0] === 'number' && bits.length === 1) {
        return bits[0]
    }

    // Calculate byte value from bit positions
    let byte = 0
    bits.forEach(bit => {
        if (typeof bit === 'number' && bit >= 0 && bit <= 7) {
            byte |= (1 << bit)
        }
    })

    return byte
}

/**
 * Create minimal entity (only required fields)
 */
export function createMinimalEntity(type: 'image' | 'project' | 'event' = 'image'): TestEntity {
    const base = {
        id: 1,
        name: 'Minimal Entity',
        status: 0,
        ttags: 0,
        dtags: 0,
        rtags: 0,
        ctags: 0,
        itags_val: 0
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
        status: 255,
        ttags: 255,
        dtags: 255,
        rtags: 255,
        ctags: 255,
        itags_val: 255
    })
}
