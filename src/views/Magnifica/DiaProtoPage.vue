<!--
  /proto · DiaStage HINGE PROTOTYPE — does the shadow-theater actually come alive? (HM 2026-06-12)
  NOT a component, NOT content — a single decisive proof of the MECHANISM the demos lack:

    1 · the HELD LIGHT persists across a TALL act — the plate pins for the whole act (many figures),
        not 70vh-and-gone (the per-scene DiaStage miss).
    2 · the FIGURES rise · pin · COVER — the validated /ethnography Scene-A recipe (sticky rises +
        margin-top pauses + ascending z + opaque bg), which DiaStage simplified to plain flow.
    3 · the SHUTTER WIPES — a scroll-driven translateY blade (animation-timeline) sweeps across and a
        NEW plate of light opens behind it. @supports-guarded: where scroll-driven isn't supported
        the blade is a sticky cover (still a beat, never broken). Firefox-stable → flackr polyfill.

  If this reads as theater and the demos don't, the fix is to fold this mechanism back into
  DiaStage/Dia/Shutter (figures rise+cover · light holds across the act · the wipe). If it still
  reads ordinary, the architecture needs rethinking (the page-level MagnificaStage). Desktop-first.
-->

<template>
  <MagnificaPageLayout variant="standard">
    <template #header><MagnificaHeader compact /></template>

    <template #hero>
      <header class="proto-hero">
        <p class="proto-overline">DiaStage · hinge prototype</p>
        <h1 class="proto-headline">Does the held light hold?</h1>
        <p class="proto-lead">
          Scroll slowly. Watch for three things the demos miss: <strong>the image holds still</strong>
          while several text-figures <strong>rise and cover</strong> each other over it; then a
          <strong>black blade wipes up</strong> across the whole stage; and behind it a
          <strong>new plate of light</strong> has opened. That sweep is the Shutter — the shadow-theater
          gap made literal.
        </p>
      </header>
    </template>

    <div class="proto-stage">
      <!-- ═══ ACT 1 · the held light (you cannot store theatre) ═══ -->
      <section class="proto-act">
        <div
          class="proto-light"
          role="img"
          aria-label="A performer behind translucent sheeting — the body witnessed, held."
          :style="{ backgroundImage: `url('${beats.unspoken.image}')` }"
        />
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
        <div class="proto-fig proto-fig--3">
          <p class="proto-fig-over">so the page holds it</p>
          <h2 class="proto-fig-head">THE LIGHT STAYS · THE READING PASSES</h2>
          <p>Three figures, one plate. The image never left — that persistence is the stage. Now the blade.</p>
        </div>
      </section>

      <!-- ═══ THE BLADE · wipes up across the whole stage ═══ -->
      <div class="proto-blade-act">
        <div class="proto-blade">
          <p class="proto-blade-over">between horror and hope</p>
          <p class="proto-blade-text">— the black between —</p>
          <span class="proto-blade-line" aria-hidden="true" />
        </div>
      </div>

      <!-- ═══ ACT 2 · a NEW plate of light (raise from the books) ═══ -->
      <section class="proto-act">
        <div
          class="proto-light"
          role="img"
          aria-label="The orange book against black, green shoots rising — a Szenische Lesung."
          :style="{ backgroundImage: `url('${beats.hope.image}')` }"
        />
        <div class="proto-fig proto-fig--1">
          <p class="proto-fig-over">the figures rise</p>
          <h2 class="proto-fig-head">RAISE FROM THE BOOKS</h2>
          <p>A new plate opened behind the blade. The light changed; the stage did not. That swap is the act-break.</p>
        </div>
        <div class="proto-fig proto-fig--2">
          <p class="proto-fig-over">five or ten hands</p>
          <h2 class="proto-fig-head">LARGER THAN ONE COULD BUILD</h2>
          <p>The reading rises again over the new light, and the stage holds it the same way. One mechanism, two acts.</p>
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
/* the stage · a plain block in normal flow (ancestor-purity · the whole thing rests on it). */
.proto-stage {
  position: relative;
}

