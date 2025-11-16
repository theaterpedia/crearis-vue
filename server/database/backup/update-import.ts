/**
 * MR4: Update Import System - Merge Dev Changes to Production
 * 
 * This system handles importing data that may contain BOTH:
 * 1. New records (don't exist in target DB)
 * 2. Updated records (exist in target DB but have changes)
 * 
 * Key Features:
 * - Upsert logic: INSERT new records, UPDATE existing ones
 * - Preserves relationships via index columns (sysmail, domaincode, xmlid)
 * - Handles circular dependencies (users↔instructors, projects↔projects)
 * - Updates computed columns automatically via database triggers
 * - Maintains referential integrity throughout
 * 
 * Workflow:
 * 1. Production system → Export backup
 * 2. Import to dev DB → Make changes
 * 3. Dev DB → Export backup
 * 4. Run update-import → Merges dev changes back to production
 */

import { db } from '../db-new';
import * as fs from 'fs/promises';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import type {
    BackupIndex,
    EntityBackup,
    DetailTableBackup
} from '../../types/backup-schema';

const execAsync = promisify(exec);

export interface UpdateImportResult {
    timestamp: string;
    tarballPath: string;
    entities: string[];
    stats: {
        [tableName: string]: {
            total: number;
            inserted: number;
            updated: number;
            skipped: number;
            failed: number;
        };
    };
    mappings: {
        users: Map<string, number>;
        projects: Map<string, number>;
        events: Map<string, number>;
        posts: Map<string, number>;
        instructors: Map<string, number>;
        locations: Map<string, number>;
        participants: Map<string, number>;
        images: Map<string, number>;
        tags: Map<number, number>;
    };
}

/**
 * Update import: Merge changes from dev to production
 * Uses UPSERT logic to insert new records or update existing ones
 */
