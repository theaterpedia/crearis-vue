/**
 * Delete a page entry
 * DELETE /api/pages/:id
 */
import { defineEventHandler, createError } from 'h3'
import { useDatabase } from '../../database'

export default defineEventHandler(async (event) => {
    const id = event.context.params?.id

    if (!id) {
        throw createError({
            statusCode: 400,
            message: 'Page ID is required'
        })
    }

    const db = useDatabase()

    // Check if page exists
    const existing = await db.get(
        'SELECT id, page_type FROM pages WHERE id = ?',
        [id]
    )

    if (!existing) {
        throw createError({
            statusCode: 404,
            message: 'Page not found'
        })
    }

    // Delete the page
    await db.run('DELETE FROM pages WHERE id = ?', [id])

    return {
        success: true,
        message: `Page deleted successfully`
    }
})
