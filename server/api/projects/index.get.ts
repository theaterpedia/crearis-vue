import { defineEventHandler, createError } from 'h3'
import { db } from '../../database/db-new'

// GET /api/projects - List all projects
export default defineEventHandler(async (event) => {

    try {
        // Get all projects ordered by created date (table will be created by initDatabase)
        const projects = await db.all(`
            SELECT * FROM projects 
            ORDER BY created_at DESC
        `)

        return {
            projects,
            count: projects.length
        }
    } catch (error) {
        console.error('Error fetching projects:', error)
        throw createError({
            statusCode: 500,
            message: 'Failed to fetch projects'
        })
    }
})
