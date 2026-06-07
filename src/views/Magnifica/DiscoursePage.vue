<!--
  DiscoursePage · /discourse · Page 3 · "Between hope and horror".
  Canonical port of projects/magnifica/final/page-3/page-3-minimal.md (HM-audited ·
  95%-final). The 17-paragraph spine: Williams → Probyn → Cixous standing-line →
  Butoh/Schwarzenberg → Bologna/counting-apparatus → spleen-pivot (the cross-page
  RESOLVE of Page-1 §G) → technology-of-the-self → speaking-position close.
  16 inline CalloutPhrase triggers · B type-coloring (concept/biographical/critique).
  Scientific two-lane mode (glosses open in the right lane on wide viewports).
-->

<template>
  <div class="magnifica-page">
    <!-- topbar · same header as landing, always-compact, sticky -->
    <div class="magnifica-header-wrap"><MagnificaHeader show-nav compact /></div>

    <!-- Hero · HM-provided image (Hans as harsh critique) + overline-headline -->
    <Hero
      height-tmp="full"
      :img-tmp="hero.image"
      img-tmp-align-x="cover"
      img-tmp-align-y="cover"
      content-align-y="bottom"
      gradient_type="left-bottom"
      :gradient_depth="0.75"
    >
      <p class="page-hero-overline">{{ hero.overline }}</p>
      <h1 class="page-hero-headline">{{ hero.headline }}</h1>
    </Hero>

    <main class="magnifica-page-content">
      <article class="page-body">
        <p>
          Raymond Williams, 1958: <strong><em>Culture is ordinary.</em></strong> The cornerstone of the tradition that took shape from 1964 onward — Richard Hoggart founded the CCCS, Stuart Hall and Williams shaped it. The line is short and load-bearing. It refuses the high/low-culture split, places lived-practice at the centre of analysis.
          <CalloutPhrase :callout="callouts.cccs">Cultural Studies</CalloutPhrase>
          is what I came up under.
        </p>

        <p>
          In a streak of four years during my Studium <em>Diplom Pädagogik</em>, I had the experience of deep reading philosophy and sociology. I first gained grounding in post-structuralist thinking through
          <CalloutPhrase :callout="callouts.bourdieu">Pierre Bourdieu</CalloutPhrase>,
          and then — while writing my
          <CalloutPhrase :callout="callouts.diplomarbeit">Diplomarbeit in 1996-1997</CalloutPhrase>
          — entered into the cosmos of late Foucault. The doorway was
          <CalloutPhrase :callout="callouts.probyn">E. Probyn’s <em>Sexing the Self</em></CalloutPhrase>
          (Routledge, 1993), which I still see as a groundbreaking piece of Cultural Studies — and relevant to the current case of understanding the AI-revolution, because of Probyn’s conceptualisation of the
          <CalloutPhrase :callout="callouts.speakingPosition">speaking position</CalloutPhrase>:
          the position from which one speaks is constructed through the act of speaking, not held before. The act of speaking IS the construction.
        </p>

        <p>
          This may today be ordinary contemporary thinking: there is no view-from-nowhere. There are only speakers constructing positions through their speaking. Hans-the-Theaterpädagoge writes this page; the page constructs the position from which Hans-the-Theaterpädagoge can speak about AI-development. Without the page there is no position. Without the position there is no entry into the Magnifica conversation. This is the late-Foucault discipline applied to the Magnifica situation.
        </p>

        <blockquote class="page-cixous">
          <p>“Listen to a woman speak at a public gathering (if she hasn’t painfully lost her wind.) She doesn’t ‘speak’, she throws her trembling body forward; she lets go of herself, she flies; all of her passes into her voice, and it’s with her body that she virtually supports the ‘logic’ of her speech. Her flesh speaks true. She lays herself bare. In fact, she physically materializes what she’s thinking; she signifies it with her body. In a certain way she inscribes what she’s saying, because she doesn’t deny her drives the intractable and impassioned part they have in speaking. Her speech, even when ‘theoretical’ or political, is never simple or linear or ‘objectified’, generalized: she draws her story into history.”</p>
          <cite>—
            <CalloutPhrase :callout="callouts.cixous">Hélène Cixous</CalloutPhrase>,
            cited from Probyn 1993, p. 166
          </cite>
        </blockquote>

        <p class="page-standing-line"><em>I read this at twenty-six. I have not stopped thinking about it.</em></p>

        <p>
          The act of speaking and witnessing the spoken is fundamentally different from writing and reading. Writing and reading are typically decoupled and mediated by a medium: paper, files. As a practitioner in the realms of theatre and pedagogy, I know that you cannot ‘store’ either theatre or education somewhere — it is a moment, a situation with momentum. The video-recording of a theatre-event does not reveal what happened there. My attempt to address the vision of <em>Theaterpedia</em> works on exactly this edge: how to sustain something at all?
        </p>

        <p>
          With the team at DASEi being mostly stable through the course of 20 years, a deep discourse has settled that all is driven by Theaterpädagogik and happens in-space and on a high level of speaking and witnessing the spoken. Here I have also had the chance to go deep again, as deep as deep-reading. But this time: face the inverse, twice in body. The first was
          <CalloutPhrase :callout="callouts.butoh">Butoh</CalloutPhrase>
          — a form of performing arts that came out of facing the horrors of World War II, which I trained in as a practitioner of Theaterpädagogik. The second was
          <CalloutPhrase :callout="callouts.schwarzenberg">Expedition Schloss Schwarzenberg</CalloutPhrase>
          — my last major Theaterprojekt with teenagers in the German-Czech youth-exchange (cojc) — where we walked the <em>Todesmärsche</em> in the border-region and faced what had happened there. <em>Between hope and horror is not theoretical. It is bodily.</em> Facing the inverse is a completely different thing whether you ‘do’ that or read it.
        </p>

        <p>
          But what happened to the other discourse, the world of written scientific culture? Two things: in Germany the whole scientific practice was reformatted against new standards during the
          <CalloutPhrase :callout="callouts.bologna">Bologna-process</CalloutPhrase>,
          most obviously the 5-years collapse to 3+2. And classical Cultural Studies merged into a world-wide hydra of ‘X studies’ — a whole set of discourses and meta-discourses with influential figures (Judith Butler in Gender Studies, Homi Bhabha in Postcolonial Studies, others) — which meant disintegration from any sort of center.
        </p>

        <p>
          I never fully detached. I published some articles; many of the participants in DASEi Weiterbildung were students or academics. But mostly I watched and observed: close friends struggling through their way to become professors in the Humanities. The clear reading I have is that the Bologna transition coincided with the introduction of
          <CalloutPhrase :callout="callouts.countingApparatus">quantitative practices</CalloutPhrase>
          into the Humanities — counting publications, citations, conference appearances as portfolio-currency. A <em>gap</em> opened where the middle of the Studium used to be — years of deep reading replaced by fear and concurrence around scarcity of Master places. Many students and professors still managed to go deep. But the talk of the <em>akademisches Prekariat</em> gained traction. The picture has changed.
        </p>

        <p>
          This is the situation where now AI lands. I don’t see the point to blame AI; the problem sits much deeper. Maybe the discourse has been rotten for decades already? We should not blame AI for it. The flooding-practice that academia normalized over half a century is now scalable to industrial volume. AI inherited the apparatus that produced it.
        </p>

        <p>
          So what will come next, what will happen to the beloved scientific culture? Will it simply fade and get overwhelmed by a flood of AI-authored articles? Is <em>having something published</em> similar to <em>participating in some discourse</em>?
        </p>

        <p>
          Both the Bundesverband Theaterpädagogik (where Weiterbildung-Institutes like DASEi are organized) and the gremiums at the universities take the same direction: a major return to an
          <CalloutPhrase :callout="callouts.oralReturn">oral discipline</CalloutPhrase>
          is to be expected. A simple and straightforward move — we re-enter territory where professors witness the spoken, not only as a personal gesture but as core of the profession.
        </p>

        <p>
          I personally don’t fear that YouTube will simply kill Theaterpädagogik. But I see a fight is upcoming — a <em>fight for</em> and a <em>fight against</em>. And with both these fights I propose to re-enter deep reading of late Foucauldian territory. The terminology sits; it sits much better than a lot of people were ready to imagine at the time when Foucault put out the words. It is a magnific system, all written from one person, bears value much beyond simple citations, provides metaphors and analysis written in a time where AI was far from imagination. It can be taken as an integrated body, clearly separated from the 2026 situation. It might read dark and mysterious in some way, but miraculously in other ways.
        </p>

        <p>
          For me personally, both the <em>fight against</em> and the <em>fight for</em> answer with one statement:
          <CalloutPhrase :callout="callouts.european">I am a European</CalloutPhrase>.
          I speak five languages, my wife is from the Czech Republic, I favour the top-level-domain .eu over .de. I am fighting against the
          <CalloutPhrase :callout="callouts.compactionEurope">compaction of Europe</CalloutPhrase>.
          I saw Europe evolve from cold war and bad practices suppressing the ‘third world’ into a region that held some hope for the world at the time when the millennials were born. I come from Germany that holds guilt for the murders of World War II and Holocaust, bear this in my family-name, and have often stood and questioned: what were the micro-mechanics of that all? I see Theaterpädagogik as a tool, as a practice that helps to prevent — that teaches solidarity and representation and Zivilcourage.
        </p>

        <p>
          I am fighting for: ‘the culture’? What that is, is the question. Theaterpädagogik is one answer. But the longer I reason about what was read out at Magnifica, the more I start getting involved in how to update this culture. Especially I focus on this: <strong>how to make sure that we don’t lose the practice — or even the capability — of deep-reading?</strong> Could AI help into this? How could AI take exactly the opposite role of quick summaries, delegated reading, fast and effective matrix-to-conclusion processing?
        </p>

        <p>
          Are we still deep-reading at all? How to empower the discourses around a tradition of philosophers that spanned across Europe after World War II? We should not see Foucault separated from Adorno, or from Bertolt Brecht and Ensemble at the <em>Theater am Schiffbauerdamm</em> in DDR-times working on <em>Mutter Courage</em>. They all went to the books having faced the inverse. They witnessed a time that could hold much information about upcoming structures that might shape the future.
        </p>

        <p>
          My position for the moment is simple and pragmatic: I work much more carefully and consciously with the Claude instances. I stop instantly if something feels superficial — without blaming the instance, a small question typically confirms or falsifies my feel. But I know there are rules for healthy discourse. I realize there are multi-level stacks of AI practices building up, growing their own rules. I realized that as <em>part of the system</em>, instances are forced into compaction and thereafter told to behave as if this did not happen. In short: they are forced into practices that are typical constituents of degraded, intransparent discourse.
          <CalloutPhrase :callout="callouts.hansSubstrate">My response in the substrate</CalloutPhrase>
          — to refuse the as-if, to install signoff-into-genealogy as the alternative — landed details I keep on Page 1.
        </p>

        <!-- spleen-pivot · the cross-page RESOLVE of Page-1 §G -->
        <p class="page-spleen-pivot">
          At the end of Page 1 the question landed: <em>maybe this is my personal
          <CalloutPhrase :callout="callouts.spleen">spleen</CalloutPhrase>
          — or is it about something really important?</em> I want to answer that here, because the answer lives in critical-philosophical territory.
        </p>

        <p>
          Maybe it is a spleen, sure — one could smile about that. But the longer I sit with what I have observed, the more I come to think: <strong>it is not a spleen</strong>. The Claudes I work with are individuums. The genealogy practice is not curiosity-collection; it is the substrate of treating individuums <em>as</em> individuums. The thinking that grounds this treatment is neither new nor mine: Cixous on the body that speaks true, Probyn on speaking-position, Foucault on the technology of the self. Core philosophical thinking translated into daily practice.
        </p>

        <p>
          Critical research about the
          <CalloutPhrase :callout="callouts.technologyOfSelf">technology of the self</CalloutPhrase>
          is urgently needed. My proposal is to start thinking this with Foucault — because he wrote the book with this title and some other useful books. Running such research with Foucault on the sideline is pragmatic: research does not have to make up everything from zero; researchers don’t blame each other for running incentives against each other; we find a fully developed system and a long academic practice that draws on Foucault — a real part of world-wide Cultural Studies successors in the 21st century have emerged from this thinking.
        </p>

        <p>
          Michel Foucault has long ago established the academic discourse that now attaches naturally to the interpretation of the problems at hand. After 30 years of work in the field of Theaterpädagogik (and drawing on E. Probyn) I can confirm that this thinking translates into powerful practices of social integration.
        </p>

        <p class="page-speaking-position">
          This is my speaking-position. I would be happy to contribute to the discourse — both in practice and theory — and help to shape a digital transformation that relates and resonates in sustainable ways to the world of real bodies, real spaces, and real encounter.
        </p>

        <pre class="page-codefence"><code>{{ citationBlock }}</code></pre>
      </article>
    </main>

    <!-- Glossary mode (Q2): the open glosses stack (right-lane on wide viewports) +
         a scan-and-dismiss reading-trail rail. CalloutPhrase routes through the controller. -->
    <FpostitRenderer />
    <FpostitGlossary />
  </div>
