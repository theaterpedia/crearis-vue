<!--
  MagnificaLogoutButton · close-and-reopen action for the Magnifica artefact.

  Per HM-2026-06-02 PM ("close-and-reopen option that kills the session/cookie").
  Threshold-language label ("Close this reading") matches the Umkehr-gesture
  register · invitation-not-push · per howto-password-entry §0.3.

  Triggers useMagnificaAuth().logout() which POSTs to /__auth/logout · the
  Nitro middleware deletes both cookies · client refreshes auth-state + reloads
  to /. The reader returns to the entry-hero · form re-appears · clean re-entry
  available.

  Gesture-mode (per HM-decision on dispatch #8 §3): no session-store means
  logout is just cookie-deletion · the close-and-reopen is structurally
  symmetric with the entry-gesture.
-->

<template>
  <button
    type="button"
    class="magnifica-logout"
    @click="onClick"
  >
    Close this reading
  </button>
</template>

<script setup lang="ts">
import { useMagnificaAuth } from '@/composables/useMagnificaAuth'

const { logout } = useMagnificaAuth()

function onClick() {
  void logout()
}
</script>

<style scoped>
.magnifica-logout {
  font: inherit;
  font-size: 0.875rem;
  background: transparent;
  border: 0;
  color: var(--color-primary-bg);
  cursor: pointer;
  padding: 0.25rem 0.75rem;
  text-decoration: underline;
  text-underline-offset: 4px;
  transition: filter 200ms ease;
}

.magnifica-logout:hover {
  filter: brightness(1.15);
}

.magnifica-logout:focus-visible {
  outline: 2px solid var(--color-primary-bg);
  outline-offset: 2px;
  border-radius: 2px;
}

@media (prefers-reduced-motion: reduce) {
  .magnifica-logout {
    transition: none;
  }
}
</style>
