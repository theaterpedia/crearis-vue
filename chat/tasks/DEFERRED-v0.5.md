# Deferred Tasks for v0.5

**Version Focus:** Comments Polymorphic Routing + Odoo Reference Implementation  
**Target:** January 2026

---

## Session & useAuth Cleanup

### Remove Deprecated/Ambiguous Fields

**Created:** 2025-12-11  
**Context:** Session and useAuth contain legacy fields from various iterations that may mislead future development.

**Current Issues:**

1. **ProjectRecord interface has redundant fields:**
   - `id` (contains domaincode, NOT integer id - misleading!)
   - `domaincode` (correct field)
   - `name` (sometimes domaincode, sometimes project name)
   - `heading` (legacy, now called `name` in DB)
   - `username` (unclear purpose - seems to be domaincode fallback?)

2. **Session stores `projectId` as string (domaincode):**
   - But `projects[].id` is also domaincode
   - Real database `projects.id` is INTEGER, never exposed
   - This creates confusion about what "id" means

3. **User interface has overlapping role fields:**
   - `role` (base role from users table)
   - `activeRole` (current active role)
   - `availableRoles` (array of possible roles)
   - Logic spread across multiple places

4. **Capabilities stored inconsistently:**
   - Session stores as `Map<string, Set<string>>`
   - Response converts to `Record<string, string[]>`
   - Frontend has to handle both formats

**Tasks:**
- [ ] Rename `ProjectRecord.id` → `ProjectRecord.domaincode` (breaking change, grep all usages)
- [ ] Remove `ProjectRecord.username` (unused or replace with clear field)
- [ ] Clarify `ProjectRecord.name` vs `ProjectRecord.heading` (pick one!)
- [ ] Add clear JSDoc comments to all session/auth interfaces
- [ ] Consider: single `UserSession` interface shared between server and client
- [ ] Document: which fields come from DB vs computed at login

**Files to Audit:**
- `server/api/auth/login.post.ts` - SessionData interface, response building
- `server/api/auth/session.get.ts` - Response transformation
- `src/composables/useAuth.ts` - User interface, ProjectRecord interface
- All components using `user.value?.projectId` or `project.id`

---

## Test Suite Updates (Migration 061)

### Fix Tests for Partners Table Refactor

Migration 061 unified `instructors`, `locations`, and `participants` into a single `partners` table with `partner_types` bitmask. This breaks tests that reference the old schema.

**Affected Areas:**
- [ ] Tests querying `users.instructor_id` (now `users.partner_id`)
- [ ] Tests querying `instructors` table directly (use `instructors_v` view or `partners`)
- [ ] Tests querying `locations` table directly (use `locations_v` view or `partners`)
- [ ] Tests querying `participants` table directly (use `participants_v` view or `partners`)
- [ ] Auth tests expecting `instructor_id` in user response

**Breaking Changes from Migration 061:**
- `users.instructor_id` → `users.partner_id`
- `users.participant_id` → `users.partner_id` (single link to partners table)
- Direct table access: use views (`instructors_v`, `locations_v`, `participants_v`) for backwards compatibility
- `partner_types` bitmask: 1=instructor, 2=location, 4=participant, 8=organisation

**Related Commits:**
- Migration 061: `9218ce7` (partners table creation)
- Auth refactor: `a047ee9` (API updates for partner_id)

---

## ⭕ Terminology and Routes for External Websites

Clarify ambiguous usage of 'home' and 'home'-routes in file-system and the meaning of the terminology:

**Current Ambiguity:**
- In the current implementation 'home' addresses routes on the root (`/home`) as well as beyond `/sites`
- We have distinct functionality at route `/start` (external project-login)

**Questions to Resolve:**
1. Is `/start` for events or just a special view on selected events that are in the phase where 'registering is open'?
2. What is the difference from route `/sites/[domaincode]/events` to `/sites/[domaincode]/start`?
3. Legal pages: where do imprint, privacy policy, terms live? Root or per-site?

**Tasks:**
- [ ] Document route terminology: `/home` vs `/sites/:domaincode/home`
- [ ] Clarify `/start` route purpose and relationship to events
- [ ] Define legal pages location strategy
- [ ] Update BETA_ARCHITECTURE_GUIDE with clarified routes

---

## User/Partner Name Fields

### Add firstname/lastname Support

Currently `/home` route uses `username` and splits on space to get firstname. This is a workaround.

