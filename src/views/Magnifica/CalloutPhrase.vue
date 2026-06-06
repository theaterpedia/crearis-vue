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
      :aria-expanded="expanded"
      aria-haspopup="dialog"
      @click="onTrigger"
    >
      <slot />
    </button>
    <!-- playful/scientific render the popover LOCALLY (clean unmount). glossary routes
         through the controller → the page's <FpostitRenderer/> renders the open stack. -->
    <FloatingPostIt
      v-if="!isGlossary"
      :data="fpostitData"
      :is-open="open"
      @close="open = false"
    />
  </span>
</template>

<script setup lang="ts">
import { computed, ref, useId, inject, onMounted, onUnmounted } from 'vue'
import FloatingPostIt from '@/fpostit/components/FloatingPostIt.vue'
import { getRandomRotation } from '@/fpostit/utils/positioning'
import { useFpostitController } from '@/fpostit/composables/useFpostitController'
import { normalizeTheme, magnificaToFpostitColor, type CardsCanvasItem } from '@/components/magnifica/types'
import { MAGNIFICA_POSTIT_MODE, SCIENTIFIC_MIN_WIDTH, type MagnificaPostitMode } from './content/postit-mode'
import type { FpostitData } from '@/fpostit/types'

interface Props {
  callout: CardsCanvasItem
}

const props = defineProps<Props>()

const open = ref(false)
const triggerRef = ref<HTMLButtonElement | null>(null)
const controller = useFpostitController()

// Page-level post-it mode (provided per page · default 'playful').
//  - 'scientific' (e.g. /discourse): on a wide viewport the popover opens to the
//    RIGHT, vertically aligned to the trigger → two-lane close-reading. No rotation.
//  - 'playful' (default): popover opens near the trigger with a subtle, stable
//    random tilt. Per HM 2026-06-06.
const mode = inject<MagnificaPostitMode>(MAGNIFICA_POSTIT_MODE, 'playful')
const isGlossary = mode === 'glossary'
const baseRotation = mode === 'playful' ? getRandomRotation() : 'rotate-0'

/** Stable per-instance id (only used for the popover's aria-labelledby). */
const uid = useId()
const key = `callout-${(uid ?? '0').replace(/[^a-zA-Z0-9_-]/g, '-')}`

const theme = computed(() => normalizeTheme(props.callout.props.themeColor ?? 'yellow'))

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/** overline + body as the post-it's HTML content (shared by local + glossary paths). */
function renderContent(): string {
  const p = props.callout.props
  const overline = p.overline ? `<p class="callout-overline">${escapeHtml(p.overline)}</p>` : ''
  const body = p.bodyText ? `<p>${escapeHtml(p.bodyText)}</p>` : ''
  return overline + body
}

function isWideViewport(): boolean {
  return typeof window !== 'undefined' && window.innerWidth > SCIENTIFIC_MIN_WIDTH
}

// Local popover data (playful/scientific). Glossary registers its own via the controller.
const fpostitData = computed<FpostitData>(() => {
  const p = props.callout.props
  // Reference `open` so hlogic re-evaluates against the live viewport at open-time.
  const rightLane = mode === 'scientific' && open.value && isWideViewport()
  return {
    key,
    title: p.headline ?? '',
    content: renderContent(),
    color: magnificaToFpostitColor(p.themeColor),
    rotation: rightLane ? 'rotate-0' : baseRotation,
    hlogic: rightLane ? 'right' : 'element',
    triggerElement: triggerRef.value ?? undefined,
  }
})

// ==Glossary mode== · register on mount, remove on unmount (no cross-page leak),
// open through the controller so glosses persist + stack as the reading-trail.
onMounted(() => {
  if (!isGlossary) return
  const p = props.callout.props
  controller.create({
    key,
    title: p.headline ?? '',
    content: renderContent(),
    color: magnificaToFpostitColor(p.themeColor),
    rotation: 'rotate-0',
    hlogic: isWideViewport() ? 'right' : 'element',
  })
})

onUnmounted(() => {
  if (isGlossary) controller.remove(key)
})

const expanded = computed(() => (isGlossary ? controller.isOpen(key) : open.value))

function onTrigger() {
  if (isGlossary) controller.openPostit(key, triggerRef.value ?? undefined)
  else open.value = true
}
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
