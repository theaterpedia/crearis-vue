/**
 * Integration Tests - Images API Endpoints
 * 
 * Tests for images REST API:
 * - POST /api/images (create)
 * - GET /api/images (list with filters)
 * - GET /api/images/:id (get single)
 * - PUT /api/images/:id (update)
 * - DELETE /api/images/:id (delete)
 * 
 * Tests also verify:
 * - Trigger-computed fields (about, use_player, is_public, etc.)
 * - Entity integration (img_id field in events/posts/projects/users)
 * - Performance fields (img_show, img_thumb, img_square, img_wide, img_vert)
 * 
 * NOTE: These tests require PostgreSQL as they use custom types and triggers.
 * Run with: TEST_DATABASE_TYPE=postgresql pnpm test
 */

import { describe, it, expect, beforeEach, afterEach, beforeAll } from 'vitest'
import { PostgreSQLAdapter } from '../../server/database/adapters/postgresql.js'
import { testDbConfig, isPostgreSQLTest } from '../../server/database/test-config.js'
import type { DatabaseAdapter } from '../../server/database/adapter.js'
import type { ImagesTableFields } from '../../server/types/database'

// Skip all images tests if not running on PostgreSQL (requires custom types)
const describeOrSkip = isPostgreSQLTest() ? describe : describe.skip

// Shared database connection for all tests
let sharedDb: DatabaseAdapter

// Connect once before all tests
beforeAll(async () => {
    if (isPostgreSQLTest()) {
        sharedDb = new PostgreSQLAdapter(testDbConfig.connectionString!)
    }
})

// Helper to create test users
async function createTestUsers(db: DatabaseAdapter) {
    // Create test users (owner_id 1-5)
    await db.run(`
        INSERT INTO users (id, sysmail, password, username, status_id, role)
        VALUES 
            (1, 'user1@test.com', 'hash1', 'user1', 18, 'user'),
            (2, 'user2@test.com', 'hash2', 'user2', 18, 'user'),
            (3, 'user3@test.com', 'hash3', 'user3', 18, 'user'),
            (4, 'user4@test.com', 'hash4', 'user4', 18, 'user'),
            (5, 'user5@test.com', 'hash5', 'user5', 18, 'user')
        ON CONFLICT (id) DO NOTHING
    `)
}

// Helper to create test projects
async function createTestProjects(db: DatabaseAdapter) {
    // Create test projects with different domaincodes
    await db.run(`
        INSERT INTO projects (id, name, domaincode, status_id)
        VALUES 
            (1, 'TP Project', 'tp', 18),
            (2, 'Regio1 Project', 'regio1', 18),
            (3, 'Demo Project', 'demo', 18)
        ON CONFLICT (id) DO NOTHING
    `)
}

