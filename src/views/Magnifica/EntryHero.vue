<!--
  EntryHero · password-entry page-hero for the Magnifica response-page.

  Per crearis:projects/magnifica/docs/howto-password-entry.md §1-§3 (Nuxt-framed
  howto · adapted to crearis-vue's pure Vue 3 SPA shape). Design synthesis per
  howto §1.3 = Option-B's centered glass-panel pattern + Option-A's bottom umkehr-
  strip caption (the gesture-explainer).

  CCCS-organic-intellectual register (howto §0.2) at every micro-decision:
    - Threshold-language only ("Enter" · not "Login" / "Unlock")
    - No urgency · no friction-language
    - One URL, one place · the hero stays even post-auth (the form-region
      collapses when isAuthenticated · see LandingPage.vue)

  Background-image is a CSS-custom-property with a neutral gradient default ·
  HM configures the real image at the consumer-template level once real content
  lands (gesture-naming-hold pattern · per memory project_magnifica_gesture_mode_naming_hold).
-->

<template>
  <div class="entry-hero">
    <div
      class="entry-hero-image"
      role="img"
      aria-label="Magnifica response · password-protected entry"
    ></div>

    <header class="entry-hero-header">
      <a class="entry-hero-wordmark" href="/">
        Theater<span class="entry-hero-wordmark-accent">pedia</span>
      </a>
    </header>

    <form
      v-if="showForm"
      class="entry-hero-card"
      method="POST"
      action="/__auth"
      novalidate
    >
      <p class="entry-card-overline">Response to Chris Olah · Vatican · 24 May 2026</p>
      <h1 class="entry-card-headline">Magnifica humanitas, in lived practice</h1>
      <p class="entry-card-subline">Hans Dönitz · Theaterpädagoge · Fürth, Bayern</p>

      <label class="entry-card-label" for="magnifica-password">Password</label>
      <input
        id="magnifica-password"
        name="password"
        type="password"
        autocomplete="current-password"
        required
        autofocus
        class="entry-card-input"
      />
      <button type="submit" class="entry-card-submit">Enter</button>

      <p
        v-if="error"
        class="entry-card-error"
        role="alert"
      >{{ error }}</p>
    </form>

    <div v-if="showForm" class="entry-hero-strip">
      <p>You were invited. The password came with the email. The threshold is here — invitation, not push.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const props = defineProps<{
  /** Hide the password-form + umkehr-strip when already authenticated · the hero stays as page-identity. */
  showForm?: boolean
}>()

const showForm = computed(() => props.showForm !== false)

const route = useRoute()

const error = computed<string | null>(() => {
  const err = route.query.error
  if (err === 'invalid') return 'Wrong password.'
  return null
})
</script>

<style scoped>
.entry-hero {
  --entry-bg:           #1a1a1a;
  --entry-fg:           #f4f4f4;
  --entry-accent:       #ffee00;
  --entry-card-bg:      rgba(255, 255, 255, 0.92);
  --entry-card-fg:      #1a1a1a;
  --entry-card-muted:   #555;
  --entry-strip-bg:     #ffee00;
  --entry-strip-fg:     #1a1a1a;
  --entry-mono:         ui-monospace, "JetBrains Mono", "Cascadia Code", Menlo, Consolas, monospace;

  position: relative;
  min-height: 100vh;
  display: grid;
  grid-template-rows: auto 1fr auto;
  background: var(--entry-bg);
  color: var(--entry-fg);
  font-family: var(--entry-mono);
}

.entry-hero-image {
  position: absolute;
  inset: 0;
  background: var(--entry-bg-image, linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 50%, #1a1a1a 100%));
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  z-index: 0;
}

.entry-hero-image::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg,
    rgba(26, 26, 26, 0.40) 0%,
    rgba(26, 26, 26, 0.20) 30%,
    rgba(26, 26, 26, 0.20) 70%,
    rgba(26, 26, 26, 0.55) 100%);
}

.entry-hero-header,
.entry-hero-card,
.entry-hero-strip {
  position: relative;
  z-index: 1;
}

.entry-hero-header {
  padding: 1.5rem clamp(1rem, 4vw, 2rem);
}

.entry-hero-wordmark {
  font-size: clamp(1.5rem, 3vw, 2.25rem);
  font-weight: 700;
  text-decoration: none;
  color: var(--entry-fg);
  letter-spacing: -0.01em;
}

.entry-hero-wordmark-accent {
  color: var(--entry-accent);
}

.entry-hero-card {
  align-self: center;
  justify-self: center;
  width: min(32rem, calc(100% - 2rem));
  padding: 2rem clamp(1.5rem, 4vw, 2.5rem);
  margin: clamp(1rem, 6vh, 4rem) 1rem;
  background: var(--entry-card-bg);
  color: var(--entry-card-fg);
  border-radius: 4px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  font-family: var(--entry-mono);
}

.entry-card-overline {
  font-size: 0.875rem;
  color: var(--entry-card-muted);
  margin: 0;
  letter-spacing: 0.02em;
}

.entry-card-headline {
  font-size: clamp(1.25rem, 3vw, 1.75rem);
  font-weight: 700;
  margin: 0;
  line-height: 1.25;
}

.entry-card-subline {
  font-size: 0.875rem;
  color: var(--entry-card-muted);
  margin: 0 0 1rem;
}

.entry-card-label {
  font-size: 0.875rem;
  color: var(--entry-card-muted);
  margin-top: 0.5rem;
}

.entry-card-input {
  font: inherit;
  font-size: 1rem;
  padding: 0.6rem 0.8rem;
  border: 1px solid var(--entry-card-muted);
  border-radius: 4px;
  background: white;
  color: var(--entry-card-fg);
  outline: none;
  transition: border-color 200ms ease;
}

.entry-card-input:focus {
  border-color: var(--entry-card-fg);
}

.entry-card-submit {
  align-self: flex-start;
  font: inherit;
  font-weight: 700;
  font-size: 0.95rem;
  padding: 0.7rem 1.5rem;
  margin-top: 0.5rem;
  background: var(--entry-card-fg);
  color: white;
  border: 0;
  border-radius: 4px;
  cursor: pointer;
  transition: filter 200ms ease;
}

.entry-card-submit:hover {
  filter: brightness(1.15);
}

.entry-card-submit:focus-visible {
  outline: 2px solid var(--entry-accent);
  outline-offset: 3px;
}

.entry-card-error {
  margin: 0.5rem 0 0;
  color: #c91100;
  font-size: 0.875rem;
}

.entry-hero-strip {
  background: var(--entry-strip-bg);
  color: var(--entry-strip-fg);
  padding: 1rem clamp(1.5rem, 4vw, 2.5rem);
  text-align: center;
}

.entry-hero-strip p {
  margin: 0;
  font-size: clamp(0.875rem, 1.5vw, 1rem);
  line-height: 1.5;
  font-weight: 500;
}

@media (max-width: 640px) {
  .entry-hero-card {
    margin: 1rem;
    padding: 1.5rem 1.25rem;
  }

  .entry-hero-strip {
    padding: 0.75rem 1rem;
  }

  .entry-hero-strip p {
    font-size: 0.875rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .entry-card-input,
  .entry-card-submit {
    transition: none;
  }
}
</style>
