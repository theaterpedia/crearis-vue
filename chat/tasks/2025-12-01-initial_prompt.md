# Auth-System: roles, capabilities, projects + implementation of the 'public role' anonym
The existing auth-system will be refactored. We keep the role-names 'admin', 'user', 'base' as they are. But on the routes /projects and /sites only the role 'project' was used so far. This will be deprecated now and replaced by 'owner' and 'member'. Detection of 'owner' is correctly implemented in the auth-system already. Detection of 'member' will need further work (it works but we want to bring in new roles with less capabilities than 'member' has).

Below you find a full description of how those more differentiated roles are configured as matrix of capabilities. It uses the sysreg-system (table sysreg_config).

The same system will be used to bring more control on the publishing of entities via route /sites using the 'anonym' role.
Table sysreg_config needs to be fully cleared of entries and will be completely redefined on sysreg-bitgroups.json.


## main idea: routing, roles, composables, api, db-trigger
The crearis-implementation provides a network of interdependant projects that each have a landing-page (/sites/:domaincode) and typically 1-5 rollup-pages like /sites/:domaincode/posts, /events, /images, some legal pages. Via /sites/:domaincode/posts[id / slug] /sites/:domaincode/events[id / slug] an entity-page is addressed. 

(MY QUESTION): at the moment we only have started this with /sites/:domaincode/posts/:id' -> not having a rollup-page. Do you recommend renaming here to separate routes for rollup and single-entity? Or is it the best-practice to have both on the same route, simply without params or with params?

The home-routes (routes on website-root) are used for the special projects 'tp' and 'dev' only. At the moment they build up a landing-page. From v0.5 onwards the home-route '/' will act as a hub/showcase for content of all of the projects and will start providing  search-engine-like functionality using the dtags, ctags etc. On the homeroutes no other actions than page-viewing will be implemented (+ things like anonymous signing-up for a newsletter).
The core functionality of the system is located beyond /projects, /sites, /admin, now on the course from v0.2-v0.4 we fully focus on /projects and partially on /sites:

/projects is for logged-in users only. For every project-type a map of roles, capabilities, entities and data-states is created. All operations that are executed on the routes beyond /projects are checked against this map. 
The publicly available data is accessed via routes beyond /sites. The first access on /sites is always against the read-enpoint. From information received on read the frontend can understand that further capabilities exist for the authed role. This allows for things like directly displaying edit- and config-panels (see: /home/persona/crearis/crearis-vue/src/components/EventPanel.vue + /home/persona/crearis/crearis-vue/src/components/EditPanel.vue).

In the current implementation the admin-role is excluded from these things (has no access to /project) and uses hardcoded views and components under route /admin instead to access admin-typical functionality. 
EXPLANATION 1: If an admin-user wants to act as superuser (enabled to edit anything everywhere) this would require to create another user that explicitly is configured as project-owner role on every project. Projects can have multiple owners. But the convention is that every project rather should have only one owner to stop ambiguous configurations where gaps arise about content-responsability.
EXPLANATION 2: we have a 'base'-role in the existing implementation at some places (for instance baseView.vue). This is another hardcoded role that stays excluded from the config and excluded from doing anything on the routes /projects /sites. Base has the single purpose to work on templates and demo-content that serve all projects. Maybe it will be deprecated.

Now to the core:
Beyond /sites we have this simple logic: Routes either host roll-up-pages (or collection-pages like 'posts') or they host entity-pages. Rollup-pages typically are defined via project-config and are not used to directly edit content but provide click-actions that route to the entity-page. There is no option to directly bring an entity-page into edit-mode, under /sites we always access an entity with a query against the read-endpoint of the entity. Every entity table serves these fields: r_anonym, r_service, r_recipient, r_participant, r_member, r_owner. These are generated columns that are under control of a single database-trigger that consolidates the core publishing-logic into six booleans (These fields and trigger all have to be created).
On accessing the endpoint either without a session (r_anonym) or by identifying the appropriate role-config from the active session the endpoint filters the records down to the read-enabled records, optionally applies additional category-, entity- or search-filters and then provides the result to the frontend.
Each entity extends the basic project-type-config with additional entity_settings that are hardcoded in a json-file (much like the sysreg-bitgroups.json). Those entity_settings can be used both on the frontend (composables) and the backend (endpoints).
On the frontend a useConfig-composable (needs to be implemented) is initialized on every role-change. It loads the role-specific content from the sysreg_config and applies the project-type-config > entity_settings - extensions and then understands whether the currently active role has other capabilities than simply entity-read. 

