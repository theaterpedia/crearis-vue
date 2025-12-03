# MR4 Import/Export System - Next Actions & Improvements

## Priority 1: Critical for Production (Do Before Large-Scale Use)

### 1. Add Authentication & Authorization
**Status**: ❌ Not Implemented  
**Risk**: HIGH - Anyone can export/import data

**Tasks**:
- [ ] Add admin authentication middleware to backup endpoints
- [ ] Check user role/permissions before allowing export
- [ ] Check user role/permissions before allowing import
- [ ] Add API key or JWT token requirement
- [ ] Log all export/import operations with user ID

**Implementation**:
```typescript
// server/middleware/admin-auth.ts
export default defineEventHandler((event) => {
  const path = event.node.req.url;
  if (path?.startsWith('/api/admin/backup')) {
    // Check authentication
    const session = await getSession(event);
    if (!session || !session.user.isAdmin) {
      throw createError({
        statusCode: 403,
        message: 'Admin access required'
      });
    }
  }
});
```

### 2. Validate Tarball Paths (Security)
**Status**: ❌ Not Implemented  
**Risk**: HIGH - Directory traversal attacks possible

**Tasks**:
- [ ] Whitelist backup directory
- [ ] Validate tarball paths before opening
- [ ] Reject paths with `..` or absolute paths outside backup dir
- [ ] Add file size limits to prevent DoS

**Implementation**:
```typescript
function validateTarballPath(tarballPath: string): boolean {
  const backupDir = path.join(process.cwd(), 'backup');
  const resolvedPath = path.resolve(tarballPath);
  
  // Must be within backup directory
  if (!resolvedPath.startsWith(backupDir)) {
    throw new Error('Invalid tarball path: must be in backup directory');
  }
  
  // Must be .tar.gz file
  if (!resolvedPath.endsWith('.tar.gz')) {
    throw new Error('Invalid file type: must be .tar.gz');
  }
  
  return true;
}
```

### 3. Add Transaction Wrapping (Data Integrity)
**Status**: ❌ Not Implemented  
**Risk**: MEDIUM - Partial failures leave DB inconsistent

**Tasks**:
- [ ] Wrap entire import in single transaction
- [ ] Rollback on any error
- [ ] Add savepoints between phases
- [ ] Option to continue on non-critical errors

**Implementation**:
```typescript
export async function importDatabase(tarballPath: string, mode: string) {
  try {
    await db.run('BEGIN');
    
    // Phase 0
    await db.run('SAVEPOINT phase0');
    await importPhase0();
    
    // Phase 1
    await db.run('SAVEPOINT phase1');
    await importPhase1();
    
    // Phase 2
    await db.run('SAVEPOINT phase2');
    await importPhase2();
    
    // Phase 3
    await db.run('SAVEPOINT phase3');
    await importPhase3();
    
    // Phase 4
    await db.run('SAVEPOINT phase4');
    await importPhase4();
    
    await db.run('COMMIT');
  } catch (error) {
    await db.run('ROLLBACK');
    throw error;
  }
}
```

## Priority 2: Important for Better UX (Do Soon)

### 4. Progress Reporting
**Status**: ❌ Not Implemented  
**Impact**: MEDIUM - Users don't know if import is frozen or progressing

**Tasks**:
- [ ] Add progress callbacks to import functions
- [ ] Implement WebSocket or SSE for real-time progress
- [ ] Update UI with progress bar
- [ ] Show current phase and table being imported
- [ ] Estimate time remaining

**Implementation**:
```typescript
// Server-side
export async function importDatabase(
  tarballPath: string,
  mode: string,
  onProgress?: (progress: ImportProgress) => void
) {
  onProgress?.({
    phase: 'Phase 0',
    table: 'tags',
    current: 2,
    total: 4,
    percentage: 50
  });
  // ...
}

// Client-side (Vue)
const importProgress = ref({ phase: '', table: '', percentage: 0 });

const ws = new WebSocket('ws://localhost:3000/api/admin/backup/import-progress');
ws.onmessage = (event) => {
  importProgress.value = JSON.parse(event.data);
};
```

### 5. Detail Table FK Resolution
**Status**: ⚠️ Partially Implemented (placeholder code)  
**Impact**: MEDIUM - Junction tables may fail on cross-database imports

