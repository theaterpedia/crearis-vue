/**
 * Migration: 003_entity_task_triggers
 * Description: Create triggers for automatic main-task creation on entity insert/delete
 * 
 * Creates AFTER INSERT and BEFORE DELETE triggers for all entity types:
 * - events, posts, locations, instructors, participants
 * 
 * Each entity gets:
 * - create_[entity]_main_task: Creates main task when entity is inserted
 * - delete_[entity]_main_task: Deletes main task when entity is deleted
 */

import type { DatabaseAdapter } from '../adapter'

export const migration = {
    id: '003_entity_task_triggers',
    description: 'Create triggers for automatic main-task creation on entity insert/delete',

    async up(db: DatabaseAdapter): Promise<void> {
        console.log('📋 Creating entity-task relationship triggers...')

        if (db.type === 'postgresql') {
            // PostgreSQL trigger syntax
            await createPostgreSQLTriggers(db)
        } else {
            // SQLite trigger syntax
            await createSQLiteTriggers(db)
        }

        console.log('✅ Migration 003_entity_task_triggers completed')
    }
}

/**
 * Create PostgreSQL triggers and functions
 */
async function createPostgreSQLTriggers(db: DatabaseAdapter): Promise<void> {
    // PostgreSQL requires trigger functions

    // Function to create main task
    await db.exec(`
        CREATE OR REPLACE FUNCTION create_main_task()
        RETURNS TRIGGER AS $$
        BEGIN
            INSERT INTO tasks (id, title, category, status, record_type, record_id)
            VALUES (
                gen_random_uuid()::text,
                '{{main-title}}',
                'main',
                'new',
                TG_ARGV[0],
                NEW.id
            );
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
    `)

    // Function to delete main task
    await db.exec(`
        CREATE OR REPLACE FUNCTION delete_main_task()
        RETURNS TRIGGER AS $$
        BEGIN
            DELETE FROM tasks 
            WHERE record_type = TG_ARGV[0]
              AND record_id = OLD.id 
              AND category = 'main';
            RETURN OLD;
        END;
        $$ LANGUAGE plpgsql;
    `)

    // Create triggers for each entity type
    const entities = ['events', 'posts', 'locations', 'instructors', 'participants']

    for (const entity of entities) {
        const entitySingular = entity.slice(0, -1) // Remove 's' from plural

        // Create trigger
        await db.exec(`
            DROP TRIGGER IF EXISTS create_${entitySingular}_main_task ON ${entity};
            CREATE TRIGGER create_${entitySingular}_main_task
            AFTER INSERT ON ${entity}
            FOR EACH ROW
            EXECUTE FUNCTION create_main_task('${entitySingular}');
        `)

        // Delete trigger
        await db.exec(`
            DROP TRIGGER IF EXISTS delete_${entitySingular}_main_task ON ${entity};
            CREATE TRIGGER delete_${entitySingular}_main_task
            BEFORE DELETE ON ${entity}
            FOR EACH ROW
            EXECUTE FUNCTION delete_main_task('${entitySingular}');
        `)

        console.log(`   ✅ Created triggers for ${entity}`)
    }
}

/**
 * Create SQLite triggers
 */
async function createSQLiteTriggers(db: DatabaseAdapter): Promise<void> {
    // Event triggers
    db.exec(`
        CREATE TRIGGER IF NOT EXISTS create_event_main_task
        AFTER INSERT ON events
        BEGIN
            INSERT INTO tasks (id, title, category, status, record_type, record_id)
            VALUES (
                (SELECT lower(hex(randomblob(8)))),
                '{{main-title}}',
                'main',
                'new',
                'event',
                NEW.id
            );
        END
    `)

    db.exec(`
        CREATE TRIGGER IF NOT EXISTS delete_event_main_task
        BEFORE DELETE ON events
        BEGIN
            DELETE FROM tasks 
            WHERE record_type = 'event' 
              AND record_id = OLD.id 
              AND category = 'main';
        END
    `)

    // Post triggers
    db.exec(`
        CREATE TRIGGER IF NOT EXISTS create_post_main_task
        AFTER INSERT ON posts
        BEGIN
            INSERT INTO tasks (id, title, category, status, record_type, record_id)
            VALUES (
                (SELECT lower(hex(randomblob(8)))),
                '{{main-title}}',
                'main',
                'new',
                'post',
                NEW.id
            );
        END
    `)

    db.exec(`
        CREATE TRIGGER IF NOT EXISTS delete_post_main_task
        BEFORE DELETE ON posts
        BEGIN
            DELETE FROM tasks 
            WHERE record_type = 'post' 
              AND record_id = OLD.id 
              AND category = 'main';
        END
    `)

    // Location triggers
    db.exec(`
        CREATE TRIGGER IF NOT EXISTS create_location_main_task
        AFTER INSERT ON locations
        BEGIN
            INSERT INTO tasks (id, title, category, status, record_type, record_id)
            VALUES (
                (SELECT lower(hex(randomblob(8)))),
                '{{main-title}}',
                'main',
                'new',
                'location',
                NEW.id
            );
        END
    `)

    db.exec(`
        CREATE TRIGGER IF NOT EXISTS delete_location_main_task
        BEFORE DELETE ON locations
        BEGIN
            DELETE FROM tasks 
            WHERE record_type = 'location' 
              AND record_id = OLD.id 
              AND category = 'main';
        END
    `)

    // Instructor triggers
    db.exec(`
        CREATE TRIGGER IF NOT EXISTS create_instructor_main_task
        AFTER INSERT ON instructors
        BEGIN
            INSERT INTO tasks (id, title, category, status, record_type, record_id)
            VALUES (
                (SELECT lower(hex(randomblob(8)))),
                '{{main-title}}',
                'main',
                'new',
                'instructor',
                NEW.id
            );
        END
    `)

    db.exec(`
        CREATE TRIGGER IF NOT EXISTS delete_instructor_main_task
        BEFORE DELETE ON instructors
        BEGIN
            DELETE FROM tasks 
            WHERE record_type = 'instructor' 
              AND record_id = OLD.id 
              AND category = 'main';
        END
    `)

    // Participant triggers
    db.exec(`
        CREATE TRIGGER IF NOT EXISTS create_participant_main_task
        AFTER INSERT ON participants
        BEGIN
            INSERT INTO tasks (id, title, category, status, record_type, record_id)
            VALUES (
                (SELECT lower(hex(randomblob(8)))),
                '{{main-title}}',
                'main',
                'new',
                'participant',
                NEW.id
            );
        END
    `)

    db.exec(`
        CREATE TRIGGER IF NOT EXISTS delete_participant_main_task
        BEFORE DELETE ON participants
        BEGIN
            DELETE FROM tasks 
            WHERE record_type = 'participant' 
              AND record_id = OLD.id 
              AND category = 'main';
        END
    `)

    console.log('   ✅ Created SQLite triggers for all entity types')
}
