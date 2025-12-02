/**
 * Migration 037: dtags Restructure with Theater Pedagogy Taxonomy (V2)
 * 
 * Changes:
 * 1. Delete all existing dtags entries from sysreg_dtags
 * 2. Insert new dtags taxonomy (4 tag groups, 16 categories, 27 subcategories)
 * 3. Clear all entity dtags fields
 * 
 * New Structure (31 bits total - bit 31 reserved as sign bit):
 * - TagGroup 1: Spielform (bits 0-7, 4 categories, 8 subcategories)
 * - TagGroup 2: Animiertes Theaterspiel (bits 8-14, 4 categories, 6 subcategories)
 * - TagGroup 3: Szenische Themenarbeit (bits 15-24, 5 categories, 8 subcategories)
 * - TagGroup 4: Pädagogische Regie (bits 25-30, 3 categories, 5 subcategories)
 * 
 * Total: 43 dtags entries (16 categories + 27 subcategories)
 * 
 * CRITICAL: Uses sysreg_dtags table (NOT sysreg parent table)
 */

import type { DatabaseAdapter } from '../adapter'

// Helper function to insert a dtag into sysreg_dtags
async function insertDtag(
    db: DatabaseAdapter,
    taglogic: string,
    name: string,
    value: number,
    description: string,
    labelDe: string,
    descDe: string,
    parentBit?: number
) {
    const sql = `
        INSERT INTO sysreg_dtags (
            tagfamily, taglogic, name, value, description, 
            name_i18n, desc_i18n, is_default, parent_bit
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `
    await db.run(sql, [
        'dtags',
        taglogic,
        name,
        value,
        description,
        JSON.stringify({ de: labelDe }),
        JSON.stringify({ de: descDe }),
        false,
        parentBit ?? null
    ])
}

