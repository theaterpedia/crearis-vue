<!--
  /proto · DiaStage HINGE PROTOTYPE — the held light, three plates, shutter-masked seams.
  (HM 2026-06-12 · grounded in backslide §24 — the scroll-mechanism research.)

  TWO mechanisms, NOT conflated (§24's core warning):
   · THE HEIGHT does the WITHIN-scene timing — every plate + shutter is the SAME --dia-h (a
     viewport proportion, set centrally in TS onMounted/resize · JS configures, CSS runs).
   · A STATE-TRIGGER does the SEAM-sync — an IntersectionObserver sets `data-scene` (the active
     plate); CSS TRANSITIONS move the shutters. NOT scroll-% (the §24 B sync-bug: scroll-driven
     is progress, not state — it lifts before the next plate is in place → wrong image). JS only
     observes + sets state; it never drives the scroll.

  THE LAYERS (§24 D · "never scrolls, only things pass over it"):
   · plates (the held lights · z1–3) — sticky to the STAGE → they NEVER un-pin (the i11→i13 floor,
     element-anchored · the iOS-safe replacement for attachment:fixed). Ascending z.
   · figures (z6) — rise+cover in the right lane over a plate (scene 1 & 3 · scene 2 is a CLEAN dia).
   · shutters (z20+) — high above the plates. The opening wipes up to UNCOVER plate-1; each seam
     shutter RISES THROUGH (covers) on the `data-scene` flip → masks the plate-swap behind it,
     synced (no drift). The image is covered, never scrolled.

  ANCESTOR-PURITY: the stage + every ancestor stay plain blocks. Desktop-first; <768 linearises.
-->

<template>
  <MagnificaPageLayout variant="standard">
    <template #header><MagnificaHeader compact /></template>

    <div
      ref="stageEl"
      class="proto-stage"
      :data-scene="activeScene"
    >
      <!-- the OPENING shutter · covers plate-1 at load · overlaps it (negative margin = -1·--dia-h)
           so the image is already there; wipes up to uncover (no next-plate to sync → scroll-driven ok). -->
      <div class="proto-shutter proto-shutter--open">
        <p class="proto-blade-over">DiaStage · hinge prototype</p>
        <p class="proto-blade-head">The image does not move.</p>
        <p class="proto-blade-lead">
          Three held plates, two shutters. Each image is <strong>already there</strong> and never
          moves — a shutter wipes up to <strong>uncover</strong> it, the reading rises over it, then
          the next shutter <strong>rises to cover</strong> it and a new plate is behind the blade.
          Only the shutters move.
        </p>
        <span class="proto-blade-line" aria-hidden="true" />
      </div>

      <!-- PLATE 1 · the held light (z1 · sticky to the stage · never un-pins) -->
      <div
        class="proto-light proto-light--1"
        role="img"
        aria-label="A performer behind translucent sheeting — the body witnessed, held."
        :style="{ backgroundImage: `url('${beats.unspoken.image}')` }"
      />
      <!-- SCENE 1 · the reading rises over plate-1 (right lane) · this block is the scroll-range + IO sentinel -->
      <div
        class="proto-scene"
        data-scene-range="1"
      >
        <div class="proto-fig proto-fig--1">
          <p class="proto-fig-over">the body, witnessed</p>
          <h2 class="proto-fig-head">NOT STORED — PERFORMED</h2>
          <p>The plate behind you does not move. You do. It holds while the reading rises past it.</p>
        </div>
        <div class="proto-fig proto-fig--2">
          <p class="proto-fig-over">Schwebezustände</p>
          <h2 class="proto-fig-head">THE OPENLY-DECOUPLED STATE</h2>
          <p>This card rose from below and now covers the first — opaque, higher in the stack. The light is still the same held light.</p>
        </div>
      </div>

      <!-- SEAM 1 → covers plate-1, reveals plate-2 · IO-state-triggered (rises through on the flip) -->
      <div class="proto-shutter proto-shutter--seam proto-shutter--seam1">
        <p class="proto-blade-text">— the black between —</p>
        <span class="proto-blade-line" aria-hidden="true" />
      </div>

      <!-- PLATE 2 · a CLEAN dia (no figures) · the trust-walk · uncovered by seam-1, covered by seam-2 -->
      <div
        class="proto-light proto-light--2"
        role="img"
        aria-label="A trust-walk — one led blind by another, the room held open."
        :style="{ backgroundImage: `url('${beats.trustwalk.image}')` }"
      />
      <div
        class="proto-scene proto-scene--clean"
        data-scene-range="2"
      />

      <!-- SEAM 2 → covers plate-2, reveals plate-3 -->
      <div class="proto-shutter proto-shutter--seam proto-shutter--seam2">
        <p class="proto-blade-text">— the black between —</p>
        <span class="proto-blade-line" aria-hidden="true" />
      </div>

      <!-- PLATE 3 · the new held light (z3) · the plants -->
      <div
        class="proto-light proto-light--3"
        role="img"
        aria-label="The orange book against black, green shoots rising — a Szenische Lesung."
        :style="{ backgroundImage: `url('${beats.hope.image}')` }"
      />
      <div
        class="proto-scene"
        data-scene-range="3"
      >
        <div class="proto-fig proto-fig--1">
          <p class="proto-fig-over">the figures rise</p>
          <h2 class="proto-fig-head">RAISE FROM THE BOOKS</h2>
          <p>A new plate opened behind the blade. The light changed; the stage did not. That swap is the act-break.</p>
        </div>
        <div class="proto-fig proto-fig--2">
          <p class="proto-fig-over">five or ten hands</p>
          <h2 class="proto-fig-head">LARGER THAN ONE COULD BUILD</h2>
          <p>The reading rises again over the new light, and the stage holds it the same way. One mechanism, three plates.</p>
        </div>
      </div>
    </div>
  </MagnificaPageLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import MagnificaPageLayout from './MagnificaPageLayout.vue'
import MagnificaHeader from './MagnificaHeader.vue'
import { beats } from './content/context'

/**
 * JS CONFIGURES · CSS RUNS (backslide §24 C(a)/F).
 *  · configure(): the SINGLE height every plate + shutter shares (--dia-h · a viewport
 *    proportion) — the WITHIN-scene timing. Set on mount + resize.
 *  · IntersectionObserver → activeScene → `data-scene`: the SEAM-sync STATE (which plate is
 *    active). CSS transitions the shutters off it. JS never drives the scroll; it observes + sets
 *    state. This is the fix for the scroll-% drift (§24 B) — the shutter moves when the plate IS
 *    the scene, not at a guessed scroll-position.
 */
const stageEl = ref<HTMLElement>()
const activeScene = ref(1)
const HEIGHT_FRACTION = 0.82
let io: IntersectionObserver | undefined

function configure(): void {
  if (!stageEl.value) return
  stageEl.value.style.setProperty('--dia-h', `${Math.round(window.innerHeight * HEIGHT_FRACTION)}px`)
}

onMounted(() => {
  configure()
  window.addEventListener('resize', configure, { passive: true })
  if (!stageEl.value) return
  // a thin centre-band: the scene whose range crosses the viewport-centre is the active one.
  io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          const n = Number((e.target as HTMLElement).dataset.sceneRange)
          if (n) activeScene.value = n
        }
      }
    },
    { rootMargin: '-48% 0px -48% 0px', threshold: 0 },
  )
  stageEl.value.querySelectorAll<HTMLElement>('[data-scene-range]').forEach((el) => io!.observe(el))
})

