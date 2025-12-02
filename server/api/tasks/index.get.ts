import { defineEventHandler, getQuery, createError } from 'h3'
import { db } from '../../database/init'

// After Migration 019 Chapter 6 & Migration 020:
// - tasks.title → tasks.name
// - tasks.image → tasks.cimg
// - tasks.status (TEXT) → tasks.status_id (INTEGER FK to status table)
// - Added tasks.lang and tasks.status_display (computed)
interface Task {
    id: string
    name: string  // Renamed from title
    description?: string
    category: 'admin' | 'main' | 'release'
    status_id: number  // INTEGER FK to status table
    status_value: number  // Status value (0, 1, 2, 4, 5, 8, 16)
    status_name: string  // Status name (new, idea, draft, active, final, reopen, trash)
    status_display: string  // Translated status name based on task's lang
    lang: string  // Language for this task (de, en, cz)
    priority: 'low' | 'medium' | 'high' | 'urgent'
    release_id?: string
    record_type?: string
    record_id?: string
    assigned_to?: string
    cimg?: string  // Renamed from image
    prompt?: string
    created_at: string
    updated_at: string
    due_date?: string
    completed_at?: string
    entity_name?: string
    display_title?: string
    entity_image?: string
}

interface ApiResponse {
    tasks: Task[]
    count: number
}

export default defineEventHandler(async (event) => {
    try {
        const query = getQuery(event)
        const statusFilter = query.status as string | undefined
        const category = query.category as string | undefined
        const releaseId = query.release_id as string | undefined
        const recordType = query.record_type as string | undefined
        const recordId = query.record_id as string | undefined

        // Build query with entity joins for title inheritance and image fallback
        // Join with status table to get status_value, status_name
        // tasks.status_display is computed column (from Migration 020)
        let sql = `
            SELECT 
                tasks.*,
                status.value as status_value,
                status.name as status_name,
                CASE tasks.record_type
                    WHEN 'event' THEN events.name
                    WHEN 'post' THEN posts.name
                    WHEN 'location' THEN locations.name
                    WHEN 'instructor' THEN instructors.name
                    WHEN 'participant' THEN participants.name
                END as entity_name,
                CASE 
                    WHEN tasks.name = '{{main-title}}' THEN 
                        COALESCE(
                            CASE tasks.record_type
                                WHEN 'event' THEN events.name || ' - Main Task'
                                WHEN 'post' THEN posts.name || ' - Main Task'
                                WHEN 'location' THEN locations.name || ' - Main Task'
                                WHEN 'instructor' THEN instructors.name || ' - Main Task'
                                WHEN 'participant' THEN participants.name || ' - Main Task'
                            END,
                            tasks.name
                        )
                    ELSE tasks.name
                END as display_title,
                COALESCE(
                    tasks.cimg,
                    CASE tasks.record_type
                        WHEN 'event' THEN events.cimg
                        WHEN 'post' THEN posts.cimg
                        WHEN 'location' THEN locations.cimg
                        WHEN 'instructor' THEN instructors.cimg
                        WHEN 'participant' THEN participants.cimg
                    END
                ) as entity_image
            FROM tasks
            LEFT JOIN sysreg_status as status ON tasks.status = status.value
            LEFT JOIN events ON tasks.record_type = 'event' AND tasks.record_id = events.id
            LEFT JOIN posts ON tasks.record_type = 'post' AND tasks.record_id = posts.id
            LEFT JOIN locations ON tasks.record_type = 'location' AND tasks.record_id = locations.id
            LEFT JOIN instructors ON tasks.record_type = 'instructor' AND tasks.record_id = instructors.id
            LEFT JOIN participants ON tasks.record_type = 'participant' AND tasks.record_id = participants.id
            WHERE 1=1
        `
        const params: any[] = []

        // Filter by status name if provided
        if (statusFilter) {
            sql += ' AND status.name = ?'
            params.push(statusFilter)
        }

        if (category) {
            sql += ' AND tasks.category = ?'
            params.push(category)
        }

        if (releaseId) {
            sql += ' AND tasks.release_id = ?'
            params.push(releaseId)
        }

        if (recordType) {
            sql += ' AND tasks.record_type = ?'
            params.push(recordType)
        }

        if (recordId) {
            sql += ' AND tasks.record_id = ?'
            params.push(recordId)
        }

        sql += ` ORDER BY 
            CASE tasks.priority 
                WHEN 'urgent' THEN 1 
                WHEN 'high' THEN 2 
                WHEN 'medium' THEN 3 
                WHEN 'low' THEN 4 
            END, 
            tasks.created_at DESC`

        const tasks = await db.all(sql, params) as Task[]

        return {
            success: true,
            tasks,
            counts: {
                total: tasks.length,
                idea: tasks.filter(t => t.status_name === 'idea').length,
                new: tasks.filter(t => t.status_name === 'new').length,
                draft: tasks.filter(t => t.status_name === 'draft').length,
                active: tasks.filter(t => t.status_name === 'active').length,
                final: tasks.filter(t => t.status_name === 'final').length,
                reopen: tasks.filter(t => t.status_name === 'reopen').length,
                trash: tasks.filter(t => t.status_name === 'trash').length,
                byCategory: {
                    admin: tasks.filter(t => t.category === 'admin').length,
                    main: tasks.filter(t => t.category === 'main').length,
                    release: tasks.filter(t => t.category === 'release').length
                }
            }
        }
    } catch (error) {
        throw createError({
            statusCode: 500,
            message: 'Failed to fetch tasks',
            data: error
        })
    }
})
