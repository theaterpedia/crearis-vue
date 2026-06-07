<!--
  MagnificaHeader · the landing/entry header (2022 "Theaterpedia" shape, magnifica title).
  Title "Anthropic and Magnifica Humanitas" + subline "moving past the incentives".
  Scroll-collapse (howto-topbar State A→B): at the top it's big with the subline; once the
  page scrolls past the threshold it shrinks and the subline goes away (sticky · CSS-animated).
  Nav appears post-auth only (`show-nav`).
-->

<template>
  <header class="mag-header" :class="{ 'is-scrolled': scrolled || compact }">
    <a class="mag-wordmark" href="/">Anthropic and <span class="mag-wordmark-accent">Magnifica Humanitas</span></a>
    <p class="mag-subline">moving past the incentives</p>

    <nav v-if="showNav" class="mag-nav" aria-label="Sections">
      <RouterLink v-for="item in navItems" :key="item.link" :to="item.link" class="mag-nav-link">
        {{ item.label }}
      </RouterLink>
    </nav>
  </header>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { RouterLink } from 'vue-router'
import { navItems } from './content/nav'

// `compact`: detail-route topbar — always in the collapsed form (State C · no big State-A,
// no scroll-collapse), just sticky. The landing omits it → it gets the State A→B collapse.
const props = defineProps<{ showNav?: boolean; compact?: boolean }>()

// State A → B: collapse (subline away, title shrinks) once scrolled past the threshold.
// Hysteresis (collapse at 80, expand only below 32) gives a dead-band so the A↔B flip
// can't oscillate in the narrow region where the header is mid-collapse — Chrome's
// scroll-anchoring otherwise nudges scrollY back across a single threshold and flickers
// (paired with `overflow-anchor: none` on the landing, which kills the nudge at the source).
const COLLAPSE_AT = 80
const EXPAND_AT = 32
const scrolled = ref(false)

function onScroll() {
  const y = window.scrollY
  if (!scrolled.value && y > COLLAPSE_AT) scrolled.value = true
  else if (scrolled.value && y < EXPAND_AT) scrolled.value = false
}

onMounted(() => {
  if (props.compact) return // always-compact · no scroll listener
  onScroll() // honor a non-zero initial scroll (e.g. on reload mid-page)
  window.addEventListener('scroll', onScroll, { passive: true })
})

onUnmounted(() => {
  if (!props.compact) window.removeEventListener('scroll', onScroll)
})
</script>

<style scoped>
.mag-header {
  position: sticky;
  top: 0;
  /* above the glosses (FloatingPostIt z-index 1000) so the topbar runs OVER all content */
  z-index: 1100;
  display: grid;
  grid-template-columns: 1fr auto;
  grid-template-areas:
    "wordmark nav"
    "subline  nav";
  align-items: center;
  column-gap: 2rem;
  row-gap: 0.25rem;
  padding: clamp(1.5rem, 5vh, 3.5rem) 0 clamp(1.5rem, 4vh, 2.5rem);
  background: var(--color-bg);
  font-family: var(--font, ui-monospace);
  transition: padding 300ms ease, box-shadow 300ms ease;
}

/* collapsed (State B) · compact bar · subline gone · shadow separates from content */
.mag-header.is-scrolled {
  padding-top: 0.6rem;
  padding-bottom: 0.6rem;
  box-shadow: 0 2px 14px rgba(0, 0, 0, 0.45);
}

.mag-wordmark {
  grid-area: wordmark;
  font-size: clamp(2rem, 6vw, 4.25rem);
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.05;
  text-decoration: none;
  color: var(--color-contrast);
  transition: font-size 300ms ease;
}

.mag-header.is-scrolled .mag-wordmark {
  font-size: clamp(1.25rem, 3vw, 2rem);
}

.mag-wordmark-accent {
  color: var(--color-primary-bg);
}

.mag-subline {
  grid-area: subline;
  margin: 0;
  font-size: clamp(1rem, 2.2vw, 1.5rem);
  font-weight: 700;
  color: var(--color-contrast);
  /* collapses on scroll */
  max-height: 3rem;
  opacity: 1;
  overflow: hidden;
  transition: max-height 300ms ease, opacity 250ms ease, margin 300ms ease;
}

.mag-header.is-scrolled .mag-subline {
  max-height: 0;
  opacity: 0;
}

.mag-nav {
  grid-area: nav;
  display: flex;
  gap: 1.5rem;
  align-self: center;
}

.mag-nav-link {
  font-size: clamp(1rem, 1.4vw, 1.25rem);
  font-weight: 700;
  text-decoration: none;
  color: var(--color-contrast);
  transition: color 150ms ease;
}

.mag-nav-link:hover,
.mag-nav-link.router-link-active {
  color: var(--color-primary-bg);
}

@media (max-width: 640px) {
  .mag-header {
    grid-template-columns: 1fr;
    grid-template-areas: "wordmark" "subline" "nav";
  }
  .mag-nav {
    align-self: start;
    flex-wrap: wrap;
    margin-top: 0.75rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .mag-header,
  .mag-wordmark,
  .mag-subline {
    transition: none;
  }
}
</style>
