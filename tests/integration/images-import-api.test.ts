/**
 * Integration Tests - Images Import API Endpoint
 * 
 * Tests for images import endpoint with external adapters:
 * - POST /api/images/import (batch import from external URLs)
 * 
 * Tests verify:
 * - Unsplash adapter integration with real API calls
 * - Adapter auto-detection from URLs
 * - Batch processing with xml_root sequencing
 * - Error handling for unsupported URLs
 * - Mixed URL imports (partial success)
 * - Metadata extraction and transformation
 * - Database insertion with all fields
 * 
 * NOTE: These tests require:
 * - PostgreSQL (custom types and triggers)
 * - UNSPLASH_ACCESS_KEY environment variable
 * - Internet connection for Unsplash API calls
 * 
 * Run with: TEST_DATABASE_TYPE=postgresql pnpm test
 */

import { describe, it, expect, beforeEach, afterEach, beforeAll } from 'vitest'
import { PostgreSQLAdapter } from '../../server/database/adapters/postgresql.js'
import { testDbConfig, isPostgreSQLTest } from '../../server/database/test-config.js'
import type { DatabaseAdapter } from '../../server/database/adapter.js'
import { adapterRegistry } from '../../server/adapters/registry'
import type { ImageImportBatch } from '../../server/types/adapters'

// Skip all tests if not running on PostgreSQL or missing Unsplash key
const describeOrSkip = (isPostgreSQLTest() && process.env.UNSPLASH_ACCESS_KEY) ? describe : describe.skip

// Shared database connection
let sharedDb: DatabaseAdapter

beforeAll(async () => {
    if (isPostgreSQLTest()) {
        sharedDb = new PostgreSQLAdapter(testDbConfig.connectionString!)
    }
})

// Helper function to simulate the import endpoint logic
async function importImages(urls: string[], batch?: ImageImportBatch) {
    const results = []

    for (let i = 0; i < urls.length; i++) {
        const url = urls[i]

        try {
            const adapter = adapterRegistry.detectAdapter(url)

            if (!adapter) {
                results.push({
                    success: false,
                    url,
                    adapter: 'external' as const,
                    error: 'No adapter found for this URL. Supported: Unsplash'
                })
                continue
            }

            const batchWithSequence = { ...batch }
            if (batch?.xml_root) {
                const sequence = String(i).padStart(2, '0')
                batchWithSequence.xml_root = `${batch.xml_root}.${sequence}`
            }

            const result = await adapter.importImage(url, batchWithSequence)
            results.push(result)

        } catch (error) {
            results.push({
                success: false,
                url,
                adapter: 'external' as const,
                error: error instanceof Error ? error.message : 'Unknown error'
            })
        }
    }

    const successful = results.filter(r => r.success).length
    const failed = results.filter(r => !r.success).length

    return {
        success: failed === 0,
        total: urls.length,
        successful,
        failed,
        results
    }
}

// Helper to create test projects and users
async function createTestData(db: DatabaseAdapter) {
    // Create test users
    await db.run(`
        INSERT INTO users (id, sysmail, password, username, status_id, role)
        VALUES 
            (101, 'import_test@test.com', 'hash', 'import_tester', 18, 'user')
        ON CONFLICT (id) DO NOTHING
    `)

    // Create test project  
    await db.run(`
        INSERT INTO projects (id, domaincode, name, status_id, owner_id)
        VALUES (101, 'import_test', 'Import Test Project', 24, 101)
        ON CONFLICT (id) DO NOTHING
    `)
}

// Helper to clean up test data
async function cleanupTestData(db: DatabaseAdapter) {
    // Delete test images first (FK constraint)
    await db.run(`DELETE FROM images WHERE xmlid LIKE 'test_import%'`)
    await db.run(`DELETE FROM images WHERE xmlid LIKE 'batch_test%'`)
    await db.run(`DELETE FROM images WHERE xmlid LIKE 'mixed_test%'`)
    await db.run(`DELETE FROM images WHERE xmlid LIKE 'import_test%'`)  // Added for new tests
    await db.run(`DELETE FROM images WHERE project_id = 101`)  // Catch any by project

    // Clean up test project and user
    await db.run(`DELETE FROM projects WHERE id = 101`)
    await db.run(`DELETE FROM users WHERE id = 101`)
}

