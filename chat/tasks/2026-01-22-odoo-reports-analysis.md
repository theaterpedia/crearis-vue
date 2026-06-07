# Analysis: Odoo Reports vs v0.5 Strategy

**Date:** January 22, 2026  
**Context:** Comparing 10 files from chat/reports (2025-12-20 to 2025-12-22) with today's strategic decisions

---

## Executive Summary

The Odoo implementation reports reveal a **multi-subdomain architecture** where each participant experience (product) runs on its own website. This aligns strongly with **Strategy C (Participant Journey)** and confirms the **3-5 presets model**. Key insight: Odoo "products" + "course participations" map directly to our "workflow presets" concept.

---

## The 10 Files: Quick Reference

| # | File | Purpose |
|---|------|---------|
| 1 | [crearis_agenda_implementation](../reports/2025-12-20-crearis_agenda_implementation.md) | SharePoint ↔ Odoo sync architecture |
| 2 | [action_plan_3_modules](../reports/2025-12-21-action_plan_3_modules.md) | 3 Odoo modules: `crearis`, `crearis_agenda`, `agenda_dasei` |
| 3 | [crearis_agenda_code_implementation](../reports/2025-12-21-crearis_agenda_code_implementation.md) | Grundkurs two-checkout model code |
| 4 | [crearis_architecture_findings](../reports/2025-12-21-crearis_architecture_findings.md) | Existing Odoo patterns, `use_*` flags, JSONB |
| 5 | [dasei_team_report_de](../reports/2025-12-21-dasei_team_report_de.md) | German team docs for Grundkurs |
| 6 | [grundkurs_pricing_report](../reports/2025-12-21-grundkurs_pricing_report.md) | Business logic, pricing, Odoo data model |
| 7 | [imaginations_grundlagenkurs](../reports/2025-12-21-imaginations_grundlagenkurs.md) | 3 UI/UX scenarios for participant experience |
| 8 | [dev_docs_agenda_dasei](../reports/2025-12-22-dev_docs_agenda_dasei.md) | DASEi-specific partner sync, domaincode mapping |
| 9 | [dev_docs_crearis_agenda](../reports/2025-12-22-dev_docs_crearis_agenda.md) | Version-controlled sync engine |
| 10 | [grouping_dasei](../reports/2025-12-22-grouping_dasei.md) | Course products, module grouping |

---

## Key Discovery: Multi-Subdomain Architecture

From [dev_docs_agenda_dasei](../reports/2025-12-22-dev_docs_agenda_dasei.md):

```
| Domaincode | URL                    | Purpose                    | Priority |
|------------|------------------------|----------------------------|----------|
| dasei      | verein.dasei.eu        | Vereinsmitglieder          | 100      |
| dasei3     | aufbaustufe.dasei.eu   | Aufbaustufe (ZR/ZT)        | 30       |
| dasei2     | grundstufe.dasei.eu    | Grundstufe (M/N)           | 20       |
| dasei1     | einstiege.dasei.eu     | Einstiege (ME/NE)          | 10       |
| dasei0     | login.dasei.eu         | Quick entry                | 1        |
```

**This means:** Each participant journey phase has its own subdomain/website. The dashboard on each subdomain only serves ONE product type.

---

## Mapping to Our 4 Strategies

### Strategy A: "Der Veranstaltungsleiter" (Instructor-centric)
- **In reports:** Not primary focus
- **Relevance:** Instructors exist but are synced from SharePoint, not the workflow driver
- **Verdict:** ❌ Does not match DASEI model

### Strategy B: "Vorlage & Instanz" (Template→Instance)
- **In reports:** YES - strongly present
  - `event.type` (templates from `plan_veranstaltungscodes`)
  - `event.event` (instances with sessions)
  - SharePoint-driven template codes (A0, A1, B1, etc.)
- **Relevance:** Used for DASEI's 100+ course templates
- **Verdict:** ✅ **Part of DASEI extension**, not default

### Strategy C: "Die Teilnehmerreise" (Participant Journey)
- **In reports:** DOMINANT pattern
  - 5 customer states: Visitor → Interested → Participant → Qualified → Enrolled
  - Progress tracking via `completed_modules`
  - Qualification gates (2+ sessions + consultation)
  - State-based content visibility
- **Relevance:** The "imaginations" doc presents 3 scenarios all based on journey
- **Verdict:** ✅ **CONFIRMED as primary strategy**

### Strategy D: "Die Projekt-Choreographie" (Project orchestration)
- **In reports:** Partially - website-level feature flags
  - `use_tracks`, `use_sessions`, `use_products` etc.
  - Website = project in crearis-vue context
- **Relevance:** Project-level config enables/disables features
- **Verdict:** ✅ **Complements C** - project gates what journey features are active

---

## Mapping to 3-5 Presets Concept

The reports reveal that DASEI already implements "presets" via:

### 1. Course Products (from SharePoint contacts with FullName="_...")

| Product ID | Name | Type | → Preset Equivalent |
|------------|------|------|---------------------|
| 530 | M18_Blockprogramm München | Multi-session course | **Kursserie** |
| 534 | M18_Tageskurs München | Day workshops | **Einfach** |
| 512 | Profil ZR 2026-2028 | Advanced certification | **Institution** |

### 2. Website Feature Flags (from architecture_findings)

```python
# Already exists on website model
use_msteams = fields.Boolean()
use_jitsi = fields.Boolean()
use_template_codes = fields.Boolean()  # ← Template strategy
use_tracks = fields.Boolean()           # ← Nested events (conferences)
use_products = fields.Boolean()         # ← E-commerce checkout
use_sessions = fields.Boolean()         # ← Repeating events (courses)
```