onUnmounted(() => {
  window.removeEventListener('resize', configure)
  io?.disconnect()
})
</script>

<style scoped>
/* the stage · plain block (ancestor-purity) · the containing block for the sticky plates, so a
   held light pins to the STAGE and never un-pins. */
.proto-stage {
  position: relative;
  --dia-top: var(--bb-navbar-offset, 6rem);
}

.proto-fig-over { font-size: 0.8125rem; opacity: 0.8; margin: 0 0 0.35rem; letter-spacing: 0.02em; }
.proto-fig-head { font-size: 1.25rem; font-weight: 700; line-height: 1.2; margin: 0 0 0.6rem; }
.proto-fig p:last-child { margin-bottom: 0; }

/* a shutter/blade · the black-between · the dasei gap-line. */
.proto-shutter {
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

/* mobile (<768) · linearise: plates + figures + shutters are normal-flow blocks, top to bottom. */
.proto-light {
  width: 100%;
  min-height: 16rem;
  background-size: cover;
  background-position: center;
  background-color: var(--color-bg);
  border-radius: 4px;
}
.proto-fig { margin-top: 1.5rem; }
.proto-shutter--seam { margin-top: 1.5rem; min-height: 12rem; }
.proto-scene--clean { min-height: 1px; }

@media (min-width: 768px) {
  /* THE UNIFORM HEIGHT · every plate + every shutter is the SAME --dia-h, sticky at the SAME top.
     (Issue-1 fix: min-height too, so a shutter is NEVER shorter than a plate.) */
  .proto-light,
  .proto-shutter {
    position: sticky;
    top: var(--dia-top);
    height: var(--dia-h, 82vh);
    min-height: var(--dia-h, 82vh);
    margin: 0;
  }

  /* held plates · left lane · ascending z (the order of being revealed) · never un-pin */
  .proto-light { width: 48%; }
  .proto-light--1 { z-index: 1; }
  .proto-light--2 { z-index: 2; }
  .proto-light--3 { z-index: 3; }

  /* the scenes · the scroll-RANGE that each plate holds across + where the figures rise. The
     clean scene (plate-2) is just scroll-length (no figures). */
  .proto-scene { position: relative; min-height: 120vh; }
  .proto-scene--clean { min-height: 90vh; }

  /* the figures · rise into the RIGHT lane over their plate (z6 · above plates, below shutters) */
  .proto-fig {
    position: sticky;
    top: calc(var(--dia-top) + 3rem);
    left: 52%;
    width: 46%;
    z-index: 6;
    background: var(--color-bg);
    padding: 1.25rem 1.5rem;
    border-radius: 4px;
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.3);
  }
  .proto-fig--2 { top: calc(var(--dia-top) + 9rem); margin-top: 48vh; }

  /* THE OPENING SHUTTER · z20 · overlaps plate-1 (margin = -1·--dia-h · the same central height)
     so the image is already there; wipes up to uncover (scroll-driven · no plate to sync). */
  .proto-shutter--open {
    width: 100%;
    z-index: 20;
    margin-bottom: calc(-1 * var(--dia-h, 82vh));
  }
  @supports (animation-timeline: view()) {
    .proto-shutter--open {
      animation: proto-open-wipe linear both;
      animation-timeline: view(block);
      animation-range: cover 0% cover 28%;
    }
    @keyframes proto-open-wipe {
      from { transform: translateY(0); }
      to { transform: translateY(-110%); }
    }
  }

  /* THE SEAM SHUTTERS · z21/22 · full-width · STATE-TRIGGERED (§24 C(a)). Default = waiting below
     (translateY 110%, hidden). When `data-scene` advances past the seam, the shutter transitions
     to lifted (−110%, hidden above) — passing THROUGH translateY(0) = covering. The CSS transition
     (fixed-duration) is the rise-through that masks the plate-swap; it fires on the IO state-flip,
     so it is synced to "the next plate IS the scene" — not a scroll-% (no drift · the §24 fix). */
  .proto-shutter--seam {
    width: 100%;
    transform: translateY(110%);
    transition: transform 0.7s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .proto-shutter--seam1 { z-index: 21; }
  .proto-shutter--seam2 { z-index: 22; }

  /* seam-1 covers/reveals at scene 1→2; seam-2 at 2→3 (lifted once its seam is crossed) */
  .proto-stage[data-scene='2'] .proto-shutter--seam1,
  .proto-stage[data-scene='3'] .proto-shutter--seam1 { transform: translateY(-110%); }
  .proto-stage[data-scene='3'] .proto-shutter--seam2 { transform: translateY(-110%); }
}

@media (prefers-reduced-motion: reduce) {
  .proto-shutter--open { animation: none !important; }
  .proto-shutter--seam { transition: none; }
}
</style>
