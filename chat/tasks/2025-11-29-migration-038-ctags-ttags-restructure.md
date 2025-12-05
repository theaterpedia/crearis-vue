# Migration 038: Restructure ctags and ttags

**Date:** 2025-11-29  
**Status:** ✅ COMPLETE  
**Priority:** HIGH  
**Migration File:** `server/database/migrations/038_ctags_ttags_restructure.ts`

---

## Overview

Complete restructure of `ctags` (Common Tags) and `ttags` (Topic Tags) with new semantic organization:

- **ctags**: "Ablauf & Struktur" (Process & Structure) - 26 entries
- **ttags**: "Themen & Ziele" (Themes & Goals) - 32 entries

**Executed:** 2025-11-29  
**Total Entries:** 58 sysreg entries created

---

## Pre-Migration Steps

### 1. Backup existing data
```sql
-- Create backup tables
CREATE TABLE backup_sysreg_ctags AS SELECT * FROM sysreg_ctags;
CREATE TABLE backup_sysreg_ttags AS SELECT * FROM sysreg_ttags;

-- Check entity usage
SELECT COUNT(*) as posts_with_ctags FROM posts WHERE ctags IS NOT NULL AND ctags != 0;
SELECT COUNT(*) as posts_with_ttags FROM posts WHERE ttags IS NOT NULL AND ttags != 0;
```

### 2. Clear entity references (if needed)
```sql
-- Reset entity columns to 0 (preserves column, clears values)
UPDATE posts SET ctags = 0 WHERE ctags IS NOT NULL;
UPDATE posts SET ttags = 0 WHERE ttags IS NOT NULL;
UPDATE events SET ctags = 0 WHERE ctags IS NOT NULL;
UPDATE events SET ttags = 0 WHERE ttags IS NOT NULL;
-- Add other entity tables as needed
```

---

## Migration: ctags

### Family Metadata
- **name**: `ctags`
- **label**: `{ "de": "Ablauf & Struktur", "en": "Process & Structure" }`
- **description**: `{ "de": "Organisation, Kommunikation und Altersgruppen", "en": "Organization, communication and age groups" }`

### Bit Allocation

| Group | Bits | Total | Type |
|-------|------|-------|------|
| Realisierung | 0-4 | 5 bits | category + subcategories |
| Format | 5-17 | 13 bits | category + subcategories |
| Altersgruppen | 18-27 | 10 bits | toggle (multiselect) |

**Total: 28 bits used**

---

### Group 1: Realisierung (bits 0-4)

**Description**: Zeitform und Kalenderlogik der Durchführung

| Bit | Name | Value | taglogic | parent_bit | i18n (de) |
|-----|------|-------|----------|------------|-----------|
| 0 | praesenz | 1 | category | null | Präsenz |
| 1 | online | 2 | category | null | Online |
| 2 | hybrid | 4 | category | null | Hybrid (synchron) |
| 3 | hybrid_alternierend | 8 | subcategory | 2 | Alternierend |
| 4 | hybrid_livestream | 16 | subcategory | 2 | Livestream |

**Encoding**: 
- präsenz: 1 bit (no subs)
- online: 1 bit (no subs)  
- hybrid: 3 bits (cat + 2 subs → values 1-3 in 2-bit slot at position 2)

---

### Group 2: Format (bits 5-17)

**Description**: Zeitform und Kalenderlogik der Durchführung

| Bit | Name | Value | taglogic | parent_bit | i18n (de) |
|-----|------|-------|----------|------------|-----------|
| 5 | workshop | 32 | category | null | Workshop (4-8 Std.) |
| 6 | workshop_kurz | 64 | subcategory | 5 | Kurz |
| 7 | workshop_mehrtaegig | 128 | subcategory | 5 | Mehrtägig |
| 8 | kurs | 256 | category | null | Kurs (4-10 Monate) |
| 9 | kurs_kurz | 512 | subcategory | 8 | Kurz |
| 10 | kurs_fortlaufend | 1024 | subcategory | 8 | Fortlaufend |
| 11 | projekt | 2048 | category | null | Projekt (5-9 Tage) |
| 12 | projekt_kurz | 4096 | subcategory | 11 | Kurz |
| 13 | projekt_mehrphasig | 8192 | subcategory | 11 | Mehrphasig |
| 14 | konferenz | 16384 | category | null | Konferenz |
| 15 | sonstige | 32768 | category | null | Sonstige |

