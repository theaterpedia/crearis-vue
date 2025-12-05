# DTAGS Bit Encoding Analysis (New Structure)

## Overview
Analyzing the new dtags structure from `2025-11-26-dtags.md` to determine:
1. Bit requirements per category
2. Total bit count (must fit in 32 bits, considering signed bit)
3. Database entry count

## Critical Constraints

### Signed Integer Consideration
- **32-bit signed INTEGER**: Range -2,147,483,648 to 2,147,483,647
- **Bit 31 is the sign bit** (negative flag)
- **Usable bits: 0-30 (31 bits)**
- If we use bit 31, values become negative

### Bit Encoding Formula
- **N bits** = 2^N values
- **Value 0 MUST be reserved** for "not set/empty"
- **Usable values** = 2^N - 1

## TagGroup 1: Spielform (8 bits needed)

### Categories and Subcategories:

1. **Kreisspiele** (2 bits)
   - Category: Kreisspiele
   - Subcategory 1: Kreisspiel > Impulskreis
   - Subcategory 2: Kreisspiel > Synchronkreis
   - **Total**: 3 entries (1 + 2 subcats)

2. **Raumlauf** (2 bits)
   - Category: Raumlauf
   - Subcategory 1: Raumlauf > Einzelgänger
   - Subcategory 2: Raumlauf > Begegnungen
   - **Total**: 3 entries (1 + 2 subcats)

3. **Kleingruppen** (1 bit)
   - Category: Kleingruppen
   - **Total**: 1 entry (no subcategories)

4. **Forum** (3 bits - NEEDS 3 BITS!)
   - Category: Forum
   - Subcategory 1: Forum > Abklatschspiel
   - Subcategory 2: Forum > Werkstattprobe
   - Subcategory 3: Forum > Showing
   - Subcategory 4: Forum > Durchlaufproben
   - **Total**: 5 entries (1 + 4 subcats)
   - **Encoding**: 3 bits = 8 values - 1 = 7 usable values ✅

**TagGroup 1 Total Bits**: 2 + 2 + 1 + 3 = **8 bits** (bits 0-7)
**TagGroup 1 Total Entries**: 3 + 3 + 1 + 5 = **12 entries**

---

## TagGroup 2: Animiertes Theaterspiel (9 bits needed)

### Categories and Subcategories:

1. **El. Animation** (3 bits - NEEDS 3 BITS!)
   - Category: El. Animation (Elementare Animation)
   - Subcategory 1: El. Animation > Zwei-Kreise-Modell
   - Subcategory 2: El. Animation > Variante 2
   - Subcategory 3: El. Animation > Variante 3
   - **Total**: 4 entries (1 + 3 subcats)

2. **Sz. Animation** (2 bits)
   - Category: Sz. Animation (Szenische Animation)
   - Subcategory 1: Sz. Animation > Variante 1
   - Subcategory 2: Sz. Animation > Variante 2
   - **Total**: 3 entries (1 + 2 subcats)

3. **Impro** (1 bit)
   - Category: Impro (klass. Improtheater)
   - **Total**: 1 entry (no subcategories)

4. **animiert** (2 bits)
   - Category: animiert (animierte Kurzprojekte)
   - Subcategory 1: animiert > SAFARI
   - Subcategory 2: animiert > Variante 2
   - **Total**: 3 entries (1 + 2 subcats)

**TagGroup 2 Total Bits**: 3 + 2 + 1 + 2 = **8 bits** (bits 8-15)
**TagGroup 2 Total Entries**: 4 + 3 + 1 + 3 = **11 entries**

---

## TagGroup 3: Szenische Themenarbeit (11 bits needed)

### Categories and Subcategories:

1. **Standbilder** (3 bits - NEEDS 3 BITS!)
   - Category: Standbilder (stehende Verfahren)
   - Subcategory 1: Standbilder > variante 1
   - Subcategory 2: Standbilder > variante 2
   - Subcategory 3: Standbilder > variante 3
   - **Total**: 4 entries (1 + 3 subcats)

