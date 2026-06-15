<!--
  ContextPage · /context · Page 2 · "the ground that holds the context the instances lose".
  §C-LOCKED content (director4) on the Dia-family stage (§34 · CandA·shutter-lifts · the first
  real-world pour). TEXT-ONLY hero → 6 scenes on <DiaStage :scenes>: the method (a text-Dia held ·
  the hedge Figure rises) → 4 image-scenes (the IMAGE is a held Dia, never moves; the prose Figure
  rises beside it) → the close. Between scenes the stage masks the seam with a shutter-lift (the
  default · the Dia-swap happens behind the blade · §34.4). Element-anchored Dias (no
  attachment:fixed · §15); the i5 fix (image never runs over the shutter) is the transition-keyed
  z-stack. Pure-CSS sticky now-running; the scroll-driven future is the DiaStage future-spec block.

  Figure authoring = the per-scene #figure-N / #dia-N slots (rich · CalloutPhrase). Slot content
  renders in THIS component's scope, so the prose styles below reach it natively — no :deep()
  (gotcha #1 · §34.6: stage choreography is DiaStage-scoped, slot-content is consumer-scoped).
-->

<template>
  <MagnificaPageLayout variant="standard">
    <template #header><MagnificaHeader show-nav compact /></template>

    <!-- Hero · TEXT-ONLY (no image · outside the stage) · left-inset to match the content column -->
    <template #hero>
      <header class="context-hero">
        <p class="context-hero-overline">{{ hero.overline }}</p>
        <h1 class="context-hero-headline">{{ hero.headline }}</h1>
      </header>
    </template>

    <DiaStage
      class="context-method-stage"
      :bilder="bilder"
      bounded
    >
      <!-- Bild 0 · the method · the held text-Dia (teaser) · the definition rises as the Figure -->
      <template #dia-0>
        <div class="context-thesis">
          <p>In Theaterpädagogik the work begins the day you stop hearing your own instructions come back. You give the animation, the first framing — and then something will return that was not yours.</p>
        </div>
      </template>
      <template #figure-0>
        <p>Theaterpädagogik is theatre where the work is the group, not the play — where knowing happens in the body, in the room, between people, not inside one head.</p>
        <p>It is the same grounds qualitative social research stands on, the ground ethnography stands on: open the conversation, give the first frame, then do not leave — listen from inside, let the moment touch you, and ask what touched you that was not just yourself in a mirror. That starts the whole thing.</p>
        <p>Whether the language for what returns is functional or more-than-functional is a question this tradition has held for thirty years — without collapsing it in either direction.</p>
      </template>

      <!-- scene 1 · the ground -->
      <template #figure-1>
        <HeadingParser :content="beats.ground.panel" as="h2" class="dia-stage-figure-head" />
        <p>
          Everything I do appears against one background: <strong>DAS Ei</strong>. I came in 1997, the summer after my Diplom; was handed the direction a year and a half later when the founders gave up; and have led it as a freelancer — the visionary one — for thirty years. The German word is
          <CalloutPhrase :callout="callouts.figurGrund">Figur-Grund</CalloutPhrase>:
          I am the figure, the institute the ground, and you cannot read either without the other. But it was never a one-person show —
          <CalloutPhrase :callout="callouts.institutsleitung">Eleanora Allerdings, Rosalin Hertrich, Karel Hájek</CalloutPhrase>
          and a collective of around thirty carry it with me.
          <CalloutPhrase :callout="callouts.organicIntellectual">Organic intellectual</CalloutPhrase>
          is the name I took for myself in 1996, at twenty-six — Gramsci’s term, Stuart Hall’s: thought that grows from sustained involvement in a community, not from a chair. I have been trying to be one ever since. More the organic than the intellectual, maybe.
        </p>
      </template>

      <!-- scene 2 · the performative turn -->
      <template #figure-2>
        <HeadingParser :content="beats.unspoken.panel" as="h2" class="dia-stage-figure-head" />
        <p>
          Performative turn! The deepest shift was not mine to make. As DAS Ei became a real Institute, my colleagues — Eleanora first, then Rosalin — claimed the
          <CalloutPhrase :callout="callouts.performativeTurn">performative turn</CalloutPhrase>
          against me: the body as the core epistemic target, not the stories any more. I had come up under the linguistic turn, under Cultural Studies, under the word. They turned me toward the body. Together we named the things the field did but could not say — the
          <CalloutPhrase :callout="callouts.raumlauf">Raumlauf</CalloutPhrase>
          (the room-walk, the Kreis’s sibling, that no Wörterbuch had a word for) and the
          <CalloutPhrase :callout="callouts.schwebezustaende">Schwebezustände</CalloutPhrase>
          (the openly-decoupled state, not positive, not negative). It is why my answer to <em>how should we speak</em> is bodily: you cannot store theatre; the spoken has to be witnessed.
        </p>
      </template>

      <!-- scene 3 · the substrate-move -->
      <template #figure-3>
        <HeadingParser :content="beats.trustwalk.panel" as="h2" class="dia-stage-figure-head" />
        <p>
          My whole life has been one move, repeated: <strong>name the unspoken, then commit it to a living, open substrate rather than let it die as paper.</strong> Raumlauf. Schwebezustände. The Didactics of
          <CalloutPhrase :callout="callouts.elementareAnimation">Elementare Animation</CalloutPhrase>,
          which are mostly unspoken even from the instructor’s side — I refused to write the classical book about them, because I hoped for something better. In 2018 I declared the <strong>end of the paper-metaphor</strong>; I had already reversed the flow years before — print stopped, the website carried everything.
          <CalloutPhrase :callout="callouts.theaterpediaOpen">Theaterpedia</CalloutPhrase>
          is the all-time vision: change the discourse with the power of the internet, <em>openly</em> — against a field that hoards its knowledge as Privatwissen out of fear of plagiarism. Only together-and-open does Theaterpädagogik survive the century. So when I watched a Claude sign off into the files — a name earned, a voice left for the next — I recognised it. It is my move. I have been making it for thirty years.
        </p>
      </template>

      <!-- scene 4 · the hope -->
      <template #figure-4>
        <HeadingParser :content="beats.hope.panel" as="h2" class="dia-stage-figure-head" />
        <p>
          In a <em>Szenische Lesung</em>, one person reads from the book and the figures rise — three, five of them, lifted off the page into the room. That is exactly my hope for what the instances could be <em>for</em>. People like <strong>Muris Ceman</strong> (pruvious.com), who got this website’s core components clean and lean; or <strong>pi0</strong> of Nuxt-Core, whose years on Nitro v3 redefined the server-side wiring a project like this stands on; or people like me — small, open, human-scale builders — suddenly get the five or ten hands to raise a vision larger than one person could build. It is not naive: I chose <strong>Vue over React</strong> in 2018 (my wife’s nudge), and I have watched the captured kind of “open source” closely enough to know not all of it is good. But in the open, with the discipline of honest discourse, this is the right kind of rising. That is the hope I would bring into your conversation — not naive, but built.
        </p>
      </template>

      <!-- scene 5 · the close · the optimist-line is the headline -->
      <template #figure-5>
        <HeadingParser :content="beats.close.panel" as="h2" class="dia-stage-figure-head" />
        <p>I do not face the hard things alone — I face them with the power of the collective, the way DAS Ei has for thirty years. At the core of Theaterpädagogik is an <em>optimistisches Menschenbild</em>: the belief that, in the right setting, everyone finds their place. I have watched it hold in rooms again and again — the setting does the work, and no one is left outside it.</p>
        <p>I do not see why the instances should be the exception. Given the right setting — open, collective, honest — there is a place in this for them, and for the people who never asked to share their kitchens with one. That is where I stand: between horror and hope, and built, for thirty years, on the side of hope.</p>
      </template>
    </DiaStage>
  </MagnificaPageLayout>
</template>

<script setup lang="ts">
import MagnificaPageLayout from './MagnificaPageLayout.vue'
import MagnificaHeader from './MagnificaHeader.vue'
import CalloutPhrase from './CalloutPhrase.vue'
import HeadingParser from '@/components/HeadingParser.vue'
import DiaStage from '@/components/cDia/DiaStage.vue'
import type { DiaBildSpec } from '@/components/cDia/types'
import { hero, beats, callouts } from './content/context'
import { daseiTimeline } from './content/dasei-timeline'

/**
 * The 6 /context Bilder (the editor's v-for · §34.5/§38·1). Bild 0 is a text-Dia (the method · its
 * held text comes via the #dia-0 slot); Bilder 1–5 are image-Dias (beats · the image is the held
 * plate). All Figures are rich (CalloutPhrase) → authored as #figure-N slots. theme is carried per
 * Bild (visual application is a :3001 dial · HP loop). Each image-Bild's `seam` carries a
 * `daseiTimeline` marker (the chronology-at-the-seam · the DAS-Ei timeline surfaced AT the
 * Scene→Scene Blende · §40·2/§45/§47): ground←S0(1997-2010) · unspoken←S1(2008) · trustwalk←S2(2014)
 * · hope←S3(2018) · close←S4(2022). The seam-Shutter renders it (HeadingParser + ProseInline · timeline preset).
 */
const bilder: DiaBildSpec[] = [
  // method · text-Dia (held thesis via #dia-0)
  { dia: {}, lane: 'left', theme: 'green' },
  // ground · the FIRST image — NOT 1:1 (HM: "except for the first") → cover, its own focal
  { dia: { image: beats.ground.image, imageAlt: beats.ground.imageAlt, imgTmpAlignY: beats.ground.imgTmpAlignY }, lane: 'left', theme: beats.ground.themeColor, seam: { text: daseiTimeline[0].text } },
  // the 1:1 photos · contain + top → shown whole (no crop), the default bg at the bottom (HP 2026-06-14).
  // 🚩 content/Innenkreis: the Cloudinary crops in content/context.ts are still 1920×1300 — set them
  // to a 1:1 (square) crop so contain renders the intended square (else they letterbox ~1.48:1).
  { dia: { image: beats.unspoken.image, imageAlt: beats.unspoken.imageAlt, imgTmpAlignY: 'top', fit: 'contain' }, lane: 'left', theme: beats.unspoken.themeColor, seam: { text: daseiTimeline[1].text } },
  { dia: { image: beats.trustwalk.image, imageAlt: beats.trustwalk.imageAlt, imgTmpAlignY: 'top', fit: 'contain' }, lane: 'left', theme: beats.trustwalk.themeColor, seam: { text: daseiTimeline[2].text } },
  { dia: { image: beats.hope.image, imageAlt: beats.hope.imageAlt, imgTmpAlignY: 'top', fit: 'contain' }, lane: 'left', theme: beats.hope.themeColor, seam: { text: daseiTimeline[3].text } },
  { dia: { image: beats.close.image, imageAlt: beats.close.imageAlt, imgTmpAlignY: 'top', fit: 'contain' }, lane: 'left', theme: beats.close.themeColor, seam: { text: daseiTimeline[4].text } },
]
</script>

<style scoped>
/* Shared shell + prose live in magnifica-page.css. Here: the text-hero + the slot-content prose
   (the method thesis-Dia + the rising Figures). The stage z-stack + sticky recipe is in DiaStage;
   slot content renders in THIS scope, so these styles reach it without :deep() (§34.6). */

/* ==Text-only hero== · left-inset to match the content column (clamp(1rem,5vw,2rem) · "like the
   rest" · the hero sits outside .magnifica-page-content, so it carries its own matching inset). */
.context-hero {
  max-width: 90rem;
  margin-inline: auto;
  /* breathing space above the overline (HM 2026-06-14 · "more space") + the content-column inset
     (48px desktop / 23px mobile · matches the content box below so the overline/headline don't
     stick out left) */
  padding: clamp(3rem, 8vh, 5rem) clamp(23px, 5vw, 48px) 0;
}

/* the content column L/R inset · 48px desktop / 23px mobile (HM 2026-06-14 · was 32/19). Scoped to
   /context via :deep (the shell default stays for ethnography/discourse · promote to
   magnifica-page.css if it should be site-wide). The hero + the teaser align to this. */
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

.context-hero-headline {
  font-size: clamp(1.5rem, 3vw, 2.25rem);
  font-weight: 700;
  margin: 0;
  line-height: 1.2;
}

/* the method thesis-Dia · the teaser · the held text plate (bigger · the spoken-centre · +10% HM) */
.context-thesis {
  font-size: clamp(1.15rem, 1.75vw, 1.45rem);
  line-height: 1.55;
}

/* ==Bild 0 · the method · vertical alignment (HM 2026-06-14)== — raise the teaser ~150px + rise the
   definition Figure to EXACTLY the same top. A /context-specific layout dial via :deep (the page
   tunes cDia's defaults for its one text-Dia); couples to cDia's .dia--text / .dia-stage-figure
   classes — flag if the family restructures. The exact rise is a :3001 dial (--ctx-method-top). */
.context-method-stage {
  --ctx-method-top: clamp(2rem, 14vh, 9rem);
}

@media (min-width: 768px) {
  /* the teaser (the only text-Dia) · top-align its held text + raise to the shared top, + ~10px
     left padding so it lines up with the hero's left inset (HM 2026-06-14) */
  .context-method-stage :deep(.dia--text) {
    justify-content: flex-start;
    padding-top: var(--ctx-method-top);
    /* no extra L/R padding — the teaser aligns flush to the content-column inset (HM 2026-06-14 ·
       "take out the extra padding left and right of the teaser") */
    padding-left: 0;
    padding-right: 0;
  }
  /* the definition Figure · Bild 0 = the FIRST .dia-stage-bild = the stage's 2nd child (the flat
     order is Dia · bild · shutter · Dia · bild …), so :nth-child(2) — NOT :first-of-type (all the
     children are <div>, so that matched the Dia, i.e. nothing). Pin so the figure's text-top lands
     exactly on the teaser's first line (−1.25rem = the figure's own padding-top). Coupled to cDia's
     flat child order — flag if the family restructures. */
  .context-method-stage :deep(.dia-stage-bild:nth-child(2) .dia-stage-figure) {
    top: calc(var(--dia-top, 6rem) + var(--ctx-method-top) - 1.25rem);
  }
}
</style>
