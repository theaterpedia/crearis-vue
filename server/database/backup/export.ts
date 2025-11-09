/**
 * MR2: Export System - Database Export Functions
 * 
 * Exports database tables to JSON format with support for:
 * - Late-seeding columns (id, timestamps)
 * - Parent-referenced detail tables
 * - Tarball packaging for multi-file exports
 */

import type { 
  BackupMetadata, 
  EntityBackup, 
  DetailTableBackup,
  BackupIndex,
  CompleteBackup 
} from '../../types/backup-schema';
import { 
  EXPORT_ENTITIES,
  getLateSeedColumns, 
  getDetailTables,
  shouldExportColumn 
} from './late-seed-config';
import { db } from '../db-new';
import type { DatabaseAdapter } from '../adapter';
import * as fs from 'fs/promises';
import * as path from 'path';
import { createHash } from 'crypto';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Export a single entity table to JSON
 */
export async function exportEntityTable(
  tableName: string
): Promise<EntityBackup> {
  // Get all columns for the table
  const columnsResult = await db.all(`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = $1
    ORDER BY ordinal_position
  `, [tableName]);
  
  const allColumns = columnsResult.map((row: any) => row.column_name as string);
  
  // Filter columns based on late-seed config
  const exportColumns = allColumns.filter((col: string) => 
    shouldExportColumn(tableName, col)
  );
  
  // Build SELECT query with filtered columns
  const columnList = exportColumns.join(', ');
  
  // Determine ordering: prefer id, fallback to created_at, or no ordering
  let orderBy = '';
  if (exportColumns.includes('id')) {
    orderBy = 'ORDER BY id';
  } else if (exportColumns.includes('created_at')) {
    orderBy = 'ORDER BY created_at';
  }
  
  const rowsResult = await db.all(
    `SELECT ${columnList} FROM ${tableName} ${orderBy}`
  );
  
  const rows = rowsResult as Record<string, any>[];
  
  // Export detail tables if configured
  const detailTablesConfigs = getDetailTables(tableName);
  let detailTables: DetailTableBackup[] | undefined;
  
  if (detailTablesConfigs.length > 0) {
    detailTables = [];
    
    for (const detailConfig of detailTablesConfigs) {
      const detailBackup = await exportDetailTable(
        detailConfig.tableName,
        detailConfig.parentKey,
        detailConfig.orderColumn
      );
      detailTables.push(detailBackup);
    }
  }
  
  return {
    tableName,
    rowCount: rows.length,
    columns: exportColumns,
    rows,
    detailTables,
  };
}

/**
 * Export a detail table (parent-referenced)
 */
export async function exportDetailTable(
  tableName: string,
  parentKey: string,
  orderColumn: string | undefined
): Promise<DetailTableBackup> {
  // Get all columns for the detail table
  const columnsResult = await db.all(`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = $1
    ORDER BY ordinal_position
  `, [tableName]);
  
  const allColumns = columnsResult.map((row: any) => row.column_name as string);
  
  // Filter columns based on late-seed config
  const exportColumns = allColumns.filter((col: string) => 
    shouldExportColumn(tableName, col)
  );
  
  // Build SELECT query with ordering
  const columnList = exportColumns.join(', ');
  let orderBy = '';
  
  if (orderColumn) {
    orderBy = `ORDER BY ${orderColumn}`;
  } else if (exportColumns.includes('id')) {
    orderBy = 'ORDER BY id';
  } else if (exportColumns.includes('created_at')) {
    orderBy = 'ORDER BY created_at';
  }
  // else: no ORDER BY (junction tables, etc.)
  
  const rowsResult = await db.all(
    `SELECT ${columnList} FROM ${tableName} ${orderBy}`
  );
  
  const rows = rowsResult as Record<string, any>[];
  
  return {
    tableName,
    parentKey,
    rowCount: rows.length,
    columns: exportColumns,
    rows,
  };
}

/**
 * Export all configured entities to JSON files
 */
