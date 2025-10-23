import { defineEventHandler, readBody, createError } from 'h3'
import { db } from '../../database/init'

// After Migration 019 Chapter 6:
// - tasks.title → tasks.name
// - tasks.image → tasks.cimg
// - tasks.status (TEXT) → tasks.status (INTEGER FK to status table)
interface UpdateTaskBody {
    name?: string  // Renamed from title
    description?: string
    category?: 'admin' | 'main' | 'release'
    status?: string  // Status name (new, idea, draft, active, final, reopen, trash)
    priority?: 'low' | 'medium' | 'high' | 'urgent'
    release_id?: string | null
    assigned_to?: string
    cimg?: string  // Renamed from image
    prompt?: string
    due_date?: string
    completed_at?: string
}

export default defineEventHandler(async (event) => {
    try {
        const id = event.context.params?.id

        if (!id) {
            throw createError({
                statusCode: 400,
                message: 'Task ID is required'
            })
        }

        // Check if task exists
        const existingTask = await db.get('SELECT * FROM tasks WHERE id = ?', [id])
        if (!existingTask) {
            throw createError({
                statusCode: 404,
                message: 'Task not found'
            })
        }

        const body = await readBody<UpdateTaskBody>(event)

        if (!body) {
            throw createError({
                statusCode: 400,
                message: 'Request body is required'
            })
        }

        // Validate category if provided
        if (body.category && !['admin', 'main', 'release'].includes(body.category)) {
            throw createError({
                statusCode: 400,
                message: 'Invalid category. Must be: admin, main, or release'
            })
        }

        // Validate status if provided and get status ID
        let statusId: number | undefined
        if (body.status !== undefined) {
            const validStatuses = ['new', 'idea', 'draft', 'active', 'final', 'reopen', 'trash']
            if (!validStatuses.includes(body.status)) {
                throw createError({
                    statusCode: 400,
                    message: 'Invalid status. Must be: new, idea, draft, active, final, reopen, or trash'
                })
            }

            // Lookup status ID from status table
            const statusRecord = await db.get(
                'SELECT id FROM status WHERE "table" = ? AND name = ?',
                ['tasks', body.status]
            )

            if (!statusRecord) {
                throw createError({
                    statusCode: 400,
                    message: `Status '${body.status}' not found in status table`
                })
            }

            statusId = statusRecord.id
        }

        // Validate priority if provided
        if (body.priority && !['low', 'medium', 'high', 'urgent'].includes(body.priority)) {
            throw createError({
                statusCode: 400,
                message: 'Invalid priority. Must be: low, medium, high, or urgent'
            })
        }

        // Validate release_id if provided
        if (body.release_id !== undefined && body.release_id !== null) {
            const release = await db.get('SELECT id FROM releases WHERE id = ?', [body.release_id])
            if (!release) {
                throw createError({
                    statusCode: 400,
                    message: 'Invalid release_id. Release does not exist'
                })
            }
        }

        const updates: string[] = []
        const values: any[] = []

        if (body.name !== undefined) {
            if (body.name.trim() === '') {
                throw createError({
                    statusCode: 400,
                    message: 'Name cannot be empty'
                })
            }
            updates.push('name = ?')
            values.push(body.name.trim())
        }

        if (body.description !== undefined) {
            updates.push('description = ?')
            values.push(body.description || null)
        }

        if (body.category !== undefined) {
            updates.push('category = ?')
            values.push(body.category)
        }

        if (statusId !== undefined) {
            updates.push('status = ?')
            values.push(statusId)

            // Auto-set completed_at when marking as final
            if (body.status === 'final' && !body.completed_at) {
                updates.push('completed_at = ?')
                values.push(new Date().toISOString())
            }

            // Clear completed_at when not final
            if (body.status !== 'final') {
                updates.push('completed_at = NULL')
            }
        }

        if (body.priority !== undefined) {
            updates.push('priority = ?')
            values.push(body.priority)
        }

        if (body.release_id !== undefined) {
            updates.push('release_id = ?')
            values.push(body.release_id || null)
        }

        if (body.assigned_to !== undefined) {
            updates.push('assigned_to = ?')
            values.push(body.assigned_to || null)
        }

        if (body.cimg !== undefined) {
            updates.push('cimg = ?')
            values.push(body.cimg || null)
        }

        if (body.prompt !== undefined) {
            updates.push('prompt = ?')
            values.push(body.prompt || null)
        }

        if (body.due_date !== undefined) {
            updates.push('due_date = ?')
            values.push(body.due_date || null)
        }

        if (body.completed_at !== undefined) {
            updates.push('completed_at = ?')
            values.push(body.completed_at || null)
        }

        // Always update the updated_at timestamp
        updates.push('updated_at = ?')
        values.push(new Date().toISOString())

        // Add id to the end for WHERE clause
        values.push(id)

        if (updates.length === 1) {
            // Only updated_at was set, nothing meaningful to update
            throw createError({
                statusCode: 400,
                message: 'No valid fields to update'
            })
        }

        const sql = `UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`

        await db.run(sql, [...values])

        // Fetch updated task with status information
        const task = await db.get(`
            SELECT 
                tasks.*,
                status.value as status_value,
                status.name as status_name
            FROM tasks
            LEFT JOIN status ON tasks.status = status.id
            WHERE tasks.id = ?
        `, [id])

        return {
            success: true,
            task,
            message: 'Task updated successfully'
        }
    } catch (error: any) {
        if (error.statusCode) {
            throw error
        }

        throw createError({
            statusCode: 500,
            message: 'Failed to update task',
            data: error
        })
    }
})
