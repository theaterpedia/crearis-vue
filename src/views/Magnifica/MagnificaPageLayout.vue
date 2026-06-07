<!--
  MagnificaPageLayout · shared shell for the magnifica detail-pages (A.2).

  Centralizes the page shell (.magnifica-page base · 90rem header-inset · the content
  column) and pulls in the shared prose stylesheet (magnifica-page.css, global) so the
  page-files hold only their prose + page-unique decorations.

  Content-column variants:
    standard   · 90rem centered (ethnography · context)
    scientific · 90rem outer + 56rem left prose-column (.page-body) + right gloss-lane (discourse)

  Slots:
    #header · the topbar (each page passes its own header component). Rendered as a
              DIRECT child of .magnifica-page so its position:sticky pins across the
              whole page; the 90rem inset is applied to the header in magnifica-page.css.
    #hero   · full-width hero/backslide (sits between header and content)
    default · the <main> content column
    #after  · siblings of <main> inside .magnifica-page (e.g. fpostit renderers)
-->

<template>
  <div class="magnifica-page">
    <slot name="header" />
    <slot name="hero" />
    <main class="magnifica-page-content" :class="variant === 'scientific' ? 'is-scientific' : 'is-standard'">
      <slot />
    </main>
    <slot name="after" />
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ variant?: 'standard' | 'scientific' }>(), {
  variant: 'standard',
})
</script>

<style src="./magnifica-page.css"></style>
