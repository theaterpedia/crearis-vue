/**
 * Seed script to create initial user accounts in projects table
 * Run with: npx tsx server/database/seed-users.ts
 */

import { db } from './init.js'
import bcrypt from 'bcryptjs'
import { nanoid } from 'nanoid'

async function seedUsers() {
  console.log('🌱 Seeding user accounts...')

  // Check if users already exist
  const existingUsers = await db.all('SELECT COUNT(*) as count FROM projects', [])
  const count = (existingUsers[0] as any).count

  if (count > 0) {
    console.log('⚠️  Users already exist. Skipping seed.')
    console.log('💡 To reset, drop and recreate the database.')
    process.exit(0)
  }

  // Create admin and base users
  const users = [
    { username: 'admin', password: 'admin123', role: 'admin' },
    { username: 'base', password: 'base123', role: 'base' },
  ]

  console.log('\n🔐 Creating user accounts:\n')
  console.log('='.repeat(60))

  for (const user of users) {
    const passwordHash = bcrypt.hashSync(user.password, 10)
    const id = nanoid()

    await db.run(
      `INSERT INTO projects (id, username, password_hash, role, name, status, created_at)
       VALUES (?, ?, ?, ?, ?, 'active', CURRENT_TIMESTAMP)`,
      [id, user.username, passwordHash, user.role, user.username, ]
    )

    console.log(`Username: ${user.username}`)
    console.log(`Password: ${user.password}`)
    console.log(`Role:     ${user.role}`)
    console.log('-'.repeat(60))
  }

  console.log('='.repeat(60))
  console.log(`✅ Created ${users.length} user accounts\n`)

  // Display summary
  const allUsers = await db.all('SELECT username, role FROM projects ORDER BY role, username', [])
  console.log('📋 User Accounts Summary:')
  allUsers.forEach((u: any) => {
    console.log(`  - ${u.username} (${u.role})`)
  })

  console.log('\n✅ Seeding complete!')
  process.exit(0)
}

seedUsers().catch((err) => {
  console.error('❌ Error seeding users:', err)
  process.exit(1)
})
