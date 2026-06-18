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
      <!-- topbar · DIRECT child of the page root so position:sticky pins WHOLE-PAGE (over the
           quadrant + the close), not just within .landing-container (issue 2a · SATZ 2026-06-18).
           90rem inset comes from magnifica-page.css. show-nav (no `compact`) keeps the big
           State-A→B collapse the landing wants. -->
      <MagnificaHeader show-nav />

      <div class="landing-container">
        <!-- 2022 hero shape · left headline + right promptbox -->
        <section class="landing-hero">
          <div class="landing-hero-left">
            <p class="landing-hero-overline">{{ hero.overline }}</p>
            <h2 class="landing-hero-headline">{{ hero.headline }}</h2>
            <p class="landing-hero-teaser">{{ hero.teaser }}</p>
          </div>
          <div class="landing-hero-right">
            <MagnificaChatbox :entries="letterEntries" :instant-portion="0.5" :height-vh="65" play-once
              once-key="landing-letter" />
          </div>
        </section>
      </div>

      <!-- §C · the QUADRANT (cQuadrant · the held 2×2 · 2026-06_quadrant.md · HP-spec 2026-06-16) —
           replaces the BackSlideStack + navcards body. q1 = pope-and-olah (nothing appears); q2/q3/q4
           carry the magnifica question + the two follow-ons, each with a route post-it (faked card now
           · real fpostit fast-follow · A2). A 50vH cross-hair seam sweeps over the held grid, revealing
           the bottom row (q3+q4) then the top row (q1+q2). Direct child of .magnifica-landing-content
           — ancestor-purity for the sticky hold (the §14 audit: this shell is clean). -->
      <QuadrantStage
        :quadrants="quadrants"
        bounded
        :top-offset="96"
        :text-inverted="false"
        seam-line-color="primary"
        seam-v-size="small"
        seam-preset="split"
        :seam-text="quadrantSeamText"
      >
        <!-- q2 · discourse · q3 · context · q4 · ethnography · REAL fpostit notes (A2), rendered
             in-place via FloatingPostIt static-board mode (in-flow · non-dismissable · reveal-gated
             by the cell's .quadrant-sub). The action navigates the route (SPA · router.push). -->
        <template #q-2>
          <div class="q-note"><FloatingPostIt :data="quadrantNotes[0]" :is-open="true" /></div>
        </template>
        <template #q-3>
          <div class="q-note"><FloatingPostIt :data="quadrantNotes[1]" :is-open="true" /></div>
        </template>
        <template #q-4>
          <div class="q-note"><FloatingPostIt :data="quadrantNotes[2]" :is-open="true" /></div>
        </template>
      </QuadrantStage>

      <!-- the WIPING BOARD · the honest-flag below the quadrant, on an opaque board that rises OVER
           the held grid as the stage releases (the wipe · HP-spec · Theatervorhang · z above the seam). -->
      <section class="landing-board">
        <div class="landing-narrow">
          <section class="landing-closing">
            <p>
              {{ closingP3Before }}<CalloutPhrase :callout="callouts.claudeIndividuums">Claude individuums
              </CalloutPhrase>{{
                closingP3After }}
            </p>
            <div class="landing-honest-flag">
              <p class="landing-honest-flag-overline">{{ honestFlag.overline }}</p>
              <p v-for="(para, i) in honestFlag.paras" :key="i">{{ para }} <br /><br /></p>
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
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useMagnificaAuth } from '@/composables/useMagnificaAuth'
import EntryHero from './EntryHero.vue'
import MagnificaHeader from './MagnificaHeader.vue'
import MagnificaChatbox from './MagnificaChatbox.vue'
import QuadrantStage from '@/components/cQuadrant/QuadrantStage.vue'
import FloatingPostIt from '@/fpostit/components/FloatingPostIt.vue'
import type { FpostitData, PostitRotation, PostitColor } from '@/fpostit/types'
import CalloutPhrase from './CalloutPhrase.vue'
import MagnificaFooter from './MagnificaFooter.vue'
import {
  hero,
  letterEntries,
  quadrants,
  quadrantCards,
  quadrantSeamText,
  closingP3Before,
  closingP3After,
  honestFlag,
  callouts,
} from './content/landing'

const { isAuthenticated } = useMagnificaAuth()
const router = useRouter()

