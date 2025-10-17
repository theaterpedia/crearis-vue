/**
 * Add tp and regio1 project users to the database
 * Quick script to add missing project users with correct passwords
 */

import { db } from './db-new.js'
import bcrypt from 'bcryptjs'

async function addProjectUsers() {
    console.log('🔄 Adding tp and regio1 project users...\n')

    const users = [
        { username: 'tp', password: 'password123', role: 'project' },
        { username: 'regio1', password: 'password123', role: 'project' }
    ]

    for (const user of users) {
        try {
            // Check if user already exists
            const existing = await db.get(
                'SELECT id FROM users WHERE username = ?',
                [user.username]
            )

            if (existing) {
                console.log(`⚠️  User ${user.username} already exists, updating password...`)

                // Update password
                const hashedPassword = await bcrypt.hash(user.password, 10)
                await db.run(
                    'UPDATE users SET password = ?, role = ? WHERE username = ?',
                    [hashedPassword, user.role, user.username]
                )

                console.log(`✅ Updated user: ${user.username}`)
            } else {
                console.log(`➕ Creating new user: ${user.username}...`)

                // Create new user
                const hashedPassword = await bcrypt.hash(user.password, 10)
                await db.run(
                    `INSERT INTO users (username, password, role, created_at)
                     VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
                    [user.username, hashedPassword, user.role]
                )

                console.log(`✅ Created user: ${user.username}`)
            }
        } catch (error) {
            console.error(`❌ Error processing ${user.username}:`, error)
        }
    }

    // Verify
    console.log('\n📊 Verification:')
    const tpUser = await db.get('SELECT username, role FROM users WHERE username = ?', ['tp'])
    const regio1User = await db.get('SELECT username, role FROM users WHERE username = ?', ['regio1'])

    if (tpUser) {
        console.log(`   ✅ tp: ${(tpUser as any).role}`)
    } else {
        console.log(`   ❌ tp: not found`)
    }

    if (regio1User) {
        console.log(`   ✅ regio1: ${(regio1User as any).role}`)
    } else {
        console.log(`   ❌ regio1: not found`)
    }

    console.log('\n✅ Done!')
    process.exit(0)
}

addProjectUsers().catch((error) => {
    console.error('❌ Error:', error)
    process.exit(1)
})
