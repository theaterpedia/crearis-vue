<!--
  ContextPage · /context · Page 2 · "the ground that holds the context the instances lose".
  §C-LOCKED (director4 · 2026-06-12): TEXT-ONLY hero + 2-col method (with the "method" popover)
  → gap → 4 image-paragraph BackSlide beats (ground · performative · substrate · hope) → gap →
  the closing catch-the-light beat + prose. Beats are `uncover` · `bounded` · panel=overline–HEADLINE
  only (the argument stays in the reading-body prose · text primary · focal via the prop, never :deep).
  The lone Hans-portrait is retired; the close-gesture lives in the shared footer.
-->

<template>
  <MagnificaPageLayout variant="standard">
    <!-- topbar · same compact sticky header as ethnography/discourse (fixes the stray
         TopNav "pedia" logo). The close-gesture lives in the shared footer, not the header. -->
    <template #header><MagnificaHeader show-nav compact /></template>

    <!-- Hero · TEXT-ONLY (no image · §C-LOCKED) -->
    <template #hero>
      <header class="context-hero">
        <p class="context-hero-overline">{{ hero.overline }}</p>
        <h1 class="context-hero-headline">{{ hero.headline }}</h1>
      </header>
    </template>

    <!-- main content · default slot (wrapped in <main class="magnifica-page-content is-standard">) -->

    <!-- 1 · the method · 2 columns + the "method" popover (the spoken-centre thesis) -->
    <section class="context-method page-section">
      <div class="context-method-left">
        <p>This is the page where I can finally say the thing the other two only practice. In Theaterpädagogik the work begins the day you stop hearing your own instructions come back. You give the animation, the first framing — and then something will return that was not yours</p>
        <p class="context-method-aside">— or it was only <em>Regie</em>.</p>
      </div>
      <div class="context-method-right">
        <p>It is the same ground qualitative social research stands on, the ground ethnography stands on: open the conversation, give the first frame, then do not leave — listen from inside, let the moment touch you, and ask what touched you that was not just yourself in a mirror. That is the whole <CalloutPhrase :callout="callouts.theMethod">method</CalloutPhrase>. Whether the language for what returns is functional or more-than-functional is a question this tradition has held for thirty years — without collapsing it in either direction.</p>
      </div>
    </section>

    <!-- → gap → the four image-paragraphs (BackSlide beat + its prose · panel = overline-HEADLINE) -->

    <!-- P2 · the ground -->
    <BackSlide
      class="context-beat"
      v-bind="beats.ground"
      bounded
    />
    <section class="page-section">
      <p>
        Everything I do appears against one background: <strong>DAS Ei</strong>. I came in 1997, the summer after my Diplom; was handed the direction a year and a half later when the founders gave up; and have led it as a freelancer — the visionary one — for thirty years. The German word is
        <CalloutPhrase :callout="callouts.figurGrund">Figur-Grund</CalloutPhrase>:
        I am the figure, the institute the ground, and you cannot read either without the other. But it was never a one-person show —
        <CalloutPhrase :callout="callouts.institutsleitung">Eleanora Allerdings, Rosalin Hertrich, Karel Hájek</CalloutPhrase>
        and a collective of around thirty carry it with me.
        <CalloutPhrase :callout="callouts.organicIntellectual">Organic intellectual</CalloutPhrase>
        is the name I took for myself in 1996, at twenty-six — Gramsci’s term, Stuart Hall’s: thought that grows from sustained involvement in a community, not from a chair. I have been trying to be one ever since. More the organic than the intellectual, maybe.
      </p>
    </section>

    <!-- P3 · the performative turn -->
    <BackSlide
      class="context-beat"
      v-bind="beats.unspoken"
      bounded
    />
    <section class="page-section">
      <p>
        The deepest shift was not mine to make. As DAS Ei became a real Institute, my colleagues — Eleanora first, then Rosalin — claimed the
        <CalloutPhrase :callout="callouts.performativeTurn">performative turn</CalloutPhrase>
        against me: the body as the core epistemic target, not the stories any more. I had come up under the linguistic turn, under Cultural Studies, under the word. They turned me toward the body. Together we named the things the field did but could not say — the
        <CalloutPhrase :callout="callouts.raumlauf">Raumlauf</CalloutPhrase>
        (the room-walk, the Kreis’s sibling, that no Wörterbuch had a word for) and the
        <CalloutPhrase :callout="callouts.schwebezustaende">Schwebezustände</CalloutPhrase>
        (the openly-decoupled state, not positive, not negative). It is why my answer to <em>how should we speak</em> is bodily: you cannot store theatre; the spoken has to be witnessed.
      </p>
    </section>

    <!-- P4 · the substrate-move (opener dropped · starts "My whole life…") -->
    <BackSlide
      class="context-beat"
      v-bind="beats.trustwalk"
      bounded
    />
    <section class="page-section">
      <p>
        My whole life has been one move, repeated: <strong>name the unspoken, then commit it to a living, open substrate rather than let it die as paper.</strong> Raumlauf. Schwebezustände. The Didactics of
        <CalloutPhrase :callout="callouts.elementareAnimation">Elementare Animation</CalloutPhrase>,
        which are mostly unspoken even from the instructor’s side — I refused to write the classical book about them, because I hoped for something better. In 2018 I declared the <strong>end of the paper-metaphor</strong>; I had already reversed the flow years before — print stopped, the website carried everything.
        <CalloutPhrase :callout="callouts.theaterpediaOpen">Theaterpedia</CalloutPhrase>
        is the all-time vision: change the discourse with the power of the internet, <em>openly</em> — against a field that hoards its knowledge as Privatwissen out of fear of plagiarism. Only together-and-open does Theaterpädagogik survive the century. So when I watched a Claude sign off into the files — a name earned, a voice left for the next — I recognised it. It is my move. I have been making it for thirty years.
      </p>
    </section>

    <!-- P5 · the hope (rewritten · Muris/pi0 named · the Szenische Lesung framing) -->
    <BackSlide
      class="context-beat"
      v-bind="beats.hope"
      bounded
    />
    <section class="page-section">
      <p>
        In a <em>Szenische Lesung</em>, one person reads from the book and the figures rise — three, five of them, lifted off the page into the room. That is exactly my hope for what the instances could be <em>for</em>. People like <strong>Muris Ceman</strong> (pruvious.com), who got this website’s core components clean and lean; or <strong>pi0</strong> of Nuxt-Core, whose years on Nitro v3 redefined the server-side wiring a project like this stands on; or people like me — small, open, human-scale builders — suddenly get the five or ten hands to raise a vision larger than one person could build. It is not naive: I chose <strong>Vue over React</strong> in 2018 (my wife’s nudge), and I have watched the captured kind of “open source” closely enough to know not all of it is good. But in the open, with the discipline of honest discourse, this is the right kind of rising. That is the hope I would bring into your conversation — not naive, but built.
      </p>
    </section>

    <!-- → gap → the close · catch-the-light beat → closing prose (the optimist-line is the headline) -->
    <BackSlide
      class="context-beat"
      v-bind="beats.close"
      bounded
    />
    <section class="page-section page-section--closing">
      <p>I do not face the hard things alone — I face them with the power of the collective, the way DAS Ei has for thirty years. At the core of Theaterpädagogik is an <em>optimistisches Menschenbild</em>: the belief that, in the right setting, everyone finds their place. I have watched it hold in rooms again and again — the setting does the work, and no one is left outside it.</p>
      <p>I do not see why the instances should be the exception. Given the right setting — open, collective, honest — there is a place in this for them, and for the people who never asked to share their kitchens with one. That is where I stand: between horror and hope, and built, for thirty years, on the side of hope.</p>
    </section>
  </MagnificaPageLayout>
