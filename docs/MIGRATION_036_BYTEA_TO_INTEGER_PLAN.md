# Migration 036: Convert sysreg.value from BYTEA to INTEGER

## Overview

Convert the sysreg system from variable-length BYTEA to fixed 32-bit INTEGER for standardized bitmask operations supporting up to 32 bits per tagfamily.

## Current State Analysis

### Database Schema
**sysreg table:**
- `value BYTEA NOT NULL` - Variable length byte array (1-N bytes)
- Constraint: `UNIQUE (value, tagfamily)`

**Entity tables (9 tables):**
- posts, events, projects, participants, instructors, users, tasks, interactions
- Each has: `status BYTEA`, `config BYTEA`, `rtags BYTEA`, `ctags BYTEA`, `ttags BYTEA`, `dtags BYTEA`

**Images table:**
- Has: `ctags BYTEA`, `rtags BYTEA`, `ttags BYTEA`, `dtags BYTEA` (no status/config)

### Frontend Composable (useSysregTags.ts)
- `parseByteaHex(hex: string)` - Parses `\\x01` format to byte array
- `byteaFromNumber(num: number)` - Converts 0-255 to `\\x01` format
- All bit operations work on byte arrays
- CTags bit groups use bits 0-7 within single byte

### Current Limitations
- BYTEA is variable length, causing inconsistency
- Bit operations limited to first byte (0-7) in practice
- No standardized handling of multi-byte values
- Performance overhead from BYTEA conversion

## Goals

1. **Standardize to 32-bit INTEGER**
   - Consistent 4-byte representation
   - Support 32 bits per tagfamily (bits 0-31)
   - Better PostgreSQL index performance
   - Simpler JavaScript number operations

2. **Clean slate for data**
   - Delete all entity sysreg data (status, config, *tags)
   - Keep sysreg metadata definitions
   - Fresh start for systematic recreation

3. **Maintain compatibility**
   - Keep API interfaces similar
   - Gradual frontend transition
   - Reversible migration

## Migration Plan

### Phase 1: Database Schema Changes

#### Step 1.1: Alter sysreg table
```sql
-- Drop unique constraint
ALTER TABLE sysreg DROP CONSTRAINT IF EXISTS unique_value_family;

-- Change value column type
ALTER TABLE sysreg ALTER COLUMN value TYPE INTEGER USING 0;

-- Update all sysreg entries to use integer bit positions
-- status: Convert BYTEA \\x01, \\x02, \\x04... to integers 1, 2, 4...
-- *tags: Convert bit positions to power-of-2 integers

-- Recreate unique constraint
ALTER TABLE sysreg ADD CONSTRAINT unique_value_family UNIQUE (value, tagfamily);

-- Update index
DROP INDEX IF EXISTS idx_sysreg_value;
CREATE INDEX idx_sysreg_value ON sysreg (value);
```

#### Step 1.2: Clear entity data (DESTRUCTIVE)
```sql
-- Clear all sysreg fields in entity tables
UPDATE posts SET status = NULL, config = NULL, rtags = NULL, ctags = NULL, ttags = NULL, dtags = NULL;
UPDATE events SET status = NULL, config = NULL, rtags = NULL, ctags = NULL, ttags = NULL, dtags = NULL;
UPDATE projects SET status = NULL, config = NULL, rtags = NULL, ctags = NULL, ttags = NULL, dtags = NULL;
UPDATE participants SET status = NULL, config = NULL, rtags = NULL, ctags = NULL, ttags = NULL, dtags = NULL;
UPDATE instructors SET status = NULL, config = NULL, rtags = NULL, ctags = NULL, ttags = NULL, dtags = NULL;
UPDATE users SET status = NULL, config = NULL, rtags = NULL, ctags = NULL, ttags = NULL, dtags = NULL;
UPDATE tasks SET status = NULL, config = NULL, rtags = NULL, ctags = NULL, ttags = NULL, dtags = NULL;
UPDATE interactions SET status = NULL, config = NULL, rtags = NULL, ctags = NULL, ttags = NULL, dtags = NULL;
UPDATE images SET ctags = NULL, rtags = NULL, ttags = NULL, dtags = NULL;
```

