
## ⭕ Crearis convention for internal navigation: Landing-3Tabs-Cog-Navigation + responsive design
This is on internal design / dashboard fullscreen primarily. Is will resurface again for external websites (the leftside-navigation page-layout especially)

### The List-Head-Component
I want to introduce a standardized minimal tabs-navigation, consisting of 2 icons and 3 words. It needs to fit on mobile 400px, to be densed down (dense the fontsize + margins, paddings of the whole UI) until 360px (tall Samsungs), then it will break. 

I have worked and tested on it a lot the last 2 years, it brings 3 words on the screen that say everything about Crearis: AGENDA | THEMEN | AKTEURE

It builds a top-left list-head
It has an optional OverlineExtension + an optional SublineExtension
OverlineExtentions works to the top to present the Logo OR Project Name + a seach/command bar-icon
SublineExtension is a 2nd/3rd row below to present a row of filter-options or ordering-options.

### The Default-Use-Case
Below the List-Head goes a list of entity-tiles or entity-rows (clist-family in our project: ItemList), typically together both components are full screen height. Optionally we have a ListFooter below or a pageFooter for instance for bottomSheet-functionality.
In Crearis-Vue those entities, items are listed here: events, posts, partners (former instructors), users, projects, images, registrations

### Details on responsive design
important are two strategic gaps (kind of a negative SPEC): This system leaves a strategic gap between approx 440px-680px screenwidth. We don't care about that, there are very little devices/use-cases inside that range. There is another strategic decision: We don't design for screenwidths above approx. 1600px. Most of our users don't work with that, they have small notebooks, fieldwork-style.

On tablet (horizontal and vertical) it is part of a 2-cols-layout, sits left as well, rather small (reusing the densed down for tablet-vertical, and tiny form-factors of tablet-horizontal). The main-col is always right to it, always visible. The typical functionality for logged in users is that even on tablet we have a 'hidden' 3-cols-layout at work, the main col always visible, the navigation left and aside right toggling each other. Aside right holds edit-functionality, config-functionality (like we are preparing for the route /sites/[domaincode]/posts)

A breakpoint at approx 1200px screenwidth lets the 3-cols display all at once if they are available for the current view-state at all.

This makes for a very simple responsive design, typically avoiding a lot of switches and flags and doubled css: Especially the trick to have mobile designed towards 380-400 width and reduce the project font-size for the edge-cases below that, reusing that densing on small tablets.

I will provide 1-2 screenshots for you to understand (in v0.5 more details)

### Details on ListHeadTabs
The tabs are
HOME-ICON (Landing) | AGENDA: Events? | THEMEN: Posts | AKTEURE: Users/ | COG-ICON 

## ⭕ Partner-Refactor
The closer we come to Odoo the more obvious it comes to me that we need to drop the participants-table + that we should decide whether the locations-table is needed at all and whether we shouldn't add a new table 'partner' (not 'partners' maybe to align to odoo?). Partner should get all instructors-content, have the same field + it should get the 'locations', it should have a 'partner_types'-field (int) that uses bitmasking to allow for 'instructor', 'location', 'participant', 'organisation' (toggles! -> instructors can be participants, location, organisation at the same time (which is a really common pattern in our field due to the flat hierarchies). We could add is_instructor, is_participant, is_location, is_organisation. It involves updating the images-triggers, because we need the full images-support
Then you decide this after analysing table-schema + the clist-components: Should we create postgresql views or materialized views (instructors, locations) that exactly mimic the existing lost tables?

## ⭕ Demo-Project
I have the idea to create a project with the 'demo'-domaincode. It is not meant to be published. It could be further more resetted once a day or after each 'demo'-session to a certain state. This would allow for instance while user-onboarding to register the new user as project-member on demo. If done with the onboarding unregister and reset the demo-entities. It could be used similarily to allow users to testdrive functionality even later, for instance if upgrading from v1.0 to v2.0 or stuff like that.

Here is the question: What needs to be implemented to enable this? Couldn't this be quite easy if we have a secure domaincode?

NOTE: There are 'demo'-entities (and/or renamable to 'base') that act as templates for events, posts with xmlids like ``_demo.event-....`` at the moment. This is close from the meaning but a little ambiguous, but I think manageable and opens room for useful decisions, once my idea works. 


## ⭕ Onboarding-Steps
We have 4 phases of user-onboarding. We have to validate that I mapped them correctly to the user-states and that 'review' actually is one of the main-states. We should evaluate the logic at /start, it provides running code for hardcoded detection of verified/unverified/not-yet-registered. I think it works via allowing 'undefined' for user-status which I think is against the rules of sysreg_status and sysreg_config, right?

