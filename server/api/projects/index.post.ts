import { defineEventHandler, readBody, createError } from 'h3'
import { db } from '../../database/init'

// POST /api/projects - Create new project
export default defineEventHandler(async (event) => {
    const body = await readBody(event)

    try {
        const { name, description, status = 'draft', username, owner_id } = body

        if (!name) {
            throw createError({
                statusCode: 400,
                message: 'Project name is required'
            })
        }

        // Generate ID
        const id = `proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        
        // Use provided username or generate from id
        const projectUsername = username || id

        // Insert project with username (required field)
        const stmt = db.prepare(`
            INSERT INTO projects (id, username, name, description, status, owner_id, role)
            VALUES (?, ?, ?, ?, ?, ?, 'project')
        `)

        stmt.run(id, projectUsername, name, description || null, status, owner_id || null)

        // Return created project
        const project = await db.get('SELECT * FROM projects WHERE id = ?', [id])

        return {
            success: true,
            project
        }
    } catch (error) {
        console.error('Error creating project:', error)
        throw createError({
            statusCode: 500,
            message: error instanceof Error ? error.message : 'Failed to create project'
        })
    }
})
