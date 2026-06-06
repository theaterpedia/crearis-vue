/**
 * Vue Router · DESTRUCTIVE for alpha/magnifica-site-1a.
 *
 * Cand-1a routes per candidate-1a/_manifest §1 (killed mainline routes · only
 * Magnifica routes ship): / · /ethnography · /bio · /foucault. The mainline
 * crearis-vue routes belong on alpha/magnifica · this branch is the destructive
 * content-site (peer to cand-1c's alpha/magnifica-site).
 *
 * Auth-shape: cookie-gesture-mode (see src/composables/useMagnificaAuth.ts +
 * server/middleware/00-magnifica-auth.ts). Magnifica-auth guard · alt-routes
 * redirect to `/` when unauthenticated · landing is always reachable.
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
    { path: '/bio', component: () => import('@/views/Magnifica/BioPage.vue') },
    { path: '/foucault', component: () => import('@/views/Magnifica/FoucaultPage.vue') },
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
