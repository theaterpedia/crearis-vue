# Database Schema Documentation

This document describes the main tables in the database, their fields, relationships, and business rules after Migration 019.

## Table of Contents

- [Core Tables](#core-tables)
  - [users](#users)
  - [participants](#participants)
  - [instructors](#instructors)
  - [projects](#projects)
  - [tasks](#tasks)
  - [events](#events)
  - [posts](#posts)
- [Status System](#status-system)
- [Relationships](#relationships)
- [Business Rules](#business-rules)

---

## Core Tables

### users

**Purpose**: System users with authentication and profile information

**Fields**:
- `id` (SERIAL/INTEGER, PK) - Auto-incrementing user ID
- `sysmail` (TEXT, UNIQUE) - System email address (formerly used as primary identifier)
- `username` (TEXT, UNIQUE) - Display username
- `password` (TEXT) - Hashed password (bcrypt)
- `role` (TEXT) - User role: 'admin', 'editor', 'viewer'
- `status_id` (INTEGER, FK → status) - References status table with table='users'
- `participant_id` (INTEGER, FK → participants) - Link to participant profile (optional)
- `instructor_id` (INTEGER, FK → instructors) - Link to instructor profile (optional)
- `created_at` (TIMESTAMP) - Record creation timestamp
- `updated_at` (TIMESTAMP) - Last update timestamp

**Status Values** (table='users'):
- `0` - new: Newly created
- `1` - demo: Demo/example data
- `2` - verified: Email verified / progress: Work in progress
- `3` - publish: Public profile
- `4` - done/synced: Synced with external system / Completed
- `6` - public: Public user
- `16` - trash: In trash/deleted
- `32` - archived: Archived
- `48` - linked: Linked/referenced data

**Triggers**:
- Updates `participants.is_user` when `participant_id` changes
- Updates `instructors.is_user` when `instructor_id` changes

**Indexes**:
- Unique on `sysmail`
- Unique on `username`

---

### participants

**Purpose**: Participant profiles (participants in events/courses)

**Fields**:
- `id` (SERIAL/INTEGER, PK) - Auto-incrementing participant ID
- `xmlid` (TEXT, UNIQUE) - Legacy XML/external system ID
- `name` (TEXT) - Participant full name
- `email` (TEXT) - Contact email
- `phone` (TEXT) - Contact phone number
- `bio` (TEXT) - Biography/description
- `status_id` (INTEGER, FK → status) - References status table with table='persons'
- `is_user` (BOOLEAN) - TRUE if linked to a user account (maintained by trigger)
- `created_at` (TIMESTAMP) - Record creation timestamp
- `updated_at` (TIMESTAMP) - Last update timestamp

**Status Values** (table='persons'):
- `0` - new: Newly created
- `1` - demo: Demo/example data
- `2` - active/progress: Active person / Work in progress
- `4` - done/synced: Synced with external system / Completed
- `6` - public: Public person
- `16` - trash/deleted: In trash/deleted
- `32` - archived: Archived person
- `48` - linked: Linked/referenced data

**Computed Fields**:
- `is_user` - Maintained by trigger `trg_update_participant_is_user` on users table

**Indexes**:
- Unique on `xmlid`

---

### instructors

**Purpose**: Instructor/teacher profiles for events and courses

**Fields**:
- `id` (SERIAL/INTEGER, PK) - Auto-incrementing instructor ID
- `xmlid` (TEXT, UNIQUE) - Legacy XML/external system ID
- `name` (TEXT) - Instructor full name
- `title` (TEXT) - Professional title
- `email` (TEXT) - Contact email
- `phone` (TEXT) - Contact phone number
- `bio` (TEXT) - Biography/description
- `header_size` (TEXT) - Header display size: 'small', 'medium', 'large'
- `status_id` (INTEGER, FK → status) - References status table with table='persons'
- `is_user` (BOOLEAN) - TRUE if linked to a user account (maintained by trigger)
- `regio_id` (INTEGER, FK → projects) - Associated region project (if is_user=TRUE)
- `created_at` (TIMESTAMP) - Record creation timestamp
- `updated_at` (TIMESTAMP) - Last update timestamp

**Status Values**: Same as participants (table='persons')

**Computed Fields**:
- `is_user` - Maintained by trigger `trg_update_instructor_is_user` on users table
- `regio_id` - Maintained by trigger `trg_update_instructors_regio` (only if is_user=TRUE)

**Indexes**:
- Unique on `xmlid`

**Business Rules**:
- `header_size` must be one of: 'small', 'medium', 'large'
- `regio_id` is only populated if `is_user=TRUE` and the linked user owns/is member of a regio project

---

### projects

**Purpose**: Main projects/sites in the system

**Fields**:
- `id` (SERIAL/INTEGER, PK) - Auto-incrementing project ID
- `domaincode` (TEXT, UNIQUE, NOT NULL) - Domain/site identifier (formerly primary key)
- `name` (TEXT) - Project name (formerly `heading`)
- `heading` (TEXT) - Display heading
- `description` (TEXT) - Project description
- `status` (TEXT) - Legacy status field (being phased out)
- `owner_id` (INTEGER, FK → users) - Project owner
- `type` (TEXT) - Project type: 'standard', 'regio', 'special'
- `regio` (INTEGER, FK → projects.id) - Parent region project (self-referential)
- `is_regio` (BOOLEAN) - TRUE if this is a region project
- `header_type` (TEXT) - Header display type
- `header_size` (TEXT) - Header display size: 'small', 'medium', 'large'
- `md` (TEXT) - Markdown content
- `html` (TEXT) - HTML content
- `partner_projects` (JSONB/TEXT) - Related partner projects
- `theme` (TEXT) - Visual theme
- `cimg` (TEXT) - Cover image URL
- `teaser` (TEXT) - Short teaser text
- `team_page` (TEXT) - Team page setting: 'yes', 'no'
- `cta_title` (TEXT) - Call-to-action title
- `cta_form` (TEXT) - Call-to-action form
- `cta_entity` (TEXT) - CTA entity type: 'post', 'event', 'instructor'
- `cta_link` (TEXT) - Call-to-action link
- `is_company` (BOOLEAN) - TRUE if company project
- `is_location_provider` (BOOLEAN) - TRUE if provides locations (maintained by trigger)
- `config` (JSONB/TEXT) - Project configuration JSON
- `domain_id` (INTEGER, FK → domains) - Associated domain
- `member_ids` (JSONB/TEXT) - Project member user IDs
- `created_at` (TIMESTAMP) - Record creation timestamp
- `updated_at` (TIMESTAMP) - Last update timestamp

**Computed Fields**:
- `is_onepage` - GENERATED ALWAYS AS `(config->>'onepage')::BOOLEAN`
- `is_service` - GENERATED ALWAYS AS `(config->>'service')::BOOLEAN`
- `is_location_provider` - Maintained by trigger `trg_update_project_location_provider` on locations table

**Status Values** (table='projects'):
- `0` - new: Newly created
- `1` - demo: Demo/example data
- `2` - draft/progress: Draft version / Work in progress
- `3` - publish: Published
- `4` - done/released: Released / Completed
- `16` - trash: In trash/deleted
- `32` - archived: Archived
- `48` - linked: Linked/referenced data

**Indexes**:
- Unique on `domaincode`
- Index on `owner_id`
- Index on `domain_id`
- Index on `regio`

**Business Rules**:
- `domaincode` must be unique and not null
- `team_page` must be 'yes' or 'no'
- `cta_entity` must be 'post', 'event', or 'instructor'
- `header_size` must be 'small', 'medium', or 'large'

---

### tasks

**Purpose**: Task/todo items in the system

**Fields**:
- `id` (SERIAL/INTEGER, PK) - Auto-incrementing task ID
- `name` (TEXT, NOT NULL) - Task name (formerly `title`)
- `description` (TEXT) - Task description
- `cimg` (TEXT) - Cover image URL (formerly `image`)
- `status_id` (INTEGER, FK → status, NOT NULL) - References status table with table='tasks'
- `priority` (INTEGER) - Task priority level
- `due_date` (TIMESTAMP) - Due date/deadline
- `assigned_to` (INTEGER, FK → users) - Assigned user
- `project_id` (INTEGER, FK → projects) - Associated project
- `created_at` (TIMESTAMP) - Record creation timestamp
- `updated_at` (TIMESTAMP) - Last update timestamp

**Status Values** (table='tasks'):
- `0` - new: Newly created task
- `1` - idea: Task idea/concept
- `2` - draft: Draft task
- `4` - active: Active/in-progress task
- `5` - final: Completed task
- `8` - reopen: Reopened task
- `16` - trash: Trashed task

**Indexes**:
- Index on `status_id`
- Index on `assigned_to`
- Index on `project_id`

**Business Rules**:
- `name` is required (NOT NULL)
- `status_id` is required (NOT NULL)
- Default status is 'idea' (value=1)

---

### events

**Purpose**: Events/courses/workshops in the system

**Fields**:
- `id` (SERIAL/INTEGER, PK) - Auto-incrementing ID
- `xmlid` (TEXT, UNIQUE) - Legacy XML/external system ID
- `name` (TEXT) - Event name
- `description` (TEXT) - Event description
- `status` (TEXT) - Legacy status field (TEXT)
- `status_id` (INTEGER, FK → status) - New status FK (being migrated in Chapter 3)
- `project` (TEXT, FK → projects.domaincode) - Associated project (TEXT, will be INTEGER)
- `public_user` (INTEGER, FK → instructors) - Public-facing instructor
- `location` (INTEGER, FK → locations) - Event location
- `start_date` (TIMESTAMP) - Event start date/time
- `end_date` (TIMESTAMP) - Event end date/time
- `lang` (TEXT) - Content language: 'de', 'en', 'cz' (default: 'de')
- `tags_ids` (INTEGER[]) - Array of tag IDs (computed from events_tags junction)
- `tags_display` (TEXT[]) - Array of translated tag names (computed)
- `regio_id` (INTEGER, FK → projects) - Associated region project (computed)
- `user_id` (INTEGER, FK → users) - Creating user
- `created_at` (TIMESTAMP) - Record creation timestamp
- `updated_at` (TIMESTAMP) - Last update timestamp

**Status Values** (table='events'):
- `2` - draft: Draft version
- `3` - publish: Published
- `4` - released: Released
- `6` - confirmed: Confirmed event
- `8` - running: Currently running
- `9` - passed: Event has passed
- `12` - documented: Documented

**Computed Fields**:
- `tags_ids` - Maintained by trigger `trg_update_events_tags` on events_tags junction table
- `tags_display` - Maintained by trigger `trg_update_events_tags` (translated based on `lang`)
- `regio_id` - Maintained by trigger `trg_update_events_regio` (copied from project.regio)

**Junction Tables**:
- `events_tags` (event_id TEXT, tag_id INTEGER) - Many-to-many relationship with tags

**Indexes**:
- Primary key on `id`
- Index on `project`
- Index on `public_user`
- Index on `location`

**Business Rules**:
- `lang` must be 'de', 'en', or 'cz'
- When publishing (status value > 2), `public_user` must reference an instructor with `is_user=TRUE`
- Validation enforced by trigger `trg_validate_event_status`

---

### posts

**Purpose**: Blog posts, articles, news in the system

**Fields**:
- `id` (SERIAL/INTEGER, PK) - Auto-incrementing ID
- `xmlid` (TEXT, UNIQUE) - Legacy XML/external system ID
- `name` (TEXT) - Post name/title
- `description` (TEXT) - Post description
- `content` (TEXT) - Post content body
- `status` (TEXT) - Legacy status field (TEXT)
- `status_id` (INTEGER, FK → status) - New status FK (being migrated in Chapter 3)
- `project` (TEXT, FK → projects.domaincode) - Associated project (TEXT, will be INTEGER)
- `public_user` (INTEGER, FK → instructors) - Public-facing author
- `lang` (TEXT) - Content language: 'de', 'en', 'cz' (default: 'de')
- `tags_ids` (INTEGER[]) - Array of tag IDs (computed from posts_tags junction)
- `tags_display` (TEXT[]) - Array of translated tag names (computed)
- `regio_id` (INTEGER, FK → projects) - Associated region project (computed)
- `published_at` (TIMESTAMP) - Publication date/time
- `user_id` (INTEGER, FK → users) - Creating user
- `created_at` (TIMESTAMP) - Record creation timestamp
- `updated_at` (TIMESTAMP) - Last update timestamp

**Status Values** (table='posts'):
- `2` - draft: Draft version
- `3` - publish: Published
- `4` - released: Released

**Computed Fields**:
- `tags_ids` - Maintained by trigger `trg_update_posts_tags` on posts_tags junction table
- `tags_display` - Maintained by trigger `trg_update_posts_tags` (translated based on `lang`)
- `regio_id` - Maintained by trigger `trg_update_posts_regio` (copied from project.regio)

**Junction Tables**:
- `posts_tags` (post_id TEXT, tag_id INTEGER) - Many-to-many relationship with tags

**Indexes**:
- Primary key on `id`
- Index on `project`
- Index on `public_user`

**Business Rules**:
- `lang` must be 'de', 'en', or 'cz'

---

## Status System

The status system uses a central `status` table with per-table status definitions.

### status Table

**Fields**:
- `id` (SERIAL/INTEGER, PK) - Auto-incrementing status ID
- `value` (SMALLINT/INTEGER, NOT NULL) - Numeric status value (used for comparisons)
- `name` (TEXT, NOT NULL) - Status name/identifier
- `table` (TEXT, NOT NULL) - Target table name
- `description` (TEXT) - Human-readable description
- `name_i18n` (JSONB/TEXT) - Translated names: `{ de: "...", en: "...", cz: "..." }`
- `desc_i18n` (JSONB/TEXT) - Translated descriptions

**Constraints**:
- UNIQUE(name, table) - Each status name is unique per table
- `table` must be one of: 'projects', 'events', 'posts', 'persons', 'users', 'tasks'

**Indexes**:
- Index on `name`
- Index on `table`
- Unique index on `(name, table)`

### Status Value Patterns

**Common Status Values** (used across multiple tables):
- `0` - new: Newly created
- `1` - demo: Demo/example data
- `2` - progress/draft: Work in progress / Draft version
- `4` - done/released: Completed / Released
- `16` - trash: In trash/deleted (record type bit flag)
- `32` - archived: Archived (record type bit flag)
- `48` - linked: Linked/referenced data (record type bit flag)

**Bitmask Structure** (used in some implementations):
- Bits 4-5: Record type (00=standard, 01=trash, 10=archived, 11=linked)
- Bits 0-3: Status value (0-15)

---

## Relationships

### User Integration

```
users (1) ←→ (0..1) participants [participant_id]
users (1) ←→ (0..1) instructors [instructor_id]
users (1) ← (N) projects [owner_id]
users (1) ← (N) tasks [assigned_to]
users (1) ← (N) events [user_id]
users (1) ← (N) posts [user_id]
```

### Project Hierarchy

```
projects (1) ← (N) projects [regio] (self-referential)
projects (1) ← (N) tasks [project_id]
projects (1) ← (N) events [project]
projects (1) ← (N) posts [project]
```

### Content Relationships

```
instructors (1) ← (N) events [public_user]
instructors (1) ← (N) posts [public_user]
locations (1) ← (N) events [location]
```

### Many-to-Many Relationships

```
events (N) ←→ (N) tags [events_tags junction table]
posts (N) ←→ (N) tags [posts_tags junction table]
projects (N) ←→ (N) users [project_members junction table]
events (N) ←→ (N) instructors [event_instructors junction table]
```

---

## Business Rules

### User Account Rules

1. **User-Participant Link**: A user can be linked to at most one participant profile via `participant_id`
2. **User-Instructor Link**: A user can be linked to at most one instructor profile via `instructor_id`
3. **Participant is_user**: Automatically set to TRUE when a user links to the participant
4. **Instructor is_user**: Automatically set to TRUE when a user links to the instructor
5. **Instructor regio_id**: Only populated if `is_user=TRUE` and the linked user owns/is member of a regio project

### Project Rules

1. **Unique Domaincode**: Each project must have a unique `domaincode`
2. **Self-Referential Region**: Projects can reference another project as their `regio` (parent region)
3. **is_regio Flag**: Marks projects that are region projects
4. **Location Provider**: `is_location_provider` is automatically TRUE if the project has locations with status > 2
5. **Computed Fields**: `is_onepage` and `is_service` are computed from the `config` JSONB field

### Task Rules

1. **Required Fields**: `name` and `status_id` are required
2. **Default Status**: New tasks default to status 'idea' (value=1)
3. **Status Values**: Use dedicated task statuses (new, idea, draft, active, final, reopen, trash)

### Event Rules

1. **Publishing Validation**: When status value > 2 (publishing), `public_user` must:
   - Reference a valid instructor
   - The instructor must have `is_user=TRUE`
   - Enforced by trigger `trg_validate_event_status`
2. **Language**: Must be 'de', 'en', or 'cz'
3. **Tags**: Managed via `events_tags` junction table, automatically computed into `tags_ids` and `tags_display`
4. **Region Association**: `regio_id` is automatically copied from the associated project's `regio` field

### Post Rules

1. **Language**: Must be 'de', 'en', or 'cz'
2. **Tags**: Managed via `posts_tags` junction table, automatically computed into `tags_ids` and `tags_display`
3. **Region Association**: `regio_id` is automatically copied from the associated project's `regio` field

### Status Rules

1. **Per-Table Status**: Each table has its own set of status values
2. **Status FK**: Tables use `status_id` as foreign key to the `status` table
3. **Status Validation**: Status queries filter by `table` column: `WHERE "table" = 'tablename'`
4. **Status Comparison**: Use numeric `value` field for comparisons (e.g., `value > 2` for "published")

---

## Migration History

- **Migration 019**: Major schema refactoring
  - Migrated users, participants, instructors, locations to auto-increment IDs
  - Migrated projects to auto-increment ID (domaincode moved to separate column)
  - Migrated tasks to use status_id FK
  - Added events/posts status_id migration
  - Added native tagging system
  - Added computed regio_id fields
  - Added event publishing validation
  - Added all status table entries

- **Migration 021**: System data seeding
  - Seeds initial tags
  - Status entries now seeded in Migration 019
  - Seeds system config, projects, users, domains, memberships

---

## Notes

### Computed Field Maintenance

Several fields are maintained by database triggers:
- `participants.is_user` - Updated when users.participant_id changes
- `instructors.is_user` - Updated when users.instructor_id changes
- `instructors.regio_id` - Updated when instructors.is_user changes
- `projects.is_location_provider` - Updated when locations are added/updated/deleted
- `events.tags_ids`, `events.tags_display` - Updated when events_tags changes
- `posts.tags_ids`, `posts.tags_display` - Updated when posts_tags changes
- `events.regio_id` - Updated when events.project changes
- `posts.regio_id` - Updated when posts.project changes

### I18n Support

The system supports multi-language content:
- Status names and descriptions have i18n fields (de, en, cz)
- Events and posts have `lang` field to specify content language
- Tag display names are translated based on content language
- Tags have `name_i18n` field for translated names

---

*Last updated: Migration 019 completion*
