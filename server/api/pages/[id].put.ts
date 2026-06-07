import { defineEventHandler, readBody, getRouterParam, createError } from 'h3'
import { db } from '../../database/init'
import type { PagesTableFields } from '../../types/database'

// PUT /api/pages/[id] - Update page
export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id')
    const body = await readBody(event) as Partial<PagesTableFields>

    try {
        if (!id) {
            throw createError({
                statusCode: 400,
                message: 'Page ID is required'
            })
        }

        // Check if page exists
        const existing = await db.get('SELECT * FROM pages WHERE id = ?', [id])
        if (!existing) {
            throw createError({
                statusCode: 404,
                message: 'Page not found'
            })
        }

        const {
            header_type,
            header_size,
            page_options,
            header_options,
            aside_options,
            footer_options
        } = body

        // Build update data
        const updates: string[] = []
        const values: any[] = []

        if (header_type !== undefined) {
            updates.push('header_type = ?')
            values.push(header_type)
        }
        if (header_size !== undefined) {
            updates.push('header_size = ?')
            values.push(header_size)
        }
        if (page_options !== undefined) {
            updates.push('page_options = ?')
            values.push(JSON.stringify(page_options))
        }
        if (header_options !== undefined) {
            updates.push('header_options = ?')
            values.push(JSON.stringify(header_options))
        }
        if (aside_options !== undefined) {
            updates.push('aside_options = ?')
            values.push(JSON.stringify(aside_options))
        }
        if (footer_options !== undefined) {
            updates.push('footer_options = ?')
            values.push(JSON.stringify(footer_options))
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
            UPDATE pages 
            SET ${updates.join(', ')}
            WHERE id = ?
        `)

        stmt.run(...values)

        // Return updated page
        const page = await db.get('SELECT * FROM pages WHERE id = ?', [id])

        return {
            success: true,
            page
        }
    } catch (error) {
        console.error('Error updating page:', error)
        throw createError({
            statusCode: error instanceof Error && 'statusCode' in error ? (error as any).statusCode : 500,
            message: error instanceof Error ? error.message : 'Failed to update page'
        })
    }
})
