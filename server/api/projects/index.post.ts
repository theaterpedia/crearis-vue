import { defineEventHandler, readBody, createError } from 'h3'
import { db } from '../../database/db-new'

// POST /api/projects - Create new project
export default defineEventHandler(async (event) => {
    const body = await readBody(event)

    try {
        const { name, description, status = 'draft' } = body

        if (!name) {
            throw createError({
                statusCode: 400,
                message: 'Project name is required'
            })
        }

        // Generate ID
        const id = `proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

        // Insert project
        const stmt = db.prepare(`
            INSERT INTO projects (id, name, description, status)
            VALUES (?, ?, ?, ?)
        `)

        stmt.run(id, name, description || null, status)

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