export async function updateImportDatabase(
    tarballPath: string
): Promise<UpdateImportResult> {
    console.log(`\n=== Update Import - Merge Dev Changes (UPSERT mode) ===`);
    console.log(`Tarball: ${tarballPath}\n`);

    // Extract tarball to temp directory
    const tempDir = path.join(process.cwd(), 'temp_import', `update_${Date.now()}`);
    await fs.mkdir(tempDir, { recursive: true });

    // Initialize mapping tables
    const mappings: UpdateImportResult['mappings'] = {
        users: new Map(),
        projects: new Map(),
        events: new Map(),
        posts: new Map(),
        instructors: new Map(),
        locations: new Map(),
        participants: new Map(),
        images: new Map(),
        tags: new Map(),
    };

    try {
        console.log(`Extracting tarball to ${tempDir}...`);
        await execAsync(`tar -xzf "${tarballPath}" -C "${tempDir}"`);

        // Read index
        const indexPath = path.join(tempDir, 'index.json');
        const indexContent = await fs.readFile(indexPath, 'utf-8');
        const backupIndex: BackupIndex = JSON.parse(indexContent);

        console.log(`\nBackup metadata:`);
        console.log(`  Database: ${backupIndex.metadata.database}`);
        console.log(`  Package: ${backupIndex.metadata.migrationPackage}`);
        console.log(`  Created: ${backupIndex.metadata.timestamp}`);
        console.log(`  Entities: ${backupIndex.entities.length}\n`);

        const stats: UpdateImportResult['stats'] = {};

        // PHASE 0: Upsert system tables (tags, status)
        console.log('\n=== PHASE 0: System Tables (no dependencies) ===\n');

        // Tags: use name as unique identifier
        if (backupIndex.entities.includes('tags')) {
            const result = await upsertTags(backupIndex, tempDir, mappings);
            stats['tags'] = result;
        }

        // Status: skip - these are migration-seeded and should not be changed
        console.log('Skipping status table (migration-seeded, no updates needed)\n');

        // PHASE 1: Upsert entity tables
        console.log('\n=== PHASE 1: Entity Tables (with index columns) ===\n');

        // SPECIAL: Create setup instructor for circular dependency resolution
        console.log('Creating setup instructor for circular dependency resolution...');
        const setupInstructor = await db.get(
            `INSERT INTO instructors (xmlid, name, status_id) 
             VALUES ($1, $2, $3) 
             ON CONFLICT (xmlid) DO UPDATE SET xmlid = EXCLUDED.xmlid
             RETURNING id, xmlid`,
            ['setup', 'Setup Placeholder', 1]
        );
        mappings.instructors.set('setup', setupInstructor.id);
        console.log(`  ✓ Setup instructor ready with id=${setupInstructor.id}\n`);

        const entityTablesWithIndexes = [
            'users',       // Index: sysmail
            'projects',    // Index: domaincode
            'images',      // Index: xmlid
            'instructors', // Index: xmlid
            'locations',   // Index: xmlid
            'participants',// Index: xmlid
            'posts',       // Index: xmlid
            'events',      // Index: xmlid
        ];

        for (const entityName of entityTablesWithIndexes) {
            if (!backupIndex.entities.includes(entityName)) continue;

            const entityFile = backupIndex.files[entityName];
            const entityPath = path.join(tempDir, entityFile);
            const entityContent = await fs.readFile(entityPath, 'utf-8');
            const entityBackup: EntityBackup = JSON.parse(entityContent);

            const result = await upsertEntityWithIndex(entityBackup, mappings);
            stats[entityName] = result;
        }

        // PHASE 2: Upsert system tables with dependencies
        console.log('\n=== PHASE 2: System Tables (with dependencies) ===\n');

        const systemTablesWithDeps = ['interactions', 'pages', 'tasks'];

        for (const tableName of systemTablesWithDeps) {
            if (!backupIndex.entities.includes(tableName)) continue;

            const entityFile = backupIndex.files[tableName];
            const entityPath = path.join(tempDir, entityFile);
            const entityContent = await fs.readFile(entityPath, 'utf-8');
            const entityBackup: EntityBackup = JSON.parse(entityContent);

            const result = await upsertSystemTable(entityBackup, mappings);
            stats[tableName] = result;
        }

        // PHASE 3: Upsert detail/junction tables
        console.log('\n=== PHASE 3: Detail/Junction Tables ===\n');

        for (const entityName of backupIndex.entities) {
            const entityFile = backupIndex.files[entityName];
            const entityPath = path.join(tempDir, entityFile);
            const entityContent = await fs.readFile(entityPath, 'utf-8');
            const entityBackup: EntityBackup = JSON.parse(entityContent);

            if (entityBackup.detailTables && entityBackup.detailTables.length > 0) {
                for (const detailTable of entityBackup.detailTables) {
                    const result = await upsertDetailTable(detailTable, mappings);
                    stats[detailTable.tableName] = result;
                }
            }
        }

        // PHASE 4: Late-seeding resolution
        console.log('\n=== PHASE 4: Late-Seeding Resolution ===\n');

        // Resolve users.instructor_id
        if (backupIndex.entities.includes('users')) {
            console.log('Resolving users.instructor_id references...');
            const usersFile = backupIndex.files['users'];
            const usersPath = path.join(tempDir, usersFile);
            const usersContent = await fs.readFile(usersPath, 'utf-8');
            const usersBackup: EntityBackup = JSON.parse(usersContent);

            let updated = 0;
            let skipped = 0;

            for (const row of usersBackup.rows) {
                const sysmail = row.sysmail;
                const instructorXmlid = row.instructor_xmlid;

                if (!sysmail || !instructorXmlid) {
                    skipped++;
                    continue;
                }

                const instructorId = mappings.instructors.get(instructorXmlid);
                if (!instructorId) {
                    console.error(`  ✗ Instructor not found for xmlid: ${instructorXmlid}`);
                    skipped++;
                    continue;
                }

                await db.run(
                    `UPDATE users SET instructor_id = $1 WHERE sysmail = $2`,
                    [instructorId, sysmail]
                );
                updated++;
            }

            console.log(`  ✓ Updated ${updated} users, skipped ${skipped}\n`);
        }

        // Resolve projects.regio
        if (backupIndex.entities.includes('projects')) {
            console.log('Resolving projects.regio references...');
            const projectsFile = backupIndex.files['projects'];
            const projectsPath = path.join(tempDir, projectsFile);
            const projectsContent = await fs.readFile(projectsPath, 'utf-8');
            const projectsBackup: EntityBackup = JSON.parse(projectsContent);

            let updated = 0;
            let skipped = 0;

            for (const row of projectsBackup.rows) {
                const domaincode = row.domaincode;
                const regioDomaincode = row.regio_domaincode;

                if (!domaincode || !regioDomaincode) {
                    skipped++;
                    continue;
                }

                const regioId = mappings.projects.get(regioDomaincode);
                if (!regioId) {
                    console.error(`  ✗ Regio project not found for domaincode: ${regioDomaincode}`);
                    skipped++;
                    continue;
                }

                await db.run(
                    `UPDATE projects SET regio = $1 WHERE domaincode = $2`,
                    [regioId, domaincode]
                );
                updated++;
            }

            console.log(`  ✓ Updated ${updated} projects, skipped ${skipped}\n`);
        }

        // Cleanup: Remove setup instructor placeholder
        console.log('Cleaning up setup instructor placeholder...');
        const setupId = mappings.instructors.get('setup');
        if (setupId) {
            await db.run(`DELETE FROM instructors WHERE xmlid = $1`, ['setup']);
            mappings.instructors.delete('setup');
            console.log(`  ✓ Setup instructor removed\n`);
        }

        console.log(`\n✅ Update import complete!\n`);
        console.log(`Summary:`);
        for (const [tableName, tableStat] of Object.entries(stats)) {
            console.log(`  ${tableName}: ${tableStat.inserted} inserted, ${tableStat.updated} updated, ${tableStat.skipped} skipped, ${tableStat.failed} failed`);
        }

        console.log(`\nMapping Tables:`);
        console.log(`  users: ${mappings.users.size} entries`);
        console.log(`  projects: ${mappings.projects.size} entries`);
        console.log(`  events: ${mappings.events.size} entries`);
        console.log(`  posts: ${mappings.posts.size} entries`);
        console.log(`  instructors: ${mappings.instructors.size} entries`);
        console.log(`  locations: ${mappings.locations.size} entries`);
        console.log(`  images: ${mappings.images.size} entries`);
        console.log(`  tags: ${mappings.tags.size} entries`);

        return {
            timestamp: new Date().toISOString(),
            tarballPath,
            entities: backupIndex.entities,
            stats,
            mappings,
        };

    } finally {
        // Cleanup temp directory
        console.log(`\nCleaning up temp directory...`);
        await fs.rm(tempDir, { recursive: true, force: true });
    }
}

