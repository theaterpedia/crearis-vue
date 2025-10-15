/**
 * Database Initialization Module
 * Handles connection setup and runs migrations automatically
 * 
 * Initialization Strategy:
 * 1. Check if crearis_config table exists
 * 2. If not exists → Fresh database → Run all migrations
 * 3. If exists → Check version in config
 * 4. If version outdated → Run pending migrations
 * 5. If version current → Skip migrations
 */

import fs from 'fs'
import path from 'path'
import { db } from './db-new'
import { runMigrations } from './migrations/index'
import { seedDatabase } from './seed'

interface ConfigData {
    version: string
    migrations_run: string[]
}

/**
 * Get current project version from package.json
 */
function getCurrentVersion(): string {
    try {
        const packageJsonPath = path.resolve(process.cwd(), 'package.json')
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
        return packageJson.version
    } catch (error) {
        console.warn('⚠️  Could not read version from package.json, using default: 0.0.1')
        return '0.0.1'
    }
}

/**
 * Check if crearis_config table exists and get config
 */
async function getConfigFromDatabase(): Promise<ConfigData | null> {
    try {
        const result = await db.get('SELECT config FROM crearis_config WHERE id = 1', [])
        if (!result) return null

        const config = JSON.parse((result as any).config)
        return {
            version: config.version || '0.0.0',
            migrations_run: config.migrations_run || [],
        }
    } catch (error: any) {
        // Table doesn't exist or other error
        return null
    }
}

/**
 * Initialize database with smart migration handling
 */
async function initializeDatabase() {
    const currentVersion = getCurrentVersion()
    const dbConfig = await getConfigFromDatabase()

    // Case 1: Database not found or config not found → Fresh database
    if (!dbConfig) {
        console.log('\n🔍 Database not found or not initialized')
        console.log('🚀 Starting automatic schema creation...')
        console.log(`📦 Current version: ${currentVersion}\n`)

        // Run all migrations to create schema
        await runMigrations(db, true)

        console.log('✅ Database schema created successfully!\n')

        // Seed database with CSV data and users/projects
        await seedDatabase(db)

        return
    }

    // Case 2: Database exists, check version
    const dbVersion = dbConfig.version
    console.log(`\n📊 Database found: v${dbVersion}`)
    console.log(`📦 Current version: v${currentVersion}`)

    // Case 2a: Version is outdated → Run pending migrations
    if (dbVersion !== currentVersion) {
        console.log(`\n⚠️  Database version (${dbVersion}) differs from current version (${currentVersion})`)
        console.log('🔄 Checking for pending migrations...\n')

        // ⚠️ WARNING: Database backup should be implemented here
        console.log('⚠️  WARNING: Database backup is not yet implemented!')
        console.log('⚠️  Please manually backup your database before migrations:')
        console.log('   PostgreSQL: pg_dump crearis_admin_dev > backup_$(date +%Y%m%d_%H%M%S).sql')
        console.log('   SQLite: cp demo-data.db demo-data.db.backup_$(date +%Y%m%d_%H%M%S)\n')

        const result = await runMigrations(db, true)

        if (result.ran > 0) {
            console.log(`\n✅ Applied ${result.ran} migration(s)`)
            console.log('💡 Consider updating database version: pnpm version:bump\n')
        } else {
            console.log('\n✅ All migrations already applied')
            console.log('💡 Update config version manually or run: pnpm version:bump\n')
        }
        return
    }

    // Case 2b: Version is current → Check for pending migrations anyway
    const result = await runMigrations(db, false)

    if (result.ran > 0) {
        console.log(`\n✅ Applied ${result.ran} pending migration(s) (version ${currentVersion})\n`)
    } else {
        console.log(`✅ Database ready (v${currentVersion})\n`)
    }
}

// Run initialization
await initializeDatabase()

// Export initialized database
export { db }
export default db
