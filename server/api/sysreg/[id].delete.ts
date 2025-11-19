/**
 * DELETE /api/sysreg/[id]
 * Delete a sysreg tag (if not default)
 */

import { defineEventHandler, getRouterParam, createError } from 'h3'
import { db } from '../../database/init'

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id')

    if (!id) {
        throw createError({
            statusCode: 400,
            message: 'Tag ID is required'
        })
    }

    try {
        // First, get the tag to check if it's default and which table it's in
        const getQuery = 'SELECT * FROM sysreg WHERE id = $1'
        const tag = await db.get(getQuery, [id])

        if (!tag) {
            throw createError({
                statusCode: 404,
                message: 'Tag not found'
            })
        }

        // Check if tag is default
        if (tag.is_default) {
            throw createError({
                statusCode: 403,
                message: 'Cannot delete default tags'
            })
        }

        const tableName = `sysreg_${tag.tagfamily}`

        // Check if tag is in use
        const usageChecks = {
            status: 'SELECT COUNT(*) FROM images WHERE status_val = $1',
            config: 'SELECT COUNT(*) FROM images WHERE (config_val & $1::bytea) = $1::bytea',
            rtags: 'SELECT COUNT(*) FROM images WHERE (rtags_val & $1::bytea) = $1::bytea',
            ctags: 'SELECT COUNT(*) FROM images WHERE (ctags_val & $1::bytea) = $1::bytea',
            ttags: 'SELECT COUNT(*) FROM images WHERE (ttags_val & $1::bytea) = $1::bytea',
            dtags: 'SELECT COUNT(*) FROM images WHERE (dtags_val & $1::bytea) = $1::bytea'
        }

        const usageQuery = usageChecks[tag.tagfamily as keyof typeof usageChecks]
        if (usageQuery) {
            const usageResult = await db.get(usageQuery, [tag.value])
            const usageCount = parseInt(usageResult.count)

            if (usageCount > 0) {
                throw createError({
                    statusCode: 409,
                    message: `Cannot delete tag: it is currently used by ${usageCount} image(s)`
                })
            }
        }

        // Delete the tag
        const deletedTag = await db.get(`SELECT * FROM ${tableName} WHERE id = $1`, [id])
        await db.run(`DELETE FROM ${tableName} WHERE id = $1`, [id])

        return {
            success: true,
            deleted: deletedTag
        }
    } catch (error: any) {
        console.error('Error deleting sysreg tag:', error)

        // Re-throw if it's already a createError
        if (error.statusCode) {
            throw error
        }

        throw createError({
            statusCode: 500,
            message: 'Failed to delete tag: ' + error.message
        })
    }
})
