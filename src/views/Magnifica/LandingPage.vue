<!--
  LandingPage · Magnifica response-page root (/) · Entry/Landing redesign (HM 2026-06-07).

  Pre-auth: EntryHero · 2-beat gate (header + password). Post-auth: the 2022 hero shape —
  big header (+nav) · left-column headline (placeholder · "Websites … gesucht" slot) · and
  on the right the PROMPTBOX (codebox letter, word-by-word) where 2022 had the youtube-player.
  The promptbox REPLACES the post-it blackboard (the blackboard moved to /ethnography).
  Below: 2 backslides · 3 navcards · Hans-voice page-bottom.
-->

<template>
  <div class="magnifica-landing">
    <EntryHero v-if="!isAuthenticated" />

    <div v-if="isAuthenticated" class="magnifica-landing-content">
      <div class="landing-container">
        <MagnificaHeader show-nav />

        <!-- 2022 hero shape · left headline + right promptbox -->
        <section class="landing-hero">
          <div class="landing-hero-left">
            <p class="landing-hero-overline">{{ hero.overline }}</p>
            <h1 class="landing-hero-headline">{{ hero.headline }}</h1>
            <div class="landing-summary">
              <p class="landing-summary-overline">{{ summary.overline }}</p>
              <h2 class="landing-summary-headline">{{ summary.headline }}</h2>
              <p class="landing-summary-body">{{ summary.body }}</p>
            </div>
          </div>
          <div class="landing-hero-right">
            <MagnificaChatbox :entries="letterEntries" :instant-portion="0.5" :height-vh="65" />
          </div>
        </section>
      </div>

      <!-- §C · the QUADRANT (cQuadrant · the held 2×2 · 2026-06_quadrant.md · HP-spec 2026-06-16) —
           replaces the BackSlideStack + navcards body. q1 = pope-and-olah (nothing appears); q2/q3/q4
           carry the magnifica question + the two follow-ons, each with a route post-it (faked card now
           · real fpostit fast-follow · A2). A 50vH cross-hair seam sweeps over the held grid, revealing
           the bottom row (q3+q4) then the top row (q1+q2). Direct child of .magnifica-landing-content
           — ancestor-purity for the sticky hold (the §14 audit: this shell is clean). -->
      <QuadrantStage :quadrants="quadrants" bounded :top-offset="96" seam-line-color="primary">
        <!-- q2 · discourse · q3 · context · q4 · ethnography (faked route post-its · in-place · A3) -->
        <template #q-2>
          <RouterLink class="q-postit" :class="`q-postit--${quadrantCards[0].theme}`" :to="quadrantCards[0].to">
            <span class="q-postit-overline">{{ quadrantCards[0].overline }}</span>
            <span class="q-postit-headline">{{ quadrantCards[0].headline }}</span>
            <span class="q-postit-subline">{{ quadrantCards[0].subline }}</span>
          </RouterLink>
        </template>
        <template #q-3>
          <RouterLink class="q-postit" :class="`q-postit--${quadrantCards[1].theme}`" :to="quadrantCards[1].to">
            <span class="q-postit-overline">{{ quadrantCards[1].overline }}</span>
            <span class="q-postit-headline">{{ quadrantCards[1].headline }}</span>
            <span class="q-postit-subline">{{ quadrantCards[1].subline }}</span>
          </RouterLink>
        </template>
        <template #q-4>
          <RouterLink class="q-postit" :class="`q-postit--${quadrantCards[2].theme}`" :to="quadrantCards[2].to">
            <span class="q-postit-overline">{{ quadrantCards[2].overline }}</span>
            <span class="q-postit-headline">{{ quadrantCards[2].headline }}</span>
            <span class="q-postit-subline">{{ quadrantCards[2].subline }}</span>
          </RouterLink>
        </template>
      </QuadrantStage>

      <!-- the WIPING BOARD · the honest-flag below the quadrant, on an opaque board that rises OVER
           the held grid as the stage releases (the wipe · HP-spec · Theatervorhang · z above the seam). -->
      <section class="landing-board">
        <div class="landing-narrow">
          <section class="landing-closing">
            <p>
              {{ closingP3Before }}<CalloutPhrase :callout="callouts.claudeIndividuums">Claude individuums</CalloutPhrase>{{ closingP3After }}
            </p>
            <div class="landing-honest-flag">
              <p class="landing-honest-flag-overline">{{ honestFlag.overline }}</p>
              <p v-for="(para, i) in honestFlag.paras" :key="i">{{ para }}</p>
            </div>
          </section>
        </div>
      </section>

      <!-- shared footer (Impressum · dasei.eu · … · close-gesture) — identical on all 4 pages -->
      <MagnificaFooter />
    </div>
  </div>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { useMagnificaAuth } from '@/composables/useMagnificaAuth'
import EntryHero from './EntryHero.vue'
import MagnificaHeader from './MagnificaHeader.vue'
import MagnificaChatbox from './MagnificaChatbox.vue'
import QuadrantStage from '@/components/cQuadrant/QuadrantStage.vue'
import CalloutPhrase from './CalloutPhrase.vue'
import MagnificaFooter from './MagnificaFooter.vue'
import {
  hero,
  summary,
  letterEntries,
  quadrants,
  quadrantCards,
  closingP3Before,
  closingP3After,
  honestFlag,
  callouts,
} from './content/landing'

const { isAuthenticated } = useMagnificaAuth()
</script>

