/**
 * Migration 062: Drop Legacy Instructor/Participant Triggers
 * 
 * Migration 061 removed instructor_id and participant_id columns from users table,
 * but the triggers update_instructor_is_user() and update_participant_is_user() 
 * still reference them. This migration drops both triggers and functions.
 * 
 * The triggers were originally created in migration 019 to maintain
 * instructors.is_user and participants.is_user based on users table linkage.
 * With the new partners system, this is no longer needed.
 */

import type { DatabaseAdapter } from '../adapter'

export async function up(db: DatabaseAdapter) {
    const isPostgres = db.type === 'postgresql'
    if (!isPostgres) {
        console.log('Migration 062: Skipping (SQLite not affected)')
        return
    }

    console.log('Running migration 062: Drop Legacy Instructor/Participant Triggers...')

    // Drop instructor trigger and function
    await db.exec(`
        DROP TRIGGER IF EXISTS trg_update_instructor_is_user ON users
    `)
    await db.exec(`
        DROP FUNCTION IF EXISTS update_instructor_is_user()
    `)
    console.log('  ✓ Dropped instructor trigger and function')

    // Drop participant trigger and function
    await db.exec(`
        DROP TRIGGER IF EXISTS trg_update_participant_is_user ON users
    `)
    await db.exec(`
        DROP FUNCTION IF EXISTS update_participant_is_user()
    `)
    console.log('  ✓ Dropped participant trigger and function')

    console.log('✅ Migration 062 complete: Legacy triggers removed')
}

export async function down(db: DatabaseAdapter) {
    // No rollback - the triggers referenced removed columns
    console.log('Migration 062 down: No rollback (triggers referenced removed columns)')
}