**Tasks**:
- [ ] Implement FK resolution for `project_members` (user_id, project_id)
- [ ] Implement FK resolution for `event_instructors` (event_id, instructor_id)
- [ ] Implement FK resolution for `events_tags` (event_id, tag_id)
- [ ] Implement FK resolution for `posts_tags` (post_id, tag_id)
- [ ] Use mapping tables to resolve old IDs to new IDs

**Implementation**:
```typescript
async function importDetailTableWithMapping(detailTable, mode, mappings) {
  for (const row of detailTable.rows) {
    const resolvedRow = { ...row };
    
    // Resolve user_id via sysmail
    if (resolvedRow.user_id) {
      const user = await db.get(
        'SELECT id FROM users WHERE sysmail = (SELECT sysmail FROM users WHERE id = $1)',
        [resolvedRow.user_id]
      );
      resolvedRow.user_id = user?.id || null;
    }
    
    // Resolve project_id via domaincode
    if (resolvedRow.project_id) {
      const project = await db.get(
        'SELECT id FROM projects WHERE domaincode = (SELECT domaincode FROM projects WHERE id = $1)',
        [resolvedRow.project_id]
      );
      resolvedRow.project_id = project?.id || null;
    }
    
    // ... similar for event_id, instructor_id, etc.
  }
}
```

### 6. UI Enhancements
**Status**: ⚠️ Basic implementation exists  
**Impact**: MEDIUM - UX could be much better

**Tasks**:
- [ ] Add "Import (New Only)" button → calls import.post (skip mode)
- [ ] Add "Import (Merge Changes)" button → calls update-import.post (upsert mode)
- [ ] Add progress modal with phase/table info
- [ ] Add import history table (recent imports)
- [ ] Add "Download Backup" button to list existing tarballs
- [ ] Add backup file browser/manager

**UI Mockup**:
```vue
<template>
  <div class="backup-manager">
    <h2>Database Backup & Import</h2>
    
    <div class="export-section">
      <button @click="exportDatabase">Export Current Database</button>
      <p>Last export: {{ lastExportTime }}</p>
    </div>
    
    <div class="import-section">
      <h3>Import Options</h3>
      <input type="file" @change="selectBackupFile" />
      
      <div class="import-buttons">
        <button @click="importNew" :disabled="!selectedFile">
          Import New Records Only
          <small>Skips existing records</small>
        </button>
        
        <button @click="importMerge" :disabled="!selectedFile">
          Merge Changes
          <small>Updates existing + adds new</small>
        </button>
      </div>
    </div>
    
    <div class="backup-history">
      <h3>Available Backups</h3>
      <table>
        <tr v-for="backup in backups" :key="backup.filename">
          <td>{{ backup.filename }}</td>
          <td>{{ backup.size }}</td>
          <td>{{ backup.date }}</td>
          <td>
            <button @click="downloadBackup(backup)">Download</button>
            <button @click="importBackup(backup)">Import</button>
          </td>
        </tr>
      </table>
    </div>
  </div>
</template>
```

### 7. System Table Updates (pages, tasks)
**Status**: ❌ Not Implemented  
**Impact**: MEDIUM - Can't update existing pages/tasks during update-import

**Tasks**:
- [ ] Define unique identifiers for pages (e.g., project_id + page_type)
- [ ] Implement UPSERT logic for pages table
- [ ] Define unique identifiers for tasks
- [ ] Implement UPSERT logic for tasks table

**Challenge**: System tables don't have natural unique keys like xmlid/sysmail. Options:
1. Use composite keys (e.g., `project_id + page_type` for pages)
2. Export old ID and try to match by ID (risky across databases)
3. Use content-based hashing to detect duplicates

## Priority 3: Nice to Have (Future Enhancements)

### 8. Batch Inserts for Performance
**Status**: ❌ Not Implemented  
**Impact**: LOW - Current performance acceptable for <1000 records

**Tasks**:
- [ ] Replace row-by-row INSERT with multi-row INSERT
- [ ] Batch size configurable (default 100 rows)
- [ ] Fall back to single-row on batch error

