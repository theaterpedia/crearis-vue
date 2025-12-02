# Migrations 039-042: Status & Rtags System Restructure

**Date:** 2025-11-29  
**Status:** ✅ COMPLETE  
**Priority:** CRITICAL  
**Database:** crearis_admin_dev

---

## Summary

Complete restructure of the status and rtags systems across migrations 039-042:

| Migration | Description | Status |
|-----------|-------------|--------|
| 039 | Status system restructure (lifecycle + scope) | ✅ Complete |
| 040 | Fix status bit allocation (3-bit slots) | ✅ Complete |
| 041 | Set entity status values | ✅ Complete |
| 042 | Rebuild image triggers, add Quality rtags | ✅ Complete |

---

## Migration 039: Status System Restructure

**File:** `server/database/migrations/039_status_restructure.ts`

### Changes Made

1. **Images table alignment:**
   - Added `status INTEGER` column
   - Dropped `status_val BYTEA` column
   - Dropped `config_val BYTEA` column

2. **Trigger updates:**
   - `compute_image_shape_fields()` - temporarily sets img_show to true
   - `update_image_computed_fields()` - temporarily defaults visibility/quality flags

3. **Entity status reset:**
   - All status fields reset to 0 for: images, projects, events, posts, users, instructors

4. **Initial status structure (later corrected in 040):**
   - 7 status categories + 8 subcategories
   - 5 scope toggles

---

## Migration 040: Fix Status Bit Allocation

**File:** `server/database/migrations/040_status_fix_bit_allocation.ts`

### Corrected Bit Allocation

The initial allocation from 039 had overlapping bits. Migration 040 provides proper 3-bit slots:

#### TagGroup: status (bits 0-16)

| Category | Bits | Base Value | Subcategories |
|----------|------|------------|---------------|
| **new** | 0-2 | 1 | new_image (2), new_user (3) |
| **demo** | 3-5 | 8 | demo_event (16), demo_project (24), demo_user (32) |
| **draft** | 6-8 | 64 | draft_user (128) |
| **confirmed** | 9-11 | 512 | confirmed_user (1024) |
| **released** | 12-14 | 4096 | released_user (8192) |
| **archived** | 15 | 32768 | (none) |
| **trash** | 16 | 65536 | (none) |

#### TagGroup: scope (bits 17-21)

| Toggle | Bit | Value | Description |
|--------|-----|-------|-------------|
| scope_team | 17 | 131072 | Visible to instructors/admins |
| scope_login | 18 | 262144 | Visible to logged-in users |
| scope_project | 19 | 524288 | Visible on project website |
| scope_regio | 20 | 1048576 | Visible in regional scope |
| scope_public | 21 | 2097152 | Public domain, whole network |

**Total:** 22 bits used (bits 0-21)  
**Entries:** 20 sysreg_status entries (7 categories, 8 subcategories, 5 toggles)

---

## Migration 041: Set Entity Status Values

**File:** `server/database/migrations/041_entity_status_values.ts`

### Entity Mappings

#### Images (66 records → all DRAFT)

All images set to `status = 64` (DRAFT):

| xmlid | status | 
|-------|--------|
| aktivkreativ.image_child.kostuem_probe2 | 64 (draft) |
| oberland.image_instructor.johanna_schoenfelder_1 | 64 (draft) |
| comictheater.image_event.comic_theater_* | 64 (draft) |
| ... (66 total) | ... |

#### Projects (18 records)

| domaincode | status | comment |
|------------|--------|---------|
| tp | 4096 (released) | main platform project |
| aktivkreativ | 4096 (released) | active project |
| utopiainaction | 4096 (released) | active project |
| start | 4096 (released) | launch project |
| aug | 64 (draft) | regio in development |
| dev | 64 (draft) | dev blog |
| dasei | 64 (draft) | in development |
| raumlauf | 64 (draft) | topic in development |
| hoftheaterschrobenhausen | 8 (demo) | placeholder/template |
| bewaehrungshilfeaugsburg | 8 (demo) | placeholder/template |
| physicaltheatre | 8 (demo) | topic placeholder |
| comictheater | 8 (demo) | topic placeholder |
| einthemaeintag | 8 (demo) | topic placeholder |
| oberland | 8 (demo) | regio placeholder |
| mue | 8 (demo) | regio placeholder |
| nue | 8 (demo) | regio placeholder |
| wahlfische | 8 (demo) | placeholder |
| linklaternuernberg | 8 (demo) | placeholder |

