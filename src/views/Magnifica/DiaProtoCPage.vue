<!--
  /protoc · Pattern C HINGE — the DISTINCT dead-still hold (NOT Hero's over-tall-sticky-cover).
  Bench: §20/§21. C's mechanic (HP-pinned 2026-06-12): ONE `position: fixed` projector layer —
  dead-still in the viewport (a truer "never moves" than sticky), aligned to the 90rem-centred
  LANE (not the whole viewport), scoped to the stage's on-screen range. The plate cross-fades
  per scene (C-2); this file proves the HOLD first (the make-or-break geometry · catch-up).

  Why fixed, not Hero's cover: one projector (dissolves the §18 multi-Dia z-coordination), and
  `position:fixed` on the ELEMENT is iOS-reliable (unlike `background-attachment:fixed` · the §15
  trap). HONEST: `position:fixed` is NOT ancestor-purity-immune (it re-bases under any ancestor
  transform/filter/contain/will-change — the same gotcha as sticky); only Hero's own-transform
  cover escapes that. So C's win is the one-projector + cross-fade, not robustness over A/B.

  JS CONFIGURES · CSS RUNS: JS measures the stage's lane geometry (left/width) → CSS vars the
  fixed projector reads; an IntersectionObserver toggles `is-on` (scope-to-range). JS never drives
  the scroll. The hold + the rises are pure CSS (fixed + sticky).
-->

<template>
  <MagnificaPageLayout variant="standard">
    <template #header><MagnificaHeader compact /></template>

    <template #hero>
      <header class="protoc-hero">
        <p class="protoc-over">DiaStage · Pattern C · hinge</p>
        <h1 class="protoc-head">Does a fixed plate hold the lane?</h1>
        <p class="protoc-lead">
          Scroll slowly. The image is one <strong>fixed projector</strong> — it must sit dead-still
          in the <strong>left lane of the 90rem column</strong> (not glued to the whole viewport),
          while the reading rises and covers in the right lane. If the plate stays put and aligned
          as the figures pass, the distinct hold clears the floor.
        </p>
      </header>
    </template>

    <div
      ref="stageEl"
      class="diac-stage"
      :class="{ 'diac-stage--on': projectorOn }"
    >
      <!-- the ONE fixed projector · dead-still · element-anchored · bounded to the lane (JS vars) -->
      <div class="diac-projector">
        <div
          class="diac-plate"
          role="img"
          aria-label="A performer behind translucent sheeting — held, witnessed."
          :style="{ backgroundImage: `url('${beats.unspoken.image}')` }"
        />
      </div>

      <!-- the act · tall (figures + pauses give the scroll travel the held plate spans) -->
      <section class="diac-act">
        <div class="diac-fig diac-fig--1">
          <p class="diac-fig-over">the body, witnessed</p>
          <h2 class="diac-fig-head">NOT STORED — PERFORMED</h2>
          <p>The plate to the left does not move at all. You do. It is fixed to the lane while this reading rises past it.</p>
        </div>
        <div class="diac-fig diac-fig--2">
          <p class="diac-fig-over">Schwebezustände</p>
          <h2 class="diac-fig-head">THE OPENLY-DECOUPLED STATE</h2>
          <p>This card rose from below and covers the first — opaque, higher in the stack. The light to the left is the same held light, still aligned to the column.</p>
        </div>
        <div class="diac-fig diac-fig--3">
          <p class="diac-fig-over">the light stays</p>
          <h2 class="diac-fig-head">THE READING PASSES · THE LIGHT HOLDS</h2>
          <p>Three figures, one fixed plate. The image never left and never drifted from the lane — that dead-still hold is Pattern C's floor. Next (C-2): the plate cross-fades to the new scene.</p>
        </div>
      </section>
    </div>
  </MagnificaPageLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import MagnificaPageLayout from './MagnificaPageLayout.vue'
import MagnificaHeader from './MagnificaHeader.vue'
import { beats } from './content/context'

const stageEl = ref<HTMLElement>()
const projectorOn = ref(false)

/** JS CONFIGURES: measure the stage's lane geometry → CSS vars the fixed projector reads.
 *  `getBoundingClientRect().left` is viewport-relative (what `position:fixed left` needs); stable
 *  across vertical scroll, recomputed on resize. The left lane = 48% of the stage's content box. */
function configure(): void {
  const el = stageEl.value
  if (!el) return
  const r = el.getBoundingClientRect()
  el.style.setProperty('--diac-left', `${Math.round(r.left)}px`)
  el.style.setProperty('--diac-lane-w', `${Math.round(r.width * 0.48)}px`)
  el.style.setProperty('--diac-h', `${Math.round(window.innerHeight * 0.7)}px`)
}

let io: IntersectionObserver | undefined
onMounted(() => {
  configure()
  window.addEventListener('resize', configure, { passive: true })
  // scope-to-range: the fixed projector shows only while the stage overlaps the viewport
  // (else it would float over the hero/footer). JS OBSERVES; CSS transitions the opacity.
  io = new IntersectionObserver(
    ([entry]) => { projectorOn.value = entry.isIntersecting },
    { threshold: 0 },
  )
  if (stageEl.value) io.observe(stageEl.value)
})
onUnmounted(() => {
  window.removeEventListener('resize', configure)
  io?.disconnect()
})
</script>

<style scoped>
/* the stage · a plain block in normal flow (ancestor-purity — fixed re-bases under any ancestor
   transform/overflow/contain/will-change, same as sticky). */
.diac-stage {
  position: relative;
}

/* ==Hero== */
.protoc-hero { padding-top: clamp(1rem, 4vh, 2.5rem); }
.protoc-over { font-size: 0.875rem; margin: 0 0 0.5rem; letter-spacing: 0.02em; opacity: 0.85; }
.protoc-head { font-size: clamp(1.5rem, 3vw, 2.25rem); font-weight: 700; margin: 0 0 1rem; line-height: 1.2; }
.protoc-lead { max-width: 46rem; font-size: 0.9375rem; line-height: 1.6; color: var(--color-muted-contrast); margin: 0; }

/* mobile (<768) · linearise: the plate is a normal-flow illustration, figures flow below it. */
.diac-projector {
  width: 100%;
  min-height: 16rem;
  margin-bottom: 1.5rem;
}
.diac-plate {
  width: 100%;
  height: 100%;
  min-height: 16rem;
  background-size: cover;
  background-position: center top;
  background-color: var(--color-bg);
  border-radius: 4px;
}
.diac-fig { margin-top: 1.5rem; }

@media (min-width: 768px) {
  .diac-act { position: relative; }

  /* THE FIXED PROJECTOR · dead-still in the viewport, bounded to the lane (JS vars). z1 = ground.
     Hidden until the stage is on-screen (IO → .diac-stage--on); fades, never jumps. */
  .diac-projector {
    position: fixed;
    top: var(--diac-top, var(--bb-navbar-offset, 6rem));
    left: var(--diac-left, 0);
    width: var(--diac-lane-w, 48%);
    height: var(--diac-h, 70vh);
    margin: 0;
    min-height: 0;
    z-index: 1;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.45s ease;
  }
  .diac-stage--on .diac-projector {
    opacity: 1;
  }
  .diac-plate {
    position: absolute;
    inset: 0;
    min-height: 0;
  }

  /* THE FIGURES · rise into the right lane, pin at ascending tops (accumulate), each opaque +
     higher z so it covers the prior (validated Scene-A recipe). margin-top = the pause. The tall
     act gives the fixed plate its hold-range. */
  .diac-fig {
    position: sticky;
    left: 52%;
    width: 46%;
    z-index: 2;
    margin: 0;
    background: var(--color-bg);
    padding: 1.25rem 1.5rem;
    border-radius: 4px;
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.3);
  }
  .diac-fig--1 { top: calc(var(--bb-navbar-offset, 6rem) + 3rem);  margin-top: 16vh; }
  .diac-fig--2 { top: calc(var(--bb-navbar-offset, 6rem) + 9rem);  margin-top: 70vh; z-index: 3; }
  .diac-fig--3 { top: calc(var(--bb-navbar-offset, 6rem) + 15rem); margin-top: 70vh; z-index: 4; }
}

.diac-fig-over { font-size: 0.8125rem; opacity: 0.8; margin: 0 0 0.35rem; letter-spacing: 0.02em; }
.diac-fig-head { font-size: 1.25rem; font-weight: 700; line-height: 1.2; margin: 0 0 0.6rem; }
.diac-fig p:last-child { margin-bottom: 0; }
</style>
