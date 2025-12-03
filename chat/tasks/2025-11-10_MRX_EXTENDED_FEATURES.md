# MRX: Extended Features

**Status**: 🔵 Future Work  
**Estimated Time**: TBD  
**Prerequisites**: [MRT: Testing & Integration](./MRT_TESTING.md)  
**Priority**: Low (post-launch enhancements)

---

## 🎯 Overview

This document outlines future enhancements and extended features for the migration refactor system. These are **not required** for initial deployment but would improve functionality, flexibility, and maintainability.

---

## 📋 Planned Features

### 1. Update Mode (Merge Changes)

**Priority**: Medium  
**Effort**: 2-3 hours

**Goal**: Import only changed records, merging with existing data instead of full replacement.

**Implementation**:

```typescript
// datB_base.ts - Update mode logic
if (mode === 'update') {
  // Compare with existing record
  const existing = await db.get(
    `SELECT * FROM ${table} WHERE xmlid = $1`,
    [xmlid]
  )
  
  if (!existing) {
    // New record - INSERT
    await db.run(insertQuery, values)
  } else {
    // Existing record - compare timestamps
    if (record.updated_at > existing.updated_at) {
      // Source is newer - UPDATE
      await db.run(updateQuery, values)
    } else {
      // Skip (destination is newer or same)
      skipped++
    }
  }
}
```

**Benefits**:
- Preserves local changes
- Faster sync (fewer writes)
- Conflict detection

**Challenges**:
- Timestamp comparison complexity
- Conflict resolution strategy
- Field-level vs record-level merge

---

### 2. Append Mode (Add New Records Only)

**Priority**: Low  
**Effort**: 1-2 hours

**Goal**: Import only records that don't exist in destination.

**Implementation**:

```typescript
// datB_base.ts - Append mode logic
if (mode === 'append') {
  // Check if record exists
  const existing = await db.get(
    `SELECT 1 FROM ${table} WHERE xmlid = $1`,
    [xmlid]
  )
  
  if (!existing) {
    // New record - INSERT
    await db.run(insertQuery, values)
    inserted++
  } else {
    // Record exists - skip
    skipped++
  }
}
```

**Benefits**:
- Safe for adding new data
- No overwrites
- Simple logic

**Use Cases**:
- Demo data seeding
- Test data generation
- Incremental backups

---

### 3. Migration 021 Refactoring

**Priority**: High  
**Effort**: 2-3 hours

**Goal**: Separate schema changes from data seeding in migration 021.

**Current Issue**:
- Migration 021 mixes schema (triggers, computed fields) with data (tags, status)
- Violates separation of concerns
- Makes migrations harder to maintain

**Proposed Split**:

**021_add_computed_fields.ts** (Schema):
```typescript
export const migration = {
  async up(db: DatabaseAdapter) {
    // Add computed columns
    // Add triggers
    // Add constraints
  }
}
```

**datA_config.ts** (Data):
```typescript
async function seedSystemData(db: DatabaseAdapter) {
  // Seed tags
  // Seed status
  // Seed config
}
```

**Benefits**:
- Cleaner migration history
- Easier to understand
- Better separation of concerns
- Easier to test

---

### 4. Incremental Sync Optimization

**Priority**: Medium  
**Effort**: 3-4 hours

**Goal**: Export/import only changed records since last sync.

**Implementation**:

**Track sync state**:
```typescript
// Add to crearis_config
interface SyncState {
  last_export_at: string
  last_import_at: string
  last_sync_id: string
}
```

**Export only changed records**:
```typescript
export async function exportChangedRecords(
  db: DatabaseAdapter,
  since: string
): Promise<EntityBackup> {
  const records = await db.all(`
    SELECT * FROM ${table}
    WHERE updated_at > $1
  `, [since])
  
  // ... rest of export logic
}
```

**Benefits**:
- Smaller backup files
- Faster sync
- Bandwidth savings
- Better for frequent syncs

**Challenges**:
- Tracking deletions
- Initial vs incremental sync
- Conflict resolution

---

### 5. Cross-Database Adapter Support

**Priority**: Low  
**Effort**: 4-6 hours

**Goal**: Support export/import between different database systems (PostgreSQL ↔ SQLite).

**Implementation**:

```typescript
// Abstract adapter interface
interface BackupAdapter {
  exportTable(table: string): Promise<EntityBackup>
  importTable(backup: EntityBackup): Promise<void>
  getDialect(): 'postgres' | 'sqlite' | 'mysql'
}

// PostgreSQL adapter
class PostgresBackupAdapter implements BackupAdapter {
  // PostgreSQL-specific export/import
}

// SQLite adapter
class SqliteBackupAdapter implements BackupAdapter {
  // SQLite-specific export/import
}
```

**Benefits**:
- Development with SQLite, production with PostgreSQL
- Database migration flexibility
- Testing simplification

**Challenges**:
- SQL dialect differences
- Type mapping
- Feature parity (triggers, computed columns)

---

### 6. Selective Table Export

**Priority**: Medium  
**Effort**: 1-2 hours

**Goal**: Export only specific tables instead of all tables.

**Implementation**:

```typescript
// API endpoint with table selection
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { tables } = body  // ['events', 'posts']
  
  const index = await exportSelectedTables(db, dataPath, tables)
  // ...
})
```

**UI Addition**:
```vue
<select v-model="selectedTables" multiple>
  <option value="events">Events</option>
  <option value="posts">Posts</option>
  <option value="participants">Participants</option>
  <!-- etc -->
</select>
```

**Benefits**:
- Smaller backups
- Faster export
- Partial data sync

---

### 7. Backup Compression Options

**Priority**: Low  
**Effort**: 1 hour

**Goal**: Support multiple compression formats (gzip, bzip2, xz).

**Implementation**:

```bash
# scripts/data-sync.sh - compression option
COMPRESSION="${3:-gz}"  # gz | bz2 | xz

case "$COMPRESSION" in
  gz)
    tar -czf "$TARFILE" ...
    ;;
  bz2)
    tar -cjf "$TARFILE" ...
    ;;
  xz)
    tar -cJf "$TARFILE" ...
    ;;
esac
```

**Comparison**:
| Format | Speed | Compression | Typical Size |
|--------|-------|-------------|--------------|
| gzip   | Fast  | Good        | 100% (base)  |
| bzip2  | Medium| Better      | 75%          |
| xz     | Slow  | Best        | 60%          |

---

### 8. Backup Versioning & Rotation

**Priority**: Medium  
**Effort**: 2 hours

**Goal**: Automatic cleanup of old backups, keep last N versions.

**Implementation**:

```typescript
// server/database/backup/rotation.ts
export async function rotateBackups(
  syncDir: string,
  keepCount: number = 10
) {
  const backups = fs.readdirSync(syncDir)
    .filter(f => f.endsWith('.backup.tar.gz'))
    .sort()
    .reverse()
  
  const toDelete = backups.slice(keepCount)
  
  for (const file of toDelete) {
    fs.unlinkSync(path.join(syncDir, file))
    console.log(`Deleted old backup: ${file}`)
  }
}
```

**Configuration**:
```env
BACKUP_KEEP_COUNT=10
BACKUP_MAX_AGE_DAYS=30
```

---

### 9. Diff Preview Before Import

**Priority**: Medium  
**Effort**: 3-4 hours

**Goal**: Show what will change before running import.

**Implementation**:

```bash
# Add --dry-run flag
bash scripts/data-sync.sh replace --dry-run

# Output:
# Changes preview:
#   events: 5 new, 12 updated, 2 deleted
#   posts: 8 new, 3 updated, 0 deleted
#   Total changes: 30 records
```

**Benefits**:
- Safety check
- Change visibility
- Confidence before import

---

### 10. Webhook Notifications

**Priority**: Low  
**Effort**: 1-2 hours

**Goal**: Send notifications on export/import completion.

**Implementation**:

```typescript
// server/database/backup/webhooks.ts
export async function notifyBackupComplete(
  webhookUrl: string,
  backup: BackupIndex
) {
  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event: 'backup.complete',
      timestamp: backup.created_at,
      tables: backup.tables,
      records: backup.metadata.total_records
    })
  })
}
```

**Configuration**:
```env
BACKUP_WEBHOOK_URL=https://hooks.slack.com/services/...
IMPORT_WEBHOOK_URL=https://hooks.slack.com/services/...
```

---

## 🎯 Prioritization Matrix

| Feature | Priority | Effort | Impact | Status |
|---------|----------|--------|--------|--------|
| Migration 021 Refactor | High | 2-3h | High | Planned |
| Update Mode | Medium | 2-3h | Medium | Planned |
| Incremental Sync | Medium | 3-4h | Medium | Future |
| Selective Table Export | Medium | 1-2h | Medium | Future |
| Backup Rotation | Medium | 2h | Low | Future |
| Diff Preview | Medium | 3-4h | Medium | Future |
| Append Mode | Low | 1-2h | Low | Future |
| Cross-DB Support | Low | 4-6h | Medium | Future |
| Compression Options | Low | 1h | Low | Future |
| Webhook Notifications | Low | 1-2h | Low | Future |

---

## 🚀 Implementation Roadmap

### Phase 1: Core Improvements (Post-Launch)
- Migration 021 refactoring
- Update mode implementation
- Backup rotation

### Phase 2: Sync Enhancements (Q1 2026)
- Incremental sync optimization
- Selective table export
- Diff preview

### Phase 3: Advanced Features (Q2 2026)
- Cross-database adapter support
- Append mode
- Webhook notifications

---

## 📝 Notes

**Decision Criteria**:
- Implement features when needed, not before
- Prioritize based on actual usage patterns
- Keep system simple and maintainable
- Avoid over-engineering

**Breaking Changes**:
- Any changes to JSON schema should increment version
- Maintain backward compatibility where possible
- Document migration paths for breaking changes

---

## 🔗 Related Files

- [Master Plan](./2025-11-09_MIGRATION_REFACTOR_PLAN.md)
- [Previous: MRT Testing](./MRT_TESTING.md)

---

**Last Updated**: November 9, 2025  
**Status**: Planning / Future Work