**Note**: Bits 16-17 reserved for future Format expansion

---

### Group 3: Altersgruppen (bits 18-27)

**Description**: Altersstruktur der Teilnehmer:innen

| Bit | Name | Value | taglogic | i18n (de) |
|-----|------|-------|----------|-----------|
| 18 | age_3_6 | 262144 | toggle | 3-6 (Kindergartenalter) |
| 19 | age_6_9 | 524288 | toggle | 6-9 (Grundschulalter) |
| 20 | age_9_12 | 1048576 | toggle | 9-12 (späte Kindheit) |
| 21 | age_12_15 | 2097152 | toggle | 12-15 (frühe Jugend) |
| 22 | age_15_18 | 4194304 | toggle | 15-18 (Jugend) |
| 23 | age_18_25 | 8388608 | toggle | 18-25 (Ausbildungsphase) |
| 24 | age_25_40 | 16777216 | toggle | 25-40 (30er) |
| 25 | age_40_55 | 33554432 | toggle | 40-55 (40er) |
| 26 | age_55_70 | 67108864 | toggle | 55-70 (60er) |
| 27 | age_70_99 | 134217728 | toggle | 70-99 (Ü70) |

---

## Migration: ttags

### Family Metadata
- **name**: `ttags`
- **label**: `{ "de": "Themen & Ziele", "en": "Themes & Goals" }`
- **description**: `{ "de": "Thematische Rahmung, beteiligte Zielgruppen, gesellschaftliche Diskurse", "en": "Thematic framing, target groups, societal discourse" }`

### Bit Allocation

| Group | Bits | Total | Type |
|-------|------|-------|------|
| Medium | 0-9 | 10 bits | toggle (multiselect) |
| Themenfelder | 10-30 | 21 bits | category + subcategories (multiselect categories) |

**Total: 31 bits used**

---

### Group 1: Medium (bits 0-9)

**Description**: Themenquellen, konkretes Arbeitsmaterial, Arbeitsumfeld

| Bit | Name | Value | taglogic | i18n (de) |
|-----|------|-------|----------|-----------|
| 0 | medium_koerper | 1 | toggle | Körper & Bewegung |
| 1 | medium_stimme | 2 | toggle | Stimme & Sprache |
| 2 | medium_orte | 4 | toggle | Orte & Räume |
| 3 | medium_geschichte | 8 | toggle | Geschichte |
| 4 | medium_berufe | 16 | toggle | Berufe & gesellschaftliche Rollen |
| 5 | medium_literatur | 32 | toggle | Literatur |
| 6 | medium_kunst | 64 | toggle | Kunst |
| 7 | medium_masken | 128 | toggle | Masken & Kostüm |
| 8 | medium_musik | 256 | toggle | Musik |
| 9 | medium_medien | 512 | toggle | Medien |

---

### Group 2: Themenfelder (bits 10-30)

**Description**: Thematische Schwerpunkte und gesellschaftliche Diskurse

**Note**: Categories have `multiselect = true` (can select multiple categories)

#### Category: Demokratie (bits 10-13, 3 bits for 6 subs)
| Bit(s) | Name | Value | taglogic | parent_bit | i18n (de) |
|--------|------|-------|----------|------------|-----------|
| 10 | demokratie | 1024 | category | null | Demokratie |
| 10-12 | demokratie_zivilcourage | 2048 | subcategory | 10 | Zivilcourage |
| 10-12 | demokratie_soziokultur | 3072 | subcategory | 10 | Soziokultur |
| 10-12 | demokratie_europa | 4096 | subcategory | 10 | Europa |
| 10-12 | demokratie_partizipation | 5120 | subcategory | 10 | Partizipation |
| 10-12 | demokratie_resilienz | 6144 | subcategory | 10 | Resilienz |
| 10-12 | demokratie_minderheiten | 7168 | subcategory | 10 | Minderheiten |

