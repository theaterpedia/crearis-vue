import { db } from './server/database/db.js'
import bcrypt from 'bcrypt'

async function checkAndFixUsers() {
    try {
        // Check existing users
        const users = await db.select('id', 'username', 'role', 'password_hash')
            .from('users')
            .whereIn('username', ['tp', 'regio1'])

        console.log('Current users:')
        console.log(JSON.stringify(users, null, 2))

        if (users.length === 0) {
            console.log('\nNo users found. Creating them...')

            const passwordHash = await bcrypt.hash('password123', 10)

            // Get project IDs
            const projects = await db.select('id', 'name')
                .from('projects')
                .whereIn('name', ['tp', 'regio1'])

            console.log('Projects found:', projects)

            for (const project of projects) {
                await db.insert({
                    username: project.name,
                    password_hash: passwordHash,
                    role: 'user',
                    project_id: project.id
                }).into('users')

                console.log(`Created user: ${project.name}`)
            }
        } else {
            console.log('\nUsers exist. Updating passwords...')

            const passwordHash = await bcrypt.hash('password123', 10)

            for (const user of users) {
                await db('users')
                    .where('id', user.id)
                    .update({ password_hash: passwordHash })

                console.log(`Updated password for: ${user.username}`)
            }
        }

        // Verify
        const updatedUsers = await db.select('id', 'username', 'role', 'project_id')
            .from('users')
            .whereIn('username', ['tp', 'regio1'])

        console.log('\nFinal state:')
        console.log(JSON.stringify(updatedUsers, null, 2))

        // Test password
        const testUser = await db.select('password_hash').from('users').where('username', 'tp').first()
        if (testUser) {
            const isValid = await bcrypt.compare('password123', testUser.password_hash)
            console.log(`\nPassword test for 'tp': ${isValid ? 'PASS ✓' : 'FAIL ✗'}`)
        }

    } catch (error) {
        console.error('Error:', error)
    } finally {
        process.exit(0)
    }
}

checkAndFixUsers()