**Task:** Update users/partners tables to support proper name fields:

- [ ] Add `firstname`, `lastname` columns to `users` table
- [ ] Add `firstname`, `lastname` columns to `partners` table (if not already from Odoo)
- [ ] Update `/api/auth/login.post.ts` to return firstname in session
- [ ] Update `HomeLayout.vue` to use `user.firstname` instead of split hack
- [ ] Consider: sync with Odoo `res.partner` name fields

**Current Workaround (HomeLayout.vue):**
```ts
const userFirstName = computed(() => {
    const username = user.value?.username || 'Gast'
    return username.split(' ')[0]
})
```

---

## Full Profile Editor

### Edit User & Partner Profile Fields

**Created:** 2025-12-11  
**Context:** After basic onboarding (partner link + avatar), users need ability to edit full profile

**User Fields to Edit:**
- [ ] Email (sysmail vs display email?)
- [ ] Username / Display name
- [ ] Password change

**Partner Fields to Edit:**
- [ ] Name (firstname, lastname)
- [ ] Email (contact email)
- [ ] Phone
- [ ] Address (street, city, zip, country_id)
- [ ] Description / Bio
- [ ] Avatar (already implemented in onboarding)

**Tasks:**
- [ ] Create `ProfileEditor.vue` component
- [ ] Create `/api/users/me` PATCH endpoint for user fields
- [ ] Extend `/api/partners/[id].patch` for all editable fields
- [ ] Add profile edit button/link to `/home` header
- [ ] Validation: email format, required fields
- [ ] Consider: Odoo sync for partner fields

---

## Onboarding Flow Cleanup

### HomeLayoutHack.vue → OnboardingStepper Migration

**Created:** 2025-12-11  
**Context:** Quick iteration on user onboarding states without polluting clean architecture

**Current State:**
- `/home` route uses `HomeLayoutHack.vue` (temporary hack)
- `/home-clean` route uses original `HomeLayout.vue` (preserved)
- `OnboardingStepper.vue` + `onboarding-config.ts` are ready but not integrated

**Tasks:**
- [x] Validate business logic in HomeLayoutHack.vue through testing (2025-12-11)
- [x] Create API endpoints: `/api/users/me/partner`, `/api/users/me/avatar`, `/api/users/me/activate` (2025-12-11)
- [x] Create API endpoint: `/api/partners/[id].patch` for avatar sync to partner (2025-12-11)
- [ ] Extract validated partner-linking logic into `ProfileSetupPartner.vue` component
- [ ] Extract validated avatar-upload logic into `ProfileSetupAvatar.vue` component
- [ ] Integrate new components with `OnboardingStepper.vue`
- [ ] Revert `/home` route to use clean `HomeLayout.vue` with stepper
- [ ] Delete `HomeLayoutHack.vue`

**State Flow Validated:**
| Status | Value | Onboarding Step |
|--------|-------|----------------|
| NEW | 1 | E-Mail verification required |
| DEMO | 8 | Partner linking + Avatar upload |
| DRAFT | 64 | Profile activation + public profile option |
| CONFIRMED | 1024 | Full project access with stepper |

---

## Theme System Review

### Systematize CSS Color Variables with Theme-Builder

**Created:** 2025-12-11  
**Context:** Current theme variables in `00-theme.css` were set manually without a systematic approach. Need to use theme-builder tool to establish coherent variable relationships.

**Current Issues:**
- `--color-card-bg` was pure white (100%), too stark against page background
- Relationship between `--color-bg`, `--color-card-bg`, `--color-muted-bg` unclear
- No documented rationale for lightness/chroma values
- `05-internal-theme.css` has computed values that may conflict

**Tasks:**
- [ ] Review all color variables in `00-theme.css` with theme-builder tool
- [ ] Establish systematic lightness scale (e.g., bg=96%, card=98%, muted=88%)
- [ ] Document color variable relationships in `theme-opus-css.md`
- [ ] Verify dark mode variables follow same relationships
- [ ] Consider: derive computed vars from base vars (like `05-internal-theme.css`)
- [ ] Test all UI states (cards, forms, hover, disabled) with new values

**Files:**
- `src/assets/css/00-theme.css` - base theme variables
- `src/assets/css/05-internal-theme.css` - computed/derived variables
- `docs/dev/features/theme-opus-css.md` - documentation

---

## Core v0.5 Scope

### Comments/PostIT Polymorphic Routing

