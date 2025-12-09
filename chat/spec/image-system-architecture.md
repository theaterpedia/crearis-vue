# Image System Architecture Summary

> **Combined insights from today's session + existing implementation**

*Created: 2024-12-08*  
*Status: Architecture decision document for v0.5-v0.7*

---

## Current State Overview

### Working Components ✅

| Component | Status | Notes |
|-----------|--------|-------|
| **Local adapter (`crearis`)** | ✅ Working | Best quality, produces beautiful default shapes |
| **Cloudinary adapter** | 🔄 1 day from production | Server-side fixes needed |
| **Unsplash adapter** | 🔄 1 day from production | Server-side fixes needed |
| **ShapeEditor (XYZ)** | 🔄 1 day from production | Client-side working, server needs debugging |
| **BlurHash** | ✅ Working | Extremely fast page loads |
| **Shape triggers** | ✅ Tested | img_id reference → all entities get shapes |
| **ImagesCoreAdmin** | 🔄 Partial | Hero preview mockups started |

### Upcoming (Wednesday Dec 10)

| Component | Work Required |
|-----------|---------------|
| **Hero.vue** | Align to shapes, zoom to cover dimensions (~1000px wide) |
| **ImagesCoreAdmin** | Complete device mockups (phone/tablet/desktop) |

---

## Adapter Architecture

### Adapter Types (enum: `media_adapter_type`)
```
unsplash | cloudinary | canva | msteams | vimeo | youtube | 
cloudflare | signal | instagram | obsidian | crearis | odoo | pruvious
```

### Adapter Roles

| Role | Purpose | Examples |
|------|---------|----------|
| **Author** | Original creator/source | Canva, Unsplash, Crearis (local) |
| **Producer** | Processing/transformation | Cloudinary |
| **Publisher** | CDN/delivery | Cloudflare |

### Role Fallback Chain
```
If no publisher → producer acts as publisher
If no producer → author acts as publisher
Author MUST always be set
```

### Database Columns (images table)
```sql
author     media_adapter,   -- Always required
producer   media_adapter,   -- Optional
publisher  media_adapter,   -- Optional (falls back to producer/author)
```

### media_adapter Composite Type
```sql
CREATE TYPE media_adapter AS (
    adapter      media_adapter_type,
    file_id      text,
    account_id   text,
    folder_id    text,
    info         text,
    config       jsonb
);
```

---

## Shape System

### Four Standard Shapes
| Shape | Dimensions | Use Case |
|-------|------------|----------|
| `thumb` | 64×64 | Lists, navigation |
| `square` | 128×128 | Tiles, avatars |
| `wide` | 336×168 | Cards, hero (scaled up) |
| `vertical` | 126×224 | Portraits, sidebars |

### image_shape Composite Type
```sql
CREATE TYPE image_shape AS (
    x            numeric,    -- Focal point X (0-100)
    y            numeric,    -- Focal point Y (0-100)
    z            numeric,    -- Zoom/shrink factor
    url          text,       -- Pre-computed URL with transformations
    json         jsonb,      -- Custom parameters
    blur         varchar(50),-- BlurHash string
    turl         text,       -- Template URL (future)
    tpar         text        -- Template parameters (future)
);
```

