/**
 * Migration 068: Add theme_id to header_configs
 * 
 * Implements Proposal B for themed page-headings:
 * - Adds theme_id column to header_configs (nullable FK to theme id 0-7)
 * - Theme-specific subcategories have theme_id set
 * - General variants (available to all themes) have theme_id = NULL
 * 
 * Also adds project default header settings:
 * - default_post_header_type: Default header type for new posts
 * - default_event_header_type: Default header type for new events
 * - site_header_type: Header type for project site homepage
 * 
 * @see docs/dev/page-heading/01-specification.md
 */

import type { DatabaseAdapter } from '../adapter'

export const migration = {
    id: '068_header_configs_theme_id',
    description: 'Add theme_id to header_configs and project default header settings',

    async up(db: DatabaseAdapter) {
        const isPostgres = db.type === 'postgresql'

        // =========================================================================
        // 1. Add theme_id to header_configs
        // =========================================================================
        await db.run(`
            ALTER TABLE header_configs 
            ADD COLUMN IF NOT EXISTS theme_id INTEGER DEFAULT NULL
        `, [])

        // Create index for theme_id lookups
        await db.run(`
            CREATE INDEX IF NOT EXISTS idx_header_configs_theme_id 
            ON header_configs(theme_id)
        `, [])

        // Create composite index for efficient resolution queries
        await db.run(`
            CREATE INDEX IF NOT EXISTS idx_header_configs_parent_theme 
            ON header_configs(parent_type, theme_id)
        `, [])

        // =========================================================================
        // 2. Add project default header settings
        // =========================================================================
        // Default header type for posts created in this project
        await db.run(`
            ALTER TABLE projects 
            ADD COLUMN IF NOT EXISTS default_post_header_type VARCHAR(20) DEFAULT 'banner'
        `, [])

        // Default header size for posts
        await db.run(`
            ALTER TABLE projects 
            ADD COLUMN IF NOT EXISTS default_post_header_size VARCHAR(20) DEFAULT 'medium'
        `, [])

        // Default header type for events created in this project
        await db.run(`
            ALTER TABLE projects 
            ADD COLUMN IF NOT EXISTS default_event_header_type VARCHAR(20) DEFAULT 'cover'
        `, [])

        // Default header size for events
        await db.run(`
            ALTER TABLE projects 
            ADD COLUMN IF NOT EXISTS default_event_header_size VARCHAR(20) DEFAULT 'prominent'
        `, [])

        // Site homepage header type
        await db.run(`
            ALTER TABLE projects 
            ADD COLUMN IF NOT EXISTS site_header_type VARCHAR(20) DEFAULT 'banner'
        `, [])

        // Site homepage header size
        await db.run(`
            ALTER TABLE projects 
            ADD COLUMN IF NOT EXISTS site_header_size VARCHAR(20) DEFAULT 'prominent'
        `, [])

        // =========================================================================
        // 3. Seed theme-specific header configs
        // =========================================================================
        // For each theme (0-7), create default configs for banner and cover
        // These provide theme-specific styling while using the same base type names

        const themeConfigs = [
            // Theme 0: E-Motion (inverted/dark)
            {
                name: 'banner',
                parent_type: 'banner',
                theme_id: 0,
                is_default: true,
                config: {
                    headerSize: 'medium',
                    gradientType: 'dark',
                    gradientDepth: 0.5,
                    contentAlignY: 'bottom'
                },
                label_de: 'Banner (E-Motion)',
                label_en: 'Banner (E-Motion)'
            },
            {
                name: 'cover',
                parent_type: 'cover',
                theme_id: 0,
                is_default: true,
                config: {
                    headerSize: 'prominent',
                    gradientType: 'dark',
                    gradientDepth: 0.6,
                    contentAlignY: 'bottom'
                },
                label_de: 'Cover (E-Motion)',
                label_en: 'Cover (E-Motion)'
            },
            // Theme 1: Regio
            {
                name: 'banner',
                parent_type: 'banner',
                theme_id: 1,
                is_default: true,
                config: {
                    headerSize: 'medium',
                    gradientType: 'light',
                    gradientDepth: 0.3,
                    contentAlignY: 'center'
                },
                label_de: 'Banner (Regio)',
                label_en: 'Banner (Regio)'
            },
            {
                name: 'cover',
                parent_type: 'cover',
                theme_id: 1,
                is_default: true,
                config: {
                    headerSize: 'prominent',
                    gradientType: 'light',
                    gradientDepth: 0.4,
                    contentAlignY: 'bottom'
                },
                label_de: 'Cover (Regio)',
                label_en: 'Cover (Regio)'
            },
            // Theme 2: Pastell
            {
                name: 'banner',
                parent_type: 'banner',
                theme_id: 2,
                is_default: true,
                config: {
                    headerSize: 'medium',
                    gradientType: 'light',
                    gradientDepth: 0.25,
                    contentAlignY: 'center'
                },
                label_de: 'Banner (Pastell)',
                label_en: 'Banner (Pastell)'
            },
            {
                name: 'cover',
                parent_type: 'cover',
                theme_id: 2,
                is_default: true,
                config: {
                    headerSize: 'prominent',
                    gradientType: 'light',
                    gradientDepth: 0.35,
                    contentAlignY: 'bottom'
                },
                label_de: 'Cover (Pastell)',
                label_en: 'Cover (Pastell)'
            },
            // Theme 3: Institut
            {
                name: 'banner',
                parent_type: 'banner',
                theme_id: 3,
                is_default: true,
                config: {
                    headerSize: 'medium',
                    gradientType: 'dark',
                    gradientDepth: 0.4,
                    contentAlignY: 'top'
                },
                label_de: 'Banner (Institut)',
                label_en: 'Banner (Institut)'
            },
            {
                name: 'cover',
                parent_type: 'cover',
                theme_id: 3,
                is_default: true,
                config: {
                    headerSize: 'prominent',
                    gradientType: 'dark',
                    gradientDepth: 0.5,
                    contentAlignY: 'bottom'
                },
                label_de: 'Cover (Institut)',
                label_en: 'Cover (Institut)'
            },
            // Theme 4: Neon
            {
                name: 'banner',
                parent_type: 'banner',
                theme_id: 4,
                is_default: true,
                config: {
                    headerSize: 'medium',
                    gradientType: 'dark',
                    gradientDepth: 0.7,
                    contentAlignY: 'bottom'
                },
                label_de: 'Banner (Neon)',
                label_en: 'Banner (Neon)'
            },
            {
                name: 'cover',
                parent_type: 'cover',
                theme_id: 4,
                is_default: true,
                config: {
                    headerSize: 'full',
                    gradientType: 'dark',
                    gradientDepth: 0.8,
                    contentAlignY: 'center'
                },
                label_de: 'Cover (Neon)',
                label_en: 'Cover (Neon)'
            },
            // Theme 5: Lempel
            {
                name: 'banner',
                parent_type: 'banner',
                theme_id: 5,
                is_default: true,
                config: {
                    headerSize: 'medium',
                    gradientType: 'light',
                    gradientDepth: 0.2,
                    contentAlignY: 'center'
                },
                label_de: 'Banner (Lempel)',
                label_en: 'Banner (Lempel)'
            },
            {
                name: 'cover',
                parent_type: 'cover',
                theme_id: 5,
                is_default: true,
                config: {
                    headerSize: 'prominent',
                    gradientType: 'light',
                    gradientDepth: 0.3,
                    contentAlignY: 'bottom'
                },
                label_de: 'Cover (Lempel)',
                label_en: 'Cover (Lempel)'
            },
            // Theme 6: Rayleigh
            {
                name: 'banner',
                parent_type: 'banner',
                theme_id: 6,
                is_default: true,
                config: {
                    headerSize: 'medium',
                    gradientType: 'dark',
                    gradientDepth: 0.45,
                    contentAlignY: 'bottom'
                },
                label_de: 'Banner (Rayleigh)',
                label_en: 'Banner (Rayleigh)'
            },
            {
                name: 'cover',
                parent_type: 'cover',
                theme_id: 6,
                is_default: true,
                config: {
                    headerSize: 'prominent',
                    gradientType: 'dark',
                    gradientDepth: 0.55,
                    contentAlignY: 'bottom'
                },
                label_de: 'Cover (Rayleigh)',
                label_en: 'Cover (Rayleigh)'
            },
            // Theme 7: (Additional theme)
            {
                name: 'banner',
                parent_type: 'banner',
                theme_id: 7,
                is_default: true,
                config: {
                    headerSize: 'medium',
                    gradientType: 'light',
                    gradientDepth: 0.35,
                    contentAlignY: 'center'
                },
                label_de: 'Banner (Theme 7)',
                label_en: 'Banner (Theme 7)'
            },
            {
                name: 'cover',
                parent_type: 'cover',
                theme_id: 7,
                is_default: true,
                config: {
                    headerSize: 'prominent',
                    gradientType: 'light',
                    gradientDepth: 0.4,
                    contentAlignY: 'bottom'
                },
                label_de: 'Cover (Theme 7)',
                label_en: 'Cover (Theme 7)'
            }
        ]

        // Insert theme-specific configs
        for (const cfg of themeConfigs) {
            const configJson = JSON.stringify(cfg.config)

            await db.run(`
                INSERT INTO header_configs (name, parent_type, theme_id, is_default, config, label_de, label_en, sort_order)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                ON CONFLICT (name) DO UPDATE SET
                    theme_id = EXCLUDED.theme_id,
                    config = EXCLUDED.config,
                    label_de = EXCLUDED.label_de,
                    label_en = EXCLUDED.label_en
            `, [
                `${cfg.name}_theme${cfg.theme_id}`,  // Unique name: banner_theme0, cover_theme1, etc.
                cfg.parent_type,
                cfg.theme_id,
                cfg.is_default,
                configJson,
                cfg.label_de,
                cfg.label_en,
                100 + (cfg.theme_id * 10) + (cfg.parent_type === 'banner' ? 0 : 1)
            ])
        }

        console.log('[Migration 068] Added theme_id to header_configs and seeded', themeConfigs.length, 'theme-specific configs')
        console.log('[Migration 068] Added project default header settings columns')
    },

    async down(db: DatabaseAdapter) {
        // Remove theme-specific configs
        await db.run(`DELETE FROM header_configs WHERE theme_id IS NOT NULL`, [])

        // Remove columns
        await db.run(`ALTER TABLE header_configs DROP COLUMN IF EXISTS theme_id`, [])
        await db.run(`ALTER TABLE projects DROP COLUMN IF EXISTS default_post_header_type`, [])
        await db.run(`ALTER TABLE projects DROP COLUMN IF EXISTS default_post_header_size`, [])
        await db.run(`ALTER TABLE projects DROP COLUMN IF EXISTS default_event_header_type`, [])
        await db.run(`ALTER TABLE projects DROP COLUMN IF EXISTS default_event_header_size`, [])
        await db.run(`ALTER TABLE projects DROP COLUMN IF EXISTS site_header_type`, [])
        await db.run(`ALTER TABLE projects DROP COLUMN IF EXISTS site_header_size`, [])

        // Drop indexes
        await db.run(`DROP INDEX IF EXISTS idx_header_configs_theme_id`, [])
        await db.run(`DROP INDEX IF EXISTS idx_header_configs_parent_theme`, [])

        console.log('[Migration 068] Rolled back theme_id and project header settings')
    }
}
