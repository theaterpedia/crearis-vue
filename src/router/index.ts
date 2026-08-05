/**
 * Vue Router · DESTRUCTIVE for alpha/uia.
 *
 * uia (Utopia in Action · Augsburg) ships as its own pm2 process with its own
 * routes, the way alpha/magnifica-site does. The mainline crearis-vue routes
 * belong on alpha/production; this branch is the destructive content-site.
 *
 * Recipe per `views/Uia/_CUTTER-PROMPT.md` §2: reading alpha/magnifica-site
 * against alpha/production is 38 files changed, 4889 insertions, 145 deletions —
 * and every single deletion is this file. Nothing else is destroyed. What went
 * away here: the mainline public pages, /login + /auth/*, the project dashboard
 * and its nested NavStops, /admin/*, and the demo routes — plus the auth guard
 * that served them.
 *
 * Two deliberate differences from magnifica's router:
 *
 *   - **No auth guard.** magnifica gates every alt-route behind a cookie-gesture
 *     password and redirects to `/` when unauthenticated. uia is public; that
 *     gate is explicitly not wanted here (§2).
 *   - **`scrollBehavior` verbatim from magnifica** (§2). Not cosmetic: the
 *     landing's single action is the in-page anchor `#agenda`, and it only lands
 *     correctly because of the `to.hash` branch.
 *
 * The three `ready: false` navstops in `views/Uia/content/nav.ts` — /vision,
 * /blog, /kontakt — all resolve to the shared StubPage. They render and stay
 * reachable on purpose: a nav that lies about what exists is worse than a nav
 * with a stub behind it (§1).
 */

import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior(to, _from, savedPosition) {
    if (savedPosition) return savedPosition
    if (to.hash) return { el: to.hash }
    return { top: 0 }
  },
  routes: [
    { path: '/', component: () => import('@/views/Uia/LandingPage.vue') },
    { path: '/agenda', component: () => import('@/views/Uia/AgendaPage.vue') },
    // ready: false in content/nav.ts → the shared „in Arbeit" stub
    { path: '/vision', component: () => import('@/views/Uia/StubPage.vue') },
    { path: '/blog', component: () => import('@/views/Uia/StubPage.vue') },
    { path: '/kontakt', component: () => import('@/views/Uia/StubPage.vue') },
    // ── The fullviews (HD 2026-08-06: events/posts „open on their own page,
    //    where they come editable if Rosa is logged in") ─────────────────────
    // EventPage/PostPage are the MAINLINE detail components, reused not rebuilt.
    // They read `route.params.domaincode`, so the real routes keep the
    // /sites/:domaincode shape; the friendly single-site paths redirect into it.
    { path: '/sites/:domaincode/events/:identifier', component: () => import('@/views/EventPage.vue') },
    { path: '/sites/:domaincode/posts/:identifier', component: () => import('@/views/PostPage.vue') },
    { path: '/events/:identifier', redirect: (to) => `/sites/utopiaxaction/events/${to.params.identifier}` },
    { path: '/posts/:identifier', redirect: (to) => `/sites/utopiaxaction/posts/${to.params.identifier}` },
    // Catch-all · any other path redirects to the landing, as magnifica does
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

export default router
