/**
 * MR2: Export System - Late Seed Configuration
 * 
 * Defines columns that need special handling during export/import:
 * - Late-seeding columns: Exported but overwritten during import (id, timestamps)
 * - Detail tables: Parent-referenced tables exported with foreign keys
 * - Deprecated columns: Excluded from export/import (old image fields)
 * 
 * CRITICAL IMPORT RULES (Task 3-4):
 * ================================================================================
 * 
 * Entity Tables vs System Tables:
 * 
 * ENTITY TABLES (use xmlid as index column):
 *   - instructors, locations, participants, posts, events
 *   - All have 'xmlid' column as stable identifier
 *   - Import MUST match/link via xmlid, NEVER via id
 *   - The 'id' column is auto-generated and will differ between databases
 * 
 * SPECIAL ENTITY TABLES (use alternative index columns):
 *   - users: Use 'sysmail' as index column (NOT id)
 *   - projects: Use 'domaincode' as index column (NOT id)
 * 
 * SYSTEM TABLES (use id but with late-seeding):
 *   - tags, images, interactions, pages, tasks
 *   - These tables may have id reassignment during import
 *   - Foreign keys to these tables must be remapped after import
 * 
 * IMPORT STRATEGY:
 * 1. Import entity tables first (match by xmlid/sysmail/domaincode)
 * 2. Build mapping tables: old_id → new_id for system tables
 * 3. Import detail/junction tables using index columns for entity tables
 * 4. Remap foreign keys for system tables using mapping tables
 * 
 * EXAMPLE:
 *   event_instructors table links:
 *     - event_id → events.id (but match via events.xmlid during import)
 *     - instructor_id → instructors.id (but match via instructors.xmlid during import)
 * 
 * DO NOT attempt to match entity tables via id comparison!
 * ================================================================================
 */

import type { LateSeedColumn } from '../../types/backup-schema';

/**
 * Configuration for columns that are exported but regenerated on import
 * Key: table name, Value: array of late-seed column configs
 */
