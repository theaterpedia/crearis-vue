# Column Rename Refactoring Plan: `*_val` → Non-suffixed Columns

**Date:** 2025-11-26  
**Migration:** 035_rename_val_columns  
**Status:** Planning Phase  
**Reason:** Eliminate confusion between `ctags` vs `ctags_val`, align all entity tables to consistent naming

---

## Current Migration State

**Last migration run:** `031_add_local_adapter`  
**Migrations 032-034:** Not present (were rolled back)

**Current database schema:**
- **images**: Has BOTH `ctags`/`rtags` (from 019) AND `*_val` columns (from 025)
  - Active data: 63/67 images use `ctags`, 0 use `*_val`
  - Database triggers use `ctags` for computed fields
- **posts/events/projects/participants/instructors**: Only have `*_val` columns
- **users/tasks/interactions**: Only have `rtags_val` (partial entities)

---

## Refactoring Strategy

### Phase 1: Database Migration (035_rename_val_columns.ts)

**For images table:**
```sql
-- Drop unused *_val duplicates
ALTER TABLE images DROP COLUMN IF EXISTS ctags_val;
ALTER TABLE images DROP COLUMN IF EXISTS rtags_val;
-- Rename remaining columns
ALTER TABLE images RENAME COLUMN ttags_val TO ttags;
ALTER TABLE images RENAME COLUMN dtags_val TO dtags;
-- Drop old indexes
DROP INDEX IF EXISTS idx_images_ctags_val;
```

**For full entity tables (posts, events, projects, participants, instructors):**
```sql
ALTER TABLE {table} RENAME COLUMN status_val TO status;
ALTER TABLE {table} RENAME COLUMN config_val TO config;
ALTER TABLE {table} RENAME COLUMN ctags_val TO ctags;
ALTER TABLE {table} RENAME COLUMN rtags_val TO rtags;
ALTER TABLE {table} RENAME COLUMN ttags_val TO ttags;
ALTER TABLE {table} RENAME COLUMN dtags_val TO dtags;

-- Rename indexes
DROP INDEX IF EXISTS idx_{table}_ctags_val;
CREATE INDEX IF NOT EXISTS idx_{table}_ctags ON {table} USING hash(ctags);
-- Repeat for rtags, ttags, dtags
```

**For partial entity tables (users, tasks, interactions):**
```sql
ALTER TABLE {table} RENAME COLUMN status_val TO status;
ALTER TABLE {table} RENAME COLUMN config_val TO config;
ALTER TABLE {table} RENAME COLUMN rtags_val TO rtags;

-- Rename indexes
DROP INDEX IF EXISTS idx_{table}_rtags_val;
CREATE INDEX IF NOT EXISTS idx_{table}_rtags ON {table} USING hash(rtags);
```

**Update helper functions:**
```sql
-- Update get_status_name() to use 'status' instead of 'status_val'
-- Update any other functions referencing *_val columns
```

---

## Phase 2: Server-Side Code Updates

### A. API Endpoints (6 files)

**1. `server/api/sysreg/[id].delete.ts` (Lines 45-48)**
- Change: `rtags_val` → `rtags`
- Change: `ctags_val` → `ctags`
- Change: `ttags_val` → `ttags`
- Change: `dtags_val` → `dtags`
- Change: `status_val` → `status` (in status check)

**2. `server/api/demo/posts/[id].put.ts` (Lines 26, 39)**
- Change: `status_val = ?` → `status = ?`
- Update all references in query

**3. `server/api/tasks/[id].put.ts` (Lines 127-129)**
- Change: `updateData.status_val` → `updateData.status`
- Change: `'status_val = ?'` → `'status = ?'`

**4. `server/api/tasks/index.post.ts` (Lines 108, 128, 149, 173, 176)**
- Change: `status_val` → `status` throughout

**5. `server/api/auth/login/admin.get.ts` (Lines 28, 31, 41, 46, 49)**
- Change: `status_val` → `status` in SELECT and UPDATE queries

**6. `server/api/auth/login.post.ts` (Lines 61, 64, 84, 89, 93)**
- Change: `status_val` → `status` in SELECT and UPDATE queries

### B. Database Migration Files (Update rollback logic)

**`server/database/migrations/025_align_entity_tables.ts`**
- Update `down()` function (Lines 222-235)
- Change column names in DROP statements

**`server/database/migrations/030_drop_legacy_status_columns.ts`**
- Update function names and references
- Change `status_val` → `status` in all helper functions

---

## Phase 3: Frontend Composables Updates

### A. Type Definitions & Interfaces

**1. `src/composables/useEventTemplates.ts` (Lines 27-32)**
```typescript
export interface Event {
    id?: number
    name: string
    status: string | null          // Was: status_val
    config: string | null           // Was: config_val
    rtags: string | null            // Was: rtags_val
    ctags: string | null            // Was: ctags_val
    ttags: string | null            // Was: ttags_val
    dtags: string | null            // Was: dtags_val
    // ... rest unchanged
}
```

### B. Analytics & Operations

