<!--
  /proto · PATTERN-B candidate (branch alpha/magnifica-dia-patternB · HM 2026-06-12).

  THE MECHANIC (HP · grounded in i11→i12→i13): the held image NEVER moves. A SHUTTER sweeps:
  it rises to COVER the current held image, then LIFTS OFF to UNCOVER the next held image that
  was pinned behind it. So every image is revealed by a shutter lifting, and covered by the next
  shutter rising. The no-glue replacement for background-attachment:fixed.

      held images : position:sticky;top:0 · stacked · ascending z (img1 z1 < img2 z2). They pin
                    and stay (containing-block = the whole stage) — never released/scrolled-off.
      shutters    : sticky sweeps ABOVE the images (z5/z6) · scroll-driven translateY
                    (100% → 0 cover → -100% lift) driven by a view-timeline on each shutter's
                    track. A shutter covers the image below it, then lifts to uncover the image
                    pinned behind it (which is revealed IN PLACE — it didn't rise into view).

  Sequence: [opening shutter covers img1 on load → lifts → img1] → [shutter2 rises over img1,
  covers it → lifts → img2 uncovered] → [shutter3 rises over img2, covers it]. Sweep timings
  (track heights + ranges) are the dials.
-->

<template>
  <MagnificaPageLayout variant="standard">
    <template #header><MagnificaHeader compact /></template>

    <div class="proto-stage">
      <!-- ═══ IMAGE 1 · held (z1) · uncovered by the opening shutter, covered by shutter2 ═══ -->
      <section class="pimg pimg--1" :style="{ backgroundImage: `url('${beats.unspoken.image}')` }">
        <div class="ppanel">
          <p class="pover">the body, witnessed</p>
          <h2 class="phead">NOT STORED — PERFORMED</h2>
          <p>Held dead-still. A shutter rises to cover it, then lifts to uncover the next image — it never scrolls off.</p>
        </div>
        <div class="popening">
          <p class="popening-over">DiaStage · hinge prototype · Pattern B (Hero-mechanic)</p>
          <h1 class="popening-head">The image does not move</h1>
          <p class="popening-lead">
            Each photograph is held <strong>dead-still</strong>. A black shutter rises to
            <strong>cover</strong> it, then lifts to <strong>uncover</strong> the next one held
            behind it. Nothing scrolls off; only the shutters sweep.
          </p>
          <span class="pline" aria-hidden="true" />
        </div>
      </section>

      <!-- ═══ SHUTTER 2 · sweeps: rises over img1 (covers) → lifts to uncover img2 (z5) ═══ -->
      <div class="psweep-track psweep-track--2">
        <div class="psweep psweep--2">
          <p class="psweep-over">between horror and hope</p>
          <p class="psweep-text">— the black between —</p>
          <span class="pline" aria-hidden="true" />
        </div>
      </div>

      <!-- ═══ IMAGE 2 · trustwalk (DISTINCT image · clearly not img1) · held (z2) · pinned behind
           shutter2, uncovered as shutter2 lifts ═══ -->
      <section class="pimg pimg--2" :style="{ backgroundImage: `url('${beats.trustwalk.image}')` }">
        <div class="ppanel">
          <p class="pover">Elementare Animation</p>
          <h2 class="phead">THE BODY BEFORE THE HEAD</h2>
          <p>A clearly different image — held behind shutter2, uncovered in place as it lifted. If you see the sheeting here instead, the lift fired before this was in place (the sync bug).</p>
        </div>
      </section>

      <!-- ═══ SHUTTER 3 · rises over img2 and covers it (z6) ═══ -->
      <div class="psweep-track psweep-track--3">
        <div class="psweep psweep--3">
          <p class="psweep-over">and the next plate waits</p>
          <p class="psweep-text">— covered again —</p>
          <span class="pline" aria-hidden="true" />
        </div>
      </div>
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

/* mobile (<768): linearise — plates + shutters are normal stacked blocks. */
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
.pover { font-size: 0.8125rem; opacity: 0.85; margin: 0 0 0.35rem; letter-spacing: 0.02em; }
.phead { font-size: 1.25rem; font-weight: 700; line-height: 1.2; margin: 0 0 0.6rem; }
.ppanel p:last-child { margin-bottom: 0; }

.popening,
.psweep {
  background: #0b0b0c;
  color: #f4f4f4;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 0.5rem;
  padding: 2rem;
  border-radius: 4px;
}
.popening { margin-top: 1.25rem; }
.psweep-track { margin-bottom: 1.25rem; }
.psweep { min-height: 14rem; }
.popening-over,
.psweep-over { font-size: 0.875rem; opacity: 0.7; margin: 0; letter-spacing: 0.04em; }
.popening-head { font-size: clamp(1.5rem, 3vw, 2.25rem); font-weight: 700; margin: 0; line-height: 1.2; }
.popening-lead { max-width: 42rem; font-size: 0.9375rem; line-height: 1.6; opacity: 0.92; margin: 0; }
.psweep-text { font-size: 1.1rem; margin: 0; letter-spacing: 0.06em; }
.pline { width: 2px; height: 3rem; background: var(--color-primary-bg); margin-top: 0.25rem; }

/* ════ DESKTOP · held images (sticky, stacked) + shutters that sweep ABOVE them ════ */
@media (min-width: 768px) {
  /* held images · pinned dead-still · stay pinned the whole stage (never scroll off) */
  .pimg {
    position: sticky;
    top: 0;
    min-height: 100vh;
    margin-bottom: 0;
    overflow: clip;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
  }
  .pimg--1 { z-index: 1; }
  .pimg--2 { z-index: 2; }    /* once uncovered, covers img1 (held behind, never gone) */

  .ppanel {
    background: transparent;
    max-width: 30rem;
    margin: 2.5rem;
    padding: 0;
    text-shadow: 0 1px 10px rgba(0, 0, 0, 0.7);
    pointer-events: none;
  }

  /* a shutter's TRACK gives the sweep its scroll-length + a clean view-timeline; the shutter
     inside is sticky and translateY-sweeps over that progress, ABOVE the images. */
  .psweep-track {
    position: relative;
    height: 170vh;
    margin-bottom: 0;
  }
  .psweep {
    position: sticky;
    top: 0;
    height: 100vh;
    min-height: 0;
    margin: 0;
    border-radius: 0;
  }
  .psweep--2 { z-index: 5; }
  .psweep--3 { z-index: 6; }

  @supports (animation-timeline: view()) {
    .psweep-track--2 { view-timeline: --s2 block; }
    .psweep-track--3 { view-timeline: --s3 block; }

    /* shutter2 · rise to COVER img1 (mask), brief hold, then LIFT OFF to uncover img2 behind it */
    .psweep--2 {
      animation: psweep-cover-lift linear both;
      animation-timeline: --s2;
      animation-range: cover 0% cover 100%;
    }
    @keyframes psweep-cover-lift {
      from { transform: translateY(100%); }
      38% { transform: translateY(0); }
      55% { transform: translateY(0); }
      to { transform: translateY(-100%); }
    }

    /* shutter3 · rise to COVER img2 and stay covering (the next plate waits behind it) */
    .psweep--3 {
      animation: psweep-cover linear both;
      animation-timeline: --s3;
      animation-range: cover 0% cover 70%;
    }
    @keyframes psweep-cover {
      from { transform: translateY(100%); }
      to { transform: translateY(0); }
    }
  }

  /* the OPENING shutter · overlays img1 (covers on LOAD) · wipes up to uncover it.
     scroll(root) is 0 at page-top — the right timeline for a load-time cover. */
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

/* reduced-motion / no scroll-driven · no sweeps; the opening drops to a normal block so the page
   is never trapped behind an un-moving cover. The shutters become normal between-blocks. */
@media (prefers-reduced-motion: reduce) {
  .popening { position: relative; inset: auto; animation: none !important; transform: none !important; }
  .psweep { animation: none !important; transform: none !important; position: relative; height: auto; min-height: 14rem; }
  .psweep-track { height: auto; }
}
</style>
