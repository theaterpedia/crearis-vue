# System Integration Tasks - Post-Migration 037-042

**Date:** 2025-12-01  
**Status:** 🔄 IN PROGRESS  
**Priority:** CRITICAL  
**Branch:** alpha/status

---

## Overview

After completing migrations 037-042 (sysreg restructure), we need to verify and fix system integration. This document tracks coordinated actions for critical areas affected by the INTEGER-based status/tags migration.

---

## Critical Areas

### 1. 🔴 AUTH System

**Impact:** User status values changed, login/session handling may be affected

**Files to Check:**
- [x] `server/api/auth/*.ts` - Authentication endpoints
- [ ] `src/composables/useAuth.ts` - Auth composable
- [ ] `src/stores/auth.ts` - Auth store (if exists)
- [ ] User status validation triggers

**Known Issues:**
- [x] **1.A status-helpers.ts** - Used Buffer type instead of INTEGER (FIXED 2025-11-29)

**Actions:**
| # | Task | Status | Notes |
|---|------|--------|-------|
| 1.1 | Verify user login with new status values | ✅ | Fixed status-helpers.ts |
| 1.2 | Check user role/permission checks | ⏳ | |
| 1.3 | Test user registration flow | ⏳ | |
| 1.4 | Verify session handling with status | ⏳ | |

---

### 2. 🔴 PROJECTS System

**Impact:** Project status workflow, visibility, triggers

**Files to Check:**
- [ ] `server/api/projects/*.ts` - Project endpoints
- [ ] `src/composables/useProjectStatus.ts` - Project status composable
- [ ] `src/views/ProjectPage.vue` - Project views
- [ ] Project status validation triggers

**Known Issues:**
- [ ] _pending manual testing results_

**Actions:**
| # | Task | Status | Notes |
|---|------|--------|-------|
| 2.1 | Verify project listing with new status | ⏳ | |
| 2.2 | Check project CRUD operations | ⏳ | |
| 2.3 | Test project status transitions | ⏳ | |
| 2.4 | Verify scope visibility filtering | ⏳ | |
| 2.5 | Check project triggers | ⏳ | |

---

### 3. 🔴 IMAGES System

**Impact:** Image status workflow, computed fields, triggers rebuilt in M042

**Files to Check:**
- [ ] `server/api/images/*.ts` - Image endpoints
- [ ] `src/composables/useImageStatus.ts` - Image status composable
- [ ] `src/views/ImageGallery.vue` - Image views
- [ ] Triggers: `compute_image_shape_fields`, `update_image_computed_fields`

**Known Issues:**
- [x] **3.A Visibility Tags UI** - `cimgImportStepper.vue` shows "Hidden/Public" radio buttons but unclear if linked to ctags/config bits
- [x] **3.B Age Group Tags UI** - Radio buttons for "Andere/Kind/Teens/Erwachsen" need INTEGER ctags integration
- [ ] _pending more manual testing_

**Actions:**
| # | Task | Status | Notes |
|---|------|--------|-------|
| 3.1 | Verify image listing/gallery | ⏳ | |
| 3.2 | Check image upload flow | ⏳ | |
| 3.3 | Test image status transitions | ⏳ | |
| 3.4 | Verify computed fields (is_public, is_deprecated, etc.) | ⏳ | |
| 3.5 | Test rtags quality flags (deprecated, issues) | ⏳ | |
| 3.6 | Check img_show computation | ⏳ | |
| 3.7 | **Fix visibility tags UI** | 🔴 | Needs ctags bit 4-5 integration |
| 3.8 | **Fix age group tags UI** | 🔴 | Needs ctags bit 0-1 integration |

---

## Secondary Areas

### 4. 🟡 EVENTS System

**Files to Check:**
- [ ] `server/api/events/*.ts`
- [ ] Event status validation trigger (`trg_validate_event_status`)

**Actions:**
| # | Task | Status | Notes |
|---|------|--------|-------|
| 4.1 | Verify event CRUD with status | ⏳ | |
| 4.2 | Check event validation trigger | ⏳ | Was disabled/re-enabled in M039 |

---

### 5. 🟡 POSTS System

**Files to Check:**
- [ ] `server/api/posts/*.ts`
- [ ] Post ctags/ttags usage

**Actions:**
| # | Task | Status | Notes |
|---|------|--------|-------|
| 5.1 | Verify post listing with tags | ⏳ | |
| 5.2 | Check post filtering by ctags/ttags | ⏳ | |

