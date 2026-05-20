/**
 * GET /api/projects/:projectId/header-overrides
 * 
 * Returns all header config overrides for a specific project.
 */

import { defineEventHandler, getRouterParam, createError } from 'h3'
import { db } from '../../../database/init'

export default defineEventHandler(async (event) => {
    const projectId = getRouterParam(event, 'projectId')

    if (!projectId) {
        throw createError({
            statusCode: 400,
            message: 'Project ID is required'
        })
    }

    try {
        const overrides = await db.all(`
      SELECT 
        pho.id,
        pho.header_config_name,
        pho.config_overrides,
        pho.created_at,
        pho.updated_at,
        hc.parent_type,
        hc.label_de,
        hc.label_en
      FROM project_header_overrides pho
      JOIN header_configs hc ON hc.name = pho.header_config_name
      WHERE pho.project_id = $1
      ORDER BY hc.parent_type, pho.header_config_name
    `, [projectId])

        // Parse JSON for SQLite
        const parsed = overrides.map((o: any) => ({
            ...o,
            config_overrides: typeof o.config_overrides === 'string'
                ? JSON.parse(o.config_overrides)
                : o.config_overrides
        }))

        return {
            success: true,
            project_id: projectId,
            data: parsed
        }
    } catch (error) {
        console.error('[GET /api/projects/:projectId/header-overrides] Error:', error)
        throw createError({
            statusCode: 500,
            message: 'Failed to fetch project header overrides'
        })
    }
})
