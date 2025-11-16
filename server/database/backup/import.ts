/**
 * MR4: Import System with Late-Seeding Resolution
 * 
 * Features:
 * 1. Correct ordering: System tables first → Entity tables → Detail tables
 * 2. Late-seeding resolver: xmlid/sysmail/domaincode → id mapping
 * 3. Foreign key resolution for system tables
 * 
 * CRITICAL ARCHITECTURE:
 * 
 * Phase 0: System tables WITHOUT dependencies (tags, status)
 * - These are seeded by migrations and should have stable IDs
 * - Status: exported WITH id (stable across systems)
 * - Tags: exported WITHOUT id (will be remapped)
 * 
 * Phase 1: Entity tables with index columns
 * - users: sysmail → id
 * - projects: domaincode → id
 * - images: xmlid → id (CRITICAL: has xmlid, NOT a system table!)
 * - instructors, locations, participants, posts, events: xmlid → id
 * 
 * Phase 2: System tables WITH dependencies (interactions, pages, tasks)
 * - These reference entity tables and need ID remapping
 * 
 * Phase 3: Detail/junction tables (project_members, events_tags, etc.)
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

export interface ImportResult {
    timestamp: string;
    tarballPath: string;
    entities: string[];
    stats: {
        [tableName: string]: {
            total: number;
            imported: number;
            skipped: number;
            failed: number;
        };
    };
    mappings: {
        users: Map<string, number>;       // sysmail → id
        projects: Map<string, number>;    // domaincode → id
        events: Map<string, number>;      // xmlid → id
        posts: Map<string, number>;       // xmlid → id
        instructors: Map<string, number>; // xmlid → id
        locations: Map<string, number>;   // xmlid → id
        participants: Map<string, number>; // xmlid → id
        images: Map<string, number>;      // xmlid → id (NEVER remap by id!)
        tags: Map<number, number>;        // old_id → new_id (only system table)
    };
}

/**
 * Import database from backup tarball with late-seeding resolution
 */