(Sidenote for future strategy): In a future implementation (v1.1) on requesting the config from the composable the active view can provide a local config-integer. This is taken from the config-field that is stored for every entity on the database. The composable decides whether this completely replaces the default-config or if a special merging-strategy will applied. On the backend this will be cross-checked and limited to secure against malicious usage, for instance a review-by-project-owner could be needed, 2FA or something like this.

(Further explanation core-system):
If other capabilities then simply entity-read exist then additional commands, UI-Components are added to the active view. They provide actions that access other endpoints (Put?). Those endpoints process the exact same security-chain as the composable, thus providing effective protection against frontside-hacks or implementation-errors.

We need to decide on the refactoring-strategy for /api:
We could either implement a strategy that get-queries primarily support the /sites-logic and have other queries or specially named queries that support the /project-logic by default only accessible to project-users.
Or we migrate the api step by step to a structure where api-access is structured beyond /api/site, /api/projects, /api/admin.
In any case it will be needed to implement some shared logic and you should make proposals for that.


#### main idea: capabilities-matrix -> reduced matrix (performance) -> config-details
This is on OVERVIEW about the general idea ans strategy how to build sysreg_config.

Sysreg_config hosts the matrix of capabilities: implemented as a combination of 'extended crud-terminology', roles, entities, core-record-states and project-types. The 'extended crud-terminology' are simple things like 'read' or 'write' or 'manage' that define well-known standards for database-operations.
This matrix constructed of entries on sysreg_config decides all these questions: which role gets which access to records of a certain entity assigned to a project. 

The matrix as a whole can get quite long. But in reality it will always be compressed:
Since the whole system always has a single project loaded on the session and can exactly filter down the matrix to the needs of that project. The role is the project-role of the user and the type is type of the project. This mechanism always narrows the matrix down to a fragment of available complexity and could be used by composables.


The system works in a way that by default nothing is allowed and that every entry on the config basically enables read-operations to 'anonym', crud-operations for roles like 'member' + manage-operations for the 'owner'.
The config is constructed in the same way as are all the other entries on sysreg: It is a combination of simple rules on bitgroups like implemented with categories->subcategories and sysreg-bitgroups.json. 
It sligthly extends this system by a merge-flag-functionality of the 0-bit to prevent the need to configure an endless amount of basic settings on and on again.
The system should reuse code. It should especially try to make sysreg_config editable via sysregAdmin.vue. We want to reuse code and logic for crafting the still missing statusEditor.vue and statusDisplay.vue (close to tagGroupEditor.vue + tagFamilyDisplay.vue).

## SYSREG_CONFIG
THIS IS THE SPEC FOR SYSREG_CONFIG: IT DEFINES THE CAPABILITIES-MATRIX bit-by-bit.

It combines the whole access-matrix that is needed for roles-having-capabilities-on-entitiy-records-per-state for each project into 28 bits (if I calculated correctly):
0: default(merge) | special - project
1-3: project-type
4-8: entities
9-11: states
12-23: complex capabilities
24-25: simple capabilities
26-30: roles
31: admin-role (v0.5)



### Project-Types

#### 0 bit: 'default' (=merge) or 'special'

#### 2 bits for the project-types
| bits | state   | status.status-value |
| ---- | ------- | ------------------- |
| 00   | core    |                     |
| 01   | topic   |                     |
| 10   | project |                     |
| 11   | regio   |                     |
|      |         |                     |
Core allows to edit the project itself, manage the project-team, have project-level posts, events and images, but those entities are 'internal'. It does not allow to publish anything beyond the project homepage. On the homepage only the content of the homepage-record itself can be displayed. Public images, events and posts from other projects can be shared (on the project-homepage).

#### -> how 0-bit and project-type are combined
- ``default core`` and ``special core`` are identical!
- ``default topic`` and ``special topic`` are different > ``default topic`` has all capabilities that registered under ``default core`` + ``default topc`` 
- there is no secondary inheritance (regio does not inherit from topic + project)

#### what are special projects?
dev: special topic
tp: special project

### Entities

#### 5 bits for the entities
first bit: 0=all entities | 1=distinct entity
2nd, 3rd, 4th bit: entities

