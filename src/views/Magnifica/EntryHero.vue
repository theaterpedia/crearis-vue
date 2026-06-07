<!--
  EntryHero · Magnifica password-gate · 2-beat (HM 2026-06-07, reduced from the 6-beat).
  Black screen · big header (no nav) · password + greyed Enter in the left-column slot
  (where the post-auth headline lands). On the CCCS match: beat-1 the subtle "© images"
  disclaimer appears, beat-2 the Enter button enables. No CCC/CCCS/Hans typewriter — that
  content moved to the post-auth promptbox (MagnificaPromptbox). Submit POSTs to /__auth.
-->

<template>
  <div class="entry">
    <div class="entry-container">
      <MagnificaHeader />

      <div class="entry-body">
        <form class="entry-form" method="POST" action="/__auth" novalidate @submit="onSubmit">
          <label class="entry-label" for="magnifica-password">Password</label>
          <div class="entry-row">
            <input
              id="magnifica-password"
              v-model="password"
              name="password"
              type="password"
              autocomplete="current-password"
              required
              autofocus
              class="entry-input"
            />
            <button
              type="submit"
              class="entry-submit"
              :class="{ 'entry-submit--ready': ready }"
              :disabled="!ready"
            >Enter</button>
          </div>

          <p v-if="ready" class="entry-disclaimer">
            © all images M. Farkas 2022–2026 · they show H. Dönitz and the team of dasei; used only to present this website.
          </p>
          <p v-if="error" class="entry-error" role="alert">{{ error }}</p>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import MagnificaHeader from './MagnificaHeader.vue'

const route = useRoute()
const password = ref('')
// 2-beat: the CCCS match reveals the disclaimer (beat 1) and enables Enter (beat 2).
const ready = ref(false)

watch(password, (val) => {
  if (val === 'CCCS') ready.value = true
})

const error = computed<string | null>(() => (route.query.error === 'invalid' ? 'Wrong password.' : null))

function onSubmit(e: Event) {
  if (password.value !== 'CCCS') e.preventDefault()
}
</script>

<style scoped>
.entry {
  min-height: 100vh;
  background: var(--color-bg);
  color: var(--color-contrast);
  font-family: var(--font, ui-monospace);
}

.entry-container {
  max-width: 90rem;
  margin: 0 auto;
  padding: 0 clamp(1rem, 6vw, 3rem);
}

/* the left-column slot · sits where the post-auth headline lands */
.entry-body {
  max-width: 36rem;
  margin-top: clamp(2rem, 8vh, 6rem);
}

.entry-form {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.entry-label {
  font-size: 0.875rem;
  color: var(--color-muted-contrast);
}

.entry-row {
  display: flex;
  gap: 0.75rem;
  align-items: stretch;
}

.entry-input {
  flex: 1;
  font: inherit;
  font-size: 1rem;
  padding: 0.6rem 0.8rem;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  background: var(--color-input);
  color: var(--color-contrast);
  outline: none;
}

/* greyed → primary when the gate is ready */
.entry-submit {
  font: inherit;
  font-weight: 700;
  padding: 0.7rem 1.5rem;
  border: 0;
  border-radius: 4px;
  background: var(--color-muted-bg);
  color: var(--color-muted-contrast);
  cursor: not-allowed;
  transition: background 300ms ease, color 300ms ease;
}

.entry-submit--ready {
  background: var(--color-primary-bg);
  color: var(--color-primary-contrast);
  cursor: pointer;
}

/* subtle copyright · light-grey · below the field + button */
.entry-disclaimer {
  margin: 0.75rem 0 0;
  font-size: 0.75rem;
  line-height: 1.5;
  color: var(--color-muted-contrast);
  opacity: 0.7;
}

.entry-error {
  margin: 0.25rem 0 0;
  color: var(--color-negative-bg);
  font-size: 0.875rem;
}

@media (prefers-reduced-motion: reduce) {
  .entry-submit {
    transition: none;
  }
}
</style>
