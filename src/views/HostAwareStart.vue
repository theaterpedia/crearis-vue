<!--
  HostAwareStart · the `/start` dispatcher — HostAwareRoot's twin.

  One URL, two meanings, decided by host (route-space contract §1 · §3):
    theaterpedia.org/start      → Home/StartPage.vue      (the portal campaign)
    utopia-in-action.de/start   → ProjectStartPage.vue     (THAT project's start)

  ── Why this exists (contract §17·2) ─────────────────────────────────────────
  `/start` had no site-shape route: the tonight-narrow recreation (`eeb099b`)
  aliased `/posts/:identifier` and `/events/:identifier` only. So on EVERY host
  the static portal route matched — while `domainSiteFrames` + `projectPath()`
  mint `Agenda → /start` on a project's own domain. The frame pointed at a URL
  the router served as portal.

  ⚠ **An alias cannot fix it** — `alias: ['/start']` on the project route
  collides with the static portal `/start`, and two identical static paths
  resolve first-registered-wins (the portal's is registered earlier).
  Vue-router's specificity ranking does not separate them. A dispatcher is the
  only layer that can, and the contract already ratified the pattern for `/`.

  ⚠ **What renders was DATA-dependent before this, which is why it had to be
  fixed at the router:** on a box without a portal project `StartPage`
  self-redirects (`StartPage.vue` → „Project not found" → `router.push('/')`),
  so a tenant `/start` bounced to the landing and looked harmless; where the
  portal project row exists, the same route renders the portal's campaign under
  the tenant's chrome — breaking the c95b514 no-wordmark rule at a layer no
  chrome-fix reaches.

  ⭐ This is contract §8-T3's reversal arriving early for ONE route, not new
  mechanism. When T3 lands in full, `/start` becomes site-reserved and the
  portal branch here is what gets deleted — deletion-shaped, per §12·4.

  Host is read ONCE, synchronously, before either child mounts — same discipline
  as HostAwareRoot: anything async here paints a portal-flash on a tenant site.
-->

<template>
    <StartPage v-if="isPortalHost" />
    <ProjectStartPage v-else />
</template>

<script setup lang="ts">
import StartPage from './Home/StartPage.vue'
import ProjectStartPage from './ProjectStartPage.vue'
import { isProjectHost } from '@/composables/useHostMode'

const isPortalHost = !isProjectHost(typeof window !== 'undefined' ? window.location.host : '')
</script>
