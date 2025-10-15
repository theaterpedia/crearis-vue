import { defineEventHandler, readBody, createError } from 'h3'
import { nanoid } from 'nanoid'
import { db } from '../../database/db-new'

interface CreateTaskBody {
    title: string
    description?: string
    category?: 'admin' | 'main' | 'release'
    status?: 'idea' | 'new' | 'draft' | 'final' | 'reopen' | 'trash'
    priority?: 'low' | 'medium' | 'high' | 'urgent'
    release_id?: string
    record_type?: string
    record_id?: string
    assigned_to?: string
    image?: string
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
        if (!body.title || body.title.trim() === '') {
            throw createError({
                statusCode: 400,
                message: 'Title is required'
            })
        }

        // Validate category if provided
        if (body.category && !['admin', 'main', 'release'].includes(body.category)) {
            throw createError({
                statusCode: 400,
                message: 'Invalid category. Must be: admin, main, or release'
            })
        }

        // Validate status if provided
        if (body.status && !['idea', 'new', 'draft', 'final', 'reopen', 'trash'].includes(body.status)) {
            throw createError({
                statusCode: 400,
                message: 'Invalid status. Must be: idea, new, draft, final, reopen, or trash'
            })
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
                title, 
                description, 
                category,
                status,
                priority, 
                release_id,
                record_type, 
                record_id, 
                assigned_to,
                image,
                prompt,
                due_date,
                created_at,
                updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `)

        stmt.run(
            id,
            body.title.trim(),
            body.description || null,
            body.category || 'main',
            body.status || 'new',
            body.priority || 'medium',
            body.release_id || null,
            body.record_type || null,
            body.record_id || null,
            body.assigned_to || null,
            body.image || null,
            body.prompt || null,
            body.due_date || null,
            now,
            now
        )

        const task = await db.get('SELECT * FROM tasks WHERE id = ?', [id])

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
