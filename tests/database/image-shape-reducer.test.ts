/**
 * Test: Image Shape Reducer - Computed JSONB Fields
 * 
 * ⚠️  REQUIRES POSTGRESQL - This test uses PostgreSQL-specific features (composite types, JSONB, triggers)
 * 
 * Run with: TEST_DATABASE_TYPE=postgresql pnpm test tests/database/image-shape-reducer.test.ts
 * Or use: pnpm test:pg tests/database/image-shape-reducer.test.ts
 * 
 * This test verifies the trigger function that computes img_thumb, img_square, img_wide, img_vert
 * as JSONB fields on the images table based on the shape composite types.
 * 
 * Test Data Source: images.id = 5 (extracted before schema refactor)
 * 
 * Original Record Data:
 * - id: 5
 * - url: https://images.unsplash.com/photo-1737416372938-b3f2e1c21bb4?ixid=M3w0MDg1MTV8MHwxfGFsbHx8fHx8fHx8fDE3NjIxNTg0MDB8&ixlib=rb-4.1.0
 * - ctags: \x01 (byte value 1, quality bits 6+7 = 0, meaning "ok" status)
 * - rtags: empty
 * - shape_thumb: (,,,https://thumb.images.unsplash.com/photo-1737416372938-b3f2e1c21bb4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w0MDg1MTV8MHwxfGFsbHx8fHx8fHx8fDE3NjIxNTg0MDB8&ixlib=rb-4.1.0&q=80&w=200,)
 * - shape_square: (,,,https://square.images.unsplash.com/photo-1737416372938-b3f2e1c21bb4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w0MDg1MTV8MHwxfGFsbHx8fHx8fHx8fDE3NjIxNTg0MDB8&ixlib=rb-4.1.0&q=80&w=1080,)
 * - shape_wide: (,,,https://wide.images.unsplash.com/photo-1737416372938-b3f2e1c21bb4?crop=entropy&cs=srgb&fm=jpg&ixid=M3w0MDg1MTV8MHwxfGFsbHx8fHx8fHx8fDE3NjIxNTg0MDB8&ixlib=rb-4.1.0&q=85,)
 * - shape_vertical: (,,,https://vertical.images.unsplash.com/photo-1737416372938-b3f2e1c21bb4?ixid=M3w0MDg1MTV8MHwxfGFsbHx8fHx8fHx8fDE3NjIxNTg0MDB8&ixlib=rb-4.1.0,)
 * - license: unsplash
 * - alt_text: Batch imported from Unsplash
 * - author: (cloudinary,,,,,)
 * 
 * Shape Composite Format: (x numeric, y numeric, z numeric, url text, json jsonb)
 * Note: In the original data, only url field is set, x/y/z/json are NULL
 * 
 * Expected Behavior After Trigger Implementation:
 * 
 * 1. img_square (Loop 1 - creates fallback):
 *    - Check shape_square.json: NULL → skip
 *    - Check shape_square.x: NULL → skip
 *    - Check shape_square.url: NOT NULL → return {"url": "https://square.images.unsplash.com/..."}
 *    - Result: {"url": "https://square.images.unsplash.com/photo-1737416372938-b3f2e1c21bb4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w0MDg1MTV8MHwxfGFsbHx8fHx8fHx8fDE3NjIxNTg0MDB8&ixlib=rb-4.1.0&q=80&w=1080"}
 * 
 * 2. img_thumb (Loop 2 - can use fallback):
 *    - Check shape_thumb.json: NULL → skip
 *    - Check shape_thumb.x: NULL → skip
 *    - Check shape_thumb.url: NOT NULL → return {"url": "https://thumb.images.unsplash.com/..."}
 *    - Result: {"url": "https://thumb.images.unsplash.com/photo-1737416372938-b3f2e1c21bb4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w0MDg1MTV8MHwxfGFsbHx8fHx8fHx8fDE3NjIxNTg0MDB8&ixlib=rb-4.1.0&q=80&w=200"}
 * 
 * 3. img_wide (Loop 3):
 *    - Check shape_wide.json: NULL → skip
 *    - Check shape_wide.x: NULL → skip
 *    - Check shape_wide.url: NOT NULL → return {"url": "https://wide.images.unsplash.com/..."}
 *    - Result: {"url": "https://wide.images.unsplash.com/photo-1737416372938-b3f2e1c21bb4?crop=entropy&cs=srgb&fm=jpg&ixid=M3w0MDg1MTV8MHwxfGFsbHx8fHx8fHx8fDE3NjIxNTg0MDB8&ixlib=rb-4.1.0&q=85"}
 * 
 * 4. img_vert (Loop 4):
 *    - Check shape_vertical.json: NULL → skip
 *    - Check shape_vertical.x: NULL → skip
 *    - Check shape_vertical.url: NOT NULL → return {"url": "https://vertical.images.unsplash.com/..."}
 *    - Result: {"url": "https://vertical.images.unsplash.com/photo-1737416372938-b3f2e1c21bb4?ixid=M3w0MDg1MTV8MHwxfGFsbHx8fHx8fHx8fDE3NjIxNTg0MDB8&ixlib=rb-4.1.0"}
 * 
 * Test Scenarios to Cover:
 * 
 * A) All shapes have URL only (current test data) - DONE
 * B) shape_thumb is NULL, should fallback to img_square value
 * C) shape has x,y,z params instead of URL
 * D) shape has json object
 * E) shape_square is completely NULL - should return {"error": true}
 * F) shape_wide/vert are NULL - should return {"enabled": false}
 * G) img_show calculation based on ctags quality bits
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { PostgreSQLAdapter } from '../../server/database/adapters/postgresql'
import { testDbConfig } from '../../server/database/test-config'
import type { DatabaseAdapter } from '../../server/database/adapter'

describe('Image Shape Reducer - JSONB Computed Fields', () => {
    let db: DatabaseAdapter

    beforeAll(async () => {
        // Connect to existing test database (migrations already ran in global setup)
        if (!testDbConfig.connectionString) {
            throw new Error('PostgreSQL connection string not configured for tests')
        }
        db = new PostgreSQLAdapter(testDbConfig.connectionString)

        // Create test image with ID 5 (the original test data)
        await db.run(`
            INSERT INTO images (id, name, url, ctags, rtags, shape_thumb, shape_square, shape_wide, shape_vertical, license, alt_text)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            ON CONFLICT (id) DO UPDATE SET
                url = EXCLUDED.url,
                ctags = EXCLUDED.ctags,
                shape_thumb = EXCLUDED.shape_thumb,
                shape_square = EXCLUDED.shape_square,
                shape_wide = EXCLUDED.shape_wide,
                shape_vertical = EXCLUDED.shape_vertical
        `, [
            5,
            'Test Image for Shape Reducer',
            'https://images.unsplash.com/photo-1737416372938-b3f2e1c21bb4?ixid=M3w0MDg1MTV8MHwxfGFsbHx8fHx8fHx8fDE3NjIxNTg0MDB8&ixlib=rb-4.1.0',
            Buffer.from([0x01]), // ctags = 1, quality bits = 0 (ok)
            Buffer.from([]), // rtags = empty
            '(,,,https://thumb.images.unsplash.com/photo-1737416372938-b3f2e1c21bb4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w0MDg1MTV8MHwxfGFsbHx8fHx8fHx8fDE3NjIxNTg0MDB8&ixlib=rb-4.1.0&q=80&w=200,)',
            '(,,,https://square.images.unsplash.com/photo-1737416372938-b3f2e1c21bb4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w0MDg1MTV8MHwxfGFsbHx8fHx8fHx8fDE3NjIxNTg0MDB8&ixlib=rb-4.1.0&q=80&w=1080,)',
            '(,,,https://wide.images.unsplash.com/photo-1737416372938-b3f2e1c21bb4?crop=entropy&cs=srgb&fm=jpg&ixid=M3w0MDg1MTV8MHwxfGFsbHx8fHx8fHx8fDE3NjIxNTg0MDB8&ixlib=rb-4.1.0&q=85,)',
            '(,,,https://vertical.images.unsplash.com/photo-1737416372938-b3f2e1c21bb4?ixid=M3w0MDg1MTV8MHwxfGFsbHx8fHx8fHx8fDE3NjIxNTg0MDB8&ixlib=rb-4.1.0,)',
            'unsplash',
            'Batch imported from Unsplash'
        ])

        // Reset the sequence to avoid conflicts with auto-increment
        await db.run(`SELECT setval('images_id_seq', (SELECT MAX(id) FROM images))`)

    })

    afterAll(async () => {
        // Clean up test image
        await db.run('DELETE FROM images WHERE id = $1', [5])

        if (db && typeof db.close === 'function') {
            await db.close()
        }
    })

    describe('Scenario A: All shapes have URL only (no x/y/z or json)', () => {
        it('should compute img_square from shape_square.url', async () => {
            const result = await db.get(
                'SELECT img_square FROM images WHERE id = $1',
                [5]
            )

            expect(result.img_square).toEqual({
                url: 'https://square.images.unsplash.com/photo-1737416372938-b3f2e1c21bb4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w0MDg1MTV8MHwxfGFsbHx8fHx8fHx8fDE3NjIxNTg0MDB8&ixlib=rb-4.1.0&q=80&w=1080'
            })
        })

        it('should compute img_thumb from shape_thumb.url', async () => {
            const result = await db.get(
                'SELECT img_thumb FROM images WHERE id = $1',
                [5]
            )

            expect(result.img_thumb).toEqual({
                url: 'https://thumb.images.unsplash.com/photo-1737416372938-b3f2e1c21bb4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w0MDg1MTV8MHwxfGFsbHx8fHx8fHx8fDE3NjIxNTg0MDB8&ixlib=rb-4.1.0&q=80&w=200'
            })
        })

        it('should compute img_wide from shape_wide.url', async () => {
            const result = await db.get(
                'SELECT img_wide FROM images WHERE id = $1',
                [5]
            )

            expect(result.img_wide).toEqual({
                url: 'https://wide.images.unsplash.com/photo-1737416372938-b3f2e1c21bb4?crop=entropy&cs=srgb&fm=jpg&ixid=M3w0MDg1MTV8MHwxfGFsbHx8fHx8fHx8fDE3NjIxNTg0MDB8&ixlib=rb-4.1.0&q=85'
            })
        })

        it('should compute img_vert from shape_vertical.url', async () => {
            const result = await db.get(
                'SELECT img_vert FROM images WHERE id = $1',
                [5]
            )

            expect(result.img_vert).toEqual({
                url: 'https://vertical.images.unsplash.com/photo-1737416372938-b3f2e1c21bb4?ixid=M3w0MDg1MTV8MHwxfGFsbHx8fHx8fHx8fDE3NjIxNTg0MDB8&ixlib=rb-4.1.0'
            })
        })
    })

    describe('Scenario B: shape_thumb is NULL, should fallback to img_square', () => {
        let testImageId: number

        it('should create test image with NULL shape_thumb', async () => {
            const result = await db.get(`
                INSERT INTO images (name, url, ctags, shape_thumb, shape_square)
                VALUES ('Test Image', $1, $2, NULL, $3)
                RETURNING id
            `, [
                'https://images.unsplash.com/test-fallback',
                Buffer.from([0x01]), // quality = ok
                '(,,,https://square.images.unsplash.com/test-fallback,)'
            ])
            testImageId = result.id
        })

        it('should use img_square value for img_thumb when shape_thumb is NULL', async () => {
            const result = await db.get(
                'SELECT img_thumb, img_square FROM images WHERE id = $1',
                [testImageId]
            )

            // img_thumb should equal img_square (fallback behavior)
            expect(result.img_thumb).toEqual(result.img_square)
            expect(result.img_thumb).toEqual({
                url: 'https://square.images.unsplash.com/test-fallback'
            })
        })

        afterAll(async () => {
            if (testImageId) {
                await db.run('DELETE FROM images WHERE id = $1', [testImageId])
            }
        })
    })

    describe('Scenario C: shape has x,y,z params instead of URL', () => {
        let testImageId: number

        it('should create test image with x,y,z params', async () => {
            const result = await db.get(`
                INSERT INTO images (name, url, ctags, shape_square)
                VALUES ('Test Image', $1, $2, $3)
                RETURNING id
            `, [
                'https://images.unsplash.com/test-params',
                Buffer.from([0x01]),
                '(100,200,300,,)' // x=100, y=200, z=300, url=NULL, json=NULL
            ])
            testImageId = result.id
        })

        it('should compute img_square with params object', async () => {
            const result = await db.get(
                'SELECT img_square FROM images WHERE id = $1',
                [testImageId]
            )

            expect(result.img_square).toEqual({
                type: 'params',
                x: 100,
                y: 200,
                z: 300
            })
        })

        afterAll(async () => {
            if (testImageId) {
                await db.run('DELETE FROM images WHERE id = $1', [testImageId])
            }
        })
    })

    describe('Scenario D: shape has json object', () => {
        let testImageId: number

        it('should create test image with json in shape', async () => {
            const result = await db.get(`
                INSERT INTO images (name, url, ctags, shape_square)
                VALUES ('Test Image', $1, $2, $3)
                RETURNING id
            `, [
                'https://images.unsplash.com/test-json',
                Buffer.from([0x01]),
                '(,,,,"{\\"custom\\": \\"data\\", \\"width\\": 1080}")'
            ])
            testImageId = result.id
        })

        it('should use json from shape directly', async () => {
            const result = await db.get(
                'SELECT img_square FROM images WHERE id = $1',
                [testImageId]
            )

            expect(result.img_square).toEqual({
                custom: 'data',
                width: 1080
            })
        })

        afterAll(async () => {
            if (testImageId) {
                await db.run('DELETE FROM images WHERE id = $1', [testImageId])
            }
        })
    })

    describe('Scenario E: shape_square is completely NULL', () => {
        let testImageId: number

        it('should create test image with NULL shape_square', async () => {
            const result = await db.get(`
                INSERT INTO images (name, url, ctags, shape_square)
                VALUES ('Test Image', $1, $2, NULL)
                RETURNING id
            `, [
                'https://images.unsplash.com/test-null-square',
                Buffer.from([0x01])
            ])
            testImageId = result.id
        })

        it('should return error object for img_square when shape is NULL', async () => {
            const result = await db.get(
                'SELECT img_square FROM images WHERE id = $1',
                [testImageId]
            )

            expect(result.img_square).toEqual({
                error: true
            })
        })

        afterAll(async () => {
            if (testImageId) {
                await db.run('DELETE FROM images WHERE id = $1', [testImageId])
            }
        })
    })

    describe('Scenario F: shape_wide/vert are NULL', () => {
        let testImageId: number

        it('should create test image with NULL shape_wide and shape_vertical', async () => {
            const result = await db.get(`
                INSERT INTO images (name, url, ctags, shape_square, shape_wide, shape_vertical)
                VALUES ('Test Image', $1, $2, $3, NULL, NULL)
                RETURNING id
            `, [
                'https://images.unsplash.com/test-null-variants',
                Buffer.from([0x01]),
                '(,,,https://square.images.unsplash.com/test,)'
            ])
            testImageId = result.id
        })

        it('should return enabled:false for img_wide when shape_wide is NULL', async () => {
            const result = await db.get(
                'SELECT img_wide FROM images WHERE id = $1',
                [testImageId]
            )

            expect(result.img_wide).toEqual({
                enabled: false
            })
        })

        it('should return enabled:false for img_vert when shape_vertical is NULL', async () => {
            const result = await db.get(
                'SELECT img_vert FROM images WHERE id = $1',
                [testImageId]
            )

            expect(result.img_vert).toEqual({
                enabled: false
            })
        })

        afterAll(async () => {
            if (testImageId) {
                await db.run('DELETE FROM images WHERE id = $1', [testImageId])
            }
        })
    })

    describe('Scenario G: img_show calculation based on ctags quality bits', () => {
        it('should return true for img_show when quality bits = 0 (ok)', async () => {
            const result = await db.get(
                'SELECT img_show, ctags FROM images WHERE id = $1',
                [5]
            )

            // ctags = 0x01, bits 6+7 = 0 (ok status)
            expect(result.img_show).toBe(true)
        })

        it('should return true for img_show when quality bits = 64 (is_deprecated)', async () => {
            let testImageId: number
            const result = await db.get(`
                INSERT INTO images (name, url, ctags, shape_square)
                VALUES ('Test Image', $1, $2, $3)
                RETURNING id, img_show
            `, [
                'https://images.unsplash.com/test-deprecated',
                Buffer.from([0x40]), // 0x40 = 64 = bits 6+7 set to 01 (is_deprecated)
                '(,,,https://square.images.unsplash.com/test,)'
            ])
            testImageId = result.id

            expect(result.img_show).toBe(true)

            // Cleanup
            await db.run('DELETE FROM images WHERE id = $1', [testImageId])
        })

        it('should return false for img_show when quality bits indicate not ok', async () => {
            let testImageId: number
            const result = await db.get(`
                INSERT INTO images (name, url, ctags, shape_square)
                VALUES ('Test Image', $1, $2, $3)
                RETURNING id, img_show
            `, [
                'https://images.unsplash.com/test-not-ok',
                Buffer.from([0x80]), // 0x80 = 128 = bits 6+7 set to 10 (not ok)
                '(,,,https://square.images.unsplash.com/test,)'
            ])
            testImageId = result.id

            expect(result.img_show).toBe(false)

            // Cleanup
            await db.run('DELETE FROM images WHERE id = $1', [testImageId])
        })
    })
})