**Implementation**:
```typescript
// Instead of:
for (const row of rows) {
  await db.run('INSERT INTO ...', [row.col1, row.col2]);
}

// Use:
const batchSize = 100;
for (let i = 0; i < rows.length; i += batchSize) {
  const batch = rows.slice(i, i + batchSize);
  const placeholders = batch.map((_, idx) => 
    `($${idx * 3 + 1}, $${idx * 3 + 2}, $${idx * 3 + 3})`
  ).join(', ');
  const values = batch.flatMap(row => [row.col1, row.col2, row.col3]);
  await db.run(`INSERT INTO table VALUES ${placeholders}`, values);
}
```

### 9. Selective Table Import
**Status**: ❌ Not Implemented  
**Impact**: LOW - Nice for testing/debugging

**Tasks**:
- [ ] Add option to import only specific tables
- [ ] Add option to exclude specific tables
- [ ] Validate dependencies (can't import events without images)

**Usage**:
```bash
# Import only users and projects
pnpm tsx server/database/backup/test-import.ts backup.tar.gz --tables=users,projects

# Import all except images
pnpm tsx server/database/backup/test-import.ts backup.tar.gz --exclude=images
```

### 10. Differential Backups
**Status**: ❌ Not Implemented  
**Impact**: LOW - Full backups sufficient for current scale

**Tasks**:
- [ ] Track last export timestamp per table
- [ ] Export only records modified since last export
- [ ] Implement incremental import (merge with existing)

### 11. Backup Encryption
**Status**: ❌ Not Implemented  
**Impact**: LOW - Backups may contain sensitive user data

**Tasks**:
- [ ] Encrypt tarball with AES-256
- [ ] Store encryption key securely (env variable)
- [ ] Add decryption step before import

**Implementation**:
```bash
# After creating tarball
openssl enc -aes-256-cbc -salt -in backup.tar.gz -out backup.tar.gz.enc -pass env:BACKUP_KEY

# Before import
openssl enc -aes-256-cbc -d -in backup.tar.gz.enc -out backup.tar.gz -pass env:BACKUP_KEY
```

### 12. Import Dry-Run Mode
**Status**: ❌ Not Implemented  
**Impact**: LOW - Nice for validation before actual import

**Tasks**:
- [ ] Add `--dry-run` flag to CLI
- [ ] Validate backup without writing to database
- [ ] Report what would be inserted/updated/skipped
- [ ] Check for potential errors

**Usage**:
```bash
pnpm tsx server/database/backup/test-import.ts backup.tar.gz --dry-run
# Output:
# Would insert: 50 users, 20 projects, 100 images
# Would update: 10 users, 5 projects
# Would skip: 5 users (already exist)
# Potential errors: None
```

### 13. Export Filters
**Status**: ❌ Not Implemented  
**Impact**: LOW - Useful for partial exports

**Tasks**:
- [ ] Export only specific projects and their related data
- [ ] Export only specific date ranges
- [ ] Export only specific users and their content

**Usage**:
```bash
# Export only project "theater-alpha" and related data
pnpm tsx server/database/backup/export.ts --project=theater-alpha

# Export only data from last 30 days
pnpm tsx server/database/backup/export.ts --since=30d
```

### 14. Import Conflict Resolution UI
**Status**: ❌ Not Implemented  
**Impact**: LOW - Advanced feature for complex merges

**Tasks**:
- [ ] Detect conflicts (same record modified in both DBs)
- [ ] Show conflict resolution UI
- [ ] Let user choose: keep production, use dev, merge manually

### 15. Automated Testing
**Status**: ❌ Not Implemented  
**Impact**: LOW - Current manual testing sufficient

**Tasks**:
- [ ] Write unit tests for export functions
- [ ] Write unit tests for import functions
- [ ] Write integration tests for full export→import cycle
- [ ] Add CI/CD pipeline to run tests

**Test Cases**:
```typescript
describe('Import System', () => {
  it('should import all entity tables', async () => {
    const result = await importDatabase('test-backup.tar.gz', 'skip');
    expect(result.stats.users.imported).toBe(23);
    expect(result.stats.projects.imported).toBe(18);
  });
  
  it('should resolve circular dependencies', async () => {
    const result = await importDatabase('test-backup.tar.gz', 'skip');
    const users = await db.all('SELECT * FROM users WHERE instructor_id IS NOT NULL');
    expect(users.length).toBeGreaterThan(0);
    expect(users[0].instructor_id).not.toBe(setupInstructorId);
  });
  
  it('should handle update-import correctly', async () => {
    // Initial import
    await importDatabase('test-backup-v1.tar.gz', 'skip');
    const usersBefore = await db.all('SELECT * FROM users');
    
    // Update import
    await updateImportDatabase('test-backup-v2.tar.gz');
    const usersAfter = await db.all('SELECT * FROM users');
    
    expect(usersAfter.length).toBeGreaterThanOrEqual(usersBefore.length);
  });
});
```

## Priority 4: Technical Debt & Code Quality

### 16. TypeScript Improvements
**Status**: ⚠️ Some types defined, many `any` types remain  
**Impact**: LOW - Code works but could be more maintainable

**Tasks**:
- [ ] Replace `any` types with proper interfaces
- [ ] Add strict null checks
- [ ] Add return type annotations to all functions
- [ ] Use discriminated unions for import modes

### 17. Error Messages Improvement
**Status**: ⚠️ Basic error messages exist  
**Impact**: LOW - Debugging could be easier

**Tasks**:
- [ ] Add error codes to all error types
- [ ] Include context in error messages (which row, which table)
- [ ] Add suggestions for common errors
- [ ] Create error message catalog

**Example**:
```typescript
// Instead of:
throw new Error('Failed to import row');

// Use:
throw new ImportError({
  code: 'E_FK_VIOLATION',
  message: 'Foreign key constraint violation',
  table: 'project_members',
  row: row,
  constraint: 'project_members_user_id_fkey',
  suggestion: 'Ensure user with this ID exists in users table'
});
```

### 18. Refactor Duplicate Code
**Status**: ⚠️ Some duplication between import.ts and update-import.ts  
**Impact**: LOW - Maintenance burden

**Tasks**:
- [ ] Extract common import logic to shared functions
- [ ] DRY up entity import logic
- [ ] Share late-seeding logic between both import modes

### 19. Documentation Improvements
**Status**: ✅ Comprehensive docs exist  
**Impact**: LOW - Docs are good, could add more examples

**Tasks**:
- [ ] Add video walkthrough
- [ ] Add troubleshooting decision tree
- [ ] Add architecture diagrams
- [ ] Add API documentation (OpenAPI/Swagger)

## Implementation Roadmap

### Week 1: Security & Stability (Priority 1)
- Day 1: Authentication & authorization
- Day 2: Path validation & security hardening
- Day 3: Transaction wrapping & rollback
- Day 4: Testing & bug fixes
- Day 5: Deploy to staging, validate

### Week 2: User Experience (Priority 2)
- Day 1-2: Progress reporting implementation
- Day 3: Detail table FK resolution
- Day 4-5: UI enhancements (buttons, progress bars, history)

### Week 3: Polish & Performance (Priority 3)
- Day 1: Batch inserts
- Day 2: Selective table import
- Day 3: Import dry-run mode
- Day 4-5: Testing, documentation updates

### Week 4: Advanced Features (Priority 3 & 4)
- Day 1: Differential backups
- Day 2: Backup encryption
- Day 3: Automated testing
- Day 4-5: Code quality improvements

## Success Metrics

### Current Status
- ✅ 100% entity table import success
- ✅ Circular dependency resolution working
- ✅ Computed columns handled correctly
- ✅ Late-seeding resolution working
- ⚠️ Junction tables 85% success (2 failures due to test data)

### Target Metrics
- 100% import success rate on clean database
- < 5 second import time for 200 records
- < 30 second import time for 2000 records
- 0 security vulnerabilities
- 100% code coverage for critical paths
- < 1% false positive error rate

## Risk Assessment

### High Risk
1. **No authentication** - Anyone can export/import
2. **No path validation** - Directory traversal possible
3. **No transaction** - Partial failures leave DB inconsistent

### Medium Risk
1. **Detail table FK resolution incomplete** - May fail on cross-DB imports
2. **No progress reporting** - Users may think app is frozen
3. **System table updates not implemented** - Can't update pages/tasks

### Low Risk
1. **Performance** - Linear scaling acceptable for current use
2. **Error messages** - Adequate for debugging
3. **Code quality** - Maintainable but could be better

---

**Prepared by**: AI Assistant  
**Date**: 2025-11-09  
**For**: Crearis MR4 Import/Export System  
**Next Review**: 2025-11-16
