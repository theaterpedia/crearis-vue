/**
 * MR2: Export System - JSON Backup Schema
 * 
 * Defines TypeScript interfaces for the JSON export format used to backup
 * database state. Supports late-seeding columns (id, created_at) and
 * parent-referenced detail tables.
 */

/**
 * Metadata about the backup operation
 */
export interface BackupMetadata {
    timestamp: string;          // ISO 8601 timestamp when backup was created
    database: string;            // Database name (e.g., "demo-data.db", "production.db")
    version: string;             // Backup format version (e.g., "1.0")
    migrationPackage: string;    // Package used for schema (e.g., "A", "B")
    description?: string;        // Optional description of backup purpose
}

/**
 * Backup data for a single entity table
 */
export interface EntityBackup {
    tableName: string;           // Name of the table (e.g., "users", "projects")
    rowCount: number;            // Total number of rows exported
    columns: string[];           // List of column names included
    rows: Record<string, any>[]; // Array of row objects (column -> value mapping)
    detailTables?: DetailTableBackup[]; // Optional array of related detail tables
}

/**
 * Backup data for a detail table (parent-referenced)
 */
export interface DetailTableBackup {
    tableName: string;           // Name of the detail table (e.g., "project_events")
    parentKey: string;           // Foreign key column referencing parent (e.g., "project_id")
    rowCount: number;            // Total number of rows exported
    columns: string[];           // List of column names included
    rows: Record<string, any>[]; // Array of row objects
}

/**
 * Index file for the entire backup
 */
export interface BackupIndex {
    metadata: BackupMetadata;    // Backup metadata
    entities: string[];          // List of entity table names included
    files: {                     // Map of entity names to their JSON filenames
        [entityName: string]: string;
    };
    tarballName: string;         // Name of the tar.gz archive
    checksums?: {                // Optional SHA256 checksums for verification
        [filename: string]: string;
    };
}

/**
 * Configuration for late-seeding columns
 * Columns that should be exported but overwritten during import
 */
export interface LateSeedColumn {
    column: string;              // Column name (e.g., "id", "created_at")
    reason: string;              // Why this column needs late seeding
    exportValue: boolean;        // Whether to include value in export
}

/**
 * Complete backup structure (used for single-file exports)
 */
export interface CompleteBackup {
    metadata: BackupMetadata;
    entities: EntityBackup[];
}
