# Lunch Summary - December 4, 2025

**Time**: 12:25 - 13:15  
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
| **Lunch Summary** | ✅ | This document (new phase added to daily workflow!) |
| Afternoon | ⏳ | TDD + PageLayout investigation |
| Evening | 🕐 | StatusEditor prep (Hans provides prompts) |

### Commits Today (6 total)

1. `f502989` - Workflow specs, test data, best practices
2. `0b2421b` - Posts workflow: 15 rules, post-it comments plan
3. `695c5d1` - Posts permissions: Shared utils + Internal design
4. `4b12814` - Lunch summary: Daily workflow update + sidelined items review

### Files Created

| File | Purpose |
|------|---------|
| `chat/tasks/PROJECT-WORKFLOW-SPEC.md` | Full project lifecycle spec |
| `chat/tasks/POSTS-WORKFLOW-SPEC.md` | 15 permission rules + internal design |
| `chat/tasks/POSTIT-COMMENTS-INTEGRATION-PLAN.md` | Post-it comments roadmap |
| `chat/tasks/WORKFLOW-TAGS-EXTENSIONS.md` | Consolidated deferred extensions |
| `server/utils/posts-permissions.ts` | Server-side permission functions |
| `src/composables/usePostPermissions.ts` | Frontend reactive composable |

---

## Lunch Review Decisions

### Process Improvement: Lunch Summary Phase
- **Added to DAILY-WORKFLOW.md**: New "Lunch Summary" phase (11:30-12:00)
- **Purpose**: Review sidelined items, create anchors for future retrieval
- **Procedure**: Claude prepares initial findings → Hans reviews → Update with decisions

### Sidelined Items Actions

| Item | Action Taken | Result |
|------|--------------|--------|
| Comments → Tasks migration | Left as-is | Stays in deferred (v0.5+) |
| 5 workflow/tags extensions | **Grouped into new doc** | [WORKFLOW-TAGS-EXTENSIONS.md](./WORKFLOW-TAGS-EXTENSIONS.md) |
| rtags definition | **Corrected** | rtags = "record tags" (not region), flags like `isFeatured`, `isDeprecated` |

### Afternoon Direction: Option 2 Selected

**Two options presented:**
1. ~~Design polish~~ - Wire up UI, visual refinement
2. **✅ Project Workflow Alignment** - Leverage posts-workflow for projects

**Why Option 2:**
- Creates reusable patterns (not one-off polish)
- TDD foundation for two entity types
- Perfect sunrise reflection material tomorrow
- Tomorrow = UI/design work + test with real Nina

**Key Question to Investigate:**
> "How can we align project-stepper + dashboard closer to PageLayout.vue?"

---

## Afternoon Plan (Confirmed)

| Time | Activity |
|------|----------|
| 14:00-15:00 | Unit tests for posts-permissions (pure functions) |
| 15:00-16:00 | Investigate PageLayout ↔ Stepper/Dashboard alignment |
| 16:00+ | Check-in with Hans, present findings |
| Evening | StatusEditor prep (Hans provides prompts) |

---

## Testing Strategy

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

## End of Day Goal (Updated)

> "By the end of the day we will have a complete internal experience for the posts including the statusEditor"

**Refined focus:**
- Today: TDD + data-processing logic + StatusEditor prep
- Tomorrow: Design/UI interaction work (test with real Nina)

### Deliverables

- [ ] Unit tests for posts-permissions.ts
- [ ] PageLayout ↔ Stepper/Dashboard alignment investigation
- [ ] StatusEditor prep (evening prompts from Hans)
- [ ] Project workflow alignment plan
