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

    // Clean up test project and user
    await db.run(`DELETE FROM projects WHERE id = 101`)
    await db.run(`DELETE FROM users WHERE id = 101`)
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

        // Verify shape fields were populated (PostgreSQL returns composite types as strings)
        expect(image.shape_square).toBeDefined()
        expect(typeof image.shape_square === 'string' ? image.shape_square : JSON.stringify(image.shape_square)).toContain('images.unsplash.com')
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
})
