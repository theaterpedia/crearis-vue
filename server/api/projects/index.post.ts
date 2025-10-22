import { defineEventHandler, readBody, createError } from 'h3'
import { db } from '../../database/init'

// POST /api/projects - Create new project
// Note: 'id' field is the domaincode (lowercase, no whitespace, starts with letter, allows underscore and numbers)
// Note: 'name' in request maps to 'id' (domaincode), 'heading' is separate field
export default defineEventHandler(async (event) => {
    const body = await readBody(event) as { id?: string; name?: string; heading?: string; description?: string; status?: string; owner_id?: string }

    try {
        // ID (domaincode) is required - can be provided as 'id' or 'name'
        const id = body.id || body.name
        if (!id) {
            throw createError({
                statusCode: 400,
                message: 'Project ID (domaincode) is required'
            })
        }

        // Validate ID format (domaincode constraints)
        if (!/^[a-z][a-z0-9_]*$/.test(id)) {
            throw createError({
                statusCode: 400,
                message: 'name needs to be a domaincode'
            })
        }

        // Check if ID already exists
        const existing = await db.get('SELECT id FROM projects WHERE id = ?', [id])
        if (existing) {
            throw createError({
                statusCode: 409,
                message: 'Project with this ID already exists'
            })
        }

        // Generate default heading if not provided
        const heading = body.heading || `Project Overline **${id}**`
        const description = body.description
        const status = body.status || 'draft'
        const owner_id = body.owner_id

        // Insert project
        const stmt = db.prepare(`
            INSERT INTO projects (id, heading, description, status, owner_id)
            VALUES (?, ?, ?, ?, ?)
        `)

        stmt.run(id, heading, description || null, status, owner_id || null)

        // Return created project
        const rawProject = await db.get('SELECT * FROM projects WHERE id = ?', [id])

        // Map to frontend format: id as 'name', heading as 'heading'
        const project = {
            ...rawProject,
            name: rawProject.id  // Frontend 'name' = database 'id' (domaincode)
        }

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