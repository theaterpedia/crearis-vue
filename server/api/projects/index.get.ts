import { defineEventHandler, createError } from 'h3'
import { db } from '../../database/init'

// GET /api/projects - List all projects
export default defineEventHandler(async (event) => {

    try {
        // Get all projects ordered by created date (table will be created by initDatabase)
        const rawProjects = await db.all(`
            SELECT * FROM projects 
            ORDER BY created_at DESC
        `)

        // Map to frontend format: id as 'name', keep heading as 'heading'
        const projects = rawProjects.map((p: any) => ({
            ...p,
            name: p.id  // Frontend 'name' = database 'id' (domaincode)
        }))

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