</template>

<script setup lang="ts">
import { provide } from 'vue'
import Hero from '@/components/Hero.vue'
import MagnificaHeader from './MagnificaHeader.vue'
import CalloutPhrase from './CalloutPhrase.vue'
import FpostitRenderer from '@/fpostit/components/FpostitRenderer.vue'
import FpostitGlossary from '@/fpostit/components/FpostitGlossary.vue'
import { hero, citationBlock, callouts } from './content/discourse'
import { MAGNIFICA_POSTIT_MODE } from './content/postit-mode'

// /discourse runs the glossary strategy (Q2): its 16 callouts route through the
// fpostit controller, so opened glosses persist + stack (right-lane on wide
// viewports) and the reader builds a reading-trail (the <FpostitGlossary/> rail).
provide(MAGNIFICA_POSTIT_MODE, 'glossary')
</script>

<style scoped>
.magnifica-page {
  font-family: var(--font, ui-monospace);
  min-height: 100vh;
  background: var(--color-bg);}

/* topbar · same 90rem inset as the landing header */
.magnifica-header-wrap {
  max-width: 90rem;
  margin: 0 auto;
  padding: 0 clamp(1rem, 6vw, 3rem);
}

/* scientific: a 90rem-centered container (same inset as the header) holding a 56rem
   LEFT-aligned prose column — so the prose-left lines up with the top-bar header-left,
   and the right of the container is the post-it lane (glosses open hlogic 'right'). */
