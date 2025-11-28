/**
 * Migration 038: Restructure ctags and ttags
 * 
 * Changes:
 * 1. Delete all existing ctags/ttags entries
 * 2. Clear all entity ctags/ttags fields
 * 3. Insert new ctags taxonomy (3 tag groups: Realisierung, Format, Altersgruppen)
 * 4. Insert new ttags taxonomy (2 tag groups: Medium, Themenfelder)
 * 
 * ctags - "Ablauf & Struktur" (28 bits used):
 * - TagGroup 1: Realisierung (bits 0-4, 3 categories, 2 subcategories)
 * - TagGroup 2: Format (bits 5-15, 5 categories, 6 subcategories)
 * - TagGroup 3: Altersgruppen (bits 18-27, 10 toggles)
 * 
 * ttags - "Themen & Ziele" (25 bits used):
 * - TagGroup 1: Medium (bits 0-9, 10 toggles)
 * - TagGroup 2: Themenfelder (bits 10-24, 5 categories with multiselect, 20 subcategories)
 * 
 * Total: 26 ctags entries, 32 ttags entries
 * 
 * CRITICAL: Uses sysreg_ctags and sysreg_ttags tables (NOT sysreg parent table)
 */

import type { DatabaseAdapter } from '../adapter'

// Helper function to insert a ctag
async function insertCtag(
    db: DatabaseAdapter,
    taglogic: string,
    name: string,
    value: number,
    labelDe: string,
    labelEn: string,
    parentBit?: number
) {
    const sql = `
        INSERT INTO sysreg_ctags (
            tagfamily, taglogic, name, value, description, 
            name_i18n, desc_i18n, is_default, parent_bit
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `
    await db.run(sql, [
        'ctags',
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

// Helper function to insert a ttag
async function insertTtag(
    db: DatabaseAdapter,
    taglogic: string,
    name: string,
    value: number,
    labelDe: string,
    labelEn: string,
    parentBit?: number
) {
    const sql = `
        INSERT INTO sysreg_ttags (
            tagfamily, taglogic, name, value, description, 
            name_i18n, desc_i18n, is_default, parent_bit
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `
    await db.run(sql, [
        'ttags',
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
    id: '038_ctags_ttags_restructure',
    description: 'Restructure ctags (Ablauf & Struktur) and ttags (Themen & Ziele)',

    async up(db: DatabaseAdapter): Promise<void> {
        const isPostgres = db.type === 'postgresql'

        if (!isPostgres) {
            throw new Error('Migration 038 requires PostgreSQL.')
        }

        console.log('Running migration 038: ctags/ttags Restructure...')
        console.log('⚠️  WARNING: This migration will DELETE all existing ctags and ttags!')

        // ==================== Step 1: Delete existing data ====================
        console.log('\n📖 Step 1: Delete existing ctags and ttags')
        await db.run('DELETE FROM sysreg_ctags WHERE tagfamily = $1', ['ctags'])
        await db.run('DELETE FROM sysreg_ttags WHERE tagfamily = $1', ['ttags'])
        console.log('  ✓ Deleted all existing ctags and ttags entries')

        // ==================== Step 2: Clear entity fields ====================
        console.log('\n📖 Step 2: Clear entity ctags/ttags fields')
        const entityTables = ['images', 'projects', 'events', 'posts']
        for (const table of entityTables) {
            const tableExists = await db.get(
                'SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = $1)',
                [table]
            )
            if (tableExists && (tableExists as any).exists) {
                // Check for ctags column
                const ctagsExists = await db.get(
                    'SELECT EXISTS (SELECT FROM information_schema.columns WHERE table_name = $1 AND column_name = $2)',
                    [table, 'ctags']
                )
                if (ctagsExists && (ctagsExists as any).exists) {
                    await db.run(`UPDATE ${table} SET ctags = 0 WHERE ctags IS NOT NULL AND ctags != 0`, [])
                    console.log(`  ✓ Cleared ctags in ${table}`)
                }
                // Check for ttags column
                const ttagsExists = await db.get(
                    'SELECT EXISTS (SELECT FROM information_schema.columns WHERE table_name = $1 AND column_name = $2)',
                    [table, 'ttags']
                )
                if (ttagsExists && (ttagsExists as any).exists) {
                    await db.run(`UPDATE ${table} SET ttags = 0 WHERE ttags IS NOT NULL AND ttags != 0`, [])
                    console.log(`  ✓ Cleared ttags in ${table}`)
                }
            }
        }

        // ==================== CTAGS: Realisierung (bits 0-4) ====================
        console.log('\n📖 Step 3: Insert ctags - Realisierung (bits 0-4)')

        // präsenz: bit 0 (1-bit category)
        await insertCtag(db, 'category', 'praesenz', 1, 'Präsenz', 'In-Person')

        // online: bit 1 (1-bit category)
        await insertCtag(db, 'category', 'online', 2, 'Online', 'Online')

        // hybrid: bits 2-4 (category + 2 subcategories, 2-bit encoding at position 2)
        await insertCtag(db, 'category', 'hybrid', 4, 'Hybrid (synchron)', 'Hybrid (synchronous)')
        await insertCtag(db, 'subcategory', 'hybrid_alternierend', 8, 'hybrid > Alternierend', 'hybrid > Alternating', 2)
        await insertCtag(db, 'subcategory', 'hybrid_livestream', 12, 'hybrid > Livestream', 'hybrid > Livestream', 2)

        console.log('  ✓ Inserted Realisierung: 3 categories, 2 subcategories')

        // ==================== CTAGS: Format (bits 5-15) ====================
        console.log('\n📖 Step 4: Insert ctags - Format (bits 5-15)')

        // workshop: bits 5-7 (category + 2 subcategories)
        await insertCtag(db, 'category', 'workshop', 32, 'Workshop (4-8 Std.)', 'Workshop (4-8 hours)')
        await insertCtag(db, 'subcategory', 'workshop_kurz', 64, 'workshop > Kurz', 'workshop > Short', 5)
        await insertCtag(db, 'subcategory', 'workshop_mehrtaegig', 96, 'workshop > Mehrtägig', 'workshop > Multi-day', 5)

        // kurs: bits 8-10 (category + 2 subcategories)
        await insertCtag(db, 'category', 'kurs', 256, 'Kurs (4-10 Monate)', 'Course (4-10 months)')
        await insertCtag(db, 'subcategory', 'kurs_kurz', 512, 'kurs > Kurz', 'course > Short', 8)
        await insertCtag(db, 'subcategory', 'kurs_fortlaufend', 768, 'kurs > Fortlaufend', 'course > Ongoing', 8)

        // projekt: bits 11-13 (category + 2 subcategories)
        await insertCtag(db, 'category', 'projekt', 2048, 'Projekt (5-9 Tage)', 'Project (5-9 days)')
        await insertCtag(db, 'subcategory', 'projekt_kurz', 4096, 'projekt > Kurz', 'project > Short', 11)
        await insertCtag(db, 'subcategory', 'projekt_mehrphasig', 6144, 'projekt > Mehrphasig', 'project > Multi-phase', 11)

        // konferenz: bit 14 (1-bit category)
        await insertCtag(db, 'category', 'konferenz', 16384, 'Konferenz', 'Conference')

        // sonstige: bit 15 (1-bit category)
        await insertCtag(db, 'category', 'sonstige', 32768, 'Sonstige', 'Other')

        console.log('  ✓ Inserted Format: 5 categories, 6 subcategories')

        // ==================== CTAGS: Altersgruppen (bits 18-27) ====================
        console.log('\n📖 Step 5: Insert ctags - Altersgruppen (bits 18-27)')

        await insertCtag(db, 'toggle', 'age_3_6', 262144, '3-6 (Kindergartenalter)', '3-6 (Kindergarten age)')
        await insertCtag(db, 'toggle', 'age_6_9', 524288, '6-9 (Grundschulalter)', '6-9 (Elementary school age)')
        await insertCtag(db, 'toggle', 'age_9_12', 1048576, '9-12 (späte Kindheit)', '9-12 (Late childhood)')
        await insertCtag(db, 'toggle', 'age_12_15', 2097152, '12-15 (frühe Jugend)', '12-15 (Early adolescence)')
        await insertCtag(db, 'toggle', 'age_15_18', 4194304, '15-18 (Jugend)', '15-18 (Adolescence)')
        await insertCtag(db, 'toggle', 'age_18_25', 8388608, '18-25 (Ausbildungsphase)', '18-25 (Training phase)')
        await insertCtag(db, 'toggle', 'age_25_40', 16777216, '25-40 (30er)', '25-40 (30s)')
        await insertCtag(db, 'toggle', 'age_40_55', 33554432, '40-55 (40er)', '40-55 (40s)')
        await insertCtag(db, 'toggle', 'age_55_70', 67108864, '55-70 (60er)', '55-70 (60s)')
        await insertCtag(db, 'toggle', 'age_70_99', 134217728, '70-99 (Ü70)', '70-99 (70+)')

        console.log('  ✓ Inserted Altersgruppen: 10 toggles')

        // ==================== TTAGS: Medium (bits 0-9) ====================
        console.log('\n📖 Step 6: Insert ttags - Medium (bits 0-9)')

        await insertTtag(db, 'toggle', 'medium_koerper', 1, 'Körper & Bewegung', 'Body & Movement')
        await insertTtag(db, 'toggle', 'medium_stimme', 2, 'Stimme & Sprache', 'Voice & Language')
        await insertTtag(db, 'toggle', 'medium_orte', 4, 'Orte & Räume', 'Places & Spaces')
        await insertTtag(db, 'toggle', 'medium_geschichte', 8, 'Geschichte', 'History')
        await insertTtag(db, 'toggle', 'medium_berufe', 16, 'Berufe & gesellschaftliche Rollen', 'Professions & Social Roles')
        await insertTtag(db, 'toggle', 'medium_literatur', 32, 'Literatur', 'Literature')
        await insertTtag(db, 'toggle', 'medium_kunst', 64, 'Kunst', 'Art')
        await insertTtag(db, 'toggle', 'medium_masken', 128, 'Masken & Kostüm', 'Masks & Costumes')
        await insertTtag(db, 'toggle', 'medium_musik', 256, 'Musik', 'Music')
        await insertTtag(db, 'toggle', 'medium_medien', 512, 'Medien', 'Media')

        console.log('  ✓ Inserted Medium: 10 toggles')

        // ==================== TTAGS: Themenfelder (bits 10-24) ====================
        console.log('\n📖 Step 7: Insert ttags - Themenfelder (bits 10-24)')

        // Demokratie: bits 10-12 (category + 6 subcategories, 3-bit encoding)
        await insertTtag(db, 'category', 'demokratie', 1024, 'Demokratie', 'Democracy')
        await insertTtag(db, 'subcategory', 'demokratie_zivilcourage', 2048, 'demokratie > Zivilcourage', 'democracy > Civic Courage', 10)
        await insertTtag(db, 'subcategory', 'demokratie_soziokultur', 3072, 'demokratie > Soziokultur', 'democracy > Socioculture', 10)
        await insertTtag(db, 'subcategory', 'demokratie_europa', 4096, 'demokratie > Europa', 'democracy > Europe', 10)
        await insertTtag(db, 'subcategory', 'demokratie_partizipation', 5120, 'demokratie > Partizipation', 'democracy > Participation', 10)
        await insertTtag(db, 'subcategory', 'demokratie_resilienz', 6144, 'demokratie > Resilienz', 'democracy > Resilience', 10)
        await insertTtag(db, 'subcategory', 'demokratie_minderheiten', 7168, 'demokratie > Minderheiten', 'democracy > Minorities', 10)

        // Migration: bits 13-15 (category + 3 subcategories, 2-bit encoding)
        await insertTtag(db, 'category', 'migration', 8192, 'Migration', 'Migration')
        await insertTtag(db, 'subcategory', 'migration_flucht', 16384, 'migration > Flucht', 'migration > Flight', 13)
        await insertTtag(db, 'subcategory', 'migration_integration', 24576, 'migration > Berufl. Integration', 'migration > Professional Integration', 13)
        await insertTtag(db, 'subcategory', 'migration_sprachfoerderung', 32768, 'migration > Sprachförderung', 'migration > Language Support', 13)

        // Diversität: bits 16-18 (category + 4 subcategories, 3-bit encoding)
        await insertTtag(db, 'category', 'diversitaet', 65536, 'Diversität', 'Diversity')
        await insertTtag(db, 'subcategory', 'diversitaet_gender', 131072, 'diversität > Gender', 'diversity > Gender', 16)
        await insertTtag(db, 'subcategory', 'diversitaet_inklusion', 196608, 'diversität > Inklusion', 'diversity > Inclusion', 16)
        await insertTtag(db, 'subcategory', 'diversitaet_kulturell', 262144, 'diversität > Kult. Vielfalt', 'diversity > Cultural Diversity', 16)
        await insertTtag(db, 'subcategory', 'diversitaet_international', 327680, 'diversität > Intern. Begegnung', 'diversity > International Encounter', 16)

        // Nachhaltigkeit: bits 19-21 (category + 3 subcategories, 2-bit encoding)
        await insertTtag(db, 'category', 'nachhaltigkeit', 524288, 'Nachhaltigkeit', 'Sustainability')
        await insertTtag(db, 'subcategory', 'nachhaltigkeit_regional', 1048576, 'nachhaltigkeit > Regionalität', 'sustainability > Regionality', 19)
        await insertTtag(db, 'subcategory', 'nachhaltigkeit_klima', 1572864, 'nachhaltigkeit > Klimawandel', 'sustainability > Climate Change', 19)
        await insertTtag(db, 'subcategory', 'nachhaltigkeit_generationen', 2097152, 'nachhaltigkeit > Generationenverhältnis', 'sustainability > Generational Relations', 19)

        // Digitalität: bits 22-24 (category + 4 subcategories, 3-bit encoding)
        await insertTtag(db, 'category', 'digitalitaet', 4194304, 'Digitalität', 'Digitality')
        await insertTtag(db, 'subcategory', 'digitalitaet_sichtbarkeit', 8388608, 'digitalität > Sichtbarkeit', 'digitality > Visibility', 22)
        await insertTtag(db, 'subcategory', 'digitalitaet_creative_commons', 12582912, 'digitalität > Creative Commons', 'digitality > Creative Commons', 22)
        await insertTtag(db, 'subcategory', 'digitalitaet_medienkompetenz', 16777216, 'digitalität > Medienkompetenz', 'digitality > Media Literacy', 22)
        await insertTtag(db, 'subcategory', 'digitalitaet_datenschutz', 20971520, 'digitalität > Datenschutz', 'digitality > Data Protection', 22)

        console.log('  ✓ Inserted Themenfelder: 5 categories, 20 subcategories')

        // ==================== Summary ====================
        console.log('\n📖 Step 8: Migration Summary')
        const ctagsCount = await db.get('SELECT COUNT(*) as count FROM sysreg_ctags WHERE tagfamily = $1', ['ctags'])
        const ttagsCount = await db.get('SELECT COUNT(*) as count FROM sysreg_ttags WHERE tagfamily = $1', ['ttags'])
        console.log(`  ✓ Total ctags entries: ${(ctagsCount as any).count}`)
        console.log(`  ✓ Total ttags entries: ${(ttagsCount as any).count}`)
        console.log('  ✓ ctags bit allocation: 0-4 (Realisierung), 5-15 (Format), 18-27 (Altersgruppen)')
        console.log('  ✓ ttags bit allocation: 0-9 (Medium), 10-24 (Themenfelder)')
        console.log('  ✓ All entity ctags/ttags fields cleared')
        console.log('\n✅ Migration 038 complete!')
    },

    async down(db: DatabaseAdapter): Promise<void> {
        console.log('Rolling back migration 038...')

        // Delete all ctags and ttags
        await db.run('DELETE FROM sysreg_ctags WHERE tagfamily = $1', ['ctags'])
        await db.run('DELETE FROM sysreg_ttags WHERE tagfamily = $1', ['ttags'])

        console.log('  ✓ Deleted all ctags and ttags entries')
        console.log('  ⚠️  Note: Original data not restored - was already cleared before this migration')
        console.log('✅ Rollback complete')
    }
}
