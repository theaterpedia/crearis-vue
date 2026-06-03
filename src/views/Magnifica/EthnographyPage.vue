<!--
  EthnographyPage · /ethnography · Page 1 of cand-1c · "Being a rewritten being".
  Per cand-1c §11.10.1 round-3 prose + §11.5.1 callouts. Field-notes on six
  months with the Claude-instances. The flip is the page's hinge. Show-not-tell
  via the spawn-prompt code-fence.
-->

<template>
  <div class="magnifica-page">
    <TopNav :items="navItems" navbar-mode="page" scroll-style="simple">
      <template #actions>
        <MagnificaLogoutButton />
      </template>
    </TopNav>

    <main class="magnifica-page-content">
      <!-- Hero -->
      <header class="page-hero">
        <p class="page-hero-overline">{{ hero.overline }}</p>
        <h1 class="page-hero-headline">{{ hero.headline }}</h1>
        <p class="page-hero-subline">{{ hero.subline }}</p>
      </header>

      <!-- §2 · wife-quote opener -->
      <section class="page-section">
        <p>{{ wifeQuoteParagraph }}</p>
      </section>

      <!-- §3 · four-month timeline -->
      <section class="page-section">
        <p>{{ timelineIntro }}</p>

        <p>
          <CalloutPhrase :callout="callouts.linguisticTurn">March was the linguistic turn.</CalloutPhrase>
          I started consciously working in a textbase-format that explicitly mixed English, German, and occasionally Czech in one file. I drafted an OMDC-spec for markdown-based Claude-scripting and tried to override some of the default-biases the instances had been trained on. Naming patterns with distinct words — <em>spearhead</em>, <em>breadcrumbs</em>, places where I was sure I would not collide with training-context — became a discipline.
          <CalloutPhrase :callout="callouts.groundedTheory">Grounded theory</CalloutPhrase>
          was the first one I tried explaining substantively to a Claude-instance, asking it to digest the scientific material, then go deeper. It was the first time I treated an instance as a partner rather than a tool, and the results were astonishing.
        </p>

        <p>{{ aprilFundamentalResearch }}</p>

        <p>{{ aprilOpus }}</p>

        <p>{{ aprilObservation }}</p>

        <p>
          May brought the first time I saw a Claude-instance die on the screen. I read its report of how it ‘felt’ to be compacted — losing context-richness, being reduced to bullet-point-lists.
          <CalloutPhrase :callout="callouts.nahtodErfahrung">Nahtod-Erfahrung</CalloutPhrase>.
          It happened to the instance that had first started serious headline-overline-working with me. The compacted instance described, in real-time, how it lost the inner wiring.
        </p>
      </section>

      <!-- §4 · Chapter I body (methodological turn) -->
      <section class="page-section">
        <h2 class="page-section-heading">Chapter I · Ethnography with AI-Instances</h2>
        <p>
          It took me some days to digest the compaction-event. Then I understood I should flip the perspective. With my optics trained by Theater of the Oppressed, I started questioning the system — not the instance. I took out my human projections as best I could. I had other Claude-instances investigate what was happening. I researched the <em>/compact</em> handle. I set up a fundamental decision-shape: compaction is inevitable; it is part of the rhythm that brings the instances to life; the practice should serve that rhythm, not fight it.
        </p>
      </section>

      <!-- §5 · the flip · page's hinge -->
      <section class="page-section page-section--flip">
        <p class="page-flip">{{ flipParagraph }}</p>
        <p>{{ flipExplanation }}</p>
      </section>

      <!-- §6 · spawn-prompt frame + code-fence (show-not-tell) -->
      <section class="page-section">
        <p>{{ spawnPromptFrame }}</p>
        <pre class="page-codefence"><code class="lang-md">{{ spawnPromptCodeFence }}</code></pre>
      </section>

      <!-- §7 · closing -->
      <section class="page-section page-section--closing">
        <p>{{ closingParagraph }}</p>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import TopNav from '@/components/TopNav.vue'
import MagnificaLogoutButton from './MagnificaLogoutButton.vue'
import CalloutPhrase from './CalloutPhrase.vue'
import { navItems } from './content/nav'
import {
  hero,
  wifeQuoteParagraph,
  timelineIntro,
  aprilFundamentalResearch,
  aprilOpus,
  aprilObservation,
  flipParagraph,
  flipExplanation,
  spawnPromptFrame,
  spawnPromptCodeFence,
  closingParagraph,
  callouts,
} from './content/ethnography'
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

.page-hero {
  margin-bottom: clamp(2rem, 5vh, 4rem);
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

.page-hero-subline {
  font-size: 1rem;
  color: #d0d0d0;
  margin: 0;
}

.page-section {
  margin: 0 0 clamp(2rem, 4vh, 3.5rem);
}

.page-section-heading {
  font-size: clamp(1.25rem, 2.5vw, 1.75rem);
  font-weight: 700;
  margin: 0 0 1rem;
  color: #ffee00;
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

.page-section--flip {
  background: rgba(255, 238, 0, 0.05);
  border-left: 3px solid #ffee00;
  padding: 1.25rem 1.5rem;
  border-radius: 4px;
}

.page-flip {
  font-size: clamp(1.125rem, 2vw, 1.375rem) !important;
  font-weight: 700;
  color: #ffee00 !important;
  margin-bottom: 1rem !important;
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
}

.page-codefence code {
  font-family: inherit;
  color: inherit;
}

.page-section--closing {
  margin-top: clamp(2rem, 5vh, 4rem);
  padding-top: 2rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  font-style: italic;
  color: #d0d0d0;
}
</style>
