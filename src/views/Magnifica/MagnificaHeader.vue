<!--
  MagnificaHeader · the landing/entry header (2022 "Theaterpedia" shape).
  Big wordmark + subline · nav appears post-auth only (`show-nav`). Pre-auth the gate
  shows it without nav. Collapse-to-topbar on scroll (howto-topbar State A→B) is a
  follow-up of the layout pass; this is the extended (State A) form.
-->

<template>
  <header class="mag-header">
    <a class="mag-wordmark" href="/">Theater<span class="mag-wordmark-accent">pedia</span></a>
    <p class="mag-subline"><span class="mag-subline-accent">Theaterpädagogik</span> digital vernetzen</p>

    <nav v-if="showNav" class="mag-nav" aria-label="Sections">
      <RouterLink v-for="item in navItems" :key="item.link" :to="item.link" class="mag-nav-link">
        {{ item.label }}
      </RouterLink>
    </nav>
  </header>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { navItems } from './content/nav'

defineProps<{ showNav?: boolean }>()
</script>

<style scoped>
.mag-header {
  display: grid;
  grid-template-columns: 1fr auto;
  grid-template-areas:
    "wordmark nav"
    "subline  nav";
  align-items: start;
  column-gap: 2rem;
  row-gap: 0.25rem;
  padding: clamp(1.5rem, 5vh, 3.5rem) 0 clamp(1.5rem, 4vh, 2.5rem);
  font-family: ui-monospace, "JetBrains Mono", "Cascadia Code", Menlo, Consolas, monospace;
}

.mag-wordmark {
  grid-area: wordmark;
  font-size: clamp(2.5rem, 7vw, 5rem);
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1;
  text-decoration: none;
  color: var(--color-contrast);
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
}

.mag-subline-accent {
  color: var(--color-primary-bg);
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
</style>
