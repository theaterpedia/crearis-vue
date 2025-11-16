/**
 * Config Table Migration (001)
 * Creates crearis_config table for storing system configuration
 * Including version number and migration history
 */

import type { DatabaseAdapter } from '../adapter'

/**
 * Create crearis_config table
 */
export async function createCrearisConfigTable(db: DatabaseAdapter) {
    const isPostgres = db.type === 'postgresql'

    if (isPostgres) {
        await db.run(`CREATE TABLE IF NOT EXISTS crearis_config (
      id SERIAL PRIMARY KEY,
      config JSONB NOT NULL
    )`, [])

        // Ensure only one row exists
        const count = await db.get('SELECT COUNT(*) as count FROM crearis_config', [])
        if ((count as any).count === 0) {
            await db.run('INSERT INTO crearis_config (config) VALUES ($1)', [
                JSON.stringify({
                    version: '0.0.1',
                    migrations_run: []
                })
            ])
        }
    } else {
        await db.run(`CREATE TABLE IF NOT EXISTS crearis_config (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      config TEXT NOT NULL
    )`, [])

        const count = await db.get('SELECT COUNT(*) as count FROM crearis_config', [])
        if ((count as any).count === 0) {
            await db.run('INSERT INTO crearis_config (config) VALUES (?)', [
                JSON.stringify({
                    version: '0.0.1',
                    migrations_run: []
                })
            ])
        }
    }
}

/**
 * Main migration function
 */
export async function runConfigTableMigration(db: DatabaseAdapter) {
    console.log('📦 Running migration: 001_config_table')
    await createCrearisConfigTable(db)
    console.log('✅ Migration 001_config_table completed')
}

export const metadata = {
    id: '001_config_table',
    description: 'Create crearis_config table for system configuration and migration tracking',
    version: '0.0.1',
    date: '2025-10-15',
}