This could be visualized using the same stepper-experience from route /projects
- Verification (NEW-state=needs verification / if Verification is complete, advance to 'demo'): Is done manually at the moment -> but we already have an 'invited'-logic implemented, active at route /start // TASK: extract it, make it reusable
- 'Profile' ('demo'-state -> if completed advance to='draft'): Is missing at the moment, but the fix to the roleBadge from yesterday shows the path
	1. a link to a partners-record has to be created: Either by creating a new 'partner' or by finding an existing partner (look up for name and assure that the partner is not yet connected to another user)
	2. important part is providing an avatar-image. Other than the simple fix on the roleBadge this needs some special logic. We should assume that the image does not yet exist and has to be uploaded first. The Problem here is that we may not know the project. But we need a project since the image needs an xmlid. So this is the way to solve this by presenting a projects-selection
		1. is the user already on table projects_member or is the user even owner_id of a project at table 'projects'? if yes then add these to the selection
		2. filter out all 'regio' projects and add these to the selection
		3. after the user uploaded an image ask 'Unter welchem Projekt oder welcher Regio möchtest du dein Avatar-Bild verfügbar machen? (Bist du  Theaterpädagog:in > dann wähle deine Regio // Bist du Teilnehmer:in > dann wähle eher dein Projekt (dein Bild bleibt 'privat'))' > present a dropdownList (cList). On the List first the projects then the Regios
- 'Learn the basics' ('draft'-state -> if completed advance to='review')
	- Here comes a short learning-agenda with one Project in Stepper-Mode
	- If User is Owner, Creator or Member somewhere -> needs to add 1 Event, 1 Post at least (option to redo this)
	- {STUBS ONLY} If User only is Partner or Participant -> only show information on this role/relation
	- {STUBS ONLY} Any-Questions Form is presented: If User is Project-Owner somewhere -> input goes to admin, otherwise a Project can be selected and Input goes to the Project-Owner
- 'Activate' ('review'-state -> if completed advance to either='confirmed' OR stay in 'review'-state but advance to 'Publish User Step')
	- this is the classical we-aggregate-the-prior-steps experience
	- on Top 'Geschafft! Nun aktiviere dein Profil, du hast dann direkten Zugang zu deinen/m Projekte/n'
	- This only is available for: Owner, Creator, Member "Falls du Theaterpädagog:in bist, dann erstelle doch jetzt gleich deine öffentliche Profilseite, dies braucht jetzt gar nicht mehr viel (oder entscheide, dass du 'unsichtbar' bleiben möchtest)"
	- List out the projects the user is part of, with the relation (the display-title, field role from project_members!)
	- At the bottom create a definition-list of all the relations/roles the user has accross the projects
	- then two beautiful buttons: activate-me | public-profile (only for: Owner, Creator, Member)
- Optional: 'Publish User' Step (entered with either 'confirmed'-state (or by code forwarded from Activate-Step) -> if completed advance to='released'). This Step will bring up an About-Me-Page on the public internet. At the moment it means: User can edit the md-field and teaser-field.

## ⭕ how to tackle 'Hard Breaking Changes' on the way from alpha to beta
Here we strategically prepare the steps where a limited number of records on various tables will need manually fixing, copy-pasting or stuff like that. This means we will have upgrades to the schema and logic around v0.5 where it could be really hard to try to do this with proper database-migrations.

