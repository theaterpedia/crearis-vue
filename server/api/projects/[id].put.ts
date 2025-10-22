import { defineEventHandler, readBody, getRouterParam, createError } from 'h3'
import { db } from '../../database/init'

// PUT /api/projects/[id] - Update project
export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id')
    const body = await readBody(event)

    try {
        if (!id) {
            throw createError({
                statusCode: 400,
                message: 'Project ID is required'
            })
        }

        // Check if project exists
        const existing = await db.get('SELECT * FROM projects WHERE id = ?', [id])
        if (!existing) {
            throw createError({
                statusCode: 404,
                message: 'Project not found'
            })
        }

        const { id: newId, name, heading, description, status } = body

        // Reject attempts to change ID or name (domaincode is immutable)
        if ((newId !== undefined && newId !== id) || (name !== undefined && name !== id)) {
            throw createError({
                statusCode: 400,
                message: 'Cannot change project ID or name (domaincode is immutable)'
            })
        }

        // Build update query
        const updates: string[] = []
        const values: any[] = []

        // Allow updating heading
        if (heading !== undefined) {
            updates.push('heading = ?')
            values.push(heading)
        }
        if (description !== undefined) {
            updates.push('description = ?')
            values.push(description)
        }
        if (status !== undefined) {
            updates.push('status = ?')
            values.push(status)
        }

        if (updates.length === 0) {
            throw createError({
                statusCode: 400,
                message: 'No fields to update'
            })
        }

        updates.push('updated_at = CURRENT_TIMESTAMP')
        values.push(id)

        const stmt = db.prepare(`
            UPDATE projects 
            SET ${updates.join(', ')}
            WHERE id = ?
        `)

        stmt.run(...values)

        // Return updated project
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
        console.error('Error updating project:', error)
        throw createError({
            statusCode: 500,
            message: error instanceof Error ? error.message : 'Failed to update project'
        })
    }
})
