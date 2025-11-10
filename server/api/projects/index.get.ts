import { defineEventHandler, createError } from 'h3'
import { db } from '../../database/init'

// GET /api/projects - List all projects
// After Migration 019 Chapter 5: Returns projects with proper field structure
// - id: auto-increment INTEGER
// - domaincode: unique TEXT identifier
// - name: project title/display name
// - heading: legacy field for backward compatibility
export default defineEventHandler(async (event) => {

    try {
        // Get all projects ordered by created date
        const rawProjects = await db.all(`
            SELECT * FROM projects 
            ORDER BY created_at DESC
        `)

        // Return projects array directly (consistent with events/posts/instructors)
        return rawProjects
    } catch (error) {
        console.error('Error fetching projects:', error)
        throw createError({
            statusCode: 500,
            message: 'Failed to fetch projects'
        })
    }
})
