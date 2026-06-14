<!--
  /protoc · Pattern C HINGE — the DISTINCT dead-still hold + cross-fade swap (bench §20/§21).
  HP-pinned (2026-06-12): C3 = ONE position:fixed "projector" layer holding stacked plates that
  CROSS-FADE per scene; prove the hold first (C-1), then the swap two ways (C-2 · this file).

  THE HOLD (C-1, kept): one fixed projector, dead-still in the viewport, bounded to the 90rem-centred
  LEFT lane via JS-measured vars; scoped to the stage's on-screen range by an IntersectionObserver.
  `position:fixed` on the ELEMENT is iOS-safe (unlike background-attachment:fixed · §15). HONEST:
  fixed is NOT ancestor-purity-immune (re-bases under any ancestor transform/contain/etc · the same
  gotcha as sticky); only Hero's own-transform cover escapes it. C's win = one projector + cross-fade.

  THE SWAP, TWO WAYS (compare via the URL · ?swap=js default, ?swap=css):
    · js  — an IntersectionObserver picks the most-visible act → its plate gets .is-active (opacity 1);
            CSS transitions the cross-fade. JS OBSERVES, never drives the scroll. No polyfill. The floor.
    · css — scroll-driven: each act declares a `view-timeline`; the matching plate's opacity is keyed
            to that act's view-progress (animation-timeline + animation-range), hoisted across the
            sibling subtree with `timeline-scope`. @supports-guarded; where unsupported it falls back
            to the .is-active floor (IO runs in both modes). Chromium + Safari 26 ship it; Firefox-
            stable would need the flackr polyfill (NOT a dependency here · HP: Chromium/Safari-first).
  JS CONFIGURES · CSS RUNS throughout. The page decides which swap reads as theater.
-->

<template>
  <MagnificaPageLayout variant="standard">
    <template #header><MagnificaHeader compact /></template>

    <template #hero>
      <header class="protoc-hero">
        <p class="protoc-over">DiaStage · Pattern C · hinge</p>
        <h1 class="protoc-head">One fixed projector · the plate cross-fades</h1>
        <p class="protoc-lead">
          Scroll slowly. The image is one <strong>fixed projector</strong> in the left lane — it never
          moves and never drifts from the 90rem column while the reading rises and covers in the right
          lane. At the act-break the plate <strong>cross-fades</strong> to the next scene (the light
          changes; the stage does not). Compare the swap: <code>?swap=js</code> (default · observer)
          vs <code>?swap=css</code> (scroll-driven). Current: <strong>{{ swapMode }}</strong>.
        </p>
      </header>
    </template>

    <div
      ref="stageEl"
      class="diac-stage"
      :class="[{ 'diac-stage--on': projectorOn }, `diac-stage--swap-${swapMode}`]"
    >
      <!-- the ONE fixed projector · both plates stacked · cross-fade between them (the carousel) -->
      <div class="diac-projector">
        <div
          v-for="(act, i) in acts"
          :key="i"
          class="diac-plate"
          :class="[`diac-plate--${i}`, { 'is-active': i === activeIndex }]"
          role="img"
          :aria-label="act.alt"
          :style="{ backgroundImage: `url('${act.image}')` }"
        />
      </div>

      <!-- the acts · each tall (figures + pauses give the scroll travel the plate spans + the
           view-range the css-swap keys to). -->
      <section
        v-for="(act, i) in acts"
        :key="i"
        class="diac-act"
        :class="`diac-act--${i}`"
        :data-act="i"
      >
        <div
          v-for="(fig, j) in act.figs"
          :key="j"
          class="diac-fig"
          :class="`diac-fig--${j + 1}`"
        >
          <p class="diac-fig-over">{{ fig.over }}</p>
          <h2 class="diac-fig-head">{{ fig.head }}</h2>
          <p>{{ fig.body }}</p>
        </div>
      </section>
    </div>
  </MagnificaPageLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import MagnificaPageLayout from './MagnificaPageLayout.vue'
import MagnificaHeader from './MagnificaHeader.vue'
import { beats } from './content/context'

const route = useRoute()
const swapMode = computed(() => (route.query.swap === 'css' ? 'css' : 'js'))

const acts = [
  {
    image: beats.unspoken.image,
    alt: 'A performer behind translucent sheeting — held, witnessed.',
    figs: [
      { over: 'the body, witnessed', head: 'NOT STORED — PERFORMED', body: 'The plate to the left is fixed to the lane — it does not move while this reading rises past it.' },
      { over: 'Schwebezustände', head: 'THE OPENLY-DECOUPLED STATE', body: 'This card rose from below and covers the first. The light to the left is the same held light, still aligned to the column.' },
      { over: 'the light stays', head: 'THE READING PASSES · THE LIGHT HOLDS', body: 'Three figures, one fixed plate, dead-still. Keep scrolling — at the act-break the plate cross-fades.' },
    ],
  },
  {
    image: beats.hope.image,
    alt: 'The orange book against black, green shoots rising — a Szenische Lesung.',
    figs: [
      { over: 'the figures rise', head: 'RAISE FROM THE BOOKS', body: 'A new plate cross-faded in behind the same fixed projector. The light changed; the stage did not. That dissolve is the act-break.' },
      { over: 'five or ten hands', head: 'LARGER THAN ONE COULD BUILD', body: 'The reading rises again over the new light, held the same way. One projector, two scenes — the Dia-projector, most literal.' },
    ],
  },
]