### how to merge res.users, res.partners + full auth into CREARIS-VUE 
res.partner, res.users on production odoo already holds most of the users and partners that will come onto the current system. Somewhere around v0.5-v0.8 I want to bring in already existing login/auth from CREARIS-NUXT: authentification is provided by CREARIS-NUXT and forwarded to CREARIS-VUE. CREARIS-VUE Tables res.users and res.partners need to be properly synced with Odoo in order to enable that. This will lead to the situation where the existing users and partners on CREARIS-VUE are mostly duplicates. 
This is the idea:
1. Development of schema on both CREARIS-VUE and CREARIS-ODOO needs to be brought to a point where major fields are in sync, especially it would be a good idea to have support for res.partner.img_id on CREARIS-ODOO (default Odoo doesn't take it very far with the images in my opinion)
2. The xmlids of related entries on both CREARIS-VUE and CREARIS-NUXT have to be aligned (manual work, could be assisted by code-automation via xml-rpc by finding the names)
3. Some fields (like address) hold more information on odoo, others (like sysmail, extmail, img_id) are better prepared on CREARIS-VUE. This is consistent. The sync should start with a downsync, so the downsync-function will be patched for the first execution to simply exempt some of the fields, especially the password-field as long as auth is not yet working via odoo
4. then auth has to be transferred to odoo via graphql, once this is approved, the password-field on CREARIS-VUE should get dropped (and all password-logic as well)
5. there are CREATE-NEW-USER-mutations (graphql) and all that stuff prepared for integration on the CREARIS-NUXT implementation

## ⭕ detect and fix hardcoded capabilities + duplications
We have a crystal-clear specification for entity-status, user-relation-capabilities on the entities for every status and transitions. This is to be configured at 100% on the db-level at sysreg_config. While hacking-through our way to get the projects stepper and dashboard working we introduced some props and code-logic to quickly showcase certain things. First take in sysreg_config, fully query it (is not very long yet). It is 100% consistent on dev-database and production-database!
Then analyse the components under src/view/project especially and find those points and create a md-report that gives overview, then details out, the makes proposals on how to streamline everything. Which of the props should be dropped or aligned, where are things that seem ambiguous, for instance seem counterworking the sysreg_config? What should be the next sysreg_config-migration?

## ⭕ enhanced posts- / events-experience from stepper/dashboard
Yesterday we have introduced the pList-convention to AddEvent, AddPost Steps. You have hacked the 'trash'-option.
Now rebuild it properly (update the components to allow for a trash-icon -> could sit there where the select-option is displayed otherwise).
Then add a click-option (for the rest of the card-surface on the gallery should be implemented properly already): It directly brings us to route /sites/[domaincode]/posts. But it should add a parameter that PostPage.vue on the route mounts the back-arrow (is available in Page-Layout.vue -> the template for /home/persona/crearis/crearis-vue/src/views/PostPage.vue

Add and configure the /sites/[domaincode]/events - route. Add EventPage.vue. It could copy PostPage.vue and should be bound to table events. Make a proposal on how to design the additional fields, you find basic preferences on AddEventPanel.

Have both routes work on id (and not yet slugs), add to v0.5 that on odoo-integration we should solve the slug-from-xmlid-question, put a prominent comment into the top of PostPage.vue and EventPage.vue.

## ⭕ Theme-Switch, new Home-Layout-template and theming
The theme-switch at /projects step Theming works. But we have to alter things here.
1. We assume that a post or event is already created and can be viewed via enhanced posts/events-experience.
2. The themeswitch provides a simple image that shows the theme. -> this should be shown in the trigger of the themeswitch.
3. Neither route /projects nor route /home should be affected otherwise by theming via the themeswitch.
4. Those routes use Home-Theming. Hometheming is a new concept to be implemented. Is makes sure that always the initial 'site'-theme is active on Pages that use the Home-Layout-Template. 
5. Home-Layout-Template is a clone of Page-Layout.vue. It could make use of the cols-switching-mechanism of Page-Layout. TASK: you analyse how complicated it would be to rebuild the dashboard and stepper by adapting core concepts from Page-Layout.vue -> ask me questions about that
6. But it either doesn't apply useTheme but applies a useHomeTheme-Composably. Or useTheme gets upgraded to provide homeTheming-support (maybe the simplest right because it just is another toggle, all the rest already tested)
7. Hometheming is the design of the dashboard-implementation based on the site-theme, we add 2 variations to that: 'dasei' (new vars, some adaptions) + 'site' (theme rescues the currently active behavior where the theme-switch even switches the dashboard. But it should adapt to the theme of the active project -> needs further implementation).
8. We should have a 'dashboard-theme'-switch with 'opus', 'dasei', 'site'

This is some work. But the basic idea is clear: We stop being separated in internal and external implementation but still can implement step by step, test out internal and optimize external afterwards. Code-logic that evolved on internal pages that for instance adresses home-layout will be easily adaptible to page-layout-based external usage.

## ⭕ Home-Theming
We simply call the existing design you applied using the opus-css-convention 'Opus'. It is minimal, favors medium round-corners for sections.
We will introduce a second internal theme called 'DASEI'. Its core design evolves around a medium-size horizontal divider/line that typically separates the header from the body. It doesn't have rounded corners and due to the active horiz. separator it deals differently with margins and paddings as well.
You will analyze it, analyze the dashboard and stepper, then make proposals and ask questions on priorities for implementation right now.

## ⭕ Align Stepper + Dashboard to 4 Navstops-Principle
Yesterday we started refactoring the projects-dashboard and introduced a 3-cols-idea for the dashboard.
We refactor that again and get rid of the 3 cols again. The basic idea is to put the leftside-icon bar on top and have the list below. But as you may have understood there are some navigation-targes like pages, theme, settings and project-activation that do not have any items/entities to list out. I call those steps/navtargets 'specialSteps' here
So instead of moving around the leftside-icons to the top you first implement the ListHead and subcomponents. Then you split the stepper: The specialSteps are presented in the known way: This presentation is activated by click on the Settings-COG on The ListHeadTabs. Clicking on one of the EntityTabs (AGENDA|THEMEN|AKTEURE) instead loads the ItemList for those. Clicking on Home loads the internal Homepage (for the project / or for the userpage) it is a scrollview with pGallery + 2-3 pLists
pGallery on projectHome holds:
- project-type 'topic': posts-cards
- project-type 'project': events-cards
- project-type 'regio': partner-cards (instructors, locations)

pGallery on userHome holds: the project-cards

pLists hold: the other entities

Now important: Reduce the stepper to align to that: all content from the other steps then events, posts, users, project-activation are consolidated into one step 'settings' (just mount the contents in sections vertically stacked -> we will reduce this). This Step/Panel does not exist on the dashboard -> the existing steps like design only will be loaded on the dashboard.

### Home-Route
We need to create a new Home-route. After login we always redirect here.
It holds the userHome-Dashboard

