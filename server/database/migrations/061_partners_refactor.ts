/**
 * Migration 061: Partners Table Refactor
 * 
 * Unifies instructors, locations, and participants into a single 'partners' table
 * with a partner_types bitmask to allow entities to have multiple roles.
 * 
 * Bitmask for partner_types:
 * - bit 0 (1): is_instructor - can teach/lead events
 * - bit 1 (2): is_location - is a venue/place
 * - bit 2 (4): is_participant - attends events
 * - bit 3 (8): is_organisation - is a company/institution
 * 
 * This aligns with Odoo res.partner model and allows for common patterns like:
 * - An instructor who is also an organisation (1 | 8 = 9)
 * - A location that is also an organisation (2 | 8 = 10)
 * - A participant who becomes an instructor (1 | 4 = 5)
 * 
 * Creates PostgreSQL VIEWs for backwards compatibility:
 * - instructors_v: WHERE partner_types & 1 = 1
 * - locations_v: WHERE partner_types & 2 = 2
 * - participants_v: WHERE partner_types & 4 = 4
 */

import type { DatabaseAdapter } from '../adapter'

export async function up(db: DatabaseAdapter) {
    const isPostgres = db.type === 'postgresql'
    if (!isPostgres) {
        throw new Error('Migration 061 requires PostgreSQL.')
    }

    console.log('Running migration 061: Partners Table Refactor...')

    // ===================================================================
    // CHAPTER 1: Create partners table
    // ===================================================================
    console.log('\n📖 Chapter 1: Create partners table')

    await db.exec(`
        CREATE TABLE IF NOT EXISTS partners (
            id SERIAL PRIMARY KEY,
            xmlid TEXT UNIQUE,
            name TEXT NOT NULL,
            
            -- Partner types bitmask (1=instructor, 2=location, 4=participant, 8=organisation)
            partner_types INTEGER NOT NULL DEFAULT 0,
            
            -- Contact info (shared across all types)
            email TEXT,
            phone TEXT,
            
            -- Address info (primarily for locations/organisations)
            street TEXT,
            city TEXT,
            zip TEXT,
            country_id TEXT,
            
            -- Content fields
            description TEXT,
            teaser TEXT,
            cimg TEXT,
            header_type TEXT,
            header_size TEXT,
            md TEXT,
            html TEXT,
            
            -- Location-specific (normalized to BOOLEAN)
            is_company BOOLEAN DEFAULT false,
            category_id TEXT,
            is_location_provider BOOLEAN DEFAULT false,
            
            -- Participant-specific
            age INTEGER,
            participant_type TEXT,
            
            -- Relations
            project_id INTEGER,
            
            -- Status and sysreg
            status INTEGER DEFAULT 0,
            config INTEGER DEFAULT 0,
            rtags INTEGER DEFAULT 0,
            ttags INTEGER DEFAULT 0,
            ctags INTEGER DEFAULT 0,
            dtags INTEGER DEFAULT 0,
            
            -- Image support (full img_* fields like other entities)
            img_id INTEGER REFERENCES images(id) ON DELETE SET NULL,
            img_show BOOLEAN DEFAULT false,
            img_thumb JSONB,
            img_square JSONB,
            img_wide JSONB,
            img_vert JSONB,
            
            -- Base/template flag
            isbase INTEGER DEFAULT 0,
            
            -- Timestamps
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT
        )
    `)
    console.log('  ✓ Created partners table')

    // Create indexes
    await db.exec(`
        CREATE INDEX IF NOT EXISTS idx_partners_partner_types ON partners(partner_types);
        CREATE INDEX IF NOT EXISTS idx_partners_status ON partners(status);
        CREATE INDEX IF NOT EXISTS idx_partners_project_id ON partners(project_id);
        CREATE INDEX IF NOT EXISTS idx_partners_img_id ON partners(img_id);
        CREATE INDEX IF NOT EXISTS idx_partners_name ON partners(name);
    `)
    console.log('  ✓ Created indexes on partners table')

    // ===================================================================
    // CHAPTER 2: Migrate data from existing tables
    // ===================================================================
    console.log('\n📖 Chapter 2: Migrate data from existing tables')

    // 2.1: Migrate instructors (partner_types = 1)
    console.log('\n  🎓 Migrating instructors...')
    
    // Check if instructors table exists and has data
    const instructorsExist = await db.get(`
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = 'instructors'
        ) as exists
    `, [])
    
    if ((instructorsExist as any)?.exists) {
        await db.exec(`
            INSERT INTO partners (
                xmlid, name, partner_types, email, phone, city, country_id,
                description, cimg, header_type, md, html,
                status, img_id, isbase, created_at, updated_at
            )
            SELECT 
                xmlid,
                name,
                1,  -- partner_types = instructor
                email,
                phone,
                city,
                country_id,
                description,
                cimg,
                header_type,
                md,
                html,
                COALESCE(status, 0),
                img_id,
                COALESCE(isbase, 0),
                created_at,
                updated_at
            FROM instructors
            ON CONFLICT (xmlid) DO NOTHING
        `)
        const instructorCount = await db.get('SELECT COUNT(*) as count FROM instructors', [])
        console.log(`    ✓ Migrated ${(instructorCount as any)?.count || 0} instructors`)
    } else {
        console.log('    ⏭️  instructors table does not exist, skipping')
    }

    // 2.2: Migrate locations (partner_types = 2)
    console.log('\n  📍 Migrating locations...')
    
    const locationsExist = await db.get(`
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = 'locations'
        ) as exists
    `, [])
    
    if ((locationsExist as any)?.exists) {
        await db.exec(`
            INSERT INTO partners (
                xmlid, name, partner_types, email, phone, street, city, zip, country_id,
                is_company, category_id, cimg, header_type, header_size, md,
                is_location_provider, status, isbase, created_at, updated_at
            )
            SELECT 
                xmlid,
                name,
                2,  -- partner_types = location
                email,
                phone,
                street,
                city,
                zip,
                country_id,
                COALESCE(is_company, 'false')::text = 'true',
                category_id,
                cimg,
                header_type,
                header_size,
                md,
                COALESCE(is_location_provider, 'false')::text = 'true',
                COALESCE(status, 0),
                COALESCE(isbase, 0),
                created_at,
                updated_at
            FROM locations
            ON CONFLICT (xmlid) DO NOTHING
        `)
        const locationCount = await db.get('SELECT COUNT(*) as count FROM locations', [])
        console.log(`    ✓ Migrated ${(locationCount as any)?.count || 0} locations`)
    } else {
        console.log('    ⏭️  locations table does not exist, skipping')
    }

    // 2.3: Migrate participants (partner_types = 4)
    console.log('\n  👥 Migrating participants...')
    
    const participantsExist = await db.get(`
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = 'participants'
        ) as exists
    `, [])
    
    if ((participantsExist as any)?.exists) {
        await db.exec(`
            INSERT INTO partners (
                xmlid, name, partner_types, city, country_id,
                description, cimg, age, participant_type,
                status, isbase, created_at, updated_at
            )
            SELECT 
                xmlid,
                name,
                4,  -- partner_types = participant
                city,
                country_id,
                description,
                cimg,
                age,
                type,
                COALESCE(status, 0),
                COALESCE(isbase, 0),
                created_at,
                updated_at
            FROM participants
            ON CONFLICT (xmlid) DO NOTHING
        `)
        const participantCount = await db.get('SELECT COUNT(*) as count FROM participants', [])
        console.log(`    ✓ Migrated ${(participantCount as any)?.count || 0} participants`)
    } else {
        console.log('    ⏭️  participants table does not exist, skipping')
    }

    // ===================================================================
    // CHAPTER 3: Create backwards-compatible VIEWs
    // ===================================================================
    console.log('\n📖 Chapter 3: Create backwards-compatible VIEWs')

    // 3.1: instructors view
    await db.exec(`
        CREATE OR REPLACE VIEW instructors_v AS
        SELECT 
            id,
            xmlid,
            name,
            email,
            phone,
            city,
            country_id,
            cimg,
            description,
            status,
            header_type,
            md,
            html,
            isbase,
            img_id,
            img_show,
            img_thumb,
            img_square,
            img_wide,
            img_vert,
            created_at,
            updated_at,
            partner_types & 1 = 1 AS is_instructor,
            partner_types & 2 = 2 AS is_location,
            partner_types & 4 = 4 AS is_participant,
            partner_types & 8 = 8 AS is_organisation
        FROM partners
        WHERE partner_types & 1 = 1
    `)
    console.log('  ✓ Created instructors_v view')

    // 3.2: locations view
    await db.exec(`
        CREATE OR REPLACE VIEW locations_v AS
        SELECT 
            id,
            xmlid,
            name,
            phone,
            email,
            city,
            zip,
            street,
            country_id,
            is_company,
            category_id,
            cimg,
            header_type,
            header_size,
            md,
            is_location_provider,
            status,
            project_id,
            isbase,
            img_id,
            img_show,
            img_thumb,
            img_square,
            img_wide,
            img_vert,
            created_at,
            updated_at,
            partner_types & 1 = 1 AS is_instructor,
            partner_types & 2 = 2 AS is_location,
            partner_types & 4 = 4 AS is_participant,
            partner_types & 8 = 8 AS is_organisation
        FROM partners
        WHERE partner_types & 2 = 2
    `)
    console.log('  ✓ Created locations_v view')

    // 3.3: participants view
    await db.exec(`
        CREATE OR REPLACE VIEW participants_v AS
        SELECT 
            id,
            xmlid,
            name,
            age,
            city,
            country_id,
            cimg,
            description,
            participant_type as type,
            status,
            isbase,
            img_id,
            img_show,
            img_thumb,
            img_square,
            img_wide,
            img_vert,
            created_at,
            updated_at,
            partner_types & 1 = 1 AS is_instructor,
            partner_types & 2 = 2 AS is_location,
            partner_types & 4 = 4 AS is_participant,
            partner_types & 8 = 8 AS is_organisation
        FROM partners
        WHERE partner_types & 4 = 4
    `)
    console.log('  ✓ Created participants_v view')

    // ===================================================================
    // CHAPTER 4: Add image trigger for partners table
    // ===================================================================
    console.log('\n📖 Chapter 4: Add image sync trigger to partners table')

    await db.exec(`
        DROP TRIGGER IF EXISTS trigger_sync_img_fields ON partners;
        CREATE TRIGGER trigger_sync_img_fields
        BEFORE INSERT OR UPDATE OF img_id ON partners
        FOR EACH ROW
        EXECUTE FUNCTION sync_image_fields_on_img_id_change();
    `)
    console.log('  ✓ Created trigger_sync_img_fields on partners')

    // Backfill img_* fields for existing records
    await db.exec(`
        UPDATE partners p
        SET 
            img_show = i.img_show,
            img_thumb = i.img_thumb,
            img_square = i.img_square,
            img_wide = i.img_wide,
            img_vert = i.img_vert
        FROM images i
        WHERE p.img_id = i.id AND p.img_id IS NOT NULL
    `)
    console.log('  ✓ Backfilled img_* fields for existing partners with img_id')

    // ===================================================================
    // CHAPTER 5: Update FK references
    // ===================================================================
    console.log('\n📖 Chapter 5: Update foreign key references')

    // Update users.instructor_id -> users.partner_id
    const hasInstructorId = await db.get(`
        SELECT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'instructor_id'
        ) as exists
    `, [])

    if ((hasInstructorId as any)?.exists) {
        // Add partner_id column if not exists
        await db.exec(`
            ALTER TABLE users ADD COLUMN IF NOT EXISTS partner_id INTEGER REFERENCES partners(id) ON DELETE SET NULL
        `)
        
        // Migrate instructor_id to partner_id
        await db.exec(`
            UPDATE users u
            SET partner_id = p.id
            FROM partners p
            WHERE p.xmlid = (SELECT xmlid FROM instructors WHERE id = u.instructor_id)
            AND u.instructor_id IS NOT NULL
        `)
        console.log('  ✓ Added partner_id to users and migrated from instructor_id')
    }

    // Update events.public_user and events.location to use partner IDs
    // Note: These FKs point to the partners table now
    console.log('  ℹ️  FK updates for events.public_user and events.location deferred')
    console.log('     (Requires careful handling of existing constraints)')

    // ===================================================================
    // CHAPTER 6: Register in sysreg_config
    // ===================================================================
    console.log('\n📖 Chapter 6: Register partner_types in sysreg configuration')

    // Add partner_types to sysreg_config taggroup
    const partnerTypesExists = await db.get(`
        SELECT EXISTS (
            SELECT 1 FROM sysreg_config WHERE taggroup = 'partner_types'
        ) as exists
    `, [])

    if (!(partnerTypesExists as any)?.exists) {
        await db.exec(`
            INSERT INTO sysreg_config (taggroup, tagtype, raw_value, display_name, display_name_en, bit_position)
            VALUES 
                ('partner_types', 'category', 1, 'Instructor', 'Instructor', 0),
                ('partner_types', 'category', 2, 'Location', 'Location', 1),
                ('partner_types', 'category', 4, 'Participant', 'Participant', 2),
                ('partner_types', 'category', 8, 'Organisation', 'Organisation', 3)
            ON CONFLICT DO NOTHING
        `)
        console.log('  ✓ Registered partner_types in sysreg_config')
    } else {
        console.log('  ⏭️  partner_types already exists in sysreg_config')
    }

    console.log('\n✅ Migration 061 completed successfully')
    console.log('   Note: Old tables (instructors, locations, participants) preserved for safety')
    console.log('   Use views (instructors_v, locations_v, participants_v) for backwards compatibility')
    console.log('   Or update code to use partners table directly')
}

export async function down(db: DatabaseAdapter) {
    console.log('Rolling back migration 061...')

    // Drop views
    await db.exec('DROP VIEW IF EXISTS instructors_v CASCADE')
    await db.exec('DROP VIEW IF EXISTS locations_v CASCADE')
    await db.exec('DROP VIEW IF EXISTS participants_v CASCADE')

    // Drop trigger
    await db.exec('DROP TRIGGER IF EXISTS trigger_sync_img_fields ON partners')

    // Remove partner_id from users
    await db.exec('ALTER TABLE users DROP COLUMN IF EXISTS partner_id')

    // Remove sysreg entries
    await db.exec("DELETE FROM sysreg_config WHERE taggroup = 'partner_types'")

    // Drop partners table
    await db.exec('DROP TABLE IF EXISTS partners CASCADE')

    console.log('✅ Rollback of migration 061 completed')
}
