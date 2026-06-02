/**
 * Vue Router · DESTRUCTIVE for alpha/magnifica-site.
 *
 * Replaces the mainline crearis-vue routes-array entirely with the 4 magnifica
 * routes (per crearis:projects/magnifica/docs/integration-directions.md §3
 * step-3 (a) wholesale-replace pattern). The mainline routes belong on
 * alpha/magnifica · this branch is the destructive content-site.
 *
 * Auth-shape: cookie-gesture-mode per HM-2026-06-02 PM (see
 * src/composables/useMagnificaAuth.ts + server/middleware/00-magnifica-auth.ts).
 * The previous session-based `router.beforeEach` is replaced by a
 * magnifica-auth guard · alt-routes redirect to `/` when unauthenticated ·
 * landing is always reachable.
 */

import { createRouter, createWebHistory } from 'vue-router'
import { useMagnificaAuth } from '@/composables/useMagnificaAuth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior(to, _from, savedPosition) {
    if (savedPosition) return savedPosition
    if (to.hash) return { el: to.hash }
    return { top: 0 }
  },
  routes: [
    { path: '/', component: () => import('@/views/Magnifica/LandingPage.vue') },
    { path: '/vision', component: () => import('@/views/Magnifica/VisionPage.vue') },
    { path: '/toolbox', component: () => import('@/views/Magnifica/ToolboxPage.vue') },
    { path: '/verein', component: () => import('@/views/Magnifica/VereinPage.vue') },
    // Catch-all · any other path redirects to landing (the gate is at /)
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

// Magnifica auth-guard · alt-routes require auth · landing is always reachable
router.beforeEach((to, _from, next) => {
  if (to.path === '/') {
    next()
    return
  }
  const { isAuthenticated } = useMagnificaAuth()
  if (!isAuthenticated.value) {
    next('/')
    return
  }
  next()
})

export default router
