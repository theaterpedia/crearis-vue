<!--
  ImpressumPage · /impressum · legal notice (German · § 5 DDG / § 5 TMG-Nachfolge).
  TEMPLATE TEXT — every concrete field is a [TODO HM] placeholder for HM/sister-1 to fill
  with the real DAS Ei e.V. Verein details. Linked from MagnificaFooter. Auth-gated like the
  other alt-routes (the whole site is invite-only); flag if it should be public instead.
-->

<template>
  <MagnificaPageLayout variant="standard">
    <template #header>
      <MagnificaHeader show-nav compact />
    </template>

    <section class="page-section">
      <Heading is="h1" overline="Rechtliche Angaben" headline="Impressum" />
    </section>

    <section class="page-section">
      <h2 class="page-section-heading">Angaben gemäß § 5 DDG</h2>
      <p>
        Hans Dönitz.<br />
        Vacher Str. 144<br />
        90766 Fürth
      </p>
    </section>

    <section class="page-section">
      <h2 class="page-section-heading">Kontakt</h2>
      <p>
        E-Mail: contact@crearis.eu<br />
        Web: <a href="https://dasei.eu" target="_blank" rel="noopener">dasei.eu</a>
      </p>
    </section>

    <section class="page-section">
      <h2 class="page-section-heading">Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</h2>
      <p>Hans Dönitz · Vacher Str. 144 · 90766 Fürth</p>
    </section>

    <section class="page-section page-section--closing">
      <p>
        Verbundene Auftritte:
        <a href="https://dasei.eu" target="_blank" rel="noopener">dasei.eu</a> ist die zentrale Anlaufstelle für die mit
        diesem Auftritt verbundenen Projekte.
        <a href="https://theaterpedia.org" target="_blank" rel="noopener">theaterpedia.org</a> ·
        <a href="https://cojc.eu" target="_blank" rel="noopener">cojc.eu</a>.
      </p>
    </section>
  </MagnificaPageLayout>
</template>

<script setup lang="ts">
import MagnificaPageLayout from './MagnificaPageLayout.vue'
import MagnificaHeader from './MagnificaHeader.vue'
import Heading from '@/components/Heading.vue'
</script>

<style scoped>
.page-section a {
  color: var(--color-primary-bg);
  text-decoration: underline;
}
</style>
