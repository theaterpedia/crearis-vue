/**
 * Vue Router · DESTRUCTIVE for alpha/magnifica-site.
 *
 * Cand-1c routes per §11.1 (killed 2022-routes · only Magnifica routes ship) +
 * §11.5 detail-page paths. The mainline crearis-vue routes belong on
 * alpha/magnifica · this branch is the destructive content-site.
 *
 * Auth-shape: cookie-gesture-mode per HM-2026-06-02 PM (see
 * src/composables/useMagnificaAuth.ts + server/middleware/00-magnifica-auth.ts).
 * Magnifica-auth guard · alt-routes redirect to `/` when unauthenticated ·
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
    { path: '/ethnography', component: () => import('@/views/Magnifica/EthnographyPage.vue') },
    { path: '/hans-doenitz', component: () => import('@/views/Magnifica/HansDoenitzPage.vue') },
    { path: '/discourse', component: () => import('@/views/Magnifica/DiscoursePage.vue') },
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