/**
 * Upsert entity table with index column (users, projects, events, etc.)
 * INSERT if new, UPDATE if exists
 */
async function upsertEntityWithIndex(
    entity: EntityBackup,
    mappings: UpdateImportResult['mappings']
): Promise<{ total: number; inserted: number; updated: number; skipped: number; failed: number }> {
    const { tableName, columns, rows } = entity;

    console.log(`\nUpserting ${tableName}: ${rows.length} rows...`);

    if (rows.length === 0) {
        console.log(`  (empty)`);
        return { total: 0, inserted: 0, updated: 0, skipped: 0, failed: 0 };
    }

    // Determine index column
    let indexColumn: string;
    let mappingTable: Map<string | number, number>;

    if (tableName === 'users') {
        indexColumn = 'sysmail';
        mappingTable = mappings.users as Map<string, number>;
    } else if (tableName === 'projects') {
        indexColumn = 'domaincode';
        mappingTable = mappings.projects as Map<string, number>;
    } else {
        indexColumn = 'xmlid';
        if (tableName === 'events') mappingTable = mappings.events as Map<string, number>;
        else if (tableName === 'posts') mappingTable = mappings.posts as Map<string, number>;
        else if (tableName === 'instructors') mappingTable = mappings.instructors as Map<string, number>;
        else if (tableName === 'locations') mappingTable = mappings.locations as Map<string, number>;
        else if (tableName === 'participants') mappingTable = mappings.participants as Map<string, number>;
        else if (tableName === 'images') mappingTable = mappings.images as Map<string, number>;
        else throw new Error(`Unknown entity table: ${tableName}`);
    }

    let inserted = 0;
    let updated = 0;
    let skipped = 0;
    let failed = 0;

    // Build column lists (exclude 'id' for insert, include for update)
    const dataColumns = columns.filter(col => col !== 'id' && col !== indexColumn);

    for (const row of rows) {
        try {
            const indexValue = row[indexColumn];
            if (!indexValue) {
                console.error(`  ✗ Row missing ${indexColumn}`);
                failed++;
                continue;
            }

            // Check if record exists
            const existing = await db.get(
                `SELECT id FROM ${tableName} WHERE ${indexColumn} = $1`,
                [indexValue]
            );

            if (existing) {
                // UPDATE existing record
                const updateSetClauses = dataColumns.map((col, i) => {
                    // Special handling for circular dependencies
                    if (tableName === 'users' && col === 'instructor_id') {
                        return null; // Skip, will be updated in late-seeding
                    }
                    if (tableName === 'projects' && col === 'regio') {
                        return null; // Skip, will be updated in late-seeding
                    }
                    return `${col} = $${i + 1}`;
                }).filter(Boolean);

                if (updateSetClauses.length > 0) {
                    const updateValues = dataColumns.map(col => {
                        if (tableName === 'users' && col === 'instructor_id') return null;
                        if (tableName === 'projects' && col === 'regio') return null;
                        return row[col];
                    }).filter((_, i) => {
                        const col = dataColumns[i];
                        if (tableName === 'users' && col === 'instructor_id') return false;
                        if (tableName === 'projects' && col === 'regio') return false;
                        return true;
                    });

                    const updateQuery = `UPDATE ${tableName} SET ${updateSetClauses.join(', ')} WHERE ${indexColumn} = $${updateSetClauses.length + 1}`;
                    await db.run(updateQuery, [...updateValues, indexValue]);
                    updated++;
                }

                mappingTable.set(indexValue, existing.id);
            } else {
                // INSERT new record
                const insertColumns = [indexColumn, ...dataColumns];
                const columnList = insertColumns.join(', ');
                const placeholders = insertColumns.map((_, i) => `$${i + 1}`).join(', ');
                const query = `INSERT INTO ${tableName} (${columnList}) VALUES (${placeholders}) RETURNING id`;

                const values = insertColumns.map(col => {
                    if (col === indexColumn) return indexValue;
                    // Special handling for circular dependencies
                    if (tableName === 'users' && col === 'instructor_id') {
                        const setupId = mappings.instructors.get('setup');
                        return setupId || null;
                    }
                    if (tableName === 'projects' && col === 'regio') {
                        return null;
                    }
                    return row[col];
                });

                const result = await db.get(query, values);
                if (result) {
                    mappingTable.set(indexValue, result.id);
                    inserted++;
                }
            }
        } catch (error: any) {
            failed++;
            console.error(`  ✗ Failed to upsert row:`, error.message);
        }
    }

    console.log(`  ✓ ${inserted} inserted, ${updated} updated, ${skipped} skipped, ${failed} failed`);
    console.log(`  → ${mappingTable.size} entries in mapping table`);

    return { total: rows.length, inserted, updated, skipped, failed };
}

