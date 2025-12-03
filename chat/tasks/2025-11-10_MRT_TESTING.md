# MRT: Testing & Future Features

**Status**: 🔴 Not Started  
**Estimated Time**: 6-8 hours (when needed)  
**Prerequisites**: Export system deployed and validated in production  
**Next Step**: Implement when master-slave sync is required

---

## 🎯 Objective

**Complete production-grade import system** with bash orchestration, late-seeding resolver, comprehensive validation, and end-to-end testing.

**Note**: This phase is **DEFERRED** until export system is validated in production and actual import requirements are understood.

---

## 📦 Deferred Features from MR4 & MR5

### Production Import System

Features moved from simplified MR4 to this phase:

1. **Bash Orchestration Script** (`scripts/data-sync.sh`)
   - Multiple modes: init, replace, update, append
   - Error handling and recovery
   - Transaction management
   - Backup before import
   - Rollback on failure

2. **Data Packages** (datA-datG)
   - `datA_config.ts` - Setup dummy records for late-seeding
   - `datB_base.ts` - Import base entity tables (users, tags, projects)
   - `datC_parts.ts` - Import component tables (images, pages)
   - `datD_entities.ts` - Import main entities (events, posts)
   - `datE_participants.ts` - Import participant relationships
   - `datF_assignments.ts` - Resolve all late-seed references (xmlid → id)
   - `datG_propagation.ts` - Import detail tables with resolved FK references

3. **Late-Seeding Resolver**
   - Tracks xmlid → id mappings
   - Resolves cross-table references
   - Handles sysmail (users) and domaincode (projects) special cases
   - Batch UPDATE for performance

4. **Validation Suite** (`datH_validation.ts`)
   - 40+ automated tests:
     - Table existence checks
     - Record count validation
     - Foreign key integrity
     - xmlid uniqueness
     - No orphaned records
     - Detail table completeness
     - Late-seed resolution verification
   - Automated pass/fail reporting

5. **Import Modes**:
   - **init**: Fresh database, create setup dummies, resolve references
   - **replace**: Update existing records by xmlid
   - **update**: Merge changes (update existing, insert new)
   - **append**: Add new records only

---

## 📋 Test Scenarios (When Implementing)

---

## 📋 Test Scenarios

### Scenario 1: Fresh Database Init (30 min)

**Goal**: Test complete init mode workflow on empty database.

**Steps**:

1. **Setup**:
   ```bash
   # Drop and recreate database
   pnpm db:drop
   pnpm db:migrate
   ```

2. **Prepare backup**:
   ```bash
   # Assume backup exists from production/master
   ls -lh data/sync/*.backup.tar.gz
   ```

3. **Run init import**:
   ```bash
   bash scripts/data-sync.sh init
   ```

4. **Validate**:
   ```bash
   pnpm tsx server/database/data-packages/datH_validation.ts
   ```

**Expected Results**:
- ✅ Setup dummies created in datA_config
- ✅ Entity records imported with late-seed columns set to 'setup'
- ✅ datF_assignments resolved all 'setup' references
- ✅ Detail tables imported with parent references
- ✅ No 'setup' dummy records remain
- ✅ All 40 validation tests pass
- ✅ Foreign keys valid
- ✅ xmlid uniqueness maintained

---

### Scenario 2: Update Existing Data (30 min)

**Goal**: Test replace mode on database with existing data.

**Steps**:

1. **Setup** (existing database with data):
   ```bash
   # Verify current data
   psql crearis_dev -c "SELECT COUNT(*) FROM events"
   ```

2. **Create backup from current state**:
   ```bash
   curl -X POST http://localhost:3000/api/admin/backup/export
   ```

3. **Modify some records manually**:
   ```sql
   UPDATE events SET name = 'Modified Event' WHERE xmlid = 'event-001';
   ```

4. **Run replace import** (with earlier backup):
   ```bash
   bash scripts/data-sync.sh replace data/sync/EARLIER_BACKUP.tar.gz
   ```

5. **Validate**:
   ```bash
   psql crearis_dev -c "SELECT name FROM events WHERE xmlid = 'event-001'"
   # Should show original name (before manual modification)
   ```