export const LATE_SEED_CONFIG: Record<string, LateSeedColumn[]> = {
    users: [
        {
            column: 'id',
            reason: 'Auto-generated UUID, preserved for referential integrity',
            exportValue: true,
        },
        {
            column: 'created_at',
            reason: 'Timestamp regenerated on insert',
            exportValue: true,
        },
        {
            column: 'cimg',
            reason: 'Deprecated image field',
            exportValue: false,
        },
        {
            column: 'img_thumb',
            reason: 'Deprecated image field',
            exportValue: false,
        },
        {
            column: 'img_wide',
            reason: 'Deprecated image field',
            exportValue: false,
        },
        {
            column: 'img_vert',
            reason: 'Deprecated image field',
            exportValue: false,
        },
        {
            column: 'img_square',
            reason: 'Deprecated image field',
            exportValue: false,
        },
        {
            column: 'img_show',
            reason: 'Deprecated image field',
            exportValue: false,
        },
    ],
    projects: [
        {
            column: 'id',
            reason: 'Auto-generated UUID, preserved for referential integrity',
            exportValue: true,
        },
        {
            column: 'created_at',
            reason: 'Timestamp regenerated on insert',
            exportValue: true,
        },
        {
            column: 'cimg',
            reason: 'Deprecated image field',
            exportValue: false,
        },
        {
            column: 'img_thumb',
            reason: 'Deprecated image field',
            exportValue: false,
        },
        {
            column: 'img_wide',
            reason: 'Deprecated image field',
            exportValue: false,
        },
        {
            column: 'img_vert',
            reason: 'Deprecated image field',
            exportValue: false,
        },
        {
            column: 'img_square',
            reason: 'Deprecated image field',
            exportValue: false,
        },
        {
            column: 'img_show',
            reason: 'Deprecated image field',
            exportValue: false,
        },
    ],
    events: [
        {
            column: 'id',
            reason: 'Auto-generated serial, will be reassigned on import',
            exportValue: false,
        },
        {
            column: 'cimg',
            reason: 'Deprecated image field',
            exportValue: false,
        },
        {
            column: 'img_thumb',
            reason: 'Deprecated image field',
            exportValue: false,
        },
        {
            column: 'img_wide',
            reason: 'Deprecated image field',
            exportValue: false,
        },
        {
            column: 'img_vert',
            reason: 'Deprecated image field',
            exportValue: false,
        },
        {
            column: 'img_square',
            reason: 'Deprecated image field',
            exportValue: false,
        },
        {
            column: 'img_show',
            reason: 'Deprecated image field',
            exportValue: false,
        },
    ],
    posts: [
        {
            column: 'id',
            reason: 'Auto-generated serial, will be reassigned on import',
            exportValue: false,
        },
        {
            column: 'cimg',
            reason: 'Deprecated image field',
            exportValue: false,
        },
        {
            column: 'img_thumb',
            reason: 'Deprecated image field',
            exportValue: false,
        },
        {
            column: 'img_wide',
            reason: 'Deprecated image field',
            exportValue: false,
        },
        {
            column: 'img_vert',
            reason: 'Deprecated image field',
            exportValue: false,
        },
        {
            column: 'img_square',
            reason: 'Deprecated image field',
            exportValue: false,
        },
        {
            column: 'img_show',
            reason: 'Deprecated image field',
            exportValue: false,
        },
    ],
    instructors: [
        {
            column: 'id',
            reason: 'Auto-generated serial, will be reassigned on import',
            exportValue: false,
        },
        {
            column: 'cimg',
            reason: 'Deprecated image field',
            exportValue: false,
        },
        {
            column: 'img_thumb',
            reason: 'Deprecated image field',
            exportValue: false,
        },
        {
            column: 'img_wide',
            reason: 'Deprecated image field',
            exportValue: false,
        },
        {
            column: 'img_vert',
            reason: 'Deprecated image field',
            exportValue: false,
        },
        {
            column: 'img_square',
            reason: 'Deprecated image field',
            exportValue: false,
        },
        {
            column: 'img_show',
            reason: 'Deprecated image field',
            exportValue: false,
        },
    ],
    locations: [
        {
            column: 'id',
            reason: 'Auto-generated serial, will be reassigned on import',
            exportValue: false,
        },
        {
            column: 'cimg',
            reason: 'Deprecated image field',
            exportValue: false,
        },
        {
            column: 'img_thumb',
            reason: 'Deprecated image field',
            exportValue: false,
        },
        {
            column: 'img_wide',
            reason: 'Deprecated image field',
            exportValue: false,
        },
        {
            column: 'img_vert',
            reason: 'Deprecated image field',
            exportValue: false,
        },
        {
            column: 'img_square',
            reason: 'Deprecated image field',
            exportValue: false,
        },
        {
            column: 'img_show',
            reason: 'Deprecated image field',
            exportValue: false,
        },
    ],
    participants: [
        {
            column: 'id',
            reason: 'Auto-generated serial, will be reassigned on import',
            exportValue: false,
        },
        {
            column: 'cimg',
            reason: 'Deprecated image field',
            exportValue: false,
        },
        {
            column: 'img_thumb',
            reason: 'Deprecated image field',
            exportValue: false,
        },
        {
            column: 'img_wide',
            reason: 'Deprecated image field',
            exportValue: false,
        },
        {
            column: 'img_vert',
            reason: 'Deprecated image field',
            exportValue: false,
        },
        {
            column: 'img_square',
            reason: 'Deprecated image field',
            exportValue: false,
        },
        {
            column: 'img_show',
            reason: 'Deprecated image field',
            exportValue: false,
        },
    ],
    images: [
        {
            column: 'id',
            reason: 'Auto-generated UUID, preserved for referential integrity',
            exportValue: true,
        },
        {
            column: 'created_at',
            reason: 'Timestamp regenerated on insert',
            exportValue: true,
        },
    ],
    tags: [
        {
            column: 'id',
            reason: 'Auto-generated serial, will be reassigned on import',
            exportValue: false,
        },
    ],
    status: [
        {
            column: 'id',
            reason: 'Auto-generated serial, but stable across systems (seeded by migrations)',
            exportValue: true,
        },
    ],
    interactions: [
        {
            column: 'id',
            reason: 'Auto-generated serial, will be reassigned on import',
            exportValue: false,
        },
    ],
    pages: [
        {
            column: 'id',
            reason: 'Auto-generated serial, will be reassigned on import',
            exportValue: false,
        },
    ],
    tasks: [
        {
            column: 'id',
            reason: 'Auto-generated UUID, preserved for referential integrity',
            exportValue: true,
        },
        {
            column: 'created_at',
            reason: 'Timestamp regenerated on insert',
            exportValue: true,
        },
    ],
};

