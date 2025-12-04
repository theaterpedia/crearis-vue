# Posts Workflow Specification

**Version:** v0.3-v0.5  
**Last Updated:** December 4, 2025  
**Status:** Draft  
**Derived from:** Project Workflow Spec (implied patterns)

---

## Permission Rules (15 Rules)

### AllRole Rules (apply to all roles)

| # | Rule Name | Description | Implementation |
|---|-----------|-------------|----------------|
| 1 | `POST_ALLROLE_READ_RELEASED` | Anyone can read released posts in released projects | `post.status >= 4096 && project.status >= 4096` |

### Owner Rules (post-level ownership)

| # | Rule Name | Description | Implementation |
|---|-----------|-------------|----------------|
| 2 | `POST_OWNER_FULL` | Post owner has full access to their post | `post.owner_user_id === user.id` |

### Read Rules

| # | Rule Name | Description | Implementation |
|---|-----------|-------------|----------------|
| 3 | `POST_READ_P_OWNER` | Project owner reads all posts | `isProjectOwner(user, project)` |
| 4 | `POST_READ_P_MEMBER_DRAFT` | Members read posts in draft+ state | `isMember && post.status >= 64` |
| 5 | `POST_READ_P_PARTICIPANT_REVIEW` | Participants read posts in review+ | `isParticipant && post.status >= 256` |
| 6 | `POST_READ_P_PARTNER_CONFIRMED` | Partners read posts in confirmed+ | `isPartner && post.status >= 512` |
| 7 | `POST_READ_DEPTH_BY_PROJECT` | Content depth by project state | `demo→summary, draft→core, review+→full` |

### Write Rules

| # | Rule Name | Description | Implementation |
|---|-----------|-------------|----------------|
| 8 | `POST_WRITE_OWN` | Post owner can edit own post | `post.owner_user_id === user.id` |
| 9 | `POST_WRITE_P_OWNER` | Project owner can edit any post | `isProjectOwner(user, project)` |
| 10 | `POST_WRITE_P_MEMBER_EDITOR` | Member with configrole=8 can edit | `isMember && role.configrole === 8` |
| 11 | `POST_CREATE_P_MEMBER` | Members can create posts in draft+ projects | `isMember && project.status >= 64` |

### State Transition Rules

| # | Rule Name | Description | Implementation |
|---|-----------|-------------|----------------|
| 12 | `POST_TRANSITION_CREATOR_SUBMIT` | Creator can submit new→draft, draft→review | `isCreator && validTransition` |
| 13 | `POST_TRANSITION_P_OWNER_APPROVE` | Project owner approves review→confirmed | `isProjectOwner` |
| 14 | `POST_TRANSITION_P_OWNER_REJECT` | Project owner rejects review→draft (send-back) | `isProjectOwner` |
| 15 | `POST_TRANSITION_P_OWNER_SKIP` | Owner can skip review if team ≤ 3 | `teamSize <= 3 && isProjectOwner` |

---

## Overview

This spec defines the post lifecycle within a project context. Posts are **contained entities** - their visibility and editability depend on both their own state AND their parent project's state.

Key insight from project spec: The level of detail visible in a post depends on both project state and user role.

---

## Post States

| State | Bit Value | Description |
|-------|-----------|-------------|
| `new` | 1 | Just created, only creator sees |
| `draft` | 64 | Work in progress |
| `review` | 256 | Ready for team review |
| `confirmed` | 512 | Approved by owner/editor |
| `released` | 4096 | Published |
| `archived` | 32768 | Historical |
| `trash` | 65536 | Soft deleted |

---

## Visibility Layers

### Layer 1: Project State Context

The **project state** determines what content depth is visible:

| Project State | Content Depth Visible |
|---------------|----------------------|
| `new` | Nothing (owner-only) |
| `demo` | **Summary only**: headline + teaser |
| `draft` | **Core**: headline + teaser + body (via modal) |
| `review+` | **Full**: all fields + comments on entity |

### Layer 2: Post State within Project

Within an accessible project, the **post state** determines who sees it:

