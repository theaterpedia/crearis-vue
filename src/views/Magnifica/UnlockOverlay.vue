<!--
  UnlockOverlay · the 3-beat unlock animation that plays once after password-success.

  ==Cand-1a 3-beat staging== (per docs/animations.md §1+§2 + candidate-1a/page-zero-unlock.md):
    Beat 1 · CCC · Chaos Computer Club Hackerethik (German + English subline)
    Beat 2 · CCCS · Stuart Hall "Identity is not an essence, it is a positioning." (Hall, HM-ratified Q-HM-2)
    Beat 3 · CCC + CCCS · Hans's one-sentence onboarding · then the overlay fades to reveal the page

  The double-anchor naming (two CC-prefixed communities Olah will recognize) IS the payoff.
  Cand-1c shrank this to one beat; cand-1a restores the full 3-beat per its deploy.

  Timing (per animations.md §2.1):
    - Beat 1: 0ms → 2800ms · Beat 2: 2800ms → 5600ms · Beat 3: 5600ms → 9000ms (fade-and-hold)
    - 9000ms total beats · then 600ms overlay opacity-fade · emit complete at 9600ms.

  Trigger: mounted by LandingPage when `?just_unlocked=1` is on the URL after the
  middleware's success-redirect. Component manages its own teardown via setTimeout.

  Accessibility: aria-hidden="true" on the root. prefers-reduced-motion skips beats 1+2,
  shows beat 3 static, fades the overlay after 2s (per animations.md §2.2).
-->

<template>
  <div
    class="unlock-overlay"
    :class="{ 'unlock-overlay--finishing': finishing }"
    aria-hidden="true"
  >
    <!-- Beat 1 · CCC anchor -->
    <div class="unlock-beat unlock-beat--1">
      <h1>Öffentliche Daten nützen, private Daten schützen.</h1>
      <p class="unlock-cite">Chaos Computer Club · Hackerethik</p>
      <p class="unlock-translation">Use public data. Protect private data.</p>
    </div>

    <!-- Beat 2 · CCCS anchor · Hall -->
    <div class="unlock-beat unlock-beat--2">
      <h1>Identity is not an essence, it is a positioning.</h1>
      <p class="unlock-cite">Stuart Hall · CCCS Birmingham</p>
    </div>

    <!-- Beat 3 · Hans's one-sentence · CCC + CCCS -->
    <div class="unlock-beat unlock-beat--3">
      <h2 class="unlock-headline">CCC + CCCS</h2>
      <p class="unlock-body">
        Hackerethik from Hamburg, organic intellectual from Birmingham —<br />
        two anchors, one practice, thirty years.
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

// Animations.md §2.1 timing: 3 beats × 2.8s (beat-3 holds to 9000ms) · then the
// overlay opacity-fades for 600ms (CSS transition) · ~9600ms total to complete.
const BEATS_DURATION_MS = 9000
const FADE_OUT_DURATION_MS = 600

onMounted(() => {
  finishingTimer = setTimeout(() => {
    finishing.value = true
  }, BEATS_DURATION_MS)
  completeTimer = setTimeout(() => {
    emit('complete')
  }, BEATS_DURATION_MS + FADE_OUT_DURATION_MS)
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
  position: absolute;
  max-width: 60rem;
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

.unlock-headline {
  font-size: clamp(2rem, 6vw, 4rem);
  font-weight: 700;
  color: #ffee00;
  margin: 0 0 1.25rem;
  letter-spacing: 0.02em;
}

.unlock-body {
  font-size: clamp(1rem, 2.25vw, 1.5rem);
  line-height: 1.5;
  margin: 0 0 1rem;
}

.unlock-cite {
  font-size: clamp(0.875rem, 1.5vw, 1rem);
  color: #aaa;
  margin: 0;
}

.unlock-translation {
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

/* Beat 3 · 5600ms → 9000ms · holds (fade in only, no fade out before overlay-fade) */
.unlock-beat--3 {
  animation-name: beat-fade-and-hold;
  animation-duration: 3400ms;
  animation-delay: 5600ms;
}

@keyframes beat-fade {
  0%   { opacity: 0; transform: translateY(8px); }
  20%  { opacity: 1; transform: translateY(0); }
  80%  { opacity: 1; transform: translateY(0); }
  100% { opacity: 0; transform: translateY(-8px); }
}

@keyframes beat-fade-and-hold {
  0%   { opacity: 0; transform: translateY(8px); }
  20%  { opacity: 1; transform: translateY(0); }
  100% { opacity: 1; transform: translateY(0); }
}

@media (max-width: 640px) {
  .unlock-beat {
    padding: 0 1rem;
  }
}

/* Reduced-motion · skip beats 1+2 · show beat-3 static · overlay fades after 2s */
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
