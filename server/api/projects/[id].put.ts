import { defineEventHandler, readBody, getRouterParam, createError } from 'h3'
import { db } from '../../database/init'
import { getStatusIdByName } from '../../utils/status-helpers'
import type { ProjectsTableFields } from '../../types/database'

// PUT /api/projects/[id] - Update project
// After Migration 020 Chapter 3: Uses status_id (INTEGER FK to status table)
export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id')
    const body = await readBody(event)

    try {
        if (!id) {
            throw createError({
                statusCode: 400,
                message: 'Project ID is required'
            })
        }

        // Check if project exists by domaincode
        const existing = await db.get('SELECT * FROM projects WHERE domaincode = ?', [id])
        if (!existing) {
            throw createError({
                statusCode: 404,
                message: 'Project not found'
            })
        }

        const {
            domaincode: newDomaincode,
            name,
            heading,
            description,
            status,
            teaser,
            cimg,
            header_type,
            header_size,
            md,
            // Chapter 11: Page options
            page_background,
            page_cssvars,
            page_navigation,
            page_options_ext,
            // Chapter 11: Aside options
            aside_postit,
            aside_toc,
            aside_list,
            aside_context,
            aside_options_ext,
            // Chapter 11: Header options
            header_alert,
            header_postit,
            header_options_ext,
            // Chapter 11: Footer options
            footer_gallery,
            footer_postit,
            footer_slider,
            footer_repeat,
            footer_sitemap,
            footer_options_ext
        } = body as Partial<ProjectsTableFields> & { domaincode?: string; status?: string }

        // Reject attempts to change domaincode (immutable)
        if (newDomaincode !== undefined && newDomaincode !== id) {
            throw createError({
                statusCode: 400,
                message: 'Cannot change project domaincode (immutable)'
            })
        }

        // Build update data using ProjectsTableFields for type safety
        const updateData: Partial<ProjectsTableFields> = {}
        const updates: string[] = []
        const values: any[] = []

        // Allow updating name (project title/name)
        if (name !== undefined) {
            updateData.name = name
            updates.push('name = ?')
            values.push(updateData.name)
        }
        // Allow updating heading (kept for backward compat)
        if (heading !== undefined) {
            updateData.heading = heading
            updates.push('heading = ?')
            values.push(updateData.heading)
        }
        if (description !== undefined) {
            updateData.description = description
            updates.push('description = ?')
            values.push(updateData.description)
        }
        // Convert status name to status_id
        if (status !== undefined) {
            const statusId = getStatusIdByName(status, 'projects')
            if (!statusId) {
                throw createError({
                    statusCode: 400,
                    message: `Invalid status '${status}'. Must be a valid status name for projects.`
                })
            }
            updateData.status_id = statusId
            updates.push('status_id = ?')
            values.push(updateData.status_id)
        }
        if (teaser !== undefined) {
            updateData.teaser = teaser
            updates.push('teaser = ?')
            values.push(updateData.teaser)
        }
        if (cimg !== undefined) {
            updateData.cimg = cimg
            updates.push('cimg = ?')
            values.push(updateData.cimg)
        }
        if (header_type !== undefined) {
            updateData.header_type = header_type || null
            updates.push('header_type = ?')
            values.push(updateData.header_type)
        }
        if (header_size !== undefined) {
            // Convert empty string to null, validate against constraint
            const validSizes = ['small', 'medium', 'large']
            if (header_size && !validSizes.includes(header_size)) {
                throw createError({
                    statusCode: 400,
                    message: `Invalid header_size '${header_size}'. Must be one of: ${validSizes.join(', ')}`
                })
            }
            updateData.header_size = header_size || null
            updates.push('header_size = ?')
            values.push(updateData.header_size)
        }
        if (md !== undefined) {
            updateData.md = md
            updates.push('md = ?')
            values.push(updateData.md)
        }

        // Chapter 11: Page options
        if (page_background !== undefined) {
            updateData.page_background = page_background
            updates.push('page_background = ?')
            values.push(updateData.page_background)
        }
        if (page_cssvars !== undefined) {
            updateData.page_cssvars = page_cssvars
            updates.push('page_cssvars = ?')
            values.push(updateData.page_cssvars)
        }
        if (page_navigation !== undefined) {
            updateData.page_navigation = page_navigation
            updates.push('page_navigation = ?')
            values.push(updateData.page_navigation)
        }
        if (page_options_ext !== undefined) {
            updateData.page_options_ext = page_options_ext
            updates.push('page_options_ext = ?')
            values.push(JSON.stringify(updateData.page_options_ext))
        }

        // Chapter 11: Aside options
        if (aside_postit !== undefined) {
            updateData.aside_postit = aside_postit
            updates.push('aside_postit = ?')
            values.push(JSON.stringify(updateData.aside_postit))
        }
        if (aside_toc !== undefined) {
            updateData.aside_toc = aside_toc
            updates.push('aside_toc = ?')
            values.push(updateData.aside_toc)
        }
        if (aside_list !== undefined) {
            updateData.aside_list = aside_list
            updates.push('aside_list = ?')
            values.push(updateData.aside_list)
        }
        if (aside_context !== undefined) {
            updateData.aside_context = aside_context
            updates.push('aside_context = ?')
            values.push(updateData.aside_context)
        }
        if (aside_options_ext !== undefined) {
            updateData.aside_options_ext = aside_options_ext
            updates.push('aside_options_ext = ?')
            values.push(JSON.stringify(updateData.aside_options_ext))
        }

        // Chapter 11: Header options
        if (header_alert !== undefined) {
            updateData.header_alert = header_alert
            updates.push('header_alert = ?')
            values.push(updateData.header_alert)
        }
        if (header_postit !== undefined) {
            updateData.header_postit = header_postit
            updates.push('header_postit = ?')
            values.push(JSON.stringify(updateData.header_postit))
        }
        if (header_options_ext !== undefined) {
            updateData.header_options_ext = header_options_ext
            updates.push('header_options_ext = ?')
            values.push(JSON.stringify(updateData.header_options_ext))
        }

        // Chapter 11: Footer options
        if (footer_gallery !== undefined) {
            updateData.footer_gallery = footer_gallery
            updates.push('footer_gallery = ?')
            values.push(updateData.footer_gallery)
        }
        if (footer_postit !== undefined) {
            updateData.footer_postit = footer_postit
            updates.push('footer_postit = ?')
            values.push(JSON.stringify(updateData.footer_postit))
        }
        if (footer_slider !== undefined) {
            updateData.footer_slider = footer_slider
            updates.push('footer_slider = ?')
            values.push(updateData.footer_slider)
        }
        if (footer_repeat !== undefined) {
            updateData.footer_repeat = footer_repeat
            updates.push('footer_repeat = ?')
            values.push(JSON.stringify(updateData.footer_repeat))
        }
        if (footer_sitemap !== undefined) {
            updateData.footer_sitemap = footer_sitemap
            updates.push('footer_sitemap = ?')
            values.push(updateData.footer_sitemap)
        }
        if (footer_options_ext !== undefined) {
            updateData.footer_options_ext = footer_options_ext
            updates.push('footer_options_ext = ?')
            values.push(JSON.stringify(updateData.footer_options_ext))
        }

        if (updates.length === 0) {
            throw createError({
                statusCode: 400,
                message: 'No fields to update'
            })
        }

        updates.push('updated_at = CURRENT_TIMESTAMP')
        values.push(id)

        const stmt = db.prepare(`
            UPDATE projects 
            SET ${updates.join(', ')}
            WHERE domaincode = ?
        `)

        stmt.run(...values)

        // Return updated project
        const rawProject = await db.get('SELECT * FROM projects WHERE domaincode = ?', [id])

        return {
            success: true,
            project: rawProject
        }
    } catch (error) {
        console.error('Error updating project:', error)
        throw createError({
            statusCode: 500,
            message: error instanceof Error ? error.message : 'Failed to update project'
        })
    }
})
