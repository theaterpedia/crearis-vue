/**
 * Test user credentials in both PostgreSQL and SQLite
 * Run with: npx tsx server/database/test-both-databases.ts
 */

import Database from 'better-sqlite3'
import bcrypt from 'bcryptjs'
import pkg from 'pg'
const { Client } = pkg

const testCredentials = [
    { username: 'admin', password: 'nE7uq1qFumJNMMom' },
    { username: 'base', password: 'yl5ScB1x3fnaBQP' },
]

async function testPostgreSQL() {
    console.log('🔐 Testing PostgreSQL credentials...\n')

    const client = new Client({
        user: 'crearis_admin',
        password: '7uqf9nE0umJmMMo',
        database: 'crearis_admin_dev',
        host: 'localhost',
        port: 5432,
    })

    await client.connect()

    for (const cred of testCredentials) {
        const result = await client.query(
            'SELECT username, password_hash, role FROM projects WHERE username = $1',
            [cred.username]
        )

        if (result.rows.length === 0) {
            console.log(`❌ User not found: ${cred.username}`)
            continue
        }

        const user = result.rows[0]
        const isValid = bcrypt.compareSync(cred.password, user.password_hash)

        if (isValid) {
            console.log(`✅ ${user.username} (${user.role}): PostgreSQL credentials valid`)
        } else {
            console.log(`❌ ${user.username} (${user.role}): PostgreSQL credentials INVALID`)
        }
    }

    await client.end()
}

async function testSQLite() {
    console.log('\n🔐 Testing SQLite credentials...\n')

    const db = new Database('./demo-data.db')

    for (const cred of testCredentials) {
        const user = db.prepare(
            'SELECT username, password_hash, role FROM projects WHERE username = ?'
        ).get(cred.username) as any

        if (!user) {
            console.log(`❌ User not found: ${cred.username}`)
            continue
        }

        const isValid = bcrypt.compareSync(cred.password, user.password_hash)

        if (isValid) {
            console.log(`✅ ${user.username} (${user.role}): SQLite credentials valid`)
        } else {
            console.log(`❌ ${user.username} (${user.role}): SQLite credentials INVALID`)
        }
    }

    db.close()
}

async function testBoth() {
    try {
        await testPostgreSQL()
        await testSQLite()
        console.log('\n✅ All tests completed')
    } catch (err) {
        console.error('❌ Error testing:', err)
        process.exit(1)
    }
}

testBoth()