2. **Rollenspiel** (3 bits - NEEDS 3 BITS!)
   - Category: Rollenspiel (Päd. Rollenspiel)
   - Subcategory 1: Rollenspiel > variante 1
   - Subcategory 2: Rollenspiel > variante 2
   - Subcategory 3: Rollenspiel > variante 3
   - **Total**: 4 entries (1 + 3 subcats)

3. **TdU** (2 bits)
   - Category: TdU (Theater der Unterdrückten)
   - Subcategory 1: TdU > Forumtheater
   - Subcategory 2: TdU > Regenbogen der Wünsche
   - **Total**: 3 entries (1 + 2 subcats)

4. **Soziometrie** (1 bit)
   - Category: Soziometrie
   - **Total**: 1 entry (no subcategories)

5. **bewegte Themenarbeit** (1 bit)
   - Category: bewegte Themenarbeit (Beschreibung bewegte Themenarbeit & Jeux dramatiques)
   - **Total**: 1 entry (no subcategories)

**TagGroup 3 Total Bits**: 3 + 3 + 2 + 1 + 1 = **10 bits** (bits 16-25)
**TagGroup 3 Total Entries**: 4 + 4 + 3 + 1 + 1 = **13 entries**

---

## TagGroup 4: Pädagogische Regie (8 bits needed)

### Categories and Subcategories:

1. **zyklisch** (3 bits - NEEDS 3 BITS!)
   - Category: zyklisch (postdramatisch-performative Projektarbeit & zyklische Produktionsprozesse)
   - Subcategory 1: zyklisch > RSVP-Zyklus-Modell
   - Subcategory 2: zyklisch > variante 2
   - Subcategory 3: zyklisch > Theatrales Mischpult
   - **Total**: 4 entries (1 + 3 subcats)

2. **linear** (2 bits)
   - Category: linear (episch-dramatische Projektarbeit & lineare Inszenierungskonzepte)
   - Subcategory 1: linear > 7-Tage-Modell
   - Subcategory 2: linear > variante 2
   - **Total**: 3 entries (1 + 2 subcats)

3. **klassisch** (1 bit)
   - Category: klassisch (klassisches Schul- & Amateurtheater)
   - **Total**: 1 entry (no subcategories)

**TagGroup 4 Total Bits**: 3 + 2 + 1 = **6 bits** (bits 26-31)
**TagGroup 4 Total Entries**: 4 + 3 + 1 = **8 entries**

---

## TOTAL BIT COUNT

### Bit Allocation:
- **TagGroup 1 (Spielform)**: bits 0-7 (8 bits)
- **TagGroup 2 (Animiertes Theaterspiel)**: bits 8-15 (8 bits)
- **TagGroup 3 (Szenische Themenarbeit)**: bits 16-25 (10 bits)
- **TagGroup 4 (Pädagogische Regie)**: bits 26-31 (6 bits)

**TOTAL BITS REQUIRED: 32 bits (0-31)**

### ⚠️ CRITICAL ISSUE: Bit 31 is the SIGN BIT!

**Problem**: Using bit 31 will make values negative.

**Example**:
```
Value with bit 31 set:
Binary: 10000000 00000000 00000000 00000000
Decimal: -2,147,483,648 (negative!)
```

### SOLUTION OPTIONS:

#### Option 1: Reduce TagGroup 4 by 1 bit (RECOMMENDED)
- TagGroup 4: Use bits 26-30 (5 bits instead of 6)
- Keep "klassisch" as 1 bit
- Reduce one of: zyklisch (3→2 bits) or linear (2→1 bit)
- **Total: 31 bits (safe, no negative values)**

#### Option 2: Use BIGINT instead of INTEGER
- Allows 63 usable bits (bit 63 is sign)
- **Breaks existing database schema**
- Requires migration of all existing data

