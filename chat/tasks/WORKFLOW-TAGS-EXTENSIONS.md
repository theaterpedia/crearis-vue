# Workflow & Tags Extensions

**Created**: December 4, 2025  
**Origin**: Lunch Summary sidelined items  
**Target**: v0.5+  
**Status**: Specification Draft

---

## Overview

This document consolidates related extensions to the permission and tagging system that emerged during the Posts Workflow specification (Dec 4). These are all "nice-to-have" refinements that add granularity but aren't blocking the core v0.3-v0.4 workflow.

---

## 1. Read Permission Granularity

### `read-summary` Limitation for Participants

**What**: Participants should only see headline+teaser (summary), not body content.

**Current State**: Rule 7 `POST_READ_DEPTH_BY_PROJECT` defines content depth by project state:
- demo → summary
- draft → core (headline + teaser + body via modal)
- review+ → full

**Extension**: Add role-based depth modifier:

```typescript
// Extended getContentDepth() 
function getContentDepth(ctx: PermissionContext): ContentDepth {
  const baseDepth = getContentDepthByProjectState(ctx)
  
  // Role-based limitation
  if (isParticipant(ctx) && baseDepth === 'core') {
    return 'summary'  // Participants see less even in draft projects
  }
  
  return baseDepth
}
```

**UI Impact**: 
- Hide body modal button for participants
- Show "Limited preview - join as member for full access" message

---

## 2. Write Permission Granularity

### `write-nocreate` Mode

**What**: Project config to prevent members from creating new entities while allowing edits.

**Field**: `project.config.memberWriteMode: 'write-all' | 'write-nocreate'`

**Current State**: Rule 11 `POST_CREATE_P_MEMBER` allows members to create in draft+ projects unconditionally.

**Extension**:
```typescript
function canCreatePost(ctx: PermissionContext): boolean {
  if (isProjectOwner(ctx)) return true
  
  if (isMember(ctx) && ctx.project.status >= STATUS.DRAFT) {
    // Check project config
    const writeMode = ctx.project.config?.memberWriteMode ?? 'write-all'
    return writeMode === 'write-all'
  }
  
  return false
}
```

**Use Case**: Curated projects where only owner creates content framework, members fill in details.

---

### `write-body` vs `write-meta` Distinction

**What**: Fine-grained permission separating who can edit body content vs metadata (tags, status, dates).

**Current State**: `canEditPost()` is binary - you can edit or you can't.

**Extension**:
```typescript
type WriteScope = 'full' | 'body-only' | 'meta-only'

function getWriteScope(ctx: PermissionContext): WriteScope | null {
  if (!canEditPost(ctx)) return null
  
  // Post owner can edit everything on their post
  if (isPostOwner(ctx)) return 'full'
  
  // Project owner can edit everything
  if (isProjectOwner(ctx)) return 'full'
  
  // Member editors: body only? meta only? TBD
  if (isMember(ctx)) return 'body-only'
  
  return null
}
```

**UI Impact**: Conditionally disable form fields based on write scope.

---

## 3. Tags Permission Granularity

### Tag Edit Restriction for Delegated Owners

**What**: Participants/partners who own a post (via delegation) should NOT edit tags because they lack taxonomy understanding.

**Current State**: `canEditPost()` grants full edit access to post owners.

**Extension**:
```typescript
function canEditTags(ctx: PermissionContext): boolean {
  // Project owner always can
  if (isProjectOwner(ctx)) return true
  
  // Members can edit tags
  if (isMember(ctx)) return true
  
  // Post owner who is participant/partner: NO tag editing
  if (isPostOwner(ctx) && (isParticipant(ctx) || isPartner(ctx))) {
    return false  // Can edit body, not tags
  }
  
  return false
}
```

**Rationale**: Tags (ctags, ttags, dtags) affect discoverability and taxonomy consistency. Delegated owners should focus on content.

---

## 4. Record Tags (rtags) Specification

### What are rtags?

**rtags** = "Record Tags" - boolean flags for well-known record states.

**NOT**: Region tags (that would be location/geography related)

### Standard rtags Flags

| Bit | Flag | Description |
|-----|------|-------------|
| 0 | `isFeatured` | Highlighted in listings, promoted |
| 1 | `isDeprecated` | Marked as outdated, may be hidden |
| 2 | `isPinned` | Stays at top of lists |
| 3 | `isArchiveWorthy` | Should be preserved in archives |
| 4 | `isTemplate` | Used as template for new records |
| 5 | `isInternal` | Hidden from external/public view |
| 6 | `needsReview` | Flagged for editorial review |
| 7 | `hasMedia` | Contains images/video (for filtering) |

### Integration with StatusEditor

rtags should have a dedicated slot in StatusEditor:
- Displayed as toggle switches
- Tabbed UI: Status transitions | rtags | Tasks

```vue
<StatusEditor :post="post" :project="project">
  <template #rtags>
    <div class="rtags-toggles">
      <Toggle v-model="isFeatured" label="Featured" />
      <Toggle v-model="isDeprecated" label="Deprecated" />
      <Toggle v-model="isPinned" label="Pinned" />
      <!-- ... -->
    </div>
  </template>
</StatusEditor>
```

---

## Implementation Priority

| Extension | Complexity | Value | Priority |
|-----------|------------|-------|----------|
| rtags specification | Low | High | v0.4 |
| Tag edit restriction | Low | Medium | v0.5 |
| `write-nocreate` | Medium | Medium | v0.5 |
| `read-summary` limitation | Medium | Low | v0.5+ |
| `write-body` vs `write-meta` | High | Low | v1.0+ |

---

## Related Documents

- [POSTS-WORKFLOW-SPEC.md](./POSTS-WORKFLOW-SPEC.md) - Core 15 rules
- [PROJECT-WORKFLOW-SPEC.md](./PROJECT-WORKFLOW-SPEC.md) - Project lifecycle
- [capabilities-howto.md](../../docs/dev/sysreg/capabilities-howto.md) - Role system
