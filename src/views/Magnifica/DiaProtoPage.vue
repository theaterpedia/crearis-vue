<!--
  /proto · Pattern A · "NEXT PLATE RISES OVER PREVIOUS" (HM 2026-06-12 · the i11→i13 mechanic).
  PURE CSS — zero JS in the loop, zero scroll-driver, zero IO. The distinctive A value: the
  whole choreography is sticky-stacking + z-index + ONE uniform height; the browser runs it.

  THE MECHANISM (positional · drift-free · §24-B-immune because it never GUESSES a state):
   · every plate + shutter is the SAME height — one central `--dia-h` (a viewport proportion ·
     a plain CSS `vh` var · so resize/zoom are automatic, no JS) — "the height does the timing".
   · all are `position: sticky` at the SAME top, INSIDE THE STAGE → a held plate NEVER un-pins
     (the floor: the held image is dead-still, never scrolls off · the iOS-safe element-anchored
     replacement for attachment:fixed). ASCENDING z = the order of rising-over.
   · the NEXT layer rises up from below and COVERS the previous as it pins (i11→i13: the box
     rises, the held image holds). The cover happens at a fixed flow-POSITION (not a scroll-% /
     not a state-guess) → no drift across scroll-speed, Figure-length, resize, or zoom.

  Image-1 is already there at scroll 0 (first in flow · pins immediately · never moves). The
  reading rises over it; a shutter rises over that; the next plate rises over the shutter; and so
  on — three held plates (sheeting · trust-walk · plants), two black-between shutters.

  ANCESTOR-PURITY: the stage + every ancestor stay plain blocks (no transform/overflow/contain/
  will-change). focal via prop, never :deep. Desktop-first; <768 linearises to normal flow.
-->

<template>
  <MagnificaPageLayout variant="standard">
    <template #header><MagnificaHeader compact /></template>

    <div class="proto-stage">
      <!-- PLATE 1 · the held light · already there at scroll 0 · z10 · NEVER moves -->
      <div
        class="proto-light proto-light--1"
        role="img"
        aria-label="A performer behind translucent sheeting — the body witnessed, held."
        :style="{ backgroundImage: `url('${beats.unspoken.image}')` }"
      />
      <!-- SCENE 1 · the reading rises over plate-1 (right lane) · the first figure carries the intro -->
      <div class="proto-scene">
        <div class="proto-fig proto-fig--1">
          <p class="proto-fig-over">DiaStage · hinge · the image does not move</p>
          <h2 class="proto-fig-head">NOT STORED — PERFORMED</h2>
          <p>The plate is already there and holds dead-still. You scroll; the reading rises over it; then a shutter rises over that, and a new plate rises over the shutter. Nothing scrolls off — each layer rises over the one before.</p>
        </div>
        <div class="proto-fig proto-fig--2">
          <p class="proto-fig-over">Schwebezustände</p>
          <h2 class="proto-fig-head">THE OPENLY-DECOUPLED STATE</h2>
          <p>This card rose from below and now covers the first — opaque, higher in the stack. The light behind is the same held light; it never moved.</p>
        </div>
      </div>

      <!-- SHUTTER 1 · the black-between · rises over plate-1 + the reading (z20) -->
      <div class="proto-shutter proto-shutter--1">
        <p class="proto-blade-text">— the black between —</p>
        <span class="proto-blade-line" aria-hidden="true" />
      </div>

      <!-- PLATE 2 · a CLEAN dia (no figures) · the trust-walk · rises over shutter-1 (z30) -->
      <div
        class="proto-light proto-light--2"
        role="img"
        aria-label="A trust-walk — one led by another, the room held open."
        :style="{ backgroundImage: `url('${beats.trustwalk.image}')` }"
      />
      <div class="proto-scene proto-scene--clean" />

      <!-- SHUTTER 2 · rises over plate-2 (z40) -->
      <div class="proto-shutter proto-shutter--2">
        <p class="proto-blade-text">— the black between —</p>
        <span class="proto-blade-line" aria-hidden="true" />
      </div>

      <!-- PLATE 3 · the new held light · the plants · rises over shutter-2 (z50) -->
      <div
        class="proto-light proto-light--3"
        role="img"
        aria-label="The orange book against black, green shoots rising — a Szenische Lesung."
        :style="{ backgroundImage: `url('${beats.hope.image}')` }"
      />
      <div class="proto-scene">
        <div class="proto-fig proto-fig--1">
          <p class="proto-fig-over">the figures rise</p>
          <h2 class="proto-fig-head">RAISE FROM THE BOOKS</h2>
          <p>A new plate rose over the shutter. The light changed; the stage did not. That rise-over is the act-break.</p>
        </div>
        <div class="proto-fig proto-fig--2">
          <p class="proto-fig-over">five or ten hands</p>
          <h2 class="proto-fig-head">LARGER THAN ONE COULD BUILD</h2>
          <p>The reading rises again over the new light, and the stage holds it the same way. One mechanism, three plates — no JS.</p>
        </div>
      </div>
    </div>
  </MagnificaPageLayout>
