
Today we prepare a 10-day-sprint ranging from dec 1st to dec 9th.
The preparation of sprint will take place today and tomorrow and runs through these steps:
1. you get a first idea, what to achieve in the sprint: The sprint has 3 iterations to launch the 'project workflow' -> it is the main system-integration to bring the system from early alpha to final alpha by supporting a consistent login-experience for owners and members of projects, allowing them to edit posts and events, adding images and configuring external project homepage, posts-page and events-page)
2. we agree on conventions for tasking (versions), research and decide vitest-concepts for testing and prepare defaults for documentation
3. we create initial tasks-documents, prepare and test the test-infrastructure
4. build a deeper understanding of the whole system to be implemented throughout the sprint
5. then setup the detailed tasks for the whole sprint
6. then start work

## STEP 1: Basic idea
It is the crucial system-integration, it brings together:
- X-Pieces: the last active implementations (tagGroupEditor, tagFamilyDisplay) and related db-migrations, i18n-infrastructure and fully deployed taxonomy (domain terminonology)
- Y-Pieces: gaps or ambiguous specs found in testing
- Z-Pieces: early ideas about table 'tasks', status, types and kanban that are core to the system but were sidelined for a while

It will be brought together as the missing pieces to enhance the well-build project-stepper and project-dashboard, to finalize the EditPost- and EditEvent-Experience. Crucial to all these is a consistent management and visualisation of core Entity-State (new, demo, draft ...), especially of projects, events, posts, partly of images (At the start we achieve some clarification on users-state as well).
Once the job is done, users can login and edit, publish, unpublish core content and can start linking projects. Filters that are prepared for entity-rollup (gGallery, pList etc.) will stark making sense which unlocks the configuration of landing-pages and asides.
At the end of the sprint we will provide tooling for the organization of features and tasks to help users to stay organized in the process of learning and prioritizing.

### X-Pieces
tables sysreg_status, sysreg_rtags (sysreg_config stays sidelined) > here we have open work with composables and components
- status
- scope
- rtag-extensions -> technical logic, extensions to: status.status + status.scope (projects: prepare_to_publish, review_before_being_archived)
- config -> entity-logic (projects: featured = Highlighted on homepage / registration_open = Accepting registrations)

### Y-Pieces: 
yesterday we created a report on testing. The testing environmant and strategy should be understood from around the context of the clist-system-implementation (pGallery, pList, ItemList, ItemGallery, pSlider). There it was in the best shape so far. Those components stayed mostly untouched or recent refactoring, so for further understanding the Y-pieces we should have the best start from there.

### Z-Pieces
- A lot of work was finished a month ago around table 'tasks'. This is mainly untouched since then. It still nicely plays together with entities, especially once the status.status really works, since all is implemented around the idea of a basic, unified kanban that can take cards of different entities and tasks etc. all ordered by the same system of status-values. This system is now achieved and should unlock the kanban-idea. A key idea of the existing tasks-implementation is: tasks-entity-integration (unified concept that every entity always has a 'main-task' attached that represents the entity as a next-action somewhere on the tasks/kanban) + concept of 'admin-tasks' (that act as triggers for serverside script-execution). The tasks-entity-integration was implementated around ``BaseView.vue``
- Not on the sysreg-tables but heavily interfering is one more thing: Most of the entities have``type`` or similar field that shapes functionality.
- future-ideas reference-implementations connected to status.status but still on bytea (useProjectStatus, useImageStatus) that leverage the currently implemented system


## STEP 2: Conventions, spec-docs, tasks, versioning and testdriven development
We now shift the whole project to test-driven development, this means: We will define specs with simple versioning, target mostly or partly failing tests for the spec-versions and implement against the tests version by version.
We start working on a consistent logic with docs- and spec- and tasks-files (all in md-format) under the folders /docs and /docs/tasks.

