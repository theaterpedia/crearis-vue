# Post-It Comments Integration Plan

**Created**: 2025-12-04  
**Sprint**: Projectlogin Workflow (Dec 1-9)  
**Status**: Planning → Gradual Implementation

---

## Overview

Use the existing `fpostit` system as the UI for post comments, replacing traditional aside-based comments. This solves:

1. **Vertical sync problem**: Post-its anchor to content naturally
2. **Internal + External**: Same pattern for review comments AND published reader break-outs
3. **Design consistency**: Post-its are a core crearis design element
4. **Deferred work**: Avoids immediate aside-to-dashboard implementation

---

## Current fpostit System Status

### ✅ Already Working
- `useFpostitController` - Singleton controller (create, open, close)
- `useFpostitEvents` - Event bridge for HTML↔Vue communication
- `FloatingPostIt.vue` - Core floating component with themes
- `FpostitRenderer.vue` - Global renderer (in App.vue)
- `fPostitDefault.vue` - Default trigger component
- Markdown integration via `markedExtension.ts`
- HTML discovery via `data-fpost*` attributes
- Max 9 post-its per page (enforced)
- Smart positioning (4 modes: default, left, right, element)
- Mobile responsive (50% width, click-based positioning)
- 8 theme colors
- Demo pages: `/demo/float-hard`, `/demo/float-dyn`, `/demo/float-markdown`

### ⚠️ Needs Verification
- [ ] Tests may be slightly outdated (isolated, should mostly work)
- [ ] `FpostitRenderer` in App.vue (confirm placement)

---

## Integration Architecture

### Data Model

```typescript
// In posts table: JSONB `comments` field
interface PostComment {
  id: string              // UUID
  user_id: number         // FK to users
  text: string            // Comment content (markdown?)
  anchor_key: string      // p1-p9 positioning key
  anchor_selector?: string // Optional: CSS selector for precise anchoring
  parent_id?: string      // For threading (question→answer only)
  created_at: string
  updated_at?: string
  visibility: 'internal' | 'published'  // Internal = review, Published = reader-visible
}

// Extended for display
interface PostCommentDisplay extends PostComment {
  user_name: string
  user_avatar?: string
  replies?: PostCommentDisplay[]  // Max 1 level deep (Q&A only)
}
```

### Threading Logic (Simple Q&A)

```
Comment (p1) ─── "Great point about the methodology"
    └── Reply ─── "Thanks! We expanded on it in section 3"
    └── Reply ─── "Could you clarify the timeline?"
         └── (NO DEEPER - replies to replies not allowed)
```

**Rule**: `parent_id` can only reference a root comment (no nested threading)

---

## Implementation Phases

### Phase 1: Data Layer (v0.3 - Dec 5)
- [ ] Add `comments` JSONB field to posts table (migration)
- [ ] Create `PostComment` TypeScript interface
- [ ] Add comments to posts API responses
- [ ] Validate comment structure on save

### Phase 2: Display Integration (v0.3-v0.4)
- [ ] Create `usePostComments` composable
  - Load comments from post data
  - Map comments to fpostit keys (p1-p9)
  - Handle max 9 constraint gracefully
- [ ] Create `PostCommentPostit.vue` wrapper component
  - Uses fPostitDefault internally
  - Adds comment metadata (author, time)
  - Shows reply thread in content
- [ ] Integrate with post body rendering
  - Auto-discover anchor points in post content
  - Place comment triggers at anchor locations

### Phase 3: Comment Creation (v0.4)
- [ ] "Add Comment" UI in edit mode
  - Click location → determines anchor_key
  - Opens comment form in post-it
- [ ] Save comment to posts.comments JSONB
- [ ] Refresh post-it display

### Phase 4: Threading (v0.4-v0.5)
- [ ] "Reply" action button in post-it
- [ ] Reply form (inline or separate post-it?)
- [ ] Display replies in parent post-it content
- [ ] Enforce max 1 level depth

### Phase 5: Published Comments (v0.5+)
- [ ] `visibility: 'published'` filter
- [ ] Reader-facing post-it triggers in published post body
- [ ] Preview other content in post-it (link to related posts/events)

---

## Key Decisions

### Max 9 Comments Displayed
**Keep enforced**. If post has >9 comments:
- Option A: Show 9 most recent, collapse older into "View all comments"
- Option B: Show 9 by anchor position, paginate rest
- **Recommended**: Option A (recency-based)

### Anchor Strategy
1. **Manual anchoring**: Author clicks position when creating comment
2. **Content anchoring**: Comment targets specific text (like Google Docs)
3. **Section anchoring**: Comments attach to H2/H3 sections

**Recommended for v0.3-v0.4**: Manual anchoring (simplest)

### Threading UI
- **Option A**: Replies shown inline in parent post-it content
- **Option B**: Replies open as separate post-its (linked)

**Recommended**: Option A (keeps related discussion together)

### Comment Form Location
- **Option A**: Post-it itself becomes editable
- **Option B**: Separate modal/sidebar form
- **Option C**: Inline form that converts to post-it on save

**Recommended**: Option C (natural flow)

---

## Component Mapping

| Existing Component | Comments Integration |
|-------------------|---------------------|
| `useFpostitController` | Unchanged - manages comment post-its |
| `FloatingPostIt.vue` | Unchanged - renders comment content |
| `FpostitRenderer.vue` | Unchanged - in App.vue |
| `fPostitDefault.vue` | Wrap with `PostCommentPostit.vue` |
| `useFpostitEvents` | Use for reply/edit actions |

### New Components Needed

```
src/components/comments/
├── PostCommentPostit.vue    # Wrapper with author/time metadata
├── PostCommentForm.vue      # Create/edit comment form
├── PostCommentThread.vue    # Renders replies within post-it
└── usePostComments.ts       # Composable for comment data
```

---

## API Endpoints (Future)

```
GET  /api/posts/:id          # Returns post with comments
POST /api/posts/:id/comments # Add comment
PUT  /api/posts/:id/comments/:commentId  # Edit comment
DELETE /api/posts/:id/comments/:commentId # Delete comment
```

*Note: Since comments are JSONB, these update the post record*

---

## Testing Strategy

### Existing Tests to Verify
- [ ] Run fpostit demo pages manually
- [ ] Check if existing integration tests still pass

### New Tests Needed
- [ ] Comment JSONB validation
- [ ] Max 9 comment display
- [ ] Threading depth enforcement
- [ ] Comment visibility filtering

---

## Timeline Alignment

| Version | Date | Comments Focus |
|---------|------|----------------|
| v0.3 | Dec 5 | Data layer + basic display |
| v0.4 | Dec 6-7 | Creation + threading |
| v0.5 | Dec 8-9 | Published comments + polish |

---

## Open Questions

1. **Markdown in comments?** - Probably yes (simple subset)
2. **Comment notifications?** - Deferred (v0.6+)
3. **Comment moderation?** - Owner can delete any, author can edit own
4. **Anchor persistence?** - What if anchored content is deleted?

---

## Next Steps (Today)

1. ✅ Plan created
2. ⏳ Finalize posts permission rules (10:30-11:00)
3. ⏳ Create shared utils for posts workflow (11:00-11:30)
4. 📋 Comments integration starts Dec 5 (v0.3)
