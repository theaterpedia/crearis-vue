<!--
  CalloutPhrase · clickable inline phrase that opens a floating post-it.

  Authoring shape (unchanged for content authors):

      <p>
        Some prose with <CalloutPhrase :callout="phraseX">a clickable phrase</CalloutPhrase> in it.
      </p>

  `phraseX` is a CardsCanvasItem-shaped object from a content module. The visible
  phrase has a dotted-underline; click opens a popover anchored to the phrase.

  ==fpostit-unification (2026-06-06 magnifica-final)==: the popover now renders via
  the shared `<FloatingPostIt>` (hlogic="element") with OKLCH theme colors, retiring
  the bespoke PopOverPostIt + PostIt stack. Open/close state is local per-instance
  (not the singleton controller) so it unmounts cleanly across route navigation.
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
    <FloatingPostIt
      :data="fpostitData"
      :is-open="open"
      @close="open = false"
    />
  </span>
</template>

<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import FloatingPostIt from '@/fpostit/components/FloatingPostIt.vue'
import { normalizeTheme, magnificaToFpostitColor, type CardsCanvasItem } from '@/components/magnifica/types'
import type { FpostitData } from '@/fpostit/types'

interface Props {
  callout: CardsCanvasItem
}

const props = defineProps<Props>()

const open = ref(false)
const triggerRef = ref<HTMLButtonElement | null>(null)

/** Stable per-instance id (only used for the popover's aria-labelledby). */
const uid = useId()
const key = `callout-${(uid ?? '0').replace(/[^a-zA-Z0-9_-]/g, '-')}`

const theme = computed(() => normalizeTheme(props.callout.props.themeColor ?? 'yellow'))

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

const fpostitData = computed<FpostitData>(() => {
  const p = props.callout.props
  const overline = p.overline ? `<p class="callout-overline">${escapeHtml(p.overline)}</p>` : ''
  const body = p.bodyText ? `<p>${escapeHtml(p.bodyText)}</p>` : ''
  return {
    key,
    title: p.headline ?? '',
    content: overline + body,
    color: magnificaToFpostitColor(p.themeColor),
    rotation: 'rotate-0',
    hlogic: 'element',
    triggerElement: triggerRef.value ?? undefined,
  }
})
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

.callout-phrase--yellow { text-decoration-color: var(--color-primary-bg, #ffee00); }
.callout-phrase--green  { text-decoration-color: var(--color-positive-bg, #57e389); }
.callout-phrase--pink   { text-decoration-color: var(--color-negative-bg, #f06292); }
.callout-phrase--dim    { text-decoration-color: var(--color-dimmed, #888888); }

.callout-phrase:hover {
  color: var(--color-primary-bg, #ffee00);
}

.callout-phrase:focus-visible {
  outline: 2px solid var(--color-primary-bg, #ffee00);
  outline-offset: 2px;
  border-radius: 2px;
}

@media (prefers-reduced-motion: reduce) {
  .callout-phrase {
    transition: none;
  }
}
</style>
