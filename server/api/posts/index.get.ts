import { defineEventHandler, getQuery, createError } from 'h3'
import { db } from '../../database/init'

// GET /api/posts - List posts with optional filters
// After Migration 019 Chapter 5:
// - query.project accepts domaincode (TEXT)
// - posts.project stores numeric project id as TEXT
export default defineEventHandler(async (event) => {
    try {
        const query = getQuery(event)

        let sql = 'SELECT * FROM posts WHERE 1=1'
        const params: any[] = []

        // Filter by isbase
        if (query.isbase !== undefined) {
            sql += ' AND isbase = ?'
            params.push(Number(query.isbase))
        }

        // Filter by project (accepts domaincode, looks up numeric id)
        if (query.project) {
            // Lookup project numeric id by domaincode
            const project = await db.get('SELECT id FROM projects WHERE domaincode = ?', [query.project])
            if (project) {
                // posts.project stores numeric id as TEXT
                sql += ' AND project = ?'
                params.push(String(project.id))
            } else {
                // If project not found, return empty results
                return []
            }
        }

        sql += ' ORDER BY id'

        const posts = await db.all(sql, params)

        return posts
    } catch (error) {
        console.error('Error fetching posts:', error)
        throw createError({
            statusCode: 500,
            message: 'Failed to fetch posts'
        })
    }
})