#### Category: Migration (bits 13-15, 2 bits for 3 subs)
| Bit(s) | Name | Value | taglogic | parent_bit | i18n (de) |
|--------|------|-------|----------|------------|-----------|
| 13 | migration | 8192 | category | null | Migration |
| 13-15 | migration_flucht | 16384 | subcategory | 13 | Flucht |
| 13-15 | migration_integration | 24576 | subcategory | 13 | Berufl. Integration |
| 13-15 | migration_sprachfoerderung | 32768 | subcategory | 13 | Sprachförderung |

#### Category: Diversitaet (bits 16-18, 2 bits for 4 subs)
| Bit(s) | Name | Value | taglogic | parent_bit | i18n (de) |
|--------|------|-------|----------|------------|-----------|
| 16 | diversitaet | 65536 | category | null | Diversität |
| 16-18 | diversitaet_gender | 131072 | subcategory | 16 | Gender |
| 16-18 | diversitaet_inklusion | 196608 | subcategory | 16 | Inklusion |
| 16-18 | diversitaet_kulturell | 262144 | subcategory | 16 | Kult. Vielfalt |
| 16-18 | diversitaet_international | 327680 | subcategory | 16 | Intern. Begegnung |

#### Category: Nachhaltigkeit (bits 19-21, 2 bits for 3 subs)
| Bit(s) | Name | Value | taglogic | parent_bit | i18n (de) |
|--------|------|-------|----------|------------|-----------|
| 19 | nachhaltigkeit | 524288 | category | null | Nachhaltigkeit |
| 19-21 | nachhaltigkeit_regional | 1048576 | subcategory | 19 | Regionalität |
| 19-21 | nachhaltigkeit_klima | 1572864 | subcategory | 19 | Klimawandel |
| 19-21 | nachhaltigkeit_generationen | 2097152 | subcategory | 19 | Generationenverhältnis |

#### Category: Digitalitaet (bits 22-24, 2 bits for 4 subs)
| Bit(s) | Name | Value | taglogic | parent_bit | i18n (de) |
|--------|------|-------|----------|------------|-----------|
| 22 | digitalitaet | 4194304 | category | null | Digitalität |
| 22-24 | digitalitaet_sichtbarkeit | 8388608 | subcategory | 22 | Sichtbarkeit |
| 22-24 | digitalitaet_creative_commons | 12582912 | subcategory | 22 | Creative Commons |
| 22-24 | digitalitaet_medienkompetenz | 16777216 | subcategory | 22 | Medienkompetenz |
| 22-24 | digitalitaet_datenschutz | 20971520 | subcategory | 22 | Datenschutz |

---

## sysreg-bitgroups.json Updates

### ctags Configuration
```json
{
  "ctags": {
    "name": "common_tags",
    "label": {
      "de": "Ablauf & Struktur",
      "en": "Process & Structure"
    },
    "description": {
      "de": "Organisation, Kommunikation und Altersgruppen",
      "en": "Organization, communication and age groups"
    },
    "groups": [
      {
        "name": "realisierung",
        "label": { "de": "Realisierung", "en": "Realization" },
        "description": { "de": "Zeitform und Kalenderlogik der Durchführung", "en": "Time form and calendar logic of implementation" },
        "icon": "map-pin",
        "bits": [0, 1, 2, 3, 4],
        "optional": false,
        "multiselect": false
      },
      {
        "name": "format",
        "label": { "de": "Format", "en": "Format" },
        "description": { "de": "Zeitform und Kalenderlogik der Durchführung", "en": "Time form and calendar logic of implementation" },
        "icon": "calendar",
        "bits": [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17],
        "optional": false,
        "multiselect": false
      },
      {
        "name": "altersgruppen",
        "label": { "de": "Altersgruppen", "en": "Age Groups" },
        "description": { "de": "Altersstruktur der Teilnehmer:innen", "en": "Age structure of participants" },
        "icon": "users",
        "bits": [18, 19, 20, 21, 22, 23, 24, 25, 26, 27],
        "optional": true,
        "multiselect": true
      }
    ]
  }
}
```

