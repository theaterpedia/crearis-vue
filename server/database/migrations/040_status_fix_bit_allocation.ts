/**
 * Migration 040: Fix status bit allocation
 * 
 * Corrects the bit allocation from Migration 039 to provide proper 3-bit slots
 * for each of the 5 main status categories (allowing up to 6 subcategories each).
 * 
 * New Bit Allocation:
 * 
 * TagGroup 'status' (bits 0-16):
 * - new:       bits 0-2   (3 bits, category at bit 0, up to 6 subcategories)
 * - demo:      bits 3-5   (3 bits, category at bit 3, up to 6 subcategories)
 * - draft:     bits 6-8   (3 bits, category at bit 6, up to 6 subcategories)
 * - confirmed: bits 9-11  (3 bits, category at bit 9, up to 6 subcategories)
 * - released:  bits 12-14 (3 bits, category at bit 12, up to 6 subcategories)
 * - archived:  bit 15     (1 bit, no subcategories)
 * - trash:     bit 16     (1 bit, no subcategories)
 * 
 * TagGroup 'scope' (bits 17-21):
 * - team:    bit 17
 * - login:   bit 18
 * - project: bit 19
 * - regio:   bit 20
 * - public:  bit 21
 * 
 * Total: 22 bits used
 */

import type { DatabaseAdapter } from '../adapter'

async function insertStatus(
    db: DatabaseAdapter,
    taglogic: string,
    name: string,
    value: number,
    labelDe: string,
    labelEn: string,
    parentBit?: number
) {
    const sql = `
        INSERT INTO sysreg_status (
            tagfamily, taglogic, name, value, description, 
            name_i18n, desc_i18n, is_default, parent_bit
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `
    await db.run(sql, [
        'status',
        taglogic,
        name,
        value,
        null,
        JSON.stringify({ de: labelDe, en: labelEn }),
        null,
        false,
        parentBit ?? null
    ])
}

