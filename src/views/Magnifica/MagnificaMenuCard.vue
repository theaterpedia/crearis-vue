<!--
  MagnificaMenuCard · thin card-component for the LandingPage engagement-shapes menu.

  Per cand-1c §11.10.0 + Q5 answer: invitation-not-push · no buttons/links · the
  cards are NAMED, not clickable-to-buy. Contact happens via the §5 closing
  back-slide email. v0.5 used DaisyUI inline cards; crearis-vue is plain CSS · this
  is the no-DaisyUI translation.

  Props:
    titlePrefix · non-accent text at the start of the title
    titleAccent · accent-portion (rendered in yellow inside the title)
  Default slot · the body paragraph.

  Example:
    <MagnificaMenuCard title-prefix="In-presence" title-accent="workshops at Anthropic">
      Theaterpädagogik methods, performed with Anthropic personnel as participants.
    </MagnificaMenuCard>
-->

<template>
  <article class="menu-card">
    <h3 class="menu-card-title">
      {{ titlePrefix }}
      <span v-if="titleAccent" class="menu-card-accent">{{ titleAccent }}</span>
    </h3>
    <div class="menu-card-body">
      <slot />
    </div>
  </article>
</template>

<script setup lang="ts">
defineProps<{
  titlePrefix: string
  titleAccent?: string
}>()
</script>

<style scoped>
.menu-card {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  width: min(22rem, 100%);
  padding: 1.5rem clamp(1rem, 3vw, 1.75rem);
  background: rgba(36, 36, 36, 0.92);
  color: #f4f4f4;
  border-radius: 6px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.35);
  font-family: ui-monospace, "JetBrains Mono", "Cascadia Code", Menlo, Consolas, monospace;
}

.menu-card-title {
  font-size: clamp(1rem, 1.6vw, 1.25rem);
  font-weight: 700;
  margin: 0;
  line-height: 1.35;
  letter-spacing: 0.01em;
}

.menu-card-accent {
  color: #ffee00;
}

.menu-card-body {
  font-size: 0.875rem;
  line-height: 1.55;
  color: #d0d0d0;
}

.menu-card-body :deep(p) {
  margin: 0;
}

.menu-card-body :deep(em) {
  font-style: italic;
  color: #f4f4f4;
}
</style>
