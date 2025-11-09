/**
 * MR2: Test Export System
 * 
 * Tests the database export functionality by exporting the current database
 * to a tarball. Run this to verify MR2 implementation.
 * 
 * Usage:
 *   tsx server/database/backup/test-export.ts
 */

import { exportDatabase } from './export';
import { db } from '../db-new';

async function testExport() {
  console.log('\n=== Testing Export System (MR2) ===\n');
  
  // Get database name from config
  const database = process.env.DATABASE_URL ? 'production.db' : 'demo-data.db';
  const migrationPackage = 'A'; // Base schema only
  
  try {
    // Run export
    const tarballPath = await exportDatabase(
      database,
      migrationPackage,
      'MR2 test export - validating export system'
    );
    
    console.log('\n✅ Export test completed successfully!');
    console.log(`\nVerify the tarball was created:`);
    console.log(`  ls -lh ${tarballPath}`);
    console.log(`\nTo extract and inspect:`);
    console.log(`  mkdir test_backup && tar -xzf ${tarballPath} -C test_backup`);
    console.log(`  cat test_backup/index.json | jq .`);
    
  } catch (error) {
    console.error('\n❌ Export test failed:', error);
    process.exit(1);
  }
}

// Run test
testExport().then(() => {
  console.log('\n✓ Test script completed');
  process.exit(0);
}).catch((error) => {
  console.error('\n❌ Test script error:', error);
  process.exit(1);
});