export const migration = {
    id: '040_status_fix_bit_allocation',
    description: 'Fix status bit allocation with proper 3-bit slots for subcategories',

    async up(db: DatabaseAdapter): Promise<void> {
        const isPostgres = db.type === 'postgresql'

        if (!isPostgres) {
            throw new Error('Migration 040 requires PostgreSQL.')
        }

        console.log('Running migration 040: Fix Status Bit Allocation...')

        // ==================== Step 1: Delete existing status entries ====================
        console.log('\n📖 Step 1: Delete existing sysreg_status entries')
        await db.run('DELETE FROM sysreg_status WHERE tagfamily = $1', ['status'])
        console.log('  ✓ Deleted all existing status entries')

        // ==================== Step 2: Insert corrected status structure ====================
        console.log('\n📖 Step 2: Insert TagGroup "status" with corrected bit allocation')

        // new: bits 0-2 (3 bits)
        // category value = 1 << 0 = 1
        // subcategory values: 2, 3, 4, 5, 6, 7 (shifted by 0)
        await insertStatus(db, 'category', 'new', 1, 'Neu', 'New')
        await insertStatus(db, 'subcategory', 'new_image', 2, 'Roh', 'Raw', 0)
        await insertStatus(db, 'subcategory', 'new_user', 3, 'Passiv', 'Passive', 0)
        console.log('  ✓ new (bits 0-2): 1 category, 2 subcategories')

        // demo: bits 3-5 (3 bits)
        // category value = 1 << 3 = 8
        // subcategory values: 2<<3=16, 3<<3=24, 4<<3=32, etc.
        await insertStatus(db, 'category', 'demo', 8, 'Demo', 'Demo')
        await insertStatus(db, 'subcategory', 'demo_event', 16, 'Vorlage', 'Template', 3)
        await insertStatus(db, 'subcategory', 'demo_project', 24, 'Vorlage', 'Template', 3)
        await insertStatus(db, 'subcategory', 'demo_user', 32, 'Verifiziert', 'Verified', 3)
        console.log('  ✓ demo (bits 3-5): 1 category, 3 subcategories')

        // draft: bits 6-8 (3 bits)
        // category value = 1 << 6 = 64
        // subcategory values: 2<<6=128, 3<<6=192, etc.
        await insertStatus(db, 'category', 'draft', 64, 'Entwurf', 'Draft')
        await insertStatus(db, 'subcategory', 'draft_user', 128, 'Aktiviert', 'Activated', 6)
        console.log('  ✓ draft (bits 6-8): 1 category, 1 subcategory')

        // confirmed: bits 9-11 (3 bits)
        // category value = 1 << 9 = 512
        // subcategory values: 2<<9=1024, 3<<9=1536, etc.
        await insertStatus(db, 'category', 'confirmed', 512, 'Bestätigt', 'Confirmed')
        await insertStatus(db, 'subcategory', 'confirmed_user', 1024, 'Konfiguriert', 'Configured', 9)
        console.log('  ✓ confirmed (bits 9-11): 1 category, 1 subcategory')

        // released: bits 12-14 (3 bits)
        // category value = 1 << 12 = 4096
        // subcategory values: 2<<12=8192, 3<<12=12288, etc.
        await insertStatus(db, 'category', 'released', 4096, 'Freigegeben', 'Released')
        await insertStatus(db, 'subcategory', 'released_user', 8192, 'Abgeschlossen', 'Completed', 12)
        console.log('  ✓ released (bits 12-14): 1 category, 1 subcategory')

        // archived: bit 15 (1 bit, no subcategories)
        // value = 1 << 15 = 32768
        await insertStatus(db, 'category', 'archived', 32768, 'Archiviert', 'Archived')
        console.log('  ✓ archived (bit 15): 1 category')

        // trash: bit 16 (1 bit, no subcategories)
        // value = 1 << 16 = 65536
        await insertStatus(db, 'category', 'trash', 65536, 'Papierkorb', 'Trash')
        console.log('  ✓ trash (bit 16): 1 category')

        // ==================== Step 3: Insert scope structure ====================
        console.log('\n📖 Step 3: Insert TagGroup "scope" (bits 17-21)')

        // scope toggles (single bit each)
        await insertStatus(db, 'toggle', 'scope_team', 131072, 'Team', 'Team')         // 1 << 17
        await insertStatus(db, 'toggle', 'scope_login', 262144, 'Login', 'Login')       // 1 << 18
        await insertStatus(db, 'toggle', 'scope_project', 524288, 'Projekt', 'Project') // 1 << 19
        await insertStatus(db, 'toggle', 'scope_regio', 1048576, 'Regional', 'Regional') // 1 << 20
        await insertStatus(db, 'toggle', 'scope_public', 2097152, 'Öffentlich', 'Public') // 1 << 21

        console.log('  ✓ Inserted scope group: 5 toggles')

        // ==================== Summary ====================
        console.log('\n📖 Step 4: Migration Summary')
        const statusCount = await db.get('SELECT COUNT(*) as count FROM sysreg_status WHERE tagfamily = $1', ['status'])
        console.log(`  ✓ Total status entries: ${(statusCount as any).count}`)
        console.log('  ✓ Status bit allocation: 0-2 (new), 3-5 (demo), 6-8 (draft), 9-11 (confirmed), 12-14 (released), 15 (archived), 16 (trash)')
        console.log('  ✓ Scope bit allocation: 17-21')
        console.log('\n✅ Migration 040 complete!')
    },

    async down(db: DatabaseAdapter): Promise<void> {
        console.log('Rolling back migration 040...')
        await db.run('DELETE FROM sysreg_status WHERE tagfamily = $1', ['status'])
        console.log('  ✓ Deleted all status entries')
        console.log('  ⚠️  Note: Run migration 039 to restore previous (incorrect) values')
        console.log('✅ Rollback complete')
    }
}
