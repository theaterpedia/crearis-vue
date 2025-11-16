/**
 * API endpoint for update-import (UPSERT mode)
 * Merges dev changes back to production
 */

import { updateImportDatabase } from '../../../database/backup/update-import';
import { defineEventHandler, readBody, createError } from 'h3';

export default defineEventHandler(async (event) => {
    const body = await readBody(event) as { tarballPath?: string };
    const { tarballPath } = body;

    if (!tarballPath) {
        throw createError({
            statusCode: 400,
            message: 'tarballPath is required',
        });
    }

    try {
        const result = await updateImportDatabase(tarballPath);

        return {
            success: true,
            result,
        };
    } catch (error: any) {
        console.error('Update import failed:', error);
        throw createError({
            statusCode: 500,
            message: `Update import failed: ${error.message}`,
        });
    }
});
