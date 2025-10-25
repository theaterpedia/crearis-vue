import { defineEventHandler, getQuery, createError } from 'h3'
import { db } from '../../database/init'

// GET /api/pages/by-type?project_id=<id>&page_type=<type>
// Get page by type and project
export default defineEventHandler(async (event) => {
    const query = getQuery(event)
    const { project_id, page_type } = query

    try {
        if (!project_id || !page_type) {
            throw createError({
                statusCode: 400,
                message: 'Both project_id and page_type are required'
            })
        }

        // Convert project_id to number
        const projectId = typeof project_id === 'string' ? parseInt(project_id, 10) : project_id
        if (isNaN(projectId as number)) {
            throw createError({
                statusCode: 400,
                message: 'Invalid project_id format'
            })
        }

        // Get page by project and type
        const page = await db.get(
            'SELECT * FROM pages WHERE project = ? AND page_type = ?',
            [projectId, page_type]
        )

        if (!page) {
            throw createError({
                statusCode: 404,
                message: `Page not found for project ${projectId} with type ${page_type}`
            })
        }

        return {
            success: true,
            page
        }
    } catch (error) {
        console.error('Error fetching page:', error)
        throw createError({
            statusCode: error instanceof Error && 'statusCode' in error ? (error as any).statusCode : 500,
            message: error instanceof Error ? error.message : 'Failed to fetch page'
        })
    }
})