**This IS the preset system!** A website's `use_*` flags define what capabilities are active.

### Proposed Preset Mapping

| Preset | use_sessions | use_tracks | use_template_codes | use_products |
|--------|--------------|------------|--------------------|--------------| 
| **Einfach** | ❌ | ❌ | ❌ | ❌ |
| **Kursserie** | ✅ | ❌ | ❌ | ✅ |
| **Konferenz** | ❌ | ✅ | ❌ | ✅ |
| **Workshop-Reihe** | ✅ | ❌ | ✅ | ✅ |
| **Institution** | ✅ | ✅ | ✅ | ✅ |

---

## The "Imaginations" Document: 3 UI Scenarios

From [imaginations_grundlagenkurs](../reports/2025-12-21-imaginations_grundlagenkurs.md):

### Scenario 1: "Linear Progression"
- State-based content visibility
- Info call required before pricing shown
- High-touch, guided journey
- **Maps to:** Premium/Institution preset

### Scenario 2: "Open Catalog"
- All information public
- Sequential booking enforced by checkout rules
- Low friction, self-service
- **Maps to:** Einfach/Kursserie preset

### Scenario 3: (Implied hybrid)
- Combination of visible info + gated actions
- **Maps to:** Workshop-Reihe preset

---

## Participant States (Confirmed by Reports)

From imaginations, the 5 states map to our user status system:

| DASEI State | Description | → crearis-vue Status | sysreg bit |
|-------------|-------------|---------------------|------------|
| VISITOR | Not logged in | - | - |
| INTERESTED | After info call | NEW | 1 |
| PARTICIPANT | Booked Modul A | DRAFT | 64 |
| QUALIFIED | 2+ sessions + consultation | CONFIRMED_USER | 1024 |
| ENROLLED | Booked continuation | RELEASED | 4096 |

**This directly implements Strategy C!**

---

## Key Concepts to Port to crearis-vue

### 1. domaincode = project in crearis-vue
- Each subdomain has its own dashboard
- One product/workflow per dashboard
- Partner's `dasei_domaincode` = which dashboard they see

### 2. Course Participation = project_members + capabilities
- `dasei.course.participation` tracks partner ↔ course
- `completed_modules` computed from event registrations
- `qualified_for_continuation` = capability check

### 3. Two-Checkout Model = staged capabilities
- Checkout 1: Entry (always available)
- Checkout 2: Continuation (capability-gated)
- Cancellation rules = time-based capability windows

### 4. Module Groups = Progress milestones
- A, B, C, D, E, F for Grundstufe
- Progress unlocks next capabilities

---

## Conflicts/Gaps Identified

### 1. Gap: crearis-vue has no "product" concept yet
- **Odoo:** `product.template` with `course_program`, `course_type`
- **crearis-vue:** Only `projects`, no sub-products
- **Resolution:** Use `event_type` or create `project_products` table?

### 2. Gap: No qualification tracking in crearis-vue
- **Odoo:** `qualified_for_continuation` computed field
- **crearis-vue:** `partner_types` bitmask is too simple
- **Resolution:** Add `project_member_progress` or use sysreg_config capabilities

### 3. Conflict: Who drives templates?
- **DASEI:** SharePoint → Odoo → crearis-vue (3-way sync)
- **Newcomers:** crearis-vue only (no SharePoint)
- **Resolution:** Template layer is optional extension, not default

### 4. Gap: Multi-subdomain routing
- **DASEI:** 5 subdomains, partner routed by `dasei_domaincode`
- **crearis-vue:** Single domain, projects via `/projects/:id`
- **Resolution:** Add `user.default_project` based on highest capability?

---

## Recommendations for v0.5

### Immediate (This Sprint)

1. **Confirm Strategy C as primary** ✅ (done today)

2. **Map website `use_*` flags to sysreg_config presets**
   - Create `sysreg_config` entries for each `use_*` flag
   - Project owner selects preset → flags auto-set

3. **Implement participant states in StartPage/useAuth**
   - Align user status values with journey states
   - State gates dashboard content visibility

### Deferred (v0.6+)

4. **Multi-subdomain routing** (if needed for DASEI-like setups)

5. **Qualification tracking** via `project_member_progress`

6. **Product sub-types** within projects

---

## Decision Matrix: Today's Assumptions vs Reports

| Assumption | Report Confirms? | Notes |
|------------|------------------|-------|
| Strategy C is primary | ✅ YES | 5 customer states in imaginations |
| 3-5 presets model | ✅ YES | `use_*` flags already exist on website |
| DASEI = edge case | ✅ YES | Needs 3 extra modules, SharePoint sync |
| Newcomers = simple | ✅ YES | Scenario 2 "Open Catalog" fits |
| 80/20 user split | ✅ YES | Institution preset is advanced |
| Participant journey universal | ✅ YES | All scenarios use journey states |

---

## Next Steps

1. **Review this analysis** with today's strategy decisions
2. **Map `use_*` flags** to specific sysreg_config capabilities
3. **Create preset definitions** with flag combinations
4. **Update User States** to match journey states

---

*Analysis based on: crearis_agenda_implementation.md, action_plan_3_modules.md, crearis_agenda_code_implementation.md, crearis_architecture_findings.md, dasei_team_report_de.md, grundkurs_pricing_report.md, imaginations_grundlagenkurs.md, dev_docs_agenda_dasei.md, dev_docs_crearis_agenda.md, grouping_dasei.md*
