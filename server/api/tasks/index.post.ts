import { defineEventHandler, readBody, createError } from 'h3'
import { nanoid } from 'nanoid'
import { db } from '../../database/init'

// After Migration 019 Chapter 6:
// - tasks.title → tasks.name
// - tasks.image → tasks.cimg
// - tasks.status (TEXT) → tasks.status (INTEGER FK to status table)
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

        // Validate status if provided and get status ID
        let statusId: number | undefined
        if (body.status) {
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
        } else {
            // Default to 'idea' status
            const defaultStatus = await db.get(
                'SELECT id FROM status WHERE "table" = ? AND name = ?',
                ['tasks', 'idea']
            )

            if (!defaultStatus) {
                throw createError({
                    statusCode: 500,
                    message: 'Default status (idea) not found. Run migration 021.'
                })
            }

            statusId = defaultStatus.id
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

        const stmt = db.prepare(`
            INSERT INTO tasks (
                id, 
                name, 
                description, 
                category,
                status,
                priority, 
                release_id,
                record_type, 
                record_id, 
                assigned_to,
                cimg,
                prompt,
                due_date,
                created_at,
                updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `)

        stmt.run(
            id,
            body.name.trim(),
            body.description || null,
            body.category || 'main',
            statusId,
            body.priority || 'medium',
            body.release_id || null,
            body.record_type || null,
            body.record_id || null,
            body.assigned_to || null,
            body.cimg || null,
            body.prompt || null,
            body.due_date || null,
            now,
            now
        )

        // Fetch created task with status information
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
