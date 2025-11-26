# Sysreg Status Entries - Missing Entries Analysis

**Date:** November 23, 2025  
**Author:** System Analysis  
**Status:** ⚠️ Action Required  

---

## Executive Summary

The `useImageStatus` and `useProjectStatus` composables define specific status workflows with BYTEA values (0x00, 0x01, 0x02, 0x04, 0x08, 0x10), but these entries **are not present in the `sysreg_status` table**. The sysreg system was populated from the legacy `status` table which used different entity-specific naming and values.

**Critical Issue:** The composables expect specific BYTEA values for images and projects, but the current sysreg_status table only contains migrated entries from the old status table with entity-specific names like `events > draft`, `posts > published`, etc.

**Action Required:** Add new status entries for `images` and `projects` entities to match the composable specifications.

---

## Current System Analysis

### 1. How Migration 022 Works

**Migration 022** (`022_create_sysreg.ts`) migrates the legacy `status` table to `sysreg`:

```typescript
// From migration 022, lines 148-150
const contextName = `${entry.table} > ${entry.name}`
// e.g., 'draft' for events becomes 'events > draft'
```

**Result:** All status entries are prefixed with entity name:
- `events > draft`
- `events > publish`
- `posts > draft`
- `posts > published`
- `tasks > new`
- `tasks > active`
- etc.

### 2. Legacy Status Table Structure

From **Migration 019** (`019_add_tags_status_ids.ts`), the old status table had:

```sql
CREATE TABLE status (
    id SERIAL PRIMARY KEY,
    value SMALLINT NOT NULL,
    name TEXT NOT NULL,
    "table" TEXT NOT NULL CHECK ("table" IN ('projects', 'events', 'posts', 
                                              'persons', 'users', 'tasks', 
                                              'interactions', 'images')),
    description TEXT,
    name_i18n JSONB,
    desc_i18n JSONB
)
```

**Key Point:** The `table` field separated entity-specific statuses. Migration 022 embedded this into the `name` field using the format `{table} > {name}`.

### 3. What Composables Expect

#### useImageStatus Requirements

**File:** `src/composables/useImageStatus.ts` (lines 7-16)

```typescript
/**
 * Status values (status_val BYTEA):
 * - 0x00 (0): raw - Just imported, needs processing
 * - 0x01 (1): processing - Being processed/cropped
 * - 0x02 (2): approved - Ready for use
 * - 0x04 (4): published - Actively used in projects
 * - 0x08 (8): deprecated - Old/outdated, not recommended
 * - 0x10 (16): archived - Removed from active use
 */
```

**Total:** 6 status values for images

#### useProjectStatus Requirements

**File:** `src/composables/useProjectStatus.ts` (lines 8-15)

```typescript
/**
 * Status values (status_val BYTEA):
 * - 0x00 (0): idea - Initial concept, not yet planned
 * - 0x01 (1): draft - Being planned/drafted
 * - 0x02 (2): planned - Scheduled and approved
 * - 0x04 (4): active - Currently running
 * - 0x08 (8): completed - Successfully finished
 * - 0x10 (16): archived - Historical record
 */
```

**Total:** 6 status values for projects

---

## Problem: Missing Entries in sysreg_status

### Current State

The `sysreg_status` table was populated by Migration 022, which only migrated entries from the **existing** `status` table. If the legacy status table didn't have entries for `images` or `projects` workflows, they won't be in sysreg_status.

### Evidence from Migration 019

**Tasks statuses** (lines 154-217): ✅ Present
- new (0), idea (1), draft (2), active (4), final (5), reopen (8), trash (16)

**Events statuses** (lines 247+): ✅ Present
- draft (2), publish (3), released (4), trash (16)

**Posts statuses** (likely present): ✅ Present
- Similar pattern to events

**Images statuses**: ❌ **NOT FOUND**
- No INSERT statements in migration 019

**Projects statuses**: ❌ **NOT FOUND**
- No INSERT statements in migration 019

---

## Solution: Add Missing Status Entries

### Required SQL Insertions

We need to add entries to `sysreg_status` table following the sysreg schema:

