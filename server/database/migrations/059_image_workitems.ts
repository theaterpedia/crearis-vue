/**
 * Migration 059: Create Image Workitems Table
 * 
 * Fine-grained tracking for image processing workflows:
 * - adapter: Processing pipeline steps
 * - consent: GDPR consent requests for images with people
 * - review: Social review requests (audience approval)
 * - admin: Manual admin actions
 * 
 * Design decisions (see chat/spec/negative-spec.md):
 * - Fine-grained (per-adapter, per-user) for audit trail and retry logic
 * - Polymorphic target: adapter name, vue_user id, or odoo_partner xmlid
 * - Aligns with Odoo's mail.activity pattern (per-user, per-action)
 * 
 * Adapter target_ref values:
 * - Adapter names: unsplash, cloudinary, canva, vimeo, cloudflare, crearis, etc.
 * - Image actions: basic_shape_optimization, hero_shape_optimization
 * 
 * Typical workflows:
 * 1. Image upload → adapter workitem: basic_shape_optimization (thumb, square, wide, vertical)
 * 2. Image used in Hero.vue → adapter workitem: hero_shape_optimization (1000px+ cover)
 * 3. Image with people → consent workitem for each visible person
 * 4. Image for publication → review workitems for audience
 * 
 * Package: G (060-069) - Image Processing (v0.5)
 * 
 * @see chat/spec/negative-spec.md
 * @see chat/spec/image-system-architecture.md
 */

import type { DatabaseAdapter } from '../adapter'
import { getTypeHelpers } from './000_base_schema'

export const migration = {
    id: '059_image_workitems',
    description: 'Create image_workitems table for processing, consent, and review tracking',

    async up(db: DatabaseAdapter): Promise<void> {
        const isPostgres = db.type === 'postgresql'
        const { TEXT, TIMESTAMP } = getTypeHelpers(isPostgres)

        console.log('📋 Running migration 059: Creating image_workitems table...')

        if (isPostgres) {
            await db.exec(`
                CREATE TABLE IF NOT EXISTS image_workitems (
                    -- Identity
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    image_id UUID NOT NULL REFERENCES images(id) ON DELETE CASCADE,
                    
                    -- Type discriminator
                    workitem_type TEXT NOT NULL CHECK (workitem_type IN (
                        'adapter',      -- Processing pipeline step
                        'consent',      -- GDPR consent request
                        'review',       -- Social review request
                        'admin'         -- Manual admin action
                    )),
                    
                    -- Target (polymorphic)
                    target_type TEXT NOT NULL CHECK (target_type IN (
                        'adapter',      -- Processing pipeline step
                        'vue_user',     -- Crearis-Vue user
                        'odoo_partner'  -- Odoo partner via XML-RPC
                    )),
                    target_ref TEXT NOT NULL,  -- adapter name OR user.id OR partner xmlid
                    
                    -- Status
                    status TEXT DEFAULT 'pending' CHECK (status IN (
                        'pending',      -- Waiting to start
                        'in_progress',  -- Currently processing
                        'done',         -- Completed successfully
                        'failed',       -- Failed (see error_message)
                        'skipped'       -- Intentionally skipped
                    )),
                    
                    -- Result/outcome
                    result JSONB,              -- Adapter output, consent response, review notes
                    error_message TEXT,        -- If failed
                    
                    -- Consent-specific
                    consent_response TEXT CHECK (consent_response IN (
                        'approved', 'denied', 'expired', NULL
                    )),
                    consent_expires_at TIMESTAMPTZ,
                    
                    -- Timestamps
                    created_at TIMESTAMPTZ DEFAULT NOW(),
                    started_at TIMESTAMPTZ,
                    completed_at TIMESTAMPTZ,
                    
                    -- Creator tracking (who initiated this workitem)
                    -- REQUIRED: Use system users (like Odoo 'bot') instead of NULL
                    created_by UUID NOT NULL REFERENCES users(id),
                    
                    -- Odoo partner reference (for odoo_partner targets)
                    -- NOTE: v0.8 will refactor to use xmlid only
                    target_odoo_id INTEGER,
                    
                    -- Prevent duplicate workitems for same image+type+target
                    UNIQUE(image_id, workitem_type, target_type, target_ref)
                )
            `)

            // Indexes for common queries
            await db.exec(`
                CREATE INDEX IF NOT EXISTS idx_image_workitems_image_id 
                ON image_workitems(image_id)
            `)

            await db.exec(`
                CREATE INDEX IF NOT EXISTS idx_image_workitems_status 
                ON image_workitems(status) 
                WHERE status IN ('pending', 'in_progress')
            `)

            await db.exec(`
                CREATE INDEX IF NOT EXISTS idx_image_workitems_target 
                ON image_workitems(target_type, target_ref)
            `)

            await db.exec(`
                CREATE INDEX IF NOT EXISTS idx_image_workitems_type_status 
                ON image_workitems(workitem_type, status)
            `)

        } else {
            // SQLite version
            await db.exec(`
                CREATE TABLE IF NOT EXISTS image_workitems (
                    -- Identity
                    id ${TEXT} PRIMARY KEY,
                    image_id ${TEXT} NOT NULL REFERENCES images(id) ON DELETE CASCADE,
                    
                    -- Type discriminator
                    workitem_type ${TEXT} NOT NULL CHECK (workitem_type IN (
                        'adapter', 'consent', 'review', 'admin'
                    )),
                    
                    -- Target (polymorphic)
                    target_type ${TEXT} NOT NULL CHECK (target_type IN (
                        'adapter', 'vue_user', 'odoo_partner'
                    )),
                    target_ref ${TEXT} NOT NULL,
                    
                    -- Status
                    status ${TEXT} DEFAULT 'pending' CHECK (status IN (
                        'pending', 'in_progress', 'done', 'failed', 'skipped'
                    )),
                    
                    -- Result/outcome
                    result ${TEXT},  -- JSON string in SQLite
                    error_message ${TEXT},
                    
                    -- Consent-specific
                    consent_response ${TEXT} CHECK (consent_response IN (
                        'approved', 'denied', 'expired', NULL
                    )),
                    consent_expires_at ${TEXT},
                    
                    -- Timestamps
                    created_at ${TIMESTAMP},
                    started_at ${TEXT},
                    completed_at ${TEXT},
                    
                    -- Creator tracking (REQUIRED - use system users like Odoo 'bot')
                    created_by ${TEXT} NOT NULL REFERENCES users(id),
                    
                    -- Odoo partner reference (for odoo_partner targets)
                    -- NOTE: v0.8 will refactor to use xmlid only
                    target_odoo_id INTEGER,
                    
                    -- Prevent duplicate workitems
                    UNIQUE(image_id, workitem_type, target_type, target_ref)
                )
            `)

            // Indexes
            await db.exec(`
                CREATE INDEX IF NOT EXISTS idx_image_workitems_image_id 
                ON image_workitems(image_id)
            `)

            await db.exec(`
                CREATE INDEX IF NOT EXISTS idx_image_workitems_status 
                ON image_workitems(status)
            `)

            await db.exec(`
                CREATE INDEX IF NOT EXISTS idx_image_workitems_target 
                ON image_workitems(target_type, target_ref)
            `)
        }

        console.log('✅ Migration 059 complete: image_workitems table created')
    },

    async down(db: DatabaseAdapter): Promise<void> {
        console.log('🔄 Rolling back migration 059: Dropping image_workitems table...')

        await db.exec('DROP TABLE IF EXISTS image_workitems')

        console.log('✅ Migration 059 rollback complete')
    }
}
