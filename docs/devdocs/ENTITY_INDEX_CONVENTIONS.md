# Entity Index Conventions

> **Status**: Active Convention  
> **Created**: December 4, 2025  
> **Purpose**: Define how entities are indexed and referenced across the system

## Overview

This system is designed for **Odoo compatibility** and **multi-instance sync**. Record IDs (`id` column) are database-local and should NOT be used as foreign keys for cross-instance entities.

Instead, we use **semantic identifiers** (xmlid, sysmail, domaincode) that remain stable across database imports/exports.

---

## Index Strategy by Entity

| Entity | Primary Index | Column | Format | Example |
|--------|--------------|--------|--------|---------|
| **Users** | `sysmail` | `users.sysmail` | Email | `nina.opus@theaterpedia.org` |
| **Projects** | `domaincode` | `projects.domaincode` | Slug | `opus1` |
| **Posts** | `xmlid` | `posts.xmlid` | `_domaincode.seq` | `_opus1.post001` |
| **Events** | `xmlid` | `events.xmlid` | `_domaincode.seq` | `_opus1.event001` |
| **Images** | `xmlid` | `images.xmlid` | `_domaincode.seq` | `_opus1.img001` |

---

## Ownership References

### Current Schema (uses record IDs - DEPRECATED pattern)
```sql
-- ❌ Avoid: Uses local record IDs
projects.owner_id → users.id
posts.owner_id → users.id
```

### Preferred Pattern (uses semantic IDs)
```sql
-- ✅ Preferred: Uses stable identifiers
projects.owner_sysmail → users.sysmail
posts.owner_sysmail → users.sysmail
-- OR
posts.owner_xmlid → users.xmlid (if users get xmlid)
```

---

## API Endpoint Conventions

### Path Parameters

Use semantic identifiers in URLs, not record IDs:

```
✅ GET /api/projects/:domaincode
✅ GET /api/projects/:domaincode/posts
✅ GET /api/posts/:xmlid
✅ GET /api/users/:sysmail

❌ GET /api/projects/:id (avoid)
❌ GET /api/posts/:id (avoid - only for internal use)
```

### Query Parameters

When filtering by owner:
```
✅ GET /api/posts?owner=nina.opus@theaterpedia.org
❌ GET /api/posts?owner_id=8
```

---

## Permission Checks

### Current Implementation (needs update)
```typescript
// ❌ Compares record IDs
const isProjectOwner = project.owner_id === user.id
```

### Correct Implementation
```typescript
// ✅ Compare via sysmail
const isProjectOwner = project.owner_sysmail === user.sysmail
// OR if using lookup
const isProjectOwner = project.owner?.sysmail === user.sysmail
```

---

## Migration Path

### Phase 1: Add sysmail columns (alongside owner_id)
```sql
ALTER TABLE projects ADD COLUMN owner_sysmail TEXT REFERENCES users(sysmail);
ALTER TABLE posts ADD COLUMN owner_sysmail TEXT REFERENCES users(sysmail);
```

### Phase 2: Backfill from owner_id
```sql
UPDATE projects p SET owner_sysmail = (SELECT sysmail FROM users WHERE id = p.owner_id);
UPDATE posts p SET owner_sysmail = (SELECT sysmail FROM users WHERE id = p.owner_id);
```

### Phase 3: Make NOT NULL, drop owner_id
```sql
ALTER TABLE projects ALTER COLUMN owner_sysmail SET NOT NULL;
ALTER TABLE projects DROP COLUMN owner_id;
```

---

## Temporary Workaround

Until migration is complete, the frontend can resolve ownership by:

1. **Load project with owner user data**
   ```typescript
   // API returns project with owner object
   project.owner = { id: 8, sysmail: 'nina.opus@...', ... }
   ```

2. **Compare sysmail**
   ```typescript
   const isProjectOwner = project.owner?.sysmail === user.sysmail
   ```

---

## xmlid Format Specification

Format: `_<domaincode>.<entity><sequence>`

Examples:
- `_opus1.post001` - First post in opus1
- `_opus1.event042` - Event #42 in opus1
- `_physicaltheatre.002` - Second item in physicaltheatre project

The underscore prefix indicates a local xmlid (vs imported Odoo xmlid).

---

## Related Documentation

- `docs/devdocs/STATUS_EDITOR_GUIDE.md` - Status workflow
- `server/utils/posts-permissions.ts` - Server-side permission rules
- `src/composables/usePostPermissions.ts` - Client-side permission checks