```sql
-- sysreg_status table structure (inherited from sysreg)
CREATE TABLE sysreg_status (
    id SERIAL PRIMARY KEY,
    value BYTEA NOT NULL,                -- e.g., '\x00', '\x01', '\x02'
    name TEXT NOT NULL,                  -- e.g., 'images > raw'
    description TEXT,
    name_i18n JSONB,                     -- { "de": "Roh", "en": "Raw", "cz": "Surový" }
    desc_i18n JSONB,
    taglogic TEXT NOT NULL,              -- 'category' for status
    is_default BOOLEAN DEFAULT false,     -- true for 0x00 values
    tagfamily TEXT NOT NULL,             -- 'status'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_value_family UNIQUE (value, tagfamily),
    CHECK (tagfamily = 'status')
) INHERITS (sysreg);
```

---

## Detailed Entry Specifications

### A. Image Status Entries (6 entries)

#### 1. images > raw (0x00)
```sql
INSERT INTO sysreg_status (value, name, description, name_i18n, desc_i18n, taglogic, is_default, tagfamily)
VALUES (
    '\x00'::bytea,
    'images > raw',
    'Just imported, needs processing',
    '{"de": "Roh", "en": "Raw", "cz": "Surový"}'::jsonb,
    '{"de": "Gerade importiert, muss verarbeitet werden", "en": "Just imported, needs processing", "cz": "Právě importováno, vyžaduje zpracování"}'::jsonb,
    'category',
    true,
    'status'
)
ON CONFLICT (value, tagfamily) DO NOTHING;
```

#### 2. images > processing (0x01)
```sql
INSERT INTO sysreg_status (value, name, description, name_i18n, desc_i18n, taglogic, is_default, tagfamily)
VALUES (
    '\x01'::bytea,
    'images > processing',
    'Being processed/cropped',
    '{"de": "In Bearbeitung", "en": "Processing", "cz": "Zpracovává se"}'::jsonb,
    '{"de": "Wird gerade bearbeitet/zugeschnitten", "en": "Being processed/cropped", "cz": "Probíhá zpracování/ořezávání"}'::jsonb,
    'category',
    false,
    'status'
);
```

#### 3. images > approved (0x02)
```sql
INSERT INTO sysreg_status (value, name, description, name_i18n, desc_i18n, taglogic, is_default, tagfamily)
VALUES (
    '\x02'::bytea,
    'images > approved',
    'Ready for use',
    '{"de": "Freigegeben", "en": "Approved", "cz": "Schváleno"}'::jsonb,
    '{"de": "Bereit zur Verwendung", "en": "Ready for use", "cz": "Připraveno k použití"}'::jsonb,
    'category',
    false,
    'status'
);
```

#### 4. images > published (0x04)
```sql
INSERT INTO sysreg_status (value, name, description, name_i18n, desc_i18n, taglogic, is_default, tagfamily)
VALUES (
    '\x04'::bytea,
    'images > published',
    'Actively used in projects',
    '{"de": "Veröffentlicht", "en": "Published", "cz": "Zveřejněno"}'::jsonb,
    '{"de": "Aktiv in Projekten verwendet", "en": "Actively used in projects", "cz": "Aktivně používáno v projektech"}'::jsonb,
    'category',
    false,
    'status'
);
```

#### 5. images > deprecated (0x08)
```sql
INSERT INTO sysreg_status (value, name, description, name_i18n, desc_i18n, taglogic, is_default, tagfamily)
VALUES (
    '\x08'::bytea,
    'images > deprecated',
    'Old/outdated, not recommended',
    '{"de": "Veraltet", "en": "Deprecated", "cz": "Zastaralé"}'::jsonb,
    '{"de": "Alt/veraltet, nicht empfohlen", "en": "Old/outdated, not recommended", "cz": "Staré/zastaralé, nedoporučeno"}'::jsonb,
    'category',
    false,
    'status'
);
```

