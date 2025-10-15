/**
 * Base Schema Migration (000)
 * Creates all initial tables for demo-data v0.0.1
 * Extracted from db-new.ts initDatabase() function
 */

import type { DatabaseAdapter } from '../adapter'

/**
 * Type helper utilities for cross-database compatibility
 */
export function getTypeHelpers(isPostgres: boolean) {
    return {
        TEXT: 'TEXT',
        INTEGER: 'INTEGER',
        TIMESTAMP: isPostgres ? 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP' : "TEXT DEFAULT (datetime('now'))",
        CHECK_STATUS: isPostgres
            ? "CHECK(status IN ('active', 'archived', 'deleted'))"
            : "CHECK(status IN ('active', 'archived', 'deleted'))",
    }
}

/**
 * Create events table
 */
export async function createEventsTable(db: DatabaseAdapter) {
    const isPostgres = db.type === 'postgresql'
    const { TEXT, INTEGER, TIMESTAMP, CHECK_STATUS } = getTypeHelpers(isPostgres)

    await db.exec(`
    CREATE TABLE IF NOT EXISTS events (
      id ${TEXT} PRIMARY KEY,
      name ${TEXT} NOT NULL,
      date_begin ${TEXT},
      date_end ${TEXT},
      address_id ${TEXT},
      user_id ${TEXT},
      seats_max ${INTEGER},
      cimg ${TEXT},
      header_type ${TEXT},
      rectitle ${TEXT},
      teaser ${TEXT},
      version_id ${TEXT},
      created_at ${TIMESTAMP},
      updated_at ${TEXT},
      status ${TEXT} DEFAULT 'active' ${CHECK_STATUS}
    )
  `)
}

/**
 * Create posts table
 */
export async function createPostsTable(db: DatabaseAdapter) {
    const isPostgres = db.type === 'postgresql'
    const { TEXT, TIMESTAMP, CHECK_STATUS } = getTypeHelpers(isPostgres)

    await db.exec(`
    CREATE TABLE IF NOT EXISTS posts (
      id ${TEXT} PRIMARY KEY,
      name ${TEXT} NOT NULL,
      subtitle ${TEXT},
      teaser ${TEXT},
      author_id ${TEXT},
      blog_id ${TEXT},
      tag_ids ${TEXT},
      website_published ${TEXT},
      is_published ${TEXT},
      post_date ${TEXT},
      cover_properties ${TEXT},
      event_id ${TEXT},
      cimg ${TEXT},
      version_id ${TEXT},
      created_at ${TIMESTAMP},
      updated_at ${TEXT},
      status ${TEXT} DEFAULT 'active' ${CHECK_STATUS}
    )
  `)
}

/**
 * Create locations table
 */
export async function createLocationsTable(db: DatabaseAdapter) {
    const isPostgres = db.type === 'postgresql'
    const { TEXT, TIMESTAMP, CHECK_STATUS } = getTypeHelpers(isPostgres)

    await db.exec(`
    CREATE TABLE IF NOT EXISTS locations (
      id ${TEXT} PRIMARY KEY,
      name ${TEXT} NOT NULL,
      phone ${TEXT},
      email ${TEXT},
      city ${TEXT},
      zip ${TEXT},
      street ${TEXT},
      country_id ${TEXT},
      is_company ${TEXT},
      category_id ${TEXT},
      cimg ${TEXT},
      header_type ${TEXT},
      header_size ${TEXT},
      md ${TEXT},
      is_location_provider ${TEXT},
      event_id ${TEXT},
      version_id ${TEXT},
      created_at ${TIMESTAMP},
      updated_at ${TEXT},
      status ${TEXT} DEFAULT 'active' ${CHECK_STATUS}
    )
  `)
}

/**
 * Create instructors table
 */
export async function createInstructorsTable(db: DatabaseAdapter) {
    const isPostgres = db.type === 'postgresql'
    const { TEXT, INTEGER, TIMESTAMP, CHECK_STATUS } = getTypeHelpers(isPostgres)

    await db.exec(`
    CREATE TABLE IF NOT EXISTS instructors (
      id ${TEXT} PRIMARY KEY,
      name ${TEXT} NOT NULL,
      email ${TEXT},
      phone ${TEXT},
      city ${TEXT},
      country_id ${TEXT},
      cimg ${TEXT},
      description ${TEXT},
      event_id ${TEXT},
      version_id ${TEXT},
      created_at ${TIMESTAMP},
      updated_at ${TEXT},
      status ${TEXT} DEFAULT 'active' ${CHECK_STATUS}
    )
  `)
}

/**
 * Create participants table
 */
