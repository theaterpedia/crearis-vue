<!--
  /proto · PATTERN-B candidate (branch alpha/magnifica-dia-patternB · HM 2026-06-12).

  IO-DRIVEN scene-state · "JS configures, CSS runs" (HP-approved). The sync bug (a shutter lifting
  before the next image is in place, re-revealing img1) is killed by NOT guessing scroll-%:

    • held images do pure-CSS sticky scroll-over (img1 z1 < img2 z2): each arrives, pins, and the
      next covers it by rising over — none ever scroll off (the no-glue replacement for fixed).
    • a pinned OVERLAY FRAME (margin-bottom:-100vh trick → it overlaps the scroll-over images)
      holds the shutters + the opening as absolute layers.
    • an IntersectionObserver watches sentinels; when one crosses viewport-CENTRE it sets
      `data-scene` on the stage. NO scroll listener, no scroll-polling — just threshold callbacks.
    • CSS transitions sweep each shutter by scene (rise 100% → cover 0 → lift -100%). A shutter
      LIFTS only at its image's scene — i.e. only once IO confirms that image is in place.

  Sequence: open (opening covers img1) → img1 (opening lifts) → seam (shutter-12 covers img1 while
  img2 pins behind) → img2 (shutter-12 lifts → trustwalk uncovered IN PLACE) → close (shutter-2x
  covers img2). Per-image shutters; sentinel positions + scene transition timing are the dials.
-->

<template>
  <MagnificaPageLayout variant="standard">
    <template #header><MagnificaHeader compact /></template>

    <div
      ref="stageRef"
      class="proto-stage"
      data-scene="open"
    >
      <!-- ░░ the pinned OVERLAY FRAME · shutters + opening (absolute layers, swept by [data-scene]) ░░ -->
      <div class="poverlay">
        <!-- opening · covers img1 on load · lifts once you reach img1 -->
        <div class="pshutter popening">
          <p class="ps-over">DiaStage · hinge prototype · Pattern B (Hero-mechanic)</p>
          <h1 class="ps-head">The image does not move</h1>
          <p class="ps-lead">
            Each photograph is held <strong>dead-still</strong>. A shutter rises to <strong>cover</strong>
            it, then lifts to <strong>uncover</strong> the next one held behind it. The shutters'
            timing is set by where you are on the page — not by guessed scroll maths.
          </p>
          <span class="pline" aria-hidden="true" />
        </div>
        <!-- shutter-12 · rises to cover img1 (seam), lifts to uncover img2 (img2 scene) -->
        <div class="pshutter pshutter--12">
          <p class="ps-over">between horror and hope</p>
          <p class="ps-text">— the black between —</p>
          <span class="pline" aria-hidden="true" />
        </div>
        <!-- shutter-2x · rises to cover img2 (close) -->
        <div class="pshutter pshutter--2x">
          <p class="ps-over">and the next plate waits</p>
          <p class="ps-text">— covered again —</p>
          <span class="pline" aria-hidden="true" />
        </div>
      </div>

      <!-- ░░ the held IMAGES · sticky scroll-over · behind the overlay (z1 < z2) ░░ -->
      <section class="pimg pimg--1" :style="{ backgroundImage: `url('${beats.unspoken.image}')` }">
        <div class="ppanel">
          <p class="pp-over">the body, witnessed</p>
          <h2 class="pp-head">NOT STORED — PERFORMED</h2>
        </div>
      </section>
      <!-- scroll-regions = the scene sentinels: while one spans the viewport-centre, its scene is
           active (IO). img1 holds (opening lifted), then seam (shutter-12 covers as img2 pins). -->
      <div class="pscroll" data-scene="img1" aria-hidden="true"></div>
      <div class="pscroll pscroll--short" data-scene="seam" aria-hidden="true"></div>

      <section class="pimg pimg--2" :style="{ backgroundImage: `url('${beats.trustwalk.image}')` }">
        <div class="ppanel">
          <p class="pp-over">Elementare Animation · trustwalk</p>
          <h2 class="pp-head">THE BODY BEFORE THE HEAD</h2>
        </div>
      </section>
      <!-- img2 now pinned in place → shutter-12 lifts (uncover) · then close (shutter-2x covers) -->
      <div class="pscroll" data-scene="img2" aria-hidden="true"></div>
      <div class="pscroll" data-scene="close" aria-hidden="true"></div>
    </div>
  </MagnificaPageLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import MagnificaPageLayout from './MagnificaPageLayout.vue'
import MagnificaHeader from './MagnificaHeader.vue'
import { beats } from './content/context'

const stageRef = ref<HTMLElement>()
let io: IntersectionObserver | undefined

onMounted(() => {
  const stage = stageRef.value
  if (!stage || typeof IntersectionObserver === 'undefined') return
  const sentinels = stage.querySelectorAll<HTMLElement>('.pscroll[data-scene]')
  // root = a 0-height line at the viewport centre (rootMargin -50%/-50%); a sentinel "intersects"
  // exactly when it crosses the centre → set the scene. Pure threshold callback, no scroll listener.
  io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        const el = e.target as HTMLElement
        if (e.isIntersecting && el.dataset.scene) stage.dataset.scene = el.dataset.scene
      }
    },
    { rootMargin: '-50% 0px -50% 0px', threshold: 0 },
  )
  sentinels.forEach((s) => io!.observe(s))
})
onUnmounted(() => io?.disconnect())
</script>