#### 6. images > archived (0x10)
```sql
INSERT INTO sysreg_status (value, name, description, name_i18n, desc_i18n, taglogic, is_default, tagfamily)
VALUES (
    '\x10'::bytea,
    'images > archived',
    'Removed from active use',
    '{"de": "Archiviert", "en": "Archived", "cz": "Archivováno"}'::jsonb,
    '{"de": "Aus aktiver Nutzung entfernt", "en": "Removed from active use", "cz": "Odstraněno z aktivního používání"}'::jsonb,
    'category',
    false,
    'status'
);
```

---

### B. Project Status Entries (6 entries)

#### 1. projects > idea (0x00)
```sql
INSERT INTO sysreg_status (value, name, description, name_i18n, desc_i18n, taglogic, is_default, tagfamily)
VALUES (
    '\x00'::bytea,
    'projects > idea',
    'Initial concept, not yet planned',
    '{"de": "Idee", "en": "Idea", "cz": "Nápad"}'::jsonb,
    '{"de": "Erstes Konzept, noch nicht geplant", "en": "Initial concept, not yet planned", "cz": "Počáteční koncept, zatím neplánováno"}'::jsonb,
    'category',
    true,
    'status'
)
ON CONFLICT (value, tagfamily) DO NOTHING;
```

**⚠️ CONFLICT WARNING:** Value `\x00` is already used by `images > raw`. This creates a **constraint violation** because sysreg has `UNIQUE (value, tagfamily)`.

---

## Critical Issue: Value Conflicts

### The Problem

Both `useImageStatus` and `useProjectStatus` use the **same BYTEA values**:

| Value | Images Status | Projects Status |
|-------|---------------|-----------------|
| 0x00  | raw           | idea            |
| 0x01  | processing    | draft           |
| 0x02  | approved      | planned         |
| 0x04  | published     | active          |
| 0x08  | deprecated    | completed       |
| 0x10  | archived      | archived        |

**Database Constraint:**
```sql
CONSTRAINT unique_value_family UNIQUE (value, tagfamily)
```

This constraint means **only ONE entry per (value, tagfamily) combination**. Since both images and projects use `tagfamily='status'`, they **cannot share the same BYTEA values**.

### Current System Design Flaw

The sysreg system uses:
- **value (BYTEA)** as the primary identifier
- **tagfamily** to separate types (status, config, rtags, etc.)
- **name** for human-readable labels (e.g., `images > raw`)

**Problem:** The system doesn't have a way to distinguish between entity types (images vs projects) within the same tagfamily.

---

## Solution Options

### Option 1: Entity-Specific Value Ranges (Recommended)

Assign different BYTEA value ranges to each entity:

#### Images: 0x00-0x1F (0-31)
```
0x00 = images > raw
0x01 = images > processing
0x02 = images > approved
0x04 = images > published
0x08 = images > deprecated
0x10 = images > archived
```

#### Projects: 0x20-0x3F (32-63)
```
0x20 = projects > idea
0x21 = projects > draft
0x22 = projects > planned
0x24 = projects > active
0x28 = projects > completed
0x30 = projects > archived
```

#### Events: 0x40-0x5F (64-95)
```
0x40 = events > new
0x42 = events > draft
0x43 = events > publish
0x44 = events > released
0x50 = events > trash
```

#### Posts: 0x60-0x7F (96-127)
```
0x60 = posts > new
0x62 = posts > draft
0x64 = posts > published
0x70 = posts > trash
```

#### Tasks: 0x80-0x9F (128-159)
```
0x80 = tasks > new
0x81 = tasks > idea
0x82 = tasks > draft
0x84 = tasks > active
0x85 = tasks > final
0x88 = tasks > reopen
0x90 = tasks > trash
```

**Pros:**
- ✅ No value conflicts
- ✅ Easy to identify entity by value range
- ✅ Supports up to 256 entities (if needed)
- ✅ Maintains current database schema

**Cons:**
- ⚠️ Requires updating composables
- ⚠️ Requires data migration for existing records
- ⚠️ Breaks semantic meaning of bit positions

---

### Option 2: Add Entity Field to Sysreg

Modify sysreg schema to include an `entity` field:

