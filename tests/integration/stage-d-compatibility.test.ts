/**
 * Stage D Preparation: Database Compatibility Test Batch
 * 
 * Tests 4 typical db.ts usage patterns for SQLite vs PostgreSQL compatibility
 * 
 * Test Categories:
 * 1. Simple SELECT queries (.get() and .all())
 * 2. INSERT operations (.run())
 * 3. UPDATE operations with WHERE clauses
 * 4. Complex JOINs with aggregations
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createTestDatabase } from '../utils/db-test-utils'
import type { DatabaseAdapter } from '../../server/database/adapter'

describe('Stage D: Database Compatibility Tests', () => {
    let db: DatabaseAdapter

    beforeEach(async () => {
        db = await createTestDatabase()

        // Create test tables
        await db.exec(`
            CREATE TABLE IF NOT EXISTS test_tasks (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                status TEXT DEFAULT 'new',
                priority TEXT DEFAULT 'medium',
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        `)

        await db.exec(`
            CREATE TABLE IF NOT EXISTS test_releases (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                version TEXT NOT NULL,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        `)
    })

    afterEach(async () => {
        // Cleanup
        await db.exec('DROP TABLE IF EXISTS test_tasks')
        await db.exec('DROP TABLE IF EXISTS test_releases')
        if (db.close) {
            await db.close()
        }
    })

    // =========================================================================
    // PATTERN 1: Simple SELECT Queries (.get() and .all())
    // Used in: /api/releases/[id].get.ts, /api/demo/data.get.ts
    // =========================================================================
    describe('Pattern 1: Simple SELECT Queries', () => {
        it('should handle .get() for single record retrieval', async () => {
            // Insert test data
            await db.run(
                'INSERT INTO test_tasks (id, title, status) VALUES (?, ?, ?)',
                ['task-1', 'Test Task', 'new']
            )

            // Test .get() pattern
            const result = await db.get(
                'SELECT * FROM test_tasks WHERE id = ?',
                ['task-1']
            )

            expect(result).toBeDefined()
            expect(result?.id).toBe('task-1')
            expect(result?.title).toBe('Test Task')
            expect(result?.status).toBe('new')
        })

        it('should handle .all() for multiple record retrieval', async () => {
            // Insert test data
            await db.run(
                'INSERT INTO test_tasks (id, title, status) VALUES (?, ?, ?)',
                ['task-1', 'Task 1', 'new']
            )
            await db.run(
                'INSERT INTO test_tasks (id, title, status) VALUES (?, ?, ?)',
                ['task-2', 'Task 2', 'draft']
            )
            await db.run(
                'INSERT INTO test_tasks (id, title, status) VALUES (?, ?, ?)',
                ['task-3', 'Task 3', 'final']
            )

            // Test .all() pattern
            const results = await db.all('SELECT * FROM test_tasks ORDER BY id')

            expect(results).toHaveLength(3)
            expect(results[0].id).toBe('task-1')
            expect(results[1].id).toBe('task-2')
            expect(results[2].id).toBe('task-3')
        })

        it('should handle .get() returning undefined for non-existent records', async () => {
            const result = await db.get(
                'SELECT * FROM test_tasks WHERE id = ?',
                ['non-existent']
            )

            expect(result).toBeUndefined()
        })

        it('should handle .all() returning empty array', async () => {
            const results = await db.all('SELECT * FROM test_tasks WHERE status = ?', ['completed'])

            expect(results).toEqual([])
        })
    })

    // =========================================================================
    // PATTERN 2: INSERT Operations (.run())
    // Used in: /api/versions/index.post.ts, /api/tasks/[id].put.ts
    // =========================================================================
    describe('Pattern 2: INSERT Operations', () => {
        it('should handle single INSERT with .run()', async () => {
            const result = await db.run(
                'INSERT INTO test_tasks (id, title, status, priority) VALUES (?, ?, ?, ?)',
                ['task-insert-1', 'New Task', 'new', 'high']
            )

            expect(result.changes).toBe(1)

            // Verify insert
            const inserted = await db.get(
                'SELECT * FROM test_tasks WHERE id = ?',
                ['task-insert-1']
            )
            expect(inserted?.title).toBe('New Task')
            expect(inserted?.priority).toBe('high')
        })

        it('should handle INSERT with DEFAULT values', async () => {
            const result = await db.run(
                'INSERT INTO test_tasks (id, title) VALUES (?, ?)',
                ['task-default', 'Task with Defaults']
            )

            expect(result.changes).toBe(1)

            // Verify defaults were applied
            const inserted = await db.get(
                'SELECT * FROM test_tasks WHERE id = ?',
                ['task-default']
            )
            expect(inserted?.status).toBe('new')
            expect(inserted?.priority).toBe('medium')
            expect(inserted?.created_at).toBeDefined()
        })

        it('should handle INSERT with NULL values', async () => {
            await db.exec(`
                CREATE TABLE IF NOT EXISTS test_nullable (
                    id TEXT PRIMARY KEY,
                    name TEXT,
                    optional_field TEXT
                )
            `)

            const result = await db.run(
                'INSERT INTO test_nullable (id, name, optional_field) VALUES (?, ?, ?)',
                ['null-test', 'Test', null]
            )

            expect(result.changes).toBe(1)

            const inserted = await db.get(
                'SELECT * FROM test_nullable WHERE id = ?',
                ['null-test']
            )
            expect(inserted?.optional_field).toBeNull()

            await db.exec('DROP TABLE IF EXISTS test_nullable')
        })

        it('should handle multiple sequential INSERTs', async () => {
            for (let i = 1; i <= 5; i++) {
                await db.run(
                    'INSERT INTO test_tasks (id, title) VALUES (?, ?)',
                    [`bulk-${i}`, `Bulk Task ${i}`]
                )
            }

            const count = await db.get('SELECT COUNT(*) as count FROM test_tasks')
            expect(count?.count).toBe(5)
        })
    })

    // =========================================================================
    // PATTERN 3: UPDATE Operations with WHERE Clauses
    // Used in: /api/tasks/[id].put.ts, /api/versions/index.post.ts
    // =========================================================================
    describe('Pattern 3: UPDATE Operations', () => {
        beforeEach(async () => {
            // Insert test data
            await db.run(
                'INSERT INTO test_tasks (id, title, status, priority) VALUES (?, ?, ?, ?)',
                ['update-1', 'Task to Update', 'new', 'low']
            )
            await db.run(
                'INSERT INTO test_tasks (id, title, status, priority) VALUES (?, ?, ?, ?)',
                ['update-2', 'Another Task', 'draft', 'medium']
            )
        })

        it('should handle single field UPDATE', async () => {
            const result = await db.run(
                'UPDATE test_tasks SET status = ? WHERE id = ?',
                ['final', 'update-1']
            )

            expect(result.changes).toBe(1)

            const updated = await db.get(
                'SELECT * FROM test_tasks WHERE id = ?',
                ['update-1']
            )
            expect(updated?.status).toBe('final')
            expect(updated?.title).toBe('Task to Update') // Other fields unchanged
        })

        it('should handle multiple field UPDATE', async () => {
            const result = await db.run(
                'UPDATE test_tasks SET status = ?, priority = ? WHERE id = ?',
                ['final', 'urgent', 'update-1']
            )

            expect(result.changes).toBe(1)

            const updated = await db.get(
                'SELECT * FROM test_tasks WHERE id = ?',
                ['update-1']
            )
            expect(updated?.status).toBe('final')
            expect(updated?.priority).toBe('urgent')
        })

        it('should handle UPDATE with no matching WHERE clause', async () => {
            const result = await db.run(
                'UPDATE test_tasks SET status = ? WHERE id = ?',
                ['completed', 'non-existent']
            )

            expect(result.changes).toBe(0)
        })

        it('should handle bulk UPDATE (multiple rows)', async () => {
            // Insert more test data
            await db.run(
                'INSERT INTO test_tasks (id, title, status) VALUES (?, ?, ?)',
                ['bulk-update-1', 'Bulk 1', 'new']
            )
            await db.run(
                'INSERT INTO test_tasks (id, title, status) VALUES (?, ?, ?)',
                ['bulk-update-2', 'Bulk 2', 'new']
            )

            // Update all with status 'new'
            const result = await db.run(
                'UPDATE test_tasks SET priority = ? WHERE status = ?',
                ['high', 'new']
            )

            expect(result.changes).toBeGreaterThanOrEqual(2)

            // Verify updates
            const updated = await db.all(
                'SELECT * FROM test_tasks WHERE status = ?',
                ['new']
            )
            updated.forEach(task => {
                expect(task.priority).toBe('high')
            })
        })
    })

    // =========================================================================
    // PATTERN 4: Complex JOINs with Aggregations
    // Used in: /api/releases/[id].get.ts (with COUNT)
    // =========================================================================
    describe('Pattern 4: Complex JOINs and Aggregations', () => {
        beforeEach(async () => {
            // Insert release data
            await db.run(
                'INSERT INTO test_releases (id, name, version) VALUES (?, ?, ?)',
                ['release-1', 'Release 1.0', '1.0.0']
            )
            await db.run(
                'INSERT INTO test_releases (id, name, version) VALUES (?, ?, ?)',
                ['release-2', 'Release 2.0', '2.0.0']
            )

            // Insert tasks linked to releases
            await db.run(
                'INSERT INTO test_tasks (id, title, status) VALUES (?, ?, ?)',
                ['task-r1-1', 'Task for R1', 'new']
            )
            await db.run(
                'INSERT INTO test_tasks (id, title, status) VALUES (?, ?, ?)',
                ['task-r1-2', 'Task for R1', 'draft']
            )
            await db.run(
                'INSERT INTO test_tasks (id, title, status) VALUES (?, ?, ?)',
                ['task-r2-1', 'Task for R2', 'new']
            )

            // Add release_id column for this test
            await db.exec('ALTER TABLE test_tasks ADD COLUMN release_id TEXT')
            await db.run('UPDATE test_tasks SET release_id = ? WHERE id LIKE ?', ['release-1', 'task-r1%'])
            await db.run('UPDATE test_tasks SET release_id = ? WHERE id LIKE ?', ['release-2', 'task-r2%'])
        })

        it('should handle LEFT JOIN with COUNT aggregation', async () => {
            const result = await db.get(`
                SELECT 
                    test_releases.*,
                    COUNT(test_tasks.id) as task_count
                FROM test_releases
                LEFT JOIN test_tasks ON test_tasks.release_id = test_releases.id
                WHERE test_releases.id = ?
                GROUP BY test_releases.id
            `, ['release-1'])

            expect(result).toBeDefined()
            expect(result?.id).toBe('release-1')
            expect(result?.name).toBe('Release 1.0')
            expect(result?.task_count).toBe(2)
        })

        it('should handle JOIN returning zero count', async () => {
            // Create release with no tasks
            await db.run(
                'INSERT INTO test_releases (id, name, version) VALUES (?, ?, ?)',
                ['release-empty', 'Empty Release', '3.0.0']
            )

            const result = await db.get(`
                SELECT 
                    test_releases.*,
                    COUNT(test_tasks.id) as task_count
                FROM test_releases
                LEFT JOIN test_tasks ON test_tasks.release_id = test_releases.id
                WHERE test_releases.id = ?
                GROUP BY test_releases.id
            `, ['release-empty'])

            expect(result).toBeDefined()
            expect(result?.task_count).toBe(0)
        })

        it('should handle multiple aggregations', async () => {
            const results = await db.all(`
                SELECT 
                    status,
                    COUNT(*) as count,
                    COUNT(DISTINCT release_id) as release_count
                FROM test_tasks
                WHERE release_id IS NOT NULL
                GROUP BY status
                ORDER BY status
            `)

            expect(results.length).toBeGreaterThan(0)
            results.forEach(row => {
                expect(row.count).toBeGreaterThan(0)
                expect(row.status).toBeDefined()
            })
        })

        it('should handle complex JOIN with filtering', async () => {
            const results = await db.all(`
                SELECT 
                    test_releases.name as release_name,
                    test_releases.version,
                    test_tasks.title,
                    test_tasks.status
                FROM test_releases
                INNER JOIN test_tasks ON test_tasks.release_id = test_releases.id
                WHERE test_tasks.status = ?
                ORDER BY test_releases.version
            `, ['new'])

            expect(results.length).toBeGreaterThan(0)
            results.forEach(row => {
                expect(row.status).toBe('new')
                expect(row.release_name).toBeDefined()
                expect(row.title).toBeDefined()
            })
        })
    })

    // =========================================================================
    // BONUS: Transaction Support (if needed)
    // =========================================================================
    describe('Bonus: Transaction Support', () => {
        it('should support basic transaction-like behavior', async () => {
            // Add release_id column to test_tasks for this test
            try {
                await db.exec('ALTER TABLE test_tasks ADD COLUMN release_id_trans TEXT')
            } catch (e) {
                // Column might already exist, ignore error
            }

            // Insert multiple related records
            await db.run(
                'INSERT INTO test_releases (id, name, version) VALUES (?, ?, ?)',
                ['trans-release', 'Transactional Release', '1.0.0']
            )

            for (let i = 1; i <= 3; i++) {
                await db.run(
                    'INSERT INTO test_tasks (id, title, status, release_id_trans) VALUES (?, ?, ?, ?)',
                    [`trans-task-${i}`, `Trans Task ${i}`, 'new', 'trans-release']
                )
            }

            // Verify all were inserted
            const release = await db.get(
                'SELECT * FROM test_releases WHERE id = ?',
                ['trans-release']
            )
            const tasks = await db.all(
                'SELECT * FROM test_tasks WHERE release_id_trans = ?',
                ['trans-release']
            )

            expect(release).toBeDefined()
            expect(tasks).toHaveLength(3)
        })
    })
})
