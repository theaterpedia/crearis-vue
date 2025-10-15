/**
 * Update users with new credentials
 * Run with: DATABASE_TYPE=postgresql DB_NAME=crearis_admin_dev DB_USER=crearis_admin DB_PASSWORD=7uqf9nE0umJmMMo npx tsx server/database/update-users.ts
 */

import { db } from './db-new.js'
import { nanoid } from 'nanoid'
import bcrypt from 'bcryptjs'

const users = [
]

async function updateUsers() {
    console.log('🔄 Updating users with new credentials...\n')

    for (const user of users) {
        const passwordHash = bcrypt.hashSync(user.password, 10)

        // Check if user exists
        const existing = await db.get(
            'SELECT id FROM projects WHERE username = ?',
            [user.username]
        ) as any

        if (existing) {
            // Update existing user
            await db.run(
                `UPDATE projects 
         SET password_hash = ?, role = ?, updated_at = CURRENT_TIMESTAMP
         WHERE username = ?`,
                [passwordHash, user.role, user.username]
            )
            console.log(`✅ Updated user: ${user.username} (${user.role})`)
        } else {
            // Insert new user
            const id = nanoid()
            await db.run(
                `INSERT INTO projects (id, username, password_hash, role, name, status, created_at)
         VALUES (?, ?, ?, ?, ?, 'active', CURRENT_TIMESTAMP)`,
                [id, user.username, passwordHash, user.role, user.username]
            )
            console.log(`✅ Created user: ${user.username} (${user.role})`)
        }
    }

    console.log('\n✅ All users updated successfully')

    // Show summary
    const allUsers = await db.all(
        'SELECT username, role FROM projects ORDER BY role, username',
        []
    ) as any[]

    console.log('\n📊 Current users in projects table:')
    for (const user of allUsers) {
        console.log(`   - ${user.username} (${user.role})`)
    }

    console.log('\n💡 Run sync-projects-to-users.ts to sync to users table')

    process.exit(0)
}

updateUsers().catch((err) => {
    console.error('❌ Error updating users:', err)
    process.exit(1)
})