| Post State | Owner | Member | Participant | Partner | Anonymous |
|------------|-------|--------|-------------|---------|-----------|
| `new` | ✅ | ❌ | ❌ | ❌ | ❌ |
| `draft` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `review` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `confirmed` | ✅ | ✅ | ✅ | ✅ | ❌ |
| `released` | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## UI Patterns by Project State

### Project in `demo` State (Stepper Layout)

```
┌─────────────────────────────────────────────────┐
│  📝 Posts                                       │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │ Theater und Partizipation              │   │
│  │ Ein Beitrag über demokratische...      │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │ Methoden der Aktivierung               │   │
│  │ Wie wir Menschen einbeziehen...        │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  (no "view more" button - demo mode)            │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Rules:**
- Only headline + teaser visible
- No body content access
- Read-only for members
- Comments only on project-level (Comments step)

### Project in `draft` State (Dashboard Layout)

```
┌─────────────────────────────────────────────────┐
│  📝 Posts                                       │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │ Theater und Partizipation        [📄]  │   │
│  │ Ein Beitrag über demokratische...      │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │ Methoden der Aktivierung         [📄]  │   │
│  │ Wie wir Menschen einbeziehen...        │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  [ + New Post ]                                 │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Rules:**
- Headline + teaser visible in list
- [📄] button opens modal with full body
- Members can edit (if post state allows)
- Members can create new posts
- No entity-level comments yet

### Project in `review+` State (Dashboard + Post-It Comments)

```
┌─────────────────────────────────────────────────────────┐
│  📝 Posts                                               │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────────────────────────────┐           │
│  │ Theater und Partizipation        [📄]  │  [💬p1]   │
│  │ Ein Beitrag über demokratische...      │           │
│  │ [✏️ Edit] [📤 Submit for Review]        │           │
│  └─────────────────────────────────────────┘           │
│                                    ↘                   │
│                              ┌──────────────────┐      │
│                              │ 💬 Nina:         │      │
│                              │ "Great point..." │      │
│                              │ ├─ Hans: "Thx!" │      │
│                              │ └─ [Reply]       │      │
│                              └──────────────────┘      │
│                                                         │
│  ┌─────────────────────────────────────────┐           │
│  │ Methoden der Aktivierung         [📄]  │  [💬p2]   │
│  │ Wie wir Menschen einbeziehen...        │           │
│  └─────────────────────────────────────────┘           │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Rules:**
- Full content access
- **Post-it comments** (max 9 per page, anchored to content)
- Simple Q&A threading (replies to root only, no deeper)
- Edit buttons for authorized users
- State transition buttons for owner

**Why Post-its (not aside)?**
- Solves vertical sync problem naturally
- Core crearis design element
- Same pattern for internal review AND published reader comments
- See: [POSTIT-COMMENTS-INTEGRATION-PLAN.md](./POSTIT-COMMENTS-INTEGRATION-PLAN.md)

---

## Write Permissions

### Who Can Edit a Post?

| Actor | Condition |
|-------|-----------|
| Post creator | Always (if project state allows) |
| Project owner | Always |
| Member with configrole=8 | If project in `draft+` AND post in `draft+` |
| Other members | Cannot edit others' posts |
| Participants | **Can edit posts they own** (via delegation) |
| Partners | **Can edit posts they own** (via delegation) |

### Delegation Pattern

**Key insight:** Project owner can delegate a post to a participant or partner by transferring `owner_user_id`. This gives them edit access on that specific item (per-item basis, not role-wide).

**Use case:** Participant has something interesting to share → owner creates post shell → transfers ownership → participant can now edit that specific post.

```typescript
// Delegation = transfer owner_user_id
await $fetch(`/api/posts/${postId}`, {
  method: 'PATCH',
  body: { owner_user_id: participantUserId }
})
```

### Who Can Create a Post?

| Actor | Condition |
|-------|-----------|
| Project owner | Always |
| Member | If project in `draft+` (default `write-all` mode) |
| Member | Never in `write-nocreate` projects (v0.5) |
| Participant | Never |
| Partner | Never |

---

## State Transitions

### Post State Flow

```
new → draft → review → confirmed → released → archived
                 ↑__________↓
              (reject sends back)