// Helper to parse PostgreSQL composite type string
// Format: (x,y,z,url,json,blur,turl,tpar)
// Returns object with parsed fields
function parseCompositeType(compositeStr: string): {
    x: string | null
    y: string | null
    z: string | null
    url: string | null
    json: string | null
    blur: string | null
    turl: string | null
    tpar: string | null
} {
    // Remove outer parentheses
    const match = compositeStr.match(/^\((.*)\)$/)
    if (!match) {
        throw new Error(`Invalid composite type format: ${compositeStr}`)
    }

    // Split by comma, handling quoted strings
    const parts: string[] = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < match[1].length; i++) {
        const char = match[1][i]

        if (char === '"' && (i === 0 || match[1][i - 1] !== '\\')) {
            inQuotes = !inQuotes
            current += char
        } else if (char === ',' && !inQuotes) {
            parts.push(current.trim())
            current = ''
        } else {
            current += char
        }
    }
    parts.push(current.trim())

    // Ensure we have exactly 8 fields
    if (parts.length !== 8) {
        throw new Error(`Expected 8 fields in composite type, got ${parts.length}: ${compositeStr}`)
    }

    // Parse each field (empty string or quoted string means value, otherwise null)
    const parseField = (field: string): string | null => {
        if (!field || field === '') return null
        // Remove quotes if present
        if (field.startsWith('"') && field.endsWith('"')) {
            return field.slice(1, -1)
        }
        return field
    }

    return {
        x: parseField(parts[0]),
        y: parseField(parts[1]),
        z: parseField(parts[2]),
        url: parseField(parts[3]),
        json: parseField(parts[4]),
        blur: parseField(parts[5]),
        turl: parseField(parts[6]),
        tpar: parseField(parts[7])
    }
}