const stageEl = ref<HTMLElement>()
const projectorOn = ref(false)
const activeIndex = ref(0)

/** JS CONFIGURES: measure the stage's lane geometry → CSS vars the fixed projector reads.
 *  getBoundingClientRect().left is viewport-relative (what `position:fixed left` needs). */
function configure(): void {
  const el = stageEl.value
  if (!el) return
  const r = el.getBoundingClientRect()
  el.style.setProperty('--diac-left', `${Math.round(r.left)}px`)
  el.style.setProperty('--diac-lane-w', `${Math.round(r.width * 0.48)}px`)
  el.style.setProperty('--diac-h', `${Math.round(window.innerHeight * 0.7)}px`)
}

let stageIo: IntersectionObserver | undefined
let actIo: IntersectionObserver | undefined
const ratios = new Map<number, number>()

onMounted(() => {
  configure()
  window.addEventListener('resize', configure, { passive: true })

  // scope-to-range: show the fixed projector only while the stage overlaps the viewport.
  stageIo = new IntersectionObserver(
    ([e]) => { projectorOn.value = e.isIntersecting },
    { threshold: 0 },
  )
  if (stageEl.value) stageIo.observe(stageEl.value)

  // the js-swap floor (runs in both modes): the most-visible act drives the active plate.
  actIo = new IntersectionObserver(
    (entries) => {
      for (const e of entries) ratios.set(Number((e.target as HTMLElement).dataset.act), e.intersectionRatio)
      let best = 0
      let bestR = -1
      ratios.forEach((r, i) => { if (r > bestR) { bestR = r; best = i } })
      activeIndex.value = best
    },
    { threshold: [0, 0.25, 0.5, 0.75, 1] },
  )
  stageEl.value?.querySelectorAll<HTMLElement>('.diac-act').forEach((s) => actIo!.observe(s))
})

onUnmounted(() => {
  window.removeEventListener('resize', configure)
  stageIo?.disconnect()
  actIo?.disconnect()
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
.protoc-lead { max-width: 48rem; font-size: 0.9375rem; line-height: 1.6; color: var(--color-muted-contrast); margin: 0; }
.protoc-lead code { font-size: 0.85em; padding: 0 0.25rem; background: var(--color-card-bg); border-radius: 3px; }

/* mobile (<768) · linearise: the plates flow as normal illustrations above their act. */
.diac-projector { display: contents; }
.diac-plate {
  width: 100%;
  min-height: 16rem;
  margin-bottom: 1.5rem;
  background-size: cover;
  background-position: center top;
  background-color: var(--color-bg);
  border-radius: 4px;
}
.diac-fig { margin-top: 1.5rem; }

@media (min-width: 768px) {
  .diac-act { position: relative; }

  /* THE FIXED PROJECTOR · dead-still, bounded to the lane (JS vars). z1. Scoped on by IO. */
  .diac-projector {
    display: block;
    position: fixed;
    top: var(--diac-top, var(--bb-navbar-offset, 6rem));
    left: var(--diac-left, 0);
    width: var(--diac-lane-w, 48%);
    height: var(--diac-h, 70vh);
    z-index: 1;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.45s ease;
  }
  .diac-stage--on .diac-projector { opacity: 1; }

  /* the stacked plates · cross-fade. Base hidden; .is-active (the IO floor) fades it in. */
  .diac-plate {
    position: absolute;
    inset: 0;
    width: auto;
    min-height: 0;
    margin: 0;
    opacity: 0;
    transition: opacity 0.6s ease;
  }
  .diac-plate.is-active { opacity: 1; }

  /* THE FIGURES · rise into the right lane, accumulate + cover (Scene-A recipe). */
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

  /* ── css-swap · scroll-driven cross-fade (@supports-guarded · the IO .is-active is the fallback
        where this doesn't apply). Each act declares a view-timeline; the matching plate keys its
        opacity to that act's view-progress. timeline-scope hoists the names so the plate (in the
        projector subtree) can reference a timeline declared on its sibling act subtree. ───────── */
  @supports (animation-timeline: view()) {
    .diac-stage--swap-css {
      timeline-scope: --diac-act0, --diac-act1;
    }
    .diac-stage--swap-css .diac-act--0 { view-timeline: --diac-act0 block; }
    .diac-stage--swap-css .diac-act--1 { view-timeline: --diac-act1 block; }
    .diac-stage--swap-css .diac-plate--0 {
      animation: diac-plate-show linear both;
      animation-timeline: --diac-act0;
      animation-range: cover 0% cover 100%;
    }
    .diac-stage--swap-css .diac-plate--1 {
      animation: diac-plate-show linear both;
      animation-timeline: --diac-act1;
      animation-range: cover 0% cover 100%;
    }
    @keyframes diac-plate-show {
      0% { opacity: 0; }
      12%, 88% { opacity: 1; }
      100% { opacity: 0; }
    }
  }
}

.diac-fig-over { font-size: 0.8125rem; opacity: 0.8; margin: 0 0 0.35rem; letter-spacing: 0.02em; }
.diac-fig-head { font-size: 1.25rem; font-weight: 700; line-height: 1.2; margin: 0 0 0.6rem; }
.diac-fig p:last-child { margin-bottom: 0; }

@media (prefers-reduced-motion: reduce) {
  .diac-plate { transition: none; }
}
</style>
