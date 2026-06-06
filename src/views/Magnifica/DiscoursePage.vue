<!--
  FoucaultPage · /foucault · Page 3 of cand-1a · "Between hope and horror".
  Per candidate-1a/page-3-foucault.md (v1.0). The speaking-position move + harsh-critique
  layer; Twabu (2024) as scholarly anchor; critique-target is the academic-and-AI
  counting-apparatus (systemic, not Anthropic-specific). 10 inline CalloutPhrase triggers
  (c-fou-1..10; apparatus reused in §2 + §6) + the closing citation code-fence.
-->

<template>
  <div class="magnifica-page">
    <TopNav :items="navItems" navbar-mode="page" scroll-style="simple">
      <template #actions>
        <MagnificaLogoutButton />
      </template>
    </TopNav>

    <!-- Hero · HM-provided per-page image (relay 2026-06-06) + overline-headline -->
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
      <!-- §1 · joining a conversation already underway -->
      <section class="page-section">
        <h2 class="page-section-heading">Joining a conversation already underway</h2>
        <p>
          Foucauldian critique of AI is not a novel claim.
          <CalloutPhrase :callout="callouts.twabu">Khanyisile Twabu's <em>“Unveiling Power Dynamics in AI-Enabled Education: A Foucauldian Perspective”</em></CalloutPhrase>
          (<em>Annals of the University of Craiova</em>, 2024) applies governmentality, biopower, disciplinary power, and the Panopticon to AI-deployment in educational systems. The deployment is rigorous; the critique is sharp; the alliance with practitioners is explicit. The paper is one of a small-but-growing body of work bringing the late-Foucault toolkit to bear on what AI is doing to knowledge-distribution, power-asymmetry, and self-formation.
        </p>
        <p>This page joins that conversation from a different speaking-position: a practitioner positioned outside the academic-counting-apparatus, with three decades of Theaterpädagogik-grounded praxis, in conversation now with what Anthropic is itself making visible.</p>
      </section>

      <!-- §2 · the Olah-to-Foucault bridge -->
      <section class="page-section">
        <h2 class="page-section-heading">The Olah-to-Foucault bridge</h2>
        <p>
          Your argument at the Vatican about
          <CalloutPhrase :callout="callouts.incentiveStructures">incentive structures defeating individual virtue</CalloutPhrase>
          is, in Twabu's deployment of Foucault, an
          <CalloutPhrase :callout="callouts.apparatus">apparatus-claim</CalloutPhrase>.
          The frontier AI lab as a <em>dispositif</em> — a structure producing specific subject-positions, specific knowledge-distributions, specific defeat-of-individual-virtue regardless of any particular engineer's intent. <em>Discernment</em> is the Pope's word, the encyclical's word — and you picked it up cautiously. Foucault's word for the same operation is
          <CalloutPhrase :callout="callouts.speakingPosition">speaking position</CalloutPhrase>.
          The question is the same: <em>from where is one entitled to speak about what?</em>
        </p>
        <p>This artefact is one answer. The speaking-position it claims is not academic-credential. It is thirty years of structurally-outside-the-apparatus practice. That is what makes the response a <em>response</em> rather than another opinion.</p>
      </section>

      <!-- §3 · the conceptual toolkit -->
      <section class="page-section">
        <h2 class="page-section-heading">The conceptual toolkit</h2>
        <p>Twabu's paper deploys four Foucauldian concept-clusters that I find directly applicable to thinking about AI-as-apparatus:</p>
        <p><strong>Governmentality</strong> — the logical, methodical, and strategic aspects of governance, including how institutions and populations are governed through practices and discourses, not just formal laws. Applied to AI: OECD-style institutional shaping of AI-deployment; educational systems governing student-behaviour through algorithmic mediation.</p>
        <p><strong><CalloutPhrase :callout="callouts.biopower">Biopower</CalloutPhrase></strong> — the methods by which institutions govern the lives and physical structures of populations. Applied to AI: algorithmic regulation of learner-experiences via observation, regulation, and moulding. The shaping happens at the level of habitus, not at the level of explicit rule.</p>
        <p><strong><CalloutPhrase :callout="callouts.disciplinaryPower">Disciplinary power</CalloutPhrase></strong> — techniques of instruction, monitoring, and standardisation that produce particular kinds of subjects. Applied to AI: LMS analytics, proctoring, grading-algorithms produce <em>measured students</em> — students whose dimensions are exactly those the apparatus can measure.</p>
        <p><strong><CalloutPhrase :callout="callouts.panopticon">Panopticon</CalloutPhrase></strong> — Bentham's prison architecture as analogy: surveillance that operates because the surveilled cannot tell when they are being watched. Applied to AI: VR-environment monitoring, drone surveillance, automated proctoring — and, by extension, the constant-readability of digital lives to systems that can read at scale.</p>
        <p>Plus secondary deployments: <em>discourse and truth</em> (how AI-driven narratives shape what counts as known) and <em>technologies of the self</em> (how immersive AI environments shape identity and agency).</p>
        <p>These are not categories I deploy on Anthropic. They are categories I notice operating across <em>the apparatus that academia and AI labs share</em>. Your speech said as much, in a different vocabulary, last week.</p>
      </section>

      <!-- §4 · the critique that returns the conversation to you -->
      <section class="page-section page-section--flooding">
        <h2 class="page-section-heading">The critique that returns the conversation to you</h2>
        <p>Here is the move I make with this vocabulary, as practitioner-from-outside:</p>
        <p>
          Long before AI, the academic apparatus established a practice of
          <CalloutPhrase :callout="callouts.counting">quantitative counting</CalloutPhrase>.
          Articles, books, conference talks tallied as portfolio-currency. Departments measured on output-volume. Tenure decided by citation-counts. Whole careers shaped by what can be counted vs. what cannot. The discipline of <em>reading-deeply-and-understanding-an-author-before-citing</em> became expensive overhead; the discipline of <em>citing-bullets-from-secondary-sources</em> became cheap and rewarded.
        </p>
        <p>This produced an ocean of secondary citations in which nobody knows the primary sources anymore. The apparatus-shape — count-as-quality, output-as-success, surface-as-substance — was operational decades before AI.</p>
        <p class="page-flooding-hinge">AI inherited that apparatus.</p>
        <p>Models are trained on the surface-citations because surface-citations are what was published; the apparatus they reproduce is the one that produced them. The flooding-practice that academia normalized over half a century is now scalable to industrial volume. We do not need to <em>train</em> AI to do this. The apparatus already did the training.</p>
        <p><strong>This is not a critique of Anthropic.</strong> This is the apparatus your Vatican remarks themselves named — and the apparatus your engineers are inside even when their individual judgment would do otherwise. It is the apparatus my own Theaterpädagogik training taught me to recognize. It is the apparatus from which a different speaking-position becomes valuable — <em>because it is from outside the counting-pressure that the counting-practices can be seen for what they are</em>.</p>
        <p>The critique is generous toward you specifically. Sharing-the-frustration. The target is structural; the target is what the encyclical itself named.</p>
      </section>

      <!-- §5 · the biographical anchor -->
      <section class="page-section">
        <h2 class="page-section-heading">How I came to this position · the biographical anchor</h2>
        <p>
          I was 24 in 1996. Writing my Diplomarbeit — a 170-page piece on Cultural Studies and the late Foucault.
          <CalloutPhrase :callout="callouts.professors">Three professors at the sideline</CalloutPhrase>
          — Marianne Walther von Loebenstein, Hartmut Engelmann, Jürgen Münch — did what professors sometimes do: witnessed my moves, interested but distanced, then read it through and concluded in their own ways, like an oracle.
        </p>
        <p>The most important message I received: <em>yes, go on, devote your life to this.</em> One of them went further: <em>your performance impresses; it also worries. This would be a good ticket for a scientific career. First, spend ten years in praxis. Experience yourself performing. Then decide.</em> I took the advice. Checked twice whether to depart back-to-theory, for a variety of reasons decided to go on with praxis.</p>
        <p>I have been doing grounded theory all the time.</p>
        <p>What I read deeply during that year: <strong>E. Probyn's <em>Sexing the Self</em></strong>. Probyn introduced me to the late Foucault — specifically to the <em>speaking-position</em> concept that the entire Cultural Studies tradition (after Hall, after Probyn) made operational. The point is not that disclosure-of-position is humility. The point is that <em>position-shapes-what-can-be-said</em> — and that critical practice begins with recognizing-from-where-one-speaks.</p>
        <p>
          I have spent thirty years inside the praxis the professors recommended. As a practitioner of Theaterpädagogik I have experienced <em>Butoh</em> — the form of performing arts that came out of facing the horrors of World War II. My last large <em>Theaterprojekt</em> with teenagers in the German-Czech youth exchange (cojc) was
          <CalloutPhrase :callout="callouts.expedition">Expedition Schloss Schwarzenberg</CalloutPhrase>
          — where I finally had the courage to walk the <em>Todesmärsche</em> and face what has happened in the German-Czech border-region. Most of my life is optimistic, positive, creative. But the <em>between hope and horror</em> of post-war Europe — the substrate Foucault and Bourdieu and Adorno and Sartre worked from — is the substrate my generation now works with from the other side of the temporal arc.
        </p>
        <p>We had the books. We have different times. Maybe somewhere <em>between hope and horror</em> — but the direction of the arrow is no longer obvious.</p>
        <p>This is the speaking-position from which the rest of this artefact is offered.</p>
      </section>

      <!-- §6 · sources and disclaimer -->
      <section class="page-section">
        <h2 class="page-section-heading">Sources and disclaimer</h2>
        <p>This page does not meet standards of scientific work. The Foucauldian-AI literature is alive — Twabu (2024) is one entry-point; further research with prompts like <em>poststructuralism and the AI-transformation</em> surfaces more. The conversation continues.</p>
        <p><strong>Foucauldian terminology</strong> (entry-points; click each for definition + application):</p>
        <ul class="page-list">
          <li><CalloutPhrase :callout="callouts.apparatus">apparatus / dispositif</CalloutPhrase> · the structure producing subject-positions</li>
          <li><em>discourse</em> · the linguistic-conceptual systems shaping what counts as truth</li>
          <li><em>technology of the self</em> · the practices through which subjects shape themselves</li>
          <li><em>archeology</em> · the method of recovering the conditions of possibility for a given discourse</li>
        </ul>
        <p>These four open up much of the analytical-handle space. Combined with Hall's <em>articulation theory</em> (signaled in the page-zero unlock-Beat-2) and Probyn's <em>speaking position</em>, the toolkit is sufficient for the kind of critical-engagement this page is asking for.</p>
        <p><strong>The disclaimer is real and the disclaimer is the move</strong>. I am not establishing myself as a Foucault-knower. My academic knowledge of him is outdated. I went the practitioners way. <strong>The outdated-academic-knowledge becomes virtue when paired with three decades of structurally-positioned practice</strong>. That is the speaking-position the entire artefact is offered from.</p>
      </section>

      <!-- §7 · the page ends, the conversation begins -->
      <section class="page-section page-section--closing">
        <h2 class="page-section-heading">The page ends, the conversation begins</h2>
        <p>Cultural Studies and Michel Foucault were lived lives in post-war Europe, somewhere between horror and hope. Lived lives that went to the books. We now have the books and we have different times — maybe somewhere between hope and horror?</p>
        <p>The substrate that produced those books continues into the substrate that produces this page. The bridge runs both ways. Whatever this becomes — workshop, consultation, partnership, EU-collaboration, none of those — the conversation is what gets built.</p>
        <pre class="page-codefence"><code>{{ citationBlock }}</code></pre>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { provide } from 'vue'
