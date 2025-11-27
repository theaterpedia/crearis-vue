/**
 * Migration 037: dtags Restructure with Theater Pedagogy Taxonomy
 * 
 * Changes:
 * 1. Delete all existing dtags entries
 * 2. Insert new dtags taxonomy (4 tag groups, 16 categories)
 * 3. Clear all entity dtags_val fields
 * 
 * New Structure:
 * - TagGroup 1: Spielform (bits 0-7, 4 categories)
 * - TagGroup 2: Animiertes Theaterspiel (bits 8-15, 4 categories)
 * - TagGroup 3: Szenische Themenarbeit (bits 16-25, 5 categories)
 * - TagGroup 4: Pädagogische Regie (bits 26-31, 3 categories)
 * 
 * Total: 32 bits, all allocated
 */

import type { DatabaseAdapter } from '../adapter'

// Helper function to insert a tag
async function insertTag(
    db: DatabaseAdapter,
    tagfamily: string,
    taglogic: string,
    name: string,
    value: number,
    description: string,
    labelDe: string,
    labelEn: string,
    descDe: string,
    descEn: string
) {
    const sql = 'INSERT INTO sysreg (tagfamily, taglogic, name, value, description, name_i18n, desc_i18n, is_default) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)'
    await db.run(sql, [
        tagfamily,
        taglogic,
        name,
        value,
        description,
        JSON.stringify({ de: labelDe, en: labelEn }),
        JSON.stringify({ de: descDe, en: descEn }),
        false
    ])
}

