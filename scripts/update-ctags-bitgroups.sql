-- ============================================================================
-- CTags Bit Groups Update Script
-- ============================================================================
-- Purpose: Update CTags entries to proper single-byte bit group values
--          - Fix age_group entries (child, teen, adult)
--          - Move 'location' from toggle to subject_type bit group
--
-- Date: 2025-11-21
-- Run once on production server
-- ============================================================================

BEGIN;

-- Display current state before changes
SELECT 'BEFORE UPDATE:' as status;
SELECT id, name, encode(value, 'hex') as hex_value, 
       get_byte(value, 0) as byte_val,
       tagfamily, taglogic
FROM sysreg 
WHERE tagfamily = 'ctags' 
  AND name IN ('child', 'teen', 'adult', 'location')
ORDER BY id;

-- ============================================================================
-- 1. Fix age_group bit group entries (bits 0-1)
-- ============================================================================
-- Convert multi-byte values to single-byte CTags bit group values
-- age_group = 0: 0x00 (Andere/Other)
-- age_group = 1: 0x01 (Kind/Child)
-- age_group = 2: 0x02 (Teens/Jugendliche)
-- age_group = 3: 0x03 (Erwachsen/Adult)

UPDATE sysreg 
SET value = E'\\x01'::bytea 
WHERE tagfamily = 'ctags' 
  AND name = 'child'
  AND encode(value, 'hex') = '0001';

UPDATE sysreg 
SET value = E'\\x02'::bytea 
WHERE tagfamily = 'ctags' 
  AND name = 'teen'
  AND encode(value, 'hex') IN ('0004', '04');

UPDATE sysreg 
SET value = E'\\x03'::bytea 
WHERE tagfamily = 'ctags' 
  AND name = 'adult'
  AND encode(value, 'hex') = '0002';

-- ============================================================================
-- 2. Move 'location' to subject_type bit group (bits 2-3)
-- ============================================================================
-- subject_type = 0: 0x00 (Andere/Other)
-- subject_type = 1: 0x04 (Location/Ort)
-- subject_type = 2: 0x08 (Person)
-- subject_type = 3: 0x0C (Gruppe/Portrait)

UPDATE sysreg 
SET value = E'\\x04'::bytea,
    taglogic = 'option'
WHERE tagfamily = 'ctags' 
  AND name = 'location'
  AND encode(value, 'hex') IN ('0008', '08');

-- ============================================================================
-- Verify changes
-- ============================================================================
SELECT 'AFTER UPDATE:' as status;
SELECT id, name, encode(value, 'hex') as hex_value, 
       get_byte(value, 0) as byte_val,
       tagfamily, taglogic,
       CASE 
           WHEN get_byte(value, 0) BETWEEN 0 AND 3 THEN 'age_group'
           WHEN get_byte(value, 0) IN (4, 8, 12) THEN 'subject_type'
           WHEN get_byte(value, 0) IN (16, 32, 48) THEN 'access_level'
           WHEN get_byte(value, 0) IN (64, 128, 192) THEN 'quality'
           ELSE 'unknown'
       END as bit_group
FROM sysreg 
WHERE tagfamily = 'ctags' 
  AND name IN ('child', 'teen', 'adult', 'location')
ORDER BY get_byte(value, 0);

-- Display summary
SELECT 'UPDATE SUMMARY:' as status;
SELECT 
    COUNT(*) FILTER (WHERE name = 'child' AND get_byte(value, 0) = 1) as child_ok,
    COUNT(*) FILTER (WHERE name = 'teen' AND get_byte(value, 0) = 2) as teen_ok,
    COUNT(*) FILTER (WHERE name = 'adult' AND get_byte(value, 0) = 3) as adult_ok,
    COUNT(*) FILTER (WHERE name = 'location' AND get_byte(value, 0) = 4) as location_ok
FROM sysreg 
WHERE tagfamily = 'ctags' 
  AND name IN ('child', 'teen', 'adult', 'location');

COMMIT;

-- ============================================================================
-- Expected result:
-- child:    0x01 (byte_val=1)  - age_group bit group
-- teen:     0x02 (byte_val=2)  - age_group bit group
-- adult:    0x03 (byte_val=3)  - age_group bit group
-- location: 0x04 (byte_val=4)  - subject_type bit group
-- ============================================================================