bit 5: leave unused here -> we may want to go further into detail with entities from v1.1

| bits 2-4 | state   | status.status-value                                                                          |
| -------- | ------- | -------------------------------------------------------------------------------------------- |
| 000      | default | unspecified entities like for instance 'features' (still to be implemented)                  |
| 001      | user    | (may be this will be used for 'persons' like 'instructors' as well, to be decided from v0.5) |
| 010      | project |                                                                                              |
| 011      | image   |                                                                                              |
| 100      | post    |                                                                                              |
| 101      | event   |                                                                                              |
| 110      | -       |                                                                                              |
| 111      | -       |                                                                                              |


### States

#### 3 bits for the states (main states)
This maps to sysreg_status.status

| bits | state    | status.status-value |
| ---- | -------- | ------------------- |
| 000  | all                 |                     |
| 001  | new / undefined     |                     |
| 010  | demo                |                     |
| 011  | draft               |                     |
| 100  | review              |                     |
| 101  | released            |                     |
| 110  | archived            |                     |
| 111  | trash               |                     |


### Capabilities
The capabilities are implemented using the category->subcategory-mechanism like ctags, dtags.
This means that there is a parent-category (example: "update all").
TODO for code-automation: You need to understand this exactly, especially how to implement the parent-bit-detection

#### 4x3 bits for complex capabilities
these are the complex capabilities:
read: allow for full reading
update: 
create: 
manage: 

##### example: update

| bits | state            | status.status-value                                    |
| ---- | ---------------- | ------------------------------------------------------ |
| 000  | no update        | no update-capabilities                                 |
| 001  | update all       | all update-capabilities                                |
| 010  | update > comment | only add comments                                      |
| 011  | update > append  | only append new content                                |
| 100  | update > replace | replace existing content by new contend                |
| 101  | update > shift   | change things like date, costs, number of participants |
| 110  | -                |                                                        |
| 111  | -                |                                                        |

##### example: Edit
The default Edit-Capability gets limited to states: new, demo, draft, review. It is assigned to project-members (for instance: a post cannot be altered after publication).
A refined Edit-Capability is named 'edit-after-release'. It is assigned to the project-owner.


#### 2 bits for simple capabilities
list: typical admin-capability: just see name and stats, not inner content
share: little higher capability than read: download, link, provide the entity to other services
config: admin-capability: who is allowed to configure/administrate the configuration of an entity

### computed simplification
For the capabilities to work efficiently we add these basic simplifications: (no nesting, just single-step inheritance):
- 'Read' includes 'list' as well
- 'update' includes 'share' and 'read' and 'list' as well
- 'create' includes 'read' and 'share' and 'list' as well
- 'manage' includes 'list' and 'share' as well

### ROLES

#### 5 bits for project-roles + sign-bit -> admin
The system handles 4 project-roles + anonym (+ not to implement now: the admin-role)

| bits   | state       | status.status-value                                                                           |
| ------ | ----------- | --------------------------------------------------------------------------------------------- |
| 00001  | anonym      | the anonymous public webuser, not logged-in + all logged-in users                             |
| 00010  | partner     | parents, interested persons, sponsors                                                         |
| 00100  | participant | children, teens, adults for instance actors in a drama that they collectively develop         |
| 01000  | member      | instructors, helping staff on the workshops                                                   |
| 10000  | owner       | reponsible person, most often: instructor                                                     |

|sign-bit| admin       | system-adminstrator + backoffice-person                                                       |


## tasks and workflows
The system exposes useful limits, keep the UI simple and help the users to work in standardized ways. To prevent this from becoming too strict and harsh an exit-strategy will be implemented. For instance project-members get an quick-and-easy way to delegate a task they are not allowed to the project-owner. This will be directly provided inside the status-Editor (similar to tagGroup-Editor): At the place where it would be nice to have the 'trash'-button for a post that is about to be released instead of the direct action-button a button 'ask owner to trash this' could be provided. The same for content-updates: Since table tasks partly mimics the scheme of the entities, the project-member could rewrite and preview the md-body of a blog-post that is already published. But the new content stays inside the tasks-record, just gets merged into the edit-experience of the project-member. Then he/she is allowed to have this task/proposal reviewed by the project-owner.

## Next action: status-Editor, status-display + per-Entity useEntityStatus-Composable
we have implemented the tagFamiliesDisplay and tagGroupEditor.
It provides the option to display status + it can wire-through the activated-event of the status-tile to the parent-view.

