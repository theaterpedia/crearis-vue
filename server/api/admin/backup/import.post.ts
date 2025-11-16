/**
 * MR4: Import API Endpoint
 * 
 * POST /api/admin/backup/import
 * 
 * Imports a database backup tarball
 * Requires admin authentication
 * 
 * BASIC VERSION - For development/testing only
 * - Skips duplicates on conflict
 * - No late-seeding resolution
 * - No validation
 */

import { importDatabase } from '../../../database/backup/import';
import { defineEventHandler, readBody, createError } from 'h3';

export default defineEventHandler(async (event) => {
    // Check authentication (admin only)
    // TODO: Add proper admin authentication check

    try {
        const body = (await readBody(event)) as {
            tarballPath: string;
            mode?: 'skip' | 'replace';
        };

        if (!body.tarballPath) {
            throw createError({
                statusCode: 400,
                statusMessage: 'Missing required field: tarballPath',
            });
        }

        const mode = body.mode || 'skip';

        console.log('\n=== Import API Called ===');
        console.log(`Tarball: ${body.tarballPath}`);
        console.log(`Mode: ${mode}`);

        // Run import
        const result = await importDatabase(body.tarballPath, mode);

        // Return success response
        return {
            success: true,
            message: 'Database import completed successfully',
            data: result,
        };

    } catch (error: any) {
        console.error('Import API error:', error);

        throw createError({
            statusCode: 500,
            statusMessage: 'Import failed',
            data: {
                error: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
            },
        });
    }
});
