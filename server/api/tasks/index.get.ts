import { defineEventHandler, getQuery, createError } from 'h3'
import { db } from '../../database/init'

interface Task {
    id: string
    title: string
    description?: string
    category: 'admin' | 'main' | 'release'
    status: 'idea' | 'new' | 'draft' | 'final' | 'reopen' | 'trash'
    priority: 'low' | 'medium' | 'high' | 'urgent'
    release_id?: string
    record_type?: string
    record_id?: string
    assigned_to?: string
    image?: string
    prompt?: string
    created_at: string
    updated_at: string
    due_date?: string
    completed_at?: string
    entity_name?: string
    display_title?: string
}

export default defineEventHandler(async (event) => {
    try {
        const query = getQuery(event)
        const status = query.status as string | undefined
        const category = query.category as string | undefined
        const releaseId = query.release_id as string | undefined
        const recordType = query.record_type as string | undefined
        const recordId = query.record_id as string | undefined

        // Build query with entity joins for title inheritance
        let sql = `
            SELECT 
                tasks.*,
                CASE tasks.record_type
                    WHEN 'event' THEN events.name
                    WHEN 'post' THEN posts.name
                    WHEN 'location' THEN locations.name
                    WHEN 'instructor' THEN instructors.name
                    WHEN 'participant' THEN participants.name
                END as entity_name,
                CASE 
                    WHEN tasks.title = '{{main-title}}' THEN 
                        COALESCE(
                            CASE tasks.record_type
                                WHEN 'event' THEN events.name || ' - Main Task'
                                WHEN 'post' THEN posts.name || ' - Main Task'
                                WHEN 'location' THEN locations.name || ' - Main Task'
                                WHEN 'instructor' THEN instructors.name || ' - Main Task'
                                WHEN 'participant' THEN participants.name || ' - Main Task'
                            END,
                            tasks.title
                        )
                    ELSE tasks.title
                END as display_title
            FROM tasks
            LEFT JOIN events ON tasks.record_type = 'event' AND tasks.record_id = events.id
            LEFT JOIN posts ON tasks.record_type = 'post' AND tasks.record_id = posts.id
            LEFT JOIN locations ON tasks.record_type = 'location' AND tasks.record_id = locations.id
            LEFT JOIN instructors ON tasks.record_type = 'instructor' AND tasks.record_id = instructors.id
            LEFT JOIN participants ON tasks.record_type = 'participant' AND tasks.record_id = participants.id
            WHERE 1=1
        `
        const params: any[] = []

        if (status) {
            sql += ' AND tasks.status = ?'
            params.push(status)
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
                idea: tasks.filter(t => t.status === 'idea').length,
                new: tasks.filter(t => t.status === 'new').length,
                draft: tasks.filter(t => t.status === 'draft').length,
                final: tasks.filter(t => t.status === 'final').length,
                reopen: tasks.filter(t => t.status === 'reopen').length,
                trash: tasks.filter(t => t.status === 'trash').length,
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
