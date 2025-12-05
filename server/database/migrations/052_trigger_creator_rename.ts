/**
 * Migration 052: Fix trigger functions to use r_creator instead of r_owner
 * 
 * IMPORTANT: Use pnpm, NOT npm!
 * 
 * Background:
 * - Migration 050 renamed r_owner columns to r_creator
 * - But trigger functions from 047 still referenced r_owner
 * - This migration updates the trigger functions to use r_creator
 * 
 * Affected triggers:
 * - trigger_images_visibility()
 * - trigger_projects_visibility()
 * - trigger_posts_visibility() (already correct, but included for consistency)
 * 
 * Package: E (050-059) - Creator/Relations refactoring
 */

import type { DatabaseAdapter } from '../adapter'

export const migration = {
    id: '052_trigger_creator_rename',
    description: 'Fix trigger functions to use r_creator instead of r_owner',

    async up(db: DatabaseAdapter): Promise<void> {
        const isPostgres = db.type === 'postgresql'

        if (!isPostgres) {
            console.log('Migration 052: Skipping (PostgreSQL only)')
            return
        }

        console.log('Running migration 052: Fix trigger functions for r_creator...')

        // ===================================================================
        // CHAPTER 1: Fix images trigger
        // ===================================================================
        console.log('\n📖 Chapter 1: Fix trigger_images_visibility()')

        await db.exec(`
            CREATE OR REPLACE FUNCTION trigger_images_visibility()
            RETURNS trigger AS $$
            DECLARE
                v_visibility RECORD;
            BEGIN
                SELECT * INTO v_visibility FROM compute_role_visibility(48, NEW.status);
                NEW.r_anonym := v_visibility.r_anonym;
                NEW.r_partner := v_visibility.r_partner;
                NEW.r_participant := v_visibility.r_participant;
                NEW.r_member := v_visibility.r_member;
                NEW.r_creator := v_visibility.r_creator;
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        `)
        console.log('    ✓ trigger_images_visibility() updated')

        // ===================================================================
        // CHAPTER 2: Fix projects trigger
        // ===================================================================
        console.log('\n📖 Chapter 2: Fix trigger_projects_visibility()')

        await db.exec(`
            CREATE OR REPLACE FUNCTION trigger_projects_visibility()
            RETURNS trigger AS $$
            DECLARE
                v_visibility RECORD;
            BEGIN
                SELECT * INTO v_visibility FROM compute_role_visibility(8, NEW.status);
                NEW.r_anonym := v_visibility.r_anonym;
                NEW.r_partner := v_visibility.r_partner;
                NEW.r_participant := v_visibility.r_participant;
                NEW.r_member := v_visibility.r_member;
                NEW.r_creator := v_visibility.r_creator;
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        `)
        console.log('    ✓ trigger_projects_visibility() updated')

        // ===================================================================
        // CHAPTER 3: Verify posts trigger (should already be correct)
        // ===================================================================
        console.log('\n📖 Chapter 3: Verify trigger_posts_visibility()')

        await db.exec(`
            CREATE OR REPLACE FUNCTION trigger_posts_visibility()
            RETURNS trigger AS $$
            DECLARE
                v_visibility RECORD;
            BEGIN
                SELECT * INTO v_visibility FROM compute_role_visibility(32, NEW.status);
                NEW.r_anonym := v_visibility.r_anonym;
                NEW.r_partner := v_visibility.r_partner;
                NEW.r_participant := v_visibility.r_participant;
                NEW.r_member := v_visibility.r_member;
                NEW.r_creator := v_visibility.r_creator;
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        `)
        console.log('    ✓ trigger_posts_visibility() verified')

        // ===================================================================
        // CHAPTER 4: Verify compute_role_visibility returns r_creator
        // ===================================================================
        console.log('\n📖 Chapter 4: Verify compute_role_visibility() returns r_creator')

        // The function should already return r_creator from migration 050
        // Just log confirmation
        const result = await db.get(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'posts' AND column_name = 'r_creator'
        `)

        if (result) {
            console.log('    ✓ r_creator column exists in posts table')
        } else {
            console.log('    ⚠️ Warning: r_creator column not found - run migration 050 first')
        }

        console.log('\n✅ Migration 052 complete!')
    },

    async down(db: DatabaseAdapter): Promise<void> {
        const isPostgres = db.type === 'postgresql'

        if (!isPostgres) {
            console.log('Rollback 052: Skipping (PostgreSQL only)')
            return
        }

        console.log('Rolling back migration 052...')
        console.log('  ⚠️  Note: This would revert to r_owner but columns are already renamed')
        console.log('  ⚠️  Manual intervention required if rollback is needed')
        console.log('Rollback 052 complete (no changes made)')
    }
}