import Hero from '@/components/Hero.vue'
import TopNav from '@/components/TopNav.vue'
import MagnificaLogoutButton from './MagnificaLogoutButton.vue'
import CalloutPhrase from './CalloutPhrase.vue'
import { navItems } from './content/nav'
import { hero, citationBlock, callouts } from './content/discourse'
import { MAGNIFICA_POSTIT_MODE } from './content/postit-mode'

// /discourse is the scientific page: its ~10-16 callouts open in the right lane
// (two-lane close-reading) on wide viewports. The other pages default to 'playful'.
provide(MAGNIFICA_POSTIT_MODE, 'scientific')
</script>

<style scoped>
.magnifica-page {
  font-family: ui-monospace, "JetBrains Mono", "Cascadia Code", Menlo, Consolas, monospace;
  min-height: 100vh;
  background: #1a1a1a;
  color: #f4f4f4;
}

.magnifica-page-content {
  max-width: 56rem;
  margin: 0 auto;
  padding: clamp(2rem, 5vh, 4rem) clamp(1rem, 5vw, 2rem);
}

.page-hero-overline {
  font-size: 0.875rem;
  color: #aaa;
  margin: 0 0 0.5rem;
  letter-spacing: 0.02em;
}

.page-hero-headline {
  font-size: clamp(1.75rem, 4.5vw, 3rem);
  font-weight: 700;
  margin: 0 0 0.75rem;
  line-height: 1.2;
}

