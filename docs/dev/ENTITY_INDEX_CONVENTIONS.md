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
| **Posts** | `xmlid` | `posts.id` (is xmlid) | `{domaincode}.post__{slug}` | `theaterpedia.post__my_topic` |
| **Events** | `xmlid` | `events.id` (is xmlid) | `{domaincode}.event__{slug}` | `theaterpedia.event__summer_2024` |
| **Images** | `xmlid` | `images.xmlid` | `{domaincode}.image__{slug}` | `theaterpedia.image__photo_123` |
| **Partners** | `xmlid` | `partners.xmlid` | `{domaincode}.partner__{slug}` | `theaterpedia.partner__john_doe` |

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

**Odoo-aligned format**: `{domaincode}.{entity}__{slug}` or `{domaincode}.{entity}-{template}__{slug}`

### Components

| Component | Rules | Examples |
|-----------|-------|----------|
| **Domaincode** | Lowercase, may start with `_` (special projects), no hyphens | `theaterpedia`, `_demo`, `_start` |
| **Entity** | Lowercase alphanumeric only | `post`, `event`, `image`, `partner` |
| **Template** | Lowercase alphanumeric only (optional) | `workshop`, `conference`, `scene`, `avatar` |
| **Slug** | Lowercase, underscores for word separation, no hyphens, no `__` | `my_summer_event`, `photo_123` |

### Separator Rules

- **Hyphen (`-`)**: ONLY between entity and template
- **Double underscore (`__`)**: Separates entity(-template) from slug
- **Single dot (`.`)**: Separates domaincode from entity

### Examples

```
# Simple (no template)
theaterpedia.post__my_topic
theaterpedia.event__summer_2024
theaterpedia.image__photo_123
theaterpedia.partner__john_doe

# With template
theaterpedia.post-workshop__my_recap
theaterpedia.event-conference__annual_meeting
theaterpedia.image-scene__dance_performance
theaterpedia.partner-instructor__maria_garcia

# Special projects (domaincode starts with _)
_demo.post__sample_content
_start.event__onboarding_session
```

### URL Routing

Posts and events use slug-based URLs:

```
/sites/{domaincode}/posts/{identifier}
/sites/{domaincode}/events/{identifier}
```

Where `identifier` can be:
- **Numeric ID**: `123` → fetches by database ID
- **Plain slug**: `my_topic` → resolves to `{domaincode}.post__my_topic`
- **Template+slug**: `workshop__my_recap` → resolves to `{domaincode}.post-workshop__my_recap`

### Utilities

See `src/utils/xmlid.ts` for parsing and building XMLIDs:

```typescript
import { parseXmlid, buildXmlid, parseRouteIdentifier } from '@/utils/xmlid'

// Parse existing xmlid
const parsed = parseXmlid('theaterpedia.post-workshop__my_recap')
// { domaincode: 'theaterpedia', entity: 'post', template: 'workshop', slug: 'my_recap' }

// Build new xmlid
const xmlid = buildXmlid({ domaincode: 'theaterpedia', entity: 'post', template: 'workshop', slug: 'my_recap' })
// 'theaterpedia.post-workshop__my_recap'

// Parse route identifier
const route = parseRouteIdentifier('workshop__my_recap', 'theaterpedia', 'post')
// { type: 'slug', xmlid: 'theaterpedia.post-workshop__my_recap', template: 'workshop', slug: 'my_recap' }
```


---

## Related Documentation

- `docs/devdocs/STATUS_EDITOR_GUIDE.md` - Status workflow
- `server/utils/posts-permissions.ts` - Server-side permission rules
- `src/composables/usePostPermissions.ts` - Client-side permission checks