### roadmap of the sprint with 3 first milestones / versions
we start the system with 3 major milestones, that each represent a version, the date is meant to be the afternoon 16:00 o'clock of the day. The versions advance three groups of functionality that are interdependent (A: status->kanban-tasking, B: intra-project->project-external, C: users and projects)

#### VERSION 0.2 / MILESTONE DEC 2nd: 
- A: build the core status-management: distinct composables for every entity and components -> integrate UI from sysreg (tagFamilyDisplay, Editor ...), logic from sysreg (category->subcategory for status.status + additional variations through 'status.scope + rtags) -> integrate and align existing status-logic (db-triggers) 
- B: consistent internal experience for projects: project-types 'topic' + 'project', project-new-stepper, project-draft and project-released state (both dashboard), editing of posts and images, configuring of project-posts-page and project-home-page, 
- C: different functionality for project-owner, project-member and admin, draft functionality for inter-project-relationships

#### VERSION 0.3 / MILESTONE DEC 5th: 
- A: build the prototype for worklow-logic (enhanced status-management) with examples for entity 'events'
- B: finish additional functionality to internal experience for projects: editing events, configuring project-events-page, association of posts and images with events, configuring the event-checkout on the external website
- C: consistent external presentation for projects, working with pages, page-layout, galleries and lists, managing the external presentation with status, edit default legal-pages of a project like 'impressum', 'contact', 'datenschutz'

#### VERSION 0.4 / MILESTONE DEC 9th: 
- A: make the workflow-system with tasking and status visible around a kanban: per-project-kanban (in users view or general view) + per-user-kanban (multiple-project in users view)
- B: make use of the 'special' type for projects and add functionality to the special 'dev' and 'tp' projects + add the 'feature' entity that extends 'dev' (for managing features into a roadmap), 
- C: update the external presentation of both special projects, display 'features' as a roadmap and allow for 'interactions' around the roadmap (using table 'interactions')

### test-infrastructure
First you need to prepare the vitest-structure to support this: How should it be setup to provide these options (with examples)
- Test-files are organized into 'modules' or 'groups' simply by test-file-naming convention
- each test can have a version-filter attached using semantic versioning but allowing for simplified notation as: '0.3'
- single tests can be marked as 'deprecated' or 'draft' in both cases they will not run, but if possible they could leave a message in the test-system-health-reporting of vitest
- we have these options for test-running beyond simply running all existing tests or simply running one test-file
	- 'module' whole 'module', 'group'
	- 'maxv': all tests up to a certain version: runs tests that are not filtered + those with version = less or matching
	- 'minv': all tests up from a certain version: runs tests that are not filtered + those with version = greater or matching
	- 'module' + 'maxv' // 'module' + 'minv' 
	- testfile + 'maxv' // testfile + 'minv' 

### organizing for docs, tasks
- located at /docs/tasks: 1 Roadmap-Document 2025-12-01-SPRINT-Projectlogin_Workflow.md for the whole sprint: It describes the 3 phases/milestones, gives status on reached targets and references documentation. It will be only updated once a day reflecting the main result and system-status from the past days. The roadmap-document 
	- gives a brief summary about the sprint in 2-3 sentences
	- then gives clear instructions for code-automation about the key-conventions to be followed throughout the sprint -> you start creating that section, extract from my text, we will update it on the beginning of each workday with a round of questions and answers
- 1 central tasks-registry for every workday of the sprint where active work is planned:  2025-11-30.md, 2025-12-01.md, 2025-12-02, 2025-12-03, 2025-12-04, 2025-12-05, 2025-12-08, 2025-12-09. Put a short statement on top of each file: "This file is the starting-point for a workday. It lists important defaults on how to start a day. It contains both single-tasks that need to be managed as well references to other tasking-documents. It will be updated 2-4 times throughout the day. When the day is over the most important achievements will be summarized on the roadmap-document"
- 1 docs-file for core-documentation of the whole system located at /docs named "Projectlogin_Workflow.md"
- 1 tasks-file, named '2025-12-10-DEFERRED-from-Projectlogin_Workflow.md' > that collects short tasks, ideas, or references longer tasks, ideas that are flagged as 'nice-2-have' or don't fit into the day anymore but should reviewed. This file does not need to be permanently updated, will have duplicate or missing content and should be handled like a dropbox and will need a thorough analysis once the sprint is over. 
- 8 files per each of 8 entities (events, posts, projects, users, images, instructors, locations + 'features' -> features is a new entity that we will create): located under /docs, "Projectlogin_Workflow_Events.md", "Projectlogin_Workflow_Posts.md"

## STEP 3: Reseach and prepare testdriven development with vitest
Now ask questions, give examples, lookup webdocumentation on how to best organize the system for testdriven development described above
Then make a temporarily planning-doc for the implementation of the testdriven development-system

## STEP 4: Deeper underststanding of conventions, spec-docs, tasks and versioning and creation of the initial SPRINT-Docs
Now ask questions, give examples on how to best organize the docs, tasks and specs in a way that it matches the testdriven strategy.
Then create the core documents that are needed to get started properly
Then lookup the temporarily planning for the testdriven development system created in step 3 and integrate this plan into the sprint-docs

## STEP 5: Implement the testdriven development system

---

# Answers to Questions

Questions for STEP 1: Basic Idea
Entity State Clarification: You mention entity states like "new, demo, draft..."
new
demo
draft
confirmed
released
archived
trash

They are exactly the sysreg_status.status entries: The main-entries. 
On a technical level we always should run from the integer-reprentation of the parent-bit, never rely on string-names and default to reducing sub-categories to main-categories (this will be handled both on the backend by generated columns and frontend by a status-composable for each entity). Everything should be implemented in a way that always the parent-bit (category) is taken for hardcore-logic and that sub-categories can be taken to add optional logic.

X-Pieces - sysreg tables:
QUESTION: What is the current schema of sysreg_status and sysreg_rtags?
ANSWER: This has to be looked up on the database and from sysreg-bitgroups.json, sysreg_status has fully created database-entries. Sysreg_rtags only have basic entries at the moment. We will further work on this throughout the sprint.
We will add a small amount database-generated columns like 'is_released' (status.status) or 'is_deprecated' that represent key status-information.

QUESTION: You mention "category->subcategory for status + scope + rtags" - is this a hierarchical relationship already implemented in the DB or something to be built?
ANSWER: I correcte this to "category->subcategory for status.status + additional variations through 'status.scope + rtags". It is already implemented (category->subcategory), represented via parent-bit-logic (you will understand). The additional variations are prepared (entries exist) but the combinations need to be specified and enabled. They will receive implementation through composables on the frontside first and then will be aligned on the backend (with triggers or/and with endpoint-logic) -> this will be coordinated by specs and testing.


QUESTION: Project Types: You mention project types 'topic', 'project', and 'special' (dev, tp). Are there other project types? What distinguishes 'topic' from 'project'?
ANSWER: we have these project types: 'topic', 'project', 'regio' and 'special'. Topic is the simplest, it just has images and posts. Project adds 'events'. Regio has different priorities for presentation: It puts users and related projects first and acts as information hub (presenting posts and events of other projects), still has own 'events' and own 'posts' which often are needed for internal organisation of a 'regio' (a regio is a group of instructors/users with shared projects being located in the same geographical region). They have common posts and events that represent the whole regio. Type special is like 'project' but with less automations. It is used for the homepage of the whole project and for the meta-project where the community decicedes on the further roadmap for instance.

QUESTION: Inter-project relationships: What kind of relationships exist between projects? 
ANSWER: It is mostly 'related projects' like described on the regio, not strict parent-child-relations. Often related projects even share some users like that both have the same owner or some members. Most of the projects will have their own homepages (with own domains) in the future. If they are related, then one project can showcase another projects events, posts, instructors together with own events, posts, instructors.


Z-Pieces - Tasks/Kanban:
QUESTION: Is the tasks table schema finalized? 
ANSWER: No it is not finalized and has a lot of room to be adapted. Basic idea was that it follows the naming of the entities in select fields so that components don't need to understand whether they display entity or task-information. Tasks does not have most of the fields that entities have. I think it should stay that way, because then doing merge-queries tasks-entitiy brings a nice fieldset.


QUESTION: What is BaseView.vue and where is it located - is this the central component for the tasks-entity integration?
ANSWER: it is here: /home/persona/crearis/crearis-vue/src/views/BaseView.vue
It was the first component that showcased the implementation, I updatedet it along the way but it lost core functionality especially for the tasks-entity-integration. But is a good starting-point: You inspect it, ask some questions about it, we try 3 different options and then decide. A lot of convention for Design are not followed there. So we could treat it as a playground, it is not needed for core functionality, better to reimplement once everything has consistent spec.
For the moment it is enough to have it registered for revue once detailled planning for v0.3 start (not before).


Questions for STEP 2: Conventions, Specs, Tasks, Versioning
QUESTION: Version Numbering: The milestones show VERSION 0.2 twice (Dec 2nd and Dec 5th), then VERSION 0.4 for Dec 9th. Should the Dec 5th milestone be VERSION 0.3?
ANSWER: It was an error on my sice. I corrected this, reread


Test Organization:

QUESTION: Should tests be co-located with source files (e.g., Component.vue + Component.spec.ts) or in a separate tests directory?
What naming convention for test modules/groups? E.g., status.spec.ts, status.events.spec.ts?
ANSWER: no co-location, have them in a separate test directory (it exists already). And this is the filename-convention: We always have a 'group' and a 'target' being 'status' the 'group' and 'events' the target: status.events.spec.ts? If no group is determined then it is common.event.spec.ts, if no target then: status.common.spec.ts

QUESTION: Docs Structure: For the 8 entity docs (events, posts, projects, etc.) - should these document current state, target state, or both with version markers?
ANSWER: They document both and have a clear criteria where to put the focus. It is decided based on implementation-status in the associated sprint (our current sprint). At the top of the document (or even YAML?) we could have a %-information SPRINT-TARGET-IMPLEMENTED: .
They conctentrate on target state as long as we are in planning and early on the sprint.  As soon as this goes above 50% the doc should be reorganized to focus on details documentation of the current state, having critical things that are still under development listed in the header and with detailed description 'below the fold'. 
MY QUESTION to you: Do you think this is doable? Or would you recommend a more static approach that produces more reports and then puts them on archive on and on?


Task Registry Format: 
QUESTION: What format for daily task files? Simple markdown checklist, structured sections, or something more specific?
ANSWER: Simple markdown checklist if it refences a task that is in another file. Try to aggregate those references under a h3
For tasks that are directly inside the daily task files put them in structured sections. 
If it is too complicated to separate both then: always structured sections

Questions for STEP 3+4: Testing Infrastructure & Documentation
QUESTION: Current Vitest Setup: I see vitest.config.ts exists - what's the current testing structure? Any existing test patterns to follow?
ANSWER: I did not wor very often with vitest, but in this project with the help of code-automation it is a big success. Best would be if you understand it form here: /home/persona/crearis/crearis-vue/docs/tasks/2025-11-13_VITEST_INFRASTRUCTURE_GUIDE.md
There are like 5 other md-files on testsetup from that same day. If you have further questions, ask them, I will try to help you.


QUESTION: Version Filtering Mechanism: For the semantic version filtering (e.g., '0.3'), should this be:
ANSWER: It should be a custom test annotation/decorator


QUESTION: Test Health Reporting: For deprecated/draft tests leaving messages - should these appear in console output, a separate report file, or both?
ANSWER: separate report + you put this as task to the last day of the sprint to create and evaluate this report


QUESTION: Documentation Depth: For Projectlogin_Workflow.md - how technical should this be? API-level documentation, architectural overview, or user-flow focused?
ANSWER: architectural overview + below each section quick-links into the daily-tasks + entity-docs (whith anchors preferred)