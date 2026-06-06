<!--
  PopOverPostIt · floating popover shell rendering a PostIt inside.

  Per crearis:projects/magnifica/docs/codebase-options-for-candidates.md §2 +
  cand-1c conception §6 + §11.5. The general-purpose detail-page-scale post-it-
  callout mechanic · reuses the existing PostIt component as the card · this
  shell only adds floating-positioning + open/close + ARIA + click-outside-to-
  close + Esc-dismiss + return-focus-to-trigger.

  Non-modal dialog (per cand-1c §6 ARIA spec: `role="dialog" aria-modal="false"`).
  No focus-trap · users can Tab away · the response page below stays reachable.

  Mobile (≤640px): renders as bottom-sheet (fixed · full-width · half-height)
  instead of floating against the anchor · per cand-1c conception §6.

  Used by CalloutPhrase.vue · also usable standalone if needed.
-->

<template>
  <Teleport to="body">
    <div
      v-if="open"
      ref="popoverRef"
      class="popover-postit"
      :class="{ 'popover-postit--positioned': hasPosition }"
      role="dialog"
      aria-modal="false"
      :aria-labelledby="ariaLabelId"
      :style="positionStyle"
      tabindex="-1"
    >
      <button
        type="button"
        class="popover-postit-close"
        aria-label="Close callout"
        @click="emit('close')"
      >×</button>
      <div :id="ariaLabelId" class="popover-postit-body">
        <PostIt v-bind="postit" />
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref, useId, watch } from 'vue'
import PostIt from '@/components/magnifica/PostIt.vue'
import type { CardsCanvasItem } from '@/components/magnifica/types'

interface Props {
  open: boolean
  anchorEl?: HTMLElement | null
  /** PostIt props (CardsCanvasItem['props'] shape) — forwarded to the rendered PostIt. */
  postit: CardsCanvasItem['props']
}

const props = defineProps<Props>()
const emit = defineEmits<{ close: [] }>()

const popoverRef = ref<HTMLElement | null>(null)
const positionStyle = ref('')
const hasPosition = ref(false)
const ariaLabelId = useId()

let returnFocusTarget: HTMLElement | null = null

const POPOVER_WIDTH_PX = 320
const POPOVER_GAP_PX = 8
const VIEWPORT_PADDING_PX = 16
const MOBILE_BREAKPOINT_PX = 640

function isMobile(): boolean {
  return typeof window !== 'undefined' && window.innerWidth <= MOBILE_BREAKPOINT_PX
}

function computePosition() {
  if (!props.anchorEl || isMobile()) {
    positionStyle.value = ''
    hasPosition.value = false
    return
  }
  const rect = props.anchorEl.getBoundingClientRect()
  const top = rect.bottom + window.scrollY + POPOVER_GAP_PX
  const rawLeft = rect.left + window.scrollX
  const maxLeft = Math.max(
    VIEWPORT_PADDING_PX,
    window.innerWidth - POPOVER_WIDTH_PX - VIEWPORT_PADDING_PX,
  )
  const constrainedLeft = Math.min(rawLeft, maxLeft)
  positionStyle.value = `top: ${top}px; left: ${constrainedLeft}px;`
  hasPosition.value = true
}

watch(() => props.open, async (next) => {
  if (next) {
    if (typeof document !== 'undefined') {
      returnFocusTarget = document.activeElement as HTMLElement | null
    }
    await nextTick()
    computePosition()
    popoverRef.value?.focus()
  } else if (returnFocusTarget) {
    returnFocusTarget.focus()
    returnFocusTarget = null
  }
})

function handleClickOutside(event: MouseEvent) {
  if (!props.open) return
  const target = event.target as Node
  const inPopover = !!(popoverRef.value && popoverRef.value.contains(target))
  const inAnchor = !!(props.anchorEl && props.anchorEl.contains(target))
  if (!inPopover && !inAnchor) {
    emit('close')
  }
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && props.open) {
    emit('close')
  }
}

onMounted(() => {
  if (typeof document === 'undefined') return
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('keydown', handleKeydown)
  window.addEventListener('resize', computePosition)
  window.addEventListener('scroll', computePosition, { passive: true })
})

onUnmounted(() => {
  if (typeof document === 'undefined') return
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('keydown', handleKeydown)
  window.removeEventListener('resize', computePosition)
  window.removeEventListener('scroll', computePosition)
})
</script>

<style scoped>
.popover-postit {
  position: fixed;
  /* Mobile default: bottom-sheet · overridden by computed top/left on desktop */
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  width: auto;
  max-height: 50vh;
  overflow-y: auto;
  background: rgba(26, 26, 26, 0.5);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  padding: 1rem;
  border-radius: 12px 12px 0 0;
  box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.5);
  animation: slide-up 200ms ease;
}

.popover-postit:focus {
  outline: none;
}

@media (min-width: 641px) {
  /* Desktop: switch to absolute-positioned floating popover when positioned */
  .popover-postit--positioned {
    position: absolute;
    bottom: auto;
    right: auto;
    width: 320px;
    max-height: none;
    border-radius: 6px;
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.4);
    animation: fade-in 150ms ease;
  }
}

.popover-postit-close {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  width: 2rem;
  height: 2rem;
  font-size: 1.5rem;
  line-height: 1;
  background: rgba(255, 255, 255, 0.1);
  color: #f4f4f4;
  border: 0;
  border-radius: 50%;
  cursor: pointer;
  z-index: 1;
  transition: background-color 150ms ease;
}

.popover-postit-close:hover {
  background: rgba(255, 255, 255, 0.2);
}

.popover-postit-close:focus-visible {
  outline: 2px solid #ffee00;
  outline-offset: 2px;
}

.popover-postit-body {
  position: relative;
}

@keyframes slide-up {
  from { transform: translateY(100%); opacity: 0; }
  to   { transform: translateY(0);    opacity: 1; }
}

@keyframes fade-in {
  from { opacity: 0; transform: translateY(-4px); }
  to   { opacity: 1; transform: translateY(0); }
}

@media (prefers-reduced-motion: reduce) {
  .popover-postit,
  .popover-postit--positioned {
    animation: none;
  }
  .popover-postit-close {
    transition: none;
  }
}
</style>