/**
 * Upsert tags table using name as unique identifier
 */
async function upsertTags(
    backupIndex: BackupIndex,
    tempDir: string,
    mappings: UpdateImportResult['mappings']
): Promise<{ total: number; inserted: number; updated: number; skipped: number; failed: number }> {
    console.log('\nUpserting tags...');

    const tagsFile = backupIndex.files['tags'];
    const tagsPath = path.join(tempDir, tagsFile);
    const tagsContent = await fs.readFile(tagsPath, 'utf-8');
    const tagsBackup: EntityBackup = JSON.parse(tagsContent);

    const { rows } = tagsBackup;

    if (rows.length === 0) {
        console.log(`  (empty)`);
        return { total: 0, inserted: 0, updated: 0, skipped: 0, failed: 0 };
    }

    let inserted = 0;
    let updated = 0;
    let skipped = 0;
    let failed = 0;

    for (const row of rows) {
        try {
            const name = row.name;
            if (!name) {
                failed++;
                continue;
            }

            // Check if tag exists by name
            const existing = await db.get(
                `SELECT id FROM tags WHERE name = $1`,
                [name]
            );

            if (existing) {
                // Tag exists, store mapping
                mappings.tags.set(row.id, existing.id);
                skipped++;
            } else {
                // Insert new tag
                const result = await db.get(
                    `INSERT INTO tags (name) VALUES ($1) RETURNING id`,
                    [name]
                );
                if (result) {
                    mappings.tags.set(row.id, result.id);
                    inserted++;
                }
            }
        } catch (error: any) {
            failed++;
            console.error(`  ✗ Failed to upsert tag:`, error.message);
        }
    }

    console.log(`  ✓ ${inserted} inserted, ${updated} updated, ${skipped} skipped, ${failed} failed`);
    console.log(`  → ${mappings.tags.size} entries in mapping table`);

    return { total: rows.length, inserted, updated, skipped, failed };
}

