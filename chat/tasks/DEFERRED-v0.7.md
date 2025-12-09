# Deferred Tasks for v0.7

**Version Focus:** Odoo Sync + Publisher Chain  
**Target:** March 2026

---

## Core v0.7 Scope

### Odoo XML-RPC Sync
- [ ] Odoo sync for consent workitems (XML-RPC to partners)
- [ ] Event stats cron job (jsonb cache, hourly sync)
- [ ] Direct Odoo connection for event data

### Publisher Adapter Chain
- [ ] Publisher adapter integration (Cloudflare)
- [ ] Author → Producer → Publisher chain completion
- [ ] turl/tpar template system for dynamic shapes

### Consent Workflow
- [ ] **Review consent response structure**: Validate `approved | denied | expired` enum
- [ ] Consent expiry handling
- [ ] Consent notification system

---

## Tasks Added from v0.5 Deferred

<!-- Move items here that clearly belong to Odoo sync work -->

---

## Notes

- Odoo exploration done Dec 8, 2025 (see chat/spec/odoo-events-snapshot.md)
- XML-RPC utility working (scripts/odoo-query.py)
