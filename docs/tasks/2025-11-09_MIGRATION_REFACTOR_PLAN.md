# Migration System Refactoring Plan

**Date**: November 9, 2025  
**Type**: Multi-Session Implementation Plan  
**Priority**: High  
**Status**: 🔍 Planning Phase

---

## 🎯 Goal

Transform the monolithic migration system into a phased architecture supporting:
1. Master-slave data synchronization via JSON export/import
2. Safe schema evolution without data loss
3. Automated backup before production schema updates
4. Configurable migration packages (A, B, C, D, E)
5. Data seeding packages (datA-datH) with late-binding foreign key resolution

---

## 📑 Implementation Steps

This plan is divided into focused implementation steps, each with its own detailed documentation:

### Implementation Steps

1. **MR1: Migration Package System** → [MR1_MIGRATION_PACKAGES.md](./MR1_MIGRATION_PACKAGES.md)
   - [x] **✅ Completed** - Package-based migration filtering (A-E)
   - Commit: 776538d

2. **MR2: Export System & JSON Schema** → [MR2_EXPORT_SYSTEM.md](./MR2_EXPORT_SYSTEM.md)
   - [x] **✅ Completed** - JSON export with late-seeding and detail tables
   - Files: backup-schema.ts, late-seed-config.ts, export.ts, test-export.ts
   - Features: 12 entity tables, xmlid/sysmail/domaincode index strategy, deprecated column exclusion
   - Export moves tarball to `backup/` folder (temp_backup/ and backup/ in .gitignore)
   - Commits: d5d10dc, 5b3f94b, 51402c4

3. **MR3: Export API & Admin UI** → [MR3_EXPORT_API.md](./MR3_EXPORT_API.md)
   - [x] **✅ Completed** - API endpoint and admin UI integration
   - Files: export.post.ts, ImagesCoreAdmin.vue
   - Tested: API logic validates successfully, UI button added to Data menu
   - Commit: 5ada553

4. **[MR4: Basic Import System](./MR4_IMPORT_SYSTEM.md)** ⏱️ Optional (2-3 hours)
   - **Status**: 🟡 OPTIONAL - Can skip and proceed to production
   - Simple proof-of-concept import for testing export/import cycle
   - **Recommendation**: Deploy export system first, build import when needed
   - Complex features deferred to MRT (see below)

### Testing & Future Work

5. **[MRT: Testing & Future Features](./MRT_TESTING.md)** ⏱️ 6-8 hours (when needed)
   - **Status**: 🔴 DEFERRED - Implement after export validation in production
   - **Production Import System** (moved from MR4):
     - Bash orchestration (data-sync.sh) with init/replace/update/append modes
     - Data packages: datA-datG for phased import
     - Late-seeding resolver for xmlid references
     - 40+ validation tests (datH_validation)
     - Error handling and recovery
   - End-to-end testing scenarios
   - Production-dev sync workflow
   - Performance benchmarking

6. **[MRX: Extended Features](./MRX_EXTENDED_FEATURES.md)** ⏱️ Future
   - Incremental sync optimization
   - Encryption and compression options
   - Cloud storage integration
   - Migration 021 refactoring (separate schema/data)
   - Cross-database adapter support

---

## ⏱️ Time Estimates

| Step | Focus | Estimated Time | Status |
|------|-------|----------------|--------|
| MR1 | Package System | 2-3 hours | ✅ Complete |
| MR2 | Export System | 2-3 hours | ✅ Complete |
| MR3 | Export API/UI | 1-2 hours | ✅ Complete |
| MR4 | Basic Import (optional) | 2-3 hours | 🟡 Optional |
| **Core Export System** | **MR1-MR3** | **5-8 hours** | **✅ DONE** |
| MRT | Production Import + Testing | 6-8 hours | 🔴 Deferred |
| MRX | Extended Features | TBD | 🔵 Future |

---

## 🚦 Implementation Status

- [x] **[MR1](./MR1_MIGRATION_PACKAGES.md)**: Migration Package System ✅ **Completed** (776538d)
- [x] **[MR2](./MR2_EXPORT_SYSTEM.md)**: Export System & JSON Schema ✅ **Completed** (d5d10dc, 5b3f94b, 51402c4)
- [x] **[MR3](./MR3_EXPORT_API.md)**: Export API & Admin UI ✅ **Completed** (5ada553)
- [ ] **[MR4](./MR4_IMPORT_SYSTEM.md)**: Basic Import System 🟡 **Optional** (skip recommended)
- [ ] **[MRT](./MRT_TESTING.md)**: Production Import & Testing 🔴 **Deferred** (6-8 hours when needed)
- [ ] **[MRX](./MRX_EXTENDED_FEATURES.md)**: Extended Features 🔵 **Future**

