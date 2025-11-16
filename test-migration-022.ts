/**
 * Test script for migration 022
 * Directly runs the migration to test Chapter 1 (root fileset seeding)
 */

import { config as loadEnv } from 'dotenv'
import { db } from './server/database/db-new'
import { migration as migration022 } from './server/database/migrations/022_seed_csv_data'

// Load environment variables
loadEnv()

async function main() {
    console.log('🧪 Testing migration 022: Seed CSV data\n')

    try {
        // Check current user count
        const usersBefore = await db.all('SELECT sysmail FROM users')
        console.log(`📊 Users before migration: ${usersBefore.length}`)
        usersBefore.forEach((u: any) => console.log(`   - ${u.sysmail}`))

        // Check current project count
        const projectsBefore = await db.all('SELECT domaincode FROM projects')
        console.log(`\n📊 Projects before migration: ${projectsBefore.length}`)
        projectsBefore.forEach((p: any) => console.log(`   - ${p.domaincode}`))

        // Run migration 022
        console.log('\n🚀 Running migration 022...\n')
        await migration022.up(db)

        // Check after migration
        const usersAfter = await db.all('SELECT sysmail, username, role FROM users')
        console.log(`\n✅ Users after migration: ${usersAfter.length}`)
        usersAfter.forEach((u: any) => console.log(`   - ${u.sysmail} (${u.username}, ${u.role})`))

        const projectsAfter = await db.all('SELECT domaincode, name, status, owner_id FROM projects')
        console.log(`\n✅ Projects after migration: ${projectsAfter.length}`)
        for (const p of projectsAfter) {
            const owner = await db.get('SELECT sysmail FROM users WHERE id = ?', [p.owner_id])
            console.log(`   - ${p.domaincode}: ${p.name} (${p.status}, owner: ${owner?.sysmail || 'N/A'})`)
        }

        console.log('\n🎉 Migration 022 test completed successfully!')

    } catch (error: any) {
        console.error('\n❌ Migration 022 test failed:', error.message)
        console.error(error.stack)
        process.exit(1)
    } finally {
        await db.close()
    }
}

main()
