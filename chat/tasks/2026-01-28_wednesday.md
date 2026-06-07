# Wednesday, January 28, 2026

**Sprint:** v0.5 Odoo Integration  
**Day 6 of 9**  
**Round 3, Day 1** - Prompting Day

---

## 🎯 Round 3 Focus: Spec + Merge Decisions

### Opening Prompt

> Round 3 begins. We have two branches with proof-of-concept implementations:
> - `events_ui:presets_product` (GraphQL, dasei1)
> - `events_ui:presets_simple` (XML-RPC)
>
> Today we create the merging matrix, spec the dashboard integration, and spec the sysreg_capabilities integration.
>
> **Questions to answer:**
> 1. Which features use GraphQL vs XML-RPC?
> 2. How do capabilities drive UI for team vs participant?
> 3. What's the stepper→dashboard transition spec?

---

## Sunrise Session

### Round 2 Carryover
<!-- Results from Tuesday -->
- [ ] event_workitems table status?
- [ ] Polymorphic routing status?
- [ ] Simple preset UI status?

### Today's Tasks

**1. Merging Matrix**
| Feature | GraphQL | XML-RPC | Decision | Notes |
|---------|---------|---------|----------|-------|
| Login/session | | | | |
| User CRUD | | | | |
| Event sync | | | | |
| Shopping cart | | | | |
| Workitems/chatter | | | | |

**2. Spec: sysreg_capabilities**
- [ ] Team roles: owner, creator, member
- [ ] Participant role
- [ ] Capability → UI component mapping

**3. Spec: Dashboard Integration**
- [ ] Stepper → Dashboard transition (status >= 64)
- [ ] EventPanel as reference implementation
- [ ] NavStop configuration

**4. Spec: Composables Layer**
- [ ] List composables needing TDD
- [ ] Define interfaces

---

## Lunch Summary

<!-- Merging matrix progress -->

---

## Afternoon/Evening

<!-- Spec work continues -->

---

## Closeout

### Progress
- 

### Decisions Made
- 

### Deferred to Tomorrow
- 

### Outputs
- [ ] Merging matrix complete
- [ ] Capabilities spec draft
- [ ] Dashboard spec draft
- [ ] Composables interface list

---

## References

- [SPRINT-v05-MASTER.md](./2026-01-22-SPRINT-v05-MASTER.md)
- [dashboardLayout-crucialpoints.md](./2025-12-12-dashboardLayout-crucialpoints.md)
- [HARDCODED_CAPABILITIES_AUDIT.md](./2026-01-22-SPRINT-v05-Input-HARDCODED_CAPABILITIES_AUDIT.md)
