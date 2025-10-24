import { defineEventHandler, createError } from 'h3'
import { db } from '../../database/init'
import type { I18nCodesTableFields } from '../../types/database'

/**
 * DELETE /api/i18n/[id]
 * 
 * Delete an i18n code entry
 */
export default defineEventHandler(async (event) => {
    try {
        const id = event.context.params?.id

        if (!id || isNaN(Number(id))) {
            throw createError({
                statusCode: 400,
                message: 'Valid ID is required'
            })
        }

        // Check if entry exists
        const existing = db.prepare('SELECT * FROM i18n_codes WHERE id = ?').get(Number(id)) as I18nCodesTableFields | undefined

        if (!existing) {
            throw createError({
                statusCode: 404,
                message: `i18n code with id=${id} not found`
            })
        }

        // Delete the entry
        const result = db.prepare('DELETE FROM i18n_codes WHERE id = ?').run(Number(id))

        return {
            success: true,
            message: `i18n code with id=${id} deleted successfully`,
            deleted: existing
        }
    } catch (error: any) {
        console.error('Error deleting i18n code:', error)

        if (error.statusCode) {
            throw error
        }

        throw createError({
            statusCode: 500,
            message: `Failed to delete i18n code: ${error.message}`
        })
    }
})
