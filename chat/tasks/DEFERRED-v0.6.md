# Deferred Tasks for v0.6

**Version Focus:** Hero.vue Integration + Cover Images + Events System  
**Target:** February 2026

---

## Core v0.6 Scope

### Hero.vue Image Integration
- [ ] Hero.vue alignment to shape system
- [ ] Zoom shapes to cover-page dimensions (1000px+ wide)
- [ ] Device mockup previews (phone/tablet/desktop) in ImagesCoreAdmin
- [ ] Hero preview types based on four shapes (thumb, square, wide, vertical)

### Shape System Completion
- [ ] Complete ShapeEditor XYZ debugging (1 day)
- [ ] Cloudinary adapter server-side fixes (1 day)
- [ ] Unsplash adapter server-side fixes (1 day)

### Events System (Post-Confirmed State)
- [ ] **Events "confirmed" barrier implementation** - One-way door to Odoo
- [ ] Odoo sync trigger on `confirmed` status transition
- [ ] Event registration enabled for production (remove test constraints)
- [ ] Participant login path (verified user → Odoo content access)

### Interactions System Extension
- [ ] fieldListUtility.ts → config table migration (Option A or B)
- [ ] Test project forms: opus1, opus2, opus3
- [ ] Per-event form definitions: o1_event1, o1_event2, etc.

---

## Test-Drive Constraints (Active Until v0.6)

Registration allowed ONLY when:
1. Event `start_date > 2026-02-12`
2. Project in `['opus1', 'opus2', 'opus3']`

See: `chat/spec/negative-spec.md` → Events System Constraints

---

## Tasks Added from v0.5 Deferred

<!-- Move items here that clearly belong to Hero/Cover image work -->

---

## Notes

- Hero.vue work scheduled for Wednesday Dec 10, 2025 (initial exploration)
- Full implementation in v0.6
- Events "confirmed" barrier is the key unlock for full system
