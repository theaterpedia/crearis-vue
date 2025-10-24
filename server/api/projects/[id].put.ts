import { defineEventHandler, readBody, getRouterParam, createError } from 'h3'
import { db } from '../../database/init'
import type { ProjectsTableFields } from '../../types/database'

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

        // Check if project exists by domaincode
        const existing = await db.get('SELECT * FROM projects WHERE domaincode = ?', [id])
        if (!existing) {
            throw createError({
                statusCode: 404,
                message: 'Project not found'
            })
        }

        const { domaincode: newDomaincode, name, heading, description, status } = body as Partial<ProjectsTableFields> & { domaincode?: string }

        // Reject attempts to change domaincode (immutable)
        if (newDomaincode !== undefined && newDomaincode !== id) {
            throw createError({
                statusCode: 400,
                message: 'Cannot change project domaincode (immutable)'
            })
        }

        // Build update data using ProjectsTableFields for type safety
        const updateData: Partial<ProjectsTableFields> = {}
        const updates: string[] = []
        const values: any[] = []

        // Allow updating name (project title/name)
        if (name !== undefined) {
            updateData.name = name
            updates.push('name = ?')
            values.push(updateData.name)
        }
        // Allow updating heading (kept for backward compat)
        if (heading !== undefined) {
            updateData.heading = heading
            updates.push('heading = ?')
            values.push(updateData.heading)
        }
        if (description !== undefined) {
            updateData.description = description
            updates.push('description = ?')
            values.push(updateData.description)
        }
        if (status !== undefined) {
            updateData.status = status
            updates.push('status = ?')
            values.push(updateData.status)
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
            WHERE domaincode = ?
        `)

        stmt.run(...values)

        // Return updated project
        const rawProject = await db.get('SELECT * FROM projects WHERE domaincode = ?', [id])

        return {
            success: true,
            project: rawProject
        }
    } catch (error) {
        console.error('Error updating project:', error)
        throw createError({
            statusCode: 500,
            message: error instanceof Error ? error.message : 'Failed to update project'
        })
    }
})
