# Prompt Vitepress

## Q & A

**1. Scope & Location:**
- Q: Is this documentation for developers, end-users (practitioners), or both?
- A1: it targets three groups of people: end-users, admins, developers (code-automation + really expert-level vue-developers) 
- A2: the docs will have this url: https://docs.theaterpedia.org

**2. Structure - What should be documented?**
- A: do not document versioning yet, we only use it to prioritize our work for the next 6 weeks, but mark things that are v0.5 or v1.1: mark v0.5 as 'beta-feature', v1.1 as 'post-release'

- These are some contents for the developers-part of the documentation that are relevant
  - Architecture/System Overview
  - Opus CSS Conventions
  - (we will start it, only the 'final components') Component Library
  - (to be done in v0.5 -> once endpoints are stable) API Reference
  - Auth System & Roles
  - Database Schema & Migrations

- for the Admin-Part it is the sysregAdminView and i18n
- for the end-users it is: Project Workflow (the stepper flow we just built) + Project Dashboard (works with the same components)

**3. Priorities:**
- Q: Which features/concepts are most critical to document first?
- A: we only document a narrow selection of features/concepts: Core system functionality that is 'special' (like for instance oklch-system) and already has a higher quality-grade (for instance: unit-testing exists). I explicitely name what to document but I really appreciate proposals for things you find

- Q: Should the docs reflect current state or also planned v0.5 features?
- A: document even the planned v0.5 features!

**4. Style & Branding:**
- Q: Any specific theme colors/branding for the docs site? 
- A1: YES, GREAT QUESTION: you could try to make it themable with the 'crearis'-theming > look into useTheme-composable + /src/assets/css/theme-00.css.  We have the monaspace-font-family as core part of the project-design (all reliably hosted via https://theaterpedia.org from /src/assets/fonts), but we should have the option to use Roboto as well (better readability). You could inspect these websites for screenshots: https://theaterpedia.org + https://design2022.theaterpedia.org + https://design2024.theaterpedia.org
- A2: If you want to try an edge-case on branding/theming, you could evaluate this: Core concept of the Crearis-UI is that it will use post-its throughout theaterpedia. You have a post-it-component prepared at: /home/persona/crearis/crearis-vue/src/components/PostIt.vue. There is even a mechanism prepared to create Post-Its from markdown, you find it at: /home/persona/crearis/crearis-vue/chat/FPOSTIT_IMPLEMENTATION_SUMMARY.md + /home/persona/crearis/crearis-vue/chat/FPOSTIT_QUICK_START.md

- Q: German, English, or bilingual? 
- A: Mostly english, but some sections are bilingual, I'll show you below

## Table of Contents
{I provide hints, instructions for you, how you could start this in this kind of parantheses}
- general overview: english + german {only write the english part + empty german part as placeholder so we know it will be bilingual here}
    {write this for end-users, not devs, but write it in english. Start with the question: What is Theaterpedia, Theaterpedia.org? (remember: it is close to: Wikipedia) -> what you understood about it so far. }
- end-user documentation: german > english translation {leave english part empty now}
	- Intro "Warum Theaterpedia, braucht mein Projekt, mein Kurs eine Website?" {-> inspect and summarize this source: /home/persona/crearis/crearis-vue/temp_import/Theaterpedia_Konzeptentwurf_Pilotphase_Bayern.pdf}
    - "Fragen und Antworten" {work from this source: /home/persona/crearis/crearis-vue/temp_import/Theaterpedia-Lauch_ Project-Login-Workflow.pdf  /// take out some interesting parts from yesterdays session with practitioners, just use the first letter of the names, like E for Eleanora}
    - "Ein Projekt starten" {will be done after v0.3 -> but now already prepare for the project-stepper here, one page each for: General Add Events > Add Posts > Add Images > Configure Members, Partners, Other Projects > Theming, Design > Project "check-in" (when project state is moved to 'demo' or 'draft')}
	- "Ein Projekt entwickeln" {will be done after v0.4 -> but now prepare for the project-stepper here, leave empty}
- admin: english > document all sysreg {best would be: with some screenshots -> you could prepare a list for me, I'll take them} including i18n
- developer: english {for all this you find more than enough information in the md-docs at /chat, the best start will be from /chat/tasks -> and then find out which of the global docs to consult eventually for further details /// if you are unsure whether things are still valid then put a warning-banner on the top of the page or on the top of the section that may contain outdated or ambiguous content. But in general: Don't bloat the dev-docs, better leave things out that working with outdated or ambiguous information}
	- "Hack-the-Sysreg-Page" {table that provides fast access to}:
		- essential entries in the 3 dev-tables (status, config, rtag): value, name, description
		- the tagFamilies of ctags, ttags, dtags: value, parent-bit, name, description
	- {the following all organized in two sections: 'Overview' -> 'Details', no further categories yet, every row builds one entry for Overview that has links into the 'Details', use anchor-links if possible} features, components that are in stable alpha and build the foundation for the remaining implementation
		- {just write a brief summary for now} routes /projects {in detail at the end of v0.3} + /sites {in detail at the end of v0.4} 
		- useTheme.vue, oklch + css conventions
		- markdown-editing, prose, heading-parser, post-its
		- i18n {understand it from the sysreg-tables + i18n-composable}
		- images: shapes, imageShape-Component!! (/home/persona/crearis/crearis-vue/src/components/images/ImgShape.vue + /home/persona/crearis/crearis-vue/src/views/admin/ImagesCoreAdmin.vue), imageProcessing at the backend -> adapter-strategy with 'author' (like canva) -> 'producer' (like cloudinary) -> publisher (like cloudflare)
		- clist-component-Family {understand it from: /home/persona/crearis/crearis-vue/src/components/clist/ItemList.vue, then end it with: /home/persona/crearis/crearis-vue/src/components/page/pList.vue, pListEdit.vue and /home/persona/crearis/crearis-vue/src/components/clist/DropdownList.vue) -> this is so far the most robust group of implementated components on the project if combined with the power of imageShape!!}
		- {just write a brief summary for now -> in detail at the end of v0.4} pageLayout-System with 1-col, 2-col, 3-col + how the clist/plist-components fit in here
		- {just write a brief summary-> will be done at the end of v0.3} project-stepper + project-navigation
		- {just write a brief summary-> will be done at the end of v0.4} page-editor, post-editor
		- {just write a brief summary-> will be done at the end of v0.3} sysreg I: with auth-focus {state, entities, roles}: status, config, rtags
		- sysreg II: with content/domain-focus: ctags, ttags, dtags