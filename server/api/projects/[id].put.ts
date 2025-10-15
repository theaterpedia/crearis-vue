import { defineEventHandler, readBody, getRouterParam, createError } from 'h3'
import { db } from '../../database/db-new'

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

        const { name, description, status } = body

        // Build update query
        const updates: string[] = []
        const values: any[] = []

        if (name !== undefined) {
            updates.push('name = ?')
            values.push(name)
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
        const project = await db.get('SELECT * FROM projects WHERE id = ?', [id])

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