export async function createParticipantsTable(db: DatabaseAdapter) {
    const isPostgres = db.type === 'postgresql'
    const { TEXT, INTEGER, TIMESTAMP, CHECK_STATUS } = getTypeHelpers(isPostgres)

    await db.exec(`
    CREATE TABLE IF NOT EXISTS participants (
      id ${TEXT} PRIMARY KEY,
      name ${TEXT} NOT NULL,
      age ${INTEGER},
      city ${TEXT},
      country_id ${TEXT},
      cimg ${TEXT},
      description ${TEXT},
      event_id ${TEXT},
      type ${TEXT},
      version_id ${TEXT},
      created_at ${TIMESTAMP},
      updated_at ${TEXT},
      status ${TEXT} DEFAULT 'active' ${CHECK_STATUS}
    )
  `)
}

/**
 * Create hero_overrides table
 */
export async function createHeroOverridesTable(db: DatabaseAdapter) {
    const isPostgres = db.type === 'postgresql'
    const { TEXT, TIMESTAMP } = getTypeHelpers(isPostgres)

    await db.exec(`
    CREATE TABLE IF NOT EXISTS hero_overrides (
      id ${TEXT} PRIMARY KEY,
      cimg ${TEXT},
      heading ${TEXT},
      description ${TEXT},
      event_ids ${TEXT},
      created_at ${TIMESTAMP},
      updated_at ${TEXT}
    )
  `)
}

/**
 * Create users table
 */
export async function createUsersTable(db: DatabaseAdapter) {
    const isPostgres = db.type === 'postgresql'
    const { TEXT, TIMESTAMP } = getTypeHelpers(isPostgres)

    await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id ${TEXT} PRIMARY KEY,
      username ${TEXT} UNIQUE NOT NULL,
      password ${TEXT} NOT NULL,
      role ${TEXT} NOT NULL ${isPostgres ? "CHECK(role IN ('user', 'admin'))" : "CHECK(role IN ('user', 'admin'))"},
      created_at ${TIMESTAMP}
    )
  `)
}

/**
 * Create tasks table
 */
export async function createTasksTable(db: DatabaseAdapter) {
    const isPostgres = db.type === 'postgresql'
    const { TEXT, TIMESTAMP } = getTypeHelpers(isPostgres)

    await db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id ${TEXT} PRIMARY KEY,
      title ${TEXT} NOT NULL,
      description ${TEXT},
      status ${TEXT} DEFAULT 'idea' ${isPostgres
            ? "CHECK(status IN ('idea', 'draft', 'final', 'reopen', 'trash'))"
            : "CHECK(status IN ('idea', 'draft', 'final', 'reopen', 'trash'))"},
      category ${TEXT} DEFAULT 'project' ${isPostgres
            ? "CHECK(category IN ('project', 'base', 'admin'))"
            : "CHECK(category IN ('project', 'base', 'admin'))"},
      priority ${TEXT} DEFAULT 'medium' ${isPostgres
            ? "CHECK(priority IN ('low', 'medium', 'high', 'urgent'))"
            : "CHECK(priority IN ('low', 'medium', 'high', 'urgent'))"},
      record_type ${TEXT},
      record_id ${TEXT},
      assigned_to ${TEXT},
      created_at ${TIMESTAMP},
      updated_at ${TEXT},
      due_date ${TEXT},
      completed_at ${TEXT},
      version_id ${TEXT}
    )
  `)
}

/**
 * Create versions table
 */
export async function createVersionsTable(db: DatabaseAdapter) {
    const isPostgres = db.type === 'postgresql'
    const { TEXT, INTEGER, TIMESTAMP } = getTypeHelpers(isPostgres)

    await db.exec(`
    CREATE TABLE IF NOT EXISTS versions (
      id ${TEXT} PRIMARY KEY,
      version_number ${TEXT} NOT NULL UNIQUE,
      name ${TEXT} NOT NULL,
      description ${TEXT},
      created_at ${TIMESTAMP},
      created_by ${TEXT},
      is_active ${INTEGER} DEFAULT 0,
      snapshot_data ${TEXT},
      csv_exported ${INTEGER} DEFAULT 0,
      notes ${TEXT}
    )
  `)
}

/**
 * Create record_versions table
 */
export async function createRecordVersionsTable(db: DatabaseAdapter) {
    const isPostgres = db.type === 'postgresql'
    const { TEXT, TIMESTAMP } = getTypeHelpers(isPostgres)

    await db.exec(`
    CREATE TABLE IF NOT EXISTS record_versions (
      id ${TEXT} PRIMARY KEY,
      version_id ${TEXT} NOT NULL,
      record_type ${TEXT} NOT NULL,
      record_id ${TEXT} NOT NULL,
      data ${TEXT} NOT NULL,
      created_at ${TIMESTAMP}
    )
  `)
}

/**
 * Create projects table
 */
