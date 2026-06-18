<!--
  ContextPage · /context · the method, stripped to one Bild (HM 2026-06-14). The page now holds ONLY
  the first Bild — the method: a held text-Dia (the teaser · left) + the definition Figure rising
  beside it (right). All the other Bilder (ground · performative-turn · substrate · hope · close),
  their seam timeline-markers, and the image-Dias are stripped. Hero = the overline-headline
  (overline: "30 years at DAS Ei …" · DAS Ei in primary). Pure-CSS sticky hold (cDia · §34); the
  Figure prose renders in THIS component's scope (no :deep · §34.6).
-->

<template>
  <MagnificaPageLayout variant="standard">
    <template #header>
      <MagnificaHeader show-nav compact />
    </template>

    <!-- Hero · TEXT-ONLY (no image · outside the stage) · left-inset to match the content column -->
    <template #hero>
      <header class="context-hero">
        <p class="context-hero-overline">30 years at <span class="hero-dasei">DAS Ei</span> – Theaterpädagogisches
          Institut Bayern e.V.</p>
        <h1 class="context-hero-headline">grounded practice & organic intellectual</h1>
      </header>
    </template>

    <DiaStage class="context-method-stage" :bilder="bilder" bounded>
      <!-- Bild 0 · the method · the held text-Dia (teaser) · the definition rises as the Figure -->
      <template #dia-0>
        <div class="context-thesis">
          <p>In Theaterpädagogik the work begins the day you stop hearing your own instructions come back. You give the
            animation, the first framing — and then something will return that was not yours.</p>
        </div>
      </template>
      <template #figure-0>
        <p>Theaterpädagogik is theatre where the work is the group, not the play — where knowing happens in the body, in
          the room, between people, not inside one head.</p>
        <p>It is the same grounds qualitative social research stands on, the ground ethnography stands on: open the
          conversation, give the first frame, then do not leave — listen from inside, let the moment touch you, and ask
          what touched you that was not just yourself in a mirror. That starts the whole thing.</p>
        <p>Whether the language for what returns is functional or more-than-functional is a question this tradition has
          held for thirty years — without collapsing it in either direction.</p>
        <!-- brush · invisible riser after the last line · extends the figure's rise-travel so its
             top reaches the teaser's top ("In Theaterpädagogik…"). The figure pins via the calc
             below, but the stage needs the extra scroll-length to carry it there (HM 2026-06-18 ·
             Task1). Height is a :3001 dial (--ctx-figure-brush). -->
        <div class="context-figure-brush" aria-hidden="true" />
      </template>
    </DiaStage>
  </MagnificaPageLayout>
</template>

<script setup lang="ts">
import MagnificaPageLayout from './MagnificaPageLayout.vue'
import MagnificaHeader from './MagnificaHeader.vue'
import DiaStage from '@/components/cDia/DiaStage.vue'
import type { DiaBildSpec } from '@/components/cDia/types'
import { hero } from './content/context'

/**
 * One Bild · the method (HM 2026-06-14 · stripped). A text-Dia (the held thesis via #dia-0) + the
 * definition Figure (#figure-0). The former Bilder 1–5 (image-Dias) + their seam timeline-markers
 * are removed; the daseiTimeline content still lives in content/dasei-timeline.ts for a later use.
 */
const bilder: DiaBildSpec[] = [
  { dia: {}, lane: 'left', theme: 'green' },
]
</script>

<style scoped>
/* Shared shell + prose live in magnifica-page.css. Here: the text-hero + the method Bild's
   slot-content (the thesis text-Dia + the definition Figure). Slot content renders in THIS scope,
   so these styles reach it without :deep() (§34.6). */

/* ==Text-only hero== · left-inset to match the content column. */
.context-hero {
  max-width: 90rem;
  margin-inline: auto;
  /* breathing space above the overline + the content-column inset (48px desktop / 23px mobile) */
  padding: clamp(3rem, 8vh, 5rem) clamp(23px, 5vw, 48px) 0;
}

/* the content column L/R inset · 48px desktop / 23px mobile (scoped to /context via :deep). */
:deep(.magnifica-page-content.is-standard) {
  padding-left: clamp(23px, 5vw, 48px);
  padding-right: clamp(23px, 5vw, 48px);
}

.context-hero-overline {
  font-size: 0.875rem;
  margin: 0 0 0.5rem;
  letter-spacing: 0.02em;
  opacity: 0.85;
}

/* 'DAS Ei' lifted in the primary token (HM 2026-06-14) */
.hero-dasei {
  color: var(--color-primary-bg);
}

.context-hero-headline {
  font-size: clamp(1.5rem, 3vw, 2.25rem);
  font-weight: 700;
  margin: 0;
  line-height: 1.2;
}

/* the method thesis-Dia · the teaser · the held text plate (bigger · the spoken-centre). */
.context-thesis {
  font-size: clamp(1.15rem, 1.75vw, 1.45rem);
  line-height: 1.55;
}

/* ==Bild 0 · the method · vertical alignment== — raise the teaser + rise the definition Figure to
   the same top. A /context-specific dial via :deep (the page tunes cDia's defaults for its one
   text-Dia); couples to cDia's .dia--text / .dia-stage-figure classes — flag if the family
   restructures. The exact rise is a :3001 dial (--ctx-method-top). */
.context-method-stage {
  --ctx-method-top: clamp(2rem, 14vh, 9rem);
  /* HOLD the sticky definition-Figure (right) in place — it was releasing early (scrolling
     higher) when the bild's containing-block ended. The figure stays pinned until the bild's
     bottom reaches its sticky-top, so extend the bild on this one-bild page (HM 2026-06-18).
     🚩 :3001 dial — tune so the right content holds through the read without dead scroll. */
  --dia-bild-h: 180vh;
}

/* the figure-brush · invisible riser extending the rise so the figure reaches its pinned top
   (alignment with the teaser). Desktop-only (the rise is desktop · mobile linearises). Dial. */
@media (min-width: 768px) {
  .context-method-stage .context-figure-brush {
    height: var(--ctx-figure-brush, 16.5vh);
  }
}

@media (min-width: 768px) {

  /* the teaser (the only text-Dia) · top-align its held text + raise to the shared top; flush to
     the content-column inset (no extra L/R padding). */
  .context-method-stage :deep(.dia--text) {
    justify-content: flex-start;
    padding-top: var(--ctx-method-top);
    padding-left: 0;
    padding-right: 0;
  }

  /* the definition Figure · Bild 0 = the first .dia-stage-bild = the stage's 2nd child (Dia · bild),
     so :nth-child(2). The cDia figure rises-over by design (position: static) — for /context's
     method we PIN it: `position: sticky` so it rises, then STICKS at the aligned top and holds
     (with the held teaser) instead of scrolling past (HM 2026-06-18 screentest). The brush below
     gives the hold its scroll-length. top = the teaser's first line (−1.25rem = the figure's own
     padding-top). align-self:start so the sticky box isn't stretched to the row. Page-scoped via
     :deep (only .context-method-stage · the cDia component's rise-over stays the family default). */
  .context-method-stage :deep(.dia-stage-bild:nth-child(2) .dia-stage-figure) {
    position: sticky;
    align-self: start;
    top: calc(var(--dia-top, 6rem) + var(--ctx-method-top) - 1.25rem);
  }
}
</style>
