/**
 * Migration 007: Create system config table for watch tasks
 * Used for storing watch timestamps and other config values
 * 
 * Note: Data seeding moved to migration 021
 */

import type { DatabaseAdapter } from '../adapter'

export const migration = {
    id: '007_create_system_config_table',
    description: 'Create system config table for watch task timestamps',

    async up(db: DatabaseAdapter): Promise<void> {
        console.log('📋 Running migration 007: Creating system_config table...')

        if (db.type === 'postgresql') {
            // PostgreSQL syntax
            await db.exec(`
                CREATE TABLE IF NOT EXISTS system_config (
                    key TEXT PRIMARY KEY,
                    value TEXT NOT NULL,
                    description TEXT,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `)
        } else {
            // SQLite syntax
            await db.exec(`
                CREATE TABLE IF NOT EXISTS system_config (
                    key TEXT PRIMARY KEY,
                    value TEXT NOT NULL,
                    description TEXT,
                    updated_at TEXT DEFAULT (datetime('now'))
                );
            `)
        }

        console.log('✅ Migration 007 completed: system_config table created')
        console.log('  ℹ️  Data seeding moved to migration 021')
    }
}