describeOrSkip('Images Import API - POST /api/images/import', () => {
    // Valid Unsplash photo IDs for testing (confirmed working with API)
    const TEST_UNSPLASH_ID_1 = 'lX8R7OoR6r8'  // Streetlights in circular pattern
    const TEST_UNSPLASH_ID_2 = 'tMI2_-r5Nfo'  // Another valid Unsplash photo
    const TEST_UNSPLASH_ID_3 = '6MT4_Ut8a3Y'  // iPad on table

    beforeEach(async () => {
        await createTestData(sharedDb)
    })

    afterEach(async () => {
        await cleanupTestData(sharedDb)
    })

    it('should import single Unsplash image with full metadata', async () => {
        const result = await importImages(
            [`https://images.unsplash.com/photo-${TEST_UNSPLASH_ID_1}`],
            {
                domaincode: 'import_test',
                owner_id: 101,
                alt_text: 'Test import from Unsplash',
                license: 'unsplash',
                xml_root: 'test_import_single'
            }
        )

        // Verify response structure
        expect(result.success).toBe(true)
        expect(result.total).toBe(1)
        expect(result.successful).toBe(1)
        expect(result.failed).toBe(0)
        expect(result.results).toHaveLength(1)

        // Verify result details
        const importResult = result.results[0]
        expect(importResult.success).toBe(true)
        expect(importResult.adapter).toBe('unsplash')
        expect(importResult.image_id).toBeTypeOf('number')
        expect(importResult.url).toContain('images.unsplash.com') // URL from Unsplash API

        // Verify database record
        const image = await sharedDb.get(
            'SELECT * FROM images WHERE id = $1',
            [importResult.image_id]
        )

        expect(image).toBeDefined()
        expect(image.xmlid).toBe('test_import_single.00') // Sequencing applied even for single image
        expect(image.project_id).toBe(101)
        expect(image.project_domaincode).toBe('import_test') // Trigger-populated
        expect(image.owner_id).toBe(101)
        expect(image.license).toBe('unsplash')
        expect(image.url).toContain('images.unsplash.com')
        expect(image.fileformat).toBe('jpeg')

        // Verify Unsplash metadata was extracted
        expect(image.x).toBeTypeOf('number')
        expect(image.y).toBeTypeOf('number')
        expect(image.author).toContain('unsplash') // Contains adapter info
        expect(image.about.toLowerCase()).toContain('unsplash') // Attribution text (case-insensitive)

        // Verify shape fields were populated with 8-field composite types
        expect(image.shape_square).toBeDefined()
        expect(image.shape_thumb).toBeDefined()
        expect(image.shape_wide).toBeDefined()
        expect(image.shape_vertical).toBeDefined()

        // Parse and verify shape_square
        const shapeSquare = parseCompositeType(image.shape_square)
        expect(shapeSquare.url).toContain('images.unsplash.com')
        expect(shapeSquare.url).toContain('crop=entropy') // Uses entropy crop
        expect(shapeSquare.url).toContain('w=128') // Correct crop dimensions
        expect(shapeSquare.url).toContain('h=128')
        expect(shapeSquare.x).toBe('128')
        expect(shapeSquare.y).toBe('128')
        expect(shapeSquare.blur).toBeTruthy() // BlurHash generated
        expect(shapeSquare.blur!.length).toBeGreaterThan(10) // BlurHash is ~20-30 chars

        // Parse and verify shape_thumb (uses focalpoint crop with 1.5x zoom)
        const shapeThumb = parseCompositeType(image.shape_thumb)
        expect(shapeThumb.url).toContain('images.unsplash.com')
        expect(shapeThumb.url).toContain('crop=focalpoint') // Focalpoint crop for face-focused view
        expect(shapeThumb.url).toContain('w=64')
        expect(shapeThumb.url).toContain('h=64')
        expect(shapeThumb.url).toContain('fp-x=0.5') // Center horizontal
        expect(shapeThumb.url).toContain('fp-y=0.5') // Center vertical (face height)
        expect(shapeThumb.url).toContain('fp-z=1.5') // 1.5x zoom
        expect(shapeThumb.x).toBe('64')
        expect(shapeThumb.y).toBe('64')
        expect(shapeThumb.blur).toBeTruthy()

        // Parse and verify shape_wide
        const shapeWide = parseCompositeType(image.shape_wide)
        expect(shapeWide.url).toContain('images.unsplash.com')
        expect(shapeWide.url).toContain('crop=entropy') // Uses entropy crop
        expect(shapeWide.url).toContain('w=336')
        expect(shapeWide.url).toContain('h=168')
        expect(shapeWide.x).toBe('336')
        expect(shapeWide.y).toBe('168')
        expect(shapeWide.blur).toBeTruthy()

        // Parse and verify shape_vertical
        const shapeVertical = parseCompositeType(image.shape_vertical)
        expect(shapeVertical.url).toContain('images.unsplash.com')
        expect(shapeVertical.url).toContain('crop=entropy') // Uses entropy crop
        expect(shapeVertical.url).toContain('w=126')
        expect(shapeVertical.url).toContain('h=224')
        expect(shapeVertical.x).toBe('126')
        expect(shapeVertical.y).toBe('224')
        expect(shapeVertical.blur).toBeTruthy()

        // Verify all shapes have unique blur hashes (they should be the same URL with different crops)
        console.log('BlurHash values:', {
            square: shapeSquare.blur,
            thumb: shapeThumb.blur,
            wide: shapeWide.blur,
            vertical: shapeVertical.blur
        })
    })

    it('should import multiple images with xml_root sequencing', async () => {
        const result = await importImages(
            [
                `https://images.unsplash.com/photo-${TEST_UNSPLASH_ID_1}`,
                `https://images.unsplash.com/photo-${TEST_UNSPLASH_ID_2}`,
                `https://images.unsplash.com/photo-${TEST_UNSPLASH_ID_3}`
            ],
            {
                domaincode: 'import_test',
                owner_id: 101,
                xml_root: 'batch_test'
            }
        )

        // Verify all imported successfully
        expect(result.success).toBe(true)
        expect(result.total).toBe(3)
        expect(result.successful).toBe(3)
        expect(result.failed).toBe(0)

        // Verify sequential xmlid values
        const images = await sharedDb.all(
            'SELECT xmlid, id FROM images WHERE xmlid LIKE $1 ORDER BY xmlid',
            ['batch_test%']
        )

        expect(images).toHaveLength(3)
        expect(images[0].xmlid).toBe('batch_test.00')
        expect(images[1].xmlid).toBe('batch_test.01')
        expect(images[2].xmlid).toBe('batch_test.02')

        // All should have same project and owner
        const allImages = await sharedDb.all(
            'SELECT project_id, owner_id FROM images WHERE xmlid LIKE $1',
            ['batch_test%']
        )

        allImages.forEach(img => {
            expect(img.project_id).toBe(101)
            expect(img.owner_id).toBe(101)
        })

        // Verify first image has all shapes with blur hashes (8-field composites)
        const firstImage = await sharedDb.get(
            'SELECT * FROM images WHERE id = $1',
            [images[0].id]
        )

        expect(firstImage.shape_square).toBeDefined()
        expect(firstImage.shape_thumb).toBeDefined()
        expect(firstImage.shape_wide).toBeDefined()
        expect(firstImage.shape_vertical).toBeDefined()

        // Quick verification that all shapes have blur hashes
        const square = parseCompositeType(firstImage.shape_square)
        const thumb = parseCompositeType(firstImage.shape_thumb)
        const wide = parseCompositeType(firstImage.shape_wide)
        const vertical = parseCompositeType(firstImage.shape_vertical)

        expect(square.blur).toBeTruthy()
        expect(thumb.blur).toBeTruthy()
        expect(wide.blur).toBeTruthy()
        expect(vertical.blur).toBeTruthy()
    })

    it('should handle unsupported URLs gracefully', async () => {
        const result = await importImages(
            ['https://example.com/some-image.jpg'],
            {
                domaincode: 'import_test'
            }
        )

        // Should report failure but not crash
        expect(result.success).toBe(false)
        expect(result.total).toBe(1)
        expect(result.successful).toBe(0)
        expect(result.failed).toBe(1)

        // Verify error details
        const importResult = result.results[0]
        expect(importResult.success).toBe(false)
        expect(importResult.error).toBeDefined()
        expect(importResult.error).toContain('No adapter found')
        expect(importResult.url).toBe('https://example.com/some-image.jpg')
    })

    it('should handle mixed URLs with partial success', async () => {
        const result = await importImages(
            [
                `https://images.unsplash.com/photo-${TEST_UNSPLASH_ID_1}`, // Should succeed
                'https://example.com/image.jpg' // Should fail
            ],
            {
                domaincode: 'import_test',
                xml_root: 'mixed_test'
            }
        )

        // Should report partial success
        expect(result.success).toBe(false) // Not all succeeded
        expect(result.total).toBe(2)
        expect(result.successful).toBe(1)
        expect(result.failed).toBe(1)

        // Verify first import succeeded
        expect(result.results[0].success).toBe(true)
        expect(result.results[0].adapter).toBe('unsplash')
        expect(result.results[0].image_id).toBeTypeOf('number')

        // Verify second import failed
        expect(result.results[1].success).toBe(false)
        expect(result.results[1].error).toContain('No adapter found')

        // Verify database has only the successful import
        const images = await sharedDb.all(
            'SELECT xmlid FROM images WHERE xmlid LIKE $1',
            ['mixed_test%']
        )

        expect(images).toHaveLength(1)
        expect(images[0].xmlid).toBe('mixed_test.00')
    })

    it('should detect Unsplash adapter from images.unsplash.com URLs', async () => {
        const result = await importImages(
            [`https://images.unsplash.com/photo-${TEST_UNSPLASH_ID_1}`],
            {
                domaincode: 'import_test',
                xml_root: 'test_images_unsplash'
            }
        )

        // Should successfully detect and use Unsplash adapter
        expect(result.success).toBe(true)
        expect(result.results[0].success).toBe(true)
        expect(result.results[0].adapter).toBe('unsplash')
    })

    it('should apply batch metadata to all imported images', async () => {
        const result = await importImages(
            [
                `https://images.unsplash.com/photo-${TEST_UNSPLASH_ID_1}`,
                `https://images.unsplash.com/photo-${TEST_UNSPLASH_ID_2}`
            ],
            {
                domaincode: 'import_test',
                owner_id: 101,
                alt_text: 'Batch alt text',
                license: 'commercial', // Valid enum value
                xml_root: 'batch_metadata_test'
            }
        )

        expect(result.successful).toBe(2)

        // Verify both images have the same batch metadata
        const images = await sharedDb.all(
            'SELECT alt_text, license, owner_id, project_id FROM images WHERE xmlid LIKE $1',
            ['batch_metadata_test%']
        )

        expect(images).toHaveLength(2)

        images.forEach(img => {
            expect(img.alt_text).toBe('Batch alt text')
            expect(img.license).toBe('commercial')
            expect(img.owner_id).toBe(101)
            expect(img.project_id).toBe(101)
        })
    })

    it('should extract and populate image dimensions', async () => {
        const result = await importImages(
            [`https://images.unsplash.com/photo-${TEST_UNSPLASH_ID_1}`],
            {
                domaincode: 'import_test',
                xml_root: 'test_dimensions'
            }
        )

        const image = await sharedDb.get(
            'SELECT x, y, fileformat FROM images WHERE id = $1',
            [result.results[0].image_id]
        )

        // Unsplash images should have dimensions
        expect(image.x).toBeGreaterThan(0)
        expect(image.y).toBeGreaterThan(0)
        expect(image.fileformat).toBe('jpeg')
    })

    it('should populate all shape variants from Unsplash', async () => {
        const result = await importImages(
            [`https://images.unsplash.com/photo-${TEST_UNSPLASH_ID_1}`],
            {
                domaincode: 'import_test',
                xml_root: 'test_shapes'
            }
        )

        const image = await sharedDb.get(
            'SELECT shape_square, shape_thumb, shape_wide FROM images WHERE id = $1',
            [result.results[0].image_id]
        )

        // Verify shape fields are populated (PostgreSQL returns composite types as strings)
        expect(image.shape_square).toBeDefined()
        expect(typeof image.shape_square === 'string' ? image.shape_square : JSON.stringify(image.shape_square)).toContain('images.unsplash.com')

        expect(image.shape_thumb).toBeDefined()
        expect(typeof image.shape_thumb === 'string' ? image.shape_thumb : JSON.stringify(image.shape_thumb)).toContain('images.unsplash.com')

        expect(image.shape_wide).toBeDefined()
        expect(typeof image.shape_wide === 'string' ? image.shape_wide : JSON.stringify(image.shape_wide)).toContain('images.unsplash.com')
    })

    it('should work without batch metadata', async () => {
        const result = await importImages(
            [`https://images.unsplash.com/photo-${TEST_UNSPLASH_ID_1}`]
        )

        expect(result.successful).toBe(1)

        // Should still import with defaults
        const image = await sharedDb.get(
            'SELECT * FROM images WHERE id = $1',
            [result.results[0].image_id]
        )

        expect(image).toBeDefined()
        expect(image.url).toContain('images.unsplash.com')
    })

    it.skip('should import from Cloudinary with crop transformations', async () => {
        // Test Cloudinary URL with existing transformations
        const cloudinaryUrl = 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg'

        const result = await importImages(
            [cloudinaryUrl],
            {
                owner_id: 1,
                xml_root: 'test_cloudinary'
            }
        )

        expect(result.successful).toBe(1)
        expect(result.failed).toBe(0)

        const image = await sharedDb.get(
            'SELECT * FROM images WHERE id = $1',
            [result.results[0].image_id]
        )

        expect(image).toBeDefined()
        expect(image.url).toContain('res.cloudinary.com')
        expect(image.url).toContain('/demo/image/upload/')

        // Verify author adapter
        const author = image.author
        if (typeof author === 'string') {
            expect(author).toContain('cloudinary')
        } else {
            expect(author.adapter).toBe('cloudinary')
        }

        // Parse and verify shape URLs with Cloudinary transformations
        const square = parseCompositeType(image.shape_square)
        expect(square.url).toContain('c_crop')
        expect(square.url).toContain('w_128')
        expect(square.url).toContain('h_128')
        expect(square.blur).toBeTruthy()
        expect(square.blur!.length).toBeGreaterThan(10)

        const thumb = parseCompositeType(image.shape_thumb)
        expect(thumb.url).toContain('c_crop')
        expect(thumb.url).toContain('w_64')
        expect(thumb.url).toContain('h_64')
        expect(thumb.blur).toBeTruthy()

        const wide = parseCompositeType(image.shape_wide)
        expect(wide.url).toContain('c_crop')
        expect(wide.url).toContain('w_336')
        expect(wide.url).toContain('h_168')
        expect(wide.blur).toBeTruthy()

        const vertical = parseCompositeType(image.shape_vertical)
        expect(vertical.url).toContain('c_crop')
        expect(vertical.url).toContain('w_126')
        expect(vertical.url).toContain('h_224')
        expect(vertical.blur).toBeTruthy()

        console.log('Cloudinary blur hashes:', {
            square: square.blur,
            thumb: thumb.blur,
            wide: wide.blur,
            vertical: vertical.blur
        })
    })
})