/**
 * Upsert system table (interactions, pages, tasks)
 * These don't have natural unique keys, so we use simpler logic
 */
async function upsertSystemTable(
    entity: EntityBackup,
    mappings: UpdateImportResult['mappings']
): Promise<{ total: number; inserted: number; updated: number; skipped: number; failed: number }> {
    const { tableName, columns, rows } = entity;

    console.log(`\nUpserting system table ${tableName}: ${rows.length} rows...`);

    if (rows.length === 0) {
        console.log(`  (empty)`);
        return { total: 0, inserted: 0, updated: 0, skipped: 0, failed: 0 };
    }

    let inserted = 0;
    let updated = 0;
    let skipped = 0;
    let failed = 0;

    // For system tables, we typically INSERT only (no natural unique key to UPDATE)
    const insertColumns = columns.filter(col => col !== 'id');
    const columnList = insertColumns.join(', ');
    const placeholders = insertColumns.map((_, i) => `$${i + 1}`).join(', ');
    const query = `INSERT INTO ${tableName} (${columnList}) VALUES (${placeholders})`;

    for (const row of rows) {
        try {
            const values = insertColumns.map(col => row[col]);
            await db.run(query, values);
            inserted++;
        } catch (error: any) {
            if (error.code === '23505') {
                // Duplicate key - skip
                skipped++;
            } else {
                failed++;
                console.error(`  ✗ Failed to upsert row:`, error.message);
            }
        }
    }

    console.log(`  ✓ ${inserted} inserted, ${updated} updated, ${skipped} skipped, ${failed} failed`);

    return { total: rows.length, inserted, updated, skipped, failed };
}

/**
 * Upsert detail/junction table
 * Uses composite natural keys to detect duplicates
 */
async function upsertDetailTable(
    detailTable: DetailTableBackup,
    mappings: UpdateImportResult['mappings']
): Promise<{ total: number; inserted: number; updated: number; skipped: number; failed: number }> {
    const { tableName, columns, rows } = detailTable;

    console.log(`\nUpserting detail table ${tableName}: ${rows.length} rows...`);

    if (rows.length === 0) {
        console.log(`  (empty)`);
        return { total: 0, inserted: 0, updated: 0, skipped: 0, failed: 0 };
    }

    let inserted = 0;
    let updated = 0;
    let skipped = 0;
    let failed = 0;

    // Build INSERT query (exclude 'id' if present)
    const insertColumns = columns.filter(col => col !== 'id');
    const columnList = insertColumns.join(', ');
    const placeholders = insertColumns.map((_, i) => `$${i + 1}`).join(', ');
    const query = `INSERT INTO ${tableName} (${columnList}) VALUES (${placeholders})`;

    for (const row of rows) {
        try {
            const values = insertColumns.map(col => row[col]);
            await db.run(query, values);
            inserted++;
        } catch (error: any) {
            if (error.code === '23505') {
                // Duplicate key - already exists
                skipped++;
            } else {
                failed++;
                console.error(`  ✗ Failed to upsert row:`, error.message);
            }
        }
    }

    console.log(`  ✓ ${inserted} inserted, ${updated} updated, ${skipped} skipped, ${failed} failed`);

    return { total: rows.length, inserted, updated, skipped, failed };
}

// CLI usage removed - this file is imported by API routes during Nitro bundling
// To run standalone: pnpm tsx server/database/backup/update-import.ts <tarball>
// Note: ESM check (import.meta.url) triggers in bundled context, causing unwanted execution
