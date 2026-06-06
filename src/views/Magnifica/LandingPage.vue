<!--
  LandingPage · Magnifica response-page root (/) · cand-1a per candidate-1a/landing-page.md.

  Pre-auth: EntryHero shows the 6-beat password-gate. Post-auth: gated content unfolds:
  hero overline-headline · ~210-word opener · 3 clickable route-cards · Hans-voice
  closing block (2 callouts) · engagement-shapes strip · close-and-reopen button.
  (The separate UnlockOverlay retired · the choreography now lives inside EntryHero.)

  Route-cards are RouterLinks styled as post-its (clickable navigation) — a CV rendering
  choice honoring landing-page.md's "post-it-styled, clickable" intent.
-->

<template>
  <div class="magnifica-landing">
    <EntryHero v-if="!isAuthenticated" />

    <main v-if="isAuthenticated" class="magnifica-landing-content">

      <!-- Hero · overline-headline -->
      <header class="landing-hero">
        <p class="landing-hero-overline">{{ hero.overline }}</p>
        <h1 class="landing-hero-headline">{{ hero.headline }}</h1>
      </header>

      <!-- Opener (~210 words) · Olah's quoted argument-types preserved as <em> -->
      <section class="landing-opener" v-html="openerHtml"></section>

      <!-- Three route-cards · post-it-styled, clickable navigation -->
      <nav class="route-cards" aria-label="Three routes">
        <RouterLink
          v-for="card in routeCards"
          :key="card.to"
          :to="card.to"
          class="route-card"
          :class="`route-card--${card.theme}`"
        >
          <span class="route-card-overline">{{ card.overline }}</span>
          <span class="route-card-headline">{{ card.headline }}</span>
          <span class="route-card-subline">{{ card.subline }}</span>
        </RouterLink>
      </nav>

      <!-- Closing block · Hans-voice -->
      <section class="landing-closing">
        <p>{{ closingP1 }}</p>
        <p>
          {{ closingP2Before }}<CalloutPhrase :callout="callouts.claudeIndividuums">Claude individuums</CalloutPhrase>{{ closingP2After }}
        </p>
        <p class="landing-leitmotif">
          <CalloutPhrase :callout="callouts.wegeEntstehen"><em>Wege entstehen beim Gehen.</em></CalloutPhrase>
        </p>
      </section>

      <!-- Engagement-shapes strip -->
      <aside class="engagement-strip">
        <p class="engagement-intro"><em>{{ engagementIntro }}</em></p>
        <p class="engagement-shapes">
          <template v-for="(shape, i) in engagementShapes" :key="i"><strong>{{ shape.label }}</strong> — {{ shape.body }}<span v-if="i < engagementShapes.length - 1" class="engagement-sep"> · </span></template>
        </p>
        <p class="engagement-outro"><em>{{ engagementOutro }}</em></p>
      </aside>

      <!-- Close-and-reopen action -->
      <p class="magnifica-landing-actions">
        <MagnificaLogoutButton />
      </p>
    </main>
  </div>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { useMagnificaAuth } from '@/composables/useMagnificaAuth'
import EntryHero from './EntryHero.vue'
import CalloutPhrase from './CalloutPhrase.vue'
import MagnificaLogoutButton from './MagnificaLogoutButton.vue'
import {
  hero,
  openerHtml,
  routeCards,
  closingP1,
  closingP2Before,
  closingP2After,
  engagementIntro,
  engagementShapes,
  engagementOutro,
  callouts,
} from './content/landing'

const { isAuthenticated } = useMagnificaAuth()
</script>

<style scoped>
.magnifica-landing {
  font-family: ui-monospace, "JetBrains Mono", "Cascadia Code", Menlo, Consolas, monospace;
}

.magnifica-landing-content {
  background: #1a1a1a;
  color: #f4f4f4;
  max-width: 56rem;
  margin: 0 auto;
  padding: clamp(3rem, 8vh, 6rem) clamp(1rem, 6vw, 3rem) 0;
}

