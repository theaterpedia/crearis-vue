/**
 * EXAMPLE MIGRATION TEMPLATE
 * 
 * This is a template showing best practices for creating database migrations.
 * Copy this file and modify it for your needs.
 * 
 * Migration Naming Convention:
 * - Format: NNN_descriptive_name.ts (e.g., 003_add_user_preferences.ts)
 * - NNN: Zero-padded sequential number (000, 001, 002, ...)
 * - descriptive_name: Short description using snake_case
 * 
 * Key Principles:
 * 1. Migrations are FORWARD-ONLY (no rollback functions)
 * 2. Migrations must be IDEMPOTENT (safe to run multiple times)
 * 3. Migrations must support BOTH PostgreSQL AND SQLite
 * 4. Test migrations on both databases before committing
 * 5. Never modify existing migration files after they're deployed
 */

import type { DatabaseAdapter } from '../adapter'

export const metadata = {
    id: '003_example_migration',
    description: 'Example migration showing best practices',
    version: '0.0.2', // The version this migration was created for
    date: '2025-10-15',
}

/**
 * Example: Create a new table
 * 
 * Guidelines:
 * - Use CREATE TABLE IF NOT EXISTS for idempotency
 * - Use type helpers: TEXT(), INTEGER(), TIMESTAMP()
 * - Handle database-specific differences (e.g., SERIAL vs AUTOINCREMENT)
 */
async function createExampleTable(db: DatabaseAdapter) {
    const isPostgres = db.type === 'postgresql'

    const TEXT = () => 'TEXT'
    const INTEGER = () => 'INTEGER'
    const TIMESTAMP = () => (isPostgres ? 'TIMESTAMP' : 'TEXT')

    const sql = `
    CREATE TABLE IF NOT EXISTS example_table (
      id ${isPostgres ? 'SERIAL PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT'},
      name ${TEXT()} NOT NULL,
      description ${TEXT()},
      priority ${INTEGER()} DEFAULT 0,
      is_active ${INTEGER()} DEFAULT 1,
      created_at ${TIMESTAMP()} DEFAULT ${isPostgres ? 'CURRENT_TIMESTAMP' : "datetime('now')"},
      updated_at ${TIMESTAMP()} DEFAULT ${isPostgres ? 'CURRENT_TIMESTAMP' : "datetime('now')"}
    )
  `

    await db.run(sql, [])
    console.log('  ✅ Created example_table')
}

/**
 * Example: Add columns to existing table
 * 
 * Guidelines:
 * - PostgreSQL: Use IF NOT EXISTS (PostgreSQL 9.6+)
 * - SQLite: Use try/catch for duplicate column errors
 * - Always provide DEFAULT values for new columns
 * - Use NULL or appropriate defaults based on business logic
 */
async function addColumnsToExistingTable(db: DatabaseAdapter) {
    const isPostgres = db.type === 'postgresql'

    try {
        if (isPostgres) {
            // PostgreSQL supports IF NOT EXISTS
            await db.run(
                `ALTER TABLE tasks 
         ADD COLUMN IF NOT EXISTS example_field TEXT,
         ADD COLUMN IF NOT EXISTS example_count INTEGER DEFAULT 0`,
                []
            )
            console.log('  ✅ Added columns to tasks table')
        } else {
            // SQLite requires separate statements and doesn't support IF NOT EXISTS
            try {
                await db.run('ALTER TABLE tasks ADD COLUMN example_field TEXT', [])
                console.log('  ✅ Added example_field column')
            } catch (err: any) {
                if (err.message.includes('duplicate column')) {
                    console.log('  ⏭️  Column example_field already exists')
                } else {
                    throw err
                }
            }

            try {
                await db.run('ALTER TABLE tasks ADD COLUMN example_count INTEGER DEFAULT 0', [])
                console.log('  ✅ Added example_count column')
            } catch (err: any) {
                if (err.message.includes('duplicate column')) {
                    console.log('  ⏭️  Column example_count already exists')
                } else {
                    throw err
                }
            }
        }
    } catch (error) {
        console.error('  ❌ Error adding columns:', error)
        throw error
    }
}

/**
 * Example: Create indexes
 * 
 * Guidelines:
 * - Use CREATE INDEX IF NOT EXISTS for idempotency
 * - Name indexes descriptively: idx_<table>_<column(s)>
 * - Consider database-specific index types (e.g., GIN, GIST for PostgreSQL)
 */
async function createIndexes(db: DatabaseAdapter) {
    const isPostgres = db.type === 'postgresql'

    const indexes = [
        {
            name: 'idx_example_table_name',
            sql: 'CREATE INDEX IF NOT EXISTS idx_example_table_name ON example_table(name)',
            description: 'Index on example_table.name',
        },
        {
            name: 'idx_example_table_active',
            sql: 'CREATE INDEX IF NOT EXISTS idx_example_table_active ON example_table(is_active)',
            description: 'Index on example_table.is_active',
        },
    ]

    for (const index of indexes) {
        try {
            await db.run(index.sql, [])
            console.log(`  ✅ Created index: ${index.name}`)
        } catch (error: any) {
            if (error.message?.includes('already exists')) {
                console.log(`  ⏭️  Index ${index.name} already exists`)
            } else {
                throw error
            }
        }
    }
}

