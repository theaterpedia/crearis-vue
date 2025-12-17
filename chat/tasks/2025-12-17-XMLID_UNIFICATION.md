# XMLID Unification - Odoo Alignment

**Date:** 2025-12-17  
**Status:** ✅ COMPLETED

---

## New XMLID Format (Odoo-Aligned)

```
{domaincode}.{entity}__{slug}
{domaincode}.{entity}-{template}__{slug}
```

### Rules

| Component | Rules | Examples |
|-----------|-------|----------|
| `domaincode` | lowercase, may start with `_` (special projects), no `_` elsewhere, no `-`, no special chars | `opus1`, `_demo`, `_start`, `theaterpedia` |
| `entity` | lowercase, no `-`, no `_`, no special chars | `post`, `event`, `image`, `partner` |
| `-` | Single hyphen separates entity from template (ONLY place `-` is allowed) | `event-conference`, `post-demo` |
| `template` | lowercase, no `-`, no `_`, no special chars (OPTIONAL) | `demo`, `kurs`, `online`, `instructor` |
| `__` | Double underscore separates entity(-template) from slug | Always `__` |
| `slug` | lowercase, no `-`, no double `__`, single `_` allowed | `mein_erster_beitrag` |

**Key rule:** The hyphen `-` is ONLY allowed to separate `{entity}` from `{template}`. If no `-` is found in the entity part, there is no template applied.

**Domaincode special rule:** May start with `_` for special project types (e.g., `_demo`, `_start` for regio-projects), but `_` cannot appear in the middle or at the end.

### Examples

**Current (OLD) → New (ODOO)**:
```
# Posts (no template)
opus1.post.my_article          → opus1.post__my_article

# Posts (with template)
opus1.post_demo.my_post        → opus1.post-demo__my_post
_demo.post_demo.001            → _demo.post-demo__001

# Events (no template)
_demo.event.kids_theater       → _demo.event__kids_theater

# Events (with template)  
start.event_conference.summit  → start.event-conference__summit
start.event_online.workshop    → start.event-online__workshop

# Images (with template)
_tp.image_adult.5MRsjiv782c    → _tp.image-adult__5mrsjiv782c
_aug.image_event.was_tun0      → _aug.image-event__was_tun0
```

### Key Changes from Current

1. **Double underscore `__`** separates entity(-template) from slug (not single `.`)
2. **Hyphen `-`** ONLY allowed between entity and template (e.g., `event-conference`)
3. **No `-` in slug** - use single `_` for word separation
4. **Leading underscore `_`** in domaincode is ALLOWED for special projects (regio-type)
5. **Slug cannot contain `__`** (reserved separator) but single `_` is fine
6. **Template is optional** - no `-` means no template

---

## Route URL Patterns

### Post/Event Pages: `/sites/{domaincode}/topic|agenda/{identifier}`

**Identifier formats:**

| Format | Maps to XMLID |
|--------|---------------|
| `{slug}` | `{domaincode}.{entity}__{slug}` |
| `{template}__{slug}` | `{domaincode}.{entity}-{template}__{slug}` |
| `{numeric_id}` | Direct DB lookup by ID |

**Examples:**
```
/sites/opus1/topic/my_article          → opus1.post__my_article
/sites/opus1/topic/demo__my_article    → opus1.post-demo__my_article
/sites/opus1/agenda/conference__summit → opus1.event-conference__summit
/sites/opus1/agenda/123                → SELECT * FROM events WHERE id = 123
```

---

## Implementation Tasks

### 1. Core Utilities (src/utils/xmlid.ts)

```typescript
// Validate domaincode/entity/template
function isValidXmlidPart(part: string): boolean

// Generate slug from title (no -, no __)
function generateOdooSlug(title: string): string

// Parse xmlid into components
function parseXmlid(xmlid: string): {
    domaincode: string
    entity: string
    template?: string
    slug: string
}

// Build xmlid from components
function buildXmlid(opts: {
    domaincode: string
    entity: string
    template?: string
    slug: string
}): string

// Extract identifier from URL param
function parseRouteIdentifier(identifier: string, entity: 'post' | 'event'): {
    type: 'xmlid' | 'id'
    xmlid?: string
    id?: number
}
```

### 2. SlugEditor Component (src/components/SlugEditor.vue)

Features:
- Shows only template dropdown + slug input (hides domaincode/entity)
- Template options from available pages/variants
- Real-time preview of resulting xmlid
- Validation feedback

### 3. Update Post/Event Creation

Files:
- `src/components/AddPostPanel.vue`
- `src/components/EventPanel.vue`

Changes:
- Replace current xmlid generation with `buildXmlid()`
- Use `generateOdooSlug()` for slug
- Update variant input to template dropdown

### 4. Update Route Pages

Files:
- `src/views/sites/PostPage.vue` (or equivalent)
- `src/views/sites/EventPage.vue` (or equivalent)

Changes:
- Accept both numeric ID and slug-based identifiers
- Parse identifier using `parseRouteIdentifier()`
- Build xmlid for lookup or use direct ID

### 5. Update Image Import

Files:
- `server/adapters/base-adapter.ts`
- `server/adapters/local-adapter.ts`
- Image import APIs

Changes:
- Generate xmlid with `__` separator
- Ensure no `-` in generated parts

### 6. Migration Scripts

```bash
scripts/
├── migrate-xmlids-posts.ts
├── migrate-xmlids-events.ts
├── migrate-xmlids-images.ts
└── migrate-xmlids-partners.ts
```

---

## Migration Strategy

1. **Add new columns** (if needed for transition)
2. **Run migration scripts** to update existing xmlids
3. **Update frontend components** to use new format
4. **Update backend APIs** to accept both formats temporarily
5. **Clean up** old format support after verification

---

## Files to Update

### Frontend
- [x] `src/utils/xmlid.ts` (NEW) - Core utilities for xmlid parsing/building
- [x] `src/components/SlugEditor.vue` (NEW) - User-friendly slug editor component
- [x] `src/components/AddPostPanel.vue` - Updated to use xmlid utilities
- [x] `src/components/EventPanel.vue` - Updated to use xmlid utilities
- [x] `src/views/PostPage.vue` - Updated to handle slug-based URLs
- [x] `src/views/EventPage.vue` - Updated to handle slug-based URLs
- [x] `src/router/index.ts` - Updated route params from :id to :identifier
- [x] `src/components/images/cimgImportStepper.vue` - Updated xmlid generation
- [x] `src/views/HomeLayoutHack.vue` - Updated avatar xmlid generation

### Backend
- [x] `server/adapters/base-adapter.ts` - Updated image xmlid generation
- [x] `server/database/migrations/069_xmlid_format_migration.ts` (NEW) - Migration script

### Documentation
- [x] `docs/dev/ENTITY_INDEX_CONVENTIONS.md` - Updated xmlid format documentation
- [x] `docs/dev/features/images.md` - Updated image xmlid examples

---

## Summary

All XMLID handling has been unified to the Odoo-aligned format:
- `{domaincode}.{entity}__{slug}` (simple)
- `{domaincode}.{entity}-{template}__{slug}` (with template)

Key utilities in `src/utils/xmlid.ts`:
- `parseXmlid()` - Parse xmlid into components
- `buildXmlid()` - Build xmlid from components  
- `generateSlug()` - Generate URL-safe slug from title
- `parseRouteIdentifier()` - Parse URL identifier into ID or xmlid
- `isValidXmlid()` - Validate xmlid format
- `parsePageType()` / `buildPageType()` - Handle page_type format
