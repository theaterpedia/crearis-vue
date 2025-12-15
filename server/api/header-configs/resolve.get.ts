/**
 * GET /api/header-configs/resolve
 * 
 * Resolves the complete header config for an entity.
 * This is the main query used by PageHeading.vue on /sites routes.
 * 
 * Query params:
 * - header_type: Base Odoo type (required)
 * - header_subtype: Subcategory name e.g., 'cover.dramatic' (optional)
 * - project_id: Project ID for overrides (optional, for /sites routes)
 * 
 * Returns merged config: base → subcategory → project_override
 */

import { defineEventHandler, getQuery, createError } from 'h3'
import { db } from '../../database/init'

const VALID_PARENT_TYPES = ['simple', 'columns', 'banner', 'cover', 'bauchbinde']

// Base configs matching PageHeading.vue headerTypes[] array
const BASE_CONFIGS: Record<string, any> = {
    simple: {
        id: 0,
        name: 'simple',
        headerSize: 'mini',
        allowedSizes: [],
        isFullWidth: false,
        contentAlignY: 'center',
        imgTmpAlignX: 'center',
        imgTmpAlignY: 'center',
        backgroundCorrection: 'none',
        phoneBanner: false,
        contentInBanner: false,
        gradientType: 'none',
        gradientDepth: 1.0
    },
    columns: {
        id: 1,
        name: 'columns',
        headerSize: 'prominent',
        allowedSizes: [],
        isFullWidth: false,
        contentAlignY: 'center',
        imgTmpAlignX: 'center',
        imgTmpAlignY: 'center',
        backgroundCorrection: 'none',
        phoneBanner: false,
        contentInBanner: false,
        gradientType: 'none',
        gradientDepth: 1.0
    },
    banner: {
        id: 2,
        name: 'banner',
        headerSize: 'medium',
        allowedSizes: ['prominent', 'medium', 'mini'],
        isFullWidth: false,
        contentAlignY: 'top',
        imgTmpAlignX: 'center',
        imgTmpAlignY: 'top',
        backgroundCorrection: 1,
        phoneBanner: false,
        contentInBanner: false,
        gradientType: 'left-bottom',
        gradientDepth: 0.6
    },
    cover: {
        id: 3,
        name: 'cover',
        headerSize: 'prominent',
        allowedSizes: ['prominent', 'full'],
        isFullWidth: false,
        contentAlignY: 'bottom',
        imgTmpAlignX: 'cover',
        imgTmpAlignY: 'center',
        backgroundCorrection: 1,
        phoneBanner: true,
        contentInBanner: false,
        gradientType: 'left-bottom',
        gradientDepth: 0.6
    },
    bauchbinde: {
        id: 4,
        name: 'bauchbinde',
        headerSize: 'prominent',
        allowedSizes: ['prominent', 'full'],
        isFullWidth: true,
        contentAlignY: 'bottom',
        imgTmpAlignX: 'cover',
        imgTmpAlignY: 'center',
        backgroundCorrection: 'none',
        phoneBanner: false,
        contentType: 'left',
        contentWidth: 'fixed',
        contentInBanner: true,
        gradientType: 'none',
        gradientDepth: 1.0
    }
}

export default defineEventHandler(async (event) => {
    const query = getQuery(event)

    const headerType = query.header_type as string
    const headerSubtype = query.header_subtype as string | undefined
    const projectId = query.project_id as string | undefined

    // Validate header_type
    if (!headerType || !VALID_PARENT_TYPES.includes(headerType)) {
        throw createError({
            statusCode: 400,
            message: `header_type must be one of: ${VALID_PARENT_TYPES.join(', ')}`
        })
    }

    try {
        // Layer 1: Base config (always present)
        const baseConfig = { ...BASE_CONFIGS[headerType] }

        // Layer 2: Subcategory (if specified or use default)
        const subcatName = headerSubtype || `${headerType}.default`
        const subcatRow = await db.get(`
      SELECT config FROM header_configs WHERE name = $1
    `, [subcatName])

        let subcatConfig = {}
        if (subcatRow) {
            subcatConfig = typeof (subcatRow as any).config === 'string'
                ? JSON.parse((subcatRow as any).config)
                : (subcatRow as any).config
        }

        // Layer 3: Project override (if on /sites route)
        let projectOverride = {}
        if (projectId) {
            const overrideRow = await db.get(`
        SELECT config_overrides FROM project_header_overrides
        WHERE project_id = $1 AND header_config_name = $2
      `, [projectId, subcatName])

            if (overrideRow) {
                projectOverride = typeof (overrideRow as any).config_overrides === 'string'
                    ? JSON.parse((overrideRow as any).config_overrides)
                    : (overrideRow as any).config_overrides
            }
        }

        // Merge: base → subcat → project
        const resolved = Object.assign({}, baseConfig, subcatConfig, projectOverride)

        return {
            success: true,
            data: resolved,
            meta: {
                header_type: headerType,
                header_subtype: subcatName,
                project_id: projectId || null,
                layers: {
                    base: true,
                    subcategory: !!subcatRow,
                    project_override: Object.keys(projectOverride).length > 0
                }
            }
        }
    } catch (error) {
        console.error('[GET /api/header-configs/resolve] Error:', error)
        throw createError({
            statusCode: 500,
            message: 'Failed to resolve header config'
        })
    }
})