/**
 * Example: Add database-specific features
 * 
 * Guidelines:
 * - Check db.type before using database-specific features
 * - PostgreSQL: JSONB, arrays, full-text search, etc.
 * - SQLite: JSON functions (as TEXT), FTS5, etc.
 */
async function addDatabaseSpecificFeatures(db: DatabaseAdapter) {
    const isPostgres = db.type === 'postgresql'

    if (isPostgres) {
        // PostgreSQL-specific: Create a trigger for updated_at
        const functionSql = `
      CREATE OR REPLACE FUNCTION update_example_table_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `

        const triggerSql = `
      DROP TRIGGER IF EXISTS example_table_updated_at_trigger ON example_table;
      CREATE TRIGGER example_table_updated_at_trigger
      BEFORE UPDATE ON example_table
      FOR EACH ROW
      EXECUTE FUNCTION update_example_table_updated_at()
    `

        await db.run(functionSql, [])
        await db.run(triggerSql, [])
        console.log('  ✅ Created PostgreSQL trigger for updated_at')
    } else {
        // SQLite-specific: Create a trigger for updated_at
        const triggerSql = `
      CREATE TRIGGER IF NOT EXISTS example_table_updated_at_trigger
      AFTER UPDATE ON example_table
      FOR EACH ROW
      BEGIN
        UPDATE example_table SET updated_at = datetime('now')
        WHERE id = NEW.id;
      END
    `

        await db.run(triggerSql, [])
        console.log('  ✅ Created SQLite trigger for updated_at')
    }
}

/**
 * Main migration function
 * 
 * Guidelines:
 * - This is the function that gets called by the migration runner
 * - Use descriptive console.log messages to track progress
 * - Wrap operations in try/catch if you need to handle specific errors
 * - Keep operations in logical order
 */
export async function runExampleMigration(db: DatabaseAdapter) {
    console.log('📦 Running example migration...')

    // Step 1: Create new tables
    await createExampleTable(db)

    // Step 2: Modify existing tables
    await addColumnsToExistingTable(db)

    // Step 3: Create indexes
    await createIndexes(db)

    // Step 4: Add database-specific features
    await addDatabaseSpecificFeatures(db)

    console.log('✅ Example migration complete')
}

/**
 * ROLLBACK NOTES
 * 
 * Since we don't have automated rollback, document manual rollback steps here:
 * 
 * To manually rollback this migration:
 * 
 * 1. Drop the example_table:
 *    DROP TABLE IF EXISTS example_table;
 * 
 * 2. Remove columns from tasks table (PostgreSQL):
 *    ALTER TABLE tasks DROP COLUMN IF EXISTS example_field;
 *    ALTER TABLE tasks DROP COLUMN IF EXISTS example_count;
 * 
 * 3. Remove columns from tasks table (SQLite):
 *    -- SQLite doesn't support DROP COLUMN easily
 *    -- You would need to recreate the table without those columns
 *    -- See: https://www.sqlite.org/lang_altertable.html
 * 
 * 4. Drop indexes:
 *    DROP INDEX IF EXISTS idx_example_table_name;
 *    DROP INDEX IF EXISTS idx_example_table_active;
 * 
 * 5. Drop triggers (PostgreSQL):
 *    DROP TRIGGER IF EXISTS example_table_updated_at_trigger ON example_table;
 *    DROP FUNCTION IF EXISTS update_example_table_updated_at();
 * 
 * 6. Drop triggers (SQLite):
 *    DROP TRIGGER IF EXISTS example_table_updated_at_trigger;
 * 
 * 7. Update crearis_config to remove this migration from migrations_run array
 * 
 * IMPORTANT: Test rollback on a copy of the database first!
 */

/**
 * TESTING CHECKLIST
 * 
 * Before committing this migration, test:
 * 
 * ✅ Run on fresh PostgreSQL database
 * ✅ Run on existing PostgreSQL database (idempotency test)
 * ✅ Run on fresh SQLite database
 * ✅ Run on existing SQLite database (idempotency test)
 * ✅ Verify schema validation passes after migration
 * ✅ Verify application still works with new schema
 * ✅ Check that no data was lost
 * ✅ Test any API endpoints that use the modified tables
 * 
 * Commands:
 * 
 * # Run migration
 * pnpm db:migrate
 * 
 * # Check schema validation
 * pnpm db:check-structure
 * 
 * # Test API endpoints
 * pnpm dev
 * # Then test relevant endpoints in browser or Postman
 */
