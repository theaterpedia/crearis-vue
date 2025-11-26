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
- `is_service` - COALESCE(((config ->> 'service')::boolean), false)  
- `is_sidebar` - COALESCE(((config ->> 'sidebar')::boolean), false)

These were dropped during Migration 036 to allow the `config` column type change from BYTEA to INTEGER.

**Action Required:**
Recreate these generated columns using the new INTEGER-based config system once the config bit mapping is defined.

**Note:** The `config` column was changed from BYTEA to INTEGER as part of the sysreg standardization. The generated columns need to be updated to work with the new bit-based config system instead of JSONB properties.