export const migration = {
    id: '037_dtags_restructure',
    description: 'Restructure dtags with theater pedagogy taxonomy (V2 - 31 bits)',

    async up(db: DatabaseAdapter): Promise<void> {
        const isPostgres = db.type === 'postgresql'

        if (!isPostgres) {
            throw new Error('Migration 037 requires PostgreSQL.')
        }

        console.log('Running migration 037: dtags Restructure (V2)...')
        console.log('⚠️  WARNING: This migration will DELETE all existing dtags!')
        console.log('📝 Writing to sysreg_dtags table (not sysreg parent)')

        // Add parent_bit column to sysreg parent table (inherited by all child tables)
        console.log('\n📖 Chapter 0: Add parent_bit column to sysreg')
        await db.exec(`
            ALTER TABLE sysreg 
            ADD COLUMN IF NOT EXISTS parent_bit INTEGER;
            
            CREATE INDEX IF NOT EXISTS idx_sysreg_parent_bit 
            ON sysreg(parent_bit);
            
            COMMENT ON COLUMN sysreg.parent_bit IS 'Bit number of parent category (for subcategories)';
        `)
        console.log('  ✓ Added parent_bit column to sysreg (inherited by all child tables)')

        // Delete existing dtags from sysreg_dtags
        console.log('\n📖 Chapter 1: Delete existing dtags')
        await db.run('DELETE FROM sysreg_dtags WHERE tagfamily = $1', ['dtags'])
        console.log('  ✓ Deleted all existing dtags entries from sysreg_dtags')

        // Clear entity dtags fields
        const entityTables = ['images', 'projects', 'events', 'posts']
        for (const table of entityTables) {
            const tableExists = await db.get(
                'SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = $1)',
                [table]
            )
            if (tableExists && (tableExists as any).exists) {
                const columnExists = await db.get(
                    'SELECT EXISTS (SELECT FROM information_schema.columns WHERE table_name = $1 AND column_name = $2)',
                    [table, 'dtags']
                )
                if (columnExists && (columnExists as any).exists) {
                    await db.run(`UPDATE ${table} SET dtags = NULL WHERE dtags IS NOT NULL`, [])
                    console.log(`  ✓ Cleared dtags in ${table}`)
                }
            }
        }

        // ==================== TagGroup 1: Spielform (bits 0-7) ====================
        console.log('\n📖 Chapter 2: Insert TagGroup 1 - Spielform')

        // Kreisspiele (bits 0-1): 2 bits = 4 values, category + 2 subcats
        await insertDtag(db, 'category', 'kreisspiele', 1, 'Beschreibung Kreisspiele', 'Kreisspiele', 'Beschreibung Kreisspiele')
        await insertDtag(db, 'subcategory', 'kreisspiel_impulskreis', 2, 'Impulskreis', 'Kreisspiel > Impulskreis', 'Impulskreis', 0)
        await insertDtag(db, 'subcategory', 'kreisspiel_synchronkreis', 3, 'Synchronkreis', 'Kreisspiel > Synchronkreis', 'Synchronkreis', 0)

        // Raumlauf (bits 2-3): 2 bits = 4 values, category + 2 subcats
        await insertDtag(db, 'category', 'raumlauf', 4, 'Beschreibung Raumlauf', 'Raumlauf', 'Beschreibung Raumlauf')
        await insertDtag(db, 'subcategory', 'raumlauf_einzelgaenger', 8, 'Einzelgänger', 'Raumlauf > Einzelgänger', 'Einzelgänger', 2)
        await insertDtag(db, 'subcategory', 'raumlauf_begegnungen', 12, 'Begegnungen', 'Raumlauf > Begegnungen', 'Begegnungen', 2)

        // Kleingruppen (bit 4): 1 bit = 2 values, category only
        await insertDtag(db, 'category', 'kleingruppen', 16, 'Beschreibung Kleingruppen', 'Kleingruppen', 'Beschreibung Kleingruppen')

        // Forum (bits 5-7): 3 bits = 8 values, category + 4 subcats
        await insertDtag(db, 'category', 'forum', 32, 'Beschreibung Forum/Bühne', 'Forum', 'Beschreibung Forum/Bühne')
        await insertDtag(db, 'subcategory', 'forum_abklatschspiel', 64, 'Abklatschspiel', 'Forum > Abklatschspiel', 'Abklatschspiel', 5)
        await insertDtag(db, 'subcategory', 'forum_werkstattprobe', 96, 'Werkstattprobe', 'Forum > Werkstattprobe', 'Werkstattprobe', 5)
        await insertDtag(db, 'subcategory', 'forum_showing', 128, 'Showing', 'Forum > Showing', 'Showing', 5)
        await insertDtag(db, 'subcategory', 'forum_durchlaufproben', 160, 'Durchlaufproben', 'Forum > Durchlaufproben', 'Durchlaufproben', 5)

        console.log('  ✓ Inserted Spielform: 4 categories, 8 subcategories')

        // ==================== TagGroup 2: Animiertes Theaterspiel (bits 8-14) ====================
        console.log('\n📖 Chapter 3: Insert TagGroup 2 - Animiertes Theaterspiel')

        // El. Animation (bits 8-9): 2 bits = 4 values, category + 2 subcats
        await insertDtag(db, 'category', 'el_animation', 256, 'Elementare Animation', 'El. Animation', 'Elementare Animation')
        await insertDtag(db, 'subcategory', 'el_animation_zwei_kreise_modell', 512, 'Zwei-Kreise-Modell', 'El. Animation > Zwei-Kreise-Modell', 'Zwei-Kreise-Modell', 8)
        await insertDtag(db, 'subcategory', 'el_animation_variante_2', 768, 'Variante 2', 'El. Animation > Variante 2', 'Variante 2', 8)

        // Sz. Animation (bits 10-11): 2 bits = 4 values, category + 2 subcats
        await insertDtag(db, 'category', 'sz_animation', 1024, 'Szenische Animation', 'Sz. Animation', 'Szenische Animation')
        await insertDtag(db, 'subcategory', 'sz_animation_variante_1', 2048, 'Variante 1', 'Sz. Animation > Variante 1', 'Variante 1', 10)
        await insertDtag(db, 'subcategory', 'sz_animation_variante_2', 3072, 'Variante 2', 'Sz. Animation > Variante 2', 'Variante 2', 10)

        // Impro (bit 12): 1 bit = 2 values, category only
        await insertDtag(db, 'category', 'impro', 4096, 'klass. Improtheater', 'Impro', 'klass. Improtheater')

        // animiert (bits 13-14): 2 bits = 4 values, category + 2 subcats
        await insertDtag(db, 'category', 'animiert', 8192, 'animierte Kurzprojekte', 'animiert', 'animierte Kurzprojekte')
        await insertDtag(db, 'subcategory', 'animiert_safari', 16384, 'SAFARI', 'animiert > SAFARI', 'SAFARI', 13)
        await insertDtag(db, 'subcategory', 'animiert_variante_2', 24576, 'Variante 2', 'animiert > Variante 2', 'Variante 2', 13)

        console.log('  ✓ Inserted Animiertes Theaterspiel: 4 categories, 6 subcategories')

        // ==================== TagGroup 3: Szenische Themenarbeit (bits 15-24) ====================
        console.log('\n📖 Chapter 4: Insert TagGroup 3 - Szenische Themenarbeit')

        // Standbilder (bits 15-17): 3 bits = 8 values, category + 3 subcats
        await insertDtag(db, 'category', 'standbilder', 32768, 'stehende Verfahren', 'Standbilder', 'stehende Verfahren')
        await insertDtag(db, 'subcategory', 'standbilder_variante_1', 65536, 'Variante 1', 'Standbilder > variante 1', 'Variante 1', 15)
        await insertDtag(db, 'subcategory', 'standbilder_variante_2', 98304, 'Variante 2', 'Standbilder > variante 2', 'Variante 2', 15)
        await insertDtag(db, 'subcategory', 'standbilder_variante_3', 131072, 'Variante 3', 'Standbilder > variante 3', 'Variante 3', 15)

        // Rollenspiel (bits 18-20): 3 bits = 8 values, category + 3 subcats
        await insertDtag(db, 'category', 'rollenspiel', 262144, 'Päd. Rollenspiel', 'Rollenspiel', 'Päd. Rollenspiel')
        await insertDtag(db, 'subcategory', 'rollenspiel_variante_1', 524288, 'Variante 1', 'Rollenspiel > variante 1', 'Variante 1', 18)
        await insertDtag(db, 'subcategory', 'rollenspiel_variante_2', 786432, 'Variante 2', 'Rollenspiel > variante 2', 'Variante 2', 18)
        await insertDtag(db, 'subcategory', 'rollenspiel_variante_3', 1048576, 'Variante 3', 'Rollenspiel > variante 3', 'Variante 3', 18)

        // TdU (bits 21-22): 2 bits = 4 values, category + 2 subcats
        await insertDtag(db, 'category', 'tdu', 2097152, 'Theater der Unterdrückten', 'TdU', 'Theater der Unterdrückten')
        await insertDtag(db, 'subcategory', 'tdu_forumtheater', 4194304, 'Forumtheater', 'TdU > Forumtheater', 'Forumtheater', 21)
        await insertDtag(db, 'subcategory', 'tdu_regenbogen_der_wuensche', 6291456, 'Regenbogen der Wünsche', 'TdU > Regenbogen der Wünsche', 'Regenbogen der Wünsche', 21)

        // Soziometrie (bit 23): 1 bit = 2 values, category only
        await insertDtag(db, 'category', 'soziometrie', 8388608, 'Beschreibung Soziometrie', 'Soziometrie', 'Beschreibung Soziometrie')

        // bewegte Themenarbeit (bit 24): 1 bit = 2 values, category only
        await insertDtag(db, 'category', 'bewegte_themenarbeit', 16777216, 'Beschreibung bewegte Themenarbeit & Jeux dramatiques', 'bewegte Themenarbeit', 'Beschreibung bewegte Themenarbeit & Jeux dramatiques')

        console.log('  ✓ Inserted Szenische Themenarbeit: 5 categories, 8 subcategories')

        // ==================== TagGroup 4: Pädagogische Regie (bits 25-30) ====================
        console.log('\n📖 Chapter 5: Insert TagGroup 4 - Pädagogische Regie')

        // zyklisch (bits 25-27): 3 bits = 8 values, category + 3 subcats
        await insertDtag(db, 'category', 'zyklisch', 33554432, 'postdramatisch-performative Projektarbeit & zyklische Produktionsprozesse', 'zyklisch', 'postdramatisch-performative Projektarbeit & zyklische Produktionsprozesse')
        await insertDtag(db, 'subcategory', 'zyklisch_rsvp_zyklus_modell', 67108864, 'RSVP-Zyklus-Modell', 'zyklisch > RSVP-Zyklus-Modell', 'RSVP-Zyklus-Modell', 25)
        await insertDtag(db, 'subcategory', 'zyklisch_variante_2', 100663296, 'Variante 2', 'zyklisch > variante 2', 'Variante 2', 25)
        await insertDtag(db, 'subcategory', 'zyklisch_theatrales_mischpult', 134217728, 'Theatrales Mischpult', 'zyklisch > Theatrales Mischpult', 'Theatrales Mischpult', 25)

        // linear (bits 28-29): 2 bits = 4 values, category + 2 subcats
        await insertDtag(db, 'category', 'linear', 268435456, 'episch-dramatische Projektarbeit & lineare Inszenierungskonzepte', 'linear', 'episch-dramatische Projektarbeit & lineare Inszenierungskonzepte')
        await insertDtag(db, 'subcategory', 'linear_7_tage_modell', 536870912, '7-Tage-Modell', 'linear > 7-Tage-Modell', '7-Tage-Modell', 28)
        await insertDtag(db, 'subcategory', 'linear_variante_2', 805306368, 'Variante 2', 'linear > variante 2', 'Variante 2', 28)

        // klassisch (bit 30): 1 bit = 2 values, category only (avoids sign bit!)
        await insertDtag(db, 'category', 'klassisch', 1073741824, 'klassisches Schul- & Amateurtheater', 'klassisch', 'klassisches Schul- & Amateurtheater')

        console.log('  ✓ Inserted Pädagogische Regie: 3 categories, 5 subcategories')

        // Summary
        console.log('\n📖 Chapter 6: Migration Summary')
        const newDtagsCount = await db.get('SELECT COUNT(*) as count FROM sysreg_dtags WHERE tagfamily = $1', ['dtags'])
        console.log(`  ✓ Total dtags entries: ${(newDtagsCount as any).count}`)
        console.log('  ✓ Bit allocation: 0-7, 8-14, 15-24, 25-30 (31 bits total, bit 31 unused)')
        console.log('  ✓ All entity dtags fields cleared')
        console.log('  ✓ All entries in sysreg_dtags table')
        console.log('\n✅ Migration 037 complete!')
    },

    async down(db: DatabaseAdapter): Promise<void> {
        console.log('Rolling back migration 037...')
        await db.run('DELETE FROM sysreg_dtags WHERE tagfamily = $1', ['dtags'])

        // Remove parent_bit column from sysreg parent table
        await db.exec(`
            DROP INDEX IF EXISTS idx_sysreg_parent_bit;
            ALTER TABLE sysreg DROP COLUMN IF EXISTS parent_bit;
        `)

        console.log('✅ Rollback complete')
    }
}
