<!--
  /proto · PATTERN-B candidate (branch alpha/magnifica-dia-patternB · HM 2026-06-12).
  The held Dia rebuilt on Hero.vue's PROVEN mechanic — the image is DEAD-STILL (never moves),
  the content + the Shutter move OVER it. NOT glue-to-viewport (no attachment:fixed) → works
  cross-platform + aspect is controllable. This is the floor (Muris+HP spearhead · §20).

  The mechanic (Hero.vue verbatim):
    .bhero        overflow: CLIP  (clip, not hidden — clip does NOT make a scrollport, so the
                  inner sticky survives; this is exactly why Hero uses clip)
    .bhero-cover  position:absolute; height:200%; transform:translate3d(0,0,0)
                  → an over-tall layer with its OWN containing block (self-contained · immune to
                    ancestor transform/overflow — unlike bare position:sticky)
    .bhero-image  position:sticky; top:0; height:50%  → pins DEAD-STILL while the act scrolls past
    .bhero-panel  position:sticky; bottom  → the reading rises OVER the held image (dasei shape)

  Two held Dias, a Shutter wiping between them. Compare to /proto on alpha/magnifica-final
  (Pattern A · the image scrolls off at the seam). The page decides — prove-by-implementation.
-->

<template>
  <MagnificaPageLayout variant="standard">
    <template #header><MagnificaHeader compact /></template>

    <template #hero>
      <header class="proto-hero">
        <p class="proto-overline">DiaStage · hinge prototype · Pattern B (Hero-mechanic)</p>
        <h1 class="proto-headline">The image does not move</h1>
        <p class="proto-lead">
          Scroll slowly and watch the photograph: it <strong>holds dead-still</strong> while the
          panel rises over it and, between the two plates, the <strong>black blade wipes</strong> —
          then a new held image is behind it. The image never scrolls; only things pass over it.
          (Held via Hero's over-tall self-contained cover — no glue-to-viewport, cross-platform,
          aspect-controllable.)
        </p>
      </header>
    </template>

    <div class="proto-stage">
      <!-- ═══ DIA A · held image (you cannot store theatre) ═══ -->
      <section class="bhero">
        <div class="bhero-cover">
          <div
            class="bhero-image"
            role="img"
            aria-label="A performer behind translucent sheeting — the body witnessed, held."
            :style="{ backgroundImage: `url('${beats.unspoken.image}')`, backgroundPosition: 'center center' }"
          />
        </div>
        <div class="bhero-panel">
          <p class="bhero-over">the body, witnessed</p>
          <h2 class="bhero-head">NOT STORED — PERFORMED</h2>
          <p>The plate is dead-still. This panel rose up over it; the image did not move a pixel — exactly the dasei hero. Keep scrolling: the blade comes.</p>
        </div>
      </section>

      <!-- ═══ THE BLADE · wipes up across, masking the seam ═══ -->
      <div class="proto-blade-act">
        <div class="proto-blade">
          <p class="proto-blade-over">between horror and hope</p>
          <p class="proto-blade-text">— the black between —</p>
          <span class="proto-blade-line" aria-hidden="true" />
        </div>
      </div>

      <!-- ═══ DIA B · a NEW held image (raise from the books) ═══ -->
      <section class="bhero">
        <div class="bhero-cover">
          <div
            class="bhero-image"
            role="img"
            aria-label="The orange book against black, green shoots rising — a Szenische Lesung."
            :style="{ backgroundImage: `url('${beats.hope.image}')`, backgroundPosition: 'center center' }"
          />
        </div>
        <div class="bhero-panel">
          <p class="bhero-over">the figures rise</p>
          <h2 class="bhero-head">RAISE FROM THE BOOKS</h2>
          <p>A new plate was held behind the blade — you never saw the first one leave. The image holds the same dead-still way; only the panel and the blade ever moved.</p>
        </div>
      </section>
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

/* ==Overview header== */
.proto-hero { padding-top: clamp(1rem, 4vh, 2.5rem); }
.proto-overline { font-size: 0.875rem; margin: 0 0 0.5rem; letter-spacing: 0.02em; opacity: 0.85; }
.proto-headline { font-size: clamp(1.5rem, 3vw, 2.25rem); font-weight: 700; margin: 0 0 1rem; line-height: 1.2; }
.proto-lead { max-width: 46rem; font-size: 0.9375rem; line-height: 1.6; color: var(--color-muted-contrast); margin: 0; }