**2. `src/composables/useSysregAnalytics.ts`**
- Lines 112, 131-132, 159-160, 187-188, 246-247, 256-257
- Change: `e.status_val` → `e.status`
- Change: `e.ttags_val` → `e.ttags`
- Change: `e.dtags_val` → `e.dtags`
- Change: `e.rtags_val` → `e.rtags`

**3. `src/composables/useSysregBatchOperations.ts`**
- No direct column references (uses API endpoints)
- Verify after API updates

**4. `src/composables/useProjectStatus.ts`**
- Check for `status_val` references
- Update if present

### C. Utility Composables

**5. `src/composables/useSysregStatus.ts`**
- Update function parameter names
- Change default `fieldName = 'status_val'` → `fieldName = 'status'`
- Update all internal references

**6. `src/composables/useSysreg.ts`**
- Verify no hardcoded column name references
- Should work via abstraction layer

**7. `src/composables/useSysregTags.ts`**
- No changes needed (works with hex values)

**8. `src/composables/useSysregOptions.ts`**
- No changes needed (works via API)

**9. `src/composables/useSysregSuggestions.ts`**
- Update interface references:
  - `project: { ttags_val?: string; dtags_val?: string }`
  - → `project: { ttags?: string; dtags?: string }`
- Update `currentTags` parameter references

---

## Phase 4: Component Updates

### Sysreg Components (Verify, likely no changes needed)

**1. `src/components/sysreg/StatusBadge.vue`**
- ✓ Already uses `status` prop (not `status_val`)
- No changes needed

**2. `src/components/sysreg/ImageStatusControls.vue`**
- Check Line 169: `props.image.status_val` → `props.image.status`
- Check Line 175: `props.image.config_val` → `props.image.config`

**3. `src/components/sysreg/SysregSelect.vue`**
- ✓ Works via options API, no direct column references

**4. `src/components/sysreg/SysregMultiToggle.vue`**
- ✓ Works with hex values, no column references

**5. `src/components/sysreg/SysregBitGroupSelect.vue`**
- ✓ No column references

**6. `src/components/sysreg/FilterChip.vue`**
- ✓ No column references

**7. `src/components/sysreg/SysregFilterSet.vue`**
- ✓ Works via composable API

**8. `src/components/sysreg/SysregTagDisplay.vue`**
- ✓ No direct column references

### Admin Views

**9. `src/views/admin/SysregAdminView.vue`**
- ✓ Uses composables only, no direct column references
- No changes needed

**10. `src/views/admin/SysregDemo.vue`**
- ✓ Uses composables only
- No changes needed

---

## Phase 5: Documentation Updates

**Files to update:**
1. `docs/SYSREG_SYSTEM.md` - Update all column references
2. `docs/SYSREG_TESTING_STRATEGY.md` - Update test examples
3. `docs/SYSREG_USECASE_DESIGN.md` - Update code examples
4. `docs/IMAGE_LIST_GALLERY_GUIDE.md` - Update if references columns
5. `docs/IMAGE_QUICK_START.md` - Update if references columns
6. Any other docs with `*_val` references

---

## Phase 6: Testing Strategy

### Pre-Migration Validation
```bash
# 1. Backup database
pg_dump crearis_admin_dev > backup_before_035.sql

# 2. Count current data
SELECT 
  COUNT(*) FILTER (WHERE ctags != '\\x00') as ctags_count,
  COUNT(*) FILTER (WHERE ctags_val IS NOT NULL) as ctags_val_count
FROM images;

# 3. Verify no active *_val usage in images
SELECT id, name, ctags_val, rtags_val, ttags_val, dtags_val 
FROM images 
WHERE ctags_val IS NOT NULL 
   OR rtags_val IS NOT NULL 
   OR ttags_val IS NOT NULL 
   OR dtags_val IS NOT NULL;
```

### Post-Migration Validation
```bash
# 1. Verify column renames
\d images
\d posts
\d events

# 2. Verify indexes renamed
\di idx_images_ctags
\di idx_posts_ctags

# 3. Verify data integrity
SELECT COUNT(*) FROM images WHERE ctags IS NOT NULL;
SELECT COUNT(*) FROM posts WHERE status IS NOT NULL;

# 4. Test API endpoints
curl http://localhost:3000/api/images?project_id=1
curl http://localhost:3000/api/sysreg

# 5. Test SysregAdminView
# Open browser: http://localhost:3000/admin/sysreg
# Verify all tabs work correctly
```

### Component Validation Checklist

**Must test manually:**
- [ ] SysregAdminView - Tag Viewer tab
- [ ] SysregAdminView - Create Tags tab
- [ ] SysregAdminView - Analytics tab
- [ ] SysregAdminView - Batch Operations tab
- [ ] SysregDemo - All demos work
- [ ] ImageStatusControls - Status transitions
- [ ] StatusBadge - Displays correct labels
- [ ] SysregSelect - Loads options
- [ ] SysregMultiToggle - Tag selection
- [ ] SysregFilterSet - Filter operations

---

## Phase 7: Second Installation Deployment

