/**
 * Sample Integration Tests - Database Adapter
 * 
 * Tests for both SQLite and PostgreSQL adapters.
 * Tagged with @pgintegration for PostgreSQL-specific tests.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
    createTestDatabase,
    cleanupTestDatabase,
    resetTestDatabase,
    insertTestEvent,
    insertTestTask,
    countRows,
    assertTableEmpty,
    assertTableRowCount
} from '../utils/db-test-utils.js'
import type { DatabaseAdapter } from '../../server/database/adapter.js'
import { isPostgreSQLTest } from '../../server/database/test-config.js'

describe('Database Adapter - Basic Operations', () => {
    let db: DatabaseAdapter

    beforeEach(async () => {
        db = await createTestDatabase()
    })

    afterEach(async () => {
        await cleanupTestDatabase(db)
    })

    it('should initialize database with schema', async () => {
        // Verify tables exist by counting rows (should be 0)
        await assertTableEmpty(db, 'events')
        await assertTableEmpty(db, 'tasks')
        await assertTableEmpty(db, 'versions')
    })

    it('should insert and retrieve a record', async () => {
        // Insert test event
        const event = await insertTestEvent(db, {
            name: 'Test Event',
            status: 'active'
        })

        // Retrieve event
        const retrieved = await db.get('SELECT * FROM events WHERE id = ?', [event.id])

        expect(retrieved).toBeDefined()
        expect(retrieved.id).toBe(event.id)
        expect(retrieved.name).toBe('Test Event')
        expect(retrieved.status).toBe('active')
    })

    it('should update a record', async () => {
        // Insert test event
        const event = await insertTestEvent(db, { name: 'Original Name' })

        // Update event
        await db.run('UPDATE events SET name = ? WHERE id = ?', ['Updated Name', event.id])

        // Verify update
        const updated = await db.get('SELECT * FROM events WHERE id = ?', [event.id])
        expect(updated.name).toBe('Updated Name')
    })

    it('should delete a record', async () => {
        // Insert test event
        const event = await insertTestEvent(db)

        // Verify it exists
        await assertTableRowCount(db, 'events', 1)

        // Delete event
        await db.run('DELETE FROM events WHERE id = ?', [event.id])

        // Verify deletion
        await assertTableEmpty(db, 'events')
    })

    it('should handle multiple inserts', async () => {
        // Insert multiple events
        await insertTestEvent(db, { name: 'Event 1' })
        await insertTestEvent(db, { name: 'Event 2' })
        await insertTestEvent(db, { name: 'Event 3' })

        // Verify count
        await assertTableRowCount(db, 'events', 3)

        // Retrieve all
        const events = await db.all('SELECT * FROM events ORDER BY name')
        expect(events).toHaveLength(3)
        expect(events[0].name).toBe('Event 1')
        expect(events[1].name).toBe('Event 2')
        expect(events[2].name).toBe('Event 3')
    })

    it('should filter records with WHERE clause', async () => {
        // Insert events with different statuses
        await insertTestEvent(db, { name: 'Active 1', status: 'active' })
        await insertTestEvent(db, { name: 'Draft 1', status: 'draft' })
        await insertTestEvent(db, { name: 'Active 2', status: 'active' })

        // Query active events only
        const activeEvents = await db.all('SELECT * FROM events WHERE status = ?', ['active'])

        expect(activeEvents).toHaveLength(2)
        expect(activeEvents.every(e => e.status === 'active')).toBe(true)
    })
})

describe('Database Adapter - Prepared Statements @pgintegration', () => {
    let db: DatabaseAdapter

    beforeEach(async () => {
        db = await createTestDatabase()
    })

    afterEach(async () => {
        await cleanupTestDatabase(db)
    })

    it('should use prepared statements for queries', async () => {
        // Insert test data
        await insertTestEvent(db, { name: 'Event 1', status: 'active' })
        await insertTestEvent(db, { name: 'Event 2', status: 'draft' })

        // Use prepared statement
        const stmt = await db.prepare('SELECT * FROM events WHERE status = ?')

        // Execute with different parameters
        const activeEvents = await stmt.all(['active'])
        const draftEvents = await stmt.all(['draft'])

        expect(activeEvents).toHaveLength(1)
        expect(activeEvents[0].name).toBe('Event 1')

        expect(draftEvents).toHaveLength(1)
        expect(draftEvents[0].name).toBe('Event 2')
    })

    it('should handle parameter replacement correctly', async () => {
        // Insert test tasks
        await insertTestTask(db, { title: 'Task 1', status: 'open', category: 'bug' })
        await insertTestTask(db, { title: 'Task 2', status: 'closed', category: 'feature' })
        await insertTestTask(db, { title: 'Task 3', status: 'open', category: 'feature' })

        // Query with multiple parameters
        const openFeatures = await db.all(
            'SELECT * FROM tasks WHERE status = ? AND category = ?',
            ['open', 'feature']
        )

        expect(openFeatures).toHaveLength(1)
        expect(openFeatures[0].title).toBe('Task 3')
    })
})

describe('Database Adapter - Transactions @pgintegration', () => {
    let db: DatabaseAdapter

    beforeEach(async () => {
        db = await createTestDatabase()
    })

    afterEach(async () => {
        await cleanupTestDatabase(db)
    })

    it('should commit transaction on success', async () => {
        await db.transaction(async () => {
            await db.run('INSERT INTO events (id, name, status) VALUES (?, ?, ?)', ['e1', 'Event 1', 'active'])
            await db.run('INSERT INTO events (id, name, status) VALUES (?, ?, ?)', ['e2', 'Event 2', 'active'])
        })

        // Verify both inserts succeeded
        await assertTableRowCount(db, 'events', 2)
    })

    it('should rollback transaction on error', async () => {
        try {
            await db.transaction(async () => {
                await db.run('INSERT INTO events (id, name, status) VALUES (?, ?, ?)', ['e1', 'Event 1', 'active'])

                // This should fail (duplicate ID)
                await db.run('INSERT INTO events (id, name, status) VALUES (?, ?, ?)', ['e1', 'Event 1', 'active'])
            })

            // Should not reach here
            expect.fail('Transaction should have failed')
        } catch (error) {
            // Transaction should have rolled back
            await assertTableEmpty(db, 'events')
        }
    })
})

describe('Database Adapter - PostgreSQL Specific @pgintegration', () => {
    let db: DatabaseAdapter

    beforeEach(async () => {
        if (!isPostgreSQLTest()) {
            console.log('Skipping PostgreSQL-specific test')
            return
        }
        db = await createTestDatabase()
    })

    afterEach(async () => {
        if (db) {
            await cleanupTestDatabase(db)
        }
    })

    it('should handle PostgreSQL timestamp functions', { skip: !isPostgreSQLTest() }, async () => {
        // Insert event with PostgreSQL NOW()
        await db.run(
            'INSERT INTO events (id, name, status) VALUES (?, ?, ?)',
            ['e1', 'Event 1', 'active']
        )

        const event = await db.get('SELECT *, created_at, updated_at FROM events WHERE id = ?', ['e1'])

        expect(event.created_at).toBeDefined()
        expect(event.updated_at).toBeDefined()

        // Timestamps should be ISO strings or Date objects
        if (typeof event.created_at === 'string') {
            expect(new Date(event.created_at).getTime()).toBeGreaterThan(0)
        }
    })

    it('should handle concurrent connections', { skip: !isPostgreSQLTest() }, async () => {
        // Insert multiple records concurrently
        await Promise.all([
            insertTestEvent(db, { name: 'Event 1' }),
            insertTestEvent(db, { name: 'Event 2' }),
            insertTestEvent(db, { name: 'Event 3' }),
            insertTestTask(db, { title: 'Task 1' }),
            insertTestTask(db, { title: 'Task 2' })
        ])

        // Verify all inserts succeeded
        await assertTableRowCount(db, 'events', 3)
        await assertTableRowCount(db, 'tasks', 2)
    })
})