### ttags Configuration
```json
{
  "ttags": {
    "name": "topic_tags",
    "label": {
      "de": "Themen & Ziele",
      "en": "Themes & Goals"
    },
    "description": {
      "de": "Thematische Rahmung, beteiligte Zielgruppen, gesellschaftliche Diskurse",
      "en": "Thematic framing, target groups, societal discourse"
    },
    "groups": [
      {
        "name": "medium",
        "label": { "de": "Medium", "en": "Medium" },
        "description": { "de": "Themenquellen, konkretes Arbeitsmaterial, Arbeitsumfeld", "en": "Topic sources, concrete work material, work environment" },
        "icon": "palette",
        "bits": [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
        "optional": true,
        "multiselect": true
      },
      {
        "name": "themenfelder",
        "label": { "de": "Themenfelder", "en": "Topic Areas" },
        "description": { "de": "Thematische Schwerpunkte und gesellschaftliche Diskurse", "en": "Thematic focus areas and societal discourse" },
        "icon": "compass",
        "bits": [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24],
        "optional": true,
        "multiselect": true
      }
    ]
  }
}
```

---

## SQL Migration Script

```sql
-- Migration 038: Restructure ctags and ttags
-- Date: 2025-11-29

-- ============================================
-- STEP 1: Clear existing data
-- ============================================

DELETE FROM sysreg_ctags;
DELETE FROM sysreg_ttags;

-- ============================================
-- STEP 2: Insert ctags - Realisierung (bits 0-4)
-- ============================================

INSERT INTO sysreg_ctags (name, value, taglogic, tagfamily, parent_bit, name_i18n, desc_i18n) VALUES
('praesenz', 1, 'category', 'ctags', NULL, 
  '{"de": "Präsenz", "en": "In-Person"}', NULL),
('online', 2, 'category', 'ctags', NULL, 
  '{"de": "Online", "en": "Online"}', NULL),
('hybrid', 4, 'category', 'ctags', NULL, 
  '{"de": "Hybrid (synchron)", "en": "Hybrid (synchronous)"}', NULL),
('hybrid_alternierend', 8, 'subcategory', 'ctags', 2, 
  '{"de": "hybrid > Alternierend", "en": "hybrid > Alternating"}', NULL),
('hybrid_livestream', 16, 'subcategory', 'ctags', 2, 
  '{"de": "hybrid > Livestream", "en": "hybrid > Livestream"}', NULL);

-- ============================================
-- STEP 3: Insert ctags - Format (bits 5-17)
-- ============================================

INSERT INTO sysreg_ctags (name, value, taglogic, tagfamily, parent_bit, name_i18n, desc_i18n) VALUES
('workshop', 32, 'category', 'ctags', NULL, 
  '{"de": "Workshop (4-8 Std.)", "en": "Workshop (4-8 hours)"}', NULL),
('workshop_kurz', 64, 'subcategory', 'ctags', 5, 
  '{"de": "workshop > Kurz", "en": "workshop > Short"}', NULL),
('workshop_mehrtaegig', 128, 'subcategory', 'ctags', 5, 
  '{"de": "workshop > Mehrtägig", "en": "workshop > Multi-day"}', NULL),
('kurs', 256, 'category', 'ctags', NULL, 
  '{"de": "Kurs (4-10 Monate)", "en": "Course (4-10 months)"}', NULL),
('kurs_kurz', 512, 'subcategory', 'ctags', 8, 
  '{"de": "kurs > Kurz", "en": "course > Short"}', NULL),
('kurs_fortlaufend', 1024, 'subcategory', 'ctags', 8, 
  '{"de": "kurs > Fortlaufend", "en": "course > Ongoing"}', NULL),
('projekt', 2048, 'category', 'ctags', NULL, 
  '{"de": "Projekt (5-9 Tage)", "en": "Project (5-9 days)"}', NULL),
('projekt_kurz', 4096, 'subcategory', 'ctags', 11, 
  '{"de": "projekt > Kurz", "en": "project > Short"}', NULL),
('projekt_mehrphasig', 8192, 'subcategory', 'ctags', 11, 
  '{"de": "projekt > Mehrphasig", "en": "project > Multi-phase"}', NULL),
('konferenz', 16384, 'category', 'ctags', NULL, 
  '{"de": "Konferenz", "en": "Conference"}', NULL),
('sonstige', 32768, 'category', 'ctags', NULL, 
  '{"de": "Sonstige", "en": "Other"}', NULL);

-- ============================================
-- STEP 4: Insert ctags - Altersgruppen (bits 18-27)
-- ============================================

INSERT INTO sysreg_ctags (name, value, taglogic, tagfamily, parent_bit, name_i18n, desc_i18n) VALUES
('age_3_6', 262144, 'toggle', 'ctags', NULL, 
  '{"de": "3-6 (Kindergartenalter)", "en": "3-6 (Kindergarten age)"}', NULL),
('age_6_9', 524288, 'toggle', 'ctags', NULL, 
  '{"de": "6-9 (Grundschulalter)", "en": "6-9 (Elementary school age)"}', NULL),
('age_9_12', 1048576, 'toggle', 'ctags', NULL, 
  '{"de": "9-12 (späte Kindheit)", "en": "9-12 (Late childhood)"}', NULL),
('age_12_15', 2097152, 'toggle', 'ctags', NULL, 
  '{"de": "12-15 (frühe Jugend)", "en": "12-15 (Early adolescence)"}', NULL),
('age_15_18', 4194304, 'toggle', 'ctags', NULL, 
  '{"de": "15-18 (Jugend)", "en": "15-18 (Adolescence)"}', NULL),
('age_18_25', 8388608, 'toggle', 'ctags', NULL, 
  '{"de": "18-25 (Ausbildungsphase)", "en": "18-25 (Training phase)"}', NULL),
('age_25_40', 16777216, 'toggle', 'ctags', NULL, 
  '{"de": "25-40 (30er)", "en": "25-40 (30s)"}', NULL),
('age_40_55', 33554432, 'toggle', 'ctags', NULL, 
  '{"de": "40-55 (40er)", "en": "40-55 (40s)"}', NULL),
('age_55_70', 67108864, 'toggle', 'ctags', NULL, 
  '{"de": "55-70 (60er)", "en": "55-70 (60s)"}', NULL),
('age_70_99', 134217728, 'toggle', 'ctags', NULL, 
  '{"de": "70-99 (Ü70)", "en": "70-99 (70+)"}', NULL);

-- ============================================
-- STEP 5: Insert ttags - Medium (bits 0-9)
-- ============================================

INSERT INTO sysreg_ttags (name, value, taglogic, tagfamily, parent_bit, name_i18n, desc_i18n) VALUES
('medium_koerper', 1, 'toggle', 'ttags', NULL, 
  '{"de": "Körper & Bewegung", "en": "Body & Movement"}', NULL),
('medium_stimme', 2, 'toggle', 'ttags', NULL, 
  '{"de": "Stimme & Sprache", "en": "Voice & Language"}', NULL),
('medium_orte', 4, 'toggle', 'ttags', NULL, 
  '{"de": "Orte & Räume", "en": "Places & Spaces"}', NULL),
('medium_geschichte', 8, 'toggle', 'ttags', NULL, 
  '{"de": "Geschichte", "en": "History"}', NULL),
('medium_berufe', 16, 'toggle', 'ttags', NULL, 
  '{"de": "Berufe & gesellschaftliche Rollen", "en": "Professions & Social Roles"}', NULL),
('medium_literatur', 32, 'toggle', 'ttags', NULL, 
  '{"de": "Literatur", "en": "Literature"}', NULL),
('medium_kunst', 64, 'toggle', 'ttags', NULL, 
  '{"de": "Kunst", "en": "Art"}', NULL),
('medium_masken', 128, 'toggle', 'ttags', NULL, 
  '{"de": "Masken & Kostüm", "en": "Masks & Costumes"}', NULL),
('medium_musik', 256, 'toggle', 'ttags', NULL, 
  '{"de": "Musik", "en": "Music"}', NULL),
('medium_medien', 512, 'toggle', 'ttags', NULL, 
  '{"de": "Medien", "en": "Media"}', NULL);

-- ============================================
-- STEP 6: Insert ttags - Themenfelder (bits 10-24)
-- ============================================

-- Demokratie (bits 10-12, 6 subcategories)
INSERT INTO sysreg_ttags (name, value, taglogic, tagfamily, parent_bit, name_i18n, desc_i18n) VALUES
('demokratie', 1024, 'category', 'ttags', NULL, 
  '{"de": "Demokratie", "en": "Democracy"}', NULL),
('demokratie_zivilcourage', 2048, 'subcategory', 'ttags', 10, 
  '{"de": "demokratie > Zivilcourage", "en": "democracy > Civic Courage"}', NULL),
('demokratie_soziokultur', 3072, 'subcategory', 'ttags', 10, 
  '{"de": "demokratie > Soziokultur", "en": "democracy > Socioculture"}', NULL),
('demokratie_europa', 4096, 'subcategory', 'ttags', 10, 
  '{"de": "demokratie > Europa", "en": "democracy > Europe"}', NULL),
('demokratie_partizipation', 5120, 'subcategory', 'ttags', 10, 
  '{"de": "demokratie > Partizipation", "en": "democracy > Participation"}', NULL),
('demokratie_resilienz', 6144, 'subcategory', 'ttags', 10, 
  '{"de": "demokratie > Resilienz", "en": "democracy > Resilience"}', NULL),
('demokratie_minderheiten', 7168, 'subcategory', 'ttags', 10, 
  '{"de": "demokratie > Minderheiten", "en": "democracy > Minorities"}', NULL);

-- Migration (bits 13-15, 3 subcategories)
INSERT INTO sysreg_ttags (name, value, taglogic, tagfamily, parent_bit, name_i18n, desc_i18n) VALUES
('migration', 8192, 'category', 'ttags', NULL, 
  '{"de": "Migration", "en": "Migration"}', NULL),
('migration_flucht', 16384, 'subcategory', 'ttags', 13, 
  '{"de": "migration > Flucht", "en": "migration > Flight"}', NULL),
('migration_integration', 24576, 'subcategory', 'ttags', 13, 
  '{"de": "migration > Berufl. Integration", "en": "migration > Professional Integration"}', NULL),
('migration_sprachfoerderung', 32768, 'subcategory', 'ttags', 13, 
  '{"de": "migration > Sprachförderung", "en": "migration > Language Support"}', NULL);

-- Diversität (bits 16-18, 4 subcategories)
INSERT INTO sysreg_ttags (name, value, taglogic, tagfamily, parent_bit, name_i18n, desc_i18n) VALUES
('diversitaet', 65536, 'category', 'ttags', NULL, 
  '{"de": "Diversität", "en": "Diversity"}', NULL),
('diversitaet_gender', 131072, 'subcategory', 'ttags', 16, 
  '{"de": "diversität > Gender", "en": "diversity > Gender"}', NULL),
('diversitaet_inklusion', 196608, 'subcategory', 'ttags', 16, 
  '{"de": "diversität > Inklusion", "en": "diversity > Inclusion"}', NULL),
('diversitaet_kulturell', 262144, 'subcategory', 'ttags', 16, 
  '{"de": "diversität > Kult. Vielfalt", "en": "diversity > Cultural Diversity"}', NULL),
('diversitaet_international', 327680, 'subcategory', 'ttags', 16, 
  '{"de": "diversität > Intern. Begegnung", "en": "diversity > International Encounter"}', NULL);

-- Nachhaltigkeit (bits 19-21, 3 subcategories)
INSERT INTO sysreg_ttags (name, value, taglogic, tagfamily, parent_bit, name_i18n, desc_i18n) VALUES
('nachhaltigkeit', 524288, 'category', 'ttags', NULL, 
  '{"de": "Nachhaltigkeit", "en": "Sustainability"}', NULL),
('nachhaltigkeit_regional', 1048576, 'subcategory', 'ttags', 19, 
  '{"de": "nachhaltigkeit > Regionalität", "en": "sustainability > Regionality"}', NULL),
('nachhaltigkeit_klima', 1572864, 'subcategory', 'ttags', 19, 
  '{"de": "nachhaltigkeit > Klimawandel", "en": "sustainability > Climate Change"}', NULL),
('nachhaltigkeit_generationen', 2097152, 'subcategory', 'ttags', 19, 
  '{"de": "nachhaltigkeit > Generationenverhältnis", "en": "sustainability > Generational Relations"}', NULL);

-- Digitalität (bits 22-24, 4 subcategories)
INSERT INTO sysreg_ttags (name, value, taglogic, tagfamily, parent_bit, name_i18n, desc_i18n) VALUES
('digitalitaet', 4194304, 'category', 'ttags', NULL, 
  '{"de": "Digitalität", "en": "Digitality"}', NULL),
('digitalitaet_sichtbarkeit', 8388608, 'subcategory', 'ttags', 22, 
  '{"de": "digitalität > Sichtbarkeit", "en": "digitality > Visibility"}', NULL),
('digitalitaet_creative_commons', 12582912, 'subcategory', 'ttags', 22, 
  '{"de": "digitalität > Creative Commons", "en": "digitality > Creative Commons"}', NULL),
('digitalitaet_medienkompetenz', 16777216, 'subcategory', 'ttags', 22, 
  '{"de": "digitalität > Medienkompetenz", "en": "digitality > Media Literacy"}', NULL),
('digitalitaet_datenschutz', 20971520, 'subcategory', 'ttags', 22, 
  '{"de": "digitalität > Datenschutz", "en": "digitality > Data Protection"}', NULL);

-- ============================================
-- STEP 7: Verify counts
-- ============================================

SELECT 'ctags' as family, COUNT(*) as count FROM sysreg_ctags
UNION ALL
SELECT 'ttags' as family, COUNT(*) as count FROM sysreg_ttags;
```

