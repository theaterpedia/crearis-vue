# Deferred Tasks for v1.1

**Version Focus:** Future / Nice-to-Have  
**Target:** Post-v1.0 (2026+)

---

## Core v1.1 Scope

### FormatOptions System Extension (Target: 2.0)
- [ ] **Extend header_configs pattern to all 4 chapters**
  - Rename `header_configs` → `format_configs` with `chapter` column
  - Rename `project_header_overrides` → `project_format_overrides`
  - Add presets for aside/footer/page chapters
  - Consider bit-encoding once schema finalized
- [ ] **Aside chapter presets**: TOC modes, list types, context templates
- [ ] **Footer chapter presets**: Gallery/slider combos, sitemap modes
- [ ] **Page chapter presets**: Navigation modes, background themes
- Note: Header chapter completed in v1.0 (migration 067), serves as reference
- See: `chat/reports/2025-12-15-formatoptions-system-analysis.md`

### Null Workitem Audit
- [ ] **Check for null-workitems**: Audit system for workitems without creator
  - Note: Likely never needed - prefer Odoo-style system users (e.g., 'bot' user)
  - Decision: Always require creator, use system users instead of NULL

### Config System
- [ ] Entity-level config override: Per-record config field overriding project config
- [ ] Config owner role: Extend owner detection to support 'config owner'

### Entity Bits Expansion
- [ ] Entity bit 5 (reserved): Use for more detailed entity sub-types

### Workflow
- [ ] Task delegation system: Allow members to delegate blocked actions to owner
  - "Ask owner to trash this" button in status editor
  - Task record stores proposed changes for owner review

---

## Notes

- These are post-v1.0 features
- May be promoted to earlier versions based on priority
