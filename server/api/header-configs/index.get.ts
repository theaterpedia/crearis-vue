/**
 * GET /api/header-configs
 * 
 * Returns all central header configurations.
 * Optional query params:
 * - parent_type: Filter by Odoo base type (simple, columns, banner, cover, bauchbinde)
 * - include_project: Project ID to include merged project overrides
 */

import { defineEventHandler, getQuery } from 'h3'
import { db } from '../../database/init'

export default defineEventHandler(async (event) => {
    const query = getQuery(event)
    const parentType = query.parent_type as string | undefined
    const projectId = query.project_id as string | undefined

    try {
        let sql = `
      SELECT 
        hc.id,
        hc.name,
        hc.parent_type,
        hc.theme_id,
        hc.is_default,
        hc.config,
        hc.label_de,
        hc.label_en,
        hc.description,
        hc.sort_order
      FROM header_configs hc
    `
        const params: any[] = []

        if (parentType) {
            sql += ` WHERE hc.parent_type = $1`
            params.push(parentType)
        }

        sql += ` ORDER BY hc.parent_type, hc.sort_order, hc.name`

        const configs = await db.all(sql, params)

        // Parse config JSON for SQLite
        const parsedConfigs = configs.map((c: any) => ({
            ...c,
            config: typeof c.config === 'string' ? JSON.parse(c.config) : c.config
        }))

        // If project_id provided, merge in project overrides
        if (projectId) {
            const overrides = await db.all(`
        SELECT header_config_name, config_overrides
        FROM project_header_overrides
        WHERE project_id = $1
      `, [projectId])

            const overrideMap = new Map(
                overrides.map((o: any) => [
                    o.header_config_name,
                    typeof o.config_overrides === 'string'
                        ? JSON.parse(o.config_overrides)
                        : o.config_overrides
                ])
            )

            // Merge overrides into configs
            for (const cfg of parsedConfigs) {
                const override = overrideMap.get(cfg.name)
                if (override) {
                    cfg.config = { ...cfg.config, ...override }
                    cfg.has_project_override = true
                }
            }
        }

        return {
            success: true,
            data: parsedConfigs,
            parent_types: ['simple', 'columns', 'banner', 'cover', 'bauchbinde']
        }
    } catch (error) {
        console.error('[GET /api/header-configs] Error:', error)
        return {
            success: false,
            error: 'Failed to fetch header configs'
        }
    }
})
