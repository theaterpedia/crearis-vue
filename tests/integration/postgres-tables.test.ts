/**
 * PostgreSQL Table Creation Test
 * 
 * Tests that tables are properly created in PostgreSQL when the application starts
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { PostgreSQLAdapter } from '../../server/database/adapters/postgresql'
import { initDatabase } from '../../server/database/db-new'

const testConnectionString = process.env.TEST_DATABASE_URL ||
    'postgresql://crearis_admin:7uqf9nE0umJmMMo@localhost:5432/demo_data_test'

describe('PostgreSQL Table Creation', () => {
    let db: PostgreSQLAdapter

    beforeAll(async () => {
        console.log('\n🧪 PostgreSQL Table Creation Test')
        console.log('==================================')
        console.log(`Connection: ${testConnectionString.replace(/:[^:@]+@/, ':***@')}`)

        db = new PostgreSQLAdapter(testConnectionString)

        // Drop all tables to start fresh
        console.log('\n🗑️  Cleaning up existing tables...')
        await db.exec('DROP TABLE IF EXISTS hero_overrides CASCADE')
        await db.exec('DROP TABLE IF EXISTS participants CASCADE')
        await db.exec('DROP TABLE IF EXISTS instructors CASCADE')
        await db.exec('DROP TABLE IF EXISTS locations CASCADE')
        await db.exec('DROP TABLE IF EXISTS posts CASCADE')
        await db.exec('DROP TABLE IF EXISTS events CASCADE')
        await db.exec('DROP TABLE IF EXISTS tasks CASCADE')
        await db.exec('DROP TABLE IF EXISTS releases CASCADE')
        await db.exec('DROP TABLE IF EXISTS projects CASCADE')
        await db.exec('DROP TABLE IF EXISTS versions CASCADE')

        console.log('✅ Cleanup complete')
    })

    afterAll(async () => {
        if (db && db.close) {
            await db.close()
        }
    })

    it('should create all tables via initDatabase()', async () => {
        console.log('\n📊 Creating tables via initDatabase()...')

        // Call initDatabase which should create all tables
        await initDatabase()

        console.log('✅ initDatabase() completed')

        // Verify tables exist by querying PostgreSQL catalog
        const tables = await db.all(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `) as Array<{ table_name: string }>

        const tableNames = tables.map(t => t.table_name)

        console.log('\n📋 Tables created:')
        tableNames.forEach(name => console.log(`  - ${name}`))

        // Check expected tables exist
        expect(tableNames).toContain('events')
        expect(tableNames).toContain('posts')
        expect(tableNames).toContain('locations')
        expect(tableNames).toContain('instructors')
        expect(tableNames).toContain('participants')
        expect(tableNames).toContain('hero_overrides')
        expect(tableNames).toContain('tasks')
        expect(tableNames).toContain('releases')
        expect(tableNames).toContain('projects')
        expect(tableNames).toContain('versions')

        console.log(`\n✅ All ${tableNames.length} expected tables exist`)
    })

    it('should have proper column structure for events table', async () => {
        console.log('\n🔍 Checking events table structure...')

        const columns = await db.all(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'events'
      ORDER BY ordinal_position
    `) as Array<{ column_name: string; data_type: string; is_nullable: string; column_default: string | null }>

        const columnNames = columns.map(c => c.column_name)

        console.log('\n📋 Events table columns:')
        columns.forEach(col => {
            console.log(`  - ${col.column_name}: ${col.data_type}${col.is_nullable === 'NO' ? ' NOT NULL' : ''}`)
        })

        // Check required columns
        expect(columnNames).toContain('id')
        expect(columnNames).toContain('name')
        expect(columnNames).toContain('date_begin')
        expect(columnNames).toContain('date_end')
        expect(columnNames).toContain('address_id')
        expect(columnNames).toContain('seats_max')
        expect(columnNames).toContain('cimg')
        expect(columnNames).toContain('created_at')
        expect(columnNames).toContain('updated_at')
        expect(columnNames).toContain('status')

        // Check primary key exists
        const pkCheck = columns.find(c => c.column_name === 'id')
        expect(pkCheck).toBeDefined()
        expect(pkCheck?.is_nullable).toBe('NO')

        console.log(`\n✅ Events table has ${columns.length} columns with proper structure`)
    })

    it('should allow inserting and querying events', async () => {
        console.log('\n📝 Testing event insertion...')

        // Insert test event
        await db.run(`
      INSERT INTO events (id, name, date_begin, date_end, seats_max, cimg, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
            'test_event_001',
            'Test Event',
            '2025-12-01 10:00:00',
            '2025-12-01 18:00:00',
            50,
            'https://example.com/image.jpg',
            'active'
        ])

        console.log('✅ Event inserted')

        // Query event back
        const event = await db.get(`
      SELECT * FROM events WHERE id = ?
    `, ['test_event_001'])

        expect(event).toBeDefined()
        expect(event.id).toBe('test_event_001')
        expect(event.name).toBe('Test Event')
        expect(event.seats_max).toBe(50)

        console.log('✅ Event retrieved:', event.name)

        // Count events
        const countResult = await db.get(`
      SELECT COUNT(*) as count FROM events
    `)

        expect(countResult.count).toBe(1)

        console.log(`✅ Event count: ${countResult.count}`)
    })

    it('should handle UPSERT operations (INSERT ... ON CONFLICT)', async () => {
        console.log('\n🔄 Testing UPSERT operations...')

        // Initial insert
        await db.run(`
      INSERT INTO events (id, name, seats_max, status)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        seats_max = excluded.seats_max
    `, ['upsert_test', 'Original Name', 100, 'active'])

        let event = await db.get('SELECT * FROM events WHERE id = ?', ['upsert_test'])
        expect(event.name).toBe('Original Name')
        expect(event.seats_max).toBe(100)

        console.log('✅ Initial insert: Original Name, seats: 100')

        // Upsert (should update)
        await db.run(`
      INSERT INTO events (id, name, seats_max, status)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        seats_max = excluded.seats_max
    `, ['upsert_test', 'Updated Name', 200, 'active'])

        event = await db.get('SELECT * FROM events WHERE id = ?', ['upsert_test'])
        expect(event.name).toBe('Updated Name')
        expect(event.seats_max).toBe(200)

        console.log('✅ After upsert: Updated Name, seats: 200')
    })

    it('should properly handle NULL values and defaults', async () => {
        console.log('\n🔍 Testing NULL values and defaults...')

        // Insert with minimal data
        await db.run(`
      INSERT INTO events (id, name, status)
      VALUES (?, ?, ?)
    `, ['minimal_event', 'Minimal Event', 'active'])

        const event = await db.get('SELECT * FROM events WHERE id = ?', ['minimal_event'])

        // Check nullable fields are null
        expect(event.date_begin).toBeNull()
        expect(event.date_end).toBeNull()
        expect(event.cimg).toBeNull()

        // Check default values
        expect(event.status).toBe('active')
        expect(event.created_at).toBeDefined()

        console.log('✅ NULL values handled correctly')
        console.log(`✅ Default timestamp: ${event.created_at}`)
    })
})
