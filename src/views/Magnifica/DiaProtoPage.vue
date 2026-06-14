<!--
  /proto · PATTERN-B candidate (branch alpha/magnifica-dia-patternB · HM 2026-06-12).

  THE MECHANIC (HP · grounded in the i11→i12→i13 originals): the held image NEVER scrolls off.
  The NEXT image (and, optionally, the shutter) rises OVER it and COVERS it; the previous stays
  pinned, behind, never moving. This is the no-glue replacement for `background-attachment:fixed`:

      sticky-stacking / scroll-over — ALL layers are siblings in ONE stage, each
      `position:sticky; top:0` with an ASCENDING z-index. A later sibling rises from below and
      covers the earlier pinned one; the earlier stays pinned (its sticky containing-block is the
      whole stage), so it is hidden behind the cover — it does NOT release/scroll-off in view.

  Layer order (ascending z · each covers the previous):
      z1  image 1 (held)   →   z2  the black shutter (rises over img1)   →   z3  image 2 (held, rises over the shutter)
  Spacers between give each held image its hold-duration WITHOUT over-cropping the image (the
  image stays viewport-proportioned · cover + background-position = aspect control · no glue-to-
  viewport · cross-platform). The opening shutter overlays img1 and wipes up to UNCOVER it on load.
-->

<template>
  <MagnificaPageLayout variant="standard">
    <template #header><MagnificaHeader compact /></template>

    <div class="proto-stage">
      <!-- ═══ IMAGE 1 · held · gets COVERED by what rises next · never scrolls off (z1) ═══ -->
      <section
        class="pslide pslide--img1"
        :style="{ backgroundImage: `url('${beats.unspoken.image}')` }"
      >
        <div class="pslide-panel">
          <p class="pslide-over">the body, witnessed</p>
          <h2 class="pslide-head">NOT STORED — PERFORMED</h2>
          <p>This image is held. The next image rises over it and covers it — it never scrolls off; it is covered.</p>
        </div>
        <!-- the opening shutter · covers img1 on LOAD · wipes up to uncover it -->
        <div class="popening">
          <p class="popening-over">DiaStage · hinge prototype · Pattern B (Hero-mechanic)</p>
          <h1 class="popening-head">The image does not move</h1>
          <p class="popening-lead">
            Scroll slowly: this lifts to <strong>uncover</strong> a photograph already held
            <strong>dead-still</strong>. Then a black shutter rises and covers it, and a new image
            rises over the shutter. Nothing scrolls off — each plate is covered by the next.
          </p>
          <span class="pline" aria-hidden="true" />
        </div>
      </section>

      <!-- spacer · holds img1 (pinned behind) for a longer read before the shutter covers it -->
      <div class="pspacer" aria-hidden="true" />

      <!-- ═══ THE SHUTTER · rises OVER img1 and covers it (z2) ═══ -->
      <section class="pslide pslide--shutter">
        <p class="pshutter-over">between horror and hope</p>
        <p class="pshutter-text">— the black between —</p>
        <span class="pline" aria-hidden="true" />
      </section>

      <!-- spacer · the black-between holds briefly before img2 covers the shutter -->
      <div class="pspacer pspacer--short" aria-hidden="true" />

      <!-- ═══ IMAGE 2 · held · rises OVER the shutter and covers it (z3) ═══ -->
      <section
        class="pslide pslide--img2"
        :style="{ backgroundImage: `url('${beats.hope.image}')` }"
      >
        <div class="pslide-panel">
          <p class="pslide-over">the figures rise</p>
          <h2 class="pslide-head">RAISE FROM THE BOOKS</h2>
          <p>This rose over the shutter and covered it — the new held plate. img1 is still pinned, hidden underneath; it never left.</p>
        </div>
      </section>

      <!-- spacer · img2 holds at the end -->
      <div class="pspacer" aria-hidden="true" />
    </div>
  </MagnificaPageLayout>
</template>

<script setup lang="ts">
import MagnificaPageLayout from './MagnificaPageLayout.vue'
import MagnificaHeader from './MagnificaHeader.vue'
import { beats } from './content/context'
</script>

<style scoped>
.proto-stage { position: relative; }