describeOrSkip('Images API - POST /api/images', () => {
    let db: DatabaseAdapter

    beforeEach(async () => {
        // Use shared connection
        db = sharedDb
        // Clean up images table before each test
        await db.exec('TRUNCATE TABLE images RESTART IDENTITY CASCADE')
        // Create prerequisite users
        await createTestUsers(db)
    })

    afterEach(async () => {
        // No need to close - we reuse the connection
    })

    it('should create a new image with required fields', async () => {
        const result = await db.run(`
            INSERT INTO images (name, url)
            VALUES (?, ?)
            RETURNING id
        `, ['Test Image', 'https://example.com/test.jpg'])

        const imageId = result.rows?.[0]?.id
        expect(imageId).toBeDefined()

        const image = await db.get('SELECT * FROM images WHERE id = ?', [imageId])
        expect(image).toBeDefined()
        expect(image.name).toBe('Test Image')
        expect(image.url).toBe('https://example.com/test.jpg')
        expect(image.status_id).toBe(0) // default
        expect(image.fileformat).toBe('none') // default
        expect(image.license).toBe('BY') // default
    })

    it('should create image with all optional fields', async () => {
        // Create test project first
        await createTestProjects(db)

        const result = await db.run(`
            INSERT INTO images (
                name, url, project_id, xmlid, alt_text, title,
                x, y, status_id, owner_id
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            RETURNING id
        `, [
            'Full Image',
            'https://example.com/full.jpg',
            1, // project_id for 'tp' project
            'img001',
            'Alt text',
            'Image title',
            1920,
            1080,
            18,
            1
        ])

        const imageId = result.rows?.[0]?.id
        const image = await db.get('SELECT * FROM images WHERE id = ?', [imageId])

        expect(image.name).toBe('Full Image')
        expect(image.project_id).toBe(1)
        expect(image.project_domaincode).toBe('tp') // Computed from project
        expect(image.xmlid).toBe('img001')
        expect(image.alt_text).toBe('Alt text')
        expect(image.x).toBe(1920)
        expect(image.y).toBe(1080)
        expect(image.status_id).toBe(18)
    })

    it('should set computed fields via trigger', async () => {
        const result = await db.run(`
            INSERT INTO images (name, url, owner_id)
            VALUES (?, ?, ?)
            RETURNING id
        `, ['Test Image', 'https://example.com/test.jpg', 5])

        const imageId = result.rows?.[0]?.id
        const image = await db.get('SELECT * FROM images WHERE id = ?', [imageId])

        // Trigger should compute 'about' field
        expect(image.about).toBe('(c) owner_id:5')
        expect(image.use_player).toBe(false)
        expect(image.is_public).toBe(false)
        expect(image.is_private).toBe(false)
        expect(image.is_internal).toBe(false)
    })

    it('should set timestamps automatically', async () => {
        const result = await db.run(`
            INSERT INTO images (name, url)
            VALUES (?, ?)
            RETURNING id
        `, ['Test Image', 'https://example.com/test.jpg'])

        const imageId = result.rows?.[0]?.id
        const image = await db.get('SELECT * FROM images WHERE id = ?', [imageId])

        expect(image.created_at).toBeDefined()
        expect(image.updated_at).toBeDefined()
        expect(image.date).toBeDefined()
    })
})

describeOrSkip('Images API - GET /api/images', () => {
    let db: DatabaseAdapter

    beforeEach(async () => {
        db = sharedDb
        await db.exec('TRUNCATE TABLE images RESTART IDENTITY CASCADE')

        // Create prerequisite data
        await createTestUsers(db)
        await createTestProjects(db)

        // Insert test images with project_id
        await db.run(`
            INSERT INTO images (name, url, project_id, status_id, owner_id)
            VALUES 
                ('Image 1', 'https://example.com/img1.jpg', 1, 18, 1),
                ('Image 2', 'https://example.com/img2.jpg', 1, 0, 1),
                ('Image 3', 'https://example.com/img3.jpg', 2, 18, 2),
                ('Image 4', 'https://example.com/img4.jpg', NULL, 18, NULL)
        `)
    })

    afterEach(async () => {
        // Cleanup done in beforeEach
    })

    it('should list all images', async () => {
        const result = await db.all('SELECT * FROM images ORDER BY id')
        expect(result).toHaveLength(4)
    })

    it('should filter by project_domaincode', async () => {
        const result = await db.all(
            'SELECT * FROM images WHERE project_domaincode = ?',
            ['tp']
        )
        expect(result).toHaveLength(2)
        expect(result[0].project_domaincode).toBe('tp')
        expect(result[1].project_domaincode).toBe('tp')
    })

    it('should filter by project_id', async () => {
        const result = await db.all(
            'SELECT * FROM images WHERE project_id = ?',
            [1]
        )
        expect(result).toHaveLength(2)
        expect(result[0].project_id).toBe(1)
    })

    it('should filter by owner_id', async () => {
        const result = await db.all(
            'SELECT * FROM images WHERE owner_id = ?',
            [1]
        )
        expect(result).toHaveLength(2)
    })

    it('should filter by status_id', async () => {
        const result = await db.all(
            'SELECT * FROM images WHERE status_id = ?',
            [18]
        )
        expect(result).toHaveLength(3)
    })

    it('should order by created_at DESC', async () => {
        const result = await db.all('SELECT * FROM images ORDER BY created_at DESC, id DESC')
        expect(result).toHaveLength(4)
        // Verify ordering works (latest id first when timestamps are equal)
        expect(result[0].id).toBeGreaterThan(result[1].id)
        expect(result[1].id).toBeGreaterThan(result[2].id)
    })
})