.page-section {
  margin: 0 0 clamp(2rem, 4vh, 3.5rem);
}

.page-section-heading {
  font-size: clamp(1.25rem, 2.5vw, 1.75rem);
  font-weight: 700;
  margin: 0 0 1rem;
  color: var(--color-primary-bg);
}

.page-section p {
  font-size: clamp(0.95rem, 1.5vw, 1.0625rem);
  line-height: 1.7;
  margin: 0 0 1rem;
  color: #e8e8e8;
}

.page-section p:last-child {
  margin-bottom: 0;
}

.page-list {
  font-size: clamp(0.95rem, 1.5vw, 1.0625rem);
  line-height: 1.7;
  color: #e8e8e8;
  padding-left: 1.5rem;
  margin: 0 0 1rem;
}

.page-list li {
  margin-bottom: 0.5rem;
}

.page-section--flooding {
  background: rgba(255, 238, 0, 0.05);
  border-left: 3px solid var(--color-primary-bg);
  padding: 1.25rem 1.5rem;
  border-radius: 4px;
}

.page-flooding-hinge {
  font-size: clamp(1.0625rem, 1.8vw, 1.25rem) !important;
  font-weight: 700;
  color: var(--color-primary-bg) !important;
}

.page-codefence {
  background: #0f0f0f;
  color: #d0d0d0;
  padding: 1.5rem;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 0.8125rem;
  line-height: 1.55;
  white-space: pre-wrap;
  word-break: break-word;
  border: 1px solid rgba(255, 238, 0, 0.15);
  margin: 1rem 0 0;
}

.page-codefence code {
  font-family: inherit;
  color: inherit;
}

.page-section--closing {
  margin-top: clamp(2rem, 5vh, 4rem);
  padding-top: 2rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}
</style>
