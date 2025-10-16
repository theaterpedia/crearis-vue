import { defineEventHandler, getQuery, createError } from 'h3'
import { db } from '../../database/init'

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

        // Filter by project
        if (query.project) {
            sql += ' AND project = ?'
            params.push(query.project)
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
