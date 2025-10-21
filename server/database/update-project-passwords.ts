/**
 * Update passwords for tp and regio1 users
 * Simple script to fix login issues
 */

import { db } from './db-new.js'
import bcrypt from 'bcryptjs'

async function updatePasswords() {
    console.log('🔄 Updating passwords for tp and regio1...\n')

    const users = ['tp', 'regio1']
    const password = 'password123'

    for (const username of users) {
        try {
            // Hash the password
            const hashedPassword = await bcrypt.hash(password, 10)

            // Update only the password field
            await db.run(
                'UPDATE users SET password = ? WHERE username = ?',
                [hashedPassword, username]
            )

            console.log(`✅ Updated password for: ${username}`)

            // Verify it worked
            const user = await db.get(
                'SELECT username, role, password FROM users WHERE username = ?',
                [username]
            )

            if (user) {
                const passwordMatch = await bcrypt.compare(password, (user as any).password)
                console.log(`   - Role: ${(user as any).role}`)
                console.log(`   - Password test: ${passwordMatch ? '✓ PASS' : '✗ FAIL'}`)
            }
        } catch (error) {
            console.error(`❌ Error updating ${username}:`, error)
        }
    }

    console.log('\n✅ Done!')
    process.exit(0)
}

updatePasswords().catch((error) => {
    console.error('❌ Error:', error)
    process.exit(1)
})
