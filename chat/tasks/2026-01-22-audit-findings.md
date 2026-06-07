

# Audit Findings - Thursday Morning Session

**Status:** ✅ Reviewed and decisions integrated into [thursday.md](./2026-01-22_thursday.md)

---

## Findings after reading the docs from the thursday-doc

### 1. Events Admin Next Actions ✅ DECIDED
- We should NOT start working on 'blocks' / 'blocks editor' before v1.0-release
- Sessions prioritized over tracks
- Events Admin = perfect starting point: connects to Odoo, functional UI, quick showcase

### 9. XMLID Convention ✅ ALREADY DONE
- **Format:** `{domaincode}.{entity}__{slug}` (double underscore)
- **Implemented:** Dec 17, 2025
- **Files:** `src/utils/xmlid.ts`, `server/database/migrations/069_xmlid_format_migration.ts`
- **Reference:** [2025-12-17-XMLID_UNIFICATION.md](./2025-12-17-XMLID_UNIFICATION.md)

### 5. User States Validation ✅ DECIDED
Simplified model:
- Team users: `CONFIRMED_USER (1024)` required to process things
- Team with public profile: `RELEASED (4096)`
- Participants: `CONFIRMED_USER (1024)` default, `NEW (1)` = special case
- Draft users: Very limited (only own profile + UI settings)

---

## Findings after reading Odoo-reports-analysis

### 1. Strategy C Participant Journey ✅ CONFIRMED
This is decided now!

**Simplification:** No 'products' in crearis-vue needed.
- Each DASEI subdomain = one product (website itself is the product)
- Product filtering done by Odoo
- Meta-info via JSONB on domaincode record

### 2. use_* Flags and Presets ✅ DECIDED

**Three Presets:**
| Preset | Project Type | Checkout | Use Flags | v0.5 Status |
|--------|-------------|----------|-----------|-------------|
| **simple** | project/topic/special | Odoo events default | None | Implement |
| **product** | project | Odoo commerce | `useSessions` | Implement |
| **hub** | regio/special | No checkout | Complex | Stub only |

**Reference Implementation:** dasei1
- Simple, no grouping, common pattern
- dasei2: adds gates/grouping (edge-case work this sprint)
- dasei3: deferred (custom per-participant configs)

### 3. Draft User Capabilities ❓ OPEN QUESTION
Still unsure whether draft users should be allowed anything beyond:
- Editing own user-profile
- UI appearance settings (personal dashboard view)

Current: user-status is hardcoded, not editable on dashboard.