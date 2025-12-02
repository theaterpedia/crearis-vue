# Start-of-the-day-prompt DEC 2nd

I analysed the results of yesterdays work. The roles and capabilities are quite essential for all the rest. Before we rush into something I want do some questions and answers that may lead to small adaptions of the spec.

The whole implementation is a bit more ambitious than what I thought we should do as I started planning the sprint on Sunday, NOV 30th. BUT: It provides much more value.
So I could agree to postpone the milestone for v0.2 by one day to tomorrow. But still today starting 17:00 o'clock (now I have 11:20) I have to prepare a first candidate that showcases some of the core features: I will need to run migrations 037-042 on the deployed alpha-system and have 3-5 users logged into the system and then:
- try to edit posts 
- drop images into the project (which works after mig042 -> we tested it on sunday)
- use dtags, ctags and hopefully status via (/home/persona/crearis/crearis-vue/src/components/sysreg/TagGroupEditor.vue + Display-Component)

Nothing more than that.

So we have 4 workhours left to have final decisions and then provide basic functionality. This will focus on the entity posts.

So I start with questions and answers.
I reference: /home/persona/crearis/crearis-vue/docs/tasks/2025-12-01-AUTH-SYSTEM-SPEC.md
These are my findings, questions, proposal for next actions:

### My idea: CapabilitiesEditor.vue
First of all: This was good teamwork -> My prompt from yesterday was complex and abstract, now we are on the way towards a solid whitepaper that has things described with good examples and straightforward guidance. 
The key point is that I can imagine/describe the CapabilitiesEditor.vue from both "Example Config Entries" you prepared in the SPEC, how it simply works on table sysreg_config. I understand that by creating 7 database-records the core functionality of posts can be defined. Another 7-15 database-records add special treatment > it should be straightforward to implement UI for that like a CapabilitiesEditor > do you agree to that (the record-counts + that it is straightforward how to implement the CapabilitiesEditor)? So the CapabilitiesEditor.vue allows to filter by entity-types (bit 4-6) and in sum this will be approx 100-200 rows defining the capabilies of the system: This is exactly the range of options we need here.