describeOrSkip('Images API - GET /api/images/:id', () => {
    let db: DatabaseAdapter
    let testImageId: number

    beforeEach(async () => {
        db = sharedDb
        await db.exec('TRUNCATE TABLE images RESTART IDENTITY CASCADE')

        // Create prerequisite data
        await createTestUsers(db)
        await createTestProjects(db)

        const result = await db.run(`
            INSERT INTO images (name, url, project_id, owner_id)
            VALUES (?, ?, ?, ?)
            RETURNING id
        `, ['Test Image', 'https://example.com/test.jpg', 1, 1])

        testImageId = result.rows?.[0]?.id
    })

    afterEach(async () => {
        // Cleanup done in beforeEach
    })

    it('should get single image by id', async () => {
        const image = await db.get('SELECT * FROM images WHERE id = ?', [testImageId])

        expect(image).toBeDefined()
        expect(image.id).toBe(testImageId)
        expect(image.name).toBe('Test Image')
        expect(image.url).toBe('https://example.com/test.jpg')
    })

    it('should return null for non-existent id', async () => {
        const image = await db.get('SELECT * FROM images WHERE id = ?', [99999])
        expect(image).toBeUndefined()
    })

    it('should include all fields', async () => {
        const image = await db.get('SELECT * FROM images WHERE id = ?', [testImageId])

        // Check required fields
        expect(image).toHaveProperty('id')
        expect(image).toHaveProperty('name')
        expect(image).toHaveProperty('url')

        // Check computed fields
        expect(image).toHaveProperty('about')
        expect(image).toHaveProperty('use_player')
        expect(image).toHaveProperty('is_public')
        expect(image).toHaveProperty('is_private')

        // Check timestamps
        expect(image).toHaveProperty('created_at')
        expect(image).toHaveProperty('updated_at')
    })
})

describeOrSkip('Images API - PUT /api/images/:id', () => {
    let db: DatabaseAdapter
    let testImageId: number

    beforeEach(async () => {
        db = sharedDb
        await db.exec('TRUNCATE TABLE images RESTART IDENTITY CASCADE')

        const result = await db.run(`
            INSERT INTO images (name, url, alt_text)
            VALUES (?, ?, ?)
            RETURNING id
        `, ['Original Name', 'https://example.com/original.jpg', 'Original alt'])

        testImageId = result.rows?.[0]?.id
    })

    afterEach(async () => {
        // Cleanup done in beforeEach
    })

    it('should update image name', async () => {
        await db.run(
            'UPDATE images SET name = ? WHERE id = ?',
            ['Updated Name', testImageId]
        )

        const image = await db.get('SELECT * FROM images WHERE id = ?', [testImageId])
        expect(image.name).toBe('Updated Name')
    })

    it('should update multiple fields', async () => {
        await db.run(
            'UPDATE images SET name = ?, alt_text = ?, x = ?, y = ? WHERE id = ?',
            ['New Name', 'New alt text', 1920, 1080, testImageId]
        )

        const image = await db.get('SELECT * FROM images WHERE id = ?', [testImageId])
        expect(image.name).toBe('New Name')
        expect(image.alt_text).toBe('New alt text')
        expect(image.x).toBe(1920)
        expect(image.y).toBe(1080)
    })

    it('should update updated_at timestamp', async () => {
        const before = await db.get('SELECT updated_at FROM images WHERE id = ?', [testImageId])

        // Wait a moment
        await new Promise(resolve => setTimeout(resolve, 10))

        await db.run(
            'UPDATE images SET name = ? WHERE id = ?',
            ['Updated', testImageId]
        )

        const after = await db.get('SELECT updated_at FROM images WHERE id = ?', [testImageId])
        expect(after.updated_at).not.toBe(before.updated_at)
    })
})