---

### 6. 🟡 INSTRUCTORS System

**Files to Check:**
- [ ] `server/api/instructors/*.ts`

**Actions:**
| # | Task | Status | Notes |
|---|------|--------|-------|
| 6.1 | Verify instructor status handling | ⏳ | |

---

## Composables to Verify

| Composable | Status | Unit Tests | Notes |
|------------|--------|------------|-------|
| `useSysregTags.ts` | ⏳ | Existing | Core bit operations |
| `useSysregOptions.ts` | ⏳ | Existing | Tag metadata/labels |
| `useImageStatus.ts` | ⏳ | Existing | Image lifecycle |
| `useProjectStatus.ts` | ⏳ | Existing | Project lifecycle |
| `useGalleryFilters.ts` | ⏳ | Existing | Filter state |
| `useAuth.ts` | ⏳ | ? | Auth state |

---

## Database Triggers to Verify

| Trigger | Table | Status | Notes |
|---------|-------|--------|-------|
| `compute_image_shape_fields` | images | ⏳ | Rebuilt in M042 |
| `update_image_computed_fields` | images | ⏳ | Rebuilt in M042 |
| `trg_validate_event_status` | events | ⏳ | Disabled/re-enabled in M039 |

---

## Unit Test Status

**Last Run:** _pending_

| Test Suite | Passing | Failing | Notes |
|------------|---------|---------|-------|
| useSysregTags.spec.ts | ? | ? | |
| useSysregOptions.spec.ts | ? | ? | |
| useImageStatus.spec.ts | ? | ? | |
| useProjectStatus.spec.ts | ? | ? | |
| useGalleryFilters.spec.ts | ? | ? | |

---

## Manual Testing Log

### Session: _date_

```
Issue: 
Steps to reproduce:
Expected:
Actual:
Fix:
```

---

## Resolution Log

| Date | Issue | Resolution | Commit |
|------|-------|------------|--------|
| 2025-11-29 | status-helpers.ts Buffer→INTEGER | Updated StatusInfo interface to use `number` instead of `Buffer`, updated all helper functions | pending |

---

## Deprecated Files Review (Monday Session)

**Purpose:** Review and clean up files made obsolete by Migration 036 (BYTEA → INTEGER)

### 🔴 Likely Deprecated (Delete Candidates)

| File | Reason | Action |
|------|--------|--------|
| `server/utils/status-mapping.ts` | BYTEA-based status mapping, not imported anywhere | Review & Delete |
| `src/composables/useGalleryFilters.ts.backup` | Backup file from migration | Review & Delete |
| `server/api/demo/sync.post.ts.backup` | Backup file | Review & Delete |
| `tests/unit/shape-editor.test.ts.old` | Old test file | Review & Delete |

### 🟡 Needs Update (Type Definitions)

| File | Issue | Action |
|------|-------|--------|
| `server/types/database.ts` | Still uses `Buffer \| null` for status_val, config_val, etc. (9+ occurrences) | Update to `number \| null` |
| `src/composables/useSysregStatus.ts` | References BYTEA/Buffer in comments, may have obsolete logic | Review & Update |

### 🟢 Already Fixed

| File | Issue | Status |
|------|-------|--------|
| `server/adapters/base-adapter.ts` | Buffer.from for ctags/rtags | ✅ Fixed 2025-11-29 |
| `server/api/images/[id].put.ts` | Buffer.from for ctags/rtags | ✅ Fixed 2025-11-29 |

### Cleanup Commands (for Monday)

```bash
# Preview deprecated files
ls -la server/utils/status-mapping.ts
ls -la src/composables/useGalleryFilters.ts.backup
ls -la server/api/demo/sync.post.ts.backup
ls -la tests/unit/shape-editor.test.ts.old

# After review, delete:
# rm server/utils/status-mapping.ts
# rm src/composables/useGalleryFilters.ts.backup
# rm server/api/demo/sync.post.ts.backup
# rm tests/unit/shape-editor.test.ts.old
```

---

## Next Steps

1. ⏳ Run manual testing on auth/projects/images
2. ⏳ Document issues found in this file
3. ⏳ Fix critical issues
4. ⏳ Run unit test suite
5. ⏳ Fix failing tests
6. ⏳ Integration testing

---

**Updated:** 2025-12-01