/* ==Overview header== */
.proto-hero { padding-top: clamp(1rem, 4vh, 2.5rem); }
.proto-overline { font-size: 0.875rem; margin: 0 0 0.5rem; letter-spacing: 0.02em; opacity: 0.85; }
.proto-headline { font-size: clamp(1.5rem, 3vw, 2.25rem); font-weight: 700; margin: 0 0 1rem; line-height: 1.2; }
.proto-lead { max-width: 46rem; font-size: 0.9375rem; line-height: 1.6; color: var(--color-muted-contrast); margin: 0; }

/* mobile (<768): linearise — the light is a normal illustration, figures flow below it. */
.proto-light {
  width: 100%;
  min-height: 16rem;
  background-size: cover;
  background-position: center;
  background-color: var(--color-bg);
  border-radius: 4px;
}
.proto-fig { margin-top: 1.5rem; }

@media (min-width: 768px) {
  .proto-act { position: relative; }

  /* 1 · THE HELD LIGHT · sticky to the ACT (tall) → it holds across ALL the act's figures,
        not one screen. z1 = the ground. Element-anchored background (never attachment:fixed). */
  .proto-light {
    position: sticky;
    top: var(--bb-navbar-offset, 6rem);
    width: 48%;
    height: 80vh;
    min-height: 0;
    z-index: 1;
    margin: 0;
  }

  /* 2 · THE FIGURES · rise from below into the right lane (left:52%), pin at ascending tops
        (accumulate), each opaque + higher z so it COVERS the prior — the validated Scene-A recipe.
        The margin-top is the pause (the gap in time before the next rises). */
  .proto-fig {
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
  .proto-fig--1 { top: calc(var(--bb-navbar-offset, 6rem) + 3rem);  margin-top: 16vh; }
  .proto-fig--2 { top: calc(var(--bb-navbar-offset, 6rem) + 9rem);  margin-top: 70vh; z-index: 3; }
  .proto-fig--3 { top: calc(var(--bb-navbar-offset, 6rem) + 15rem); margin-top: 70vh; z-index: 4; }
}

.proto-fig-over { font-size: 0.8125rem; opacity: 0.8; margin: 0 0 0.35rem; letter-spacing: 0.02em; }
.proto-fig-head { font-size: 1.25rem; font-weight: 700; line-height: 1.2; margin: 0 0 0.6rem; }
.proto-fig p:last-child { margin-bottom: 0; }

/* 3 · THE BLADE · the scroll-driven wipe. The track gives the wipe its scroll-length; the blade
      pins (sticky) and a scroll-linked translateY sweeps it up across the viewport and out. */
.proto-blade-act {
  position: relative;
  height: 60vh;
}
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
  .proto-blade-act { height: 140vh; }
  .proto-blade {
    position: sticky;
    top: 0;
    height: 100vh;
    z-index: 5;
    /* covers both lanes (the content column) · full-viewport bleed is a later dial. */
    width: 100%;
  }

  /* the WIPE · only where scroll-driven animations ship (Chromium + Safari 26). Elsewhere the
     blade is a plain sticky cover (a held "black between" beat) — degraded, never broken.
     Firefox-stable: add `import 'scroll-timeline-polyfill'` to light this up (the production path). */
  @supports (animation-timeline: view()) {
    .proto-blade {
      animation: proto-blade-wipe linear both;
      animation-timeline: view(block);
      animation-range: cover 0% cover 100%;
    }
    @keyframes proto-blade-wipe {
      from { transform: translateY(105%); }   /* waiting below the fold */
      42%, 58% { transform: translateY(0); }  /* full cover — the black between */
      to { transform: translateY(-105%); }    /* swept up and gone · the new plate is revealed */
    }
  }
}

@media (prefers-reduced-motion: reduce) {
  .proto-blade { animation: none !important; }
}
</style>
