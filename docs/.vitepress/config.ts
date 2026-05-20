import { defineConfig } from 'vitepress'

export default defineConfig({
    title: 'Theaterpedia',
    description: 'Crearis Platform Documentation',
    base: '/', // Will be deployed to docs.theaterpedia.org

    head: [
        ['link', { rel: 'icon', href: '/logo.png' }],
        // Monaspace fonts from theaterpedia.org
        ['link', { rel: 'stylesheet', href: 'https://theaterpedia.org/fonts/monaspace.css' }],
    ],

    themeConfig: {
        logo: '/logo.png',
        siteTitle: 'Theaterpedia',

        nav: [
            { text: 'Home', link: '/' },
            { text: 'Anleitung', link: '/de/' },
            { text: 'Admin', link: '/admin/' },
            { text: 'Developer', link: '/dev/' },
        ],

        sidebar: {
            // German end-user documentation
            '/de/': [
                {
                    text: 'Einführung',
                    items: [
                        { text: 'Übersicht', link: '/de/' },
                        { text: 'Warum Theaterpedia?', link: '/de/warum-theaterpedia' },
                        { text: 'Erste Schritte', link: '/de/getstarted' },
                        { text: 'Fragen und Antworten', link: '/de/faq' },
                    ]
                },
                {
                    text: 'Ein Projekt starten',
                    items: [
                        { text: 'Übersicht', link: '/de/projekt-starten/' },
                        { text: 'Schritt 1: Events', link: '/de/projekt-starten/events' },
                        { text: 'Schritt 2: Posts', link: '/de/projekt-starten/posts' },
                        { text: 'Schritt 3: Images', link: '/de/projekt-starten/images' },
                        { text: 'Schritt 4: Members', link: '/de/projekt-starten/members' },
                        { text: 'Schritt 5: Design', link: '/de/projekt-starten/design' },
                        { text: 'Schritt 6: Check-in', link: '/de/projekt-starten/checkin' },
                    ]
                },
                {
                    text: 'Ein Projekt entwickeln',
                    items: [
                        { text: 'Übersicht', link: '/de/projekt-entwickeln/' },
                        { text: 'Posts bearbeiten', link: '/de/projekt-entwickeln/posts-bearbeiten' },
                        { text: 'Events bearbeiten', link: '/de/projekt-entwickeln/events-bearbeiten' },
                        { text: 'Themes, Layout & Page-Heading', link: '/de/projekt-entwickeln/themes-layout-page-heading' },
                        { text: 'Page-Heading Details', link: '/de/projekt-entwickeln/page-heading-details' },
                    ]
                }
            ],

            // Admin documentation (English)
            '/admin/': [
                {
                    text: 'Admin Guide',
                    items: [
                        { text: 'Overview', link: '/admin/' },
                        { text: 'Domain Management', link: '/admin/domains' },
                        { text: 'Sysreg Admin View', link: '/admin/sysreg' },
                        { text: 'i18n Configuration', link: '/admin/i18n' },
                    ]
                },
                {
                    text: 'Screenshots Needed',
                    items: [
                        { text: 'Screenshot Checklist', link: '/admin/screenshots' },
                    ]
                }
            ],

            // Developer documentation (English)
            '/dev/': [
                {
                    text: 'Quick Reference',
                    items: [
                        { text: 'Overview', link: '/dev/' },
                        { text: '🚨 Alpha Publishing System', link: '/dev/alpha-publishing' },
                        { text: 'Hack the Sysreg', link: '/dev/hack-sysreg' },
                        { text: 'Entity Index Conventions', link: '/dev/ENTITY_INDEX_CONVENTIONS' },
                        { text: 'Creators, Not Owners', link: '/dev/creators-not-owners' },
                    ]
                },
                {
                    text: 'Core Features',
                    collapsed: false,
                    items: [
                        { text: 'Routes Overview', link: '/dev/features/routes' },
                        { text: 'Theme System & Opus CSS', link: '/dev/features/theme-opus-css' },
                        { text: 'Markdown & PostIts', link: '/dev/features/markdown-postits' },
                        { text: 'i18n System', link: '/dev/features/i18n' },
                        { text: 'Image System', link: '/dev/features/images' },
                        { text: 'cList Components', link: '/dev/features/clist' },
                        { text: 'Page Layout System', link: '/dev/features/page-layout' },
                        { text: 'Dashboard Layout', link: '/dev/features/dashboard-layout' },
                        { text: 'Project Stepper', link: '/dev/features/project-stepper' },
                        { text: 'Page & Post Editor', link: '/dev/features/editors' },
                    ]
                },
                {
                    text: 'Sysreg Tables',
                    collapsed: false,
                    items: [
                        { text: 'Design Philosophy', link: '/dev/sysreg/design-philosophy' },
                        { text: 'Auth Focus: Status, Config, Rtags', link: '/dev/sysreg/auth' },
                        { text: 'Content Focus: Ctags, Ttags, Dtags', link: '/dev/sysreg/content' },
                        { text: 'How to work with capabilities', link: '/dev/sysreg/capabilities-howto' },
                        { text: 'Capabilities Naming', link: '/dev/sysreg/CAPABILITIES_NAMING_CONVENTION' },
                        { text: 'Status Editor Guide', link: '/dev/sysreg/STATUS_EDITOR_GUIDE' },
                    ]
                },
                {
                    text: 'Automation',
                    collapsed: true,
                    items: [
                        { text: 'Database Access', link: '/dev/automation/database' },
                        { text: 'Test Infrastructure', link: '/dev/automation/TEST_INFRASTRUCTURE' },
                        { text: 'Test Registry', link: '/dev/automation/TEST_REGISTRY' },
                    ]
                },
                {
                    text: 'Page Heading Component',
                    collapsed: true,
                    items: [
                        { text: 'Introduction', link: '/dev/page-heading/' },
                        { text: '1. Specification', link: '/dev/page-heading/01-specification' },
                        { text: '2. Core Components', link: '/dev/page-heading/02-core-components' },
                        { text: '3. API Reference', link: '/dev/page-heading/03-api-reference' },
                        { text: '4. Responsive Logic', link: '/dev/page-heading/04-responsive-logic' },
                        { text: '5. Format Options', link: '/dev/page-heading/05-format-options' },
                    ]
                },
                {
                    text: 'Odoo Integration',
                    collapsed: true,
                    items: [
                        { text: 'Overview', link: '/dev/odoo/' },
                        { text: 'Events Admin Actions', link: '/dev/odoo/EVENTS_ADMIN_NEXT_ACTIONS' },
                        {
                            text: 'Concepts',
                            collapsed: true,
                            items: [
                                { text: 'XML ID Versioning', link: '/dev/odoo/concepts/xmlid-versioning' },
                                { text: 'JSON Fields', link: '/dev/odoo/concepts/json-fields' },
                                { text: 'Web Options', link: '/dev/odoo/concepts/web-options' },
                                { text: 'Demo Data', link: '/dev/odoo/concepts/demo-data' },
                            ]
                        },
                        {
                            text: 'Project Architecture',
                            collapsed: true,
                            items: [
                                { text: 'Website as Project', link: '/dev/odoo/project/website' },
                                { text: 'Domain Users', link: '/dev/odoo/project/domainuser' },
                                { text: 'Configuration', link: '/dev/odoo/project/config' },
                            ]
                        },
                        {
                            text: 'Entities',
                            collapsed: true,
                            items: [
                                { text: 'Events', link: '/dev/odoo/entities/events' },
                                { text: 'Episodes (Blog Posts)', link: '/dev/odoo/entities/episodes' },
                                { text: 'Partners', link: '/dev/odoo/entities/partners' },
                            ]
                        },
                        {
                            text: 'API Reference',
                            collapsed: true,
                            items: [
                                { text: 'Events API', link: '/dev/odoo/api/events' },
                                { text: 'Sessions API', link: '/dev/odoo/api/sessions' },
                                { text: 'Workflows', link: '/dev/odoo/api/workflows' },
                            ]
                        },
                    ]
                }
            ],

            // English overview (mirrors German structure)
            '/en/': [
                {
                    text: 'Introduction',
                    items: [
                        { text: 'Overview', link: '/en/' },
                    ]
                }
            ]
        },

        socialLinks: [
            { icon: 'github', link: 'https://github.com/theaterpedia/crearis-vue' }
        ],

        footer: {
            message: 'Theaterpedia Documentation',
            copyright: '© 2025 Theaterpedia e.V.'
        },

        search: {
            provider: 'local'
        },

        outline: {
            level: [2, 3],
            label: 'Auf dieser Seite'
        }
    }
})
