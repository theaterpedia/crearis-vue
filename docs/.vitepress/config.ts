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
                    ]
                }
            ],

            // Admin documentation (English)
            '/admin/': [
                {
                    text: 'Admin Guide',
                    items: [
                        { text: 'Overview', link: '/admin/' },
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
                        { text: 'Hack the Sysreg', link: '/dev/hack-sysreg' },
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
                        { text: 'Project Stepper', link: '/dev/features/project-stepper' },
                        { text: 'Page & Post Editor', link: '/dev/features/editors' },
                    ]
                },
                {
                    text: 'Sysreg Tables',
                    collapsed: false,
                    items: [
                        { text: 'Auth Focus: Status, Config, Rtags', link: '/dev/sysreg/auth' },
                        { text: 'Content Focus: Ctags, Ttags, Dtags', link: '/dev/sysreg/content' },
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