</template>

<script setup lang="ts">
/* PURE CSS · the script carries content only — NO scroll listener, NO IntersectionObserver, NO
   per-frame JS, NO config hook. The height is a CSS `vh` var; the choreography is sticky + z. */
import MagnificaPageLayout from './MagnificaPageLayout.vue'
import MagnificaHeader from './MagnificaHeader.vue'
import { beats } from './content/context'
</script>

<style scoped>
/* the stage · plain block (ancestor-purity) · the containing block for every sticky plate, so a
   held light pins to the STAGE and never un-pins. --dia-h is the ONE central height (pure CSS). */
.proto-stage {
  position: relative;
  --dia-h: 82vh;
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
.proto-blade-text { font-size: 1.1rem; margin: 0; letter-spacing: 0.06em; }
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
.proto-shutter { margin-top: 1.5rem; min-height: 12rem; }
.proto-scene--clean { min-height: 1px; }

@media (min-width: 768px) {
  /* THE UNIFORM HEIGHT · every plate + shutter is the SAME --dia-h, sticky at the SAME top, inside
     the stage → held plates never un-pin; the next layer rises over after a fixed scroll. */
  .proto-light,
  .proto-shutter {
    position: sticky;
    top: var(--dia-top);
    height: var(--dia-h);
    min-height: var(--dia-h);
    margin: 0;
  }

  /* held plates · left lane · ASCENDING z = the rise-over order · never un-pin */
  .proto-light { width: 48%; }
  .proto-light--1 { z-index: 10; }
  .proto-light--2 { z-index: 30; }
  .proto-light--3 { z-index: 50; }

  /* the shutters · full-width · rise over the plate before them (z between the plates) */
  .proto-shutter { width: 100%; min-height: var(--dia-h); margin: 0; }
  .proto-shutter--1 { z-index: 20; }
  .proto-shutter--2 { z-index: 40; }

  /* the scenes · the scroll-RANGE each plate holds across + where the figures rise. The clean
     scene (plate-2) is just scroll-length (no figures · the trust-walk holds, then shutter-2 rises). */
  .proto-scene { position: relative; min-height: 120vh; }
  .proto-scene--clean { min-height: 90vh; }

  /* the figures · rise into the RIGHT lane over their plate (z just above the plate, below the
     next shutter so the shutter rises over them too). Sticky to the SCENE (the reading passes). */
  .proto-fig {
    position: sticky;
    top: calc(var(--dia-top) + 3rem);
    left: 52%;
    width: 46%;
    z-index: 15;
    background: var(--color-bg);
    padding: 1.25rem 1.5rem;
    border-radius: 4px;
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.3);
  }
  .proto-fig--2 { top: calc(var(--dia-top) + 9rem); margin-top: 48vh; z-index: 16; }
  /* scene-3's figures ride above plate-3 (z50) → lift their lane above it */
  .proto-scene:last-of-type .proto-fig { z-index: 55; }
  .proto-scene:last-of-type .proto-fig--2 { z-index: 56; }
}

/* nothing scroll-driven · nothing to disable for reduced-motion (no transitions/animations).
   The hold is dead-still by construction; the rise-over is the browser's own sticky scroll. */
</style>