export const migration = {
    id: '037_dtags_restructure',
    description: 'Restructure dtags with theater pedagogy taxonomy',

    async up(db: DatabaseAdapter): Promise<void> {
        const isPostgres = db.type === 'postgresql'

        if (!isPostgres) {
            throw new Error('Migration 037 requires PostgreSQL.')
        }

        console.log('Running migration 037: dtags Restructure...')
        console.log('⚠️  WARNING: This migration will DELETE all existing dtags!')

        // Delete existing dtags
        console.log('\n📖 Chapter 1: Delete existing dtags')
        await db.run('DELETE FROM sysreg WHERE tagfamily = $1', ['dtags'])
        console.log('  ✓ Deleted all existing dtags entries')

        // Clear entity dtags fields (only in tables that have this column)
        const entityTables = ['images', 'projects', 'events', 'posts']
        for (const table of entityTables) {
            const tableExists = await db.get(
                'SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = $1)',
                [table]
            )
            if (tableExists && (tableExists as any).exists) {
                // Check if dtags column exists
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

        // TagGroup 1: Spielform (bits 0-7)
        console.log('\n📖 Chapter 2: Insert TagGroup 1 - Spielform')

        // Kreisspiel (bits 0-1)
        await insertTag(db, 'dtags', 'category', 'kreisspiel', 1, 'Beschreibung Kreisspiel', 'Kreisspiel', 'Circle Game', 'Beschreibung Kreisspiel', 'Circle game description')
        await insertTag(db, 'dtags', 'subcategory', 'kreisspiel > kreativimpuls', 2, 'Kreativimpuls', 'Kreativimpuls', 'Creative Impulse', 'Kreativimpuls', 'Creative impulse')
        await insertTag(db, 'dtags', 'subcategory', 'kreisspiel > energieimpuls', 3, 'Energieimpuls', 'Energieimpuls', 'Energy Impulse', 'Energieimpuls', 'Energy impulse')

        // Raumlauf (bits 2-3)
        await insertTag(db, 'dtags', 'category', 'raumlauf', 4, 'Beschreibung Raumlauf', 'Raumlauf', 'Space Walk', 'Beschreibung Raumlauf', 'Space walk description')
        await insertTag(db, 'dtags', 'subcategory', 'raumlauf > einzelgaenger', 8, 'Einzelgänger', 'Einzelgänger', 'Soloist', 'Einzelgänger', 'Individual walking')
        await insertTag(db, 'dtags', 'subcategory', 'raumlauf > begegnungen', 12, 'Begegnungen', 'Begegnungen', 'Encounters', 'Begegnungen', 'Encounters walking')

        // Kleingruppen (bits 4-5)
        await insertTag(db, 'dtags', 'category', 'kleingruppen', 16, 'Beschreibung Kleingruppen', 'Kleingruppen', 'Small Groups', 'Beschreibung Kleingruppen', 'Small groups description')
        await insertTag(db, 'dtags', 'subcategory', 'kleingruppen > variante 1', 32, 'Variante 1', 'Variante 1', 'Variant 1', 'Variante 1', 'Variant 1')
        await insertTag(db, 'dtags', 'subcategory', 'kleingruppen > variante 2', 48, 'Variante 2', 'Variante 2', 'Variant 2', 'Variante 2', 'Variant 2')

        // Forum (bits 6-7) - 3 subcategories only
        await insertTag(db, 'dtags', 'category', 'forum', 64, 'Beschreibung Forum/Bühne', 'Forum', 'Forum', 'Beschreibung Forum/Bühne', 'Forum/Stage description')
        await insertTag(db, 'dtags', 'subcategory', 'forum > abklatschspiel', 128, 'Abklatschspiel', 'Abklatschspiel', 'Mime Game', 'Abklatschspiel', 'Mime game')
        await insertTag(db, 'dtags', 'subcategory', 'forum > werkstattprobe', 192, 'Werkstattprobe', 'Werkstattprobe', 'Workshop Rehearsal', 'Werkstattprobe', 'Workshop rehearsal')

        console.log('  ✓ Inserted Spielform: 4 categories, 8 subcategories')

        // TagGroup 2: Animiertes Theaterspiel (bits 8-15)
        console.log('\n📖 Chapter 3: Insert TagGroup 2 - Animiertes Theaterspiel')

        // El. Animation (bits 8-9)
        await insertTag(db, 'dtags', 'category', 'el_animation', 256, 'Elementare Animation', 'El. Animation', 'Elem. Animation', 'Elementare Animation', 'Elementary animation')
        await insertTag(db, 'dtags', 'subcategory', 'el_animation > zwei_kreise_modell', 512, 'Zwei-Kreise-Modell', 'Zwei-Kreise-Modell', 'Two-Circles Model', 'Zwei-Kreise-Modell', 'Two-circles model')
        await insertTag(db, 'dtags', 'subcategory', 'el_animation > variante 2', 768, 'Variante 2', 'Variante 2', 'Variant 2', 'Variante 2', 'Variant 2')

        // Sz. Animation (bits 10-11)
        await insertTag(db, 'dtags', 'category', 'sz_animation', 1024, 'Szenische Animation', 'Sz. Animation', 'Scenic Animation', 'Szenische Animation', 'Scenic animation')
        await insertTag(db, 'dtags', 'subcategory', 'sz_animation > variante 1', 2048, 'Variante 1', 'Variante 1', 'Variant 1', 'Variante 1', 'Variant 1')
        await insertTag(db, 'dtags', 'subcategory', 'sz_animation > variante 2', 3072, 'Variante 2', 'Variante 2', 'Variant 2', 'Variante 2', 'Variant 2')

        // Impro (bits 12-13)
        await insertTag(db, 'dtags', 'category', 'impro', 4096, 'klass. Improtheater', 'Impro', 'Improv', 'klass. Improtheater', 'Classic improv theater')
        await insertTag(db, 'dtags', 'subcategory', 'impro > variante 1', 8192, 'Variante 1', 'Variante 1', 'Variant 1', 'Variante 1', 'Variant 1')
        await insertTag(db, 'dtags', 'subcategory', 'impro > variante 2', 12288, 'Variante 2', 'Variante 2', 'Variant 2', 'Variante 2', 'Variant 2')

        // animiert (bits 14-15)
        await insertTag(db, 'dtags', 'category', 'animiert', 16384, 'animierte Kurzprojekte', 'animiert', 'animated', 'animierte Kurzprojekte', 'Animated short projects')
        await insertTag(db, 'dtags', 'subcategory', 'animiert > safari', 32768, 'SAFARI', 'SAFARI', 'SAFARI', 'SAFARI', 'SAFARI')
        await insertTag(db, 'dtags', 'subcategory', 'animiert > variante 2', 49152, 'Variante 2', 'Variante 2', 'Variant 2', 'Variante 2', 'Variant 2')

        console.log('  ✓ Inserted Animiertes Theaterspiel: 4 categories, 8 subcategories')

        // TagGroup 3: Szenische Themenarbeit (bits 16-25)
        console.log('\n📖 Chapter 4: Insert TagGroup 3 - Szenische Themenarbeit')

        // Standbilder (bits 16-17)
        await insertTag(db, 'dtags', 'category', 'standbilder', 65536, 'stehende Verfahren', 'Standbilder', 'Still Images', 'stehende Verfahren', 'Static methods')
        await insertTag(db, 'dtags', 'subcategory', 'standbilder > variante 1', 131072, 'Variante 1', 'Variante 1', 'Variant 1', 'Variante 1', 'Variant 1')
        await insertTag(db, 'dtags', 'subcategory', 'standbilder > variante 2', 196608, 'Variante 2', 'Variante 2', 'Variant 2', 'Variante 2', 'Variant 2')

        // Rollenspiel (bits 18-19)
        await insertTag(db, 'dtags', 'category', 'rollenspiel', 262144, 'Päd. Rollenspiel', 'Rollenspiel', 'Role Play', 'Päd. Rollenspiel', 'Pedagogical role play')
        await insertTag(db, 'dtags', 'subcategory', 'rollenspiel > variante 1', 524288, 'Variante 1', 'Variante 1', 'Variant 1', 'Variante 1', 'Variant 1')
        await insertTag(db, 'dtags', 'subcategory', 'rollenspiel > variante 2', 786432, 'Variante 2', 'Variante 2', 'Variant 2', 'Variante 2', 'Variant 2')

        // TdU (bits 20-21)
        await insertTag(db, 'dtags', 'category', 'tdu', 1048576, 'Theater der Unterdrückten', 'TdU', 'TdU', 'Theater der Unterdrückten', 'Theater of the Oppressed')
        await insertTag(db, 'dtags', 'subcategory', 'tdu > forumtheater', 2097152, 'Forumtheater', 'Forumtheater', 'Forum Theater', 'Forumtheater', 'Forum theater')
        await insertTag(db, 'dtags', 'subcategory', 'tdu > klassische_verfahren', 3145728, 'klassische Verfahren', 'klassische Verfahren', 'Classic Methods', 'klassische Verfahren', 'Classic methods')

        // Soziometrie (bits 22-23)
        await insertTag(db, 'dtags', 'category', 'soziometrie', 4194304, 'Beschreibung Soziometrie', 'Soziometrie', 'Sociometry', 'Beschreibung Soziometrie', 'Sociometry description')
        await insertTag(db, 'dtags', 'subcategory', 'soziometrie > variante 1', 8388608, 'Variante 1', 'Variante 1', 'Variant 1', 'Variante 1', 'Variant 1')
        await insertTag(db, 'dtags', 'subcategory', 'soziometrie > variante 2', 12582912, 'Variante 2', 'Variante 2', 'Variant 2', 'Variante 2', 'Variant 2')

        // bewegte Themenarbeit (bits 24-25)
        await insertTag(db, 'dtags', 'category', 'bewegte_themenarbeit', 16777216, 'Beschreibung bewegte Themenarbeit', 'bewegte Themenarbeit', 'Dynamic Theme Work', 'Beschreibung bewegte Themenarbeit', 'Dynamic theme work description')
        await insertTag(db, 'dtags', 'subcategory', 'bewegte_themenarbeit > jeux_dramatiques', 33554432, 'Jeux Dramatiques', 'Jeux Dramatiques', 'Jeux Dramatiques', 'Jeux Dramatiques', 'Jeux Dramatiques')
        await insertTag(db, 'dtags', 'subcategory', 'bewegte_themenarbeit > performativ', 50331648, 'performativ', 'performativ', 'performative', 'performativ', 'Performative approach')

        console.log('  ✓ Inserted Szenische Themenarbeit: 5 categories, 10 subcategories')

        // TagGroup 4: Pädagogische Regie (bits 26-31)
        console.log('\n📖 Chapter 5: Insert TagGroup 4 - Pädagogische Regie')

        // zyklisch (bits 26-27)
        await insertTag(db, 'dtags', 'category', 'zyklisch', 67108864, 'postdramatisch-performative Projektarbeit & zyklische Produktionsprozesse', 'zyklisch', 'cyclic', 'postdramatisch-performative Projektarbeit & zyklische Produktionsprozesse', 'Post-dramatic performative project work & cyclic production processes')
        await insertTag(db, 'dtags', 'subcategory', 'zyklisch > variante 1', 134217728, 'Variante 1', 'Variante 1', 'Variant 1', 'Variante 1', 'Variant 1')
        await insertTag(db, 'dtags', 'subcategory', 'zyklisch > variante 2', 201326592, 'Variante 2', 'Variante 2', 'Variant 2', 'Variante 2', 'Variant 2')

        // linear (bits 28-29)
        await insertTag(db, 'dtags', 'category', 'linear', 268435456, 'episch-dramatische Projektarbeit & lineare Inszenierungskonzepte', 'linear', 'linear', 'episch-dramatische Projektarbeit & lineare Inszenierungskonzepte', 'Epic-dramatic project work & linear staging concepts')
        await insertTag(db, 'dtags', 'subcategory', 'linear > variante 1', 536870912, 'Variante 1', 'Variante 1', 'Variant 1', 'Variante 1', 'Variant 1')
        await insertTag(db, 'dtags', 'subcategory', 'linear > variante 2', 805306368, 'Variante 2', 'Variante 2', 'Variant 2', 'Variante 2', 'Variant 2')

        // klassisch (bits 30-31)
        // Note: bit 31 is the sign bit in signed 32-bit integers
        // bit 30 = 2^30 = 1073741824
        // bit 31 = -2^31 = -2147483648
        // both = -2^31 + 2^30 = -1073741824
        await insertTag(db, 'dtags', 'category', 'klassisch', 1073741824, 'klassisches Schul- & Amateurtheater', 'klassisch', 'classic', 'klassisches Schul- & Amateurtheater', 'Classic school & amateur theater')
        await insertTag(db, 'dtags', 'subcategory', 'klassisch > variante 1', -2147483648, 'Variante 1', 'Variante 1', 'Variant 1', 'Variante 1', 'Variant 1')
        await insertTag(db, 'dtags', 'subcategory', 'klassisch > variante 2', -1073741824, 'Variante 2', 'Variante 2', 'Variant 2', 'Variante 2', 'Variant 2')

        console.log('  ✓ Inserted Pädagogische Regie: 3 categories, 6 subcategories')

        // Summary
        console.log('\n📖 Chapter 6: Migration Summary')
        const newDtagsCount = await db.get('SELECT COUNT(*) as count FROM sysreg WHERE tagfamily = $1', ['dtags'])
        console.log(`  ✓ Total dtags entries: ${(newDtagsCount as any).count}`)
        console.log('  ✓ Bit allocation: 0-7, 8-15, 16-25, 26-31 (32 bits total)')
        console.log('  ✓ All entity dtags fields cleared')
        console.log('\n✅ Migration 037 complete!')
    },

    async down(db: DatabaseAdapter): Promise<void> {
        console.log('Rolling back migration 037...')
        await db.run('DELETE FROM sysreg WHERE tagfamily = $1', ['dtags'])
        console.log('✅ Rollback complete')
    }
}