**Expected Results**:
- ✅ Records updated by xmlid
- ✅ Manual modifications overwritten
- ✅ No setup dummies created
- ✅ datF_assignments skipped
- ✅ Foreign keys preserved
- ✅ Validation tests pass

---

### Scenario 3: Master-Slave Sync (60 min)

**Goal**: Test complete production → dev synchronization workflow.

**Steps**:

1. **On Production (Master)**:
   ```bash
   # Export via admin UI
   # Navigate to /admin/images → System Backup → Create Backup
   # Or via CLI:
   curl -X POST https://production.crearis.org/api/admin/backup/export
   ```

2. **Download backup**:
   ```bash
   # From dev machine
   scp user@production:/path/to/crearis/data/sync/2025-11-09T*.backup.tar.gz \
       ./data/sync/
   ```

3. **On Dev (Slave)**:
   ```bash
   # Run replace import
   bash scripts/data-sync.sh replace
   ```

4. **Validate**:
   ```bash
   pnpm tsx server/database/data-packages/datH_validation.ts
   ```

5. **Spot check data**:
   ```bash
   # Compare record counts
   ssh user@production "psql crearis_prod -c 'SELECT COUNT(*) FROM events'"
   psql crearis_dev -c "SELECT COUNT(*) FROM events"
   # Counts should match
   ```

**Expected Results**:
- ✅ Backup transferred successfully
- ✅ Import completes without errors
- ✅ Record counts match master
- ✅ Sample records match master
- ✅ All validation tests pass
- ✅ Application runs normally

---

### Scenario 4: Migration Package Filtering (30 min)

**Goal**: Test package system (A-E) filtering.

**Steps**:

1. **Package A only**:
   ```bash
   pnpm db:drop
   DB_MIGRATION_STARTWITH=A DB_MIGRATION_ENDWITH=A pnpm db:migrate
   
   # Check tables
   psql crearis_dev -c "\dt"
   # Should have base tables (000-018) but not tags/status
   ```

2. **Package B only**:
   ```bash
   pnpm db:drop
   pnpm db:migrate  # First run A
   DB_MIGRATION_STARTWITH=B DB_MIGRATION_ENDWITH=B pnpm db:migrate
   
   # Check for tags/status tables
   psql crearis_dev -c "SELECT COUNT(*) FROM status"
   # Should have status records
   ```

3. **Package A+B**:
   ```bash
   pnpm db:drop
   DB_MIGRATION_STARTWITH=A DB_MIGRATION_ENDWITH=B pnpm db:migrate
   
   # Check complete schema
   psql crearis_dev -c "\dt" | wc -l
   # Should show all tables
   ```

**Expected Results**:
- ✅ Package A creates base schema only
- ✅ Package B adds tags/status/xmlid
- ✅ Package A+B = complete schema
- ✅ Environment variables control range
- ✅ Console shows package info

---

### Scenario 5: Error Handling (30 min)

**Goal**: Test error conditions and recovery.

**Test Cases**:

1. **Invalid backup file**:
   ```bash
   bash scripts/data-sync.sh init /invalid/path.tar.gz
   # Expected: Clear error message, exit 1
   ```

2. **Corrupted tarball**:
   ```bash
   echo "corrupted" > data/sync/bad.backup.tar.gz
   bash scripts/data-sync.sh init data/sync/bad.backup.tar.gz
   # Expected: Extraction error, clean exit
   ```

3. **Missing backup-index.json**:
   ```bash
   # Create tarball without index
   tar -czf data/sync/noindex.backup.tar.gz -C data/events .
   bash scripts/data-sync.sh init data/sync/noindex.backup.tar.gz
   # Expected: "Invalid backup" error
   ```

4. **Database connection failure**:
   ```bash
   # Stop database
   sudo systemctl stop postgresql
   bash scripts/data-sync.sh init
   # Expected: Connection error, clean exit
   ```

5. **Partial import failure**:
   ```bash
   # Manually corrupt one JSON file
   echo "invalid json" > data/import/temp/events.json
   # Expected: datB_base fails, transaction rolled back
   ```

