<!--
  CulturalStudiesPage · /cultural-studies · Page 3 of cand-1c · "Between hope
  and horror?" · Ideologie-Kritik. Per cand-1c §11.10.3 round-3 prose +
  §11.5.3 callouts + §11.10.4 bibliography.

  The page enacts what it argues: parrhesia-discipline · one-citation-per-concept ·
  anti-academic-flooding. Disclaimer-at-top IS the speaking-position move.
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

      <!-- §2 · disclaimer-as-parrhesia opener -->
      <section class="page-section page-section--disclaimer">
        <p>{{ disclaimerParagraph }}</p>
      </section>

      <!-- §3 · Williams cornerstone citation -->
      <section class="page-section">
        <p>{{ williamsBefore }}<em>{{ williamsQuote }}</em>{{ williamsAfter }}<CalloutPhrase :callout="callouts.cccsBirmingham">CCCS Birmingham</CalloutPhrase>{{ williamsAfterCccs }}</p>
      </section>

      <!-- §4 · 1996-1997 deep-reading note -->
      <section class="page-section">
        <p>{{ deepReadingBefore }}<CalloutPhrase :callout="callouts.speakingPosition">speaking-position</CalloutPhrase>{{ deepReadingAfter }}</p>
      </section>

      <!-- §5 · flooding-practices argument -->
      <section class="page-section page-section--flooding">
        <p>{{ floodingP1 }}</p>
        <p class="page-flooding-hinge">{{ floodingP2 }}</p>
        <p>{{ floodingP3 }}</p>
      </section>

      <!-- §6 · Twabu integration -->
      <section class="page-section">
        <h2 class="page-section-heading">Twabu, re-projected</h2>
        <p>
          {{ twabuP1Before }}<CalloutPhrase :callout="callouts.governmentality">governmentality</CalloutPhrase>{{ twabuP1Comma1 }}<CalloutPhrase :callout="callouts.biopower">biopower</CalloutPhrase>{{ twabuP1Comma2 }}<CalloutPhrase :callout="callouts.panopticon">Panopticon</CalloutPhrase>{{ twabuP1After }}
        </p>
        <p>{{ twabuP2 }}</p>
      </section>

      <!-- §7 · Probyn speaking-position -->
      <section class="page-section">
        <p>{{ probynParagraph }}</p>
        <p class="page-emphasis">{{ probynEmphasis }}</p>
      </section>

      <!-- §8 · Butoh / Expedition Schloss Schwarzenberg -->
      <section class="page-section">
        <p>{{ butohParagraph }}<CalloutPhrase :callout="callouts.todesmaersche">Todesmärsche</CalloutPhrase>{{ butohAfter }}</p>
      </section>

      <!-- §9 · closing parrhesia -->
      <section class="page-section page-section--closing">
        <p>{{ closingP1 }}</p>
        <p>{{ closingP2Before }}<strong>{{ closingP2Emphasis }}</strong></p>
      </section>

      <!-- Bibliography · 5 entries · one-citation-per-concept -->
      <section class="page-section page-section--bibliography">
        <h2 class="page-section-heading page-section-heading--bib">Bibliography</h2>
        <ol class="bib-list">
          <li v-for="(entry, i) in bibliography" :key="`bib-${i}`">
            <span class="bib-citation">{{ entry.citation }}</span>
            <a v-if="entry.href" :href="entry.href" class="bib-link" target="_blank" rel="noopener">{{ entry.href }}</a>
            <span v-if="entry.note" class="bib-note">{{ entry.note }}</span>
          </li>
        </ol>
        <p class="bib-disciplined">{{ bibliographyNote }}</p>
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
  disclaimerParagraph,
  williamsBefore,
  williamsQuote,
  williamsAfter,
  williamsAfterCccs,
  deepReadingBefore,
  deepReadingAfter,
  floodingP1,
  floodingP2,
  floodingP3,
  twabuP1Before,
  twabuP1Comma1,
  twabuP1Comma2,
  twabuP1After,
  twabuP2,
  probynParagraph,
  probynEmphasis,
  butohParagraph,
  butohAfter,
  closingP1,
  closingP2Before,
  closingP2Emphasis,
  bibliography,
  bibliographyNote,
  callouts,
} from './content/cultural-studies'
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

.page-section--disclaimer {
  font-style: italic;
  color: #d0d0d0;
  padding: 1rem 1.5rem;
  background: rgba(255, 255, 255, 0.03);
  border-left: 3px solid #aaa;
  border-radius: 4px;
}

.page-section--flooding {
  background: rgba(255, 238, 0, 0.05);
  border-left: 3px solid #ffee00;
  padding: 1.25rem 1.5rem;
  border-radius: 4px;
}

.page-flooding-hinge {
  font-size: clamp(1.0625rem, 1.8vw, 1.25rem) !important;
  font-weight: 700;
  color: #ffee00 !important;
}

.page-emphasis {
  font-size: clamp(1rem, 1.6vw, 1.125rem) !important;
  font-weight: 600;
  color: #f4f4f4 !important;
  padding-left: 1rem;
  border-left: 2px solid rgba(255, 238, 0, 0.4);
}

.page-section--closing {
  margin-top: clamp(2rem, 5vh, 4rem);
  padding-top: 2rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.page-section--closing strong {
  color: #ffee00;
}

/* ==Bibliography==  */
.page-section--bibliography {
  margin-top: clamp(3rem, 6vh, 5rem);
  padding: 2rem 1.5rem;
  background: #0f0f0f;
  border-radius: 4px;
  border-top: 1px solid rgba(255, 238, 0, 0.2);
}

.page-section-heading--bib {
  font-size: clamp(1rem, 1.8vw, 1.25rem);
  color: #aaa;
  margin-bottom: 1.25rem;
  letter-spacing: 0.02em;
}

.bib-list {
  list-style: decimal;
  padding-left: 1.5rem;
  margin: 0 0 1.25rem;
  font-size: 0.875rem;
  line-height: 1.55;
  color: #d0d0d0;
}

.bib-list li {
  margin-bottom: 0.75rem;
}

.bib-link {
  display: block;
  color: #ffee00;
  text-decoration: none;
  word-break: break-all;
  font-size: 0.8125rem;
  margin-top: 0.25rem;
}

.bib-link:hover {
  text-decoration: underline;
}

.bib-link:focus-visible {
  outline: 2px solid #ffee00;
  outline-offset: 2px;
  border-radius: 2px;
}

.bib-note {
  display: inline-block;
  margin-left: 0.5rem;
  font-size: 0.75rem;
  color: #888;
  font-style: italic;
}

.bib-disciplined {
  font-size: 0.8125rem !important;
  color: #888 !important;
  font-style: italic;
  margin: 0 !important;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}
</style>
