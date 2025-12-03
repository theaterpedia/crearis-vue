# SYSREG Documentation Cleanup Plan

**Date:** 2025-11-28  
**Status:** ✅ Completed

---

## Summary

After analyzing all SYSREG-related documentation across the codebase, here is the recommended action for each file.

---

## ✅ KEEP (Authoritative)

| File | Location | Lines | Purpose | Status |
|------|----------|-------|---------|--------|
| **SYSREG_SPEC.md** | `docs/` | 351 | Master specification | ✅ Created |
| **SYSREG_SYSTEM.md** | `docs/` | 1043 | Entry point & overview | ✅ Updated for INTEGER |
| **SYSREG_BIT_GROUPS_IMPLEMENTATION.md** | `docs/` | 210 | Composable & config reference | ✅ Keep |
| **SYSREG_PHASE3_PHASE4_COMPLETE.md** | `docs/` | 667 | useImageStatus, useGalleryFilters | ✅ Keep |
| **SYSREG_PHASE5_PHASE6_COMPLETE.md** | `docs/` | ~500 | Admin UI & analytics | ✅ Keep |
| **SYSREG_Further_Planning.md** | `docs/` | 630 | Phase 7 + component review | ✅ Updated |
| **sysreg-bitgroups.json** | `src/config/` | 303 | Configuration with correct semantics | ✅ Updated |

---

## 🔄 UPDATE (Quick Fixes Needed) - ✅ DONE

| File | Issue | Fix | Status |
|------|-------|-----|--------|
| **SYSREG_SYSTEM.md** | References BYTEA | Global replace → INTEGER | ✅ Done |
| **SYSREG_USECASE_DESIGN.md** | Old API designs | Added deprecation notice | ✅ Done |
| **SYSREG_Further_Planning.md** | Needed component review | Added SysregTagDisplay + ImageStatusControls | ✅ Done |

---

## 📦 ARCHIVE (Historical Reference) - ✅ DONE

Moved to `docs/_archived/sysreg/`:

| File | Reason | Status |
|------|--------|--------|
| **SYSREG_TESTING_STRATEGY.md** | BYTEA-specific test patterns | ✅ Archived |
| **SYSREG_INTERFACE_SPECIFICATION_ISSUE.md** | Design issues resolved | ✅ Archived |
| **SYSREG_STATUS_MIGRATION_ANALYSIS.md** | Migration complete | ✅ Archived |

---

## 📁 Task Docs (in `docs/tasks/`)

### Keep:
- `2025-11-27-SYSREG_ENHANCEMENT_PLAN.md` - Current implementation plan
- `2025-11-26-dtags.md` - Source taxonomy from user
- `2025-11-27-DTAGS_BIT_ANALYSIS.md` - Bit allocation analysis
- `2025-11-27-postmigration-tasks.md` - Remaining tasks
- `2025-12-01-MIGRATION_037_PHASE4_REMAINING_ISSUES.md` - Active issues

### Archive (pre-November 2025):
- `2025-11-19-*.md` - Original sysreg task files (8 files)
- `2025-11-23_Sysreg_*.md` - Earlier sysreg planning

---

## Key Changes Made This Session

### 1. Created `docs/SYSREG_SPEC.md`
- New master specification document
- Correct tag family semantics per user clarification
- Updated for INTEGER (not BYTEA)
- Clear documentation hierarchy

### 2. Updated `src/config/sysreg-bitgroups.json`
- **ctags**: Now "Common Tags" for creative work domain
  - Removed `access_level` and `quality` groups (belong in rtags)
  - `age_group` → "Participant Ages" (not "Target age groups")
  - `subject_type` → "Working Space" (not "Subject Type")
- **rtags**: Now empty for alpha (`"groups": []`)
- **ttags**: Added "Topic Tags" meaning
- **status**: Added `singleOption: true` to indicate strict single-value
- Added family-level `name`, `label`, `description` to all families

---

## i18n Notes

The following i18n patterns are in place:
- ✅ `sysreg-bitgroups.json` has de/en/cz labels for all groups
- ⚠️ `TagGroupEditor.vue` may need label lookup fixes (uses `name` not `name_i18n`)
- ⚠️ Category/subcategory labels need i18n attention (partly dropped)

---

## Next Steps

1. Run `BYTEA → INTEGER` global replace on `SYSREG_SYSTEM.md`
2. Move archived docs to `docs/_archived/sysreg/`
3. Fix remaining TagGroupEditor coordinate mismatch issues
4. Prepare seed data SQL for Migration 037 (user will provide)
