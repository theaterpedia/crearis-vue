import { defineEventHandler, getQuery, createError } from 'h3'
import db from '../../database/db'

interface Task {
    id: string
    title: string
    description?: string
    status: 'todo' | 'in-progress' | 'done' | 'archived'
    priority: 'low' | 'medium' | 'high' | 'urgent'
    record_type?: string
    record_id?: string
    assigned_to?: string
    created_at: string
    updated_at: string
    due_date?: string
    completed_at?: string
    version_id?: string
}

export default defineEventHandler((event) => {
    try {
        const query = getQuery(event)
        const status = query.status as string | undefined
        const recordType = query.record_type as string | undefined
        const recordId = query.record_id as string | undefined

        let sql = 'SELECT * FROM tasks WHERE 1=1'
        const params: any[] = []

        if (status) {
            sql += ' AND status = ?'
            params.push(status)
        }

        if (recordType) {
            sql += ' AND record_type = ?'
            params.push(recordType)
        }

        if (recordId) {
            sql += ' AND record_id = ?'
            params.push(recordId)
        }

        sql += ' ORDER BY CASE priority WHEN \'urgent\' THEN 1 WHEN \'high\' THEN 2 WHEN \'medium\' THEN 3 WHEN \'low\' THEN 4 END, created_at DESC'

        const tasks = db.prepare(sql).all(...params) as Task[]

        return {
            success: true,
            tasks,
            counts: {
                total: tasks.length,
                todo: tasks.filter(t => t.status === 'todo').length,
                inProgress: tasks.filter(t => t.status === 'in-progress').length,
                done: tasks.filter(t => t.status === 'done').length,
                archived: tasks.filter(t => t.status === 'archived').length
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
