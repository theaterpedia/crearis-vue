<!--
  MagnificaFooter · minimal one-liner footer (2022 AppFooter copyright-bar spirit) ·
  a thin top-bordered strip, 90rem-centered, theme-7 tokens, square. Links:
  Impressum (internal · /impressum) · dasei.eu · theaterpedia.org · cojc.eu.
  Rendered site-wide via MagnificaPageLayout + the post-auth landing.
-->

<template>
  <footer class="mag-footer">
    <nav class="mag-footer-inner" aria-label="Footer">
      <RouterLink to="/impressum" class="mag-footer-link">Impressum</RouterLink>
      <span class="mag-footer-sep" aria-hidden="true">·</span>
      <a class="mag-footer-link" href="https://dasei.eu" target="_blank" rel="noopener">dasei.eu</a>
      <span class="mag-footer-sep" aria-hidden="true">·</span>
      <a class="mag-footer-link" href="https://theaterpedia.org" target="_blank" rel="noopener">theaterpedia.org</a>
      <span class="mag-footer-sep" aria-hidden="true">·</span>
      <a class="mag-footer-link" href="https://cojc.eu" target="_blank" rel="noopener">cojc.eu</a>
    </nav>
  </footer>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<style scoped>
.mag-footer {
  border-top: 1px solid var(--color-border);
  background: var(--color-bg);
  font-family: var(--font, ui-monospace);
}

.mag-footer-inner {
  max-width: 90rem;
  margin: 0 auto;
  padding: 1.25rem clamp(1rem, 6vw, 3rem);
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem 0.75rem;
  font-size: 0.8125rem;
  letter-spacing: 0.02em;
}

.mag-footer-link {
  color: var(--color-muted-contrast);
  text-decoration: none;
  transition: color 150ms ease;
}

.mag-footer-link:hover,
.mag-footer-link:focus-visible {
  color: var(--color-primary-bg);
}

.mag-footer-sep {
  color: var(--color-muted-contrast);
  opacity: 0.5;
}
</style>