/* ==Hero== */
.landing-hero {
  margin-bottom: clamp(2rem, 5vh, 3.5rem);
}

.landing-hero-overline {
  font-size: 0.875rem;
  color: #aaa;
  margin: 0 0 0.75rem;
  letter-spacing: 0.02em;
}

.landing-hero-headline {
  font-size: clamp(2rem, 6vw, 3.5rem);
  font-weight: 700;
  margin: 0;
  line-height: 1.1;
  letter-spacing: 0.01em;
  text-transform: uppercase;
  color: var(--color-primary-bg);
}

/* ==Opener== */
.landing-opener {
  margin-bottom: clamp(2.5rem, 6vh, 4rem);
}

.landing-opener :deep(p) {
  font-size: clamp(0.95rem, 1.6vw, 1.0625rem);
  line-height: 1.7;
  margin: 0 0 1rem;
  color: #e8e8e8;
}

.landing-opener :deep(p:last-child) {
  margin-bottom: 0;
}

.landing-opener :deep(em) {
  font-style: italic;
  color: #f4f4f4;
}

/* ==Route-cards== */
.route-cards {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: clamp(2.5rem, 6vh, 4rem);
}

.route-card {
  flex: 1 1 14rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1.5rem 1.25rem;
  border-radius: 6px;
  text-decoration: none;
  color: #1d1b1a;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
  transform: rotate(-1deg);
  transition: transform 200ms ease, box-shadow 200ms ease;
}

.route-card:nth-child(2) {
  transform: rotate(1.5deg);
}

.route-card:nth-child(3) {
  transform: rotate(-2deg);
}

.route-card:hover,
.route-card:focus-visible {
  transform: rotate(0deg) translateY(-3px);
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.4);
  outline: none;
}

.route-card:focus-visible {
  box-shadow: 0 0 0 3px var(--color-primary-bg), 0 10px 28px rgba(0, 0, 0, 0.4);
}

.route-card--yellow { background: var(--color-primary-bg); }
.route-card--green  { background: #84cc16; }
.route-card--pink   { background: #ff7598; }

.route-card-overline {
  font-size: 0.8125rem;
  opacity: 0.85;
}

.route-card-headline {
  font-size: 1.375rem;
  font-weight: 700;
  letter-spacing: 0.01em;
}

.route-card-subline {
  font-size: 0.875rem;
  line-height: 1.5;
}

/* ==Closing block== */
.landing-closing {
  margin-bottom: clamp(2rem, 5vh, 3rem);
}

.landing-closing p {
  font-size: clamp(0.9rem, 1.5vw, 1rem);
  line-height: 1.7;
  margin: 0 0 1rem;
  color: #d0d0d0;
}

.landing-leitmotif {
  font-size: clamp(1.0625rem, 2vw, 1.375rem) !important;
  font-weight: 700;
  color: var(--color-primary-bg) !important;
}

.landing-leitmotif :deep(em) {
  font-style: italic;
}

/* ==Engagement-shapes strip== */
.engagement-strip {
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding: 1.75rem 0;
  font-size: 0.875rem;
  line-height: 1.6;
  color: #aaa;
}

.engagement-intro,
.engagement-outro {
  margin: 0 0 0.75rem;
  font-style: italic;
}

.engagement-outro {
  margin: 0.75rem 0 0;
}

.engagement-shapes {
  margin: 0;
  color: #d0d0d0;
}

.engagement-shapes strong {
  color: var(--color-primary-bg);
  font-weight: 700;
}

.engagement-sep {
  color: #666;
}

/* ==Close-and-reopen actions== */
.magnifica-landing-actions {
  text-align: center;
  margin: 0;
  padding: 2rem 1rem 4rem;
}

@media (max-width: 640px) {
  .route-card {
    transform: none !important;
  }
}

@media (prefers-reduced-motion: reduce) {
  .route-card {
    transition: none;
    transform: none;
  }
}
</style>