**Expected Results**:
- ✅ Clear error messages for each failure
- ✅ No partial data imported
- ✅ Temp files cleaned up
- ✅ Exit codes indicate failure (≠ 0)
- ✅ Database remains consistent

---

## 🎯 Performance Benchmarks

### Export Performance

**Test**: Export full production database.

```bash
time curl -X POST http://localhost:3000/api/admin/backup/export
```

**Targets**:
- 1,000 records: < 5 seconds
- 10,000 records: < 30 seconds
- 100,000 records: < 5 minutes

**Metrics**:
- Export time
- Tarball size
- Compression ratio
- Memory usage

---

### Import Performance

**Test**: Import full production backup.

```bash
time bash scripts/data-sync.sh replace
```

**Targets**:
- 1,000 records: < 10 seconds
- 10,000 records: < 60 seconds
- 100,000 records: < 10 minutes

**Metrics**:
- Import time per package
- Total import time
- Database locks duration
- Memory usage

---

## 📋 Integration Checklist

### Pre-Deployment

- [ ] All MR1-MR5 steps completed
- [ ] All test scenarios pass
- [ ] Performance acceptable
- [ ] Documentation complete
- [ ] Error messages clear
- [ ] Logging comprehensive
- [ ] Rollback procedures tested

### Production Deployment

1. **Backup current production**:
   ```bash
   bash scripts/backup-production-db.sh
   ```

2. **Deploy code**:
   ```bash
   git pull origin alpha/imagesystem
   pnpm install
   pnpm build
   pm2 restart crearis
   ```

3. **Test export**:
   ```bash
   curl -X POST https://production.crearis.org/api/admin/backup/export
   ```

4. **Verify backup created**:
   ```bash
   ls -lh data/sync/*.backup.tar.gz
   ```

5. **Test on staging** (if available):
   ```bash
   scp production:/data/sync/latest.backup.tar.gz staging:/data/sync/
   ssh staging "bash scripts/data-sync.sh replace"
   ```

---

## 🐛 Troubleshooting Guide

### "No backup files found"

**Cause**: `/data/sync/` directory empty or no `*.backup.tar.gz` files.

**Solution**:
```bash
# Check directory
ls -lh data/sync/

# Create export
curl -X POST http://localhost:3000/api/admin/backup/export
```

---

### "Parent not found" in datG_propagation

**Cause**: Detail table references parent xmlid that doesn't exist.

**Solution**:
```bash
# Verify parent records imported
psql crearis_dev -c "SELECT xmlid FROM projects"

# Check JSON file for invalid _parent_xmlid
cat data/import/temp/pages.json | jq '.records[] | select(._parent_xmlid == "missing-project")'
```

---

### "Validation failed" after import

**Cause**: Data integrity issues (FKs, duplicates, etc).

**Solution**:
```bash
# Run validation with verbose output
pnpm tsx server/database/data-packages/datH_validation.ts

# Check failed test details
cat test-results/validation.json | jq '.[] | select(.passed == false)'

# Fix data issues
# Re-run import
```

---

### Setup dummies remain after init

**Cause**: datF_assignments failed or skipped.

**Solution**:
```bash
# Check for setup records
psql crearis_dev -c "SELECT xmlid, name FROM events WHERE xmlid = 'setup'"

# Check late-seed directory
ls data/late-seed/

# Manually run datF_assignments
pnpm tsx server/database/data-packages/datF_assignments.ts --import-dir=data/import/temp
```

---

## 📊 Success Metrics

### Automated

- [ ] All 40+ validation tests pass
- [ ] Export creates valid tarball
- [ ] Import completes without errors
- [ ] Record counts match source
- [ ] Foreign keys valid
- [ ] No orphaned records

### Manual

- [ ] Admin UI functional
- [ ] Application runs normally
- [ ] Data appears correct in UI
- [ ] No console errors
- [ ] Performance acceptable
- [ ] Logs show expected flow

---

## 🔗 Related Files

- [Master Plan](./2025-11-09_MIGRATION_REFACTOR_PLAN.md)
- [Previous: MR5 Validation](./MR5_VALIDATION.md)
- [Next: MRX Extended Features](./MRX_EXTENDED_FEATURES.md)

---

**Last Updated**: November 9, 2025  
**Status**: Ready for execution
