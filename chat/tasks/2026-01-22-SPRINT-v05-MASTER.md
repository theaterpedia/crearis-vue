# Sprint v0.5 Master Plan

**Sprint:** v0.5 Odoo Integration  
**Duration:** January 22-31, 2026 (9 days, 4 rounds)  
**Created:** January 22, 2026

---

## Sprint Vision

v0.5 delivers the Odoo integration foundation through **two parallel proof-of-concept implementations** that create switchable solutions for event presets. The sprint produces:

1. **Preset: product** (GraphQL, dasei1 reference) - Full commerce integration
2. **Preset: simple** (XML-RPC) - Dead simple integrated experience
3. **Merging matrix** for combining best of both approaches
4. **Dashboard with sysreg_capabilities** for team + participant roles

---

## Strategic Decisions (from Thursday Planning)

| Decision | Status | Details |
|----------|--------|---------|
| Strategy C (Participant Journey) | ✅ CONFIRMED | Primary approach, DASEI = edge-case |
| Reference: dasei1 | ✅ CONFIRMED | Simple, no grouping, common pattern |
| Stepper stays hardcoded | ✅ CONFIRMED | Until Dashboard works with capabilities |
| Capabilities focus | ✅ CONFIRMED | DRAFT→ transitions, not entity creation |
| Products in Odoo only | ✅ CONFIRMED | Website = product, meta via JSONB |
| Blocks editor | ⏸️ DEFERRED | v1.0+ |
| XMLID convention | ✅ DONE | Dec 17, 2025 |

---

## 4-Round Structure

### Round Logic
- **Day 1:** Prompting day - inputs, analysis, implementation start
- **Day 2:** Output day - code, docs, checklist for round status
- Day 2 starts in **batch mode quickly** (minimal meta)

### Branch Strategy
```
main
  └─ events_ui:presets_product (Round 1)
  └─ events_ui:presets_simple (Round 2)
       └─ [merge decisions in Round 3]
            └─ [final implementation in Round 4]
```

---

## Round 1: GraphQL / Product Preset (Fri 23 + Sat 24)

**Goal:** Proof-of-concept A - dasei1 / preset: product + useSessions

### Day 1 (Friday Jan 23) - Prompting Day

**Prerequisites:**
- [ ] Import key files from crearis-nuxt into workspace
- [ ] Reference data from dasei1 (Odoo or SharePoint)

**Tasks:**
1. **Analyze crearis-nuxt GraphQL interfacing:**
   - Login, logout, session-sharing
   - Account creation, password, update
   - Shopping cart functionality
   - Products, product-templates, categories

2. **Analyze sync patterns:**
   - Users, domainusers, posts, events
   - Compare with versioning system on newer Odoo

3. **Add per-project server-strategy option:**
   ```typescript
   type ServerStrategy = 'none' | 'graphql' | 'xmlrpc'
   ```

4. **Recreate code layers:**
   - General GraphQL access + utilities
   - Composables for entity data (switch on server-strategy)
   - **→ Create branch: `events_ui:presets_product`**

### Day 2 (Saturday Jan 24) - Output Day

**Tasks (continue):**
5. **Shopping-cart experience:**
   - CRUD-UI for user, password, email
   - Product configuration (which events/sessions)

6. **Event UI (stubs ok):**
   - Published event (participant-confirmation processed)
   - Upcoming event (instructor prep content → participants)
   - Ongoing event (org info, participant list)
   - Focus: instructor + participant perspectives

7. **Public website features:**
   - Sessions visible/accessible
   - Product-view for project homepage
   - Reference: "Einstiege ins Theaterspiel" from dasei.eu

8. **Documentation:**
   - Questions, issues, pain-points
   - Decisions needed on Odoo side

**Round 1 Checklist:**
- [ ] GraphQL utilities created
- [ ] Server-strategy switch implemented
- [ ] Shopping cart UI exists (stub ok)
- [ ] Event views exist (stub ok)
- [ ] Branch `events_ui:presets_product` has commits
- [ ] Pain-points documented

---

## Round 2: XML-RPC / Simple Preset (Mon 26 + Tue 27)

**Goal:** Proof-of-concept B - simple / XML-RPC, "dead simple integrated"

### Day 1 (Monday Jan 26) - Prompting Day

**Prerequisites:**
- [ ] Insights from Round 1 documented
- [ ] `event_workitems` table ready (Migration)

**Tasks:**
1. **Extract insights from Round 1:**
   - XMLID handling patterns
   - Versioning patterns
   - Session management

2. **Branch setup:**
   ```bash
   git checkout main  # Reset to before product branch
   git checkout -b events_ui:presets_simple
   ```

3. **Simplification decisions:**
   - Which features to simplify via XML-RPC?
   - Login/logout/session → reuse or simplify?
   - Shopping cart → needed or skip?

4. **Polymorphic routing implementation:**
   - `entity_type='event'` → `event_workitems`
   - Reference: `image_workitems` pattern

### Day 2 (Tuesday Jan 27) - Output Day

**Tasks (continue):**
5. **Repeat steps 4→8 from Round 1** but for:
   - Preset: simple
   - Server-strategy: XML-RPC
   - Goal: "dead simple" user experience

6. **event_workitems integration:**
   - Wire to Odoo chatter
   - Surface workflow in entity context

**Round 2 Checklist:**
- [ ] XML-RPC utilities enhanced
- [ ] event_workitems table created
- [ ] Polymorphic routing working
- [ ] Simple preset UI exists
- [ ] Branch `events_ui:presets_simple` has commits
- [ ] Comparison notes with Round 1