**Current Recommendation**: **Proceed to production deployment** with export-only functionality. Build import system later when actual requirements are clear.

---

## 📂 Documentation Structure

All step documentation is located in `docs/tasks/`:

```
docs/tasks/
├── 2025-11-09_MIGRATION_REFACTOR_PLAN.md  (This file - Master plan)
├── MR1_MIGRATION_PACKAGES.md              (Package system implementation)
├── MR2_EXPORT_SYSTEM.md                   (JSON export & late-seeding)
├── MR3_EXPORT_API.md                      (API endpoint & admin UI)
├── MR4_IMPORT_SYSTEM.md                   (Bash script & data packages)
├── MR5_VALIDATION.md                      (Validation test suite)
├── MRT_TESTING.md                         (End-to-end testing)
└── MRX_EXTENDED_FEATURES.md               (Future enhancements)
```

Each step document contains:
- **Objective**: Clear goal for the step
- **Tasks**: Detailed implementation steps with code
- **Success Criteria**: Validation checklist
- **Testing**: Test scenarios and commands
- **Files Modified/Created**: Complete file list

---

## 🎯 Quick Reference

### For Implementation

Start with **MR1** and proceed sequentially. Each document is self-contained with all necessary code and commands.

### For Testing

After completing MR1-MR5, use **MRT** for comprehensive end-to-end testing scenarios.

### For Future Work

See **MRX** for planned enhancements (update/append modes, optimization, etc.).

---

## 📊 Current State Summary

### Existing Migration Structure

**Schema Migrations (Auto-run)**:
- `000-018`: Base schema setup (19 migrations)
- `019`: Add tags, status, xmlid system (Core Schema Part 1)
- `020`: Refactor entities with i18n (Core Schema Part 2)

**Data Seeding (Manual-only, manualOnly: true)**:
- `021`: System data (tags, status, config, projects, users, domains)
- `022`: CSV data import (users, projects from root fileset)
- `023`: Demo data (demo users, projects, memberships, images)
- `024`: Placeholder (image assignment moved to 023)

### Key Capabilities Already in Place

✅ Migrations 021-024 already marked `manualOnly: true`  
✅ xmlid system exists in: events, posts, participants, instructors, locations  
✅ Status IDs properly set up with i18n support  
✅ Tables have proper foreign key relationships  
⚠️ Migration 021 mixes schema + data (needs separation later)

### Tables with xmlid (Export/Import Targets)

**Entity Tables**: events, posts, participants, instructors, locations  
**Detail Tables**: project_members, pages, interactions, images

Full analysis available in each step document.

---

## 🔧 New Architecture Overview

### Migration Packages (Schema)

```env
DB_MIGRATION_STARTWITH=A
DB_MIGRATION_ENDWITH=B
```

- **Package A**: Setup (000-018)
- **Package B**: Core-Schema (019-020)
- **Package C**: Alpha (022-029, reserved)
- **Package D**: Beta (030-039, reserved)
- **Package E**: Final (040+, reserved)

### Data Seeding Packages (Bash Scripts)

```bash
bash scripts/data-sync.sh [mode] [backup]
```

- **datA_config**: Config data + setup dummies
- **datB_base**: Base data (CSV imports)
- **datC_parts**: Data parts (entities with xmlid)
- **datD_entities**: Data entities
- **datF_assignments**: Late seeding (resolve FKs)
- **datG_propagation**: Detail tables
- **datH_validation**: Test suite (~40 tests)

---

## 🎯 Quick Start

### For Implementation

Start with **MR1** and proceed sequentially through **MR5**. Each step builds on the previous one.

### For Testing

After completing MR1-MR5, follow **MRT** for comprehensive testing.

### For Future Enhancements

See **MRX** for planned features (update/append modes, optimization).

---

## ⚠️ Important Notes

1. **No Data Loss**: System works with demo data only during development
2. **Migration 021**: Currently mixes schema + data, refactor in MRX
3. **Late Seeding**: Critical for init mode, ensures FK integrity
4. **xmlid System**: Already in place for all entity tables
5. **Status System**: Already configured with i18n
6. **Backup Before Updates**: Always export before schema changes

---

## 📚 Related Documentation

- [Database Migrations](../DATABASE_MIGRATIONS.md)
- [Database Schema](../DATABASE_SCHEMA.md)
- [Database Safety Production](../DATABASE_SAFETY_PRODUCTION.md)
- Database Sync Guide (created in MR5)

---

**Last Updated**: November 9, 2025  
**Next Review**: After MR1 completion