The parent-view always is: an Entity!!!
Every entity has it's own use{Entity}Status-Composable like shown with useImageStatus and useProjectStatus. This provides quick access to workflow-implementation specific for the logged in role on a given project.
It should be quite forward to implement a common status-Editor (one for all entities) that consumes from the use{Entity}Status-Composable and only provides actions and options that are doable in the current context. This Editor should have a extend-me-strategy that allows to load a Task-Editor (for instance into a slot?)



---

# Questions and Answsers about the Auth-System Document

Based on my research of your codebase and the `2025-12-01_initial_prompt.md` document, I have the following clarifying questions:

### 1. **Role Storage Strategy**
The document mentions roles like `owner`, `member`, `participant`, `recipient`, `service`, `anonym`. Currently:
- `project_members.role` exists with default `'member'`
- login.post.ts calculates `isOwner`/`isMember`/`isInstructor`/`isAuthor` dynamically

**Question:** Should the new roles be:
- (A) Stored in `project_members.role` as explicit values (`'owner'`, `'member'`, `'participant'`, etc.)?
- (B) Computed dynamically at login like today (owner from `projects.owner_id`, member from `project_members`, etc.)?
- (C) Hybrid: Some stored, some computed?

**Answer:**
We go mostly the (A)-strategy, only for project-owner it is (C)
Check this: There should be a database-constraint that every project (table projects) needs to have an owner -> this helps to prevent against inaccessible projects.
We want to keep this and directly map it to the owner-role. -> later on (v1.1) this could be extended to a 'config owner' (as we now start implementing the config-capability)



### 2. **Generated Columns (r_anonym, r_member, r_owner, etc.)**
The document mentions adding generated columns to entity tables. 

**Question:** What should these columns compute? For example:
- `r_owner` = checks if current user is in `owner_id`?
- But PostgreSQL generated columns can't access session context (current user).

Did you mean these should be **API-computed fields** returned in the response (like `isOwner` today), or actual **database generated columns** based on some other logic (like status bits)?

**Answer:** It is the second option: **database generated columns**  based on status-bits

WHY? Because the system will build a search-engine-like experience. The goal is to have core things like the public-accessible-flag directly on the records without any server-side computing needed on data-retrieval. We avoid lookups as well, by design diverging from some standards for relational databases.


### 3. **sysreg_config Replacement**
You mentioned the current 6 entries (public/private/draft/featured/archived/locked) need to be "fully cleared and completely redefined."

**Question:** Should the new `sysreg_config` entries map to:
- (A) The **capabilities matrix** (read/update/create/manage × entity)?
- (B) The **role definitions** (owner/member/participant/recipient/service/anonym)?
- (C) Something else entirely?

**ANSWER:**
Every entry in sysreg_config is one row of the Matrix: on one row of bitgroups is a concrete definition of a capability per entity (A) and gets mapped to the roles (B1, B2, ...) and maps this to a data-states of records, such that we can define: "new/undefined event can be created by owner" and "new/undefined event can be updated by members"  and "draft event can be listed by participant of a project" (simple capability 'list') and "draft event can be updated by members" and "review event can be read by participant of a project" and "review event can be updated by members". 

Combined with the computed simplification of capabilities (see new section) this sums to this rule: "new events cannot be read by participants of a project, but can by listed, read and updated by members"

Core access-logic will be configured once using the 'all' bitmap to define content-entities posts, events, images 


### 4. **Route Separation Question from Your Doc**
You asked: "Do you recommend renaming here to separate routes for rollup and single-entity? Or is it the best-practice to have both on the same route?"

**My recommendation:** Keep both on the same route with query parameters:
```
GET /api/projects           → list (rollup)
GET /api/projects/:id       → single entity
GET /api/projects?expand=full  → optional: include computed role fields
```
This is REST best practice. The role/capability checking happens via middleware, not route separation.

**Answer:** We follow your recommendation

### 5. **useConfig Composable Scope**
**Question:** Should `useConfig` be:
- (A) Project-scoped (capabilities vary per project based on user's role in that project)?
- (B) Global (user has one set of capabilities across all projects)?
- (C) Hybrid: Base capabilities + project-specific overrides?

**Answer:** We implement it (A) project-scoped. Maybe later we will update it to be more complex