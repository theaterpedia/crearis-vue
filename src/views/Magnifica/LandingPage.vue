<!--
  LandingPage · Magnifica response-page root (/) · cand-1c content per §11.10.0 +
  §11.2 substrate-three reshape + v0.5 engagement-menu + v0.5 closing.

  Pre-auth: EntryHero shows the password-form-region. Post-auth: form collapses ·
  3-beat-shrunk-to-one-beat UnlockOverlay plays (per §11.4) · gated content
  unfolds below: content-hero (overline+headline+subline + 3 teaser icons) ·
  opening CardsCanvas (2 green Olah-quotes + 3 yellow Hans-brings teasers) ·
  3 substrate-three BackSlides · engagement-shapes menu (5 MagnificaMenuCards) ·
  closing BackSlide (spiegelkugel) · substrate-note · close-and-reopen button.

  Image-URLs in substrate-three + closing are TODO HM (per HM-2026-06-03 PM:
  gradient-placeholders ship now · swap to real imagery later).
-->

<template>
  <div
    class="magnifica-landing"
    :data-just-unlocked="showUnlock ? 'true' : null"
  >
    <UnlockOverlay
      v-if="showUnlock"
      @complete="showUnlock = false"
    />

    <EntryHero :show-form="!isAuthenticated" />

    <main v-if="isAuthenticated" class="magnifica-landing-content">

      <!-- Content-hero · the post-auth entry-point into the long-scroll body -->
      <section class="content-hero">
        <p class="content-hero-overline">{{ hero.overline }}</p>
        <h1 class="content-hero-headline">{{ hero.headline }}</h1>
        <p class="content-hero-subline">{{ hero.subline }}</p>
        <ul class="content-hero-teasers">
          <li v-for="(teaser, i) in heroTeasers" :key="i">
            <span class="content-hero-check" aria-hidden="true">✓</span>
            {{ teaser }}
          </li>
        </ul>
      </section>

      <!-- Opening CardsCanvas · Olah-quotes (green) + Hans-brings (yellow) -->
      <CardsCanvas :items="postits">
        <template #board>
          <p class="board-prose">{{ bodyProse }}</p>
        </template>
      </CardsCanvas>

      <!-- Substrate-three back-slides · per §11.2 reshape -->
      <BackSlide
        v-for="(slide, i) in substrateThree"
        :key="`substrate-${i}`"
        :image="slide.image"
        :image-alt="slide.imageAlt"
        :theme-color="slide.themeColor"
      >
        <!-- Substrate-point 3 · render the surviving 2022 Logo wordmark with yellow accent -->
        <div
          v-if="slide.useLogo"
          class="theaterpedia-mark"
          :style="logoColorOverride"
        >
          <Logo logo-size="lg" />
        </div>
        <h2 v-else class="back-slide-headline">{{ slide.headline }}</h2>

        <p>{{ slide.body }}</p>
        <p v-if="slide.link">
          <a :href="slide.link.href" target="_blank" rel="noopener">{{ slide.link.label }}</a>
        </p>
      </BackSlide>

      <!-- Engagement-shapes menu · 5 cards · invitation-not-push (no buttons) -->
      <section class="menu-section">
        <div class="menu-intro">
          <h2 class="menu-section-heading">A menu, deliberately open</h2>
          <p>I write to you because Anthropic — alone among the major labs — has placed itself in conversation with traditions outside the technical layer. Your Vatican speech is one of several signals of this.</p>
          <p>I do not know what shape an engagement might take. Here is a menu, written open:</p>
        </div>
        <div class="menu-grid">
          <MagnificaMenuCard
            v-for="(card, i) in menuCards"
            :key="`menu-${i}`"
            :title-prefix="card.titlePrefix"
            :title-accent="card.titleAccent"
          >
            <p>{{ card.body }}</p>
          </MagnificaMenuCard>
        </div>
      </section>

      <!-- Closing back-slide · spiegelkugel · per v0.5 -->
      <BackSlide
        :image="closing.image"
        :image-alt="closing.imageAlt"
        :theme-color="closing.themeColor"
      >
        <h2 class="back-slide-headline">{{ closing.headline }}</h2>
        <div v-html="closing.bodyHtml"></div>
      </BackSlide>

      <!-- Substrate-note · final-block · per v0.5 + §11.2 reshape -->
      <aside class="substrate-note">
        <p>{{ substrateNote }}</p>
      </aside>

      <!-- Close-and-reopen action · per HM-2026-06-02 PM -->
      <p class="magnifica-landing-actions">
        <MagnificaLogoutButton />
      </p>
    </main>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useMagnificaAuth } from '@/composables/useMagnificaAuth'
