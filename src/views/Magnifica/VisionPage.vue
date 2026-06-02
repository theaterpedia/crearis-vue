<!--
  VisionPage · /vision route · alt-route of the Magnifica response-page.

  Per howto-topbar §1 State-C (alt-routes · always-compact bar with active-
  route highlight) + howto-password-entry §7 (alt-routes require auth · the
  router-guard redirects to / when unauthenticated).
-->

<template>
  <div class="magnifica-page">
    <TopNav :items="navItems" navbar-mode="page" scroll-style="simple">
      <template #actions>
        <MagnificaLogoutButton />
      </template>
    </TopNav>
    <main class="magnifica-page-content">
      <h1 class="magnifica-page-title">{{ pageTitle }}</h1>
      <CardsCanvas :items="postits">
        <template #board>
          <p class="board-prose">
            The vision-page body. Dummy content · real content lands when HM ships.
          </p>
        </template>
      </CardsCanvas>
    </main>
  </div>
</template>

<script setup lang="ts">
import TopNav from '@/components/TopNav.vue'
import MagnificaLogoutButton from './MagnificaLogoutButton.vue'
import CardsCanvas from '@/components/magnifica/CardsCanvas.vue'
import { pageTitle, postits } from './content/vision'
import { navItems } from './content/nav'
</script>

<style scoped>
.magnifica-page {
  font-family: ui-monospace, "JetBrains Mono", "Cascadia Code", Menlo, Consolas, monospace;
  min-height: 100vh;
  background: #1a1a1a;
  color: #f4f4f4;
}

.magnifica-page-content {
  padding: 2rem clamp(1rem, 4vw, 2rem);
  max-width: 80rem;
  margin: 0 auto;
}

.magnifica-page-title {
  font-size: clamp(1.5rem, 4vw, 2.5rem);
  font-weight: 700;
  margin: 0 0 2rem;
}

.board-prose {
  margin: 0;
  font-size: 1rem;
  line-height: 1.6;
}
</style>
