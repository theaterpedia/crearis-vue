<!--
  UnlockOverlay · the one-beat unlock animation that plays once after password-success.

  ==Cand-1c §11.4 shrink== (2026-06-03): the prior 3-beat staging (CCC → CCCS →
  CCC+CCCS) is tightened to a single British-understated beat. The CCC + CCCS
  double-anchor naming IS the joke; three beats over-stages it. Williams "Culture
  is ordinary" moves to Page 3 §3; Hall "Identity is not an essence" moves to
  Page 2 abstract — neither citation is lost · only the staging compresses.

  Timing (per §11.4):
    - 1.2s fade-in + 2.2s hold = 3400ms beat-duration
    - 600ms overlay opacity-fade (carries the exit · no separate beat-fadeout)
    - 4000ms total · emit complete

  Trigger: mounted by LandingPage when `?just_unlocked=1` is on the URL after
  the middleware's success-redirect. Component manages its own teardown via
  setTimeout. Emits `complete` after the fade · parent removes via v-if.

  Accessibility: aria-hidden="true" on the root · the content is brief and
  decorative-leaning. prefers-reduced-motion shows the text static, fades after
  1.5s instead of 4s (per §11.4 reduced-motion treatment).
-->

<template>
  <div
    class="unlock-overlay"
    :class="{ 'unlock-overlay--finishing': finishing }"
    aria-hidden="true"
  >
    <div class="unlock-beat">
      <h2 class="unlock-headline">CCC + CCCS</h2>
      <p class="unlock-body">
        Hackerethik from Hamburg ·<br />
        organic intellectual from Birmingham —
      </p>
      <p class="unlock-body unlock-body--coda">
        the two anchors of one practice,<br />
        for thirty years.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'

const emit = defineEmits<{
  complete: []
}>()

const finishing = ref(false)
let finishingTimer: ReturnType<typeof setTimeout> | null = null
let completeTimer: ReturnType<typeof setTimeout> | null = null

// Cand-1c §11.4 timing: 1.2s fade-in + 2.2s hold = 3400ms beat-duration · then
// the overlay opacity-fades for 600ms (CSS transition) · 4000ms total to complete.
const HOLD_DURATION_MS = 3400
const FADE_OUT_DURATION_MS = 600

onMounted(() => {
  finishingTimer = setTimeout(() => {
    finishing.value = true
  }, HOLD_DURATION_MS)
  completeTimer = setTimeout(() => {
    emit('complete')
  }, HOLD_DURATION_MS + FADE_OUT_DURATION_MS)
})

onUnmounted(() => {
  if (finishingTimer) clearTimeout(finishingTimer)
  if (completeTimer) clearTimeout(completeTimer)
})
</script>

<style scoped>
.unlock-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: #1a1a1a;
  color: #f4f4f4;
  font-family: ui-monospace, "JetBrains Mono", "Cascadia Code", Menlo, Consolas, monospace;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 2rem;
  overflow: hidden;
  transition: opacity 600ms ease;
}

.unlock-overlay--finishing {
  opacity: 0;
  pointer-events: none;
}

.unlock-beat {
  max-width: 60rem;
  padding: 0 2rem;
  opacity: 0;
  animation: beat-fade-in 1200ms ease forwards;
  animation-delay: 0ms;
}

.unlock-headline {
  font-size: clamp(2rem, 6vw, 4rem);
  font-weight: 700;
  color: #ffee00;
  margin: 0 0 1.5rem;
  letter-spacing: 0.02em;
}

.unlock-body {
  font-size: clamp(1rem, 2.5vw, 1.5rem);
  line-height: 1.6;
  margin: 0;
}

.unlock-body--coda {
  margin-top: 1.25rem;
  color: #aaa;
}

@keyframes beat-fade-in {
  0%   { opacity: 0; transform: translateY(8px); }
  100% { opacity: 1; transform: translateY(0); }
}

@media (max-width: 640px) {
  .unlock-beat {
    padding: 0 1rem;
  }
}

/* Reduced-motion · skip the fade-in · show static · overlay fades earlier (1500ms vs 3400ms) */
@media (prefers-reduced-motion: reduce) {
  .unlock-beat {
    animation: none;
    opacity: 1;
    transform: none;
  }
  .unlock-overlay {
    animation: respect-reduced-motion-fade 600ms ease 1500ms forwards;
  }
}

@keyframes respect-reduced-motion-fade {
  to {
    opacity: 0;
    visibility: hidden;
  }
}
</style>
