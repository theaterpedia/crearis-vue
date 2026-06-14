<!--
  Demo2 · /demo2 · DiaStage documentation — the SOPHISTICATED edge-cases.
  Each scene demonstrates an edge/gotcha of the Dia-primitive + a pop-over note. Source clipped
  from the landing backslides (pope/olah) + /context beats.
    1 · hold-dial   — a one-line Figure → the Dia barely holds (the #1 dial · §18)
    2 · lane-flip   — pope held left, then Olah held right: the Before/After mirror
    3 · full-bleed  — lane="full" Dia, a legible card rises OVER it (cover · gotcha #5)
    4 · image-blade — the Shutter as a full-bleed hero-image blade + separator
    5 · z-stack     — sequential, non-overlapping scenes (the i5 fix · Dia z1 < Figure z2 < Shutter z3)
-->

<template>
  <MagnificaPageLayout variant="standard">
    <template #header><MagnificaHeader show-nav compact /></template>

    <template #hero>
      <header class="demo-hero">
        <p class="demo-hero-overline">DiaStage · documentation · edge-cases</p>
        <h1 class="demo-hero-headline">Dia — the sophisticated cases</h1>
        <p class="demo-lead">
          Where the stage gets interesting — and where it bites. The held-Dia needs Figure-travel
          to hold; lanes flip for the mirror; a full-bleed plate needs an opaque cover; the Shutter
          can be an image; and the z-stack (Dia&nbsp;z1 &lt; Figure&nbsp;z2 &lt; Shutter&nbsp;z3) keeps
          scenes from painting over each other. Click the dotted phrases for the notes.
        </p>
      </header>
    </template>

    <DiaStage :height-vh="70">
      <!-- 1 · hold-dial — a one-line Figure, so the Dia barely holds -->
      <p class="demo-label">
        <span class="demo-label-n">1</span><strong>hold-dial</strong> — a one-line Figure, so the Dia barely holds
        · <CalloutPhrase :callout="notes.holdDial">what's happening here</CalloutPhrase>
      </p>
      <div class="dia-scene">
        <Dia lane="left" :image="beats.trustwalk.image" :image-alt="beats.trustwalk.imageAlt" img-tmp-align-y="top" />
        <div class="dia-figure">
          <HeadingParser :content="beats.trustwalk.panel" as="h2" class="dia-head" />
          <p>One line of Figure — and the plate has almost nothing to hold against. Watch it just sit, then leave.</p>
        </div>
      </div>

      <!-- 2 · lane-flip — pope held left, Olah held right: the Before/After mirror -->
      <p class="demo-label">
        <span class="demo-label-n">2</span><strong>lane-flip</strong> — the Before/After mirror (pope left → Olah right)
        · <CalloutPhrase :callout="notes.flip">what's happening here</CalloutPhrase>
      </p>
      <div class="dia-scene">
        <Dia lane="left" :image="popeImg" image-alt="the question, held left" img-tmp-align-y="top" />
        <div class="dia-figure">
          <HeadingParser content="before **THE QUESTION HELD LEFT**" as="h2" class="dia-head" />
          <p>The plate holds on the left, the reading rises on the right — the ordinary orientation.</p>
          <p>Now the next scene flips it: the plate moves to the right lane and the Figure runs left, so the two scenes mirror each other (the BackSlide's imageRight, expressed here as the Dia's lane).</p>
        </div>
      </div>
      <div class="dia-scene">
        <Dia lane="right" :image="olahImg" image-alt="the answer, held right" img-tmp-align-y="top" />
        <div class="dia-figure dia-figure--left">
          <HeadingParser content="after **THE ANSWER HELD RIGHT**" as="h2" class="dia-head" />
          <p>Held right, read left — the mirror of the scene above. The rhyme is spatial: the eye crosses the stage and the two plates answer each other.</p>
        </div>
      </div>

      <!-- 3 · full-bleed Dia (lane=full) — a legible card rises OVER it -->
      <p class="demo-label">
        <span class="demo-label-n">3</span><strong>full-bleed</strong> — a held plate across the whole stage, a card rises over it
        · <CalloutPhrase :callout="notes.full">what's happening here</CalloutPhrase>
      </p>
      <div class="dia-scene">
        <Dia lane="full" :image="beats.ground.image" :image-alt="beats.ground.imageAlt" img-tmp-align-y="center" />
        <div class="dia-figure demo-over-card">
          <HeadingParser content="full presence **THE GROUND, NOT THE FIGURE**" as="h2" class="dia-head" />
          <p>The plate spans both lanes and holds; this card rises <em>over</em> it (z2 over z1). It carries its own opaque background — without it (gotcha&nbsp;#5) the image would read straight through the text.</p>
        </div>
      </div>

      <!-- 4 · the Shutter as an image-blade -->
      <p class="demo-label">
        <span class="demo-label-n">4</span><strong>image-blade</strong> — the Shutter as a full-bleed hero-image, not just black
        · <CalloutPhrase :callout="notes.imageBlade">what's happening here</CalloutPhrase>
      </p>
      <Shutter :image="beats.close.image" separator>
        <p class="demo-shutter-text">the blade can be an image · then a new Dia opens</p>
      </Shutter>

      <!-- 5 · z-stack — sequential, non-overlapping (the i5 fix) -->
      <p class="demo-label">
        <span class="demo-label-n">5</span><strong>z-stack</strong> — sequential scenes, no overlap (the i5 fix)
        · <CalloutPhrase :callout="notes.zstack">what's happening here</CalloutPhrase>
      </p>
      <div class="dia-scene">
        <Dia lane="left" :image="beats.hope.image" :image-alt="beats.hope.imageAlt" img-tmp-align-y="center" />
        <div class="dia-figure">
          <HeadingParser content="the open vision **RAISE FROM THE BOOKS**" as="h2" class="dia-head" />
          <p>A new Dia has opened cleanly below the Shutter — because the scenes stay sequential and non-overlapping. The Shutter (z3) bridged the swap; the previous Figure never painted over this plate.</p>
          <p>That sequencing is the whole i5 fix. The scroll-driven future — one <code>fixed</code> Dia whose content cross-fades — dissolves the overlap entirely, so even this discipline relaxes.</p>
        </div>
      </div>
    </DiaStage>
  </MagnificaPageLayout>
</template>

<script setup lang="ts">
import MagnificaPageLayout from './MagnificaPageLayout.vue'
import MagnificaHeader from './MagnificaHeader.vue'
import CalloutPhrase from './CalloutPhrase.vue'
import HeadingParser from '@/components/HeadingParser.vue'
import DiaStage from '@/components/magnifica/DiaStage.vue'
import Dia from '@/components/magnifica/Dia.vue'
import Shutter from '@/components/magnifica/Shutter.vue'
import { beats } from './content/context'
import { popeImg, olahImg, notes } from './content/demo'
</script>

<style scoped>
/* ==Overview header== */
.demo-hero {
  padding-top: clamp(1rem, 4vh, 2.5rem);
}
.demo-hero-overline {
  font-size: 0.875rem;
  margin: 0 0 0.5rem;
  letter-spacing: 0.02em;
  opacity: 0.85;
}
.demo-hero-headline {
  font-size: clamp(1.5rem, 3vw, 2.25rem);
  font-weight: 700;
  margin: 0 0 1rem;
  line-height: 1.2;
}
.demo-lead {
  max-width: 46rem;
  font-size: 0.9375rem;
  line-height: 1.6;
  color: var(--color-muted-contrast);
  margin: 0;
}

/* ==Per-scene label== */
.demo-label {
  margin: clamp(2rem, 6vh, 4rem) 0 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--color-border);
  font-size: 0.8125rem;
  letter-spacing: 0.02em;
  color: var(--color-muted-contrast);
}
.demo-label-n {
  display: inline-block;
  min-width: 1.4rem;
  font-weight: 700;
  color: var(--color-primary-bg);
}
.demo-label strong {
  color: var(--color-contrast);
}

/* ==A scene== */
.dia-scene {
  position: relative;
  margin-bottom: clamp(2rem, 6vh, 4rem);
}

/* ==The rising Figure== · right lane by default; --left for the flip. */
.dia-figure {
  position: relative;
  z-index: 2;
}
@media (min-width: 768px) {
  .dia-figure {
    width: 48%;
    margin-left: 52%;
  }
  .dia-figure--left {
    margin-left: 0;
  }
}
.dia-head {
  margin: 0 0 0.75rem;
}
.dia-figure p:last-child {
  margin-bottom: 0;
}

/* ==Full-bleed cover== · an opaque card that rises over the full-bleed plate (gotcha #5 ·
   the cover must be opaque or the image reads through the text). */
.demo-over-card {
  background: var(--color-card-bg, #1d1b1a);
  color: var(--color-card-contrast, #f4f4f4);
  padding: 1.5rem;
  border-radius: 4px;
}

/* ==Shutter caption== */
.demo-shutter-text {
  text-align: center;
  font-size: 0.9rem;
  letter-spacing: 0.04em;
  margin: 0;
  opacity: 0.9;
}
</style>