**After testing on crearis_admin_dev:**

```bash
# 1. Create migration package
tar -czf migration_035_package.tar.gz \
  server/database/migrations/035_rename_val_columns.ts \
  COLUMN_RENAME_REFACTORING_PLAN.md

# 2. Deploy to second installation
scp migration_035_package.tar.gz user@server2:/path/to/crearis-vue/

# 3. On second server
cd /path/to/crearis-vue
tar -xzf migration_035_package.tar.gz

# 4. Backup database
pg_dump crearis_admin_production > backup_before_035_$(date +%Y%m%d_%H%M%S).sql

# 5. Run migration
SKIP_MIGRATIONS=false npm run dev
# Or: node server/database/migrations/run.ts

# 6. Verify migration success
psql -d crearis_admin_production -c "SELECT config->'migrations_run' FROM crearis_config;"

# 7. Restart application
pm2 restart crearis-vue
```

---

## Implementation Order

### Day 1: Database & Core API
1. ✅ Create migration file `035_rename_val_columns.ts`
2. ✅ Test migration on dev database
3. ✅ Update core API endpoints (sysreg, tasks, auth)
4. ✅ Test endpoints with Postman/curl

### Day 2: Frontend Composables
5. ✅ Update type interfaces (useEventTemplates, etc.)
6. ✅ Update useSysregAnalytics
7. ✅ Update useSysregStatus
8. ✅ Update useSysregSuggestions
9. ✅ Test composables in isolation

### Day 3: Components & Views
10. ✅ Update ImageStatusControls
11. ✅ Verify all sysreg components
12. ✅ Test SysregAdminView (all tabs)
13. ✅ Test SysregDemo

### Day 4: Documentation & Second Installation
14. ✅ Update all documentation files
15. ✅ Full integration testing
16. ✅ Deploy to second installation
17. ✅ Final validation

---

## Rollback Plan

**If migration fails:**

```sql
-- Rollback migration 035
BEGIN;

-- Rename back to *_val for full entities
ALTER TABLE posts RENAME COLUMN status TO status_val;
ALTER TABLE posts RENAME COLUMN config TO config_val;
ALTER TABLE posts RENAME COLUMN ctags TO ctags_val;
ALTER TABLE posts RENAME COLUMN rtags TO rtags_val;
ALTER TABLE posts RENAME COLUMN ttags TO ttags_val;
ALTER TABLE posts RENAME COLUMN dtags TO dtags_val;
-- Repeat for: events, projects, participants, instructors

-- For images: restore *_val columns
ALTER TABLE images ADD COLUMN ctags_val BYTEA DEFAULT NULL;
ALTER TABLE images ADD COLUMN rtags_val BYTEA DEFAULT NULL;
ALTER TABLE images RENAME COLUMN ttags TO ttags_val;
ALTER TABLE images RENAME COLUMN dtags TO dtags_val;

-- Restore indexes
CREATE INDEX idx_images_ctags_val ON images USING hash(ctags_val);
-- etc.

-- Update crearis_config to remove migration 035
UPDATE crearis_config 
SET config = jsonb_set(
  config,
  '{migrations_run}',
  (config->'migrations_run')::jsonb - '035_rename_val_columns'
);

COMMIT;
```

**Then restore code from git:**
```bash
git checkout HEAD -- server/api/
git checkout HEAD -- src/composables/
git checkout HEAD -- src/components/sysreg/
```

---

## Risk Assessment

**Low Risk:**
- Database column renames (atomic operations)
- Composable updates (type-safe)
- Component props (Vue will warn about type mismatches)

**Medium Risk:**
- API endpoint changes (need thorough testing)
- Batch operations (test with small datasets first)

**High Risk:**
- None identified (migrations are reversible, code is in git)

**Mitigation:**
- Full database backup before migration
- Test on dev database first
- Staged rollout (dev → staging → production)
- Keep rollback script ready

---

## Success Criteria

✅ **Migration successful:**
- All tables have non-suffixed columns
- No `*_val` columns remain
- All indexes renamed correctly
- Migration registered in crearis_config

✅ **API endpoints working:**
- All CRUD operations functional
- Sysreg API returns correct data
- Batch operations complete successfully

✅ **Frontend functional:**
- SysregAdminView fully operational
- All components render correctly
- No console errors
- Status badges show correct labels

✅ **Data integrity:**
- No data loss
- All relationships intact
- Computed fields work correctly

✅ **Second installation:**
- Migration runs without errors
- Application starts successfully
- All features functional

---

## Notes

**Why this approach:**
- Images table already has production data in `ctags`/`rtags`
- Simpler naming reduces cognitive load
- Eliminates future code-automation confusion
- Better alignment with frontend patterns
- Consistent across all entity tables

**Breaking changes:**
- External API consumers will need to update field names
- Any raw SQL queries in scripts will need updates
- Database backup/restore scripts may need adjustments

**Future considerations:**
- Consider adding database views with old column names for backward compatibility
- Update API documentation to reflect new schema
- Add deprecation warnings if supporting both names temporarily