#### Option 3: Use bit 31 and handle negative values
- Accept that some combinations will be negative
- **Complicates UI, API, and database queries**
- NOT RECOMMENDED

---

## TOTAL DATABASE ENTRIES

- **TagGroup 1**: 12 entries
- **TagGroup 2**: 11 entries
- **TagGroup 3**: 13 entries
- **TagGroup 4**: 8 entries

**GRAND TOTAL: 44 dtags entries**

---

## RECOMMENDATION

### Reduce TagGroup 4 to fit in 31 bits:

**Option A: Reduce "zyklisch" from 3 subcategories to 2**
```
- zyklisch (2 bits instead of 3)
  - Category: zyklisch
  - Subcategory 1: zyklisch > RSVP-Zyklus-Modell
  - Subcategory 2: zyklisch > Theatrales Mischpult (combine variante 2 into this)
```
**Result**: TagGroup 4 = 5 bits (26-30), safe from sign bit

**Option B: Reduce "linear" from 2 subcategories to 1**
```
- linear (1 bit instead of 2)
  - Category: linear (combine both variants into category-only)
```
**Result**: TagGroup 4 = 5 bits (26-30), safe from sign bit

**Option C: Make TagGroup 4 optional, reduce bits**
- Keep current structure but warn users
- Document that selecting "zyklisch" + "linear" simultaneously may cause negative values

---

## Configuration Structure Needed

```json
"dtags": {
  "groups": [
    {
      "name": "spielform",
      "bits": [0, 1, 2, 3, 4, 5, 6, 7],
      "categories": [
        { "name": "kreisspiele", "bits": [0, 1], "has_subcategories": true },
        { "name": "raumlauf", "bits": [2, 3], "has_subcategories": true },
        { "name": "kleingruppen", "bits": [4], "has_subcategories": false },
        { "name": "forum", "bits": [5, 6, 7], "has_subcategories": true }
      ]
    },
    {
      "name": "animiertes_theaterspiel",
      "bits": [8, 9, 10, 11, 12, 13, 14, 15],
      "categories": [
        { "name": "el_animation", "bits": [8, 9, 10], "has_subcategories": true },
        { "name": "sz_animation", "bits": [11, 12], "has_subcategories": true },
        { "name": "impro", "bits": [13], "has_subcategories": false },
        { "name": "animiert", "bits": [14, 15], "has_subcategories": true }
      ]
    },
    {
      "name": "szenische_themenarbeit",
      "bits": [16, 17, 18, 19, 20, 21, 22, 23, 24, 25],
      "categories": [
        { "name": "standbilder", "bits": [16, 17, 18], "has_subcategories": true },
        { "name": "rollenspiel", "bits": [19, 20, 21], "has_subcategories": true },
        { "name": "tdu", "bits": [22, 23], "has_subcategories": true },
        { "name": "soziometrie", "bits": [24], "has_subcategories": false },
        { "name": "bewegte_themenarbeit", "bits": [25], "has_subcategories": false }
      ]
    },
    {
      "name": "paedagogische_regie",
      "bits": [26, 27, 28, 29, 30],  // 5 bits, NOT 6!
      "optional": true,
      "categories": [
        { "name": "zyklisch", "bits": [26, 27], "has_subcategories": true },  // REDUCED to 2 bits
        { "name": "linear", "bits": [28, 29], "has_subcategories": true },
        { "name": "klassisch", "bits": [30], "has_subcategories": false }
      ]
    }
  ]
}
```

---

## NEXT STEPS

1. **DECIDE**: Which TagGroup 4 reduction strategy to use (A, B, or C)
2. **UPDATE**: `sysreg-bitgroups.json` with correct bit allocations
3. **REVERT**: Migration 037
4. **CREATE**: New migration with corrected structure
5. **UPDATE**: All 44 dtags entries to `sysreg_dtags` table
6. **VERIFY**: Tests still pass (if well-designed, they should!)
