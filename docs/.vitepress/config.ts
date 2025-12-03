import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Crearis',
  description: 'Documentation for Crearis Vue Platform',
  
  themeConfig: {
    logo: '/logo.svg',
    
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Guide', link: '/guide/' },
      { text: 'Reference', link: '/reference/' },
      { text: 'Changelog', link: '/changelog' }
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'Getting Started',
          items: [
            { text: 'Introduction', link: '/guide/' },
            { text: 'Quick Start', link: '/guide/quick-start' },
            { text: 'Project Setup', link: '/guide/project-setup' }
          ]
        },
        {
          text: 'Core Concepts',
          items: [
            { text: 'Architecture', link: '/guide/architecture' },
            { text: 'Project Workflow', link: '/guide/project-workflow' },
            { text: 'Auth & Roles', link: '/guide/auth-roles' }
          ]
        },
        {
          text: 'Styling',
          items: [
            { text: 'Opus CSS Conventions', link: '/guide/opus-css' },
            { text: 'Theme System', link: '/guide/theme-system' }
          ]
        }
      ],
      '/reference/': [
        {
          text: 'Components',
          items: [
            { text: 'Overview', link: '/reference/' },
            { text: 'TagFamilies', link: '/reference/components/tag-families' },
            { text: 'ProjectStepper', link: '/reference/components/project-stepper' },
            { text: 'ImageImporter', link: '/reference/components/image-importer' }
          ]
        },
        {
          text: 'API',
          items: [
            { text: 'Endpoints', link: '/reference/api/' },
            { text: 'Projects', link: '/reference/api/projects' },
            { text: 'Images', link: '/reference/api/images' },
            { text: 'Users', link: '/reference/api/users' }
          ]
        },
        {
          text: 'Database',
          items: [
            { text: 'Schema', link: '/reference/database/' },
            { text: 'Migrations', link: '/reference/database/migrations' }
          ]
        }
      ]
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/theaterpedia/crearis-vue' }
    ],

    footer: {
      message: 'Crearis Platform Documentation',
      copyright: '© 2025 Theaterpedia'
    },

    search: {
      provider: 'local'
    }
  }
})