<style scoped>
.magnifica-landing {
  font-family: var(--font, ui-monospace);
  /* Chrome scroll-anchoring nudges scrollY when the sticky header collapses (State A→B),
     which re-crosses the threshold and flickers heavily. Opt the landing content out of
     anchoring (Firefox was already fine); paired with the header's hysteresis dead-band. */
  overflow-anchor: none;
}

.magnifica-landing-content {
  background: var(--color-bg);
  color: var(--color-contrast);
}

.landing-container {
  max-width: 90rem;
  margin: 0 auto;
  /* top breathing-room at the page-top (most needed on big-desktop · 1920×1080) */
  padding: clamp(1rem, 4vh, 3rem) clamp(1rem, 6vw, 3rem) clamp(2rem, 5vh, 4rem);
}

/* 2022 hero · left text · right promptbox */
.landing-hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.25fr);
  gap: clamp(2rem, 5vw, 4rem);
  align-items: start;
  padding-top: clamp(1rem, 4vh, 3rem);
}

.landing-hero-overline {
  font-size: 0.875rem;
  color: var(--color-muted-contrast);
  margin: 0 0 0.75rem;
  letter-spacing: 0.02em;
}

.landing-hero-headline {
  font-size: clamp(1.75rem, 4vw, 3rem);
  font-weight: 700;
  margin: 0;
  line-height: 1.15;
  color: var(--color-primary-bg);
}

@media (max-width: 860px) {
  .landing-hero {
    grid-template-columns: 1fr;
  }
}

/* ==§B summary== · reading-instrument framing, under the hero headline (left column) */
.landing-summary {
  margin-top: clamp(1.5rem, 4vh, 2.5rem);
}

.landing-summary-overline {
  font-size: 0.875rem;
  color: var(--color-muted-contrast);
  margin: 0 0 0.25rem;
  letter-spacing: 0.02em;
}

.landing-summary-headline {
  font-size: clamp(1.1rem, 2vw, 1.375rem);
  font-weight: 700;
  margin: 0 0 0.75rem;
  line-height: 1.25;
}

.landing-summary-body {
  font-size: 0.9375rem;
  line-height: 1.6;
  color: var(--color-contrast);
  margin: 0;
}

/* ==Centered column for navcards + closing== */
.landing-narrow {
  max-width: 56rem;
  margin: 0 auto;
  padding: clamp(2.5rem, 6vh, 4rem) clamp(1rem, 6vw, 3rem) 0;
}

/* ==The faked route post-its== · the in-place sub-element on q2/q3/q4 (discourse/context/ethnography).
   Square post-it look (the fpostit grammar) · contrast-tinted so it reads over the cell's theme-colour.
   🚩 fast-follow (A2): swap for a real fpostit (FloatingPostIt-rendered in-place). */
.q-postit {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  max-width: 22rem;
  padding: 1.1rem 1.25rem;
  text-decoration: none;
  border-radius: 0; /* square · standards-floor */
  box-shadow: 0 4px 16px oklch(0 0 0 / 0.3);
  transform: rotate(-1.5deg);
  transition: transform 200ms ease, box-shadow 200ms ease;
}
.q-postit:hover,
.q-postit:focus-visible {
  transform: rotate(0deg) translateY(-3px);
  box-shadow: 0 10px 28px oklch(0 0 0 / 0.4);
  outline: none;
}
.q-postit:focus-visible {
  box-shadow: 0 0 0 3px var(--color-primary-bg), 0 10px 28px oklch(0 0 0 / 0.4);
}
/* the post-it sits ON the cell · use the page bg as the note-surface so it lifts off every theme */
.q-postit--yellow,
.q-postit--green,
.q-postit--pink {
  background: var(--color-bg);
  color: var(--color-contrast);
}

.q-postit-overline {
  font-size: 0.8125rem;
  opacity: 0.85;
}
.q-postit-headline {
  font-size: 1.25rem;
  font-weight: 700;
  letter-spacing: 0.01em;
}
.q-postit-subline {
  font-size: 0.8125rem;
  line-height: 1.5;
  opacity: 0.9;
}

/* ==The wiping board== · the honest-flag's opaque board · rises OVER the released held quadrant as
   the stage ends (the wipe · HP-spec). z above the stage's seam (z:2) + grid (z:1). */
.landing-board {
  position: relative;
  z-index: 3;
  background: var(--color-bg);
}

/* ==Closing block== */
.landing-closing {
  margin-bottom: clamp(2rem, 5vh, 3rem);
}

.landing-closing p {
  font-size: clamp(0.9rem, 1.5vw, 1rem);
  line-height: 1.7;
  margin: 0 0 1rem;
  color: var(--color-muted-contrast);
}

/* the honest-flag · the page's last word · lifts off the muted closing with a primary
   overline and full-contrast body (HM-authored · bookends the opening letter). */
.landing-honest-flag {
  margin-top: clamp(1.5rem, 4vh, 2.5rem);
  padding-top: clamp(1.25rem, 3vh, 2rem);
  border-top: 1px solid var(--color-border);
}

.landing-honest-flag-overline {
  font-size: 0.875rem !important;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: var(--color-primary-bg) !important;
  margin: 0 0 0.75rem !important;
}

.landing-honest-flag p:not(.landing-honest-flag-overline) {
  color: var(--color-contrast);
}

@media (max-width: 640px) {
  .q-postit {
    transform: none !important;
  }
}

@media (prefers-reduced-motion: reduce) {
  .q-postit {
    transition: none;
    transform: none;
  }
}
</style>