/* ════ THE HELD DIA · Hero.vue's mechanic, verbatim ════ */
/* mobile (<768): linearise — the image is a normal illustration, the panel below it. */
.bhero {
  position: relative;
  border-radius: 6px;
}
.bhero-cover { position: static; }
.bhero-image {
  width: 100%;
  min-height: 16rem;
  background-size: cover;
  background-repeat: no-repeat;
  border-radius: 6px;
}
.bhero-panel {
  margin: 1.25rem 0 0;
  background: var(--color-card-bg, #1d1b1a);
  color: var(--color-card-contrast, #f4f4f4);
  padding: 1.25rem 1.5rem;
  border-radius: 4px;
}

@media (min-width: 768px) {
  .bhero {
    /* the window · CLIP (not hidden — clip keeps no scrollport, so the inner sticky lives) */
    overflow: clip;
    min-height: 100vh;
    display: flex;
    align-items: flex-end;
  }
  /* the over-tall layer · its transform makes its OWN containing block → self-contained,
     immune to ancestor transform/overflow (the §15.3 / Hero property). */
  .bhero-cover {
    position: absolute;
    inset: 0 0 auto 0;
    width: 100%;
    height: 200%;
    transform: translate3d(0, 0, 0);
    z-index: 0;
  }
  /* the held image · pins DEAD-STILL while the act scrolls past (sticky in the over-tall cover) */
  .bhero-image {
    position: sticky;
    top: 0;
    width: 100%;
    height: 50%;
    min-height: 0;
    border-radius: 0;
  }
  /* the reading · rises OVER the held image, sticks near the bottom (the dasei panel) */
  .bhero-panel {
    position: sticky;
    bottom: 2rem;
    z-index: 1;
    margin: 0 2.5rem 2.5rem;
    max-width: 30rem;
  }
}

.bhero-over { font-size: 0.8125rem; opacity: 0.85; margin: 0 0 0.35rem; letter-spacing: 0.02em; }
.bhero-head { font-size: 1.25rem; font-weight: 700; line-height: 1.2; margin: 0 0 0.6rem; }
.bhero-panel p:last-child { margin-bottom: 0; }

/* ════ THE BLADE · the scroll-driven wipe (masks the seam between held Dias) ════ */
.proto-blade-act { position: relative; height: 60vh; }
.proto-blade {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  height: 24rem;
  background: #0b0b0c;
  color: #f4f4f4;
  border-radius: 4px;
}
.proto-blade-over { font-size: 0.8125rem; opacity: 0.7; margin: 0; letter-spacing: 0.04em; }
.proto-blade-text { font-size: 1.1rem; margin: 0; letter-spacing: 0.06em; }
.proto-blade-line { width: 2px; height: 3rem; background: var(--color-primary-bg); margin-top: 0.5rem; }

@media (min-width: 768px) {
  /* the blade-act OVERLAPS Dia A's tail (negative margin-top) so the blade rises to cover WHILE
     Dia A is still held — no dead-black gap at the seam. z-index lifts the track over Dia A.
     (The overlap depth + the wipe range below are the seam-timing dials · tune to taste.) */
  .proto-blade-act {
    height: 150vh;
    margin-top: -60vh;
    margin-bottom: -30vh;
    z-index: 5;
  }
  .proto-blade {
    position: sticky;
    top: 0;
    height: 100vh;
    z-index: 5;
    width: 100%;
  }
  @supports (animation-timeline: view()) {
    .proto-blade {
      animation: proto-blade-wipe linear both;
      animation-timeline: view(block);
      animation-range: cover 0% cover 100%;
    }
    /* rise to full cover EARLY (mask Dia A's exit) · HOLD the black-between · then wipe up to
       reveal Dia B. The long 0%-cover hold means there is never a frame of empty dark. */
    @keyframes proto-blade-wipe {
      from { transform: translateY(100%); }
      26%, 74% { transform: translateY(0); }
      to { transform: translateY(-100%); }
    }
  }
}

@media (prefers-reduced-motion: reduce) {
  .proto-blade { animation: none !important; }
}
</style>
