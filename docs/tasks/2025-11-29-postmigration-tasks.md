# Post-Migration 036 Tasks

## 1. Restore Sysreg Values

**Status:** ✅ COMPLETED  
**Priority:** URGENT

All sysreg.value entries were 0 after migration but have been restored to proper power-of-2 values.

**Resolution:**
Executed SQL to assign power-of-2 values based on entry order per tagfamily:
```sql
UPDATE sysreg SET value = subq.new_value
FROM (
  SELECT id, POWER(2, ROW_NUMBER() OVER (PARTITION BY tagfamily ORDER BY id) - 1)::INTEGER as new_value
  FROM sysreg
) subq
WHERE sysreg.id = subq.id;
```

**Verification:**
- status: 25 entries, values 1 to 16777216 (2^0 to 2^24)
- config: 6 entries, values 1 to 32 (2^0 to 2^5)
- ctags: 4 entries, values 1 to 8 (2^0 to 2^3)
- rtags: 4 entries, values 1 to 8 (2^0 to 2^3)
- dtags: 6 entries, values 1 to 32 (2^0 to 2^5)
- ttags: 6 entries, values 1 to 32 (2^0 to 2^5)

Unique constraint (value, tagfamily) is now properly enforced.

## 2. Generated Columns on Projects Table

**Status:** TODO
**Priority:** HIGH

The `projects` table has 3 generated columns that depend on the `config` column:
- `is_onepage` - COALESCE(((config ->> 'onepage')::boolean), false)
- `is_service` - COALESCE(((config ->> 'service')::byoolean), false)  
- `is_sidebar` - COALESCE(((config ->> 'sidebar')::boolean), false)

These were dropped during Migration 036 to allow the `config` column type change from BYTEA to INTEGER.

**Action Required:**
Recreate these generated columns using the new INTEGER-based config system once the config bit mapping is defined.

**Note:** The `config` column was changed from BYTEA to INTEGER as part of the sysreg standardization. The generated columns need to be updated to work with the new bit-based config system instead of JSONB properties.

## 3. Remove Deprecated 'option' taglogic

**Status:** TODO  
**Priority:** MEDIUM  
**Depends on:** Testing deprecation warnings work correctly

### Step 1: Convert existing 'option' entries to 'toggle'
```sql
UPDATE sysreg SET taglogic = 'toggle' WHERE taglogic = 'option';
```

### Step 2: Update database constraint (future migration)
```sql
-- Remove 'option' from allowed taglogic values
ALTER TABLE sysreg DROP CONSTRAINT sysreg_taglogic_check;
ALTER TABLE sysreg ADD CONSTRAINT sysreg_taglogic_check 
    CHECK (taglogic = ANY (ARRAY['category'::text, 'subcategory'::text, 'toggle'::text]));
```

**Affected entries (as of 2025-11-28):**
- ctags: child, adult, teen, location
- status: posts > new, posts > draft, posts > publish, posts > released, users > new, users > verified

## 4. Rebuild compute_image_shape_fields Trigger Logic

**Status:** ✅ COMPLETED  
**Priority:** HIGH  
**Added:** 2025-11-29 (Migration 039)  
**Resolved:** 2025-11-28 (Migration 042)

The trigger function `compute_image_shape_fields()` on the `images` table had a dependency on BYTEA ctags column which was changed to INTEGER.

**Original logic (removed):**
```sql
-- Compute img_show: true if quality bits (6+7) are 0 (ok) or 64 (is_deprecated)
NEW.img_show := (get_byte(NEW.ctags, 0) & 192) IN (0, 64);
```

**Resolution (Migration 042):**
Quality flags moved from ctags to rtags. New trigger logic:
```sql
-- Show if: no quality flags OR only deprecated (not issues)
NEW.img_show := (NEW.rtags & 3) IN (0, 1);
```

- `rtags & 1` = deprecated flag
- `rtags & 2` = issues flag
- Image shown if no flags OR only deprecated (but not issues)

**Trigger location:** PostgreSQL function `compute_image_shape_fields()`

## 5. Rebuild update_image_computed_fields Trigger Logic

**Status:** ✅ COMPLETED  
**Priority:** HIGH  
**Added:** 2025-11-29 (Migration 039)  
**Resolved:** 2025-11-28 (Migration 042)

The trigger function `update_image_computed_fields()` on the `images` table had dependencies on BYTEA ctags column for visibility and quality flags.

**Original logic (removed):**
```sql
-- Compute is_public, is_private, is_internal from bits 4+5 of ctags
NEW.is_public := (get_byte(NEW.ctags, 0) & 48) = 16;
NEW.is_private := (get_byte(NEW.ctags, 0) & 48) = 32;
NEW.is_internal := (get_byte(NEW.ctags, 0) & 48) = 48;

-- Compute is_deprecated, has_issues from bits 6+7 of ctags
NEW.is_deprecated := (get_byte(NEW.ctags, 0) & 192) = 64;
NEW.has_issues := (get_byte(NEW.ctags, 0) & 192) IN (128, 192);
```

**Resolution (Migration 042):**
Visibility derived from status.scope bits (17-21), quality from rtags (bits 0-1):
```sql
-- Visibility from status scope bits:
-- scope_team:    bit 17 (131072)
-- scope_login:   bit 18 (262144)
-- scope_regio:   bit 20 (1048576)
-- scope_public:  bit 21 (2097152)
NEW.is_public := (NEW.status & 1048576) != 0 OR (NEW.status & 2097152) != 0;
NEW.is_private := (NEW.status & 262144) != 0;
NEW.is_internal := (NEW.status & 131072) != 0;

-- Quality from rtags:
NEW.is_deprecated := (NEW.rtags & 1) != 0;
NEW.has_issues := (NEW.rtags & 2) != 0;
```

**Trigger location:** PostgreSQL function `update_image_computed_fields()`
