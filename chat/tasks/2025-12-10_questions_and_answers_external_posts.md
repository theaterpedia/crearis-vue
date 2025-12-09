# Q-and-A on Posts & Images External Experience by Code-Automation
Target: build Context before Implementation starts

For tomorrow's work on sites/[domaincode]/posts, here are my questions to build context:

## 1. Theming System
Q1.1: Is there a different CSS theme file per project (per domaincode), or do all projects share the same theme?
Q1.2: Are theme variables set via database fields (e.g., projects.theme_config JSONB) or external CSS files?
Q1.3: Should the external site inherit the admin oklch color system, or use a separate "public" theme?

## 2. Markdown-to-HTML Parsing
Q2.1: Which MD parser should we use? (marked, markdown-it, remark)
Q2.2: Are there custom MD extensions (e.g., :::info, :::warning blocks, or embedding images/videos)?
Q2.3: Is syntax highlighting needed for code blocks (prism, shiki)?
Q2.4: Should MD content be parsed server-side (SSR) or client-side?

## 3. Route Structure
Q3.1: What's the expected URL pattern? sites/{domaincode}/posts/{slug} or sites/{domaincode}/posts/{id}?
Q3.2: Do posts have slugs stored in the database, or generated from title?
Q3.3: Is this a public route (no auth) or project-member-only?

## 4. Data Sources
Q4.1: Is there an existing /api/sites/[domaincode]/posts endpoint, or do we need to create one?
Q4.2: What fields from posts table should be exposed publicly? (content, images, author, tags?)
Q4.3: Should images in posts use the same adapter chain (cloudinary URLs)?

## 5. Layout & Components
Q5.1: Does the external site have a different layout (no admin sidebar, different header)?
Q5.2: Is there a SiteLayout.vue or similar component for public pages?
Q5.3: Should posts show a related posts / tags section at the bottom?

## 6. History Context
Q6.1: Were there earlier iterations of the sites/ routes that I should review?
Q6.2: Is there a design document or mockup for the external posts view?
Q6.3: Are there existing similar external views (e.g., sites/[domaincode]/events) I can reference?
