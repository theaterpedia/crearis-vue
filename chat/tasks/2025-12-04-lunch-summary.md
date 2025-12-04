# Lunch Summary - December 4, 2025

**Time**: 12:25  
**Sprint**: Projectlogin Workflow (Dec 1-9)  
**Branch**: alpha/projectlogin_workflow

---

## Morning Session Complete ✅

### 5-Step Daily Plan Status

| Step | Status | Notes |
|------|--------|-------|
| Early Sunrise | ✅ | Analyzed sprint structure |
| Late Sunrise | ✅ | Plan of day created |
| Morning | ✅ | 15 rules defined + shared utils created |
| **Lunch Summary** | ✅ | This document (new phase!) |
| Afternoon | ⏳ | Surface to UI/tests (NOW) |
| Evening | 🕐 | Review/commit (later) |

### Commits Today (5 total)

1. `f502989` - Workflow specs, test data, best practices
2. `0b2421b` - Posts workflow: 15 rules, post-it comments plan
3. `695c5d1` - Posts permissions: Shared utils + Internal design

### Files Created

| File | Purpose |
|------|---------|
| `chat/tasks/PROJECT-WORKFLOW-SPEC.md` | Full project lifecycle spec |
| `chat/tasks/POSTS-WORKFLOW-SPEC.md` | 15 permission rules + internal design |
| `chat/tasks/POSTIT-COMMENTS-INTEGRATION-PLAN.md` | Post-it comments roadmap |
| `server/utils/posts-permissions.ts` | Server-side permission functions |
| `src/composables/usePostPermissions.ts` | Frontend reactive composable |

---

## Sidelined/Deferred Items

| Item | Why Deferred | Origin | Target |
|------|--------------|--------|--------|
| Comments → Tasks migration | Post-its handle immediate need; tasks system needs maturity | ~09:30 comments storage discussion | v0.5+ |
| Workflow & Tags Extensions | Consolidated into [WORKFLOW-TAGS-EXTENSIONS.md](./WORKFLOW-TAGS-EXTENSIONS.md) | Multiple morning discussions | v0.5 |

### Workflow & Tags Extensions (New Doc)

Grouped 5 related items into single reference document:
1. **`read-summary` for participants** - Limited content depth
2. **`write-nocreate` mode** - Project config for creation restriction
3. **`write-body` vs `write-meta`** - Fine-grained edit permissions
4. **Tag edit restriction** - Delegated owners can't edit taxonomy
5. **rtags specification** - Record tags: `isFeatured`, `isDeprecated`, `isPinned`, etc.

**Correction**: rtags = "record tags" (not region tags) - boolean flags for well-known record states.

---

## Afternoon Plan: TDD Testing Strategy

### What Can Be Tested Now

**A. Server Utils - Unit Tests** (`server/utils/posts-permissions.ts`)
- All 15 rules as pure functions
- No database dependencies - perfect for unit tests

**B. Integration Tests** (Real API + Database)
- Using opus1 (Hans=owner, Nina=member, Rosa=participant, Marc=partner)
- Using opus3 (Kathrin=owner, small team for skip rule)

**C. Composable Tests** (`src/composables/usePostPermissions.ts`)
- Mock `useAuth()` return values
- Test reactive permission computation

---

## Proposed Testing Strategy

### Unit Tests (Composable/Utils - fast, isolated)
**File**: `tests/unit/posts-permissions.test.ts`

| Test | What |
|------|------|
| Rule 1 | `canReadReleased()` - released post + released project |
| Rule 2 | `hasFullAccessAsOwner()` - post owner check |
| Rules 3-6 | Read by role + post status threshold |
| Rule 7 | `getContentDepth()` by project status |
| Rules 8-10 | Write permissions by role |
| Rule 11 | `canCreatePost()` by role + project status |
| Rules 12-15 | State transitions, skip rule |

### Integration Tests (Real API + Database)
**File**: `tests/integration/posts-permissions.test.ts`

**Using opus1** (Hans=owner, Nina=member, Rosa=participant, Marc=partner):

| Scenario | Users | What |
|----------|-------|------|
| Member reads draft post | Nina | Rule 4 |
| Participant can't read draft | Rosa | Rule 5 boundary |
| Partner reads confirmed only | Marc | Rule 6 |
| Member edits in draft project | Nina | Rule 10 |
| Owner approves review→confirmed | Hans | Rule 13 |
| Owner rejects review→draft | Hans | Rule 14 |

**Using opus3** (Kathrin=owner, small team):

| Scenario | Users | What |
|----------|-------|------|
| Skip review (team ≤ 3) | Kathrin | Rule 15 |
| Owner direct draft→confirmed | Kathrin | Skip rule in action |

---

## Questions to Resolve After Lunch

1. **Test data state**: Current state of opus1/opus3 posts?
2. **Priority scenarios**: Which rules most critical first?
3. **Skip rule verification**: How is team_size computed/stored?

---

## End of Day Goal

> "By the end of the day we will have a complete internal experience for the posts including the statusEditor"

### Deliverables

- [ ] Unit tests for posts-permissions.ts
- [ ] Extended integration tests
- [ ] StatusTile.vue (display component)
- [ ] StatusEditor.vue (workflow surface with transitions)
- [ ] Wire up to PostPage.vue
