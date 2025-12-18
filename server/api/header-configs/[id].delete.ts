/**
 * DELETE /api/header-configs/:id
 * 
 * Delete a header configuration.
 * Cannot delete global default configs (is_default = true AND theme_id IS NULL).
 * Theme-specific configs CAN be deleted even if is_default = true.
 */

import { defineEventHandler, createError, getRouterParam } from 'h3'
import { db } from '../../database/init'

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id')

    if (!id) {
        throw createError({
            statusCode: 400,
            message: 'Config ID is required'
        })
    }

    try {
        // Check if it's a default config
        const config = await db.get(`
      SELECT id, name, is_default, theme_id FROM header_configs WHERE id = $1
    `, [id])

        if (!config) {
            throw createError({
                statusCode: 404,
                message: `Header config ${id} not found`
            })
        }

        // Only block deletion of GLOBAL defaults (is_default=true AND no theme_id)
        // Theme-specific configs can be deleted even if is_default=true
        const isGlobalDefault = (config as any).is_default && (config as any).theme_id === null
        if (isGlobalDefault) {
            throw createError({
                statusCode: 403,
                message: 'Cannot delete global default header configs'
            })
        }

        // Delete any project overrides first
        await db.run(`
      DELETE FROM project_header_overrides 
      WHERE header_config_name = $1
    `, [(config as any).name])

        // Delete the config
        await db.run(`DELETE FROM header_configs WHERE id = $1`, [id])

        return {
            success: true,
            message: `Header config '${(config as any).name}' deleted`
        }
    } catch (error: any) {
        if (error.statusCode) throw error
        console.error('[DELETE /api/header-configs/:id] Error:', error)
        throw createError({
            statusCode: 500,
            message: 'Failed to delete header config'
        })
    }
})
