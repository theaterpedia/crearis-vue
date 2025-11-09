/**
 * MR2: Export System - Late Seed Configuration
 * 
 * Defines columns that need special handling during export/import:
 * - Late-seeding columns: Exported but overwritten during import (id, timestamps)
 * - Detail tables: Parent-referenced tables exported with foreign keys
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
  interactions: [
    {
      column: 'id',
      reason: 'Auto-generated serial, will be reassigned on import',
      exportValue: false,
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
};

/**
 * List of entity tables to export (in order)
 * Detail tables are automatically included via DETAIL_TABLES_CONFIG
 */
export const EXPORT_ENTITIES = [
  'users',
  'tags',
  'projects',
  'images',
  'interactions',
  // Note: project_members, events_tags, posts_tags are exported as detail tables
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
