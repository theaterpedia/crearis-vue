#!/usr/bin/env tsx
/**
 * Test import functionality
 * Usage: pnpm tsx server/database/backup/test-import.ts <tarball-path>
 */

import { importDatabase } from './import';
import * as path from 'path';

async function testImport() {
    const tarballPath = process.argv[2];

    if (!tarballPath) {
        console.error('Usage: pnpm tsx server/database/backup/test-import.ts <tarball-path>');
        console.error('Example: pnpm tsx server/database/backup/test-import.ts ./backup/backup_demo-data.db_*.tar.gz');
        process.exit(1);
    }

    try {
        const result = await importDatabase(tarballPath, 'skip');

        console.log('\n\n=== Import Complete ===');
        console.log(JSON.stringify(result, null, 2));

    } catch (error) {
        console.error('\n\n=== Import Failed ===');
        console.error(error);
        process.exit(1);
    }
}

testImport();