Reference implementation for routing comments to specialized tables based on `entity_type`:

```
/api/comments → router
  │
  ├─ entity_type='image' → image_workitems (table 059)
  ├─ entity_type='project' → tasks (existing, category='comment')
  ├─ entity_type='event' → event_workitems (v0.6)
  └─ entity_type='post' → comments (table 057)
```

**Tasks:**
- [ ] Create `IWorkitem` interface in `types/workitems.ts`
- [ ] Implement polymorphic routing in `/api/comments/*.ts`
- [ ] Reference implementation: wire `entity_type='image'` to `image_workitems`
- [ ] Planning document: which entity_types route to which tables in v0.6/v0.7

### Odoo Comments Sync (Reference Implementation)

- [ ] One direction only: Vue → Odoo (mail.message creation)
- [ ] Map comment author to Odoo partner_id
- [ ] Wire pinned comments to Odoo starred messages
- [ ] Document sync protocol for v0.6 full implementation

---

## Planning Outputs

### v0.6 Comments Routing Plan
Determine which entity_types should route to specialized tables:

| entity_type | v0.6 Target Table | Odoo Model |
|-------------|-------------------|------------|
| `image` | `image_workitems` | - |
| `event` | `event_workitems` | `calendar.event` |
| `project` | `tasks` | `project.task` |
| `post` | `comments` | `mail.message` |

### v0.7 Full Odoo Sync Plan
- Bidirectional sync for which comment types?
- Conflict resolution strategy
- Batch sync vs real-time

---

## Migration Status

| Migration | Status | Description |
|-----------|--------|-------------|
| 057 | ✅ Registered | `comments` + `comment_reactions` tables |
| 058 | ❌ DELETED | Generic workitems (contradicts negative-spec) |
| 059 | ✅ Registered | `image_workitems` table |
| 060 | ✅ Registered | Event Odoo stub fields |

---

## Notes

- PostIT frontend (`usePostITComments.ts`) already complete
- API endpoints (`/api/comments/*`) already complete
- Just needed table (057) to exist
- Polymorphic routing is backend-only change, no frontend updates needed

---

## Need Migration: Entities Must Never Have NULL Status

### Status Column NOT NULL Constraint

**Created:** 2025-12-12  
**Context:** AddPostPanel creates posts with NULL status, causing them to not appear in filtered queries. Status column must have NOT NULL constraint with default.

**Affected Tables:**
- [ ] `posts` - status column should be NOT NULL DEFAULT 1 (NEW)
- [ ] `events` - status column should be NOT NULL DEFAULT 1 (NEW)
- [ ] `images` - status column should be NOT NULL DEFAULT 1 (NEW)
- [ ] `projects` - status column should be NOT NULL DEFAULT 1 (NEW)
- [ ] `users` - status column should be NOT NULL DEFAULT 1 (NEW)
- [ ] `partners` - status column should be NOT NULL DEFAULT 1 (NEW)

**Migration Tasks:**
- [ ] Update existing NULL status values to 1 (NEW)
- [ ] Add NOT NULL constraint with DEFAULT 1
- [ ] Verify all API endpoints set proper status on INSERT

**Status Values Reference:**
| Status | Value | Description |
|--------|-------|-------------|
| NEW | 1 | Just created, needs setup |
| DEMO | 8 | In demo/editing phase |
| DRAFT | 64 | Draft, not published |
| REVIEW | 256 | Pending review |
| CONFIRMED | 512 | Approved |
| PUBLISHED | 1024 | Live/public |

---

## Remove SQLite Adapter

### Pure PostgreSQL Project

**Created:** 2025-12-11  
**Context:** This is a pure PostgreSQL project. SQLite adapter code is deprecated since Migration 019 but still present in codebase.

**Files to Remove/Clean:**
- [ ] `server/database/adapters/sqlite.ts` - SQLite adapter implementation
- [ ] `server/database/adapters/sqlite-statements.ts` - SQLite prepared statements (if exists)
- [ ] SQLite fallback logic in `server/database/db-new.ts`
- [ ] SQLite-specific syntax in any migrations (use PostgreSQL-only)
- [ ] `demo-data.db` and any `.db` files in gitignore cleanup
- [ ] Test utilities referencing SQLite (`tests/utils/db-test-utils.ts`)

**Config Cleanup:**
- [ ] Remove `dbConfig.sqlite` option from `server/database/config.ts`
- [ ] Remove `DATABASE_TYPE=sqlite` env var documentation
- [ ] Update README/docs to state PostgreSQL-only requirement

