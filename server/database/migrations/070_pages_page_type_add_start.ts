/**
 * Migration 070: allow 'start' as a pages.page_type
 *
 * The `pages_page_type_check` CHECK was defined in migration 013 as
 * `page_type IN ('landing','event','post','team')` — it predates the /start route,
 * so 5C's TempStartConfig cannot persist a start pages-row (site_layout / body_type /
 * start_intro have nowhere to land). Additive widening only — no existing row can
 * violate the new set. Forward migration: the value exists on no DB yet, so prod
 * needs this too (editing 013 in place would reach only fresh replays).
 *
 * @see hcv/threads/2026-08-negative-spec.md Class 1·2 · uia thread §21·2
 */

import type { DatabaseAdapter } from '../adapter'

export const migration = {
    id: '070_pages_page_type_add_start',
    description: "Widen pages_page_type_check to include 'start' (unblocks /start persistence)",

    async up(db: DatabaseAdapter) {
        await db.exec(`ALTER TABLE pages DROP CONSTRAINT IF EXISTS pages_page_type_check`)
        await db.exec(`
            ALTER TABLE pages ADD CONSTRAINT pages_page_type_check
            CHECK (page_type IN ('landing','event','post','team','start'))
        `)
        console.log("[Migration 070] pages.page_type now allows 'start'")
    },

    async down(db: DatabaseAdapter) {
        // Reversible only while no 'start' rows exist (they would violate the narrow set).
        await db.exec(`ALTER TABLE pages DROP CONSTRAINT IF EXISTS pages_page_type_check`)
        await db.exec(`
            ALTER TABLE pages ADD CONSTRAINT pages_page_type_check
            CHECK (page_type IN ('landing','event','post','team'))
        `)
    }
}
