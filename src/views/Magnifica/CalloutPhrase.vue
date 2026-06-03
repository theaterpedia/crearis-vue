<!--
  CalloutPhrase · clickable inline phrase that opens a PopOverPostIt.

  The detail-page authoring shape per cand-1c conception §6 + §11.5 + devdoc §2:

      <p>
        Some prose with <CalloutPhrase :callout="phraseX">a clickable phrase</CalloutPhrase> in it.
      </p>

  Where `phraseX` is a CardsCanvasItem-shaped object from a content module
  (e.g. `src/views/Magnifica/content/ethnography.ts`). The visible phrase
  uses a dotted-underline in the theme accent-color; click opens a PostIt
  popover anchored beneath the phrase (or as bottom-sheet on mobile).

  Reuses PostIt as the card; this component only adds the inline-trigger
  + open/close state. PopOverPostIt.vue handles positioning, dismiss, ARIA.
-->

<template>
  <span class="callout-phrase-wrapper">
    <button
      ref="triggerRef"
      type="button"
      class="callout-phrase"
      :class="`callout-phrase--${theme}`"
      :aria-expanded="open"
      aria-haspopup="dialog"
      @click="open = true"
    >
      <slot />
    </button>
    <PopOverPostIt
      :open="open"
      :anchor-el="triggerRef"
      :postit="callout.props"
      @close="open = false"
    />
  </span>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import PopOverPostIt from './PopOverPostIt.vue'
import { normalizeTheme, type CardsCanvasItem } from '@/components/magnifica/types'

interface Props {
  callout: CardsCanvasItem
}

const props = defineProps<Props>()

const open = ref(false)
const triggerRef = ref<HTMLButtonElement | null>(null)

const theme = computed(() => normalizeTheme(props.callout.props.themeColor ?? 'yellow'))
</script>

<style scoped>
.callout-phrase-wrapper {
  display: inline;
}

.callout-phrase {
  font: inherit;
  background: transparent;
  border: 0;
  padding: 0;
  color: inherit;
  cursor: help;
  text-decoration: underline dotted;
  text-underline-offset: 4px;
  text-decoration-thickness: 1px;
  transition: color 200ms ease;
}

.callout-phrase--yellow { text-decoration-color: #ffee00; }
.callout-phrase--green  { text-decoration-color: #57e389; }
.callout-phrase--pink   { text-decoration-color: #f06292; }
.callout-phrase--dim    { text-decoration-color: #888888; }

.callout-phrase:hover {
  color: #ffee00;
}

.callout-phrase:focus-visible {
  outline: 2px solid #ffee00;
  outline-offset: 2px;
  border-radius: 2px;
}

@media (prefers-reduced-motion: reduce) {
  .callout-phrase {
    transition: none;
  }
}
</style>
