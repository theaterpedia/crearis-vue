<!--
  /proto · PATTERN-B candidate (branch alpha/magnifica-dia-patternB · HM 2026-06-12).

  THE CORRECT DOM ORDER (HP 2026-06-12): the held image must already BE there, behind the shutter,
  and get UNCOVERED as the shutter lifts — it must NOT scroll in from below. So each act STACKS its
  layers in one place (a single-cell CSS grid · `grid-area:1/1`):
        z1  the held image  (position:sticky · DEAD-STILL · present on load / on arrival)
        z2  the panel        (the overline-headline · rises/sits over the held image)
        z6  the shutter      (covers the held image · wipes UP to uncover it)
  The grid-stack is what puts the shutter OVER the already-present image (not after it). The image
  is held via `position:sticky` (no glue-to-viewport · cross-platform · aspect via bg-size/pos);
  Hero's over-tall self-contained cover is the production hardening for ancestor-immunity (the
  stage here is a plain ancestor, so plain sticky holds).

  Act 1 · the OPENING: the shutter covers the image on LOAD (scroll(root) timeline · 0 = page-top),
          carries the intro, wipes up to uncover. Act 2 · the BETWEEN: the shutter covers on
          ARRIVAL (view-timeline on the act) and wipes up to uncover the next held image.
-->

<template>
  <MagnificaPageLayout variant="standard">
    <template #header><MagnificaHeader compact /></template>

    <div class="proto-stage">
      <!-- ═══ ACT 1 · held image (you cannot store theatre) · UNCOVERED by the opening shutter ═══ -->
      <div class="proto-act proto-act--open">
        <div
          class="proto-held"
          role="img"
          aria-label="A performer behind translucent sheeting — the body witnessed, held."
          :style="{ backgroundImage: `url('${beats.unspoken.image}')` }"
        />
        <div class="proto-panel">
          <p class="proto-over">the body, witnessed</p>
          <h2 class="proto-head">NOT STORED — PERFORMED</h2>
          <p>The image was here all along — the shutter lifted off it. It does not move; only the cover did.</p>
        </div>
        <!-- the opening shutter · covers on load · wipes up to uncover the held image behind it -->
        <div class="proto-shutter proto-shutter--open">
          <p class="proto-shutter-over">DiaStage · hinge prototype · Pattern B (Hero-mechanic)</p>
          <h1 class="proto-shutter-head">The image does not move</h1>
          <p class="proto-shutter-lead">
            Scroll slowly: this shutter lifts to <strong>uncover</strong> a photograph that is
            already there, held <strong>dead-still</strong>. Between the plates another shutter wipes
            and a new held image is revealed behind it. The image never scrolls; only covers pass over it.
          </p>
          <span class="proto-shutter-line" aria-hidden="true" />
        </div>
      </div>

      <!-- ═══ ACT 2 · a NEW held image (raise from the books) · UNCOVERED by the between shutter ═══ -->
      <div class="proto-act proto-act--between">
        <div
          class="proto-held"
          role="img"
          aria-label="The orange book against black, green shoots rising — a Szenische Lesung."
          :style="{ backgroundImage: `url('${beats.hope.image}')` }"
        />
        <div class="proto-panel">
          <p class="proto-over">the figures rise</p>
          <h2 class="proto-head">RAISE FROM THE BOOKS</h2>
          <p>This image was already held behind the blade — the blade wiped up and revealed it. Same uncover, between the acts.</p>
        </div>
        <!-- the between shutter · covers on arrival · wipes up to uncover the held image behind it -->
        <div class="proto-shutter proto-shutter--between">
          <p class="proto-shutter-over">between horror and hope</p>
          <p class="proto-shutter-text">— the black between —</p>
          <span class="proto-shutter-line" aria-hidden="true" />
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

