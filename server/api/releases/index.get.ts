import { defineEventHandler, getQuery, createError } from 'h3'
import { db } from '../../database/db-new'

interface Release {
    id: string
    version: string
    version_major: number
    version_minor: number
    description?: string
    state: 'idea' | 'draft' | 'final' | 'trash'
    release_date?: string
    created_at: string
    updated_at: string
    task_count?: number
}

export default defineEventHandler(async (event) => {
    try {
        const query = getQuery(event)
        const state = query.state as string | undefined

        // Build query with task count
        let sql = `
            SELECT 
                releases.*,
                COUNT(tasks.id) as task_count
            FROM releases
            LEFT JOIN tasks ON tasks.release_id = releases.id
            WHERE 1=1
        `
        const params: any[] = []

        if (state) {
            sql += ' AND releases.state = ?'
            params.push(state)
        }

        sql += ' GROUP BY releases.id'
        sql += ' ORDER BY releases.version_major ASC, releases.version_minor ASC'

        const releases = await db.all(sql, params) as Release[]

        return {
            success: true,
            releases,
            counts: {
                total: releases.length,
                idea: releases.filter(r => r.state === 'idea').length,
                draft: releases.filter(r => r.state === 'draft').length,
                final: releases.filter(r => r.state === 'final').length,
                trash: releases.filter(r => r.state === 'trash').length
            }
        }
    } catch (error) {
        throw createError({
            statusCode: 500,
            message: 'Failed to fetch releases',
            data: error
        })
    }
})
