<!--
  HansDoenitzPage · /hans-doenitz · Page 2 of cand-1c · "Organic intellectual".
  Per cand-1c §11.10.2 + §11.5.2 callouts. German body preserved monolingual
  per HM-Q1 resolution; English wrapper (abstract + intro + closing) carries
  the through-line for non-German readers. dasei.eu link as institutional-anchor.
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

      <!-- §2 · English abstract -->
      <section class="page-section">
        <p>{{ englishAbstract }}</p>
      </section>

      <!-- §3 · English coaching-contract intro -->
      <section class="page-section page-section--english-intro">
        <p>{{ englishIntro }}</p>
      </section>

      <!-- §4 · German body · verbatim · with inline CalloutPhrase -->
      <section class="page-section page-section--german" lang="de">

        <!-- Abstract -->
        <p class="german-abstract"><strong>{{ germanAbstract }}</strong></p>

        <!-- P1 · Der Theaterpädagoge -->
        <h2 class="german-paragraph-heading">{{ germanP1Title }}</h2>
        <p>{{ germanP1Before }}<CalloutPhrase :callout="callouts.elementareAnimation">{{ germanP1CalloutA }}</CalloutPhrase>{{ germanP1Middle1 }}<CalloutPhrase :callout="callouts.amAnfangWarDerKreis">{{ germanP1CalloutB }}</CalloutPhrase>{{ germanP1Middle2 }}</p>

        <!-- P2 · Lehre und Methodik -->
        <h2 class="german-paragraph-heading">{{ germanP2Title }}</h2>
        <p>{{ germanP2 }}</p>

        <!-- P3 · Digitalisierung und theaterpedia.org -->
        <h2 class="german-paragraph-heading">{{ germanP3Title }}</h2>
        <p>{{ germanP3Before }}<CalloutPhrase :callout="callouts.theaterpediaOrg">{{ germanP3Callout }}</CalloutPhrase>{{ germanP3After }}</p>

        <!-- P4 · Gemeinschaftlich getragene Entwicklung -->
        <h2 class="german-paragraph-heading">{{ germanP4Title }}</h2>
        <p>{{ germanP4Part1Before }}<CalloutPhrase :callout="callouts.eingetragenerVerein">{{ germanP4CalloutA }}</CalloutPhrase>{{ germanP4Part1After }}<CalloutPhrase :callout="callouts.cojcABasta">{{ germanP4CalloutB }}</CalloutPhrase>{{ germanP4Part2After }}<CalloutPhrase :callout="callouts.allesIstKooperation">{{ germanP4CalloutC }}</CalloutPhrase>{{ germanP4Part3After }}</p>
      </section>

      <!-- §5 · dasei.eu integration block -->
      <hr class="dasei-separator" />
      <section class="page-section page-section--dasei">
        <p>
          <em>{{ daseiLink.text }}</em>
          <a :href="daseiLink.href" target="_blank" rel="noopener">{{ daseiLink.label }}</a>
        </p>
      </section>

      <!-- §6 · English closing question -->
      <section class="page-section page-section--closing">
        <p>{{ englishClosing }}</p>
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
  englishAbstract,
  englishIntro,
  germanAbstract,
  germanP1Title,
  germanP1Before,
  germanP1CalloutA,
  germanP1Middle1,
  germanP1CalloutB,
  germanP1Middle2,
  germanP2Title,
  germanP2,
  germanP3Title,
  germanP3Before,
  germanP3Callout,
  germanP3After,
  germanP4Title,
  germanP4Part1Before,
  germanP4CalloutA,
  germanP4Part1After,
  germanP4CalloutB,
  germanP4Part2After,
  germanP4CalloutC,
  germanP4Part3After,
  daseiLink,
  englishClosing,
  callouts,
} from './content/hans-doenitz'
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

.page-section p {
  font-size: clamp(0.95rem, 1.5vw, 1.0625rem);
  line-height: 1.7;
  margin: 0 0 1rem;
  color: #e8e8e8;
}

.page-section p:last-child {
  margin-bottom: 0;
}

.page-section--english-intro {
  font-style: italic;
  color: #d0d0d0;
  padding: 1rem 1.5rem;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 4px;
}

.page-section--german {
  padding-top: 1rem;
}

.german-abstract {
  font-size: clamp(1rem, 1.6vw, 1.125rem) !important;
  line-height: 1.65;
  margin-bottom: 2rem !important;
  padding: 1.25rem 1.5rem;
  background: rgba(255, 238, 0, 0.05);
  border-left: 3px solid #ffee00;
  border-radius: 4px;
}

.german-paragraph-heading {
  font-size: 1rem;
  font-weight: 700;
  margin: 2rem 0 0.75rem;
  color: #aaa;
  letter-spacing: 0.02em;
}

.dasei-separator {
  border: 0;
  border-top: 1px solid rgba(255, 255, 255, 0.15);
  margin: clamp(2rem, 4vh, 3rem) 0;
}

.page-section--dasei {
  text-align: center;
}

.page-section--dasei a {
  color: #ffee00;
  text-decoration: none;
  font-weight: 600;
  margin-left: 0.5rem;
}

.page-section--dasei a:hover {
  text-decoration: underline;
}

.page-section--dasei a:focus-visible {
  outline: 2px solid #ffee00;
  outline-offset: 2px;
  border-radius: 2px;
}

.page-section--closing {
  margin-top: clamp(2rem, 5vh, 4rem);
  padding-top: 2rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  font-style: italic;
  color: #d0d0d0;
}
</style>
