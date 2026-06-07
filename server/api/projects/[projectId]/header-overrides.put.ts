/**
 * PUT /api/projects/:projectId/header-overrides
 * 
 * Create or update a header config override for a project.
 * Body: { header_config_name, config_overrides }
 * 
 * Uses upsert to handle both create and update.
 */

import { defineEventHandler, getRouterParam, readBody, createError } from 'h3'
import { db } from '../../../database/init'

export default defineEventHandler(async (event) => {
    const projectId = getRouterParam(event, 'projectId')
    const body = await readBody(event)

    if (!projectId) {
        throw createError({
            statusCode: 400,
            message: 'Project ID is required'
        })
    }

    if (!body.header_config_name) {
        throw createError({
            statusCode: 400,
            message: 'header_config_name is required'
        })
    }

    try {
        // Verify the header config exists
        const configExists = await db.get(`
      SELECT id FROM header_configs WHERE name = $1
    `, [body.header_config_name])

        if (!configExists) {
            throw createError({
                statusCode: 404,
                message: `Header config '${body.header_config_name}' not found`
            })
        }

        // Verify project exists
        const projectExists = await db.get(`
      SELECT id FROM projects WHERE id = $1
    `, [projectId])

        if (!projectExists) {
            throw createError({
                statusCode: 404,
                message: `Project ${projectId} not found`
            })
        }

        const configJson = JSON.stringify(body.config_overrides || {})
        const isPostgres = db.type === 'postgresql'

        if (isPostgres) {
            // PostgreSQL upsert
            await db.run(`
        INSERT INTO project_header_overrides (project_id, header_config_name, config_overrides)
        VALUES ($1, $2, $3)
        ON CONFLICT (project_id, header_config_name) 
        DO UPDATE SET 
          config_overrides = EXCLUDED.config_overrides,
          updated_at = CURRENT_TIMESTAMP
      `, [projectId, body.header_config_name, configJson])
        } else {
            // SQLite upsert
            await db.run(`
        INSERT INTO project_header_overrides (project_id, header_config_name, config_overrides)
        VALUES ($1, $2, $3)
        ON CONFLICT (project_id, header_config_name) 
        DO UPDATE SET 
          config_overrides = excluded.config_overrides,
          updated_at = CURRENT_TIMESTAMP
      `, [projectId, body.header_config_name, configJson])
        }

        return {
            success: true,
            data: {
                project_id: projectId,
                header_config_name: body.header_config_name,
                config_overrides: body.config_overrides || {}
            }
        }
    } catch (error: any) {
        if (error.statusCode) throw error
        console.error('[PUT /api/projects/:projectId/header-overrides] Error:', error)
        throw createError({
            statusCode: 500,
            message: 'Failed to save project header override'
        })
    }
})