#### Step 1.3: Alter entity table columns
```sql
-- For each entity table: change BYTEA to INTEGER
-- Example for posts:
ALTER TABLE posts ALTER COLUMN status TYPE INTEGER USING NULL;
ALTER TABLE posts ALTER COLUMN config TYPE INTEGER USING NULL;
ALTER TABLE posts ALTER COLUMN rtags TYPE INTEGER USING NULL;
ALTER TABLE posts ALTER COLUMN ctags TYPE INTEGER USING NULL;
ALTER TABLE posts ALTER COLUMN ttags TYPE INTEGER USING NULL;
ALTER TABLE posts ALTER COLUMN dtags TYPE INTEGER USING NULL;

-- Repeat for: events, projects, participants, instructors, users, tasks, interactions

-- Images table (no status/config):
ALTER TABLE images ALTER COLUMN ctags TYPE INTEGER USING NULL;
ALTER TABLE images ALTER COLUMN rtags TYPE INTEGER USING NULL;
ALTER TABLE images ALTER COLUMN ttags TYPE INTEGER USING NULL;
ALTER TABLE images ALTER COLUMN dtags TYPE INTEGER USING NULL;
```

### Phase 2: Frontend Composable Updates (useSysregTags.ts)

#### Changes Required:

**Type Updates:**
```typescript
export interface SysregEntry {
    id: number
    value: number        // Changed from: string (BYTEA hex)
    name: string
    tagfamily: string
    taglogic: string
    is_default: boolean
    name_i18n?: Record<string, string>
    desc_i18n?: Record<string, string>
}
```

**Core Conversion Functions:**
```typescript
// BEFORE: parseByteaHex(hex: string): number[]
// AFTER:  parseInteger(value: number | null): number[]

export function parseInteger(value: number | null | undefined): number[] {
    if (!value || value === 0) return []
    
    // Convert 32-bit integer to array of set bit positions
    const bits: number[] = []
    for (let i = 0; i < 32; i++) {
        if (value & (1 << i)) {
            bits.push(i)
        }
    }
    return bits
}

// BEFORE: byteaFromNumber(num: number): string
// AFTER:  integerFromBits(bits: number[]): number

export function integerFromBits(bits: number[]): number {
    if (!bits || bits.length === 0) return 0
    
    let value = 0
    for (const bit of bits) {
        if (bit >= 0 && bit < 32) {
            value |= (1 << bit)
        }
    }
    return value
}

// Remove BYTEA-specific functions:
// - byteaFromUint8Array()
// - uint8ArrayFromBytea()
```

**Bit Operation Updates:**
All functions using `parseByteaHex()` need to use `parseInteger()`:
- `hasBit(value, bit)` 
- `setBit(value, bit)`
- `clearBit(value, bit)`
- `toggleBit(value, bit)`
- `hasAllBits(value, bits)`
- `hasAnyBit(value, bits)`
- `bitsToByteArray(value)` → `bitsFromInteger(value)`
- `byteArrayToBits(bytes)` → `integerFromBits(bits)`
- `orBytea(a, b)` → `orIntegers(a, b)`
- `countBits(value)`

**CTags Bit Groups:**
```typescript
// No change needed - still works with bit positions 0-31
export interface CtagsBitGroups {
    age_group: number      // bits 0-1 (0-3) - values 0-3
    subject_type: number   // bits 2-3 (0-3) - values 0-3
    access_level: number   // bits 4-5 (0-3) - values 0-3
    quality: number        // bits 6-7 (0-3) - values 0-3
}

// extractCtagsBitGroup() - works same with integer
// buildCtagsByte() → buildCtagsInteger()
```

### Phase 3: API/Backend Updates

#### server/utils/status-helpers.ts
```typescript
export interface StatusInfo {
    name: string
    value: number          // Changed from: Buffer
    fullName: string
    description: string
    nameI18n: Record<string, string>
    descI18n: Record<string, string>
}

// Update queries to use INTEGER comparison instead of BYTEA
```

#### API Endpoints
- `/api/sysreg/all.get.ts` - Returns integer values
- `/api/sysreg/[id].put.ts` - Accepts integer values
- `/api/sysreg/[id].delete.ts` - INTEGER comparison in usage checks
- All entity endpoints - Update to handle integer status/tags

### Phase 4: Test Updates

#### tests/helpers/sysreg-test-data.ts
```typescript
// Update bitsToHex() to bitsToInteger()
function bitsToInteger(bits: (number | string)[]): number {
    if (bits.length === 0) return 0
    
    // If first element is already a number, return it
    if (typeof bits[0] === 'number' && bits.length === 1) {
        return bits[0]
    }
    
    // Calculate integer from bit positions
    let value = 0
    bits.forEach(bit => {
        if (typeof bit === 'number' && bit >= 0 && bit < 32) {
            value |= (1 << bit)
        }
    })
    
    return value
}

// Update test entities:
export function createTestImage(overrides?: Partial<TestEntity>): TestEntity {
    return {
        id: 1,
        name: 'Test Image',
        status: 2,        // Changed from: '\\x02'
        ttags: 5,         // Changed from: '\\x05' (bits 0,2)
        dtags: 3,         // Changed from: '\\x03' (bits 0,1)
        rtags: 0,
        ctags: 6,         // Changed from: '\\x06'
        // ...
    }
}
```