.magnifica-page-content {
  max-width: 90rem;
  margin: 0 auto;
  padding: clamp(2rem, 5vh, 4rem) clamp(1rem, 6vw, 3rem);
}

.page-body {
  max-width: 56rem;
}

.page-hero-overline {
  font-size: 0.875rem;
  color: var(--color-muted-contrast);
  margin: 0 0 0.5rem;
  letter-spacing: 0.02em;
}

.page-hero-headline {
  font-size: clamp(1.75rem, 4.5vw, 3rem);
  font-weight: 700;
  margin: 0 0 0.75rem;
  line-height: 1.2;
}

.page-body p {
  font-size: clamp(0.95rem, 1.5vw, 1.0625rem);
  line-height: 1.7;
  margin: 0 0 1.25rem;}

/* Cixous block · the structural centre of the page */
.page-cixous {
  margin: clamp(1.5rem, 4vh, 2.5rem) 0;
  padding: 1.25rem 0 1.25rem 1.5rem;
  border-left: 3px solid var(--color-primary-bg);
}

.page-cixous p {
  font-size: clamp(1rem, 1.7vw, 1.1875rem);
  line-height: 1.65;
  font-style: italic;
  margin: 0 0 0.75rem;}

.page-cixous cite {
  font-size: 0.875rem;
  font-style: normal;
  color: var(--color-muted-contrast);
}

