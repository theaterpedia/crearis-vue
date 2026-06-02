<!--
  LandingPage · the Magnifica response-page root (/).

  Always renders EntryHero (per howto-password-entry §0.4 · one URL · the hero
  stays). Pre-auth: the form-region is shown. Post-auth: the form is hidden ·
  the gated content (carrier-components) unfolds below.

  Per crearis:projects/magnifica/docs/howto-password-entry.md §0.4 + §2 +
  crearis:projects/magnifica/docs/integration-directions.md §3 step-4.
-->

<template>
  <div
    class="magnifica-landing"
    :data-just-unlocked="showUnlock ? 'true' : null"
  >
    <!--
      3-beat unlock overlay · mounts once after password-success (URL-param
      trigger from middleware). Component lives at @/views/Magnifica/UnlockOverlay.vue
      per crearis:projects/magnifica/docs/animations.md §2.1 · to be implemented
      by the overlay-spec-implementer · this scaffolding (the showUnlock ref +
      onMounted read + history.replaceState clean + data-just-unlocked attribute)
      is in place so the implementer only needs to add the import + the v-if line.

      <UnlockOverlay v-if="showUnlock" @complete="showUnlock = false" />
    -->

    <EntryHero :show-form="!isAuthenticated" />

    <main v-if="isAuthenticated" class="magnifica-landing-content">
      <CardsCanvas :items="postits">
        <template #board>
          <p class="board-prose">
            The magnifica response unfolds here. The carrier-components are wired ·
            content is placeholder · real content lands when HM ships.
          </p>
        </template>
      </CardsCanvas>

      <BackSlide image-alt="Placeholder closing image" theme-color="green" image="">
        <p>
          A back-slide closes the page · per howto-panels §1 framework.
          (Image source pending real-content decision.)
        </p>
      </BackSlide>

      <p class="magnifica-landing-nav-hint">
        <router-link to="/vision">Vision</router-link>
        ·
        <router-link to="/toolbox">Toolbox</router-link>
        ·
        <router-link to="/verein">Verein</router-link>
      </p>

      <p class="magnifica-landing-actions">
        <MagnificaLogoutButton />
      </p>
    </main>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useMagnificaAuth } from '@/composables/useMagnificaAuth'
import EntryHero from './EntryHero.vue'
import MagnificaLogoutButton from './MagnificaLogoutButton.vue'
import CardsCanvas from '@/components/magnifica/CardsCanvas.vue'
import BackSlide from '@/components/magnifica/BackSlide.vue'
import { postits } from './content/landing'

const { isAuthenticated } = useMagnificaAuth()

/**
 * Unlock-overlay trigger · per crearis:projects/magnifica/docs/animations.md §2.3
 * Option A. The Nitro middleware redirects to `/?just_unlocked=1` on auth-success
 * (see server/middleware/00-magnifica-auth.ts SUCCESS_REDIRECT). We read the
 * flag on mount, set `showUnlock`, then clean the URL via history.replaceState
 * to prevent replay on refresh.
 *
 * The UnlockOverlay component itself is not yet implemented (overlay-spec lives
 * in animations.md §2 · implementer's lane). This scaffolding makes the trigger
 * ready; adding the component is a one-line v-if (see template comment).
 */
const showUnlock = ref(false)

onMounted(() => {
  if (typeof window === 'undefined') return
  const params = new URLSearchParams(window.location.search)
  if (params.has('just_unlocked')) {
    showUnlock.value = true
    window.history.replaceState({}, '', window.location.pathname)
  }
})
</script>

<style scoped>
.magnifica-landing {
  font-family: ui-monospace, "JetBrains Mono", "Cascadia Code", Menlo, Consolas, monospace;
}

.magnifica-landing-content {
  background: #1a1a1a;
  color: #f4f4f4;
  padding: 2rem 0 0;
}

.board-prose {
  margin: 0;
  font-size: 1rem;
  line-height: 1.6;
}

.magnifica-landing-nav-hint {
  text-align: center;
  padding: 2rem 1rem 4rem;
  font-size: 0.875rem;
  color: #f4f4f4;
  background: #1a1a1a;
}

.magnifica-landing-nav-hint a {
  color: #ffee00;
  text-decoration: none;
  padding: 0 0.5rem;
}

.magnifica-landing-nav-hint a:hover {
  text-decoration: underline;
}

.magnifica-landing-nav-hint a:focus-visible {
  outline: 2px solid #ffee00;
  outline-offset: 2px;
  border-radius: 2px;
}

.magnifica-landing-actions {
  text-align: center;
  margin: 0;
  padding: 0 1rem 3rem;
  background: #1a1a1a;
}
</style>
