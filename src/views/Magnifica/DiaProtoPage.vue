<!--
  /proto · DiaStage HINGE PROTOTYPE — the held light, proven (HM 2026-06-12).

  THE MECHANISM (HP's insight · "the height does the timing"): every plate + shutter is the SAME
  height — one central `--dia-h` (a viewport proportion, set in onMounted/resize by TS · JS
  configures, CSS runs). All are `position: sticky` pinned at the SAME `top`, INSIDE THE STAGE
  (not per-act), with ASCENDING z-index. So:

    · a held light is sticky TO THE STAGE → it NEVER un-pins (no scroll-off · the i11→i13 floor:
      the image is covered, never scrolled — the element-anchored replacement for attachment:fixed);
    · the next plate (same `--dia-h`, same top, higher z) rises OVER it after exactly one `--dia-h`
      of scroll → the cover arrives precisely as the image would otherwise leave. The height is the
      timing. No per-element magic numbers.

  z-stack (ascending · the order of rising-over): light-1 (1) < figures-A (2–4) < blade (5) <
  light-2 (6) < figures-B (7–8) < opening-shutter (9, wipes away first). The opening shutter is
  the one genuine overlap (it must sit OVER light-1 at scroll 0 without pushing it down → a
  negative margin of exactly `--dia-h`, the same central height).

  ANCESTOR-PURITY: the stage + every ancestor stay plain blocks (no transform/overflow/contain/
  will-change) — the sticky pins die otherwise. Desktop-first; <768 linearises to normal flow.
-->

<template>
  <MagnificaPageLayout variant="standard">
    <template #header><MagnificaHeader compact /></template>

    <div
      ref="stageEl"
      class="proto-stage"
    >
      <!-- THE OPENING SHUTTER · z9 · the page opens behind it · overlaps light-1 (negative margin
           = -1·--dia-h · not a preceding block) so the image is already there; wipes up to uncover. -->
      <div class="proto-blade proto-blade--opening">
        <p class="proto-blade-over">DiaStage · hinge prototype</p>
        <p class="proto-blade-head">The image does not move.</p>
        <p class="proto-blade-lead">
          Scroll slowly and watch the photograph. The image behind this blade is
          <strong>already there</strong> — it never moves. The blade wipes up to <strong>uncover</strong>
          it; the reading rises and covers it; then the next blade opens a new held plate. The image
          never scrolls — only things pass over it.
        </p>
        <span class="proto-blade-line" aria-hidden="true" />
      </div>

      <!-- ACT 1 · the held light (z1 · sticky to the stage · never un-pins) -->
      <div
        class="proto-light proto-light--lane"
        role="img"
        aria-label="A performer behind translucent sheeting — the body witnessed, held."
        :style="{ backgroundImage: `url('${beats.unspoken.image}')` }"
      />
      <div class="proto-fig proto-fig--a1 proto-fig--1">
        <p class="proto-fig-over">the body, witnessed</p>
        <h2 class="proto-fig-head">NOT STORED — PERFORMED</h2>
        <p>The plate behind you does not move. You do. It holds while the reading rises past it.</p>
      </div>
      <div class="proto-fig proto-fig--a1 proto-fig--2">
        <p class="proto-fig-over">Schwebezustände</p>
        <h2 class="proto-fig-head">THE OPENLY-DECOUPLED STATE</h2>
        <p>This card rose from below and now covers the first — opaque, higher in the stack. The light is still the same held light.</p>
      </div>
      <div class="proto-fig proto-fig--a1 proto-fig--3">
        <p class="proto-fig-over">so the page holds it</p>
        <h2 class="proto-fig-head">THE LIGHT STAYS · THE READING PASSES</h2>
        <p>Three figures, one plate. The image never left — and now the blade rises over it.</p>
      </div>

      <!-- THE BLADE · z5 · rises over light-1 + the figures (covers them · same --dia-h) -->
      <div class="proto-blade proto-blade--mid">
        <p class="proto-blade-over">between horror and hope</p>
        <p class="proto-blade-text">— the black between —</p>
        <span class="proto-blade-line" aria-hidden="true" />
      </div>

      <!-- ACT 2 · a NEW held light (z6 · rises over the blade → the new plate) -->
      <div
        class="proto-light proto-light--lane proto-light--2"
        role="img"
        aria-label="The orange book against black, green shoots rising — a Szenische Lesung."
        :style="{ backgroundImage: `url('${beats.hope.image}')` }"
      />
      <div class="proto-fig proto-fig--a2 proto-fig--1">
        <p class="proto-fig-over">the figures rise</p>
        <h2 class="proto-fig-head">RAISE FROM THE BOOKS</h2>
        <p>A new plate opened behind the blade. The light changed; the stage did not. That swap is the act-break.</p>
      </div>
      <div class="proto-fig proto-fig--a2 proto-fig--2">
        <p class="proto-fig-over">five or ten hands</p>
        <h2 class="proto-fig-head">LARGER THAN ONE COULD BUILD</h2>
        <p>The reading rises again over the new light, and the stage holds it the same way. One mechanism, two acts.</p>
      </div>
    </div>
  </MagnificaPageLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import MagnificaPageLayout from './MagnificaPageLayout.vue'
import MagnificaHeader from './MagnificaHeader.vue'
import { beats } from './content/context'

/** JS CONFIGURES · CSS RUNS — the one seat for JS: measure the viewport on mount/resize and write
 *  the SINGLE height var every plate + shutter shares (--dia-h · a viewport proportion). The height
 *  does the timing (uniform plates · sticky-stacked) — CSS runs the choreography off this number. */
const stageEl = ref<HTMLElement>()
const HEIGHT_FRACTION = 0.82

function configure(): void {
  if (!stageEl.value) return
  const h = Math.round((window.innerHeight * HEIGHT_FRACTION))
  stageEl.value.style.setProperty('--dia-h', `${h}px`)
}

onMounted(() => {
  configure()
  window.addEventListener('resize', configure, { passive: true })
})
onUnmounted(() => window.removeEventListener('resize', configure))
</script>

<style scoped>
/* the stage · a plain block in normal flow (ancestor-purity) · the containing block for ALL the
   sticky plates, so a held light pins to the STAGE and never un-pins. */
.proto-stage {
  position: relative;
  --dia-top: var(--bb-navbar-offset, 6rem);
}

.proto-fig-over { font-size: 0.8125rem; opacity: 0.8; margin: 0 0 0.35rem; letter-spacing: 0.02em; }
.proto-fig-head { font-size: 1.25rem; font-weight: 700; line-height: 1.2; margin: 0 0 0.6rem; }
.proto-fig p:last-child { margin-bottom: 0; }

/* a blade/shutter · the black-between · the dasei gap-line. */
.proto-blade {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 0.5rem;
  background: #0b0b0c;
  color: #f4f4f4;
  border-radius: 4px;
  padding: 1.5rem clamp(1.25rem, 4vw, 3rem);
}
.proto-blade-over { font-size: 0.8125rem; opacity: 0.7; margin: 0; letter-spacing: 0.04em; }
.proto-blade-head { font-size: clamp(1.5rem, 3vw, 2.25rem); font-weight: 700; margin: 0; line-height: 1.2; }
.proto-blade-text { font-size: 1.1rem; margin: 0; letter-spacing: 0.06em; }
.proto-blade-lead { max-width: 42rem; font-size: 0.9375rem; line-height: 1.6; opacity: 0.92; margin: 0; }
.proto-blade-line { width: 2px; height: 3rem; background: var(--color-primary-bg); margin-top: 0.25rem; }

/* mobile (<768) · linearise: every plate/figure is a normal-flow block, top to bottom. */
.proto-light {
  width: 100%;
  min-height: 16rem;
  background-size: cover;
  background-position: center;
  background-color: var(--color-bg);
  border-radius: 4px;
}
.proto-fig { margin-top: 1.5rem; }
.proto-blade--mid, .proto-blade--opening { margin-top: 1.5rem; min-height: 12rem; }

@media (min-width: 768px) {
  /* THE UNIFORM PLATE · every held light + every blade is the SAME --dia-h, sticky at the SAME
     top, inside the stage → the held light never un-pins; the next plate rises over it after one
     --dia-h of scroll. ASCENDING z = the order of rising-over (the height does the timing). */
  .proto-light,
  .proto-blade--mid,
  .proto-blade--opening {
    position: sticky;
    top: var(--dia-top);
    height: var(--dia-h, 82vh);
    min-height: 0;
    margin: 0;
  }

  /* held lights · left lane · the ground (lowest z) */
  .proto-light--lane { width: 48%; z-index: 1; }
  .proto-light--2 { z-index: 6; }   /* rises OVER the blade → the new plate */

  /* the figures · rise from below into the RIGHT lane, pin at ascending tops, opaque + higher z
     than their light so they COVER it (the validated Scene-A recipe). margin-top = the pause. */
  .proto-fig {
    position: sticky;
    left: 52%;
    width: 46%;
    margin: 0;
    background: var(--color-bg);
    padding: 1.25rem 1.5rem;
    border-radius: 4px;
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.3);
  }
  .proto-fig--a1.proto-fig--1 { top: calc(var(--dia-top) + 3rem);  margin-top: 16vh; z-index: 2; }
  .proto-fig--a1.proto-fig--2 { top: calc(var(--dia-top) + 9rem);  margin-top: 60vh; z-index: 3; }
  .proto-fig--a1.proto-fig--3 { top: calc(var(--dia-top) + 15rem); margin-top: 60vh; z-index: 4; }
  .proto-fig--a2.proto-fig--1 { top: calc(var(--dia-top) + 3rem);  margin-top: 16vh; z-index: 7; }
  .proto-fig--a2.proto-fig--2 { top: calc(var(--dia-top) + 9rem);  margin-top: 60vh; z-index: 8; }

  /* the mid blade · full-width · z5 · rises over light-1 + the act-1 figures (covers them).
     It never un-pins either; light-2 (z6) then rises over it → the act-break. */
  .proto-blade--mid {
    width: 100%;
    z-index: 5;
  }

  /* the opening shutter · z9 (over everything) · the ONE genuine overlap: a negative margin of
     exactly -1·--dia-h pulls light-1 up into the same slot (no push-down), so the image is already
     there behind it; the blade then wipes up to uncover it. */
  .proto-blade--opening {
    width: 100%;
    z-index: 9;
    margin-bottom: calc(-1 * var(--dia-h, 82vh));
  }

  /* the WIPE · only where scroll-driven animations ship (Chromium + Safari 26). Elsewhere the
     opening blade is a plain sticky cover that scrolls away (degraded, never broken).
     Firefox-stable: `import 'scroll-timeline-polyfill'` lights this up (the production path). */
  @supports (animation-timeline: view()) {
    .proto-blade--opening {
      animation: proto-opening-wipe linear both;
      animation-timeline: view(block);
      animation-range: cover 0% cover 30%;
    }
    @keyframes proto-opening-wipe {
      from { transform: translateY(0); }       /* covering the held light at scroll 0 */
      to { transform: translateY(-105%); }     /* swept up · the held light (already there) is uncovered */
    }
  }
}

@media (prefers-reduced-motion: reduce) {
  .proto-blade--opening { animation: none !important; }
}
</style>