#### Users

| sysmail | status | comment |
|---------|--------|---------|
| admin@theaterpedia.org | 1024 (confirmed_user) | admin |
| base@theaterpedia.org | 1024 (confirmed_user) | base |
| rosalin.hertrich@dasei.eu | 1024 (confirmed_user) | active user |
| hans.doenitz@theaterpedia.org | 1024 (confirmed_user) | active user |
| project1@theaterpedia.org | 1 (new) | system account |
| project2@theaterpedia.org | 1 (new) | system account |
| tp@theaterpedia.org | 1 (new) | system account |
| regio1@theaterpedia.org | 1 (new) | system account |
| (all others) | 64 (draft) | default |

---

## Migration 042: Rebuild Image Triggers

**File:** `server/database/migrations/042_rebuild_image_triggers.ts`

### rtags Quality Group

Added new Quality tag group to rtags:

| Name | Bit | Value | taglogic | Label (de) |
|------|-----|-------|----------|------------|
| deprecated | 0 | 1 | toggle | Veraltet |
| issues | 1 | 2 | toggle | Probleme |

**Total rtags entries:** 2

### Trigger Logic

#### compute_image_shape_fields()
```sql
-- img_show: true if rtags quality bits are 0 (ok) or 1 (deprecated only)
IF NEW.rtags IS NULL THEN
    NEW.img_show := true;
ELSE
    NEW.img_show := (NEW.rtags & 3) IN (0, 1);
END IF;
```

#### update_image_computed_fields()
```sql
-- Visibility from status.scope bits (17-21)
is_public   := (status & 1048576) != 0 OR (status & 2097152) != 0  -- regio OR public
is_private  := (status & 262144) != 0  -- login scope
is_internal := (status & 131072) != 0  -- team scope

-- Quality flags from rtags (bits 0-1)
is_deprecated := (rtags & 1) != 0
has_issues    := (rtags & 2) != 0
```

---

## sysreg-bitgroups.json Configuration

### status Configuration

```json
{
  "status": {
    "name": "status",
    "label": { "de": "Status", "en": "Status" },
    "description": { "de": "Lebenszyklus-Status und Sichtbarkeitsbereich", "en": "Lifecycle status and visibility scope" },
    "groups": [
      {
        "name": "status",
        "label": { "de": "Kernstatus", "en": "Core Status" },
        "bits": [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16],
        "icon": "circle-dot",
        "optional": false,
        "multiselect": false,
        "categories": [
          { "name": "new", "value": 1, "label": { "de": "Neu", "en": "New" } },
          { "name": "demo", "value": 8, "label": { "de": "Demo", "en": "Demo" } },
          { "name": "draft", "value": 64, "label": { "de": "Entwurf", "en": "Draft" } },
          { "name": "confirmed", "value": 512, "label": { "de": "Bestätigt", "en": "Confirmed" } },
          { "name": "released", "value": 4096, "label": { "de": "Freigegeben", "en": "Released" } },
          { "name": "archived", "value": 32768, "label": { "de": "Archiviert", "en": "Archived" } },
          { "name": "trash", "value": 65536, "label": { "de": "Papierkorb", "en": "Trash" } }
        ]
      },
      {
        "name": "scope",
        "label": { "de": "Sichtbarkeit", "en": "Scope" },
        "bits": [17,18,19,20,21],
        "icon": "eye",
        "optional": true,
        "multiselect": true,
        "toggles": [
          { "name": "scope_team", "value": 131072, "label": { "de": "Team", "en": "Team" } },
          { "name": "scope_login", "value": 262144, "label": { "de": "Login", "en": "Login" } },
          { "name": "scope_project", "value": 524288, "label": { "de": "Projekt", "en": "Project" } },
          { "name": "scope_regio", "value": 1048576, "label": { "de": "Regional", "en": "Regional" } },
          { "name": "scope_public", "value": 2097152, "label": { "de": "Öffentlich", "en": "Public" } }
        ]
      }
    ]
  }
}
```

