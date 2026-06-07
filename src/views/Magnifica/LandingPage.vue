<!--
  LandingPage · Magnifica response-page root (/) · Entry/Landing redesign (HM 2026-06-07).

  Pre-auth: EntryHero · 2-beat gate (header + password). Post-auth: the 2022 hero shape —
  big header (+nav) · left-column headline (placeholder · "Websites … gesucht" slot) · and
  on the right the PROMPTBOX (codebox letter, word-by-word) where 2022 had the youtube-player.
  The promptbox REPLACES the post-it blackboard (the blackboard moved to /ethnography).
  Below: 2 backslides · 3 navcards · Hans-voice page-bottom.
-->

<template>
  <div class="magnifica-landing">
    <EntryHero v-if="!isAuthenticated" />

    <div v-if="isAuthenticated" class="magnifica-landing-content">
      <div class="landing-container">
        <MagnificaHeader show-nav />

        <!-- 2022 hero shape · left headline + right promptbox -->
        <section class="landing-hero">
          <div class="landing-hero-left">
            <p class="landing-hero-overline">{{ hero.overline }}</p>
            <h1 class="landing-hero-headline">{{ hero.headline }}</h1>
            <!-- TODO HM: the "Websites Theaterpädagogik dringend gesucht!" left-column copy. -->
          </div>
          <div class="landing-hero-right">
            <MagnificaChatbox :entries="letterEntries" :instant-portion="0.5" />
          </div>
        </section>
      </div>

      <!-- 2 backslides · before / after magnifica -->
      <BackSlide :image="backslide1.image" :image-alt="backslide1.imageAlt" :theme-color="backslide1.themeColor" bounded>
        <h2>{{ backslide1.headline }}</h2>
        <p v-for="(para, i) in backslide1.paras" :key="i">{{ para }}</p>
      </BackSlide>

      <p class="backslide-intro">{{ backslideIntro }}</p>

      <BackSlide :image="backslide2.image" :image-alt="backslide2.imageAlt" :theme-color="backslide2.themeColor" image-right bounded>
        <h2>{{ backslide2.headline }}</h2>
        <p v-for="(para, i) in backslide2.paras" :key="i">{{ para }}</p>
      </BackSlide>

      <div class="landing-narrow">
        <!-- 3 navcards · Cultural-Studies lanes (D) -->
        <nav class="route-cards" aria-label="Three routes">
          <RouterLink
            v-for="card in navCards"
            :key="card.to"
            :to="card.to"
            class="route-card"
            :class="`route-card--${card.theme}`"
          >
            <span class="route-card-overline">{{ card.overline }}</span>
            <span class="route-card-headline">{{ card.headline }}</span>
            <span class="route-card-subline">{{ card.subline }}</span>
          </RouterLink>
        </nav>

        <!-- Page-bottom · Hans-voice closing -->
        <section class="landing-closing">
          <p>{{ closingP1 }}</p>
          <p>{{ closingP2 }}</p>
          <p>
            {{ closingP3Before }}<CalloutPhrase :callout="callouts.claudeIndividuums">Claude individuums</CalloutPhrase>{{ closingP3After }}
          </p>
        </section>

        <p class="magnifica-landing-actions">
          <MagnificaLogoutButton />
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { useMagnificaAuth } from '@/composables/useMagnificaAuth'
import EntryHero from './EntryHero.vue'
import MagnificaHeader from './MagnificaHeader.vue'
import MagnificaChatbox from './MagnificaChatbox.vue'
import BackSlide from '@/components/magnifica/BackSlide.vue'
import CalloutPhrase from './CalloutPhrase.vue'
import MagnificaLogoutButton from './MagnificaLogoutButton.vue'
import {
  hero,
  letterEntries,
  backslide1,
  backslideIntro,
  backslide2,
  navCards,
  closingP1,
  closingP2,
  closingP3Before,
  closingP3After,
  callouts,
} from './content/landing'

const { isAuthenticated } = useMagnificaAuth()
</script>

<style scoped>
.magnifica-landing {
  font-family: var(--font, ui-monospace);
}

.magnifica-landing-content {
  background: var(--color-bg);
  color: var(--color-contrast);
}

.landing-container {
  max-width: 90rem;
  margin: 0 auto;
  padding: 0 clamp(1rem, 6vw, 3rem) clamp(2rem, 5vh, 4rem);
}

/* 2022 hero · left text · right promptbox */
.landing-hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.25fr);
  gap: clamp(2rem, 5vw, 4rem);
  align-items: start;
  padding-top: clamp(1rem, 4vh, 3rem);
}

.landing-hero-overline {
  font-size: 0.875rem;
  color: var(--color-muted-contrast);
  margin: 0 0 0.75rem;
  letter-spacing: 0.02em;
}

.landing-hero-headline {
  font-size: clamp(1.75rem, 4vw, 3rem);
  font-weight: 700;
  margin: 0;
  line-height: 1.15;
  color: var(--color-primary-bg);
}

@media (max-width: 860px) {
  .landing-hero {
    grid-template-columns: 1fr;
  }
}

/* ==Backslides== */
.backslide-intro {
  max-width: 56rem;
  margin: 0 auto;
  padding: clamp(2rem, 5vh, 3rem) clamp(1rem, 6vw, 3rem);
  font-size: clamp(1rem, 2vw, 1.25rem);
  font-style: italic;
}

/* ==Centered column for navcards + closing== */
.landing-narrow {
  max-width: 56rem;
  margin: 0 auto;
  padding: clamp(2.5rem, 6vh, 4rem) clamp(1rem, 6vw, 3rem) 0;
}

/* ==Route-cards== */
.route-cards {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: clamp(2.5rem, 6vh, 4rem);
}

.route-card {
  flex: 1 1 14rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1.5rem 1.25rem;
  border-radius: 6px;
  text-decoration: none;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
  transform: rotate(-1deg);
  transition: transform 200ms ease, box-shadow 200ms ease;
}

.route-card:nth-child(2) { transform: rotate(1.5deg); }
.route-card:nth-child(3) { transform: rotate(-2deg); }

.route-card:hover,
.route-card:focus-visible {
  transform: rotate(0deg) translateY(-3px);
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.4);
  outline: none;
}

.route-card:focus-visible {
  box-shadow: 0 0 0 3px var(--color-primary-bg), 0 10px 28px rgba(0, 0, 0, 0.4);
}

.route-card--yellow { background: var(--color-primary-bg);  color: var(--color-primary-contrast); }
.route-card--green  { background: var(--color-positive-bg); color: var(--color-positive-contrast); }
.route-card--pink   { background: var(--color-negative-bg); color: var(--color-negative-contrast); }

.route-card-overline {
  font-size: 0.8125rem;
  opacity: 0.85;
}

.route-card-headline {
  font-size: 1.375rem;
  font-weight: 700;
  letter-spacing: 0.01em;
}

.route-card-subline {
  font-size: 0.875rem;
  line-height: 1.5;
}

/* ==Closing block== */
.landing-closing {
  margin-bottom: clamp(2rem, 5vh, 3rem);
}

.landing-closing p {
  font-size: clamp(0.9rem, 1.5vw, 1rem);
  line-height: 1.7;
  margin: 0 0 1rem;
  color: var(--color-muted-contrast);
}

/* ==Close-and-reopen actions== */
.magnifica-landing-actions {
  text-align: center;
  margin: 0;
  padding: 2rem 1rem 4rem;
}

@media (max-width: 640px) {
  .route-card {
    transform: none !important;
  }
}

@media (prefers-reduced-motion: reduce) {
  .route-card {
    transition: none;
    transform: none;
  }
}
</style>
