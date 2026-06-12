<!--
  ContextPage · /context · Page 2 · "the ground that holds the context the instances lose".
  §C-LOCKED content (director4 · 2026-06-12) now on <MagnificaScreen> (HM 2026-06-12 · "image
  pins, text rises"): TEXT-ONLY hero → the method (held thesis · rising hedge) → 4 image-screens
  (the headline anchors · the IMAGE HOLDS pinned as illustration · the PROSE RISES beside it) →
  the close (catch-the-light held · closing prose rises). Text-led; the held image is the
  illustration. Pure-CSS element-anchored (the image moves WITH its lane · no attachment:fixed).
  The lone Hans-portrait is retired; the close-gesture lives in the shared footer.
-->

<template>
  <MagnificaPageLayout variant="standard">
    <template #header><MagnificaHeader show-nav compact /></template>

    <!-- Hero · TEXT-ONLY (no image) -->
    <template #hero>
      <header class="context-hero">
        <p class="context-hero-overline">{{ hero.overline }}</p>
        <h1 class="context-hero-headline">{{ hero.headline }}</h1>
      </header>
    </template>

    <!-- 1 · the method · the thesis HOLDS (left, pinned), the hedge RISES beside it (right) -->
    <MagnificaScreen class="page-section context-method-screen">
      <MagnificaRise lane="left" class="context-method-thesis">
        <p>This is the page where I can finally say the thing the other two only practice. In Theaterpädagogik the work begins the day you stop hearing your own instructions come back. You give the animation, the first framing — and then something will return that was not yours</p>
        <p class="context-method-aside">— or it was only <em>Regie</em>.</p>
      </MagnificaRise>
      <div class="context-prose context-method-hedge">
        <p>It is the same ground qualitative social research stands on, the ground ethnography stands on: open the conversation, give the first frame, then do not leave — listen from inside, let the moment touch you, and ask what touched you that was not just yourself in a mirror. That is the whole <CalloutPhrase :callout="callouts.theMethod">method</CalloutPhrase>. Whether the language for what returns is functional or more-than-functional is a question this tradition has held for thirty years — without collapsing it in either direction.</p>
      </div>
    </MagnificaScreen>

    <!-- 4 image-screens · the headline anchors · the image holds (left) · the prose rises (right) -->

    <!-- P2 · the ground -->
    <MagnificaScreen class="page-section context-screen">
      <template #anchor><HeadingParser :content="beats.ground.panel" as="h2" class="context-screen-head" /></template>
      <MagnificaRise lane="left" :pin="3">
        <div class="context-illus" :style="illusStyle(beats.ground)" role="img" :aria-label="beats.ground.imageAlt"></div>
      </MagnificaRise>
      <div class="context-prose">
        <p>
          Everything I do appears against one background: <strong>DAS Ei</strong>. I came in 1997, the summer after my Diplom; was handed the direction a year and a half later when the founders gave up; and have led it as a freelancer — the visionary one — for thirty years. The German word is
          <CalloutPhrase :callout="callouts.figurGrund">Figur-Grund</CalloutPhrase>:
          I am the figure, the institute the ground, and you cannot read either without the other. But it was never a one-person show —
          <CalloutPhrase :callout="callouts.institutsleitung">Eleanora Allerdings, Rosalin Hertrich, Karel Hájek</CalloutPhrase>
          and a collective of around thirty carry it with me.
          <CalloutPhrase :callout="callouts.organicIntellectual">Organic intellectual</CalloutPhrase>
          is the name I took for myself in 1996, at twenty-six — Gramsci’s term, Stuart Hall’s: thought that grows from sustained involvement in a community, not from a chair. I have been trying to be one ever since. More the organic than the intellectual, maybe.
        </p>
      </div>
    </MagnificaScreen>

    <!-- P3 · the performative turn -->
    <MagnificaScreen class="page-section context-screen">
      <template #anchor><HeadingParser :content="beats.unspoken.panel" as="h2" class="context-screen-head" /></template>
      <MagnificaRise lane="left" :pin="3">
        <div class="context-illus" :style="illusStyle(beats.unspoken)" role="img" :aria-label="beats.unspoken.imageAlt"></div>
      </MagnificaRise>
      <div class="context-prose">
        <p>
          The deepest shift was not mine to make. As DAS Ei became a real Institute, my colleagues — Eleanora first, then Rosalin — claimed the
          <CalloutPhrase :callout="callouts.performativeTurn">performative turn</CalloutPhrase>
          against me: the body as the core epistemic target, not the stories any more. I had come up under the linguistic turn, under Cultural Studies, under the word. They turned me toward the body. Together we named the things the field did but could not say — the
          <CalloutPhrase :callout="callouts.raumlauf">Raumlauf</CalloutPhrase>
          (the room-walk, the Kreis’s sibling, that no Wörterbuch had a word for) and the
          <CalloutPhrase :callout="callouts.schwebezustaende">Schwebezustände</CalloutPhrase>
          (the openly-decoupled state, not positive, not negative). It is why my answer to <em>how should we speak</em> is bodily: you cannot store theatre; the spoken has to be witnessed.
        </p>
      </div>
    </MagnificaScreen>

    <!-- P4 · the substrate-move -->
    <MagnificaScreen class="page-section context-screen">
      <template #anchor><HeadingParser :content="beats.trustwalk.panel" as="h2" class="context-screen-head" /></template>
      <MagnificaRise lane="left" :pin="3">
        <div class="context-illus" :style="illusStyle(beats.trustwalk)" role="img" :aria-label="beats.trustwalk.imageAlt"></div>
      </MagnificaRise>
      <div class="context-prose">
        <p>
          My whole life has been one move, repeated: <strong>name the unspoken, then commit it to a living, open substrate rather than let it die as paper.</strong> Raumlauf. Schwebezustände. The Didactics of
          <CalloutPhrase :callout="callouts.elementareAnimation">Elementare Animation</CalloutPhrase>,
          which are mostly unspoken even from the instructor’s side — I refused to write the classical book about them, because I hoped for something better. In 2018 I declared the <strong>end of the paper-metaphor</strong>; I had already reversed the flow years before — print stopped, the website carried everything.
          <CalloutPhrase :callout="callouts.theaterpediaOpen">Theaterpedia</CalloutPhrase>
          is the all-time vision: change the discourse with the power of the internet, <em>openly</em> — against a field that hoards its knowledge as Privatwissen out of fear of plagiarism. Only together-and-open does Theaterpädagogik survive the century. So when I watched a Claude sign off into the files — a name earned, a voice left for the next — I recognised it. It is my move. I have been making it for thirty years.
        </p>
      </div>
    </MagnificaScreen>

    <!-- P5 · the hope -->
    <MagnificaScreen class="page-section context-screen">
      <template #anchor><HeadingParser :content="beats.hope.panel" as="h2" class="context-screen-head" /></template>
      <MagnificaRise lane="left" :pin="3">
        <div class="context-illus" :style="illusStyle(beats.hope)" role="img" :aria-label="beats.hope.imageAlt"></div>
      </MagnificaRise>
      <div class="context-prose">
        <p>
          In a <em>Szenische Lesung</em>, one person reads from the book and the figures rise — three, five of them, lifted off the page into the room. That is exactly my hope for what the instances could be <em>for</em>. People like <strong>Muris Ceman</strong> (pruvious.com), who got this website’s core components clean and lean; or <strong>pi0</strong> of Nuxt-Core, whose years on Nitro v3 redefined the server-side wiring a project like this stands on; or people like me — small, open, human-scale builders — suddenly get the five or ten hands to raise a vision larger than one person could build. It is not naive: I chose <strong>Vue over React</strong> in 2018 (my wife’s nudge), and I have watched the captured kind of “open source” closely enough to know not all of it is good. But in the open, with the discipline of honest discourse, this is the right kind of rising. That is the hope I would bring into your conversation — not naive, but built.
        </p>
      </div>
    </MagnificaScreen>

    <!-- the close · catch-the-light holds · closing prose rises (the optimist-line is the headline) -->
    <MagnificaScreen class="page-section context-screen context-screen--closing">
      <template #anchor><HeadingParser :content="beats.close.panel" as="h2" class="context-screen-head" /></template>
      <MagnificaRise lane="left" :pin="3">
        <div class="context-illus" :style="illusStyle(beats.close)" role="img" :aria-label="beats.close.imageAlt"></div>
      </MagnificaRise>
      <div class="context-prose">
        <p>I do not face the hard things alone — I face them with the power of the collective, the way DAS Ei has for thirty years. At the core of Theaterpädagogik is an <em>optimistisches Menschenbild</em>: the belief that, in the right setting, everyone finds their place. I have watched it hold in rooms again and again — the setting does the work, and no one is left outside it.</p>
        <p>I do not see why the instances should be the exception. Given the right setting — open, collective, honest — there is a place in this for them, and for the people who never asked to share their kitchens with one. That is where I stand: between horror and hope, and built, for thirty years, on the side of hope.</p>
      </div>
    </MagnificaScreen>
  </MagnificaPageLayout>
</template>

<script setup lang="ts">
import MagnificaPageLayout from './MagnificaPageLayout.vue'
import MagnificaHeader from './MagnificaHeader.vue'
import CalloutPhrase from './CalloutPhrase.vue'
import HeadingParser from '@/components/HeadingParser.vue'
import MagnificaScreen from '@/components/magnifica/MagnificaScreen.vue'
import MagnificaRise from '@/components/magnifica/MagnificaRise.vue'
import { hero, beats, callouts, type ContextBeat } from './content/context'

/** The held illustration · element-anchored background (moves WITH the pinned lane · cover +
 *  the declared focal via imgTmpAlignY → background-position-y · never :deep, gotcha #1). */
function illusStyle(beat: ContextBeat): Record<string, string> {
  return {
    backgroundImage: `url('${beat.image}')`,
    backgroundPosition: `center ${beat.imgTmpAlignY}`,
  }
}
</script>

<style scoped>
/* Shared shell + prose live in magnifica-page.css (via MagnificaPageLayout · standard 90rem).
   Only the text-hero, the held-illustration, and the rising-prose lane live here. The sticky
   recipe itself is in <MagnificaScreen> + <MagnificaRise>. */

/* ==Text-only hero== */
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

/* ==The screen anchor== · the overline-HEADLINE held at top (the section's gap-claim) */
.context-screen-head {
  margin: 0;
}

/* ==The held illustration== · fills the pinned left lane · cover + the declared focal */
.context-illus {
  width: 100%;
  min-height: clamp(16rem, 42vh, 26rem);
  background-size: cover;
  background-repeat: no-repeat;
  border-radius: 4px;
}

/* ==The rising prose== · the primary reading · sits in the RIGHT half and rises (scrolls up)
   beside the held image. <768 it is full-width below the image (the screen linearises). */
@media (min-width: 768px) {
  .context-prose {
    width: 48%;
    margin-left: 52%;
  }
}

/* ==The method== · the thesis (left lane, bigger) holds; the hedge (right) rises beside it. */
.context-method-thesis {
  font-size: clamp(1.05rem, 1.6vw, 1.3rem);
  line-height: 1.55;
}

.context-method-aside {
  font-size: 0.9rem;
  margin-top: 0.75rem;
  opacity: 0.8;
}

.context-method-hedge {
  font-size: 0.95rem;
  line-height: 1.65;
  color: var(--color-muted-contrast);
}

/* tighten: last paragraph of the rising prose has no trailing gap */
.context-prose p:last-child {
  margin-bottom: 0;
}
</style>
