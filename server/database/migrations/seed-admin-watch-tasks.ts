/**
 * Seed script for admin watch tasks
 * Creates Reset Base and Save Base tasks with watch logic
 */

import type { DatabaseAdapter } from '../adapter'

export async function seedAdminWatchTasks(db: DatabaseAdapter): Promise<void> {
    console.log('🌱 Seeding admin watch tasks...')

    const tasks = [
        {
            id: '_admin.task_watch_reset_base',
            title: '**Reset Base** reload the base from csv',
            description: 'Watches CSV files and reloads base entities when files are updated. This task monitors file system changes and updates the database accordingly.',
            status: 'reopen', // Watch tasks always stay in reopen
            category: 'admin',
            priority: 'high',
            logic: 'watchcsv_base',
            filter: 'entities_or_all',
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
            status: 'reopen', // Watch tasks always stay in reopen
            category: 'admin',
            priority: 'high',
            logic: 'watchdb_base',
            filter: 'entities_or_all',
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
                    id, title, description, status, category, priority,
                    logic, filter, record_type, record_id,
                    assigned_to, due_date, release_id, image
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
                ON CONFLICT (id) DO UPDATE SET
                    title = EXCLUDED.title,
                    description = EXCLUDED.description,
                    status = EXCLUDED.status,
                    category = EXCLUDED.category,
                    priority = EXCLUDED.priority,
                    logic = EXCLUDED.logic,
                    filter = EXCLUDED.filter,
                    record_type = EXCLUDED.record_type,
                    record_id = EXCLUDED.record_id,
                    assigned_to = EXCLUDED.assigned_to,
                    due_date = EXCLUDED.due_date,
                    release_id = EXCLUDED.release_id,
                    image = EXCLUDED.image
            `, [
                task.id, task.title, task.description, task.status, task.category, task.priority,
                task.logic, task.filter, task.record_type, task.record_id,
                task.assigned_to, task.due_date, task.release_id, task.image
            ])
        } else {
            await db.run(`
                INSERT OR REPLACE INTO tasks (
                    id, title, description, status, category, priority,
                    logic, filter, record_type, record_id,
                    assigned_to, due_date, release_id, image
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                task.id, task.title, task.description, task.status, task.category, task.priority,
                task.logic, task.filter, task.record_type, task.record_id,
                task.assigned_to, task.due_date, task.release_id, task.image
            ])
        }
        console.log(`  ✅ Created watch task: ${task.title}`)
    }

    console.log('✅ Admin watch tasks seeded successfully')
}