### Questions: Nesting-Levels, Templating, Merging, Optionality
Nesting-levels for inheritance/refinement/templating of settings should be discussed. I personally have a bias towards over-engineering sometimes (it's always nice to have more options ...). So this should be consulted critically: Which of the nestings and options are crucial and really unlock meaningful flexibility and make life easier because they prevent from the need to repeat settings role-by-role, entity-by-entity and so forth. Which of the nestings and options tend to introduce duplication-of-features.

These are my findings:
1. project-type inheritance > this really looks fine: The number of project-types and the special-option, the one-step merging from core-type->topic|project|regio
2. this looks a little weird at the moment (I come back to it further down in the text): 2a: the 'all'-logic for entities (bit 3) + 2b: the 'default' entity (bit 4-6: 000 -> meant for low-level entities where capabilities get defined in a unified way)
3. (out of the capabilities-scope but can be considered inside composables and endpoints) the record-states as defined for sysreg_status.status can have sub-categories as well
4. capability-inheritance (computed simplification) -> When I look at the Example Config Entries you prepared: I really question the need of capability-inheritance. 4a. this capability-inheritance is not so easy to implement (for instance with database-triggers). 4b. it is not stoppable (for instance: if role 'admin' should not by default 'read' the content of internal posts) -> it seems better to explicitly set the flags on sysreg_config
5. The distinction between database-operations and endpoint-operations should be considered. Here is risk of duplicate/ambiguous functionality, things partially implemented on the endpoints and partially using db-triggers. A lot depends on the ordering of the implementation: If 1-3 db-triggers are created first, well documented and really are kept to provide core simplifications + the naming of generated columns is straightforward, then this could help a lot. The way this is specified in the chapter "Generated Columns on Entity Tables" seems to give good guidance on that: The triggers are only needed to allow performant and simple readonly-operations where endpoints don't have to juggle access-rights anymore. All the rest should be handled by the endpoints. So at the moment this should NOT be turned into a system where  db-level-read-config needs/gets refined by the endpoints (one-level templating). For the future we have this option, but for now

### Question: Allocation of the remaining 2 sysreg_config-bits
If you calculated everything right then there are 2 bits left on the config. This is really helpful! I want to decide where those 2 bits are put.

FIRST: is the sign-bit allocation to role admin ok? I really like the sign-bit for admin: The idea is (as outlined) that admin not simply has all superpower, all capabilities everywhere but that in future it will have it's own variation of standard-capabilities. So on both endpoints, composables getting optionally negative config-values could be a straightforward for this, do you agree? Or would you recommend completely avoiding the sign-bit? (we had this recommendation for the other sysreg-tables from code-automation)

Where to put the 2 bits? I thought about adding another role (I had a 'service'-role for backend-staff in mind) but KISS says 'no' here: 4 different roles on the project are easy to understand and fun to use. But we will need the option to further 'shape' some of the roles inside some of the projects. I think that this shaping could be done easily using project-sysreg-config-entries (that redefine certain lines of the global config). So I favor shifting the left-over 2 bits to the entities

### Potential problems: underspecified 'owner'-role + record-creation
I found 2 potential weak points on the spec from further exploring the use-cases we have on the project
1. double use of 'owner' > you see this if you look into the project-stepper-logic (or the dashboard, see: /home/persona/crearis/crearis-vue/src/views/project/ProjectStepPosts.vue): Project 'members' and even 'participants' will create posts, 'members' will create events. They own these records but they are not the project-owner.
2. I introduced the description (bits 7-9) 001 of status 'new': described as "newly created, undefined" -> this leaves room for speculation who is allowed to create a record if we have the status 'no record' on an endpoint, composable, component

These are my thoughts on 1 + 2: On the database- and endpoint-level it makes a lot of sense, that users can create records and then own them and act as owners.
The whole system wants 'projects' like 'sandboxes' with the project-owner controlling things like who gets into the sandbox. But once inside the sandbox there should be 'more freedom' and autonomous users.
Only in some advanced projects a setup should be enabled where project-owner restricts trashing of member-created-events (meaning: member creates an event but cannot trash it).
So there should be a standard-config that on the project-level via config can be decided who can create records for which entity. The record-creator is the 'owner' of the record. If a "user B" with role 'member' of the project is allowed to create 'posts' and creates "post B" then on project->posts->"post B" user B gets role 'owner'!
Another user A who is the owner-of-the-project but did not create "post B" now:
- Variant 1: either is the owner of 'post B' as well, because project-owner inherits all owner-state to all entity-records inside the project
- Variant 2: or is the owner of 'post B' as well, because project-owner is configured to inherit all owner-state to all entity-records of type post inside the project
- Variant 3: or is 'member' of 'post B' because this gives enough power

This is the key question to be answered: Will the project-owner be inherited? Or will the role be a 'member' on project-data that he/she doesn't own? Variant 1-2-3. I will let you find the answer, because from what I see: This could be done properly in all three variants and in every implementation it is straightforward how to achieve the needed results and configuration. Therefore you should decide, because you should analyse which way will be the most easy way to implement this on endpoints, middleware, composables.

Here I give some further priorities and clarifications that should help with that. I add into it findings about the record-creation because it is heavily connected:
1. project-type 'core' has restrictive defaults for this that even apply for the special-projects 'dev' and 'tp'. Those are projects that tend to heavily control and limit what average members can do. 'restrictive default' means: Little or no entries on sysreg_config + little additional functionality on composables, endpoints.
2. The types 'topic', 'project' and 'regio' make the sandbox more open, means they add to the sysreg_config as well to composables, endpoints.
3. To keep it easy I would say: From the capabilites-viewpoint: The 'new'-state is identical with the 'no record'-state, all capabilities a role has on 'new' it has as well on 'not yet created'.
4. This may lead to some minor refactoring (for instance entity users has some functionality already around the new-state). But it would really make sense to have logic applied that allows to completely delete 'new' records (and not needing them to go via trash first).
5. I had mentioned in earlier prompts the idea of a project-main-owner (the owner-user referenced by table projects). I think this is important here. I therefore would say: v0.5 should be about the special projects, about the project main-owner. v0.5 should finish the roles-and-capabilities. It should proove edge-cases and provide the complete spec.

### My preference to the bits-allocation-question
I await your reasoning on this.
I argue that the system gets simpler if we don't introduce the need to group entities. Grouping should be on option. But it should not be done
With just bits 4-6 reserved for entities we could reuse basic implementation from categories->subcategories. But this is a too low count of entities. The system will quickly hit the edge here and run into the problems because new single entities cannot be defined in a standard way, need to be configured as 'default entity' (bits 4-6: 000).

### I am open to the question on entity-templating/inheritance
I showed that we have the bit 3 'all entities' + bit 4-6 000 'default'-mechanism. Seeing the simplicitiy of the CapabilityEditor.vue I now propose to add 2 bits to the entities to simply allow to configure each entity on its own.
What are your thoughts on it. Should one of the 2 entity-templating/inheritance-mechanisms get dropped or postponed (we leave the bit undefined), or is it easy-to-implement?

### Next actions
- Question-and-answer, then final decisions on the spec, updating the docs, refining tests, refactoring
- update planning, priorities for today and tomorrow
- YOU make a proposal for the CapabilitiesEditor based on: /home/persona/crearis/crearis-vue/src/views/admin/SysregAdminView.vue
- YOU clear the sysreg_config-table
- YOU create the schema-migrations on the database + new fields, tests
- YOU create demo-configuration on sysreg_table (not yet as migration): 
	- create minimal capabilities for projects-entity (projects can be advanced from 'new' to 'draft' to 'released')
	- the essential thing: **create core capabilities for posts-entity + some optional capabilities for posts** (we will focus on posts for the use-cases)
	- maybe minimal capabilities for the users-entity (login needs to work -> we simply mock verification, activation of users for the moment)
- YOU implement the capabilities-editor
- I test the editor and update some of the capabilities, give some explanations
- then we decide on last important implementation-details of the system: I will provide the core integration-points (project-stepper: posts, events), we will analyse them and decide what to keep, what to change there. Then it should be clear how you implement unit-tests that exactly test this behavior ... how to shape middleware, composables
- once you have unit-tests, the rest is obvious
- from 16:00 o'clock onward I will look for a good point to sum-up the achieved results into a data-seed-migration. Once we have that we finish for today, I will go on on the alpha-production-system, get user-feedback and report tomorrow on the findings
