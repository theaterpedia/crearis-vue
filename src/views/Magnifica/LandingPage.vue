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

      <!-- §C · pope → Olah · the HELD CROSSFADE (Fassung · the lightest cDia seam · hand-composed
           here · propose `transition: 'crossfade'` to the keeper if it generalises). Two held Dias
           stacked at the same top (both sticky-to-stage · never move · "the image does not move");
           the top (pope) plate's opacity is scroll-driven 1→0 (animation-timeline: view() · OPACITY,
           never transform), dissolving to reveal the held Olah beneath — the light changes, the
           stage does not (no rise, no scroll-off). A thin horizontal hairline marks the seam.
           reduced-motion / no-view() → the held pope stays (never broken). Direct child of
           .magnifica-landing-content (ancestor-purity · sticky + view()).
           [Fassung suggested a <Shutter vSize=none hSize=thinline> for the line; the Shutter's opaque
           bg doesn't compose over the OVERLAPPING held plates without a transparent cDia mode (and
           this task is landing-only) — so the seam is a hairline here. Flagged for the generalise.] -->
      <section
        class="dia-crossfade"
        aria-label="Before magnifica, then after — a held crossfade of light"
      >
        <Dia
          class="cf-plate cf-plate--olah"
          :image="backslides[1].image"
          :image-alt="backslides[1].imageAlt"
          img-tmp-align-y="top"
          fit="contain"
        />
        <Dia
          class="cf-plate cf-plate--pope"
          :image="backslides[0].image"
          :image-alt="backslides[0].imageAlt"
          img-tmp-align-y="top"
          fit="contain"
        />
      </section>

      <div class="landing-narrow">
        <!-- 3 navcards · Cultural-Studies lanes (D) -->
        <nav class="route-cards" aria-label="Three routes">
          <RouterLink
            v-for="card in navCards"
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

        <!-- Page-bottom · Hans-voice closing · genealogy-nod → honest-flag (the page ends here) -->
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
import Dia from '@/components/cDia/Dia.vue'
import CalloutPhrase from './CalloutPhrase.vue'
import MagnificaFooter from './MagnificaFooter.vue'
import {
  hero,
  summary,
  letterEntries,
  backslides,
  navCards,
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
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
  transform: rotate(-1deg);
  transition: transform 200ms ease, box-shadow 200ms ease;
}

.route-card:nth-child(2) { transform: rotate(1.5deg); }
.route-card:nth-child(3) { transform: rotate(-2deg); }

.route-card:hover,
.route-card:focus-visible {
  transform: rotate(0deg) translateY(-3px);
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.4);
  outline: none;
}

.route-card:focus-visible {
  box-shadow: 0 0 0 3px var(--color-primary-bg), 0 10px 28px rgba(0, 0, 0, 0.4);
}

.route-card--yellow { background: var(--color-primary-bg);  color: var(--color-primary-contrast); }
.route-card--green  { background: var(--color-positive-bg); color: var(--color-positive-contrast); }
.route-card--pink   { background: var(--color-negative-bg); color: var(--color-negative-contrast); }

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

/* ==§C · the held crossfade== (Fassung · pope → Olah · the lightest cDia seam · hand-composed).
   Two held Dias stacked at the same top (both sticky-to-stage · never move); the top (pope) plate's
   OPACITY is scroll-driven 1→0, dissolving to reveal the held Olah beneath. The container provides
   the seam scroll-range + the view-timeline; ancestor-purity holds (no transform/overflow above).
   [dials · HP: the --cf-h height · the fade animation-range · the hairline placement · the fallback
   state.] cDia core untouched (landing-only · §Fassung). */
.dia-crossfade {
  position: relative;
  /* the held-plate height · a pure-CSS vh var here (no JS · this is a hand-composition, not DiaStage) */
  --cf-h: 82vh;
  --cf-top: var(--bb-navbar-offset, 6rem);
}

.cf-plate {
  position: sticky;
  top: var(--cf-top);
}

@media (min-width: 768px) {
  /* the seam scroll-range (how long the crossfade takes · dial) */
  .dia-crossfade {
    min-height: 200vh;
  }
  /* both plates the held-plate height; the pope overlaps Olah (same top · the held stack) */
  .cf-plate {
    height: var(--cf-h, 82vh);
  }
  .cf-plate--olah {
    z-index: 1;
  }
  .cf-plate--pope {
    z-index: 2;
    margin-top: calc(-1 * var(--cf-h, 82vh));
  }

  /* the thin horizontal seam-line · the dasei hairline, pinned at the crossfade centre (z above
     both plates · marks the gap · no blade, no motion) */
  .dia-crossfade::after {
    content: '';
    position: sticky;
    display: block;
    top: calc(var(--cf-top) + var(--cf-h, 82vh) / 2);
    z-index: 3;
    width: 60%;
    height: 1px;
    margin: calc(-1 * var(--cf-h, 82vh) / 2) auto 0;
    background: var(--color-primary-bg);
  }

  /* the crossfade · scroll-driven OPACITY (view() · never transform · zero-JS-in-loop). The pope
     dissolves across the middle of the seam, revealing the held Olah. */
  @supports (animation-timeline: view()) {
    .dia-crossfade {
      view-timeline-name: --cf;
      view-timeline-axis: block;
    }
    .cf-plate--pope {
      animation: cf-fade-out linear both;
      animation-timeline: --cf;
      animation-range: cover 30% cover 70%;
    }
    @keyframes cf-fade-out {
      from { opacity: 1; }
      to { opacity: 0; }
    }
  }
}

/* reduced-motion / no-view() · the held pope stays (the "before" · valid image · never broken).
   The crossfade IS the feature here, so it runs by default (NOT the family reduced-motion-static);
   only the OS prefers-reduced-motion drops it to the held still. */
@media (prefers-reduced-motion: reduce) {
  .cf-plate--pope {
    animation: none !important;
    opacity: 1;
  }
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
