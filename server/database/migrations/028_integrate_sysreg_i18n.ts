/**
 * Migration 028: Integrate Sysreg with i18n System
 * 
 * IMPORTANT: Use pnpm, NOT npm!
 * This project uses pnpm for package management.
 * 
 * This migration unifies the translation system by moving sysreg translations
 * from the sysreg table into the i18n_codes table.
 * 
 * Package: C (022-029) - Alpha features with reversible migrations
 * 
 * Changes:
 * 1. Add 'sysreg' to i18n_codes type CHECK constraint
 * 2. Copy all sysreg translations to i18n_codes with type='sysreg'
 * 3. Use variation field to store tagfamily context
 * 
 * Benefits:
 * - Single translation source of truth
 * - StatusOverview can show all translations including sysreg
 * - Unified translation management
 * - Better type safety with useI18n().sysreg()
 */

import type { DatabaseAdapter } from '../adapter'

export const migration = {
    id: '028_integrate_sysreg_i18n',
    description: 'Integrate sysreg translations into unified i18n system',

    async up(db: DatabaseAdapter): Promise<void> {
        const isPostgres = db.type === 'postgresql'

        if (!isPostgres) {
            throw new Error('Migration 028 requires PostgreSQL')
        }

        console.log('\n📦 Migration 028: Integrate Sysreg with i18n System')
        console.log('='.repeat(60))

        // ====================================================================
        // Step 1: Add 'sysreg' to i18n_codes type constraint
        // ====================================================================

        console.log('\n🔧 Step 1: Updating i18n_codes type constraint...')

        // PostgreSQL: Drop and recreate CHECK constraint
        await db.exec(`
            ALTER TABLE i18n_codes 
            DROP CONSTRAINT IF EXISTS i18n_codes_type_check
        `)

        await db.exec(`
            ALTER TABLE i18n_codes 
            ADD CONSTRAINT i18n_codes_type_check 
            CHECK (type IN ('button', 'nav', 'field', 'desc', 'sysreg'))
        `)

        console.log('   ✓ Updated type constraint')

        // ====================================================================
        // Step 2: Migrate sysreg translations to i18n_codes
        // ====================================================================

        console.log('\n📋 Step 2: Migrating sysreg translations to i18n_codes...')

        // Fetch all sysreg entries with translations
        const sysregEntries = await db.all(`
            SELECT 
                name,
                tagfamily,
                name_i18n,
                desc_i18n
            FROM sysreg
            ORDER BY tagfamily, name
        `, [])

        console.log(`   Found ${sysregEntries.length} sysreg entries to migrate`)

        let migratedCount = 0
        let skippedCount = 0

        for (const entry of sysregEntries) {
            const name = (entry as any).name
            const tagfamily = (entry as any).tagfamily
            const nameI18n = (entry as any).name_i18n
            const descI18n = (entry as any).desc_i18n

            // Skip if no translations
            if (!nameI18n || Object.keys(nameI18n).length === 0) {
                skippedCount++
                continue
            }

            // Build text object with all available languages
            const text: any = {}

            // Add name translations
            if (nameI18n.de) text.de = nameI18n.de
            if (nameI18n.en) text.en = nameI18n.en
            if (nameI18n.cz) text.cz = nameI18n.cz

            // Fallback: use name as English if no translations exist
            if (Object.keys(text).length === 0) {
                text.en = name
            }

            try {
                // Insert name translation
                await db.run(`
                    INSERT INTO i18n_codes (name, variation, type, text, status)
                    VALUES ($1, $2, 'sysreg', $3, 'ok')
                `, [name, tagfamily, JSON.stringify(text)])

                migratedCount++

                // If description exists, insert it as a separate entry
                if (descI18n && Object.keys(descI18n).length > 0) {
                    const descText: any = {}
                    if (descI18n.de) descText.de = descI18n.de
                    if (descI18n.en) descText.en = descI18n.en
                    if (descI18n.cz) descText.cz = descI18n.cz

                    await db.run(`
                        INSERT INTO i18n_codes (name, variation, type, text, status)
                        VALUES ($1, $2, 'desc', $3, 'ok')
                    `, [`${name}_desc`, tagfamily, JSON.stringify(descText)])

                    migratedCount++
                }
            } catch (error: any) {
                // Check if it's a duplicate entry error
                if (error.message?.includes('duplicate') || error.code === '23505') {
                    console.warn(`   ⚠ Skipping duplicate: ${name} (${tagfamily})`)
                    skippedCount++
                } else {
                    throw error
                }
            }
        }

        console.log(`   ✓ Migrated ${migratedCount} translation entries`)
        if (skippedCount > 0) {
            console.log(`   ⚠ Skipped ${skippedCount} entries (no translations or duplicates)`)
        }

        // ====================================================================
        // Summary
        // ====================================================================

        console.log('\n' + '='.repeat(60))
        console.log('✅ Migration 028 completed successfully!')
        console.log(`   • Updated i18n_codes type constraint to include 'sysreg'`)
        console.log(`   • Migrated ${migratedCount} sysreg translations to i18n_codes`)
        console.log('   • Sysreg translations now unified with app i18n system')
        console.log('='.repeat(60))
    },

    async down(db: DatabaseAdapter): Promise<void> {
        const isPostgres = db.type === 'postgresql'

        if (!isPostgres) {
            throw new Error('Migration 028 rollback requires PostgreSQL')
        }

        console.log('\n⏪ Rolling back Migration 028: Integrate Sysreg with i18n System')

        // Remove sysreg entries from i18n_codes
        await db.run(`DELETE FROM i18n_codes WHERE type = 'sysreg'`, [])

        // Restore original type constraint (without 'sysreg')
        await db.exec(`
            ALTER TABLE i18n_codes 
            DROP CONSTRAINT IF EXISTS i18n_codes_type_check
        `)

        await db.exec(`
            ALTER TABLE i18n_codes 
            ADD CONSTRAINT i18n_codes_type_check 
            CHECK (type IN ('button', 'nav', 'field', 'desc'))
        `)

        console.log('✅ Migration 028 rolled back successfully')
    }
}
