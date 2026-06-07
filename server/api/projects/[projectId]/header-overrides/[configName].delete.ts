/**
 * DELETE /api/projects/:projectId/header-overrides/:configName
 * 
 * Remove a header config override for a project.
 * This reverts to using the central config for that header type.
 */

import { defineEventHandler, getRouterParam, createError } from 'h3'
import { db } from '../../../../database/init'

export default defineEventHandler(async (event) => {
    const projectId = getRouterParam(event, 'projectId')
    const configName = getRouterParam(event, 'configName')

    if (!projectId || !configName) {
        throw createError({
            statusCode: 400,
            message: 'Project ID and config name are required'
        })
    }

    try {
        const result = await db.run(`
      DELETE FROM project_header_overrides 
      WHERE project_id = $1 AND header_config_name = $2
    `, [projectId, configName])

        const changes = (result as any).changes ?? (result as any).rowCount ?? 0

        if (changes === 0) {
            throw createError({
                statusCode: 404,
                message: `Override for '${configName}' not found in project ${projectId}`
            })
        }

        return {
            success: true,
            message: `Override '${configName}' removed from project ${projectId}`
        }
    } catch (error: any) {
        if (error.statusCode) throw error
        console.error('[DELETE /api/projects/:projectId/header-overrides/:configName] Error:', error)
        throw createError({
            statusCode: 500,
            message: 'Failed to delete project header override'
        })
    }
})
