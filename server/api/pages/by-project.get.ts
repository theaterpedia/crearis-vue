/**
 * Get all pages for a project
 * GET /api/pages/by-project?project_id=<id>
 */
import { defineEventHandler, getQuery, createError } from 'h3'
import { db } from '../../database/init'

export default defineEventHandler(async (event) => {
    const query = getQuery(event)
    const { project_id } = query

    if (!project_id) {
        throw createError({
            statusCode: 400,
            message: 'project_id is required'
        })
    }

    // Support both numeric ID and domaincode
    let projectId: number
    if (isNaN(Number(project_id))) {
        // It's a domaincode, look up the project
        const project = await db.get<{ id: number }>(
            'SELECT id FROM projects WHERE domaincode = ?',
            [project_id]
        )
        if (!project) {
            throw createError({
                statusCode: 404,
                message: `Project not found: ${project_id}`
            })
        }
        projectId = project.id
    } else {
        projectId = Number(project_id)
    }

    const pages = await db.all(
        'SELECT * FROM pages WHERE project = ? ORDER BY page_type',
        [projectId]
    )

    return {
        success: true,
        pages: pages || []
    }
})