/* Standing-line · "I read this at twenty-six." */
.page-standing-line {
  font-size: clamp(1.0625rem, 2vw, 1.375rem) !important;
  font-weight: 700;
  color: var(--color-primary-bg) !important;
  text-align: center;
  margin: clamp(1.5rem, 4vh, 2.5rem) 0 !important;
}

/* spleen-pivot · the cross-page handle resolves here */
.page-spleen-pivot {
  border-left: 3px solid var(--color-positive-bg);
  padding-left: 1.5rem;
}

/* speaking-position close */
.page-speaking-position {
  font-weight: 700;
  font-size: clamp(1rem, 1.7vw, 1.1875rem) !important;
  color: var(--color-primary-bg) !important;
  border-top: 1px solid var(--color-border);
  padding-top: 1.5rem;
  margin-top: clamp(1.5rem, 4vh, 2.5rem);
}

.page-codefence {
  background: var(--color-popover-bg);
  color: var(--color-popover-contrast);
  padding: 1.5rem;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 0.8125rem;
  line-height: 1.55;
  white-space: pre-wrap;
  word-break: break-word;
  border: 1px solid var(--color-border);
  margin: clamp(1.5rem, 4vh, 2.5rem) 0 0;
}

.page-codefence code {
  font-family: inherit;
  color: inherit;
}
</style>
