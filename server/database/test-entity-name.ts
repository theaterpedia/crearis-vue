/**
 * Test script for migration 010 and entity_name field
 * Verifies that admin watch tasks can be seeded with entity_name
 */

import { db } from './db-new'
import { seedAdminWatchTasks } from './migrations/seed-admin-watch-tasks'

async function main() {
    console.log('🧪 Testing entity_name field implementation...\n')

    try {
        // 1. Check if entity_name column exists
        console.log('1️⃣ Checking if entity_name column exists in tasks table...')
        const tableInfo = await db.all("PRAGMA table_info(tasks)")
        const hasEntityName = tableInfo.some((col: any) => col.name === 'entity_name')

        if (hasEntityName) {
            console.log('   ✅ entity_name column exists')
        } else {
            console.log('   ❌ entity_name column NOT found')
            console.log('   Run migration 010 first: DATABASE_TYPE=sqlite pnpm db:migrate')
            process.exit(1)
        }

        // 2. Seed admin watch tasks
        console.log('\n2️⃣ Seeding admin watch tasks with entity_name...')
        await seedAdminWatchTasks(db)
        console.log('   ✅ Watch tasks seeded successfully')

        // 3. Verify tasks were created with entity_name
        console.log('\n3️⃣ Verifying watch tasks have entity_name values...')
        const watchTasks = await db.all(`
            SELECT id, title, entity_name, logic, filter 
            FROM tasks 
            WHERE category = 'admin'
            ORDER BY id
        `)

        if (watchTasks.length === 0) {
            console.log('   ⚠️  No admin watch tasks found')
        } else {
            console.log(`   Found ${watchTasks.length} admin watch task(s):`)
            watchTasks.forEach((task: any) => {
                console.log(`\n   📋 ${task.id}`)
                console.log(`      Title: ${task.title}`)
                console.log(`      Entity Name: ${task.entity_name || '(null)'}`)
                console.log(`      Logic: ${task.logic}`)
                console.log(`      Filter: ${task.filter}`)

                if (task.entity_name) {
                    console.log('      ✅ Has entity_name')
                } else {
                    console.log('      ❌ Missing entity_name')
                }
            })
        }

        // 4. Summary
        console.log('\n📊 Summary:')
        const tasksWithEntityName = watchTasks.filter((t: any) => t.entity_name)
        console.log(`   Total admin tasks: ${watchTasks.length}`)
        console.log(`   Tasks with entity_name: ${tasksWithEntityName.length}`)

        if (tasksWithEntityName.length === watchTasks.length && watchTasks.length > 0) {
            console.log('\n✅ All tests passed! entity_name field is working correctly.')
        } else {
            console.log('\n⚠️  Some tasks are missing entity_name values.')
        }

    } catch (error) {
        console.error('\n❌ Test failed:', error)
        process.exit(1)
    }
}

main()
