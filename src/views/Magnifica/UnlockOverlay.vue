<!--
  UnlockOverlay · the 3-beat unlock animation that plays once after password-success.

  Per crearis:projects/magnifica/docs/animations.md §1 (CCC → CCCS → Hans
  one-sentence + boom · the joke/payoff is naming the TWO CC-prefixed
  communities Olah will recognize as serious) + §2 (CSS-driven · 9-second
  total · respects prefers-reduced-motion).

  Beat 1 (§1.2) · Chaos Computer Club · Hackerethik
  Beat 2 (§1.3) · Raymond Williams · CCCS Birmingham orbit (primary option ·
    swappable to Stuart Hall's "Identity is not an essence, it is a positioning"
    per the §1.3 alternative if HM prefers)
  Beat 3 (§1.4) · Hans's one-sentence + boom

  Trigger: mounted by LandingPage when `?just_unlocked=1` is on the URL after
  the middleware's success-redirect. The component manages its own teardown
  via setTimeout (~9s total + 600ms fade-out). Emits `complete` after the
  fade · parent removes via v-if.

  Accessibility: aria-hidden="true" on the root · the content is brief and
  decorative-leaning · the response page below carries the load-bearing text
  for screen-readers. prefers-reduced-motion skips beats 1+2 entirely and
  shows beat 3 only for ~2s before fading.
-->

<template>
  <div
    class="unlock-overlay"
    :class="{ 'unlock-overlay--finishing': finishing }"
    aria-hidden="true"
  >
    <!-- Beat 1 · CCC anchor (Hackerethik) -->
    <div class="unlock-beat unlock-beat--1">
      <h1>Öffentliche Daten nützen, private Daten schützen.</h1>
      <p class="unlock-cite">Chaos Computer Club · Hackerethik</p>
      <p class="unlock-translation">Use public data. Protect private data.</p>
    </div>

    <!-- Beat 2 · CCCS anchor (Raymond Williams · §1.3 primary) -->
    <div class="unlock-beat unlock-beat--2">
      <h1>Culture is ordinary.</h1>
      <p class="unlock-cite">Raymond Williams · CCCS Birmingham orbit</p>
    </div>

    <!-- Beat 3 · Hans's one-sentence + boom -->
    <div class="unlock-beat unlock-beat--3">
      <h2 class="unlock-headline">CCC + CCCS</h2>
      <p class="unlock-body">
        Hackerethik from Hamburg, organic intellectual from Birmingham —
        the two anchors of one practice, for thirty years.
      </p>
      <p class="unlock-cite">Hans Dönitz · Theaterpädagoge · Fürth, Bayern</p>
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

// Total timing per animations.md §1.1: ~9000ms (3 beats × 2.8s + tail).
// At 9000ms set finishing=true → CSS triggers 600ms opacity-fade-out.
// At 9600ms emit complete → parent v-if unmounts the overlay.
const HOLD_DURATION_MS = 9000
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
/* Per animations.md §2.2 · plain CSS · no Tailwind */
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
  position: absolute;
  max-width: 50rem;
  padding: 0 2rem;
  opacity: 0;
  animation-fill-mode: forwards;
  animation-timing-function: ease;
}

.unlock-beat h1 {
  font-size: clamp(1.5rem, 5vw, 3rem);
  font-weight: 700;
  line-height: 1.25;
  margin: 0 0 1rem;
}

.unlock-beat .unlock-headline {
  font-size: clamp(2rem, 6vw, 4rem);
  font-weight: 700;
  color: #ffee00;
  margin: 0 0 1.25rem;
  letter-spacing: 0.02em;
}

.unlock-beat .unlock-body {
  font-size: clamp(1rem, 2.25vw, 1.5rem);
  line-height: 1.5;
  margin: 0 0 1rem;
}

.unlock-beat .unlock-cite {
  font-size: clamp(0.875rem, 1.5vw, 1rem);
  color: #aaa;
  margin: 0;
}

.unlock-beat .unlock-translation {
  font-size: clamp(0.75rem, 1.25vw, 0.9rem);
  color: #aaa;
  opacity: 0.7;
  margin: 0.75rem 0 0;
  font-style: italic;
}

/* Beat 1 · 0ms → 2800ms */
.unlock-beat--1 {
  animation-name: beat-fade;
  animation-duration: 2800ms;
  animation-delay: 0ms;
}

/* Beat 2 · 2800ms → 5600ms */
.unlock-beat--2 {
  animation-name: beat-fade;
  animation-duration: 2800ms;
  animation-delay: 2800ms;
}

/* Beat 3 · 5600ms → 9000ms · fade-in-and-hold (overlay-fade carries the exit) */
.unlock-beat--3 {
  animation-name: beat-fade-and-hold;
  animation-duration: 3400ms;
  animation-delay: 5600ms;
}

@keyframes beat-fade {
  0% {
    opacity: 0;
    transform: translateY(8px);
  }
  20% {
    opacity: 1;
    transform: translateY(0);
  }
  80% {
    opacity: 1;
    transform: translateY(0);
  }
  100% {
    opacity: 0;
    transform: translateY(-8px);
  }
}

@keyframes beat-fade-and-hold {
  0% {
    opacity: 0;
    transform: translateY(8px);
  }
  20% {
    opacity: 1;
    transform: translateY(0);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 640px) {
  .unlock-beat {
    padding: 0 1rem;
  }
}

/* Reduced-motion · skip beats 1+2 · show beat 3 only · fade after 2s */
@media (prefers-reduced-motion: reduce) {
  .unlock-beat--1,
  .unlock-beat--2 {
    display: none;
  }
  .unlock-beat--3 {
    animation: none;
    opacity: 1;
    transform: none;
  }
  .unlock-overlay {
    animation: respect-reduced-motion-fade 600ms ease 2000ms forwards;
  }
}

@keyframes respect-reduced-motion-fade {
  to {
    opacity: 0;
    visibility: hidden;
  }
}
</style>