/* ── shared layer styles (mobile-first: the layers just stack in normal flow) ── */
.proto-held {
  width: 100%;
  min-height: 16rem;
  background-size: cover;
  background-position: center;
  background-color: var(--color-bg);
  border-radius: 6px;
}
.proto-panel {
  margin: 1.25rem 0 0;
  background: var(--color-card-bg, #1d1b1a);
  color: var(--color-card-contrast, #f4f4f4);
  padding: 1.25rem 1.5rem;
  border-radius: 4px;
}
.proto-over { font-size: 0.8125rem; opacity: 0.85; margin: 0 0 0.35rem; letter-spacing: 0.02em; }
.proto-head { font-size: 1.25rem; font-weight: 700; line-height: 1.2; margin: 0 0 0.6rem; }
.proto-panel p:last-child { margin-bottom: 0; }

.proto-shutter {
  margin: 1.25rem 0 0;
  background: #0b0b0c;
  color: #f4f4f4;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 0.6rem;
  padding: 2rem;
  min-height: 60vh;
  border-radius: 4px;
}
.proto-shutter-over { font-size: 0.875rem; opacity: 0.7; margin: 0; letter-spacing: 0.04em; }
.proto-shutter-head { font-size: clamp(1.5rem, 3vw, 2.25rem); font-weight: 700; margin: 0; line-height: 1.2; }
.proto-shutter-lead { max-width: 42rem; font-size: 0.9375rem; line-height: 1.6; opacity: 0.92; margin: 0; }
.proto-shutter-text { font-size: 1.1rem; margin: 0; letter-spacing: 0.06em; }
.proto-shutter-line { width: 2px; height: 3rem; background: var(--color-primary-bg); margin-top: 0.25rem; }

/* ════ DESKTOP · the stack (held image · panel · shutter all in ONE grid cell → they overlap) ════ */
@media (min-width: 768px) {
  .proto-act {
    position: relative;
    display: grid;
    height: 220vh;            /* the act's scroll-length = the shutter-wipe + the held-image hold */
  }
  .proto-act > * {
    grid-area: 1 / 1;         /* STACK every layer in the same cell → the shutter sits OVER the image */
    align-self: start;
  }

  /* z1 · the HELD image · pinned dead-still · present behind the shutter from the first frame */
  .proto-held {
    position: sticky;
    top: 0;
    height: 100vh;
    min-height: 0;
    z-index: 1;
    margin: 0;
    border-radius: 0;
  }
  /* z2 · the panel · sticks near the bottom, over the held image (visible after the uncover) */
  .proto-panel {
    position: sticky;
    top: 0;
    height: 100vh;
    z-index: 2;
    margin: 0;
    background: transparent;
    color: var(--color-card-contrast, #f4f4f4);
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    align-items: flex-start;
    padding: 2.5rem;
    text-shadow: 0 1px 8px rgba(0, 0, 0, 0.6);
    pointer-events: none;
  }
  .proto-panel > * { max-width: 30rem; }

  /* z6 · the SHUTTER · covers the held image, wipes UP to uncover it */
  .proto-shutter {
    position: sticky;
    top: 0;
    height: 100vh;
    min-height: 0;
    z-index: 6;
    margin: 0;
    border-radius: 0;
  }

  /* the OPENING shutter · covers on LOAD (scroll(root) is 0 at page-top), wipes up over the first
     ~90vh of scroll. scroll() is the right timeline for a top-of-page cover (view() reads
     mid-progress at load). */
  @supports (animation-timeline: scroll()) {
    .proto-shutter--open {
      animation: proto-uncover-open linear both;
      animation-timeline: scroll(root block);
      animation-range: 0 90vh;
    }
    @keyframes proto-uncover-open {
      from { transform: translateY(0); }
      to { transform: translateY(-100%); }
    }
  }

  /* the BETWEEN shutter · driven by ITS act's view-progress (named view-timeline on the act, a
     clean non-sticky box). Covers as the act arrives + the image pins behind it, holds briefly,
     then wipes up to uncover. The range/hold are dials. */
  .proto-act--between { view-timeline: --act2 block; }
  @supports (animation-timeline: view()) {
    .proto-shutter--between {
      animation: proto-uncover-between linear both;
      animation-timeline: --act2;
      animation-range: cover 8% cover 55%;
    }
    @keyframes proto-uncover-between {
      from { transform: translateY(0); }
      40% { transform: translateY(0); }
      to { transform: translateY(-100%); }
    }
  }
}

/* reduced-motion · no wipes · the shutters become normal scroll-past blocks (never sticky-trap) */
@media (prefers-reduced-motion: reduce) {
  .proto-act { display: block; height: auto; }
  .proto-held,
  .proto-panel,
  .proto-shutter {
    position: static;
    height: auto;
    min-height: 16rem;
    animation: none !important;
    transform: none !important;
  }
  .proto-panel { background: var(--color-card-bg, #1d1b1a); }
}
</style>