/**
 * Configuration for detail tables (parent-referenced)
 * Key: entity table name, Value: array of detail table configs
 */
export interface DetailTableConfig {
    tableName: string;      // Name of the detail table
    parentKey: string;      // Foreign key column referencing parent entity
    orderColumn?: string;   // Optional column for ordering (e.g., "event_date")
}

export const DETAIL_TABLES_CONFIG: Record<string, DetailTableConfig[]> = {
    projects: [
        {
            tableName: 'project_members',
            parentKey: 'project_id',
        },
    ],
    tags: [
        {
            tableName: 'events_tags',
            parentKey: 'tag_id',
        },
        {
            tableName: 'posts_tags',
            parentKey: 'tag_id',
        },
    ],
    events: [
        {
            tableName: 'event_instructors',
            parentKey: 'event_id',
        },
    ],
};

/**
 * List of entity tables to export (in order)
 * Detail tables are automatically included via DETAIL_TABLES_CONFIG
 * 
 * CRITICAL ORDER:
 * 1. System tables without dependencies (tags, status) - MUST BE FIRST!
 * 2. Entity tables with index columns (users, projects)
 * 3. Entity tables that reference system tables (images, events, posts, etc.)
 * 
 * Entity tables with xmlid index: instructors, locations, participants, posts, events, images
 * Entity tables with other indexes: users (sysmail), projects (domaincode)
 * System tables without xmlid: tags, status, interactions, pages, tasks
 */
export const EXPORT_ENTITIES = [
    // Phase 0: System tables (no dependencies)
    'tags',             // Referenced by events_tags, posts_tags
    'status',           // Referenced by all entity tables via status_id FK

    // Phase 1: Core entity tables
    'users',            // Index: sysmail (referenced by images.owner_id)
    'projects',         // Index: domaincode (referenced by images.project_id)
    'images',           // Index: xmlid (referenced by entities via img_id FK)

    // Phase 2: Entity tables with dependencies
    'instructors',      // Index: xmlid
    'locations',        // Index: xmlid
    'participants',     // Index: xmlid
    'posts',            // Index: xmlid
    'events',           // Index: xmlid

    // Phase 3: System tables with dependencies
    'interactions',     // System table (may reference entities)
    'pages',            // System table
    'tasks',            // System table (references status)

    // Note: project_members, events_tags, posts_tags, event_instructors are exported as detail tables
];

/**
 * Get late-seed columns for a table
 */
export function getLateSeedColumns(tableName: string): LateSeedColumn[] {
    return LATE_SEED_CONFIG[tableName] || [];
}

/**
 * Get detail tables for an entity
 */
export function getDetailTables(entityName: string): DetailTableConfig[] {
    return DETAIL_TABLES_CONFIG[entityName] || [];
}

/**
 * Check if a column should be exported
 */
export function shouldExportColumn(tableName: string, columnName: string): boolean {
    const lateSeedColumns = getLateSeedColumns(tableName);
    const config = lateSeedColumns.find((c) => c.column === columnName);
    return config ? config.exportValue : true; // Default to true if not in config
}