<style scoped>
.proto-stage { position: relative; }

/* mobile (<768): linearise — images + shutters are normal stacked blocks (no held/cover). */
.pimg {
  position: relative;
  min-height: 18rem;
  background-size: cover;
  background-position: center;
  background-color: var(--color-bg);
  border-radius: 6px;
  margin-bottom: 1.25rem;
}
.ppanel {
  position: relative;
  z-index: 1;
  padding: 1.25rem 1.5rem;
  background: var(--color-card-bg, #1d1b1a);
  color: var(--color-card-contrast, #f4f4f4);
  border-radius: 4px;
}
.pp-over { font-size: 0.8125rem; opacity: 0.85; margin: 0 0 0.35rem; letter-spacing: 0.02em; }
.pp-head { font-size: 1.25rem; font-weight: 700; line-height: 1.2; margin: 0; }

.poverlay { display: contents; }   /* mobile: shutters flow as blocks */
.pshutter {
  background: #0b0b0c;
  color: #f4f4f4;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 0.5rem;
  padding: 2rem;
  min-height: 40vh;
  border-radius: 4px;
  margin-bottom: 1.25rem;
}
.ps-over { font-size: 0.875rem; opacity: 0.7; margin: 0; letter-spacing: 0.04em; }
.ps-head { font-size: clamp(1.5rem, 3vw, 2.25rem); font-weight: 700; margin: 0; line-height: 1.2; }
.ps-lead { max-width: 42rem; font-size: 0.9375rem; line-height: 1.6; opacity: 0.92; margin: 0; }
.ps-text { font-size: 1.1rem; margin: 0; letter-spacing: 0.06em; }
.pline { width: 2px; height: 3rem; background: var(--color-primary-bg); margin-top: 0.25rem; }
.pscroll { display: none; }

/* ════ DESKTOP · sticky scroll-over images + a pinned overlay of IO-swept shutters ════ */
@media (min-width: 768px) {
  /* held images · sticky · stacked · arrive + cover the previous · never scroll off */
  .pimg {
    position: sticky;
    top: 0;
    min-height: 100vh;        /* the image = one viewport (the scroll-regions give the hold) */
    margin-bottom: 0;
    overflow: clip;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
  }
  .pimg--1 { z-index: 1; }
  .pimg--2 { z-index: 2; }     /* rises over img1 and covers it (held behind) */

  /* scroll-regions · transparent flow that gives the hold-scroll + carries the scene (the pinned
     image shows through them). Each holds its scene while it spans the viewport-centre. */
  .pscroll { display: block; height: 130vh; }
  .pscroll--short { height: 90vh; }
  .ppanel {
    background: transparent;
    max-width: 30rem;
    margin: 2.5rem;
    padding: 0;
    text-shadow: 0 1px 10px rgba(0, 0, 0, 0.75);
  }

  /* the pinned overlay frame · margin-bottom:-100vh so it overlaps the scroll-over images (it does
     not consume flow). z above the images. Holds the shutters as absolute, viewport-filling layers. */
  .poverlay {
    display: block;
    position: sticky;
    top: 0;
    height: 100vh;
    margin-bottom: -100vh;
    z-index: 9;
    pointer-events: none;
  }
  .pshutter {
    position: absolute;
    inset: 0;
    min-height: 0;
    margin: 0;
    border-radius: 0;
    transition: transform 0.55s ease;
    will-change: transform;     /* leaf overlay · not a stage ancestor */
  }

  /* default rest-states + the per-scene sweeps (rise 100% → cover 0 → lift -100%). A shutter LIFTS
     only at its image's scene, so it never reveals the wrong (un-pinned) image. */
  .popening { transform: translateY(0); }                 /* covers on load (scene open) */
  .pshutter--12 { transform: translateY(100%); }          /* waits below */
  .pshutter--2x { transform: translateY(100%); }          /* waits below */

  /* opening lifts once we leave the load scene */
  [data-scene="img1"] .popening,
  [data-scene="seam"] .popening,
  [data-scene="img2"] .popening,
  [data-scene="close"] .popening { transform: translateY(-100%); }

  /* shutter-12 · cover at the seam, lift at img2 (uncovers the by-then-pinned trustwalk) */
  [data-scene="seam"] .pshutter--12 { transform: translateY(0); }
  [data-scene="img2"] .pshutter--12,
  [data-scene="close"] .pshutter--12 { transform: translateY(-100%); }

  /* shutter-2x · cover img2 at the close scene (the next plate waits behind) */
  [data-scene="close"] .pshutter--2x { transform: translateY(0); }
}

/* reduced-motion · no sweeps; the opening is a normal top block so the page is never trapped. */
@media (prefers-reduced-motion: reduce) {
  .pshutter { transition: none !important; }
  .popening, .pshutter--12, .pshutter--2x { position: relative; inset: auto; transform: none !important; }
  .poverlay { position: static; height: auto; margin-bottom: 0; }
}
</style>
