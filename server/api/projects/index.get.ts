import { defineEventHandler, createError } from 'h3'
import db from '../../database/db'

// GET /api/projects - List all projects
export default defineEventHandler(async (event) => {

    try {
        // Check if projects table exists, if not create it
        const tableExists = db.prepare(`
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name='projects'
        `).get()

        if (!tableExists) {
            // Create projects table
            db.prepare(`
                CREATE TABLE projects (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    description TEXT,
                    status TEXT DEFAULT 'draft',
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
                )
            `).run()
        }

        // Get all projects ordered by created date
        const projects = db.prepare(`
            SELECT * FROM projects 
            ORDER BY created_at DESC
        `).all()

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
