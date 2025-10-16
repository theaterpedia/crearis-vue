/**
 * Run Migration 003: Entity Task Triggers
 * 
 * This script runs the trigger migration to create main-task auto-creation triggers
 */

import { db } from './server/database/db-new'
import { migration } from './server/database/migrations/003_entity_task_triggers'

async function runMigration() {
    try {
        console.log('\n🔄 Running migration:', migration.id)
        console.log('📝 Description:', migration.description)
        console.log('🗄️  Database type:', db.type)
        console.log()

        await migration.up(db)

        // Update config to mark migration as run
        const config = await db.get('SELECT config FROM crearis_config WHERE id = 1', [])
        if (config) {
            const configData = JSON.parse((config as any).config)
            if (!configData.migrations_run.includes(migration.id)) {
                configData.migrations_run.push(migration.id)
                await db.run(
                    'UPDATE crearis_config SET config = ? WHERE id = 1',
                    [JSON.stringify(configData)]
                )
                console.log('✅ Updated migration history')
            }
        }

        console.log('\n🎉 Migration completed successfully!\n')
        await db.close()
    } catch (error: any) {
        console.error('\n❌ Migration failed:', error.message)
        console.error(error)
        await db.close()
        process.exit(1)
    }
}

runMigration()