import EntryHero from './EntryHero.vue'
import UnlockOverlay from './UnlockOverlay.vue'
import CardsCanvas from '@/components/magnifica/CardsCanvas.vue'
import BackSlide from '@/components/magnifica/BackSlide.vue'
import Logo from '@/components/Logo.vue'
import MagnificaMenuCard from './MagnificaMenuCard.vue'
import MagnificaLogoutButton from './MagnificaLogoutButton.vue'
import {
  hero,
  heroTeasers,
  bodyProse,
  postits,
  substrateThree,
  menuCards,
  closing,
  substrateNote,
} from './content/landing'

const { isAuthenticated } = useMagnificaAuth()

// Override the Logo's CSS custom-properties for the Magnifica-context · keeps
// the "Theater" in light-text and the "pedia" in yellow accent · per HM-2026-06-03
// PM ("you could change --color-primary-bg") · scoped to this one wordmark via
// inline-style so the global token-set isn't touched.
const logoColorOverride =
    '--color-accent-contrast: #f4f4f4; --color-primary-bg: #ffee00; --color-primary-base: #ffee00;'

const showUnlock = ref(false)

onMounted(() => {
  if (typeof window === 'undefined') return
  const params = new URLSearchParams(window.location.search)
  if (params.has('just_unlocked')) {
    showUnlock.value = true
    window.history.replaceState({}, '', window.location.pathname)
  }
})
</script>

<style scoped>
.magnifica-landing {
  font-family: ui-monospace, "JetBrains Mono", "Cascadia Code", Menlo, Consolas, monospace;
}

.magnifica-landing-content {
  background: #1a1a1a;
  color: #f4f4f4;
}

/* ==Content-hero==  */
.content-hero {
  padding: clamp(3rem, 8vh, 6rem) clamp(1rem, 6vw, 3rem);
  max-width: 56rem;
  margin: 0 auto;
  text-align: left;
}

.content-hero-overline {
  font-size: 0.875rem;
  color: #aaa;
  margin: 0 0 0.5rem;
  letter-spacing: 0.02em;
}

.content-hero-headline {
  font-size: clamp(1.75rem, 4.5vw, 3rem);
  font-weight: 700;
  margin: 0 0 0.75rem;
  line-height: 1.2;
}

.content-hero-subline {
  font-size: 1rem;
  color: #d0d0d0;
  margin: 0 0 2rem;
}

.content-hero-teasers {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.content-hero-teasers li {
  font-size: clamp(0.95rem, 1.6vw, 1.125rem);
  line-height: 1.5;
  padding-left: 0.25rem;
}

.content-hero-check {
  display: inline-block;
  color: #ffee00;
  font-weight: 700;
  margin-right: 0.5rem;
}

/* ==Board-prose== (inside CardsCanvas #board slot) */
.board-prose {
  margin: 0;
  font-size: clamp(0.95rem, 1.6vw, 1.0625rem);
  line-height: 1.65;
  color: #e0e0e0;
}

/* ==BackSlide content==  */
.back-slide-headline {
  font-size: clamp(1.5rem, 3vw, 2rem);
  font-weight: 700;
  margin: 0 0 1rem;
  line-height: 1.25;
}

/* Substrate-point 3 · Theaterpedia-wordmark via Logo.vue */
.theaterpedia-mark {
  margin: 0 0 1.25rem;
  /* The Logo's internal heading is sized by media-queries; here we just give it the back-slide context. */
}

/* ==Menu section==  */
.menu-section {
  padding: clamp(3rem, 6vh, 5rem) clamp(1rem, 6vw, 3rem);
  max-width: 80rem;
  margin: 0 auto;
}

.menu-intro {
  max-width: 56rem;
  margin: 0 auto 2.5rem;
  font-size: clamp(0.95rem, 1.4vw, 1.0625rem);
  line-height: 1.6;
}

.menu-intro p {
  margin: 0 0 1rem;
}

.menu-section-heading {
  font-size: clamp(1.5rem, 3vw, 2rem);
  font-weight: 700;
  margin: 0 0 1rem;
  letter-spacing: 0.01em;
}

.menu-grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 1rem;
}

/* ==Substrate-note==  */
.substrate-note {
  background: #0f0f0f;
  padding: 2rem clamp(1rem, 6vw, 3rem);
  font-size: 0.875rem;
  line-height: 1.55;
  font-style: italic;
  color: #aaa;
  text-align: center;
}

.substrate-note p {
  margin: 0;
  max-width: 48rem;
  margin: 0 auto;
}

/* ==Close-and-reopen actions==  */
.magnifica-landing-actions {
  text-align: center;
  margin: 0;
  padding: 2rem 1rem 4rem;
  background: #1a1a1a;
}

@media (prefers-reduced-motion: reduce) {
  .content-hero-check,
  .magnifica-landing-actions {
    transition: none;
  }
}
</style>
