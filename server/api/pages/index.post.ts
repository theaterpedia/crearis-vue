import { defineEventHandler, readBody, createError } from 'h3'
import { db } from '../../database/init'
import type { PagesTableFields } from '../../types/database'

// POST /api/pages - Create new page
export default defineEventHandler(async (event) => {
    const body = await readBody(event) as Partial<PagesTableFields> & { project_id?: number }

    try {
        const {
            project,
            project_id,
            page_type,
            header_type,
            header_size,
            page_options,
            header_options,
            aside_options,
            footer_options
        } = body

        // Use project_id or project field
        const projectValue = project_id || project
        if (!projectValue) {
            throw createError({
                statusCode: 400,
                message: 'Project ID is required'
            })
        }

        if (!page_type) {
            throw createError({
                statusCode: 400,
                message: 'Page type is required'
            })
        }

        // Check if page already exists for this project and type
        const existing = await db.get(
            'SELECT id FROM pages WHERE project = ? AND page_type = ?',
            [projectValue, page_type]
        )

        if (existing) {
            throw createError({
                statusCode: 409,
                message: `Page already exists for project ${projectValue} with type ${page_type}`
            })
        }

        // Prepare page data
        const pageData: Partial<PagesTableFields> = {
            project: projectValue,
            page_type,
            header_type: header_type || 'simple',
            header_size: header_size || 'mini',
            page_options: page_options || {},
            header_options: header_options || {},
            aside_options: aside_options || {},
            footer_options: footer_options || {}
        }

        // Insert page
        const stmt = db.prepare(`
            INSERT INTO pages (
                project, 
                page_type, 
                header_type,
                header_size,
                page_options,
                header_options,
                aside_options,
                footer_options
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `)

        const result = stmt.run(
            pageData.project,
            pageData.page_type,
            pageData.header_type,
            pageData.header_size,
            JSON.stringify(pageData.page_options),
            JSON.stringify(pageData.header_options),
            JSON.stringify(pageData.aside_options),
            JSON.stringify(pageData.footer_options)
        )

        // Get the created page
        const page = await db.get(
            'SELECT * FROM pages WHERE project = ? AND page_type = ?',
            [projectValue, page_type]
        )

        return {
            success: true,
            page
        }
    } catch (error) {
        console.error('Error creating page:', error)
        throw createError({
            statusCode: error instanceof Error && 'statusCode' in error ? (error as any).statusCode : 500,
            message: error instanceof Error ? error.message : 'Failed to create page'
        })
    }
})
