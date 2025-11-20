import { defineEventHandler, readBody, createError } from 'h3'
import { nanoid } from 'nanoid'
import { db } from '../../database/init'
import { getStatusByName } from '../../utils/status-helpers'
import type { TasksTableFields } from '../../types/database'

// After Migration 019 Chapter 6:
// - tasks.title → tasks.name
// - tasks.image → tasks.cimg
// - tasks.status (TEXT) → tasks.status_id (INTEGER FK to status table)
// After Migration 020:
// - Added lang field and status_display computed column
interface CreateTaskBody {
    name: string  // Renamed from title
    description?: string
    category?: 'admin' | 'main' | 'release'
    status?: string  // Status name (new, idea, draft, active, final, reopen, trash)
    priority?: 'low' | 'medium' | 'high' | 'urgent'
    release_id?: string
    record_type?: string
    record_id?: string
    assigned_to?: string
    cimg?: string  // Renamed from image
    prompt?: string
    due_date?: string
}

export default defineEventHandler(async (event) => {
    try {
        const body = await readBody<CreateTaskBody>(event)

        if (!body) {
            throw createError({
                statusCode: 400,
                message: 'Request body is required'
            })
        }

        // Validate required fields
        if (!body.name || body.name.trim() === '') {
            throw createError({
                statusCode: 400,
                message: 'Name is required'
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
        let statusVal: Buffer
        if (body.status) {
            const statusInfo = await getStatusByName(db, body.status, 'tasks')

            if (!statusInfo) {
                throw createError({
                    statusCode: 400,
                    message: `Invalid status '${body.status}'. Must be a valid status name for tasks.`
                })
            }
            statusVal = statusInfo.value
        } else {
            // Default to 'idea' status
            const statusInfo = await getStatusByName(db, 'idea', 'tasks')

            if (!statusInfo) {
                throw createError({
                    statusCode: 500,
                    message: 'Default status (idea) not found. Run migration 021.'
                })
            }
            statusId = foundId
        }

        // Validate priority if provided
        if (body.priority && !['low', 'medium', 'high', 'urgent'].includes(body.priority)) {
            throw createError({
                statusCode: 400,
                message: 'Invalid priority. Must be: low, medium, high, or urgent'
            })
        }

        // Validate release_id if provided
        if (body.release_id) {
            const release = await db.get('SELECT id FROM releases WHERE id = ?', [body.release_id])
            if (!release) {
                throw createError({
                    statusCode: 400,
                    message: 'Invalid release_id. Release does not exist'
                })
            }
        }

        const id = nanoid()
        const now = new Date().toISOString()

        // Use TasksTableFields for type-safe INSERT
        const taskData: Partial<TasksTableFields> = {
            id,
            name: body.name.trim(),
            description: body.description || null,
            category: body.category || 'main',
            status_val: statusVal,
            priority: body.priority || 'medium',
            release_id: body.release_id || null,
            record_type: body.record_type || null,
            record_id: body.record_id || null,
            assigned_to: body.assigned_to || null,
            cimg: body.cimg || null,
            prompt: body.prompt || null,
            due_date: body.due_date || null,
            created_at: now,
            updated_at: now,
            lang: 'de'  // Default language
        }

        const stmt = db.prepare(`
            INSERT INTO tasks (
                id, 
                name, 
                description, 
                category,
                status_val,
                priority, 
                release_id,
                record_type, 
                record_id, 
                assigned_to,
                cimg,
                prompt,
                due_date,
                created_at,
                updated_at,
                lang
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `)

        stmt.run(
            taskData.id,
            taskData.name,
            taskData.description,
            taskData.category,
            taskData.status_val,
            taskData.priority,
            taskData.release_id,
            taskData.record_type,
            taskData.record_id,
            taskData.assigned_to,
            taskData.cimg,
            taskData.prompt,
            taskData.due_date,
            taskData.created_at,
            taskData.updated_at,
            taskData.lang
        )

        // Fetch created task with status information
        // tasks.status_display and tasks.lang are included in tasks.*
        // Get created task
        const task = await db.get(`
            SELECT *
            FROM tasks
            WHERE id = ?
        `, [id])

        // Add status information if available
        if (task && (task as any).status_val) {
            const statusInfo = await getStatusByName(db, '', 'tasks')
            // In a real implementation, you'd call getStatusByValue here
            // For now, just return the task with status_val
        }

        return {
            success: true,
            task,
            message: 'Task created successfully'
        }
    } catch (error: any) {
        if (error.statusCode) {
            throw error
        }

        throw createError({
            statusCode: 500,
            message: 'Failed to create task',
            data: error
        })
    }
})
