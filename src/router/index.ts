import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // Public routes
    { path: '/login', component: () => import('../views/Login.vue'), meta: { public: true } },

    // Protected routes
    { path: '/', component: () => import('../views/TaskDashboard.vue'), meta: { requiresAuth: true } },
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

      // Check role if specified
      if (to.meta.role && data.user.role !== to.meta.role && data.user.role !== 'admin') {
        // Wrong role, redirect to appropriate page
        if (data.user.role === 'base') {
          next('/base')
        } else if (data.user.role === 'project') {
          next('/project')
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
