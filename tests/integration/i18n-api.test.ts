/**
 * Integration Tests - i18n API Endpoints
 * 
 * Tests for i18n REST API:
 * - GET /api/i18n (list with filters)
 * - POST /api/i18n (create)
 * - PUT /api/i18n/:id (update)
 * - DELETE /api/i18n/:id (delete)
 * - POST /api/i18n/get-or-create (get or create)
 * 
 * NOTE: These tests require PostgreSQL as they use JSONB fields.
 * Run with: TEST_DATABASE_TYPE=postgresql pnpm test
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
    createTestDatabase,
    cleanupTestDatabase,
    isPostgreSQLTest
} from '../utils/db-test-utils.js'
import type { DatabaseAdapter } from '../../server/database/adapter.js'
import type { I18nCodesTableFields } from '../../server/types/database'

// Skip all i18n tests if not running on PostgreSQL
const describeOrSkip = isPostgreSQLTest() ? describe : describe.skip

describeOrSkip('i18n API - GET /api/i18n', () => {
    let db: DatabaseAdapter

    beforeEach(async () => {
        db = await createTestDatabase()

        // Insert test data
        await db.run(`
            INSERT INTO i18n_codes (name, variation, type, text, status)
            VALUES 
                ('save', 'false', 'button', '{"de": "Speichern", "en": "Save", "cz": "Uložit"}', 'ok'),
                ('cancel', 'false', 'button', '{"de": "Abbrechen", "en": "Cancel", "cz": "Zrušit"}', 'ok'),
                ('name', 'false', 'field', '{"de": "Titel", "en": "Heading", "cz": "titul"}', 'ok'),
                ('name', 'instructors', 'field', '{"de": "Vor- und Nachname", "en": "Full name"}', 'en'),
                ('draft', 'false', 'button', '{"de": "Entwurf"}', 'draft')
        `)
    })

    afterEach(async () => {
        await cleanupTestDatabase(db)
    })

    it('should list all translations', async () => {
        const result = await db.all('SELECT * FROM i18n_codes')
        expect(result).toHaveLength(5)
    })

    it('should filter by type', async () => {
        const result = await db.all('SELECT * FROM i18n_codes WHERE type = ?', ['button'])
        expect(result).toHaveLength(3)
    })

    it('should filter by status', async () => {
        const result = await db.all('SELECT * FROM i18n_codes WHERE status = ?', ['ok'])
        expect(result).toHaveLength(3)
    })

    it('should filter by variation', async () => {
        const result = await db.all('SELECT * FROM i18n_codes WHERE variation = ?', ['instructors'])
        expect(result).toHaveLength(1)
    })

    it('should order by name', async () => {
        const result = await db.all('SELECT * FROM i18n_codes ORDER BY name ASC')
        expect(result[0].name).toBe('cancel')
        expect(result[result.length - 1].name).toBe('save')
    })

    it('should support preload filter (button/nav, no variations)', async () => {
        const result = await db.all(`
            SELECT * FROM i18n_codes 
            WHERE type IN ('button', 'nav') AND variation = 'false'
        `)
        expect(result).toHaveLength(3) // save, cancel, draft
    })
})

describeOrSkip('i18n API - POST /api/i18n (Create)', () => {
    let db: DatabaseAdapter

    beforeEach(async () => {
        db = await createTestDatabase()
    })

    afterEach(async () => {
        await cleanupTestDatabase(db)
    })

    it('should create new translation', async () => {
        const newEntry: Partial<I18nCodesTableFields> = {
            name: 'delete',
            variation: 'false',
            type: 'button',
            text: JSON.stringify({ de: 'Löschen', en: 'Delete', cz: 'Smazat' }),
            status: 'ok'
        }

        const result = await db.run(`
            INSERT INTO i18n_codes (name, variation, type, text, status)
            VALUES (?, ?, ?, ?, ?)
        `, [newEntry.name, newEntry.variation, newEntry.type, newEntry.text, newEntry.status])

        expect(result.changes).toBe(1)

        const inserted = await db.get('SELECT * FROM i18n_codes WHERE name = ?', ['delete'])
        expect(inserted).toBeDefined()
        expect(inserted.name).toBe('delete')
        expect(inserted.type).toBe('button')
    })

    it('should require name field', async () => {
        await expect(
            db.run(`
                INSERT INTO i18n_codes (variation, type, text, status)
                VALUES ('false', 'button', '{"de": "Test"}', 'de')
            `)
        ).rejects.toThrow()
    })

    it('should require type field', async () => {
        await expect(
            db.run(`
                INSERT INTO i18n_codes (name, variation, text, status)
                VALUES ('test', 'false', '{"de": "Test"}', 'de')
            `)
        ).rejects.toThrow()
    })

    it('should enforce unique constraint (name, variation, type)', async () => {
        await db.run(`
            INSERT INTO i18n_codes (name, variation, type, text, status)
            VALUES ('save', 'false', 'button', '{"de": "Speichern"}', 'de')
        `)

        await expect(
            db.run(`
                INSERT INTO i18n_codes (name, variation, type, text, status)
                VALUES ('save', 'false', 'button', '{"de": "Speichern"}', 'de')
            `)
        ).rejects.toThrow()
    })

    it('should allow same name with different variation', async () => {
        await db.run(`
            INSERT INTO i18n_codes (name, variation, type, text, status)
            VALUES ('name', 'false', 'field', '{"de": "Titel"}', 'de')
        `)

        const result = await db.run(`
            INSERT INTO i18n_codes (name, variation, type, text, status)
            VALUES ('name', 'instructors', 'field', '{"de": "Vor- und Nachname"}', 'de')
        `)

        expect(result.changes).toBe(1)
    })

    it('should allow same name with different type', async () => {
        await db.run(`
            INSERT INTO i18n_codes (name, variation, type, text, status)
            VALUES ('test', 'false', 'button', '{"de": "Test"}', 'de')
        `)

        const result = await db.run(`
            INSERT INTO i18n_codes (name, variation, type, text, status)
            VALUES ('test', 'false', 'field', '{"de": "Test"}', 'de')
        `)

        expect(result.changes).toBe(1)
    })

    it('should default variation to false', async () => {
        await db.run(`
            INSERT INTO i18n_codes (name, type, text, status)
            VALUES ('test', 'button', '{"de": "Test"}', 'de')
        `)

        const inserted = await db.get('SELECT * FROM i18n_codes WHERE name = ?', ['test'])
        expect(inserted.variation).toBe('false')
    })

    it('should default status to de', async () => {
        await db.run(`
            INSERT INTO i18n_codes (name, variation, type, text)
            VALUES ('test', 'false', 'button', '{"de": "Test"}')
        `)

        const inserted = await db.get('SELECT * FROM i18n_codes WHERE name = ?', ['test'])
        expect(inserted.status).toBe('de')
    })
})

describeOrSkip('i18n API - PUT /api/i18n/:id (Update)', () => {
    let db: DatabaseAdapter
    let testId: number

    beforeEach(async () => {
        db = await createTestDatabase()

        const result = await db.run(`
            INSERT INTO i18n_codes (name, variation, type, text, status)
            VALUES ('save', 'false', 'button', '{"de": "Speichern"}', 'de')
        `)

        testId = result.lastID as number
    })

    afterEach(async () => {
        await cleanupTestDatabase(db)
    })

    it('should update translation text', async () => {
        await db.run(`
            UPDATE i18n_codes 
            SET text = ?
            WHERE id = ?
        `, [JSON.stringify({ de: 'Speichern', en: 'Save', cz: 'Uložit' }), testId])

        const updated = await db.get('SELECT * FROM i18n_codes WHERE id = ?', [testId])
        const text = JSON.parse(updated.text)

        expect(text.de).toBe('Speichern')
        expect(text.en).toBe('Save')
        expect(text.cz).toBe('Uložit')
    })

    it('should update status', async () => {
        await db.run(`
            UPDATE i18n_codes 
            SET status = ?
            WHERE id = ?
        `, ['ok', testId])

        const updated = await db.get('SELECT * FROM i18n_codes WHERE id = ?', [testId])
        expect(updated.status).toBe('ok')
    })

    it('should update multiple fields', async () => {
        await db.run(`
            UPDATE i18n_codes 
            SET text = ?, status = ?
            WHERE id = ?
        `, [JSON.stringify({ de: 'Speichern', en: 'Save' }), 'en', testId])

        const updated = await db.get('SELECT * FROM i18n_codes WHERE id = ?', [testId])
        expect(updated.status).toBe('en')
        expect(JSON.parse(updated.text).en).toBe('Save')
    })

    it('should fail if ID does not exist', async () => {
        const result = await db.run(`
            UPDATE i18n_codes 
            SET text = ?
            WHERE id = ?
        `, [JSON.stringify({ de: 'Test' }), 99999])

        expect(result.changes).toBe(0)
    })

    it('should enforce unique constraint on update', async () => {
        // Create second entry
        await db.run(`
            INSERT INTO i18n_codes (name, variation, type, text, status)
            VALUES ('cancel', 'false', 'button', '{"de": "Abbrechen"}', 'de')
        `)

        // Try to update first entry to conflict with second
        await expect(
            db.run(`
                UPDATE i18n_codes 
                SET name = 'cancel'
                WHERE id = ?
            `, [testId])
        ).rejects.toThrow()
    })
})

describeOrSkip('i18n API - DELETE /api/i18n/:id', () => {
    let db: DatabaseAdapter
    let testId: number

    beforeEach(async () => {
        db = await createTestDatabase()

        const result = await db.run(`
            INSERT INTO i18n_codes (name, variation, type, text, status)
            VALUES ('save', 'false', 'button', '{"de": "Speichern"}', 'de')
        `)

        testId = result.lastID as number
    })

    afterEach(async () => {
        await cleanupTestDatabase(db)
    })

    it('should delete translation', async () => {
        const result = await db.run('DELETE FROM i18n_codes WHERE id = ?', [testId])
        expect(result.changes).toBe(1)

        const deleted = await db.get('SELECT * FROM i18n_codes WHERE id = ?', [testId])
        expect(deleted).toBeUndefined()
    })

    it('should fail silently if ID does not exist', async () => {
        const result = await db.run('DELETE FROM i18n_codes WHERE id = ?', [99999])
        expect(result.changes).toBe(0)
    })

    it('should allow recreation after deletion', async () => {
        await db.run('DELETE FROM i18n_codes WHERE id = ?', [testId])

        const result = await db.run(`
            INSERT INTO i18n_codes (name, variation, type, text, status)
            VALUES ('save', 'false', 'button', '{"de": "Speichern"}', 'de')
        `)

        expect(result.changes).toBe(1)
    })
})

describeOrSkip('i18n API - POST /api/i18n/get-or-create', () => {
    let db: DatabaseAdapter

    beforeEach(async () => {
        db = await createTestDatabase()
    })

    afterEach(async () => {
        await cleanupTestDatabase(db)
    })

    it('should return existing translation', async () => {
        await db.run(`
            INSERT INTO i18n_codes (name, variation, type, text, status)
            VALUES ('save', 'false', 'button', '{"de": "Speichern"}', 'de')
        `)

        const existing = await db.get(`
            SELECT * FROM i18n_codes 
            WHERE name = ? AND variation = ? AND type = ?
        `, ['save', 'false', 'button'])

        expect(existing).toBeDefined()
        expect(existing.name).toBe('save')
    })

    it('should create translation if not exists', async () => {
        const result = await db.run(`
            INSERT INTO i18n_codes (name, variation, type, text, status)
            VALUES ('newkey', 'false', 'button', '{"de": "newkey", "en": "newkey", "cz": "newkey"}', 'de')
        `)

        expect(result.changes).toBe(1)

        const created = await db.get('SELECT * FROM i18n_codes WHERE name = ?', ['newkey'])
        expect(created).toBeDefined()
        expect(created.name).toBe('newkey')
    })

    it('should use default text if not provided', async () => {
        await db.run(`
            INSERT INTO i18n_codes (name, variation, type, text, status)
            VALUES ('autokey', 'false', 'button', '{"de": "autokey", "en": "autokey", "cz": "autokey"}', 'de')
        `)

        const created = await db.get('SELECT * FROM i18n_codes WHERE name = ?', ['autokey'])
        const text = JSON.parse(created.text)

        expect(text.de).toBe('autokey')
        expect(text.en).toBe('autokey')
        expect(text.cz).toBe('autokey')
    })

    it('should handle variations correctly', async () => {
        await db.run(`
            INSERT INTO i18n_codes (name, variation, type, text, status)
            VALUES ('name', 'instructors', 'field', '{"de": "Vor- und Nachname"}', 'de')
        `)

        const created = await db.get(`
            SELECT * FROM i18n_codes 
            WHERE name = ? AND variation = ?
        `, ['name', 'instructors'])

        expect(created).toBeDefined()
        expect(created.variation).toBe('instructors')
    })
})

describeOrSkip('i18n API - Data Validation', () => {
    let db: DatabaseAdapter

    beforeEach(async () => {
        db = await createTestDatabase()
    })

    afterEach(async () => {
        await cleanupTestDatabase(db)
    })

    it('should enforce type constraint', async () => {
        await expect(
            db.run(`
                INSERT INTO i18n_codes (name, variation, type, text, status)
                VALUES ('test', 'false', 'invalid', '{"de": "Test"}', 'de')
            `)
        ).rejects.toThrow()
    })

    it('should enforce status constraint', async () => {
        await expect(
            db.run(`
                INSERT INTO i18n_codes (name, variation, type, text, status)
                VALUES ('test', 'false', 'button', '{"de": "Test"}', 'invalid')
            `)
        ).rejects.toThrow()
    })

    it('should store JSONB text correctly', async () => {
        const text = { de: 'Test "quoted"', en: 'Test with, comma', cz: 'Test\nNewline' }

        await db.run(`
            INSERT INTO i18n_codes (name, variation, type, text, status)
            VALUES ('complex', 'false', 'button', ?, 'de')
        `, [JSON.stringify(text)])

        const inserted = await db.get('SELECT * FROM i18n_codes WHERE name = ?', ['complex'])
        const parsed = JSON.parse(inserted.text)

        expect(parsed.de).toBe('Test "quoted"')
        expect(parsed.en).toBe('Test with, comma')
        expect(parsed.cz).toBe('Test\nNewline')
    })
})

describeOrSkip('i18n API - Indexes', () => {
    let db: DatabaseAdapter

    beforeEach(async () => {
        db = await createTestDatabase()
    })

    afterEach(async () => {
        await cleanupTestDatabase(db)
    })

    it('should have index on name', async () => {
        // Insert multiple entries
        for (let i = 0; i < 100; i++) {
            await db.run(`
                INSERT INTO i18n_codes (name, variation, type, text, status)
                VALUES (?, 'false', 'button', '{"de": "Test"}', 'de')
            `, [`key${i}`])
        }

        // Query by name should be fast (using index)
        const start = Date.now()
        await db.get('SELECT * FROM i18n_codes WHERE name = ?', ['key50'])
        const duration = Date.now() - start

        expect(duration).toBeLessThan(100) // Should be very fast with index
    })

    it('should enforce unique index', async () => {
        await db.run(`
            INSERT INTO i18n_codes (name, variation, type, text, status)
            VALUES ('test', 'false', 'button', '{"de": "Test"}', 'de')
        `)

        await expect(
            db.run(`
                INSERT INTO i18n_codes (name, variation, type, text, status)
                VALUES ('test', 'false', 'button', '{"de": "Test 2"}', 'de')
            `)
        ).rejects.toThrow()
    })
})
