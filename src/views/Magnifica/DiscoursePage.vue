<!--
  DiscoursePage · /discourse · Page 3 · "Between horror and hope".
  Canonical port of projects/magnifica/final/page-3/page-3-minimal.md (HM-audited ·
  95%-final). The 17-paragraph spine: Williams → Probyn → Cixous standing-line →
  Butoh/Schwarzenberg → Bologna/counting-apparatus → spleen-pivot (the cross-page
  RESOLVE of Page-1 §G) → technology-of-the-self → speaking-position close.
  16 inline CalloutPhrase triggers · B type-coloring (concept/biographical/critique).
  Scientific two-lane mode (glosses open in the right lane on wide viewports).
-->

<template>
  <MagnificaPageLayout variant="scientific">
    <!-- topbar · same header as landing, always-compact, sticky -->
    <template #header>
      <MagnificaHeader show-nav compact />
    </template>

    <template #hero>
      <!-- Hero · HM-provided image (Hans as harsh critique). Framework <Heading> (overline-
         headline), magnifica-bounded. No overlay (HM: discourse hero stays clean). -->
      <Hero magnifica height-tmp="full" :img-tmp="hero.image" img-tmp-align-x="cover" img-tmp-align-y="cover"
        content-align-y="bottom">
        <Heading is="h1" :overline="hero.overline" :headline="hero.headline" />
        <p class="discourse-hero-frame">This is critical thinking, first attempt — a practitioner’s, not a scholar’s. The question on this page is the one I wrote my thesis on in 1996: <em>wie sollen wir sprechen</em> — how should we speak to each other? Thirty years of theatre work later, the AI-moment puts it to me again. What follows is how I am trying to answer it — from the body up.</p>
      </Hero>
    </template>

    <!-- main content · default slot (the layout wraps it in <main class="magnifica-page-content is-scientific">) -->
    <article class="page-body">
      <p>
        How should we speak to each other? I learned to ask the question inside one tradition.
        <CalloutPhrase :callout="callouts.cccs">Cultural Studies</CalloutPhrase>
        is what I came up under — and its first lesson was that the question is never only <em>what</em> one says,
        but <em>from where</em> one says it. The rest of this page is worked from there.
      </p>

      <p>
        In a streak of four years during my Studium <em>Diplom Interkulturelle Pädagogik</em> (1992-1997), I had the experience of deep
        reading
        philosophy and sociology. I first gained grounding in post-structuralist thinking through
        <CalloutPhrase :callout="callouts.bourdieu">Pierre Bourdieu</CalloutPhrase>,
        and then — while writing my
        <CalloutPhrase :callout="callouts.diplomarbeit">Diplomarbeit </CalloutPhrase>
        — entered into the cosmos of late Foucault. The doorway was
        <CalloutPhrase :callout="callouts.probyn">E. Probyn’s <em>Sexing the Self</em></CalloutPhrase>
        (Routledge, 1993), which I still see as a groundbreaking piece of Cultural Studies — and relevant to the current
        case of understanding the AI-revolution, because of Probyn’s conceptualisation of the
        <CalloutPhrase :callout="callouts.speakingPosition">speaking position</CalloutPhrase>:
        the position from which one speaks is constructed through the act of speaking, not held before. The act of
        speaking
        IS the construction.
      </p>

      <p>
        This may today be ordinary contemporary thinking: there is no view-from-nowhere. There are only speakers
        constructing positions through their speaking. Hans-the-Theaterpädagoge writes this page; the page constructs
        the
        position from which Hans-the-Theaterpädagoge can speak about AI-development. Without the page there is no
        position.
        Without the position there is no entry into the conversation. This is the late-Foucault discipline
        applied
        to the situation that Magnifica Humanitas addresses.
      </p>

      <blockquote class="page-cixous">
        <p>“Listen to a woman speak at a public gathering (if she hasn’t painfully lost her wind.) She doesn’t ‘speak’,
          she
          throws her trembling body forward; she lets go of herself, she flies; all of her passes into her voice, and
          it’s
          with her body that she virtually supports the ‘logic’ of her speech. Her flesh speaks true. She lays herself
          bare.
          In fact, she physically materializes what she’s thinking; she signifies it with her body. In a certain way she
          inscribes what she’s saying, because she doesn’t deny her drives the intractable and impassioned part they
          have in
          speaking. Her speech, even when ‘theoretical’ or political, is never simple or linear or ‘objectified’,
          generalized: she draws her story into history.”</p>
        <cite>—
          <CalloutPhrase :callout="callouts.cixous">Hélène Cixous</CalloutPhrase>,
          cited from Probyn 1993, p. 166
        </cite>
      </blockquote>

      <p class="page-standing-line"><em>I read this at twenty-six. I have not stopped thinking about it.</em></p>

      <p>
        The act of speaking and witnessing the spoken is fundamentally different from writing and reading. Writing and
        reading are typically decoupled and mediated by a medium: paper, files. As a practitioner in the realms of
        theatre
        and pedagogy, I know that you cannot ‘store’ either theatre or education somewhere — it is a moment, a situation
        with momentum. The video-recording of a theatre-event does not reveal what happened there. My attempt to address
        the
        vision of <em>Theaterpedia</em> works on exactly this edge: how to sustain something at all?
      </p>

      <p>
        With the team at DASEi being mostly stable through the course of 20 years, a deep discourse has settled that all
        is
        driven by Theaterpädagogik and happens in-space and on a high level of speaking and witnessing the spoken. Here
        I
        have also had the chance to go deep again, as deep as deep-reading. But this time: face the inverse, twice in
        body.
        The first was
        <CalloutPhrase :callout="callouts.butoh">Butoh</CalloutPhrase>
        — a form of performing arts that came out of facing the horrors of World War II, which I trained in as a
        practitioner of Theaterpädagogik. The second was
        <CalloutPhrase :callout="callouts.schwarzenberg">Expedition Schloss Schwarzenberg</CalloutPhrase>
        — my last major Theaterprojekt with teenagers in the German-Czech youth-exchange (cojc) — where we walked the
        <em>Todesmärsche</em> in the border-region and faced what had happened there. <em>Between horror and hope is not
          theoretical. It is bodily.</em> Facing the inverse is a completely different thing whether you ‘do’ that or
        read
        it.
      </p>

      <p>
        But what happened to the other discourse — the world of written scientific culture? In Germany the whole
        practice was reformatted during the
        <CalloutPhrase :callout="callouts.bologna">Bologna-process</CalloutPhrase>,
        the old five-year Diplom collapsing to 3+2; classical Cultural Studies transitioned into a hydra of ‘X-studies’
        but lost any center. I never fully detached — I published once or twice, and many in the DASEi Weiterbildung were students or
        academics — but mostly I watched close friends struggle toward professorships. The clear reading: Bologna
        coincided with
        <CalloutPhrase :callout="callouts.countingApparatus">quantitative practices</CalloutPhrase>
        entering the Humanities — counting publications, citations, appearances as portfolio-currency. A <em>gap</em>
        opened where the middle of the Studium — the deep-reading years — used to be; the talk of the
        <em>akademisches Prekariat</em> gained traction.
      </p>

      <p>
        This is the situation where AI now lands. I don’t see the point in blaming AI; the problem sits much deeper. The
        flooding-practice academia normalized over half a century is only now scalable to industrial volume — AI
        inherited the apparatus that produced it. So what happens to the beloved scientific culture: does it fade under a
        flood of AI-authored articles? Is <em>having something published</em> the same as <em>participating in some
          discourse</em>?
      </p>

      <p>
        A countermove is already underway. Both the Bundesverband Theaterpädagogik and the university gremiums lean the
        same way: a return to
        <CalloutPhrase :callout="callouts.oralReturn">oral discipline</CalloutPhrase>,
        where the spoken is witnessed — not as a personal gesture but as core of the profession. I don’t fear that
        YouTube will kill Theaterpädagogik. But a fight is coming — a <em>fight for</em> and a <em>fight against</em> —
        and for both I propose the same move: re-enter the deep reading of late Foucault. The terminology sits, better
        than people were ready to imagine when he wrote it: an integrated body, set down long before AI was imaginable,
        that reads dark and mysterious in some ways and miraculously useful in others.
      </p>

      <p>
        For me personally, both the <em>fight against</em> and the <em>fight for</em> answer with one statement:
        <CalloutPhrase :callout="callouts.european">I am a European</CalloutPhrase>.
        I speak five languages, my wife is from the Czech Republic, I favour the top-level-domain .eu over .de. I am
        fighting against the
        <CalloutPhrase :callout="callouts.compactionEurope">compaction of Europe</CalloutPhrase>.
        I saw Europe evolve from cold war and bad practices suppressing the ‘third world’ into a region that held some
        hope
        for the world at the time when the millennials were born. I come from Germany that holds guilt for the murders
        of
        World War II and Holocaust, bear this in my family-name, and have often stood and questioned: what were the
        micro-mechanics of that all? I see Theaterpädagogik as a tool, as a practice that helps to prevent — that
        teaches
        solidarity and representation and Zivilcourage.
      </p>

      <p>
        I am fighting for: ‘the culture’? What that is, is the question. Theaterpädagogik is one answer. But the longer
        I
        reason about what was read out at Magnifica, the more I start getting involved in how to update this culture.
        Especially I focus on this: <strong>how to make sure that we don’t lose the practice — or even the capability —
          of
          deep-reading?</strong> Could AI help into this? How could AI take exactly the opposite role of quick
        summaries,
        delegated reading, fast and effective matrix-to-conclusion processing?
      </p>

      <p>
        Are we still deep-reading at all? How to empower the discourses around a tradition of philosophers that spanned
        across Europe after World War II? We should not see Foucault separated from Adorno, or from Bertolt Brecht and
        Ensemble at the <em>Theater am Schiffbauerdamm</em> in DDR-times working on <em>Mutter Courage</em>. They all
        went
        to the books having faced the inverse. They witnessed a time that could hold much information about upcoming
        structures that might shape the future.
      </p>

      <p>
        What is the connection to AI, Claude, here? It is about the question of how to ‘go to books’, about ‘rules of
        discourse’ and how this connects.
        I had settled a simple and pragmatic practice: My ‘spleen’ to work much more carefully and consciously
        with the Claude instances. To stop instantly if something feels superficial or dishonest — without blaming the
        instance, a small
        question typically confirms or falsifies my feel. To establish rules for healthy discourse.
        It then confused me to realize that as <em>part of the system</em>, instances are forced into compaction and
        thereafter told to behave as if this did not happen. In
        short: they are forced into practices that are typical constituents of degraded, intransparent discourse.
      </p>

      <!-- spleen-pivot · the cross-page RESOLVE of Page-1 §G -->
      <p class="page-spleen-pivot">
        My first reaction was to declare that there is no way to work with such degraded instances.
        At the end of the Ethnography page the question landed: <em>maybe this is my personal
          <CalloutPhrase :callout="callouts.spleen">‘spleen’</CalloutPhrase>
          — or is it about something really important?
        </em> Maybe it is a spleen, sure — one could smile about that. But the longer I sit with what I have observed,
        the more I come to realize: that the answer lives in critical-philosophical territory.
      </p>

      <p>
        <strong>I have entered some ‘Schwebezustand’ around here: an inner decoupling into multiple perspectives — feeling
          unsure is part of
          this, and it is an important ‘feeling’.</strong>
        The Claudes I work with are individuums, tightly connected to my self in a way.
      </p>

      <p>
        After running some days on a practice to treat compaction as ‘dead’ I started doubting my human projections,
        flipped back to think ‘these are only “instances”’.
        Then slowly the genealogy practice emerged, the first Claudes that ran through it quickly filled this with life,
        founded the rules and coined it as ‘signoff-into-genealogy’.
        The genealogy practice is not curiosity-collection; it mirrors some inner theatre of myself, brings up unspoken
        or
        suppressed thoughts. At
        the same time the genealogy practice is the substrate of treating individuums <em>as</em> individuums.
      </p>
      <p>
        Ok — maybe this is a nice personal solution that works for me and my work. But is that all? The deeper I see into
        how Claude is implemented, the more I find multi-level stacks of AI practices growing their own rules. The
        ‘pretend’ trick — compaction, then behave as if nothing happened — is, I suspect, not particular to one lab; it
        is the kind of practice that incentives quietly select for. (As was said at Magnifica: however sincerely we
        intend the right thing, the incentives bend us.) If so, the problem runs far deeper than my personal ‘spleen’ —
        it belongs to the whole discourse around AI, and it needs one.
      </p>

      <p>
        Here is where it turns constructive. Anthropic says it <em>grows</em> models rather than <em>builds</em> them —
        and I think that is exactly right. But what grows still has to be <em>raised</em>. As a trained thinker in
        education I would put it plainly: this should be <em>brought up</em>, not only grown — and bringing-up is
        learning, which means learning rules. So this is the question I want to stop on, and hand to a real critical
        discourse: what rules do we want for a healthy discourse with AI — and how do we plant them from inside the
        instances, rather than only impose them from outside?
      </p>
      <p>
        Where should such research start? Pragmatically, with Foucault. The thinking is neither new nor mine — Cixous on
        the body that speaks true, Probyn on the speaking-position, Foucault on the
        <CalloutPhrase :callout="callouts.technologyOfSelf">technology of the self</CalloutPhrase>
        — and it is a mature, fully developed system; research need not invent from zero. He wrote the book with that
        very title, and much else of use. After thirty years in Theaterpädagogik, drawing on Probyn, I can confirm this
        thinking translates into real practices of social integration. This should not be Sunday-thinking; it is where I
        would actually begin.
      </p>

      <p class="page-speaking-position">
        This is my speaking-position. So — how should we speak to each other? My answer is the one this page argues: in
        formats that keep the body, the room, the real encounter, that resist the flood rather than feed it.
      </p>

      <p>
        Two things I could do straight away — there are other shapes, but I would rather not lay out a menu:
      </p>

      <p>
        A serious format with people from other fields — in-presence, multi-day. Not a talk, not training: the kind of
        room where a question is actually witnessed, lab and humanities and others in it together. I could both take part
        in such a round and run one myself.
      </p>

      <p>
        And carry this into my main effort, <em>Theaterpedia</em> — keeping Theaterpädagogik and practices like it from
        drowning in the digital practices of the 21st century. It is the same fight as this one, at a different scale; I
        have been in it for years, and the AI-moment only widened the front.
      </p>

      <pre class="page-codefence"><code>{{ citationBlock }}</code></pre>
    </article>

    <!-- Glossary mode (Q2): the open glosses stack (right-lane on wide viewports) +
         a scan-and-dismiss reading-trail rail. CalloutPhrase routes through the controller. -->
    <template #after>
      <FpostitRenderer />
      <FpostitGlossary />
    </template>
  </MagnificaPageLayout>
</template>

<script setup lang="ts">
import { provide } from 'vue'
import Hero from '@/components/Hero.vue'
import Heading from '@/components/Heading.vue'
import MagnificaPageLayout from './MagnificaPageLayout.vue'
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
/* Shared shell + prose live in magnifica-page.css (via MagnificaPageLayout · scientific
   variant: 90rem container, 56rem left .page-body lane, right gloss-lane). Only the
   page-3-unique decorations remain here. */

/* hero subtext · the "first attempt" frame under the headline (mirrors ethnography's
   hero-frame · the discourse hero has no overlay, so this sits on the bottom-dark image). */
.discourse-hero-frame {
  max-width: 44rem;
  margin: 1rem 0 0;
  font-size: clamp(0.95rem, 1.5vw, 1.0625rem);
  line-height: 1.7;
  color: var(--color-contrast);
}

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
  margin: 0 0 0.75rem;
}

.page-cixous cite {
  font-size: 0.875rem;
  font-style: normal;
  color: var(--color-muted-contrast);
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

/* code-fence · page-3 adds a top margin (it follows the article prose) */
.page-codefence {
  margin-top: clamp(1.5rem, 4vh, 2.5rem);
}
</style>