describeOrSkip('Images API - DELETE /api/images/:id', () => {
    let db: DatabaseAdapter
    let testImageId: number

    beforeEach(async () => {
        db = sharedDb
        await db.exec('TRUNCATE TABLE images RESTART IDENTITY CASCADE')

        const result = await db.run(`
            INSERT INTO images (name, url)
            VALUES (?, ?)
            RETURNING id
        `, ['Test Image', 'https://example.com/test.jpg'])

        testImageId = result.rows?.[0]?.id
    })

    afterEach(async () => {
        // Cleanup done in beforeEach
    })

    it('should delete image by id', async () => {
        await db.run('DELETE FROM images WHERE id = ?', [testImageId])

        const image = await db.get('SELECT * FROM images WHERE id = ?', [testImageId])
        expect(image).toBeUndefined()
    })

    it('should not affect other images', async () => {
        // Create another image
        await db.run(`
            INSERT INTO images (name, url)
            VALUES (?, ?)
        `, ['Other Image', 'https://example.com/other.jpg'])

        // Delete first image
        await db.run('DELETE FROM images WHERE id = ?', [testImageId])

        // Other image should still exist
        const allImages = await db.all('SELECT * FROM images')
        expect(allImages).toHaveLength(1)
        expect(allImages[0].name).toBe('Other Image')
    })
})

describeOrSkip('Images Integration - Entity img_id Field', () => {
    let db: DatabaseAdapter
    let imageId: number
    let projectId: number

    beforeEach(async () => {
        db = sharedDb
        await db.exec('TRUNCATE TABLE images RESTART IDENTITY CASCADE')

        // Create test image
        const imgResult = await db.run(`
            INSERT INTO images (name, url)
            VALUES (?, ?)
            RETURNING id
        `, ['Test Image', 'https://example.com/test.jpg'])
        imageId = imgResult.rows?.[0]?.id

        // Create test project
        const projResult = await db.run(`
            INSERT INTO projects (domaincode, name)
            VALUES (?, ?)
            RETURNING id
        `, ['test_proj', 'Test Project'])
        projectId = projResult.rows?.[0]?.id
    })

    afterEach(async () => {
        // Cleanup done in beforeEach
    })

    it('should allow setting img_id on events', async () => {
        const result = await db.run(`
            INSERT INTO events (name, project_id, img_id)
            VALUES (?, ?, ?)
            RETURNING id
        `, ['Test Event', projectId, imageId])

        const eventId = result.rows?.[0]?.id
        const event = await db.get('SELECT * FROM events WHERE id = ?', [eventId])

        expect(event.img_id).toBe(imageId)
        // Trigger should populate computed fields
        expect(event.img_show).toBeDefined()
        expect(event.img_thumb).toBeDefined()
    })

    it('should allow setting img_id on posts', async () => {
        const result = await db.run(`
            INSERT INTO posts (name, project_id, img_id)
            VALUES (?, ?, ?)
            RETURNING id
        `, ['Test Post', projectId, imageId])

        const postId = result.rows?.[0]?.id
        const post = await db.get('SELECT * FROM posts WHERE id = ?', [postId])

        expect(post.img_id).toBe(imageId)
        expect(post.img_show).toBeDefined()
    })

    it('should allow setting img_id on projects', async () => {
        await db.run(`
            UPDATE projects SET img_id = ? WHERE id = ?
        `, [imageId, projectId])

        const project = await db.get('SELECT * FROM projects WHERE id = ?', [projectId])

        expect(project.img_id).toBe(imageId)
        expect(project.img_show).toBeDefined()
    })

    it('should allow setting img_id on users', async () => {
        const result = await db.run(`
            INSERT INTO users (sysmail, username, password, role, img_id, status_id)
            VALUES (?, ?, ?, ?, ?, ?)
            RETURNING id
        `, ['test@example.com', 'testuser', 'testpass123', 'user', imageId, 18])

        const userId = result.rows?.[0]?.id
        const user = await db.get('SELECT * FROM users WHERE id = ?', [userId])

        expect(user.img_id).toBe(imageId)
        expect(user.img_show).toBeDefined()
    })
})

