/**
 * Migration 067: Header Configs System
 * 
 * Creates the three-layer header configuration system:
 * 1. Base header types (Odoo-aligned, immutable)
 * 2. Central subcategories (sysreg-style, admin-editable)
 * 3. Project overrides (per domaincode, route-scoped)
 * 
 * @see chat/reports/2025-12-15-header-system-answers.md
 */

import type { DatabaseAdapter } from '../adapter'

export const migration = {
    id: '067_header_configs_system',
    description: 'Create header_configs and project_header_overrides tables',

    async up(db: DatabaseAdapter) {
        const isPostgres = db.type === 'postgresql'

        // =========================================================================
        // Table 1: header_configs (Central Subcategories)
        // =========================================================================
        // Stores subcategories like 'cover.dramatic', 'banner.compact'
        // Each links to a parent_type (Odoo base: simple/columns/banner/cover/bauchbinde)
        await db.run(`
      CREATE TABLE IF NOT EXISTS header_configs (
        id ${isPostgres ? 'SERIAL' : 'INTEGER'} PRIMARY KEY,
        name VARCHAR(50) UNIQUE NOT NULL,
        parent_type VARCHAR(20) NOT NULL,
        is_default BOOLEAN DEFAULT FALSE,
        config ${isPostgres ? 'JSONB' : 'TEXT'} NOT NULL DEFAULT '{}',
        label_de VARCHAR(100),
        label_en VARCHAR(100),
        description VARCHAR(255),
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        CONSTRAINT valid_parent_type CHECK (parent_type IN ('simple', 'columns', 'banner', 'cover', 'bauchbinde'))
      )
    `, [])

        // Index for parent_type lookups
        await db.run(`
      CREATE INDEX IF NOT EXISTS idx_header_configs_parent_type 
      ON header_configs(parent_type)
    `, [])

        // =========================================================================
        // Table 2: project_header_overrides (Per-Project Customization)
        // =========================================================================
        // Stores project-specific overrides for header configs
        // Only interpreted on /sites/[domaincode]/* routes
        await db.run(`
      CREATE TABLE IF NOT EXISTS project_header_overrides (
        id ${isPostgres ? 'SERIAL' : 'INTEGER'} PRIMARY KEY,
        project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        header_config_name VARCHAR(50) NOT NULL,
        config_overrides ${isPostgres ? 'JSONB' : 'TEXT'} NOT NULL DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        UNIQUE(project_id, header_config_name)
      )
    `, [])

        // Index for project lookups
        await db.run(`
      CREATE INDEX IF NOT EXISTS idx_project_header_overrides_project 
      ON project_header_overrides(project_id)
    `, [])

        // =========================================================================
        // Seed: Default configurations for each Odoo base type
        // =========================================================================
        // These match PageHeading.vue's headerTypes[] array exactly
        const defaultConfigs = [
            {
                name: 'simple.default',
                parent_type: 'simple',
                is_default: true,
                config: {
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
                label_de: 'Einfach (Standard)',
                label_en: 'Simple (Default)',
                description: 'No hero image, text only header'
            },
            {
                name: 'columns.default',
                parent_type: 'columns',
                is_default: true,
                config: {
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
                label_de: 'Zwei Spalten (Standard)',
                label_en: 'Two Columns (Default)',
                description: 'Side-by-side text and image layout'
            },
            {
                name: 'banner.default',
                parent_type: 'banner',
                is_default: true,
                config: {
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
                label_de: 'Banner (Standard)',
                label_en: 'Banner (Default)',
                description: 'Medium-height banner with top-aligned content'
            },
            {
                name: 'banner.compact',
                parent_type: 'banner',
                is_default: false,
                config: {
                    headerSize: 'mini',
                    contentAlignY: 'center',
                    gradientDepth: 0.4
                },
                label_de: 'Banner (Kompakt)',
                label_en: 'Banner (Compact)',
                description: 'Minimal height banner for dense layouts'
            },
            {
                name: 'cover.default',
                parent_type: 'cover',
                is_default: true,
                config: {
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
                label_de: 'Cover (Standard)',
                label_en: 'Cover (Default)',
                description: 'Full-width cover image with content at bottom'
            },
            {
                name: 'cover.dramatic',
                parent_type: 'cover',
                is_default: false,
                config: {
                    headerSize: 'full',
                    contentAlignY: 'center',
                    gradientType: 'none',
                    gradientDepth: 0
                },
                label_de: 'Cover (Dramatisch)',
                label_en: 'Cover (Dramatic)',
                description: 'Full-screen cover with centered content, no gradient'
            },
            {
                name: 'cover.cinematic',
                parent_type: 'cover',
                is_default: false,
                config: {
                    headerSize: 'full',
                    contentAlignY: 'bottom',
                    gradientType: 'left-bottom',
                    gradientDepth: 0.9
                },
                label_de: 'Cover (Filmisch)',
                label_en: 'Cover (Cinematic)',
                description: 'Full-screen cover with heavy gradient overlay'
            },
            {
                name: 'bauchbinde.default',
                parent_type: 'bauchbinde',
                is_default: true,
                config: {
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
                },
                label_de: 'Bauchbinde (Standard)',
                label_en: 'Lower Third (Default)',
                description: 'Broadcast-style overlay with content band at bottom'
            }
        ]

        for (const cfg of defaultConfigs) {
            const configJson = isPostgres
                ? JSON.stringify(cfg.config)
                : JSON.stringify(cfg.config)

            await db.run(`
        INSERT INTO header_configs (name, parent_type, is_default, config, label_de, label_en, description, sort_order)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (name) DO NOTHING
      `, [
                cfg.name,
                cfg.parent_type,
                cfg.is_default,
                configJson,
                cfg.label_de,
                cfg.label_en,
                cfg.description,
                defaultConfigs.indexOf(cfg) * 10
            ])
        }

        console.log('[Migration 067] Created header_configs system with', defaultConfigs.length, 'default configs')
    },

    async down(db: DatabaseAdapter) {
        await db.run('DROP TABLE IF EXISTS project_header_overrides', [])
        await db.run('DROP TABLE IF EXISTS header_configs', [])
        console.log('[Migration 067] Dropped header_configs tables')
    }
}
