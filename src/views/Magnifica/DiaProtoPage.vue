<!--
  /proto · DiaStage HINGE — Pattern A · "SHUTTER LIFTS TO REVEAL" variant (HM 2026-06-12 · fork).
  Sibling variant ("next plate rises over previous") lives on alpha/magnifica-dia-patternA (cv-diaA).

  A's reason to exist (Blende review · protect both): PURE-CSS — ZERO JS (no scroll listener, no
  IntersectionObserver, no per-frame JS, no config hook) — and a flat .vue authoring. --dia-h is a
  pure CSS `vh` var → viewport-proportional + predictable, resize/zoom handled by the browser. The
  whole scroll choreography is 100% CSS; the timing is fully proportional to vertical position.

  THE MECHANISM — "the height does the timing", kept drift-free by keying every motion to LAYOUT +
  the uniform --dia-h (never a guessed scroll-% state · §24-B's trap):
   · plates (z1–3) — the held lights · `position: sticky` to the STAGE → they NEVER un-pin (the
     i11→i13 floor · element-anchored · no attachment:fixed · iOS-safe). Ascending z.
   · figures (z6) — rise+cover in the right lane over a plate (scene 1 & 3 · scene 2 is a CLEAN dia).
   · shutters (z20+) — high above the plates. Each seam shutter RISES from below (covers the
     previous plate · the black-between) then LIFTS off the top to UNCOVER the held plate behind it
     — a scroll-driven wipe (animation-timeline: view · PURE CSS) keyed to the shutter's OWN
     view-pass + the uniform --dia-h, so the lift completes as the next plate pins. Adjacent +
     uniform-height → the shutter↔next-plate sync is LOCAL, independent of the preceding Figure's
     length → drift-free across scroll-speed + Figure-length. The image is covered/uncovered, never
     scrolled — only the shutter moves.
   Fallback (no scroll-driven · Firefox-stable): the seam shutter scrolls away in flow and still
   reveals the held plate — degraded (no double-speed lift), never broken. Chromium/Safari ship it.

  ANCESTOR-PURITY: the stage + every ancestor stay plain blocks. Desktop-first; <768 linearises.
-->

<template>
  <MagnificaPageLayout variant="standard">
    <template #header><MagnificaHeader compact /></template>

    <div class="proto-stage">
      <!-- the OPENING shutter · covers plate-1 at load · overlaps it (margin = -1·--dia-h) so the
           image is already there; lifts up to uncover (scroll-driven · no plate to sync). -->
      <div class="proto-shutter proto-shutter--open">
        <p class="proto-blade-over">DiaStage · hinge · shutter-lifts</p>
        <p class="proto-blade-head">The image does not move.</p>
        <p class="proto-blade-lead">
          Three held plates, two shutters. Each image is <strong>already there</strong> and never
          moves — a shutter rises to <strong>cover</strong> it (the black between), then
          <strong>lifts off</strong> to <strong>uncover the held plate behind it</strong>. Only the
          shutters move; the light holds.
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
      <!-- SCENE 1 · the reading rises over plate-1 (right lane) · the scroll-range -->
      <div class="proto-scene">
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

      <!-- SEAM 1 · rises over plate-1 (covers) then LIFTS off to reveal plate-2 (held behind) -->
      <div class="proto-shutter proto-shutter--seam proto-shutter--seam1">
        <p class="proto-blade-text">— the black between —</p>
        <span class="proto-blade-line" aria-hidden="true" />
      </div>

      <!-- PLATE 2 · a CLEAN dia (no figures) · the trust-walk · uncovered as seam-1 lifts -->
      <div
        class="proto-light proto-light--2"
        role="img"
        aria-label="A trust-walk — one led blind by another, the room held open."
        :style="{ backgroundImage: `url('${beats.trustwalk.image}')` }"
      />
      <div class="proto-scene proto-scene--clean" />

      <!-- SEAM 2 · covers plate-2 then lifts to reveal plate-3 -->
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
      <div class="proto-scene">
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
/* PURE CSS · ZERO JS — the script carries content only (no scroll listener, no IntersectionObserver,
   no per-frame JS, no config hook). --dia-h is a CSS `vh` var (viewport-proportional, browser-
   recomputed on resize/zoom); the whole choreography is sticky + z + scroll-driven wipe (all CSS).
   That is A's distinctive value (Blende review · protect it). */
import MagnificaPageLayout from './MagnificaPageLayout.vue'
import MagnificaHeader from './MagnificaHeader.vue'
import { beats } from './content/context'
</script>

<style scoped>
/* the stage · plain block (ancestor-purity) · the containing block for the sticky plates, so a
   held light pins to the STAGE and never un-pins. */
.proto-stage {
  position: relative;
  /* the ONE height · pure CSS vh → viewport-proportional + predictable · zero JS (resize/zoom
     handled by the browser). Every plate + shutter + the overlap margins are keyed to it. */
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
  /* the black-between blade · theme tokens (token, #fallback) · square (theme-7 register · no radius) */
  background: var(--color-card-bg, #1d1b1a);
  color: var(--color-card-contrast, #f4f4f4);
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
}
.proto-fig { margin-top: 1.5rem; }
.proto-shutter--seam { margin-top: 1.5rem; min-height: 12rem; }
.proto-scene--clean { min-height: 1px; }

@media (min-width: 768px) {
  /* THE UNIFORM HEIGHT · every plate + every shutter is the SAME --dia-h, sticky at the SAME top
     (issue-1 fix: min-height too → a shutter is NEVER shorter than a plate). */
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

  /* the scenes · the scroll-RANGE each plate holds across + where the figures rise. The clean
     scene (plate-2) is just scroll-length (no figures). */
  .proto-scene { position: relative; min-height: 120vh; }
  /* the clean (trust-walk) scene holds as long as the others, so the 3rd shutter doesn't come
     early (was 90vh → plate-2 held less than scenes 1 & 3 · HP visual). */
  .proto-scene--clean { min-height: 120vh; }

  /* the figures · rise into the RIGHT lane over their plate (z6 · above plates, below shutters) */
  .proto-fig {
    position: sticky;
    top: calc(var(--dia-top) + 3rem);
    left: 52%;
    width: 46%;
    z-index: 6;
    background: var(--color-bg);
    padding: 1.25rem 1.5rem;
    /* square (theme-7 · no radius) · the rising-figure lifts off the plate via an OKLCH shadow
       (not rgb · standards-floor §30.3) */
    box-shadow: 0 12px 32px oklch(0 0 0 / 0.3);
  }
  .proto-fig--2 { top: calc(var(--dia-top) + 9rem); margin-top: 48vh; }

  /* THE OPENING SHUTTER · z20 · overlaps plate-1 (margin = -1·--dia-h) so the image is already
     there; lifts up to uncover (scroll-driven · no plate to sync). */
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

  /* THE SEAM SHUTTERS · z21/22 · full-width. The "shutter lifts to reveal" choreography, PURE-CSS:
     rise from below (cover the previous plate · the black between) → LIFT off the top (uncover the
     held plate behind). Scroll-driven, keyed to the shutter's OWN view-pass + the uniform --dia-h —
     so the lift completes as the next plate pins (layout-keyed · drift-free across scroll-speed and
     Figure-length · the §24-B trap avoided by keying to layout, not a guessed scroll-%). */
  .proto-shutter--seam {
    width: 100%;
    /* OVERLAP the NEXT plate (margin = -1·--dia-h · same trick as the opening shutter) so the next
       plate pins BEHIND the shutter — hidden, no early peek — and is revealed only when the shutter
       lifts. Without this the next plate sat one --dia-h below in flow and rose into the lane early. */
    margin-bottom: calc(-1 * var(--dia-h, 82vh));
  }
  .proto-shutter--seam1 { z-index: 21; }
  .proto-shutter--seam2 { z-index: 22; }

  @supports (animation-timeline: view()) {
    /* cover → lift (the same keyframe as the opening) · the next plate is held BEHIND via the
       overlap above, so the cover is the black-between and the lift uncovers the held plate. */
    .proto-shutter--seam {
      animation: proto-open-wipe linear both;
      animation-timeline: view(block);
      animation-range: cover 0% cover 50%;
    }
  }

  /* fallback (no scroll-driven · Firefox-stable) · the seam shutter is a normal-flow block that
     scrolls away, still revealing the held plate — degraded (no double-speed lift), never broken. */
  @supports not (animation-timeline: view()) {
    .proto-shutter--seam {
      position: relative;
      top: auto;
    }
  }
}

@media (prefers-reduced-motion: reduce) {
  .proto-shutter--open,
  .proto-shutter--seam { animation: none !important; }
}
</style>