---

## Round 3: Spec + Merge Decisions (Wed 28 + Thu 29)

**Goal:** Create detailed spec, merge best of both approaches

### Day 1 (Wednesday Jan 28) - Prompting Day

**Tasks:**
1. **Merging matrix creation:**
   - Feature-by-feature comparison
   - Decision: GraphQL vs XML-RPC per feature
   - Decision: parallel (C) vs pick-winner (A/B)

2. **Spec: sysreg_capabilities integration:**
   - Team roles: owner, creator, member
   - Participant role
   - Capability-driven UI switching

3. **Spec: Dashboard integration:**
   - Stepper → Dashboard transition (status >= 64)
   - EventPanel as showcase
   - NavStop ↔ Entity mapping refinement

4. **Spec: Composables layer:**
   - Which composables need TDD approach?
   - Interface definitions

### Day 2 (Thursday Jan 29) - Output Day

**Tasks:**
5. **Git merge operations:**
   - Execute merging matrix decisions
   - Resolve conflicts
   - Create unified branch

6. **TDD setup:**
   - Tests for critical composables
   - Stubs for spec'd interfaces

**Round 3 Checklist:**
- [ ] Merging matrix documented
- [ ] Spec: capabilities integration complete
- [ ] Spec: dashboard integration complete
- [ ] Branches merged
- [ ] Tests written for composables
- [ ] Stubs implemented

---

## Round 4: Dashboard Implementation (Fri 30 + Sat 31)

**Goal:** Implement dashboard, panels, capabilities against composables

### Day 1 (Friday Jan 30) - Prompting Day

**Tasks:**
1. **Dashboard implementation:**
   - Wire capabilities to UI
   - Implement spec'd features
   - Refactor existing code from Round 1-2

2. **Panel updates:**
   - EventPanel refinements
   - EditPanel integration
   - Status transitions

3. **Admin tools updates:**
   - Events Admin enhancements
   - SysregCapabilities editor

### Day 2 (Saturday Jan 31) - Output Day

**Tasks:**
4. **Final polish:**
   - Bug fixes from testing
   - Documentation updates
   - Demo preparation

5. **Sprint closeout:**
   - All scope items done or explicitly deferred
   - DEFERRED-from-v05.md created
   - v0.6 scope confirmed

**Round 4 Checklist:**
- [ ] Dashboard with capabilities working
- [ ] Preset switching functional (simple ↔ product)
- [ ] Events Admin updated
- [ ] SysregCapabilities updated
- [ ] v0.5 release notes drafted
- [ ] v0.6 scope defined

---

## High Priority Tasks (from Thursday Audit)

| Task | Round | Status |
|------|-------|--------|
| Status NOT NULL migration | R1 prep | ⬜ |
| event_workitems table | R2 | ⬜ |
| Polymorphic routing | R2 | ⬜ |
| Stepper→Dashboard transition | R3 spec | ⬜ |
| Dashboard capabilities | R4 | ⬜ |
| creator_id alignment | R4 | ⬜ |

---

## External Dependencies

| Dependency | Source | Round Needed |
|------------|--------|--------------|
| crearis-nuxt files | github.com/theaterpedia/crearis-nuxt | R1 Day 1 |
| dasei1 reference data | Odoo / SharePoint | R1 Day 1 |
| GraphQL on Odoo | 95% complete, 75% tested | R1 |

---

## Daily Progress Tracking

| Day | Date | Round | Focus | Status |
|-----|------|-------|-------|--------|
| 1 | Thu 22 | Prep | Planning + audit | ✅ |
| 2 | Fri 23 | R1.1 | GraphQL analysis | ⬜ |
| 3 | Sat 24 | R1.2 | Product preset impl | ⬜ |
| 4 | Mon 26 | R2.1 | XML-RPC analysis | ⬜ |
| 5 | Tue 27 | R2.2 | Simple preset impl | ⬜ |
| 6 | Wed 28 | R3.1 | Spec + merge decisions | ⬜ |
| 7 | Thu 29 | R3.2 | Merge + TDD setup | ⬜ |
| 8 | Fri 30 | R4.1 | Dashboard impl | ⬜ |
| 9 | Sat 31 | R4.2 | Polish + closeout | ⬜ |

---

## References

### Sprint Input Docs
- [thursday.md](./2026-01-22_thursday.md) - Planning session
- [audit-findings.md](./2026-01-22-audit-findings.md) - Morning findings
- [odoo-reports-analysis.md](./2026-01-22-odoo-reports-analysis.md) - Strategy analysis

### Deferred Containers
- [DEFERRED-v0.5.md](./DEFERRED-v0.5.md) - Current scope (522 lines)
- [DEFERRED-v0.6.md](./DEFERRED-v0.6.md) - Hero.vue + Events
- [DEFERRED-v0.7.md](./DEFERRED-v0.7.md) - Full Odoo Sync

### Technical References
- [negative-spec.md](../spec/negative-spec.md) - What NOT to build
- [image-system-architecture.md](../spec/image-system-architecture.md) - Workitems pattern
- [dashboardLayout-crucialpoints.md](./2025-12-12-dashboardLayout-crucialpoints.md) - Dashboard decomposition

### External
- [crearis-nuxt](https://github.com/theaterpedia/crearis-nuxt) - Sister project for GraphQL patterns