**Code Patterns to Find & Remove:**
```ts
// Remove these patterns:
if (dbConfig.type === 'sqlite') { ... }
datetime('now')  // SQLite syntax
? placeholders converted to $1  // Keep this, it's useful
```

**Validation:**
- [ ] Grep for `sqlite` (case-insensitive) across codebase
- [ ] Ensure all migrations use PostgreSQL syntax only
- [ ] Run full test suite after removal

---

## Unify Stepper & Dashboard Experience

### DashboardLayout.vue Refactoring

**Created:** 2025-12-12  
**Context:** ProjectDashboard.vue currently has two separate code paths: Stepper (NEW/DEMO status) and Dashboard (DRAFT+ status). These should be unified to reduce code duplication and maintenance burden.

**Current State:**
- **Stepper Mode** (`status < 64`): Vertical step navigation in left column, content in right column
- **Dashboard Mode** (`status >= 64`): DashboardLayout with entity lists, EntityBrowser, settings tab

**Goal:** Single unified component with mode switching, not two separate implementations.

**Key Observations:**
1. Both modes use the same `ProjectSettingsPanel` component
2. Both navigate the same entity types (posts, events, images, partners)
3. Stepper is essentially Dashboard with:
   - Vertical nav instead of horizontal tabs
   - Hidden entity lists (pGallery only shows filtered items)
   - No entity browser/detail view
   - Step-by-step guidance flow

**Proposed Unification:**
- [ ] Extract common navigation structure (steps/tabs are same concept)
- [ ] Add `stepper-mode` prop to DashboardLayout (or computed from project status)
- [ ] Stepper mode: vertical nav, hide entity lists, show add-panels inline
- [ ] Dashboard mode: horizontal tabs, show entity lists, EntityBrowser for details
- [ ] Add "Home" step to stepper showing project summary/progress
- [ ] Settings step works identically in both modes (already does!)

**Navigation Model:**
```
Stepper Mode (vertical):
├── Home (summary, progress indicators)
├── Posts (pGallery + AddPostPanel)
├── Events (pGallery + EventPanel)
├── Images (pGallery + ImageImport)
├── Partners (pGallery + InvitePanel)
└── Settings (ProjectSettingsPanel - full width)

Dashboard Mode (horizontal tabs):
├── Posts (List + EntityBrowser)
├── Events (List + EntityBrowser)
├── Images (List + EntityBrowser)
├── Partners (List + EntityBrowser)
└── Settings (ProjectSettingsPanel - COG tab)
```

**Files to Consolidate:**
- `src/views/project/ProjectDashboard.vue` - Current stepper implementation
- `src/components/dashboard/DashboardLayout.vue` - Current dashboard implementation
- `src/views/project/ProjectStepPosts.vue` → integrate into unified flow
- `src/views/project/ProjectStepEvents.vue` → integrate into unified flow
- `src/views/project/ProjectStepImages.vue` → integrate into unified flow
- `src/views/project/ProjectStepUsers.vue` → integrate into unified flow

**Benefits:**
- Single source of truth for project navigation
- Easier to maintain and extend
- Consistent behavior across project states
- Smoother transition from setup to active project

---

## Synchronize EventType with ctags:Format

### Tag-Based Event Type Selection

**Created:** 2025-12-12  
**Context:** EventPanel and similar add/edit components have separate EventType selection that should be synchronized with the ctags (context tags) system, specifically the "Format" tag family.

**Current State:**
- EventPanel has standalone event type dropdown
- ctags system has "Format" family for event formats (Workshop, Seminar, etc.)
- These two systems are not connected
- User may select conflicting values

**Goal:** Event type selection should read from and write to ctags:Format, ensuring single source of truth.

**Affected Components:**
- [ ] `src/components/EventPanel.vue` - Add event panel in stepper
- [ ] `src/components/EditPanel.vue` - Edit panel (events mode)
- [ ] Any other event creation/editing forms

**Implementation Approach:**
- [ ] Replace event_type dropdown with ctags:Format tag selector
- [ ] Or: Keep dropdown but sync value to ctags:Format on save
- [ ] Ensure TagFamilies component can be used in "single-select" mode for Format
- [ ] Migration: backfill existing events' ctags from event_type field

**Related:**
- TagFamilies.vue component
- ctags field in events table
- Format tag family in sysreg