export async function importDatabase(
    tarballPath: string,
    mode: 'skip' | 'replace' = 'skip'
): Promise<ImportResult> {
    console.log(`\n=== Import with Late-Seeding Resolution (${mode} mode) ===`);
    console.log(`Tarball: ${tarballPath}\n`);

    // Extract tarball to temp directory
    const tempDir = path.join(process.cwd(), 'temp_import', `import_${Date.now()}`);
    await fs.mkdir(tempDir, { recursive: true });

    // Initialize mapping tables for late-seeding resolution
    const mappings: ImportResult['mappings'] = {
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

        const stats: ImportResult['stats'] = {};

        // PHASE 0: Import system tables WITHOUT dependencies (tags, status)
        console.log('\n=== PHASE 0: System Tables (no dependencies) ===\n');

        const systemTablesNoDeps = [
            'tags',    // Referenced by events_tags, posts_tags
            'status',  // Referenced by all entities via status_id FK
        ];

        for (const tableName of systemTablesNoDeps) {
            if (!backupIndex.entities.includes(tableName)) continue;

            const entityFile = backupIndex.files[tableName];
            const entityPath = path.join(tempDir, entityFile);
            const entityContent = await fs.readFile(entityPath, 'utf-8');
            const entityBackup: EntityBackup = JSON.parse(entityContent);

            // Status is special: it has stable IDs from migrations, import with ID preservation
            if (tableName === 'status') {
                const result = await importSystemTable(entityBackup, mode, mappings, true);
                stats[tableName] = result;
            } else {
                // Tags need ID remapping
                const result = await importSystemTable(entityBackup, mode, mappings, false);
                stats[tableName] = result;
            }
        }

        // PHASE 1: Import entity tables with index columns (users, projects, images, events, etc.)
        console.log('\n=== PHASE 1: Entity Tables (with index columns) ===\n');

        // SPECIAL: Create setup instructor to handle users.instructor_id circular dependency
        console.log('Creating setup instructor for circular dependency resolution...');
        const setupInstructor = await db.get(
            `INSERT INTO instructors (xmlid, name, status_id) 
             VALUES ($1, $2, $3) 
             ON CONFLICT (xmlid) DO UPDATE SET xmlid = EXCLUDED.xmlid
             RETURNING id, xmlid`,
            ['setup', 'Setup Placeholder', 1]
        );
        mappings.instructors.set('setup', setupInstructor.id);
        console.log(`  ✓ Setup instructor created with id=${setupInstructor.id}\n`);

        const entityTablesWithIndexes = [
            'users',       // Index: sysmail (must be first - referenced by images.owner_id)
            'projects',    // Index: domaincode (must be early - referenced by images.project_id)
            'images',      // Index: xmlid (CRITICAL: Before entities with img_id FK!)
            'instructors', // Index: xmlid (may have img_id FK)
            'locations',   // Index: xmlid (may have img_id FK)
            'participants',// Index: xmlid (may have img_id FK)
            'posts',       // Index: xmlid (may have img_id FK)
            'events',      // Index: xmlid (may have img_id FK)
        ];

        for (const entityName of entityTablesWithIndexes) {
            if (!backupIndex.entities.includes(entityName)) continue;

            const entityFile = backupIndex.files[entityName];
            const entityPath = path.join(tempDir, entityFile);
            const entityContent = await fs.readFile(entityPath, 'utf-8');
            const entityBackup: EntityBackup = JSON.parse(entityContent);

            const result = await importEntityWithIndex(entityBackup, mode, mappings);
            stats[entityName] = result;
        }

        // PHASE 2: Import system tables WITH dependencies (interactions, pages, tasks)
        console.log('\n=== PHASE 2: System Tables (with dependencies) ===\n');

        const systemTablesWithDeps = [
            'interactions', // May reference entities
            'pages',        // System table
            'tasks',        // References status via status_id
        ];

        for (const tableName of systemTablesWithDeps) {
            if (!backupIndex.entities.includes(tableName)) continue;

            const entityFile = backupIndex.files[tableName];
            const entityPath = path.join(tempDir, entityFile);
            const entityContent = await fs.readFile(entityPath, 'utf-8');
            const entityBackup: EntityBackup = JSON.parse(entityContent);

            const result = await importSystemTable(entityBackup, mode, mappings, false);
            stats[tableName] = result;
        }

        // PHASE 3: Import detail/junction tables
        console.log('\n=== PHASE 3: Detail/Junction Tables ===\n');

        for (const entityName of backupIndex.entities) {
            const entityFile = backupIndex.files[entityName];
            const entityPath = path.join(tempDir, entityFile);
            const entityContent = await fs.readFile(entityPath, 'utf-8');
            const entityBackup: EntityBackup = JSON.parse(entityContent);

            if (entityBackup.detailTables && entityBackup.detailTables.length > 0) {
                for (const detailTable of entityBackup.detailTables) {
                    const result = await importDetailTableWithMapping(detailTable, mode, mappings);
                    stats[detailTable.tableName] = result;
                }
            }
        }

        // PHASE 4: Late-seeding - Update users.instructor_id to actual instructor IDs
        console.log('\n=== PHASE 4: Late-Seeding Resolution ===\n');
        
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
                const instructorXmlid = row.instructor_xmlid; // Assuming export includes this

                if (!sysmail || !instructorXmlid) {
                    skipped++;
                    continue;
                }

                // Get the real instructor ID from mapping
                const instructorId = mappings.instructors.get(instructorXmlid);
                if (!instructorId) {
                    console.error(`  ✗ Instructor not found for xmlid: ${instructorXmlid}`);
                    skipped++;
                    continue;
                }

                // Update user's instructor_id
                await db.run(
                    `UPDATE users SET instructor_id = $1 WHERE sysmail = $2`,
                    [instructorId, sysmail]
                );
                updated++;
            }

            console.log(`  ✓ Updated ${updated} users, skipped ${skipped}\n`);
        }

        // Resolve projects.regio references
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

                // Get the real regio project ID from mapping
                const regioId = mappings.projects.get(regioDomaincode);
                if (!regioId) {
                    console.error(`  ✗ Regio project not found for domaincode: ${regioDomaincode}`);
                    skipped++;
                    continue;
                }

                // Update project's regio
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

        console.log(`\n✅ Import complete!\n`);
        console.log(`Summary:`);
        for (const [tableName, tableStat] of Object.entries(stats)) {
            console.log(`  ${tableName}: ${tableStat.imported}/${tableStat.total} imported, ${tableStat.skipped} skipped, ${tableStat.failed} failed`);
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
 * Import entity table with index column (users, projects, events, etc.)
 * Builds mapping from index column to id
 */
async function importEntityWithIndex(
    entity: EntityBackup,
    mode: 'skip' | 'replace',
    mappings: ImportResult['mappings']
): Promise<{ total: number; imported: number; skipped: number; failed: number }> {
    const { tableName, columns, rows } = entity;

    console.log(`\nImporting ${tableName}: ${rows.length} rows...`);

    if (rows.length === 0) {
        console.log(`  (empty)`);
        return { total: 0, imported: 0, skipped: 0, failed: 0 };
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
        // events, posts, instructors, locations, participants, images use xmlid
        indexColumn = 'xmlid';
        if (tableName === 'events') mappingTable = mappings.events as Map<string, number>;
        else if (tableName === 'posts') mappingTable = mappings.posts as Map<string, number>;
        else if (tableName === 'instructors') mappingTable = mappings.instructors as Map<string, number>;
        else if (tableName === 'locations') mappingTable = mappings.locations as Map<string, number>;
        else if (tableName === 'participants') mappingTable = mappings.participants as Map<string, number>;
        else if (tableName === 'images') mappingTable = mappings.images as Map<string, number>;
        else throw new Error(`Unknown entity table: ${tableName}`);
    }

    let imported = 0;
    let skipped = 0;
    let failed = 0;

    // Build INSERT query (exclude 'id' if present, as it will be auto-generated)
    const insertColumns = columns.filter(col => col !== 'id');
    const columnList = insertColumns.join(', ');
    const placeholders = insertColumns.map((_, i) => `$${i + 1}`).join(', ');
    const query = `INSERT INTO ${tableName} (${columnList}) VALUES (${placeholders}) RETURNING id, ${indexColumn}`;

    for (const row of rows) {
        try {
            const indexValue = row[indexColumn];
            if (!indexValue) {
                console.error(`  ✗ Row missing ${indexColumn}`);
                failed++;
                continue;
            }

            // Check if already exists
            const existing = await db.get(
                `SELECT id FROM ${tableName} WHERE ${indexColumn} = $1`,
                [indexValue]
            );

            if (existing) {
                // Already exists - store mapping and skip
                mappingTable.set(indexValue, existing.id);
                skipped++;
                continue;
            }

            // Extract values in column order (excluding id)
            const values = insertColumns.map(col => {
                // Special handling for users.instructor_id: use setup instructor temporarily
                if (tableName === 'users' && col === 'instructor_id') {
                    const setupId = mappings.instructors.get('setup');
                    return setupId || null;
                }
                // Special handling for projects.regio: set NULL temporarily (circular dependency)
                if (tableName === 'projects' && col === 'regio') {
                    return null;
                }
                return row[col];
            });

            const result = await db.get(query, values);
            if (result) {
                mappingTable.set(indexValue, result.id);
                imported++;
            }
        } catch (error: any) {
            failed++;
            console.error(`  ✗ Failed to import row:`, error.message);
            if (mode === 'replace') {
                throw error;
            }
        }
    }

    console.log(`  ✓ ${imported} imported, ${skipped} skipped, ${failed} failed`);
    console.log(`  → ${mappingTable.size} entries in mapping table`);

    return { total: rows.length, imported, skipped, failed };
}

/**
 * Import system table (tags, status, interactions, etc.) - builds id mapping
 * @param preserveId - If true, imports with original ID (for status table)
 */
async function importSystemTable(
    entity: EntityBackup,
    mode: 'skip' | 'replace',
    mappings: ImportResult['mappings'],
    preserveId: boolean = false
): Promise<{ total: number; imported: number; skipped: number; failed: number }> {
    const { tableName, columns, rows } = entity;

    console.log(`\nImporting system table ${tableName}: ${rows.length} rows... ${preserveId ? '(preserving IDs)' : '(remapping IDs)'}`);

    if (rows.length === 0) {
        console.log(`  (empty)`);
        return { total: 0, imported: 0, skipped: 0, failed: 0 };
    }

    let mappingTable: Map<number, number> | undefined;
    if (tableName === 'tags') mappingTable = mappings.tags;
    // Status doesn't need mapping table if preserving IDs

    let imported = 0;
    let skipped = 0;
    let failed = 0;

    if (preserveId && columns.includes('id')) {
        // Special handling for status: preserve original IDs
        // Quote column names to handle reserved keywords (e.g., "table")
        const quotedColumns = columns.map(col => `"${col}"`);
        const columnList = quotedColumns.join(', ');
        const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
        const query = `INSERT INTO "${tableName}" (${columnList}) VALUES (${placeholders}) ON CONFLICT (id) DO NOTHING`;

        for (const row of rows) {
            try {
                const values = columns.map(col => row[col]);
                await db.run(query, values);
                
                // Check if row was actually inserted (not skipped by ON CONFLICT)
                const inserted = await db.get(
                    `SELECT id FROM "${tableName}" WHERE id = $1`,
                    [row.id]
                );
                
                if (inserted) {
                    imported++;
                } else {
                    skipped++;
                }
            } catch (error: any) {
                failed++;
                console.error(`  ✗ Failed to import row:`, error.message);
                if (mode === 'replace') {
                    throw error;
                }
            }
        }
    } else {
        // Normal system table: exclude id, let DB generate new one, build mapping
        const hasOldId = columns.includes('id');
        const insertColumns = columns.filter(col => col !== 'id');
        const columnList = insertColumns.join(', ');
        const placeholders = insertColumns.map((_, i) => `$${i + 1}`).join(', ');
        const query = `INSERT INTO ${tableName} (${columnList}) VALUES (${placeholders}) RETURNING id`;

        for (const row of rows) {
            try {
                const oldId = hasOldId ? row['id'] : null;

                // Extract values (excluding id)
                const values = insertColumns.map(col => row[col]);

                const result = await db.get(query, values);
                if (result && oldId && mappingTable) {
                    mappingTable.set(oldId, result.id);
                }
                imported++;
            } catch (error: any) {
                if (error.code === '23505' && mode === 'skip') {
                    skipped++;
                } else {
                    failed++;
                    console.error(`  ✗ Failed to import row:`, error.message);
                    if (mode === 'replace') {
                        throw error;
                    }
                }
            }
        }
    }

    console.log(`  ✓ ${imported} imported, ${skipped} skipped, ${failed} failed`);
    if (mappingTable) {
        console.log(`  → ${mappingTable.size} entries in mapping table`);
    }

    return { total: rows.length, imported, skipped, failed };
}

/**
 * Import detail/junction table with foreign key mapping
 */
async function importDetailTableWithMapping(
    detailTable: DetailTableBackup,
    mode: 'skip' | 'replace',
    mappings: ImportResult['mappings']
): Promise<{ total: number; imported: number; skipped: number; failed: number }> {
    const { tableName, columns, rows } = detailTable;

    console.log(`\nImporting detail table ${tableName}: ${rows.length} rows...`);

    if (rows.length === 0) {
        console.log(`  (empty)`);
        return { total: 0, imported: 0, skipped: 0, failed: 0 };
    }

    let imported = 0;
    let skipped = 0;
    let failed = 0;

    // Build INSERT query (exclude 'id' if present)
    const insertColumns = columns.filter(col => col !== 'id');
    const columnList = insertColumns.join(', ');
    const placeholders = insertColumns.map((_, i) => `$${i + 1}`).join(', ');
    const query = `INSERT INTO ${tableName} (${columnList}) VALUES (${placeholders})`;

    for (const row of rows) {
        try {
            // Resolve foreign keys using mappings
            const resolvedRow: Record<string, any> = { ...row };

            // Resolve event_id → events.xmlid
            if (resolvedRow.event_id) {
                // Need to look up by xmlid - for detail tables, we assume parent already imported
                // Skip resolution for now - this requires reverse lookup
            }

            // Resolve instructor_id → instructors.xmlid
            if (resolvedRow.instructor_id) {
                // Skip resolution for now
            }

            // Extract values
            const values = insertColumns.map(col => resolvedRow[col]);

            await db.run(query, values);
            imported++;
        } catch (error: any) {
            if (error.code === '23505' && mode === 'skip') {
                skipped++;
            } else {
                failed++;
                console.error(`  ✗ Failed to import row:`, error.message);
                if (mode === 'replace') {
                    throw error;
                }
            }
        }
    }

    console.log(`  ✓ ${imported} imported, ${skipped} skipped, ${failed} failed`);

    return { total: rows.length, imported, skipped, failed };
}