export async function exportAllTables(
  outputDir: string,
  metadata: BackupMetadata
): Promise<BackupIndex> {
  // Ensure output directory exists
  await fs.mkdir(outputDir, { recursive: true });
  
  const entityFiles: Record<string, string> = {};
  const checksums: Record<string, string> = {};
  
  // Export each entity table
  for (const entityName of EXPORT_ENTITIES) {
    console.log(`Exporting ${entityName}...`);
    
    const entityBackup = await exportEntityTable(entityName);
    const filename = `${entityName}.json`;
    const filepath = path.join(outputDir, filename);
    
    // Write JSON file
    const jsonContent = JSON.stringify(entityBackup, null, 2);
    await fs.writeFile(filepath, jsonContent, 'utf-8');
    
    // Calculate checksum
    const hash = createHash('sha256').update(jsonContent).digest('hex');
    
    entityFiles[entityName] = filename;
    checksums[filename] = hash;
    
    console.log(`  ✓ ${entityName}: ${entityBackup.rowCount} rows written to ${filename}`);
  }
  
  // Create backup index
  const backupIndex: BackupIndex = {
    metadata,
    entities: EXPORT_ENTITIES,
    files: entityFiles,
    tarballName: `backup_${metadata.database}_${Date.now()}.tar.gz`,
    checksums,
  };
  
  // Write index file
  const indexPath = path.join(outputDir, 'index.json');
  await fs.writeFile(indexPath, JSON.stringify(backupIndex, null, 2), 'utf-8');
  
  console.log(`\n✓ Backup index written to index.json`);
  
  return backupIndex;
}

/**
 * Create a tarball from the exported JSON files
 */
export async function createBackupTarball(
  outputDir: string,
  backupIndex: BackupIndex
): Promise<string> {
  const tarballPath = path.join(outputDir, '..', backupIndex.tarballName);
  
  // Create tar.gz archive
  const tarCommand = `tar -czf "${tarballPath}" -C "${outputDir}" .`;
  
  console.log(`\nCreating tarball: ${backupIndex.tarballName}`);
  await execAsync(tarCommand);
  
  // Get tarball size
  const stats = await fs.stat(tarballPath);
  const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
  
  console.log(`✓ Tarball created: ${tarballPath} (${sizeMB} MB)`);
  
  return tarballPath;
}

/**
 * Main export function: exports all tables and creates tarball
 */
export async function exportDatabase(
  database: string,
  migrationPackage: string,
  description?: string
): Promise<string> {
  const timestamp = new Date().toISOString();
  const metadata: BackupMetadata = {
    timestamp,
    database,
    version: '1.0',
    migrationPackage,
    description,
  };
  
  // Create temporary directory for export
  const tempDir = path.join(process.cwd(), 'temp_backup', `backup_${Date.now()}`);
  
  console.log(`\n=== Database Export ===`);
  console.log(`Database: ${database}`);
  console.log(`Migration Package: ${migrationPackage}`);
  console.log(`Timestamp: ${timestamp}`);
  console.log(`Output: ${tempDir}\n`);
  
  // Export all tables
  const backupIndex = await exportAllTables(tempDir, metadata);
  
  // Create tarball
  const tarballPath = await createBackupTarball(tempDir, backupIndex);
  
  // Clean up temporary directory
  console.log(`\nCleaning up temporary files...`);
  await fs.rm(tempDir, { recursive: true, force: true });
  console.log(`✓ Temporary directory removed`);
  
  console.log(`\n=== Export Complete ===`);
  console.log(`Tarball: ${tarballPath}`);
  
  return tarballPath;
}

/**
 * Export to a single JSON file (useful for small databases)
 */
export async function exportToSingleFile(
  outputPath: string,
  metadata: BackupMetadata
): Promise<void> {
  const entities: EntityBackup[] = [];
  
  // Export each entity table
  for (const entityName of EXPORT_ENTITIES) {
    console.log(`Exporting ${entityName}...`);
    const entityBackup = await exportEntityTable(entityName);
    entities.push(entityBackup);
  }
  
  // Create complete backup
  const completeBackup: CompleteBackup = {
    metadata,
    entities,
  };
  
  // Write to file
  await fs.writeFile(outputPath, JSON.stringify(completeBackup, null, 2), 'utf-8');
  
  console.log(`\n✓ Export complete: ${outputPath}`);
}