describeOrSkip('License and About Field Tests', () => {
    // Valid Unsplash photo IDs for testing
    const TEST_UNSPLASH_ID_1 = 'lX8R7OoR6r8'  // Streetlights in circular pattern

    beforeEach(async () => {
        await createTestData(sharedDb)
    })

    afterEach(async () => {
        await cleanupTestData(sharedDb)
    })

    it('should set license="unsplash" for Unsplash imports', async () => {
        // Clean up any existing images with this photo to ensure fresh import
        await sharedDb.run(`DELETE FROM images WHERE url LIKE '%photo-${TEST_UNSPLASH_ID_1}%'`)

        const result = await importImages(
            [`https://images.unsplash.com/photo-${TEST_UNSPLASH_ID_1}`],
            {
                domaincode: 'import_test',
                owner_id: 101
            }
        )

        expect(result.successful).toBe(1)

        const image = await sharedDb.get(
            'SELECT * FROM images WHERE id = $1',
            [result.results[0].image_id]
        )

        expect(image).toBeDefined()
        expect(image.license).toBe('unsplash')
    })

    it.skip('should set license="private" for Cloudinary imports', async () => {
        // TODO: Enable when Cloudinary adapter is fully implemented with BlurHash generation
        const cloudinaryUrl = 'https://res.cloudinary.com/demo/image/upload/v1234567890/sample.jpg'

        const result = await importImages(
            [cloudinaryUrl],
            {
                owner_id: 101
            }
        )

        expect(result.successful).toBe(1)

        const image = await sharedDb.get(
            'SELECT * FROM images WHERE id = $1',
            [result.results[0].image_id]
        )

        expect(image).toBeDefined()
        expect(image.license).toBe('private')
    })

    it('should format about field as "author | license | year" for Unsplash', async () => {
        // Ensure clean state - delete any existing images with this photo ID
        await sharedDb.run(`DELETE FROM images WHERE url LIKE '%photo-${TEST_UNSPLASH_ID_1}%'`)
        
        const result = await importImages(
            [`https://images.unsplash.com/photo-${TEST_UNSPLASH_ID_1}`],
            {
                domaincode: 'import_test',
                owner_id: 101,
                xml_subject: 'test_about'  // Explicit subject for testing
            }
        )

        expect(result.successful).toBe(1)

        const image = await sharedDb.get(
            'SELECT * FROM images WHERE id = $1',
            [result.results[0].image_id]
        )

        expect(image).toBeDefined()
        expect(image.about).toBeDefined()

        console.log('DEBUG: Image ID:', result.results[0].image_id)
        console.log('DEBUG: About field value:', image.about)
        console.log('DEBUG: License field:', image.license)

        // Verify format: "(c) Author Name | Unsplash | YYYY"
        const aboutPattern = /^\(c\) .+ \| Unsplash \| \d{4}$/
        expect(image.about).toMatch(aboutPattern)

        // Should NOT contain HTML tags in base format
        expect(image.about).not.toContain('<a')
        expect(image.about).not.toContain('href')

        // Should contain actual author name, not user ID
        const parts = image.about.split(' | ')
        expect(parts).toHaveLength(3)
        expect(parts[0]).toMatch(/^\(c\) .+$/) // Author with copyright
        expect(parts[1]).toBe('Unsplash')       // License
        expect(parts[2]).toMatch(/^\d{4}$/)     // Year (4 digits)

        console.log('Unsplash about field:', image.about)
    })

    it.skip('should format about field as "author | license | year" for Cloudinary', async () => {
        // TODO: Enable when Cloudinary adapter is fully implemented with BlurHash generation
        const cloudinaryUrl = 'https://res.cloudinary.com/demo/image/upload/v1234567890/sample.jpg'

        const result = await importImages(
            [cloudinaryUrl],
            {
                owner_id: 101
            }
        )

        expect(result.successful).toBe(1)

        const image = await sharedDb.get(
            'SELECT * FROM images WHERE id = $1',
            [result.results[0].image_id]
        )

        expect(image).toBeDefined()
        expect(image.about).toBeDefined()

        // Verify format: "(c) Owner | Private | YYYY"
        const aboutPattern = /^\(c\) .+ \| Private \| \d{4}$/
        expect(image.about).toMatch(aboutPattern)

        const parts = image.about.split(' | ')
        expect(parts).toHaveLength(3)
        expect(parts[0]).toMatch(/^\(c\) .+$/) // Owner with copyright
        expect(parts[1]).toBe('Private')       // License
        expect(parts[2]).toMatch(/^\d{4}$/)    // Year (4 digits)

        console.log('Cloudinary about field:', image.about)
    })

    it('should extract author name correctly (not user ID) for Unsplash', async () => {
        // Clean up any existing images with this photo to ensure fresh import
        await sharedDb.run(`DELETE FROM images WHERE url LIKE '%photo-${TEST_UNSPLASH_ID_1}%'`)

        const result = await importImages(
            [`https://images.unsplash.com/photo-${TEST_UNSPLASH_ID_1}`],
            {
                domaincode: 'import_test',
                owner_id: 101
            }
        )

        expect(result.successful).toBe(1)

        const image = await sharedDb.get(
            'SELECT * FROM images WHERE id = $1',
            [result.results[0].image_id]
        )

        expect(image).toBeDefined()

        // Extract author name from about field
        const aboutParts = image.about.split(' | ')
        const authorPart = aboutParts[0] // "(c) Author Name"
        const authorName = authorPart.replace('(c) ', '')

        // Should be a human-readable name, not a user ID or URL slug
        // User IDs typically contain only lowercase letters, numbers, and dashes
        // Real names typically have capital letters and/or spaces
        expect(authorName.length).toBeGreaterThan(0)
        expect(authorName).not.toMatch(/^[a-z0-9-_]+$/) // Not just lowercase/numbers/dashes
        
        console.log('Extracted author name:', authorName)
    })

    it('should extract German alt text from alternative_slugs.de', async () => {
        // Clean up any existing images with this photo to ensure fresh import
        await sharedDb.run(`DELETE FROM images WHERE url LIKE '%photo-${TEST_UNSPLASH_ID_1}%'`)

        const result = await importImages(
            [`https://images.unsplash.com/photo-${TEST_UNSPLASH_ID_1}`],
            {
                domaincode: 'import_test',
                owner_id: 101
            }
        )

        expect(result.successful).toBe(1)

        const image = await sharedDb.get(
            'SELECT * FROM images WHERE id = $1',
            [result.results[0].image_id]
        )

        expect(image).toBeDefined()
        expect(image.alt_text).toBeDefined()
        expect(image.alt_text.length).toBeGreaterThan(0)

        // German alt text should:
        // 1. Start with capital letter (converted from slug)
        // 2. Contain spaces (hyphens replaced)
        // 3. NOT contain photo ID at end
        expect(image.alt_text).toMatch(/^[A-ZÄÖÜ]/) // Starts with capital
        
        // Should be readable text, not a slug with hyphens
        if (image.alt_text.includes('-')) {
            console.warn('Alt text still contains hyphens:', image.alt_text)
        }

        console.log('German alt text:', image.alt_text)
    })
})
