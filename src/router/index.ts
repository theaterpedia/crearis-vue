import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  // Restore browser-restored position on back/forward; jump to hash anchors; scroll-top on fresh nav.
  scrollBehavior(to, _from, savedPosition) {
    if (savedPosition) return savedPosition
    if (to.hash) return { el: to.hash }
    return { top: 0 }
  },
  routes: [
    // Public routes
    { path: '/login', component: () => import('../views/Login.vue'), meta: { public: true } },
    // Phase-A C7 · password-reset landing surface (token-bearing email link)
    { path: '/auth/reset', component: () => import('../views/Auth/PasswordResetPage.vue'), meta: { public: true } },
    // Phase-A C8 · creator-tier registration form (instructor / organiser)
    { path: '/auth/register', component: () => import('../views/Auth/RegisterPage.vue'), meta: { public: true } },
    { path: '/', component: () => import('../views/Home/HomePage.vue') },
    { path: '/start', component: () => import('../views/Home/StartPage.vue') },
    { path: '/team', component: () => import('../views/Home/TeamPage.vue') },
    { path: '/blog', component: () => import('../views/Home/BlogPage.vue') },
    { path: '/contact', component: () => import('../views/Home/ContactPage.vue') },
    { path: '/impressum', component: () => import('../views/Home/ImpressumPage.vue') },
    { path: '/datenschutz', component: () => import('../views/Home/DatenschutzPage.vue') },
    { path: '/getstarted', component: () => import('../views/GetStarted.vue') },
    { path: '/sites/:domaincode', component: () => import('../views/ProjectSite.vue') },
    // Posts: Support both numeric ID and slug-based URLs
    // Slug format: {slug} or {template}__{slug} → resolved to xmlid: {domaincode}.post__{slug} or {domaincode}.post-{template}__{slug}
    { path: '/sites/:domaincode/posts/:identifier', component: () => import('../views/PostPage.vue') },
    // Events: Support both numeric ID and slug-based URLs
    // Slug format: {slug} or {template}__{slug} → resolved to xmlid: {domaincode}.event__{slug} or {domaincode}.event-{template}__{slug}
    { path: '/sites/:domaincode/events/:identifier', component: () => import('../views/EventPage.vue') },

    // Protected routes - User Home (cross-project overview)
    // HACK: Using HomeLayoutHack.vue for onboarding flow testing (TODO v0.5: revert to HomeLayout.vue)
    { path: '/home', component: () => import('../views/HomeLayoutHack.vue'), meta: { requiresAuth: true } },
    { path: '/home-clean', component: () => import('../views/HomeLayout.vue'), meta: { requiresAuth: true } },

    // Protected routes - Project Dashboard (Variant-C: nested per-NavStop views)
    // Per Item-2 SFR-76 + §3 design-variant-branch exception-clause; previous flat
    // routes-all-mapping-to-ProjectDashboard.vue replaced by DashboardShell parent
    // + 5 nested NavStop view-components. Each view owns its right-rail per §12
    // agenda-view-mode pattern. ProjectDashboard.vue retained in source as
    // reference + as the Variant-A fallback target (sfr/item2-c-decision-2026-04-23
    // tag at 6c79600).
    {
        path: '/projects/:projectId',
        component: () => import('../views/project/DashboardShell.vue'),
        meta: { requiresAuth: true },
        children: [
            { path: '', redirect: to => `/projects/${to.params.projectId}/agenda` },
            { path: 'agenda', component: () => import('../views/project/AgendaView.vue') },
            { path: 'topics', component: () => import('../views/project/TopicsView.vue') },
            { path: 'images', component: () => import('../views/project/ImagesView.vue') },
            { path: 'partners', component: () => import('../views/project/PartnersView.vue') },
            { path: 'settings', component: () => import('../views/project/SettingsView.vue') },
        ],
    },

    // Legacy route - keep for backwards compatibility during transition
    // TODO v0.5: Remove this once all users migrated to /projects/:projectId routes
    { path: '/projects', component: () => import('../views/project/ProjectMain.vue'), meta: { requiresAuth: true, role: 'project' } },

    // Other protected routes
    { path: '/tasks', component: () => import('../views/TaskDashboard.vue'), meta: { requiresAuth: true } },
    { path: '/base', component: () => import('../views/BaseView.vue'), meta: { requiresAuth: true, role: 'base' } },

    // Admin routes
    { path: '/admin/domains', component: () => import('../views/admin/DomainsAdmin.vue'), meta: { requiresAuth: true, role: 'admin' } },
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
    { path: '/demo/display-image', component: () => import('../views/Demo/DemoDisplayImage.vue') },
    // Magnifica primitives playground · per CV@wsl dispatch #4 §5 (TO (website) 2026-06-02)
    { path: '/demo/magnifica', component: () => import('../views/Demo/MagnificaDemo.vue') },

    // Other routes (demos, legacy)
    { path: '/legacy-home', component: () => import('../views/index.vue') }, // Renamed from /home
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

      // Legacy /projects route handling - requires projectId in session
      // New routes: /projects/:projectId/* handle auth via projectId in URL
      if (to.path === '/projects') {
        if (data.user.activeRole !== 'project') {
          next('/home') // Redirect to user home
          return
        }
        if (!data.user.projectId) {
          next('/home') // Redirect to user home to select project
          return
        }
      }

      // Project-scoped routes: /projects/:projectId/*
      // Auth check is done in ProjectDashboard.vue via API call
      // Route guard just ensures user is authenticated

      // Check role if specified
      if (to.meta.role && data.user.activeRole !== to.meta.role && data.user.activeRole !== 'admin') {
        // Wrong role, redirect to appropriate page based on active role
        if (data.user.activeRole === 'base') {
          next('/base')
        } else if (data.user.activeRole === 'project') {
          // Redirect to user home where they can select a project
          next('/home')
        } else {
          next('/home')
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
