/**
 * Migration 007: Create system config table for watch tasks
 * Used for storing watch timestamps and other config values
 */

import type { DatabaseAdapter } from '../adapter'
import { getFileset } from '../../settings'

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

        // Insert watchcsv configuration with base fileset from settings
        const baseFileset = getFileset('base')
        const watchcsvConfig = JSON.stringify({
            base: {
                lastCheck: null,
                files: baseFileset.files
            }
        })

        if (db.type === 'postgresql') {
            await db.run(
                `INSERT INTO system_config (key, value, description)
                 VALUES ($1, $2, $3)
                 ON CONFLICT (key) DO NOTHING`,
                ['watchcsv', watchcsvConfig, 'Tracks last check timestamps for CSV file monitoring']
            )
        } else {
            await db.run(
                `INSERT OR IGNORE INTO system_config (key, value, description)
                 VALUES (?, ?, ?)`,
                ['watchcsv', watchcsvConfig, 'Tracks last check timestamps for CSV file monitoring']
            )
        }

        // Insert watchdb configuration
        // Watchdb monitors the main entity tables
        const watchdbConfig = JSON.stringify({
            base: {
                lastCheck: null,
                entities: ['events', 'posts', 'locations', 'instructors', 'participants']
            }
        })

        if (db.type === 'postgresql') {
            await db.run(
                `INSERT INTO system_config (key, value, description)
                 VALUES ($1, $2, $3)
                 ON CONFLICT (key) DO NOTHING`,
                ['watchdb', watchdbConfig, 'Tracks last check timestamps for database entity monitoring']
            )
        } else {
            await db.run(
                `INSERT OR IGNORE INTO system_config (key, value, description)
                 VALUES (?, ?, ?)`,
                ['watchdb', watchdbConfig, 'Tracks last check timestamps for database entity monitoring']
            )
        }

        console.log('✅ Migration 007 completed: system_config table created with watch configs')
    }
}