```

### Transition Permissions

| Transition | Who Can Do It |
|------------|---------------|
| `new → draft` | Post creator |
| `draft → review` | Post creator, project owner |
| `review → confirmed` | Project owner only |
| `review → draft` | Project owner (reject/send-back) |
| `confirmed → released` | Project owner only |
| `* → trash` | Post creator, project owner |

### Skip Rule (Small Teams)

**Rule:** If team ≤ 3 persons (owner + up to 2 members), owner can skip `review` state and go directly `draft → confirmed`.

**Rationale:** With only 2-3 people, they're expected to have co-worked on the draft already. Formal review step adds friction without value.

```typescript
// Check if skip is allowed
const canSkipReview = (project: Project) => {
  const teamSize = 1 + project.members.length // owner + members
  return teamSize <= 3
}
```

---

## Tag Fields

Posts support multiple tag dimensions (implemented in v0.2):

| Field | Purpose | Example |
|-------|---------|---------|
| `dtags` | Domain/topic tags | `["demokratie", "theater"]` |
| `ctags` | Content type tags | `["methode", "bericht"]` |
| `ttags` | Target audience tags | `["jugend", "erwachsene"]` |
| `rtags` | Region tags | `["augsburg", "bayern"]` |

---

## Comments System (Post-It Based)

### Storage Decision (v0.3)

**Approach:** JSONB field `comments` on posts table

**Rationale:**
- Fast, no joins, contained within record
- Most posts won't have comments
- Consistent pattern across entities (posts, events, images, projects)
- Alternative `config.comments` rejected: `config` already used for layout/navigation on projects

**Schema:**
```typescript
interface PostComment {
  id: string              // UUID
  user_id: number         // Author
  text: string            // Comment content (markdown supported)
  anchor_key: string      // p1-p9 positioning key for post-it
  anchor_selector?: string // Optional: CSS selector for precise anchoring
  parent_id?: string      // For Q&A threading (root comments only)
  visibility: 'internal' | 'published'  // review vs reader-visible
  created_at: string      // ISO timestamp
  updated_at?: string     // If edited
}

// posts.comments: PostComment[] (JSONB, default '[]')
```

### Threading Logic (Simple Q&A)

```
Comment (p1) ─── "Great point about the methodology"
    └── Reply ─── "Thanks! We expanded on it in section 3"
    └── Reply ─── "Could you clarify the timeline?"
         └── (NO DEEPER - replies to replies not allowed)
```

**Rule:** `parent_id` can only reference a root comment (where `parent_id` is null).

### Max 9 Comments Displayed

Post-it system enforces max 9 open. For posts with >9 comments:
- Show 9 most recent
- "View all comments" collapses older into scrollable list

**Access Rules:**
| Project State | Who Can Comment |
|---------------|-----------------|
| `demo` | Members (on project-level only, not entity) |
| `draft` | No entity comments yet |
| `review+` | Members on entities |

**v0.5 Migration Path:**
Consider moving to `tasks WHERE type='comment'` when tasks system matures.
This aligns with Odoo chatter pattern and allows comments to become actionable tasks.

---

## Test Scenarios

### Test Data

| Project | State | Posts |
|---------|-------|-------|
| opus1 | new | 0 (need to create for activation) |
| opus2 | released | 2 existing posts |
| opus3 | draft | 1 existing post |

### Test Users (opus1)

| User | Email | Role |
|------|-------|------|
| Hans Opus | hans.opus@theaterpedia.org | owner |
| Nina Opus | nina.opus@theaterpedia.org | member |
| Rosa Opus | rosa.opus@theaterpedia.org | participant |
| Marc Opus | marc.opus@theaterpedia.org | partner |

### Scenario: Post Visibility by Project State

```gherkin
Feature: Post Visibility in Demo Project

  Background:
    Given opus1 is in state 'demo'
    And opus1 has a post "Theater und Demokratie"

  Scenario: Member sees summary only in demo
    Given Nina is logged in as member
    When Nina views opus1
    Then she sees the Stepper layout
    And she sees post headline "Theater und Demokratie"
    And she sees the teaser text
    But she cannot access the body content
    And there is no "view full" button

  Scenario: Owner sees summary in demo (same as member)
    Given Hans is logged in as owner
    When Hans views opus1 in demo mode
    Then he sees headline and teaser
    And he has an "Edit" button (owner privilege)
    But body is not shown inline
