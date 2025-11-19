/**
 * Migration 026: Seed New sysreg Entries
 * 
 * IMPORTANT: Use pnpm, NOT npm!
 * This project uses pnpm for package management.
 * 
 * Seeds new entries for config, rtags, ttags, and dtags tagfamilies.
 * Status and ctags were already seeded from old system in migration 022.
 * 
 * Package: C (022-029) - Alpha features with reversible migrations
 * 
 * Seeds:
 * - config: Configuration flags (visibility, access control, etc.)
 * - rtags: Record-specific tags (to be defined by application needs)
 * - ttags: Topic tags (democracy, environment, etc.)
 * - dtags: Domain tags (games, education, etc.)
 */

import type { DatabaseAdapter } from '../adapter'

export const migration = {
    id: '026_seed_new_sysreg_entries',
    description: 'Seed new config, rtags, ttags, and dtags entries for sysreg system',

    async up(db: DatabaseAdapter): Promise<void> {
        const isPostgres = db.type === 'postgresql'

        if (!isPostgres) {
            throw new Error('Migration 026 requires PostgreSQL')
        }

        console.log('Running migration 026: Seed new sysreg entries...')

        // ===================================================================
        // CHAPTER 1: Seed Config Entries
        // ===================================================================
        console.log('\n📖 Chapter 1: Seed Config Entries')

        const configEntries = [
            // Visibility flags (bits 0-1)
            { value: '\\x01', name: 'public', description: 'Publicly visible', taglogic: 'toggle', is_default: false },
            { value: '\\x02', name: 'private', description: 'Private/internal only', taglogic: 'toggle', is_default: false },
            { value: '\\x04', name: 'draft', description: 'Draft mode', taglogic: 'toggle', is_default: false },

            // Feature flags (bits 4-7)
            { value: '\\x10', name: 'featured', description: 'Featured content', taglogic: 'toggle', is_default: false },
            { value: '\\x20', name: 'archived', description: 'Archived/historical', taglogic: 'toggle', is_default: false },
            { value: '\\x40', name: 'locked', description: 'Locked for editing', taglogic: 'toggle', is_default: false },
        ]

        let configCount = 0
        for (const entry of configEntries) {
            try {
                await db.exec(`
                    INSERT INTO sysreg (value, name, description, tagfamily, taglogic, is_default)
                    VALUES ('${entry.value}'::bytea, '${entry.name}', '${entry.description}', 'config', '${entry.taglogic}', ${entry.is_default})
                    ON CONFLICT (value, tagfamily) DO NOTHING
                `)
                configCount++
            } catch (error) {
                console.warn(`    ⚠️  Skipped duplicate config: ${entry.name}`)
            }
        }

        console.log(`    ✓ Seeded ${configCount} config entries`)

        // ===================================================================
        // CHAPTER 2: Seed Record Tags (rtags)
        // ===================================================================
        console.log('\n📖 Chapter 2: Seed Record Tags (rtags)')

        const rtagsEntries = [
            // Record-specific markers
            { value: '\\x01', name: 'favorite', description: 'User favorite', taglogic: 'toggle', is_default: false },
            { value: '\\x02', name: 'pinned', description: 'Pinned to top', taglogic: 'toggle', is_default: false },
            { value: '\\x04', name: 'urgent', description: 'Urgent/priority', taglogic: 'toggle', is_default: false },
            { value: '\\x08', name: 'reviewed', description: 'Reviewed/checked', taglogic: 'toggle', is_default: false },
        ]

        let rtagsCount = 0
        for (const entry of rtagsEntries) {
            try {
                await db.exec(`
                    INSERT INTO sysreg (value, name, description, tagfamily, taglogic, is_default)
                    VALUES ('${entry.value}'::bytea, '${entry.name}', '${entry.description}', 'rtags', '${entry.taglogic}', ${entry.is_default})
                    ON CONFLICT (value, tagfamily) DO NOTHING
                `)
                rtagsCount++
            } catch (error) {
                console.warn(`    ⚠️  Skipped duplicate rtag: ${entry.name}`)
            }
        }

        console.log(`    ✓ Seeded ${rtagsCount} rtags entries`)

        // ===================================================================
        // CHAPTER 3: Seed Topic Tags (ttags)
        // ===================================================================
        console.log('\n📖 Chapter 3: Seed Topic Tags (ttags)')

        const ttagsEntries = [
            // Political/social topics
            { value: '\\x01', name: 'democracy', description: 'Democracy and participation', taglogic: 'toggle', is_default: false },
            { value: '\\x02', name: 'environment', description: 'Environmental issues', taglogic: 'toggle', is_default: false },
            { value: '\\x04', name: 'equality', description: 'Equality and justice', taglogic: 'toggle', is_default: false },
            { value: '\\x08', name: 'education', description: 'Education and learning', taglogic: 'toggle', is_default: false },
            { value: '\\x10', name: 'culture', description: 'Arts and culture', taglogic: 'toggle', is_default: false },
            { value: '\\x20', name: 'health', description: 'Health and wellbeing', taglogic: 'toggle', is_default: false },
        ]

        let ttagsCount = 0
        for (const entry of ttagsEntries) {
            try {
                await db.exec(`
                    INSERT INTO sysreg (value, name, description, tagfamily, taglogic, is_default)
                    VALUES ('${entry.value}'::bytea, '${entry.name}', '${entry.description}', 'ttags', '${entry.taglogic}', ${entry.is_default})
                    ON CONFLICT (value, tagfamily) DO NOTHING
                `)
                ttagsCount++
            } catch (error) {
                console.warn(`    ⚠️  Skipped duplicate ttag: ${entry.name}`)
            }
        }

        console.log(`    ✓ Seeded ${ttagsCount} ttags entries`)

        // ===================================================================
        // CHAPTER 4: Seed Domain Tags (dtags)
        // ===================================================================
        console.log('\n📖 Chapter 4: Seed Domain Tags (dtags)')

        const dtagsEntries = [
            // Application domains
            { value: '\\x01', name: 'games', description: 'Games and play', taglogic: 'toggle', is_default: false },
            { value: '\\x02', name: 'workshops', description: 'Workshops and training', taglogic: 'toggle', is_default: false },
            { value: '\\x04', name: 'performance', description: 'Theatre and performance', taglogic: 'toggle', is_default: false },
            { value: '\\x08', name: 'discussion', description: 'Discussions and debates', taglogic: 'toggle', is_default: false },
            { value: '\\x10', name: 'creative', description: 'Creative activities', taglogic: 'toggle', is_default: false },
        ]

        let dtagsCount = 0
        for (const entry of dtagsEntries) {
            try {
                await db.exec(`
                    INSERT INTO sysreg (value, name, description, tagfamily, taglogic, is_default)
                    VALUES ('${entry.value}'::bytea, '${entry.name}', '${entry.description}', 'dtags', '${entry.taglogic}', ${entry.is_default})
                    ON CONFLICT (value, tagfamily) DO NOTHING
                `)
                dtagsCount++
            } catch (error) {
                console.warn(`    ⚠️  Skipped duplicate dtag: ${entry.name}`)
            }
        }

        console.log(`    ✓ Seeded ${dtagsCount} dtags entries`)

        // ===================================================================
        // CHAPTER 5: Summary
        // ===================================================================
        console.log('\n📊 Migration Summary:')

        const counts = await db.all(`
            SELECT tagfamily, COUNT(*) as count
            FROM sysreg
            GROUP BY tagfamily
            ORDER BY tagfamily
        `, [])

        console.log('  Final sysreg counts by tagfamily:')
        for (const row of counts) {
            console.log(`    ${(row as any).tagfamily}: ${(row as any).count} entries`)
        }

        console.log('\n  New entries seeded:')
        console.log(`    config: ${configCount} entries`)
        console.log(`    rtags: ${rtagsCount} entries`)
        console.log(`    ttags: ${ttagsCount} entries`)
        console.log(`    dtags: ${dtagsCount} entries`)
        console.log(`    Total: ${configCount + rtagsCount + ttagsCount + dtagsCount} new entries`)

        console.log('\n✅ Migration 026 completed: New sysreg entries seeded')
    },

    async down(db: DatabaseAdapter): Promise<void> {
        console.log('Rolling back migration 026: Removing seeded entries...')

        // Delete only entries that were added in this migration
        // (Keep status and ctags from migration 022)
        await db.exec(`
            DELETE FROM sysreg 
            WHERE tagfamily IN ('config', 'rtags', 'ttags', 'dtags')
        `)

        console.log('✅ Migration 026 rollback completed')
    }
}
