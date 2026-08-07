/**
 * Migration 071: flip the inverted pages.*_has_content generated columns
 *
 * Migration 019 ch.12.5 defined the pages-level generated columns as
 * `GENERATED ALWAYS AS (COALESCE(<x>_options::text,'{}') = '{}')` — TRUE when EMPTY,
 * the opposite of the identically-named projects-level columns (true-when-NON-empty).
 * One name, two opposite semantics. Consumer is display-only (`usePageConfig.hasContent`
 * → config-panel booleans); nothing routes/gates on it, so the panel booleans have
 * simply been wrong for pages. This flips them to match projects (has_content means
 * has-content). Generated columns cannot be ALTERed in place → DROP + re-ADD.
 * Forward migration (the corrected expression exists on no DB yet).
 *
 * @see hcv/threads/2026-08-project-status.md §5 (CV episdesigner finding, 2026-08-06)
 */

import type { DatabaseAdapter } from '../adapter'

const SLOTS = ['page', 'aside', 'header', 'footer'] as const

export const migration = {
    id: '071_pages_flip_has_content',
    description: 'Flip inverted pages.*_has_content to true-when-non-empty (match projects)',

    async up(db: DatabaseAdapter) {
        for (const s of SLOTS) {
            await db.exec(`ALTER TABLE pages DROP COLUMN IF EXISTS ${s}_has_content`)
            await db.exec(`
                ALTER TABLE pages ADD COLUMN ${s}_has_content BOOLEAN
                GENERATED ALWAYS AS (COALESCE(${s}_options::text, '{}') <> '{}') STORED
            `)
        }
        console.log('[Migration 071] pages.*_has_content flipped to true-when-non-empty')
    },

    async down(db: DatabaseAdapter) {
        // Restore the original (inverted) true-when-empty expression.
        for (const s of SLOTS) {
            await db.exec(`ALTER TABLE pages DROP COLUMN IF EXISTS ${s}_has_content`)
            await db.exec(`
                ALTER TABLE pages ADD COLUMN ${s}_has_content BOOLEAN
                GENERATED ALWAYS AS (COALESCE(${s}_options::text, '{}') = '{}') STORED
            `)
        }
    }
}
