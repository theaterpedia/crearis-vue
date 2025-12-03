/**
 * Reset passwords for opus1 test project users
 * 
 * Test users for project opus1 (id: 9):
 * - id: 8   hans.opus@theaterpedia.org (owner)
 * - id: 17  nina.opus@theaterpedia.org
 * - id: 7   rosa.opus@theaterpedia.org  
 * - id: 103 marc.opus@theaterpedia.org
 * 
 * Passwords are read from environment variables:
 * - TEST_USER_HANS_PASSWORD
 * - TEST_USER_NINA_PASSWORD
 * - TEST_USER_ROSA_PASSWORD
 * - TEST_USER_MARC_PASSWORD
 * 
 * Run: npx tsx server/database/reset-opus1-passwords.ts
 */

import { db } from './init'
import bcrypt from 'bcryptjs'

const TEST_USERS = [
    {
        id: 8,
        sysmail: 'hans.opus@theaterpedia.org',
        envKey: 'TEST_USER_HANS_PASSWORD',
        name: 'Hans'
    },
    {
        id: 17,
        sysmail: 'nina.opus@theaterpedia.org',
        envKey: 'TEST_USER_NINA_PASSWORD',
        name: 'Nina'
    },
    {
        id: 7,
        sysmail: 'rosa.opus@theaterpedia.org',
        envKey: 'TEST_USER_ROSA_PASSWORD',
        name: 'Rosa'
    },
    {
        id: 103,
        sysmail: 'marc.opus@theaterpedia.org',
        envKey: 'TEST_USER_MARC_PASSWORD',
        name: 'Marc'
    }
]

async function resetOpus1Passwords() {
    console.log('🔄 Resetting passwords for opus1 test users...\n')

    for (const user of TEST_USERS) {
        const password = process.env[user.envKey]

        if (!password) {
            console.log(`⚠️  Skipping ${user.name}: ${user.envKey} not set in environment`)
            continue
        }

        try {
            // Verify user exists by sysmail (works on both dev and prod)
            const existing = await db.get(
                'SELECT id, username, sysmail FROM users WHERE sysmail = ?',
                [user.sysmail]
            ) as { id: number; username: string; sysmail: string } | undefined

            if (!existing) {
                console.log(`❌ User not found: ${user.sysmail}`)
                continue
            }

            // Hash and update password
            const hashedPassword = await bcrypt.hash(password, 10)
            await db.run(
                'UPDATE users SET password = ? WHERE sysmail = ?',
                [hashedPassword, user.sysmail]
            )

            console.log(`✅ ${user.name} (${user.sysmail}): password updated`)
        } catch (error) {
            console.error(`❌ Error updating ${user.name}:`, error)
        }
    }

    // Verification
    console.log('\n📊 Verification - opus1 test users:')
    for (const user of TEST_USERS) {
        const dbUser = await db.get(
            'SELECT id, username, sysmail FROM users WHERE sysmail = ?',
            [user.sysmail]
        ) as { id: number; username: string; sysmail: string } | undefined

        if (dbUser) {
            console.log(`   ✅ ${user.name}: id=${dbUser.id}, username=${dbUser.username}`)
        } else {
            console.log(`   ❌ ${user.name}: not found`)
        }
    }

    // Verify project exists
    console.log('\n📊 Verification - opus1 project:')
    const project = await db.get(
        'SELECT id, domaincode, heading FROM projects WHERE domaincode = ?',
        ['opus1']
    ) as { id: number; domaincode: string; heading: string } | undefined

    if (project) {
        console.log(`   ✅ Project: id=${project.id}, heading="${project.heading}"`)
    } else {
        console.log(`   ❌ Project opus1 not found`)
    }

    // Check project_members
    console.log('\n📊 Verification - project_members for opus1:')
    const members = await db.all(
        `SELECT pm.user_id, pm.configrole, pm.role, u.username, u.sysmail
         FROM project_members pm
         JOIN users u ON pm.user_id = u.id
         WHERE pm.project_id = 9`,
        []
    ) as Array<{ user_id: number; configrole: number; role: string; username: string; sysmail: string }>

    for (const member of members) {
        console.log(`   👤 ${member.username} (${member.sysmail}): configrole=${member.configrole}, label="${member.role}"`)
    }

    console.log('\n✅ Done!')
    process.exit(0)
}

resetOpus1Passwords().catch((error) => {
    console.error('❌ Error:', error)
    process.exit(1)
})