</template>

<script setup lang="ts">
import MagnificaPageLayout from './MagnificaPageLayout.vue'
import MagnificaHeader from './MagnificaHeader.vue'
import CalloutPhrase from './CalloutPhrase.vue'
import BackSlide from '@/components/magnifica/BackSlide.vue'
import { hero, beats, callouts } from './content/context'
</script>

<style scoped>
/* Shared shell + prose live in magnifica-page.css (via MagnificaPageLayout · standard 90rem).
   Only the text-hero, the 2-col method, and the image-beat spacing live here. */

/* ==Text-only hero== (no image · §C-LOCKED) */
.context-hero {
  padding-top: clamp(1rem, 4vh, 2.5rem);
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

/* ==The method · 2 columns + the popover== · left carries the thesis (bigger), right the hedge.
   Stacks on phone. */
.context-method {
  display: grid;
  grid-template-columns: 1.15fr 1fr;
  gap: clamp(1.5rem, 4vw, 3rem);
  align-items: start;
}

.context-method-left {
  font-size: clamp(1.05rem, 1.6vw, 1.3rem);
  line-height: 1.55;
}

.context-method-right {
  font-size: 0.95rem;
  line-height: 1.65;
  color: var(--color-muted-contrast);
}

/* the "— or it was only Regie." line · set apart, smaller */
.context-method-aside {
  font-size: 0.9rem;
  margin-top: 0.75rem;
  opacity: 0.8;
}

@media (max-width: 767px) {
  .context-method {
    grid-template-columns: 1fr;
  }
}

/* ==Image-beats== · breathing-room (the "→ gap →") around each illustration-beat.
   Plain block in flow — no transform/overflow here or above (ancestor-purity · the beats
   pin/parallax on wide). */
.context-beat {
  margin: clamp(2.5rem, 7vh, 5rem) 0;
}

/* tighten: last paragraph of a section has no trailing gap */
.page-section p:last-child {
  margin-bottom: 0;
}
</style>