export async function createProjectsTable(db: DatabaseAdapter) {
    const isPostgres = db.type === 'postgresql'
    const { TEXT, TIMESTAMP } = getTypeHelpers(isPostgres)

    await db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id ${TEXT} PRIMARY KEY,
      username ${TEXT} UNIQUE NOT NULL,
      password_hash ${TEXT} NOT NULL,
      role ${TEXT} NOT NULL ${isPostgres
            ? "CHECK(role IN ('admin', 'base', 'project'))"
            : "CHECK(role IN ('admin', 'base', 'project'))"},
      name ${TEXT},
      description ${TEXT},
      status ${TEXT} DEFAULT 'draft' ${isPostgres
            ? "CHECK(status IN ('draft', 'active', 'archived'))"
            : "CHECK(status IN ('draft', 'active', 'archived'))"},
      created_at ${TIMESTAMP},
      updated_at ${TEXT}
    )
  `)
}

/**
 * Create releases table
 */
export async function createReleasesTable(db: DatabaseAdapter) {
    const isPostgres = db.type === 'postgresql'
    const { TEXT, INTEGER, TIMESTAMP } = getTypeHelpers(isPostgres)

    await db.exec(`
    CREATE TABLE IF NOT EXISTS releases (
      id ${TEXT} PRIMARY KEY,
      version ${TEXT} NOT NULL UNIQUE,
      version_major ${INTEGER} NOT NULL,
      version_minor ${INTEGER} NOT NULL,
      description ${TEXT},
      state ${TEXT} DEFAULT 'idea' ${isPostgres
            ? "CHECK(state IN ('idea', 'draft', 'final', 'trash'))"
            : "CHECK(state IN ('idea', 'draft', 'final', 'trash'))"},
      release_date ${TEXT},
      created_at ${TIMESTAMP},
      updated_at ${TEXT}
    )
  `)
}

/**
 * Create performance indexes
 */
export async function createIndexes(db: DatabaseAdapter) {
    const isPostgres = db.type === 'postgresql'

    if (isPostgres) {
        await db.exec(`
      CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
      CREATE INDEX IF NOT EXISTS idx_tasks_record ON tasks(record_type, record_id);
      CREATE INDEX IF NOT EXISTS idx_tasks_version ON tasks(version_id);
      CREATE INDEX IF NOT EXISTS idx_tasks_category ON tasks(category);
      CREATE INDEX IF NOT EXISTS idx_versions_active ON versions(is_active);
      CREATE INDEX IF NOT EXISTS idx_record_versions_lookup ON record_versions(version_id, record_type, record_id);
    `)
    } else {
        await db.exec(`
      CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
      CREATE INDEX IF NOT EXISTS idx_tasks_record ON tasks(record_type, record_id);
      CREATE INDEX IF NOT EXISTS idx_tasks_version ON tasks(version_id);
      CREATE INDEX IF NOT EXISTS idx_tasks_category ON tasks(category);
      CREATE INDEX IF NOT EXISTS idx_versions_active ON versions(is_active);
      CREATE INDEX IF NOT EXISTS idx_record_versions_lookup ON record_versions(version_id, record_type, record_id);
    `)
    }
}

/**
 * Create timestamp update triggers
 */
export async function createTriggers(db: DatabaseAdapter) {
    const isPostgres = db.type === 'postgresql'
    const tables = ['events', 'posts', 'locations', 'instructors', 'participants', 'tasks']

    if (!isPostgres) {
        // SQLite triggers
        for (const table of tables) {
            await db.exec(`
        CREATE TRIGGER IF NOT EXISTS ${table}_updated_at_trigger
        AFTER UPDATE ON ${table}
        BEGIN
          UPDATE ${table} SET updated_at = datetime('now') WHERE id = NEW.id;
        END;
      `)
        }
    } else {
        // PostgreSQL function and triggers
        await db.exec(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `)

        for (const table of tables) {
            await db.exec(`
        DROP TRIGGER IF EXISTS ${table}_updated_at_trigger ON ${table};
        CREATE TRIGGER ${table}_updated_at_trigger
        BEFORE UPDATE ON ${table}
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
      `)
        }
    }
}

/**
 * Main migration function - runs all base schema creation
 */
export async function runBaseSchemaMigration(db: DatabaseAdapter) {
    console.log('📦 Running migration: 000_base_schema')

    // Create all tables
    await createEventsTable(db)
    await createPostsTable(db)
    await createLocationsTable(db)
    await createInstructorsTable(db)
    await createParticipantsTable(db)
    await createHeroOverridesTable(db)
    await createUsersTable(db)
    await createTasksTable(db)
    await createVersionsTable(db)
    await createRecordVersionsTable(db)
    await createProjectsTable(db)
    await createReleasesTable(db)

    // Create indexes
    await createIndexes(db)

    // Create triggers
    await createTriggers(db)

    console.log('✅ Migration 000_base_schema completed')
}

export const metadata = {
    id: '000_base_schema',
    description: 'Create all initial tables, indexes, and triggers for demo-data v0.0.1',
    version: '0.0.1',
    date: '2025-10-15',
}