```sql
ALTER TABLE sysreg ADD COLUMN entity TEXT;

-- Update unique constraint
ALTER TABLE sysreg DROP CONSTRAINT unique_value_family;
ALTER TABLE sysreg ADD CONSTRAINT unique_value_family_entity 
    UNIQUE (value, tagfamily, entity);
```

Then entries become:
```sql
INSERT INTO sysreg_status (value, name, entity, tagfamily, ...)
VALUES ('\x00'::bytea, 'raw', 'images', 'status', ...);

INSERT INTO sysreg_status (value, name, entity, tagfamily, ...)
VALUES ('\x00'::bytea, 'idea', 'projects', 'status', ...);
```

**Pros:**
- ✅ Semantic clarity (explicit entity association)
- ✅ Allows same values across entities
- ✅ Maintains bit position meanings
- ✅ Better database normalization

**Cons:**
- ⚠️ Requires schema migration (ALTER TABLE)
- ⚠️ Breaking change to existing code
- ⚠️ All API endpoints need updates
- ⚠️ Cache structure changes
- ⚠️ Composables need entity parameter

---

### Option 3: Name-Based Lookup (Current Workaround)

Keep current schema, but composables use name-based lookup instead of direct BYTEA values:

```typescript
// Instead of:
const isRaw = computed(() => statusByteValue.value === 0x00)

// Use:
const isRaw = computed(() => statusName.value === 'images > raw')
```

**Pros:**
- ✅ No schema changes needed
- ✅ No data migration
- ✅ Works with current system

**Cons:**
- ⚠️ Performance: String comparison vs byte comparison
- ⚠️ Loses bit operation benefits
- ⚠️ Composables can't use direct BYTEA checks
- ⚠️ Defeats purpose of sysreg BYTEA design

---

### Option 4: Separate Status Tables per Entity

Create separate inherited tables:

```sql
CREATE TABLE sysreg_status_images () INHERITS (sysreg_status);
CREATE TABLE sysreg_status_projects () INHERITS (sysreg_status);
CREATE TABLE sysreg_status_events () INHERITS (sysreg_status);
-- etc.
```

**Pros:**
- ✅ Complete separation
- ✅ No value conflicts
- ✅ Maintains BYTEA semantics

**Cons:**
- ⚠️ Complex schema (24+ tables: 6 tagfamilies × 4+ entities)
- ⚠️ Cache management complexity
- ⚠️ API needs entity-aware queries
- ⚠️ Over-engineering for current needs

---

## Recommendation: Option 1 (Entity-Specific Value Ranges)

**Why:** Minimal code changes, preserves database schema, clear entity separation.

### Implementation Plan

#### Phase 1: Update Composables

**File:** `src/composables/useImageStatus.ts`

```typescript
/**
 * Status values (status_val BYTEA):
 * - 0x00 (0): raw - Just imported, needs processing
 * - 0x01 (1): processing - Being processed/cropped
 * - 0x02 (2): approved - Ready for use
 * - 0x04 (4): published - Actively used in projects
 * - 0x08 (8): deprecated - Old/outdated, not recommended
 * - 0x10 (16): archived - Removed from active use
 */

// Change to:
/**
 * Status values (status_val BYTEA):
 * Images use range 0x00-0x1F:
 * - 0x00 (0): raw - Just imported, needs processing
 * - 0x01 (1): processing - Being processed/cropped
 * - 0x02 (2): approved - Ready for use
 * - 0x04 (4): published - Actively used in projects
 * - 0x08 (8): deprecated - Old/outdated, not recommended
 * - 0x10 (16): archived - Removed from active use
 */
```

**File:** `src/composables/useProjectStatus.ts`

```typescript
/**
 * Status values (status_val BYTEA):
 * Projects use range 0x20-0x3F:
 * - 0x20 (32): idea - Initial concept, not yet planned
 * - 0x21 (33): draft - Being planned/drafted
 * - 0x22 (34): planned - Scheduled and approved
 * - 0x24 (36): active - Currently running
 * - 0x28 (40): completed - Successfully finished
 * - 0x30 (48): archived - Historical record
 */

// Update comparisons:
const isIdea = computed(() => currentStatus.value === 0x20)      // was 0x00
const isDraft = computed(() => currentStatus.value === 0x21)     // was 0x01
const isPlanned = computed(() => currentStatus.value === 0x22)   // was 0x02
const isActive = computed(() => currentStatus.value === 0x24)    // was 0x04
const isCompleted = computed(() => currentStatus.value === 0x28) // was 0x08
const isArchived = computed(() => currentStatus.value === 0x30)  // was 0x10
```

