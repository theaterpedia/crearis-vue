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

      <!-- §C · pope → Olah · the CandA SHUTTER (HM 2026-06-16 · the 2022 held-image pattern). Two
           HELD Bilder (sticky-to-stage · the IMAGES DON'T MOVE · 1:1 `contain` · 50/50 image|panel ·
           pope img-left/panel-right, olah panel-left/img-right · the mirror), sequential; between
           them a ~200px SHUTTER that rises over the pope-Bild and LIFTS off (animation-timeline:
           view()), so the olah-Bild comes to view. Two simplified headlines sit above + below the
           shutter's hairline (HM Q2 · craft first, tweak later). reduced-motion / no-view() → the
           shutter scrolls away (never broken). Direct child of .magnifica-landing-content
           (ancestor-purity · sticky + view()).
           [first craft · :3001 dials — --ss-h plate height · the 200px shutter height + lift-range ·
           the headline text. FLAG (cDia generalise): the held-50/50-Bild-row + the shutter's
           above/below-the-line layout aren't cDia presets yet — hand-built here (like §52's
           transparent-line); candidates to graduate to the family.] -->
      <section class="shutter-stack">
        <!-- Bild 1 · pope · image LEFT (1:1) + panel RIGHT · held -->
        <div class="ss-bild ss-bild--pope">
          <div
            class="ss-img"
            role="img"
            :aria-label="backslides[0].imageAlt"
            :style="{ backgroundImage: `url('${backslides[0].image}')` }"
          />
          <div class="ss-panel">
            <p class="ss-overline">before magnifica</p>
          </div>
        </div>

        <!-- the ~200px shutter · 2 headlines above + below the hairline · lifts over pope → olah -->
        <div class="ss-shutter">
          <HeadingParser :content="shutterSeam.before" as="h2" class="ss-head" />
          <span class="ss-line" aria-hidden="true" />
          <HeadingParser :content="shutterSeam.after" as="h2" class="ss-head" />
        </div>

        <!-- Bild 2 · olah · panel LEFT + image RIGHT (1:1) · held -->
        <div class="ss-bild ss-bild--olah">
          <div class="ss-panel">
            <p class="ss-overline">after magnifica</p>
          </div>
          <div
            class="ss-img"
            role="img"
            :aria-label="backslides[1].imageAlt"
            :style="{ backgroundImage: `url('${backslides[1].image}')` }"
          />
        </div>
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
import HeadingParser from '@/components/HeadingParser.vue'
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

/** §C · the CandA shutter's two simplified seam-headlines (above + below the line · HM Q2 · a FIRST
 *  CRAFT — the text gets tweaked after the structure reads). crearis-md "overline **HEADLINE**". */
const shutterSeam = {
  before: 'my findings as a user **IS COMPACTION A KIND OF DEATH?**',
  after: 'the practitioner I’d be **CULTURE IS ORDINARY**',
}
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

/* ==§C · the CandA shutter-stack== (HM 2026-06-16). Two HELD Bilder (sticky-to-stage · the images
   don't move) + a ~200px shutter that lifts over the pope-Bild, revealing the held olah-Bild. The
   container is the sticky stage; ancestor-purity holds (no transform/overflow above). [first craft ·
   :3001 dials.] */
.shutter-stack {
  position: relative;
  --ss-h: 82vh; /* the held-Bild height (pure-CSS vh · this is a hand-composition, not DiaStage) */
  --ss-top: var(--bb-navbar-offset, 6rem);
}

.ss-overline {
  font-size: 0.8125rem;
  letter-spacing: 0.04em;
  color: var(--color-muted-contrast);
  margin: 0;
}
.ss-head {
  margin: 0;
}
.ss-line {
  display: block;
  width: 60%;
  max-width: 32rem;
  height: 1px;
  margin: 0.9rem auto;
  background: var(--color-primary-bg);
}

/* mobile (<768) · linearise: the Bilder + shutter are normal-flow blocks (the held/lift choreography
   is desktop-scoped for now · the mobile round per §43 carries it over with placement-only changes). */
.ss-img {
  width: 100%;
  min-height: 14rem;
  background-size: contain;
  background-position: center top;
  background-repeat: no-repeat;
  background-color: var(--color-bg);
}
.ss-panel {
  padding: 1.25rem 0;
}
.ss-shutter {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  background: var(--color-bg);
  padding: 1.5rem clamp(1.25rem, 4vw, 3rem);
}

@media (min-width: 768px) {
  /* the held Bild · a 50/50 image|panel row, sticky-to-stage (held · the image doesn't move) */
  .ss-bild {
    position: sticky;
    top: var(--ss-top);
    height: var(--ss-h, 82vh);
    display: flex;
    align-items: stretch;
    background: var(--color-bg);
  }
  .ss-bild--pope { z-index: 1; }
  .ss-bild--olah { z-index: 2; }
  .ss-img {
    width: 50%;
    min-height: 0;
    height: 100%;
  }
  .ss-panel {
    width: 50%;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    padding: 2rem clamp(1.5rem, 3vw, 2.5rem) 3rem;
  }

  /* the ~200px shutter · sticky · the highest z · rises to cover the pope-Bild, then LIFTS off
     (view()) so the held olah-Bild comes to view. Overlaps olah (margin) so it pins behind. */
  .ss-shutter {
    position: sticky;
    top: var(--ss-top);
    height: 200px;
    min-height: 200px;
    z-index: 3;
    margin-bottom: calc(-1 * var(--ss-h, 82vh));
  }
  @supports (animation-timeline: view()) {
    .ss-shutter {
      animation: ss-lift linear both;
      animation-timeline: view(block);
      animation-range: cover 0% cover 50%;
    }
    @keyframes ss-lift {
      from { transform: translateY(0); }
      to { transform: translateY(-110%); }
    }
  }
  /* fallback (no scroll-driven · Firefox-stable) · the shutter scrolls away in flow · still reveals */
  @supports not (animation-timeline: view()) {
    .ss-shutter {
      position: relative;
      top: auto;
    }
  }
}

/* reduced-motion · the shutter holds static + scrolls away (no lift · never broken) */
@media (prefers-reduced-motion: reduce) and (min-width: 768px) {
  .ss-shutter {
    animation: none !important;
    position: relative;
    top: auto;
    margin-bottom: 0;
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