---

## Verification Checklist

- [ ] Backup tables created
- [ ] Entity references cleared (if needed)
- [ ] Old ctags/ttags data deleted
- [ ] New ctags inserted (26 entries)
- [ ] New ttags inserted (32 entries)
- [ ] sysreg-bitgroups.json updated
- [ ] UI displays correctly
- [ ] Editor saves correctly
- [ ] Multiselect works for Altersgruppen
- [ ] Multiselect works for Medium
- [ ] Category multiselect works for Themenfelder

---

## Rollback Plan

```sql
-- Restore from backup
DELETE FROM sysreg_ctags;
DELETE FROM sysreg_ttags;
INSERT INTO sysreg_ctags SELECT * FROM backup_sysreg_ctags;
INSERT INTO sysreg_ttags SELECT * FROM backup_sysreg_ttags;
```

---

## Notes

1. **Themenfelder multiselect**: The categories (Demokratie, Migration, etc.) have `multiselect = true`, meaning multiple categories can be selected simultaneously. This is different from dtags where only one category per group is allowed.

2. **Bit allocation review**: The subcategory values in Themenfelder use 3-bit encoding (for 6 subs) or 2-bit encoding (for 3-4 subs). This needs careful verification.

3. **English translations**: Provided basic English translations - may need review by native speaker.
