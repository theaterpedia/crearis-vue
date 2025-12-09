import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // Public routes
    { path: '/login', component: () => import('../views/Login.vue'), meta: { public: true } },
    { path: '/', component: () => import('../views/Home/HomePage.vue') },
    { path: '/start', component: () => import('../views/Home/StartPage.vue') },
    { path: '/team', component: () => import('../views/Home/TeamPage.vue') },
    { path: '/blog', component: () => import('../views/Home/BlogPage.vue') },
    { path: '/contact', component: () => import('../views/Home/ContactPage.vue') },
    { path: '/impressum', component: () => import('../views/Home/ImpressumPage.vue') },
    { path: '/datenschutz', component: () => import('../views/Home/DatenschutzPage.vue') },
    { path: '/getstarted', component: () => import('../views/GetStarted.vue') },
    { path: '/sites/:domaincode', component: () => import('../views/ProjectSite.vue') },
    { path: '/sites/:domaincode/posts/:id', component: () => import('../views/PostPage.vue') },

    // Protected routes
    { path: '/tasks', component: () => import('../views/TaskDashboard.vue'), meta: { requiresAuth: true } },
    { path: '/base', component: () => import('../views/BaseView.vue'), meta: { requiresAuth: true, role: 'base' } },
    { path: '/projects', component: () => import('../views/project/ProjectMain.vue'), meta: { requiresAuth: true, role: 'project' } },

    // Admin routes
    { path: '/admin/i18n', component: () => import('../views/I18nManagement.vue'), meta: { requiresAuth: true, role: 'admin' } },
    { path: '/admin/sysreg', component: () => import('../views/admin/SysregAdminView.vue'), meta: { requiresAuth: true, role: 'admin' } },
    { path: '/admin/sysreg-demo', component: () => import('../views/admin/SysregDemoView.vue'), meta: { requiresAuth: true, role: 'admin' } },
    { path: '/admin/images', component: () => import('../views/images/cimgRegistry.vue'), meta: { requiresAuth: true, role: 'base' } },
    { path: '/admin/images_core', component: () => import('../views/admin/ImagesCoreAdmin.vue'), meta: { requiresAuth: true, role: 'admin' } },
    { path: '/admin/images-browser', component: () => import('../views/ImageBrowser.vue'), meta: { requiresAuth: true, role: 'base' } },
    { path: '/admin/events', component: () => import('../views/admin/OdooEventsAdmin.vue'), meta: { requiresAuth: true, role: 'admin' } },

    // User routes
    { path: '/users/:id/images', component: () => import('../views/images/cimgRegistry.vue'), meta: { requiresAuth: true } },

    // Site routes
    { path: '/sites/:id/images', component: () => import('../views/images/cimgRegistry.vue'), meta: { requiresAuth: true } },

    // Demo routes - Floating Post-Its
    { path: '/demo/float-hard', component: () => import('../views/Demo/DemoFloatHard.vue') },
    { path: '/demo/sysreg', component: () => import('../views/admin/SysregDemo.vue') },
    { path: '/demo/float-dyn', component: () => import('../views/Demo/DemoFloatDyn.vue') },
    { path: '/demo/float-markdown', component: () => import('../views/Demo/DemoFloatMarkdown.vue') },
    { path: '/demo/list-item', component: () => import('../views/Demo/DemoListItem.vue') },

    // Other routes
    { path: '/home', component: () => import('../views/index.vue') },
    { path: '/catalog', component: () => import('../views/catalog.vue') },
    { path: '/demo', component: () => import('../views/demo.vue') },
    { path: '/heading', component: () => import('../views/heading.vue') },
    { path: '/heroes', component: () => import('../views/heroes.vue') },
    { path: '/standard', component: () => import('../views/standard.vue') },
    { path: '/timeline', component: () => import('../views/timeline.vue') },
    { path: '/theme-demo', component: () => import('../views/ThemeDemo.vue') },
    { path: '/clist-demo', component: () => import('../views/CListDemo.vue') },
    { path: '/kanban-demo', component: () => import('../views/KanbanDemo.vue') },
  ],
})

// Navigation guard
router.beforeEach(async (to, from, next) => {
  // Check if route requires authentication
  if (to.meta.requiresAuth) {
    try {
      // Check session
      const response = await fetch('/api/auth/session')
      const data = await response.json()

      if (!data.authenticated) {
        // Not authenticated, redirect to login
        next('/login')
        return
      }

      // Special handling for /projects route - requires projectId to be set
      if (to.path === '/projects') {
        if (data.user.activeRole !== 'project') {
          // Must be in project role
          next('/')
          return
        }
        if (!data.user.projectId) {
          // Must have a project selected
          next('/')
          return
        }
      }

      // Check role if specified
      if (to.meta.role && data.user.activeRole !== to.meta.role && data.user.activeRole !== 'admin') {
        // Wrong role, redirect to appropriate page based on active role
        if (data.user.activeRole === 'base') {
          next('/base')
        } else if (data.user.activeRole === 'project') {
          // Only go to /projects if projectId is set
          if (data.user.projectId) {
            next('/projects')
          } else {
            next('/')
          }
        } else {
          next('/')
        }
        return
      }

      // Authenticated and authorized
      next()
    } catch (error) {
      console.error('Auth check failed:', error)
      next('/login')
    }
  } else {
    // Public route
    next()
  }
})

export default router
