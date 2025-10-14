import Database from 'better-sqlite3'
import bcrypt from 'bcryptjs'
import { nanoid } from 'nanoid'

const db = new Database('demo-data.db')

// Create projects table (also serves as user table)
db.exec(`
  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'base', 'project')),
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  )
`)

console.log('✅ Projects table created')

// Check if projects already exist
const existingProjects = db.prepare('SELECT COUNT(*) as count FROM projects').get() as { count: number }

if (existingProjects.count > 0) {
    console.log('⚠️  Projects already exist. Skipping seed data.')
    console.log('💡 To reset, delete demo-data.db and run this script again.')
    db.close()
    process.exit(0)
}

// Generate passwords and hash them
const projects = [
    { username: 'admin', password: nanoid(16), role: 'admin' },
    { username: 'base', password: nanoid(16), role: 'base' },
    { username: 'project1', password: nanoid(16), role: 'project' },
    { username: 'project2', password: nanoid(16), role: 'project' },
]

console.log('\n🔐 Generated Passwords (SAVE THESE SECURELY!):\n')
console.log('='.repeat(60))

const insert = db.prepare(`
  INSERT INTO projects (id, username, password_hash, role)
  VALUES (?, ?, ?, ?)
`)

const insertMany = db.transaction((projects) => {
    for (const project of projects) {
        insert.run(project.id, project.username, project.password_hash, project.role)
    }
})

// Hash passwords and insert
const hashedProjects = projects.map(p => {
    const passwordHash = bcrypt.hashSync(p.password, 10)
    console.log(`Username: ${p.username}`)
    console.log(`Password: ${p.password}`)
    console.log(`Role:     ${p.role}`)
    console.log('-'.repeat(60))

    return {
        id: nanoid(),
        username: p.username,
        password_hash: passwordHash,
        role: p.role
    }
})

insertMany(hashedProjects)

console.log('='.repeat(60))
console.log(`✅ Created ${projects.length} user accounts\n`)

// Display summary
const allProjects = db.prepare('SELECT username, role FROM projects ORDER BY role, username').all()
console.log('📋 User Accounts Summary:')
allProjects.forEach((p: any) => {
    console.log(`  - ${p.username} (${p.role})`)
})

db.close()
console.log('\n✅ Authentication setup complete!')