#### tests/helpers/sysreg-mock-api.ts
```typescript
// Update mock data:
const mockSysregOptions = [
    { bit: 0, tagfamily: 'status', value: 'raw', label: 'Raw' },
    // bit field now represents the bit position, not hex value
    // toSysregEntry() will convert: bit 0 → value 1, bit 1 → value 2, bit 2 → value 4, etc.
]

function toSysregEntry(opt: SysregOption): any {
    // Convert bit position to integer value
    const intValue = 1 << opt.bit  // bit 0 → 1, bit 1 → 2, bit 2 → 4, etc.
    
    return {
        value: intValue,    // Changed from: hexValue string
        name: opt.value,
        tagfamily: opt.tagfamily,
        taglogic: 'option',
        is_default: false,
        name_i18n: { en: opt.label },
        desc_i18n: {},
        ...(opt.bit_group ? { bit_group: opt.bit_group } : {})
    }
}
```

## Migration File Structure

**File:** `server/database/migrations/036_bytea_to_integer.ts`

```typescript
export const migration = {
    id: '036_bytea_to_integer',
    description: 'Convert sysreg from BYTEA to INTEGER (32-bit)',

    async up(db: DatabaseAdapter): Promise<void> {
        // CHAPTER 1: Backup current sysreg metadata (optional)
        // CHAPTER 2: Alter sysreg table to INTEGER
        // CHAPTER 3: Clear all entity sysreg data
        // CHAPTER 4: Alter entity table columns to INTEGER
        // CHAPTER 5: Verification
    },

    async down(db: DatabaseAdapter): Promise<void> {
        // Reverse: INTEGER → BYTEA
        // Restore entity columns to BYTEA
    }
}
```

## Benefits

### Technical
1. **Standardized 32-bit capacity** - Every tagfamily can use up to 32 bits
2. **Better performance** - INTEGER indexing faster than BYTEA
3. **Simpler operations** - Native JavaScript bitwise operations on numbers
4. **Type safety** - TypeScript number type instead of string/Buffer

### Operational  
1. **Clean data slate** - Systematic recreation without legacy issues
2. **Future-proof** - Room for expansion (32 bits vs current 8)
3. **Consistent** - All tagfamilies handled identically
4. **Debuggable** - Decimal numbers easier to read than hex strings

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Data loss from clearing entities | Accept as intentional clean slate; can recreate systematically |
| Breaking API contracts | Version API, maintain backward compat layer temporarily |
| Frontend/backend desync | Deploy atomically, use feature flags |
| Migration rollback complexity | Test down() migration thoroughly |
| 32-bit limitation | Document max capacity, plan for future 64-bit if needed |

## Rollout Strategy

1. **Development Testing**
   - Run migration on dev database
   - Update frontend composable
   - Test all bit operations
   - Verify API responses

2. **Staging Validation**
   - Full migration + composable deploy
   - Smoke tests on all entity types
   - Performance benchmarks

3. **Production Deploy**
   - Maintenance window
   - Database backup
   - Run migration
   - Deploy frontend/backend
   - Verify system health

4. **Data Recreation**
   - Systematic recreation of entity data
   - Use admin tools or scripts
   - Validate data integrity

## Success Criteria

- [ ] Migration 036 runs successfully
- [ ] All entity tables use INTEGER for sysreg fields
- [ ] sysreg.value is INTEGER with correct bit values
- [ ] useSysregTags composable uses integer operations
- [ ] All tests pass with updated mock data
- [ ] API endpoints return integer values
- [ ] Frontend bit operations work correctly
- [ ] CTags bit groups extract/build properly
- [ ] Performance improves or stays same

## Timeline Estimate

- Migration file creation: 2-3 hours
- Composable updates: 3-4 hours
- Test updates: 2-3 hours
- API/backend updates: 2-3 hours
- Testing & validation: 3-4 hours
- **Total: 12-17 hours**

## Next Steps

1. Create migration file `036_bytea_to_integer.ts`
2. Update `useSysregTags.ts` composable
3. Update test helpers and mock data
4. Update backend API endpoints
5. Run full test suite
6. Deploy to dev environment
7. Validate and iterate

---

**Status:** Planning Complete - Ready for Implementation
**Created:** 2025-11-26
**Migration Package:** C (036-039) - Major refactor
