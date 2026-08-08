<!--
  HostAwareRoot · the `/` dispatcher (route-space contract §3 · §9 tonight-narrow).

  One URL, two meanings, decided by host:
    theaterpedia.org/        → HomePage      (the portal landing)
    utopia-in-action.de/     → ProjectSite   (that project's landing)

  Why a dispatcher and not a router guard (contract §8·T1): a guard would have to
  redirect, which changes the URL bar — and a project's own domain must keep its
  clean `/`. Dispatching keeps the URL and costs one component.

  ⚠ The host is read ONCE, synchronously, before either child mounts — so the
  page paints its true self on the first frame. Anything async here (fetching a
  host→project map on boot) would produce a portal-flash on every tenant site.
  That is also why `HOST_PROJECT` is bundle-code today; the contract's §15·A·4
  proposes server-stamping it, which would preserve this property.

  ⚠ ProjectSite resolves its own domaincode via `resolveDomaincode(route param)`
  — on this route there is no param, so it falls through to the host.
-->

<template>
    <HomePage v-if="isPortalHost" />
    <ProjectSite v-else />
</template>

<script setup lang="ts">
import HomePage from './Home/HomePage.vue'
import ProjectSite from './ProjectSite.vue'
import { isProjectHost } from '@/composables/useHostMode'

const isPortalHost = !isProjectHost(typeof window !== 'undefined' ? window.location.host : '')
</script>
