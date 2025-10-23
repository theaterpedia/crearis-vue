import { defineEventHandler, getQuery, createError } from 'h3'
import { db } from '../../database/init'

// GET /api/posts - List posts with optional filters
// After Migration 019 Chapter 3B:
// - posts.id is now INTEGER (auto-increment)
// - posts.xmlid stores old TEXT id
// - posts.project_id stores INTEGER FK to projects.id
// - query.project accepts domaincode (TEXT) for filtering
// - response includes domaincode from joined projects table
export default defineEventHandler(async (event) => {
    try {
        const query = getQuery(event)

        let sql = `
            SELECT 
                p.*,
                pr.domaincode AS domaincode
            FROM posts p
            LEFT JOIN projects pr ON p.project_id = pr.id
            WHERE 1=1
        `
        const params: any[] = []

        // Filter by isbase (if this field exists)
        if (query.isbase !== undefined) {
            sql += ' AND p.isbase = ?'
            params.push(Number(query.isbase))
        }

        // Filter by project (accepts domaincode, looks up project_id)
        if (query.project) {
            // Lookup project id by domaincode
            const project = await db.get('SELECT id FROM projects WHERE domaincode = ?', [query.project])
            if (project) {
                sql += ' AND p.project_id = ?'
                params.push(project.id)
            } else {
                // If project not found, return empty results
                return []
            }
        }

        sql += ' ORDER BY p.id'

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