#### Phase 2: Create Migration Script

**File:** `server/database/migrations/035_add_images_projects_status.ts`

```typescript
/**
 * Migration 035: Add Images and Projects Status Entries
 * 
 * Adds status entries for images (0x00-0x1F) and projects (0x20-0x3F)
 * to support useImageStatus and useProjectStatus composables.
 */

import type { DatabaseAdapter } from '../adapter'

export const migration = {
    id: '035_add_images_projects_status',
    description: 'Add status entries for images and projects',

    async up(db: DatabaseAdapter): Promise<void> {
        const isPostgres = db.type === 'postgresql'

        if (!isPostgres) {
            throw new Error('Migration 035 requires PostgreSQL')
        }

        console.log('Running migration 035: Add images and projects status entries...')

        // ===================================================================
        // CHAPTER 1: Add Image Status Entries (0x00-0x1F)
        // ===================================================================
        console.log('\n📖 Chapter 1: Add Image Status Entries')

        const imageStatuses = [
            {
                value: '\\x00',
                name: 'images > raw',
                description: 'Just imported, needs processing',
                name_i18n: { de: 'Roh', en: 'Raw', cz: 'Surový' },
                desc_i18n: { 
                    de: 'Gerade importiert, muss verarbeitet werden', 
                    en: 'Just imported, needs processing', 
                    cz: 'Právě importováno, vyžaduje zpracování' 
                },
                is_default: true
            },
            {
                value: '\\x01',
                name: 'images > processing',
                description: 'Being processed/cropped',
                name_i18n: { de: 'In Bearbeitung', en: 'Processing', cz: 'Zpracovává se' },
                desc_i18n: { 
                    de: 'Wird gerade bearbeitet/zugeschnitten', 
                    en: 'Being processed/cropped', 
                    cz: 'Probíhá zpracování/ořezávání' 
                },
                is_default: false
            },
            {
                value: '\\x02',
                name: 'images > approved',
                description: 'Ready for use',
                name_i18n: { de: 'Freigegeben', en: 'Approved', cz: 'Schváleno' },
                desc_i18n: { 
                    de: 'Bereit zur Verwendung', 
                    en: 'Ready for use', 
                    cz: 'Připraveno k použití' 
                },
                is_default: false
            },
            {
                value: '\\x04',
                name: 'images > published',
                description: 'Actively used in projects',
                name_i18n: { de: 'Veröffentlicht', en: 'Published', cz: 'Zveřejněno' },
                desc_i18n: { 
                    de: 'Aktiv in Projekten verwendet', 
                    en: 'Actively used in projects', 
                    cz: 'Aktivně používáno v projektech' 
                },
                is_default: false
            },
            {
                value: '\\x08',
                name: 'images > deprecated',
                description: 'Old/outdated, not recommended',
                name_i18n: { de: 'Veraltet', en: 'Deprecated', cz: 'Zastaralé' },
                desc_i18n: { 
                    de: 'Alt/veraltet, nicht empfohlen', 
                    en: 'Old/outdated, not recommended', 
                    cz: 'Staré/zastaralé, nedoporučeno' 
                },
                is_default: false
            },
            {
                value: '\\x10',
                name: 'images > archived',
                description: 'Removed from active use',
                name_i18n: { de: 'Archiviert', en: 'Archived', cz: 'Archivováno' },
                desc_i18n: { 
                    de: 'Aus aktiver Nutzung entfernt', 
                    en: 'Removed from active use', 
                    cz: 'Odstraněno z aktivního používání' 
                },
                is_default: false
            }
        ]

        let imageCount = 0
        for (const status of imageStatuses) {
            try {
                const pgValue = status.value.replace(/\\\\/g, '\\')
                await db.exec(`
                    INSERT INTO sysreg_status (value, name, description, tagfamily, taglogic, is_default, name_i18n, desc_i18n)
                    VALUES (
                        '${pgValue}'::bytea, 
                        '${status.name}', 
                        '${status.description}', 
                        'status', 
                        'category', 
                        ${status.is_default},
                        '${JSON.stringify(status.name_i18n)}'::jsonb,
                        '${JSON.stringify(status.desc_i18n)}'::jsonb
                    )
                    ON CONFLICT (value, tagfamily) DO NOTHING
                `)
                imageCount++
            } catch (error) {
                console.warn(`    ⚠️  Skipped duplicate: ${status.name}`)
            }
        }

        console.log(`    ✓ Inserted ${imageCount} image status entries`)

        // ===================================================================
        // CHAPTER 2: Add Project Status Entries (0x20-0x3F)
        // ===================================================================
        console.log('\n📖 Chapter 2: Add Project Status Entries')

        const projectStatuses = [
            {
                value: '\\x20',
                name: 'projects > idea',
                description: 'Initial concept, not yet planned',
                name_i18n: { de: 'Idee', en: 'Idea', cz: 'Nápad' },
                desc_i18n: { 
                    de: 'Erstes Konzept, noch nicht geplant', 
                    en: 'Initial concept, not yet planned', 
                    cz: 'Počáteční koncept, zatím neplánováno' 
                },
                is_default: true
            },
            {
                value: '\\x21',
                name: 'projects > draft',
                description: 'Being planned/drafted',
                name_i18n: { de: 'Entwurf', en: 'Draft', cz: 'Koncept' },
                desc_i18n: { 
                    de: 'Wird gerade geplant/entworfen', 
                    en: 'Being planned/drafted', 
                    cz: 'Probíhá plánování/návrh' 
                },
                is_default: false
            },
            {
                value: '\\x22',
                name: 'projects > planned',
                description: 'Scheduled and approved',
                name_i18n: { de: 'Geplant', en: 'Planned', cz: 'Plánováno' },
                desc_i18n: { 
                    de: 'Geplant und genehmigt', 
                    en: 'Scheduled and approved', 
                    cz: 'Naplánováno a schváleno' 
                },
                is_default: false
            },
            {
                value: '\\x24',
                name: 'projects > active',
                description: 'Currently running',
                name_i18n: { de: 'Aktiv', en: 'Active', cz: 'Aktivní' },
                desc_i18n: { 
                    de: 'Läuft gerade', 
                    en: 'Currently running', 
                    cz: 'Právě probíhá' 
                },
                is_default: false
            },
            {
                value: '\\x28',
                name: 'projects > completed',
                description: 'Successfully finished',
                name_i18n: { de: 'Abgeschlossen', en: 'Completed', cz: 'Dokončeno' },
                desc_i18n: { 
                    de: 'Erfolgreich abgeschlossen', 
                    en: 'Successfully finished', 
                    cz: 'Úspěšně dokončeno' 
                },
                is_default: false
            },
            {
                value: '\\x30',
                name: 'projects > archived',
                description: 'Historical record',
                name_i18n: { de: 'Archiviert', en: 'Archived', cz: 'Archivováno' },
                desc_i18n: { 
                    de: 'Historischer Datensatz', 
                    en: 'Historical record', 
                    cz: 'Historický záznam' 
                },
                is_default: false
            }
        ]

        let projectCount = 0
        for (const status of projectStatuses) {
            try {
                const pgValue = status.value.replace(/\\\\/g, '\\')
                await db.exec(`
                    INSERT INTO sysreg_status (value, name, description, tagfamily, taglogic, is_default, name_i18n, desc_i18n)
                    VALUES (
                        '${pgValue}'::bytea, 
                        '${status.name}', 
                        '${status.description}', 
                        'status', 
                        'category', 
                        ${status.is_default},
                        '${JSON.stringify(status.name_i18n)}'::jsonb,
                        '${JSON.stringify(status.desc_i18n)}'::jsonb
                    )
                    ON CONFLICT (value, tagfamily) DO NOTHING
                `)
                projectCount++
            } catch (error) {
                console.warn(`    ⚠️  Skipped duplicate: ${status.name}`)
            }
        }

        console.log(`    ✓ Inserted ${projectCount} project status entries`)

        // ===================================================================
        // CHAPTER 3: Verification
        // ===================================================================
        console.log('\n📖 Chapter 3: Verification')

        const totalStatuses = await db.get(`
            SELECT COUNT(*) as count FROM sysreg_status
        `, [])

        console.log(`    Total status entries: ${(totalStatuses as any).count}`)

        console.log('\n✅ Migration 035 completed successfully')
    },

    async down(db: DatabaseAdapter): Promise<void> {
        console.log('\n⏪ Rolling back Migration 035: Remove images and projects status entries')

        const isPostgres = db.type === 'postgresql'

        if (!isPostgres) {
            throw new Error('Migration 035 rollback requires PostgreSQL')
        }

        // Remove image statuses
        await db.exec(`
            DELETE FROM sysreg_status 
            WHERE name LIKE 'images > %' 
            AND value IN ('\\x00'::bytea, '\\x01'::bytea, '\\x02'::bytea, 
                          '\\x04'::bytea, '\\x08'::bytea, '\\x10'::bytea)
        `)

        // Remove project statuses
        await db.exec(`
            DELETE FROM sysreg_status 
            WHERE name LIKE 'projects > %' 
            AND value IN ('\\x20'::bytea, '\\x21'::bytea, '\\x22'::bytea, 
                          '\\x24'::bytea, '\\x28'::bytea, '\\x30'::bytea)
        `)

        console.log('✅ Migration 035 rolled back successfully')
    }
}
```