### rtags Configuration

```json
{
  "rtags": {
    "name": "record_tags",
    "label": { "de": "Datensatz-Tags", "en": "Record Tags" },
    "description": { "de": "Technische Qualitäts- und Statusmarkierungen", "en": "Technical quality and status markers" },
    "groups": [
      {
        "name": "quality",
        "label": { "de": "Qualität", "en": "Quality" },
        "bits": [0, 1],
        "icon": "alert-triangle",
        "optional": true,
        "multiselect": true
      }
    ]
  }
}
```

---

## Design Decisions

### 1. Unified Status Categories (not per-entity)

**Before:** Separate status for each entity (e.g., `event > new`, `post > new`, `image > raw`)

**After:** Unified categories with entity-specific subcategories:
- `new` (category) → `new_image` (raw), `new_user` (passive)
- `demo` (category) → `demo_event` (template), `demo_project` (template), `demo_user` (verified)
- etc.

**Benefit:** Composable can create entity-specific lists by checking for `{category}_{entity}` and falling back to `{category}`.

### 2. Separated Concerns (status vs scope vs quality)

**Before:** Mixed states like "published" (= released + publicly visible)

**After:** 
- **status**: Core lifecycle (new → draft → confirmed → released → archived)
- **scope**: Visibility toggles (team, login, project, regio, public)
- **quality (rtags)**: Quality flags (deprecated, issues)

**Benefit:** Cleaner queries, better filtering, more flexible combinations.

### 3. 3-Bit Slots for Subcategories

Each lifecycle status gets a 3-bit slot (values 0-7):
- Value 0: None
- Value 1: Category only (e.g., `new`)
- Values 2-7: Subcategories (e.g., `new_image`, `new_user`)

**Benefit:** Up to 6 subcategories per status without bit overlap.

---

## Verification

### Sysreg Counts

| Table | Family | Count |
|-------|--------|-------|
| sysreg_status | status | 20 |
| sysreg_rtags | rtags | 2 |
| sysreg_dtags | dtags | 43 |
| sysreg_ctags | ctags | 26 |
| sysreg_ttags | ttags | 32 |

**Total sysreg entries:** 123

### Entity Status Distribution

| Entity | NEW | DEMO | DRAFT | CONFIRMED | RELEASED |
|--------|-----|------|-------|-----------|----------|
| images | 0 | 0 | 66 | 0 | 0 |
| projects | 0 | 10 | 4 | 0 | 4 |
| users | 4 | 0 | (rest) | 4 | 0 |

---

## Next Steps

1. ✅ Migrations 039-042 executed successfully
2. ⏳ Update composables to use new status structure:
   - `useStatusOptions()` - entity-specific status lists
   - `useScopeOptions()` - visibility scope toggles
   - `useQualityFlags()` - rtags quality toggles
3. ⏳ Update UI components to display new status/scope/quality badges
4. ⏳ Test image trigger logic with scope changes

---

## Files Modified

- `server/database/migrations/039_status_restructure.ts` - ✅ Created
- `server/database/migrations/040_status_fix_bit_allocation.ts` - ✅ Created
- `server/database/migrations/041_entity_status_values.ts` - ✅ Created
- `server/database/migrations/042_rebuild_image_triggers.ts` - ✅ Created
- `src/config/sysreg-bitgroups.json` - ✅ Updated (status + rtags sections)

---

**Completed:** 2025-11-29  
**Author:** Copilot Agent
