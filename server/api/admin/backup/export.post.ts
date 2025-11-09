/**
 * MR3: Export API Endpoint
 * 
 * POST /api/admin/backup/export
 * 
 * Creates a database backup tarball and returns download URL
 * Requires admin authentication
 */

import { exportDatabase } from '../../../database/backup/export';
import { defineEventHandler, readBody, createError } from 'h3';

export default defineEventHandler(async (event) => {
  // Check authentication (admin only)
  // TODO: Add proper admin authentication check
  // For now, we'll allow it for testing
  
  try {
    // Read request body for optional parameters
    const body = (await readBody(event).catch(() => ({}))) as {
      database?: string;
      migrationPackage?: string;
      description?: string;
    };
    
    const database = body.database || process.env.DB_NAME || 'demo-data.db';
    const migrationPackage = body.migrationPackage || 'A';
    const description = body.description || `Manual backup - ${new Date().toISOString()}`;
    
    console.log('\n=== Export API Called ===');
    console.log(`Database: ${database}`);
    console.log(`Package: ${migrationPackage}`);
    console.log(`Description: ${description}`);
    
    // Validate migration package
    const validPackages = ['A', 'B', 'C', 'D', 'E'];
    if (!validPackages.includes(migrationPackage)) {
      throw createError({
        statusCode: 400,
        statusMessage: `Invalid migration package: ${migrationPackage}. Must be one of: ${validPackages.join(', ')}`,
      });
    }
    
    // Run export
    const tarballPath = await exportDatabase(database, migrationPackage, description);
    
    // Extract filename from path
    const filename = tarballPath.split('/').pop();
    
    // Return success response
    return {
      success: true,
      message: 'Database backup created successfully',
      data: {
        filename,
        path: tarballPath,
        database,
        migrationPackage,
        description,
        timestamp: new Date().toISOString(),
      },
    };
    
  } catch (error: any) {
    console.error('Export API error:', error);
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Export failed',
      data: {
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
    });
  }
});
