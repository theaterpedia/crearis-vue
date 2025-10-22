import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // Public routes
    { path: '/login', component: () => import('../views/Login.vue'), meta: { public: true } },
    { path: '/', component: () => import('../views/Home.vue') },
    { path: '/getstarted', component: () => import('../views/GetStarted.vue') },
    { path: '/sites/:domaincode', component: () => import('../views/ProjectSite.vue') },

    // Protected routes
    { path: '/tasks', component: () => import('../views/TaskDashboard.vue'), meta: { requiresAuth: true } },
    { path: '/base', component: () => import('../views/BaseView.vue'), meta: { requiresAuth: true, role: 'base' } },
    { path: '/project', component: () => import('../views/project/ProjectMain.vue'), meta: { requiresAuth: true, role: 'project' } },

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

      // Special handling for /project route - requires projectId to be set
      if (to.path === '/project') {
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
          // Only go to /project if projectId is set
          if (data.user.projectId) {
            next('/project')
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