### XYZ Strategy
- **NULL values** = Auto mode (adapter's default crop: entropy/attention)
- **Non-NULL values** = Manual focal point control
- **ShapeEditor** detects mode by checking if X is NULL

### Shape Propagation (PostgreSQL Triggers)
```
images.shape_* → img_square, img_wide, img_vert, img_thumb (JSONB computed)
                      ↓
entities reference img_id → get all shapes automatically
```

---

## Image Workitems Architecture (NEW - v0.5)

### Design Decision: Fine-grained (Variant B)

Based on today's discussion, `image_workitems` uses fine-grained tracking:

```sql
CREATE TABLE image_workitems (
    id UUID PRIMARY KEY,
    image_id UUID REFERENCES images(id),
    
    -- Type discriminator
    workitem_type TEXT CHECK (workitem_type IN (
        'adapter',      -- Processing step (resize, optimize, etc.)
        'consent',      -- GDPR consent request
        'review',       -- Social review (audience)
        'admin'         -- Manual admin action
    )),
    
    -- Polymorphic target
    target_type TEXT CHECK (target_type IN (
        'adapter',      -- Processing pipeline step
        'vue_user',     -- Crearis-Vue user
        'odoo_partner'  -- Odoo partner via XML-RPC
    )),
    target_ref TEXT NOT NULL,  -- adapter name OR user.id OR partner xmlid
    
    -- Status + Result
    status TEXT,
    result JSONB,
    
    -- Consent-specific
    consent_response TEXT,
    consent_expires_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at, started_at, completed_at TIMESTAMPTZ
);
```

### Workitem Type Details

| Type | Target Types | Use Case |
|------|-------------|----------|
| `adapter` | adapter | Processing pipeline: resize, optimize, watermark |
| `consent` | vue_user, odoo_partner | GDPR consent for images with people |
| `review` | vue_user, odoo_partner | Social review before publication |
| `admin` | vue_user | Manual admin actions (reprocess, fix metadata) |

### Workflow Scenarios

**Scenario 1: Local Upload (crearis adapter)**
```
1. User uploads image → author = crearis
2. System creates adapter workitems:
   - (adapter, adapter, 'resize', pending)
   - (adapter, adapter, 'optimize', pending)
   - (adapter, adapter, 'blurhash', pending)
3. Each completes independently → status = done
4. All done → image ready for shapes
```

**Scenario 2: Image with Consent Required**
```
1. Image flagged as "contains people"
2. System creates consent workitems:
   - (consent, vue_user, 'user-123', pending)
   - (consent, odoo_partner, 'res.partner.456', pending)
3. Each person responds → consent_response = approved/denied
4. All approved → image can advance to 'released' status
```

**Scenario 3: Social Review (Audience)**
```
1. Owner submits image for publication review
2. System creates review workitems for configured audience:
   - (review, vue_user, 'user-789', pending)
   - (review, odoo_partner, 'res.partner.101', pending)
3. Reviewers approve/reject → result = {notes: "..."}
4. Threshold met → image advances
```

---

## What This Replaces (Negative Spec)

### ❌ NOT Creating
- Generic `workitems` table (interface only, not table)
- `participants` table (public users → Nuxt/Odoo)
- `event_registrations` (Odoo handles)
- `comments` table (Odoo chatter or entity jsonb)

### ✅ Reusing
- `tasks` table with `category: 'admin'` for admin work
- Existing `users` table for creators/instructors
- Existing trigger system for shape propagation

---

## Version Roadmap

### v0.4 (Current Sprint - Dec 1-9)
- ✅ Shape triggers working
- ✅ Local adapter (`crearis`) working
- 🔄 ShapeEditor XYZ debugging
- 🔄 Cloudinary/Unsplash server fixes

### v0.5 (January 2026)
- [ ] `image_workitems` table (migration 059)
- [ ] Adapter workitem automation
- [ ] Consent workflow UI
- [ ] Review workflow UI

### v0.6 (February 2026)
- [ ] Hero.vue integration complete
- [ ] Cover-page dimensions (1000px+)
- [ ] Device mockup previews

### v0.7 (March 2026)
- [ ] Odoo sync for consent (XML-RPC to partners)
- [ ] Publisher adapter integration (Cloudflare)
- [ ] turl/tpar template system

---

## Open Questions for Decision

### 1. Adapter Workitem Names
**Question:** Fixed list or free-form?

**Decision:** Fixed list combining adapter names + image actions:

**Adapter names** (from `media_adapter_type`):
```
unsplash | cloudinary | canva | vimeo | cloudflare | crearis | ...
```

**Image action names** (shape-related):
```typescript
type ImageAction = 'basic_shape_optimization' | 'hero_shape_optimization'
```

- `basic_shape_optimization` - Default shape generation on upload (thumb, square, wide, vertical)
- `hero_shape_optimization` - Hero-specific processing (1000px+ cover dimensions for Hero.vue)

### 2. Consent Response Structure
**Question:** Simple enum or structured?

**Decision:** Simple enum: `approved | denied | expired`
- Review in v0.7 to validate this structure
- `result JSONB` available for additional notes/metadata

### 3. Odoo Partner Reference
**Question:** Store numeric ID or just xmlid?

**Decision:** Store both for efficiency:
```sql
target_ref TEXT,           -- 'res.partner.123' (xmlid for sync)
target_odoo_id INTEGER     -- 123 (for direct XML-RPC calls)
```
**!IMPORTANT (v0.8):** Refactor to use xmlid only. Until then, partner_id may be used where xmlid would need complicated code-logic.

### 4. Created_by Nullable
**Question:** Can adapter workitems be system-generated?

**Decision:** NO - `created_by` is NOT NULL (required)
- Use system users like Odoo's 'bot' pattern
- v1.1: Audit for any null workitems (likely never needed)

---

## Files Reference

| File | Purpose |
|------|---------|
| `server/types/adapters.ts` | Adapter type definitions |
| `server/adapters/cloudinary-adapter.ts` | Cloudinary implementation |
| `server/adapters/unsplash-adapter.ts` | Unsplash implementation |
| `server/adapters/local-adapter.ts` | Local/crearis implementation |
| `src/components/images/ShapeEditor.vue` | XYZ focal point editing |
| `src/components/images/ImgShape.vue` | Shape display component |
| `src/views/admin/ImagesCoreAdmin.vue` | Admin UI with hero preview |
| `server/database/migrations/059_image_workitems.ts` | NEW: Workitems table |

---

## Summary Decision

**For v0.5:**
1. ✅ Implement `image_workitems` as fine-grained table
2. ✅ Fixed adapter step names (not free-form)
3. ✅ Simple consent response enum
4. ✅ Store both xmlid and odoo_id for partners
5. ✅ Allow system-generated workitems (created_by nullable)

**Next-Spec (v0.7+):**
- Odoo XML-RPC sync for consent workitems
- Publisher adapter chain (author → producer → publisher)
- turl/tpar template system for dynamic shapes

---

*This document combines insights from the negative-spec discussion, image system exploration, and adapter architecture review.*