// The q2/q3/q4 route post-its as REAL fpostit notes (A2 · in-place via FloatingPostIt static-board).
// Content from quadrantCards (single-source); the action navigates via SPA router-push (the handler
// path · not an href reload). Colours set explicitly from theme (HP 2026-06-17 · feature 4):
// q2 → negative · q3 → muted · q4 → positive (quadrantCards order = discourse · context · ethnography).
const NOTE_COLORS: PostitColor[] = ['negative', 'muted', 'positive']
const NOTE_ROTATIONS: PostitRotation[] = ['-rotate-2', 'rotate-1', '-rotate-1']
const quadrantNotes = computed<FpostitData[]>(() =>
  quadrantCards.map((c, i) => ({
    key: `q-note-${i + 2}`,
    title: c.headline,
    content: `<p>${c.subline}</p>`,
    color: NOTE_COLORS[i],
    rotation: NOTE_ROTATIONS[i],
    hlogic: 'static-board',
    actions: [{ label: `enter ${c.headline.toLowerCase()} →`, handler: () => { router.push(c.to) } }],
  })),
)
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

/* topbar inset · the header is a direct child here (hoisted · issue 2a) so it pins whole-page;
   mirror the .magnifica-page > header inset from magnifica-page.css (that sheet only loads via
   MagnificaPageLayout, not on the landing). Vue applies this page's scope to the child root. */
.magnifica-landing-content>header.mag-header {
  max-width: 90rem;
  margin-left: auto;
  margin-right: auto;
  padding-left: clamp(1rem, 6vw, 3rem);
  padding-right: clamp(1rem, 6vw, 3rem);
}

.landing-container {
  max-width: 90rem;
  margin: 0 auto;
  /* top breathing-room at the page-top (most needed on big-desktop · 1920×1080) */
  padding: clamp(1rem, 4vh, 3rem) clamp(1rem, 6vw, 3rem) clamp(2rem, 5vh, 4rem);
}

/* 2022 hero · left text · right promptbox. Equal halves so the chatbox occupies the
   RIGHT half of the content column — aligning to the quadrant's right column below it
   (the quadrant is two equal halves bounded to this same column · issue B · HM 2026-06-18).
   Was 1fr/1.25fr → the chatbox ran left across the middle. */
.landing-hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: clamp(0.5rem, 5vw, 2rem);
  align-items: start;
  padding-top: clamp(1rem, 4vh, 2rem);
}

.landing-hero-overline {
  font-size: 0.875rem;
  color: var(--color-muted-contrast);
  margin: 0 0 0.5rem;
  letter-spacing: 0.02em;
}

.landing-hero-headline {
  font-size: clamp(1.25rem, 3vw, 2rem);
  font-weight: 700;
  margin: 0 0 1.5rem;
  line-height: 1.15;
  color: var(--color-primary-bg);
}

.landing-hero-teaser {
  /* same line-height as the honest-flag / closing paragraph (HM 2026-06-18) */
  line-height: 1.7;
}

@media (max-width: 860px) {
  .landing-hero {
    grid-template-columns: 1fr;
  }
}

/* desktop only · drop the left column down (HM 2026-06-18) */
@media (min-width: 861px) {
  .landing-hero-left {
    margin-top: 4rem;
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

/* ==The route post-its (A2 · REAL fpostit)== · q2/q3/q4 render a FloatingPostIt in static-board mode
   in-place. static-board ships `position:absolute; top/left` inline (for pinned boards with authored
   coords); the cell is a flex layout, not a coord-board, so we re-flow it to STATIC (the cell owns the
   placement · `!important` beats the component's inline style) and keep it square (standards-floor).
   The note is reveal-gated by the cell's .quadrant-sub (it sits inside that slot). */
.q-note {
  display: flex;
  justify-content: flex-start;
  width: 100%; /* fill the cell's size-tiered .quadrant-sub (postit-size · the tier caps the width) */
}
.q-note :deep(.floating-postit) {
  position: static !important;
  top: auto !important;
  left: auto !important;
  --fpostit-radius: 0; /* square · standards-floor */
  width: 100% !important; /* fill the size-tier wrapper (postit-size controls the width) */
  max-width: 100% !important;
  box-shadow: 0 4px 16px oklch(0 0 0 / 0.3);
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

</style>
