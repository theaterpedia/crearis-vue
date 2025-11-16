/**
 * Update SQLite users directly without schema initialization
 * Run with: npx tsx server/database/update-users-sqlite-direct.ts
 */

import Database from 'better-sqlite3'
import bcrypt from 'bcryptjs'

const users = [
    { username: 'admin', password: 'nE7uq1qFumJNMMom', role: 'admin' },
    { username: 'base', password: 'yl5ScB1x3fnaBQP', role: 'base' },
]

async function updateUsersSQLite() {
    console.log('🔄 Updating users in SQLite database...\n')

    const db = new Database('./demo-data.db')

    for (const user of users) {
        const passwordHash = bcrypt.hashSync(user.password, 10)

        // Check if user exists
        const existing = db.prepare('SELECT id FROM projects WHERE username = ?').get(user.username)

        if (existing) {
            // Update existing user
            db.prepare(
                `UPDATE projects 
                 SET password_hash = ?, role = ?, updated_at = datetime('now')
                 WHERE username = ?`
            ).run(passwordHash, user.role, user.username)
            console.log(`✅ Updated user in projects: ${user.username} (${user.role})`)
        } else {
            // Insert new user
            const nanoid = (await import('nanoid')).nanoid
            const id = nanoid()
            db.prepare(
                `INSERT INTO projects (id, username, password_hash, role, created_at, updated_at)
                 VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))`
            ).run(id, user.username, passwordHash, user.role)
            console.log(`✅ Created user in projects: ${user.username} (${user.role})`)
        }

        // Update users table
        const userExists = db.prepare('SELECT id FROM users WHERE username = ?').get(user.username)

        if (userExists) {
            db.prepare(
                `UPDATE users 
                 SET password = ?, role = ?
                 WHERE username = ?`
            ).run(passwordHash, user.role, user.username)
            console.log(`✅ Updated user in users: ${user.username}`)
        } else {
            const nanoid = (await import('nanoid')).nanoid
            const id = nanoid()
            db.prepare(
                `INSERT INTO users (id, username, password, role, created_at)
                 VALUES (?, ?, ?, ?, datetime('now'))`
            ).run(id, user.username, passwordHash, user.role)
            console.log(`✅ Created user in users: ${user.username}`)
        }
    }

    // Show summary
    const projectUsers = db.prepare('SELECT username, role FROM projects ORDER BY role, username').all()
    const tableUsers = db.prepare('SELECT username, role FROM users ORDER BY role, username').all()

    console.log('\n📊 Current users in SQLite:')
    console.log('\nProjects table:')
    projectUsers.forEach((u: any) => console.log(`   - ${u.username} (${u.role})`))
    console.log('\nUsers table:')
    tableUsers.forEach((u: any) => console.log(`   - ${u.username} (${u.role})`))

    db.close()
    console.log('\n✅ SQLite database updated successfully')
}

updateUsersSQLite().catch((err) => {
    console.error('❌ Error updating SQLite:', err)
    process.exit(1)
})
