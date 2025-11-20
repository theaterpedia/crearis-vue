import { defineEventHandler, readBody, createError } from 'h3'
import { db } from '../../database/init'
import { getStatusByName } from '../../utils/status-helpers'
import type { TasksTableFields } from '../../types/database'

// After Migration 019 Chapter 6:
// - tasks.title → tasks.name
// - tasks.image → tasks.cimg
// - tasks.status (TEXT) → tasks.status_id (INTEGER FK to status table)
// After Migration 020:
// - Added lang field and status_display computed column
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

        // Validate status if provided and get status value (BYTEA)
        let statusVal: Buffer | undefined
        if (body.status !== undefined) {
            const statusInfo = await getStatusByName(db, body.status, 'tasks')

            if (!statusInfo) {
                throw createError({
                    statusCode: 400,
                    message: `Invalid status '${body.status}'. Must be a valid status name for tasks.`
                })
            }

            statusVal = statusInfo.value
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

        // Build update data using TasksTableFields for type safety
        const updateData: Partial<TasksTableFields> = {}
        const updates: string[] = []
        const values: any[] = []

        if (body.name !== undefined) {
            if (body.name.trim() === '') {
                throw createError({
                    statusCode: 400,
                    message: 'Name cannot be empty'
                })
            }
            updateData.name = body.name.trim()
            updates.push('name = ?')
            values.push(updateData.name)
        }

        if (body.description !== undefined) {
            updateData.description = body.description || null
            updates.push('description = ?')
            values.push(updateData.description)
        }

        if (body.category !== undefined) {
            updateData.category = body.category
            updates.push('category = ?')
            values.push(updateData.category)
        }

        if (statusVal !== undefined) {
            updateData.status_val = statusVal
            updates.push('status_val = ?')
            values.push(updateData.status_val)

            // Auto-set completed_at when marking as final
            if (body.status === 'final' && !body.completed_at) {
                updateData.completed_at = new Date().toISOString()
                updates.push('completed_at = ?')
                values.push(updateData.completed_at)
            }

            // Clear completed_at when not final
            if (body.status !== 'final') {
                updates.push('completed_at = NULL')
            }
        }

        if (body.priority !== undefined) {
            updateData.priority = body.priority
            updates.push('priority = ?')
            values.push(updateData.priority)
        }

        if (body.release_id !== undefined) {
            updateData.release_id = body.release_id || null
            updates.push('release_id = ?')
            values.push(updateData.release_id)
        }

        if (body.assigned_to !== undefined) {
            updateData.assigned_to = body.assigned_to || null
            updates.push('assigned_to = ?')
            values.push(updateData.assigned_to)
        }

        if (body.cimg !== undefined) {
            updateData.cimg = body.cimg || null
            updates.push('cimg = ?')
            values.push(updateData.cimg)
        }

        if (body.prompt !== undefined) {
            updateData.prompt = body.prompt || null
            updates.push('prompt = ?')
            values.push(updateData.prompt)
        }

        if (body.due_date !== undefined) {
            updateData.due_date = body.due_date || null
            updates.push('due_date = ?')
            values.push(updateData.due_date)
        }

        if (body.completed_at !== undefined) {
            updateData.completed_at = body.completed_at || null
            updates.push('completed_at = ?')
            values.push(updateData.completed_at)
        }

        // Always update the updated_at timestamp
        updateData.updated_at = new Date().toISOString()
        updates.push('updated_at = ?')
        values.push(updateData.updated_at)

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
        // tasks.status_display and tasks.lang are included in tasks.*
        const task = await db.get(`
            SELECT tasks.*
            FROM tasks
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