#### Phase 3: Update Existing Data (If Needed)

If there are already images or projects in the database with status values in the 0x00-0x1F range, they need to be migrated:

```sql
-- Migrate existing project status values to new range
UPDATE projects 
SET status_val = '\x20'::bytea 
WHERE status_val = '\x00'::bytea;  -- idea

UPDATE projects 
SET status_val = '\x21'::bytea 
WHERE status_val = '\x01'::bytea;  -- draft

-- etc.
```

---

## Summary

### What's Needed

1. **Add 6 image status entries** to `sysreg_status`
2. **Add 6 project status entries** to `sysreg_status`
3. **Update composables** to use correct BYTEA values
4. **Migrate existing data** (if any projects/images already exist)

### Why This Is Necessary

- ✅ Composables expect specific BYTEA values for status checks
- ✅ Current sysreg_status table only has migrated legacy entries
- ✅ Without these entries, `useImageStatus` and `useProjectStatus` won't work correctly
- ✅ Status labels won't appear in UI dropdowns

### Entity Value Range Allocation

| Entity | Value Range | Hex Range | Status Count |
|--------|-------------|-----------|--------------|
| Images | 0-31 | 0x00-0x1F | 6 statuses |
| Projects | 32-63 | 0x20-0x3F | 6 statuses |
| Events | 64-95 | 0x40-0x5F | ~4 statuses |
| Posts | 96-127 | 0x60-0x7F | ~4 statuses |
| Tasks | 128-159 | 0x80-0x9F | 7 statuses |
| Users | 160-191 | 0xA0-0xBF | Reserved |
| Interactions | 192-223 | 0xC0-0xDF | Reserved |
| (Future) | 224-255 | 0xE0-0xFF | Reserved |

---

## Next Steps

1. **Review this report** with team
2. **Approve Option 1** (Entity-Specific Value Ranges) or discuss alternatives
3. **Create migration 035** as specified above
4. **Update composables** with new value ranges
5. **Run migration** on development database
6. **Test composables** with new values
7. **Deploy to production**

---

**Contact:** See project maintainers for questions  
**References:**
- [SYSREG_SYSTEM.md](../SYSREG_SYSTEM.md)
- `src/composables/useImageStatus.ts`
- `src/composables/useProjectStatus.ts`
- `server/database/migrations/022_create_sysreg.ts`