/* mobile (<768): linearise — plates and shutters are normal stacked blocks (no held/cover). */
.pslide {
  position: relative;
  min-height: 18rem;
  background-size: cover;
  background-position: center;
  background-color: var(--color-bg);
  border-radius: 6px;
  margin-bottom: 1.25rem;
}
.pslide--shutter {
  background: #0b0b0c;
  color: #f4f4f4;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 0.5rem;
}
.pspacer { display: none; }

.pslide-panel {
  position: relative;
  z-index: 1;
  margin: 0;
  padding: 1.25rem 1.5rem;
  background: var(--color-card-bg, #1d1b1a);
  color: var(--color-card-contrast, #f4f4f4);
  border-radius: 4px;
}
.pslide-over { font-size: 0.8125rem; opacity: 0.85; margin: 0 0 0.35rem; letter-spacing: 0.02em; }
.pslide-head { font-size: 1.25rem; font-weight: 700; line-height: 1.2; margin: 0 0 0.6rem; }
.pslide-panel p:last-child { margin-bottom: 0; }

.popening {
  position: relative;
  z-index: 9;
  margin-top: 1.25rem;
  background: #0b0b0c;
  color: #f4f4f4;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 0.6rem;
  padding: 2rem;
  border-radius: 4px;
}
.popening-over { font-size: 0.875rem; opacity: 0.7; margin: 0; letter-spacing: 0.04em; }
.popening-head { font-size: clamp(1.5rem, 3vw, 2.25rem); font-weight: 700; margin: 0; line-height: 1.2; }
.popening-lead { max-width: 42rem; font-size: 0.9375rem; line-height: 1.6; opacity: 0.92; margin: 0; }
.pshutter-over { font-size: 0.875rem; opacity: 0.7; margin: 0; letter-spacing: 0.04em; }
.pshutter-text { font-size: 1.1rem; margin: 0; letter-spacing: 0.06em; }
.pline { width: 2px; height: 3rem; background: var(--color-primary-bg); margin-top: 0.25rem; }

/* ════ DESKTOP · the sticky-stack · each plate is HELD and COVERED by the next (never scrolls off) ════ */
@media (min-width: 768px) {
  /* every plate/shutter pins at top:0 and stays pinned (its containing-block is the whole stage);
     a later sibling with higher z rises from below and covers it. */
  .pslide {
    position: sticky;
    top: 0;
    min-height: 100vh;
    margin-bottom: 0;
    overflow: clip;            /* clip (not hidden — keeps no scrollport, the inner overlay stays sticky-able) */
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
  }
  .pslide--img1 { z-index: 1; }
  .pslide--shutter { z-index: 2; justify-content: center; align-items: center; }
  .pslide--img2 { z-index: 3; }

  /* the spacers give each HELD image its hold-duration (the pinned plate shows through them)
     WITHOUT over-cropping — the plate stays a clean 100vh. */
  .pspacer { display: block; height: 110vh; }
  .pspacer--short { height: 60vh; }

  /* the panel rides over its own held image, bottom-left, legible over the photo */
  .pslide-panel {
    background: transparent;
    max-width: 30rem;
    margin: 2.5rem;
    padding: 0;
    text-shadow: 0 1px 10px rgba(0, 0, 0, 0.7);
    pointer-events: none;
  }

  /* the OPENING shutter · overlays img1 (covers on load) · wipes UP to uncover the held image.
     scroll(root) is 0 at the page-top — the right timeline for a load-time cover (view() reads
     mid-progress at load). The wipe-distance is a dial. */
  .popening {
    position: absolute;
    inset: 0;
    z-index: 9;
    margin: 0;
    border-radius: 0;
    padding: 2rem clamp(2rem, 6vw, 5rem);
    align-items: flex-start;
    text-align: left;
  }
  @supports (animation-timeline: scroll()) {
    .popening {
      animation: popening-wipe linear both;
      animation-timeline: scroll(root block);
      animation-range: 0 80vh;
    }
    @keyframes popening-wipe {
      from { transform: translateY(0); }
      to { transform: translateY(-100%); }
    }
  }
}

/* reduced-motion / no scroll-driven · keep the opening from trapping the page: drop the overlay
   to a normal top block so img1 is reachable (no wipe). The sticky-stack itself is motion-free. */
@media (prefers-reduced-motion: reduce) {
  .popening { position: relative; inset: auto; animation: none !important; transform: none !important; }
}
</style>