```

### Scenario: Post Visibility in Draft Project

```gherkin
Feature: Post Access in Draft Project

  Background:
    Given opus1 is in state 'draft'
    And opus1 has a post "Theater und Demokratie"

  Scenario: Member can view body via modal
    Given Nina is logged in as member
    When Nina views opus1
    Then she sees the Dashboard layout
    And post cards show headline + teaser
    And each card has a [📄] button
    When Nina clicks [📄]
    Then a modal opens with full body content

  Scenario: Member can create new post
    Given Nina is logged in as member
    When Nina views opus1 posts tab
    Then she sees a "+ New Post" button
    When Nina clicks "+ New Post"
    Then a create post form opens

  Scenario: Participant can only read summary
    Given Rosa is logged in as participant
    When Rosa views opus1
    Then she sees headline + teaser
    But she cannot access body modal (v0.5: TBD)
    And she has no "+ New Post" button
```

### Scenario: Post Editing Permissions

```gherkin
Feature: Post Edit Authorization

  Background:
    Given opus1 is in state 'draft'
    And Hans created post "Theater und Demokratie"
    And Nina created post "Methoden"

  Scenario: Member can edit own post
    Given Nina is logged in
    When Nina views her post "Methoden"
    Then she sees an Edit button
    And she can modify the content

  Scenario: Member cannot edit other's post
    Given Nina is logged in
    When Nina views Hans's post "Theater und Demokratie"
    Then she does not see an Edit button
    And PATCH request returns 403

  Scenario: Owner can edit any post
    Given Hans is logged in
    When Hans views Nina's post "Methoden"
    Then he sees an Edit button
    And he can modify the content
```

---

## API Endpoints (Implemented v0.2)

### GET /api/posts

```
GET /api/posts?project_id=9&visibility=true

Response: Posts filtered by user's visibility permissions
```

### POST /api/posts

```
POST /api/posts
{
  "project_id": 9,
  "heading": "New Post Title",
  "teasertext": "Brief description",
  "bodytext": "Full content...",
  "status": 64,
  "dtags": ["demokratie"],
  "ctags": ["bericht"],
  "ttags": [],
  "rtags": ["augsburg"]
}
```

### PATCH /api/posts/:id

```
PATCH /api/posts/123
{
  "heading": "Updated Title",
  "bodytext": "Updated content..."
}

Authorization:
- Post owner: allowed
- Project owner: allowed  
- Member (configrole=8) on non-owned post: allowed
- Participant/Partner: 403 Forbidden
```

---

## Implementation Checklist

### v0.2 (Completed ✅)

- [x] POST /api/posts with tag fields
- [x] PATCH /api/posts/:id with authorization
- [x] GET /api/posts with visibility filtering
- [x] Integration tests (15 passing)

### v0.3 (December 5)

- [ ] Post list component (headline + teaser cards)
- [ ] Body modal component
- [ ] Create post form
- [ ] Edit post form
- [ ] State transition buttons (owner only)

### v0.4 (December 9)

- [ ] Publishing workflow: draft → review → released
- [ ] Reject flow: review → draft
- [ ] Entity-level comments

### v0.5 (Deferred)

- [ ] `read-summary` limitation for participants
- [ ] `write-nocreate` respect in UI
- [ ] `write-body` vs `write-meta` distinction

---

## Related Specs

- [Project Workflow Spec](./PROJECT-WORKFLOW-SPEC.md) - Parent context
- [Capabilities Howto](../docs/dev/sysreg/capabilities-howto.md) - Role system
- [Integration Tests](../tests/integration/posts-visibility.test.ts) - Working tests
