/**
 * Seed script for admin watch tasks
 * Creates Reset Base and Save Base tasks with watch logic
 */

import type { DatabaseAdapter } from '../adapter'

export async function seedAdminWatchTasks(db: DatabaseAdapter): Promise<void> {
    console.log('🌱 Seeding admin watch tasks...')

    // Get status IDs for tasks
    const reopenStatus = await db.get(`SELECT id FROM status WHERE "table" = 'tasks' AND name = 'reopen' LIMIT 1`)
    const reopenStatusId = reopenStatus ? (reopenStatus as any).id : null

    if (!reopenStatusId) {
        console.log('  ⚠️  Warning: reopen status not found, skipping admin watch tasks')
        return
    }

    const tasks = [
        {
            id: '_admin.task_watch_reset_base',
            title: '**Reset Base** reload the base from csv',
            description: 'Watches CSV files and reloads base entities when files are updated. This task monitors file system changes and updates the database accordingly.',
            status: reopenStatusId, // Use status_id instead of TEXT
            category: 'admin',
            priority: 'high',
            logic: 'watchcsv_base',
            filter: 'entities_or_all',
            entity_name: 'CSV Files', // Human-readable entity name for admin UI
            record_type: null,
            record_id: null,
            assigned_to: 'system',
            due_date: null,
            release_id: null,
            image: null
        },
        {
            id: '_admin.task_watch_save_base',
            title: '**Save Base** update the base to csv',
            description: 'Watches database entities with isbase flag and exports them to CSV when changes are detected. This task monitors database changes and updates CSV files accordingly.',
            status: reopenStatusId, // Use status_id instead of TEXT
            category: 'admin',
            priority: 'high',
            logic: 'watchdb_base',
            filter: 'entities_or_all',
            entity_name: 'Database Entities', // Human-readable entity name for admin UI
            record_type: null,
            record_id: null,
            assigned_to: 'system',
            due_date: null,
            release_id: null,
            image: null
        }
    ]

    for (const task of tasks) {
        const isPostgres = db.type === 'postgresql'

        if (isPostgres) {
            await db.run(`
                INSERT INTO tasks (
                    id, name, description, status_id, category, priority,
                    logic, filter, entity_name, record_type, record_id,
                    assigned_to, due_date, release_id, cimg
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
                ON CONFLICT (id) DO UPDATE SET
                    name = EXCLUDED.name,
                    description = EXCLUDED.description,
                    status_id = EXCLUDED.status_id,
                    category = EXCLUDED.category,
                    priority = EXCLUDED.priority,
                    logic = EXCLUDED.logic,
                    filter = EXCLUDED.filter,
                    entity_name = EXCLUDED.entity_name,
                    record_type = EXCLUDED.record_type,
                    record_id = EXCLUDED.record_id,
                    assigned_to = EXCLUDED.assigned_to,
                    due_date = EXCLUDED.due_date,
                    release_id = EXCLUDED.release_id,
                    cimg = EXCLUDED.cimg
            `, [
                task.id, task.title, task.description, task.status, task.category, task.priority,
                task.logic, task.filter, task.entity_name, task.record_type, task.record_id,
                task.assigned_to, task.due_date, task.release_id, task.image
            ])
        } else {
            await db.run(`
                INSERT OR REPLACE INTO tasks (
                    id, name, description, status_id, category, priority,
                    logic, filter, entity_name, record_type, record_id,
                    assigned_to, due_date, release_id, cimg
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                task.id, task.title, task.description, task.status, task.category, task.priority,
                task.logic, task.filter, task.entity_name, task.record_type, task.record_id,
                task.assigned_to, task.due_date, task.release_id, task.image
            ])
        }
        console.log(`  ✅ Created watch task: ${task.title}`)
    }

    console.log('✅ Admin watch tasks seeded successfully')
}
