# MR4: Basic Import System (OPTIONAL)

**Status**: 🟡 Optional  
**Estimated Time**: 2-3 hours  
**Prerequisites**: [MR3: Export API & Admin UI](./MR3_EXPORT_API.md)  
**Next Step**: Manual Testing & Production Deployment

---

## 🎯 Decision: Skip Import System for Now

**Recommendation**: **Skip MR4** and proceed directly to manual testing and production deployment.

**Rationale**:
1. ✅ Export system is complete and working (MR1-MR3)
2. ✅ Backup tarballs are being created successfully
3. ✅ JSON format is validated and correct
4. ⏳ Import system is complex (6-8 hours for production-ready version)
5. 📊 Actual use cases will inform better design decisions

---

## Two Paths Forward

### Path A: Skip Import for Now (RECOMMENDED)

**What you have**: Complete export system that creates backup tarballs

**What you can do**:
- ✅ Create backups on production
- ✅ Download tarballs for archival
- ✅ Inspect JSON files manually
- ✅ Use PostgreSQL native tools (pg_dump/pg_restore) for actual restores
- ✅ Deploy export functionality to production

**Benefits**:
- Ship faster
- Learn actual import requirements from usage
- Build import system when needed with better understanding

### Path B: Build Basic Import (2-3 hours)

**If you choose to implement**, here's a minimal version:

---

## Minimal Implementation (If Needed)

### Goal
Simple proof-of-concept to validate export/import cycle.

**File**: `server/database/backup/import.ts`

```typescript
/**
 * Basic Import - Proof of Concept Only
 * 
 * Limitations:
 * - No late-seeding (xmlid references may break)
 * - No conflict resolution
 * - No validation
 * - Not production-ready
 */

import { db } from '../db-new';
import * as fs from 'fs/promises';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import type { BackupIndex, EntityBackup } from '../../types/backup-schema';

const execAsync = promisify(exec);

export async function importDatabase(tarballPath: string): Promise<void> {
  console.log(`\n=== Basic Import ===`);
  console.log(`Tarball: ${tarballPath}\n`);
  
  // Extract
  const tempDir = path.join(process.cwd(), 'temp_import', `import_${Date.now()}`);
  await fs.mkdir(tempDir, { recursive: true });
  await execAsync(`tar -xzf "${tarballPath}" -C "${tempDir}"`);
  
  try {
    // Read index
    const indexPath = path.join(tempDir, 'index.json');
    const backupIndex: BackupIndex = JSON.parse(
      await fs.readFile(indexPath, 'utf-8')
    );
    
    console.log(`Importing ${backupIndex.entities.length} tables...\n`);
    
    // Import each entity
    for (const entityName of backupIndex.entities) {
      const entityPath = path.join(tempDir, backupIndex.files[entityName]);
      const entityBackup: EntityBackup = JSON.parse(
        await fs.readFile(entityPath, 'utf-8')
      );
      
      await importTable(entityBackup, entityName);
    }
    
    console.log(`\n✅ Import complete`);
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}

async function importTable(entity: EntityBackup, tableName: string) {
  const { columns, rows } = entity;
  if (rows.length === 0) return;
  
  console.log(`Importing ${tableName}: ${rows.length} rows...`);
  
  const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
  const query = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`;
  
  let imported = 0;
  for (const row of rows) {
    try {
      await db.run(query, columns.map(col => row[col]));
      imported++;
    } catch (error: any) {
      if (error.code !== '23505') throw error; // Skip duplicates
    }
  }
  
  console.log(`  ✓ ${imported} rows`);
}
```

**Test**:
```bash
# Create test script
echo 'import { importDatabase } from "./import";
importDatabase("./backup/backup_demo-data.db_*.tar.gz");' > server/database/backup/test-import.ts

# Run
pnpm tsx server/database/backup/test-import.ts
```

---

## Complete Import System (Future - MRT)

For production-ready import, see [MRT: Testing & Integration](./MRT_TESTING.md), which includes:

- **Bash orchestration** with multiple modes
- **Late-seeding resolver** for xmlid/sysmail/domaincode references
- **Data packages** (datA-datG) for phased import
- **Validation suite** (40+ tests)
- **Multiple modes**: init, replace, update, append
- **Error handling** and recovery
- **Foreign key** resolution
- **Conflict resolution** strategies

**Estimated effort**: 6-8 hours

---

## Recommendation

**For now**: Skip MR4 and proceed to production deployment with export-only functionality.

**Later**: Build complete import system when:
1. You have actual master-slave sync requirements
2. You understand the specific use cases
3. You can dedicate 6-8 hours to do it properly

**Current value**: Export system alone provides:
- Database backups
- Data archival
- JSON inspection
- Manual data review
- Foundation for future import

---

## Next Steps

1. **Manual testing** of export functionality
2. **Production deployment** of export system
3. **Monitor usage** to understand import requirements
4. **Build import** when actually needed

✅ **Export system is complete and working - that's the valuable part!**