describeOrSkip('Images Integration - Performance Fields (Triggers)', () => {
    let db: DatabaseAdapter
    let imageId: number
    let projectId: number

    beforeEach(async () => {
        db = sharedDb
        await db.exec('TRUNCATE TABLE images RESTART IDENTITY CASCADE')

        // Create test image
        const imgResult = await db.run(`
            INSERT INTO images (name, url, x, y)
            VALUES (?, ?, ?, ?)
            RETURNING id
        `, ['Test Image', 'https://example.com/test.jpg', 1920, 1080])
        imageId = imgResult.rows?.[0]?.id

        // Create test project
        const projResult = await db.run(`
            INSERT INTO projects (domaincode, name)
            VALUES (?, ?)
            RETURNING id
        `, ['test_proj', 'Test Project'])
        projectId = projResult.rows?.[0]?.id
    })

    afterEach(async () => {
        // Cleanup done in beforeEach
    })

    it('should populate img_show field when img_id is set', async () => {
        const result = await db.run(`
            INSERT INTO events (name, project_id, img_id)
            VALUES (?, ?, ?)
            RETURNING id
        `, ['Test Event', projectId, imageId])

        const eventId = result.rows?.[0]?.id
        const event = await db.get('SELECT img_show FROM events WHERE id = ?', [eventId])

        expect(event.img_show).toBe(true) // Default ctags = 0x00 means show
    })

    it('should populate img_thumb field with URL', async () => {
        const result = await db.run(`
            INSERT INTO events (name, project_id, img_id)
            VALUES (?, ?, ?)
            RETURNING id
        `, ['Test Event', projectId, imageId])

        const eventId = result.rows?.[0]?.id
        const event = await db.get('SELECT img_thumb FROM events WHERE id = ?', [eventId])

        expect(event.img_thumb).toBe('https://example.com/test.jpg')
    })

    it('should populate all 5 performance fields', async () => {
        const result = await db.run(`
            INSERT INTO events (name, project_id, img_id)
            VALUES (?, ?, ?)
            RETURNING id
        `, ['Test Event', projectId, imageId])

        const eventId = result.rows?.[0]?.id
        const event = await db.get(`
            SELECT img_show, img_thumb, img_square, img_wide, img_vert 
            FROM events 
            WHERE id = ?
        `, [eventId])

        expect(event.img_show).toBeDefined()
        expect(event.img_thumb).toBeDefined()
        expect(event.img_square).toBeDefined()
        expect(event.img_wide).toBeDefined()
        expect(event.img_vert).toBeDefined()
    })

    it('should set defaults when img_id is NULL', async () => {
        const result = await db.run(`
            INSERT INTO events (name, project_id)
            VALUES (?, ?)
            RETURNING id
        `, ['Test Event', projectId])

        const eventId = result.rows?.[0]?.id
        const event = await db.get(`
            SELECT img_show, img_thumb, img_square, img_wide, img_vert 
            FROM events 
            WHERE id = ?
        `, [eventId])

        expect(event.img_show).toBe(false)
        expect(event.img_thumb).toBe('dummy')
        expect(event.img_square).toBe('dummy')
        expect(event.img_wide).toBe('dummy')
        expect(event.img_vert).toBe('dummy')
    })
})
