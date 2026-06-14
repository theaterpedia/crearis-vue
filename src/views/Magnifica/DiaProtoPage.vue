<!--
  /proto · PATTERN-B candidate — "the scroll-wiped projector" (branch alpha/magnifica-dia-patternB).

  EMERGENT B-family (HP 2026-06-14 · "let it emerge · concentrate on the scroll-animation options
  B + 2-blade unlock"): the held plate NEVER moves (Hero's behind-layer cover · ancestor-immune)
  and the SHUTTER does all the work. B's bet = the blade-wipe is SCROLL-DRIVEN — scroll-driven's
  "follows-the-finger, both directions" is exactly what kills the reverse-peek IO+transition can't.

  THIS COMMIT = the FLOOR (no-polyfill · all browsers):
    • dead-still behind-layer plates — fixes the reverse-peek (#3) AT THE ROOT: a plate that never
      travels can't peek (the old bare-sticky `.pimg` un-pinned in reverse → img1 showed through).
    • scene-observed IO sets [data-scene]; an "open" region re-asserts scene=open at the top (#2).
    • a mount-time scroll-top guard + manual scrollRestoration (#1 · opens-at-bottom).
  NEXT COMMIT = the scroll-DRIVEN 2-blade seam (B's unique reversible wipe · @supports-guarded,
  IO-transition floor underneath).

  THE HOLD (lifted from Pattern A §22 / Hero.vue:685 · the proven dead-still floor):
    .pdia        absolute behind-layer window (z1) · overflow:clip (clips the over-tall cover)
    .pdia-cover  absolute · height:200% · transform:translate3d → its OWN containing block
                 (ancestor-purity-IMMUNE · gives the sticky plate >1 scene of travel)
    .pdia-plate  position:sticky · element-anchored bg (NO attachment:fixed · §15) · DEAD-STILL
  The Figure (z2) rises over in the right lane. Blades (z9 overlay) cover/lift by [data-scene].
-->

<template>
  <MagnificaPageLayout variant="standard">
    <template #header><MagnificaHeader compact /></template>

    <div
      ref="stageRef"
      class="proto-stage"
      data-scene="open"
      :data-wipe="wipe"
    >
      <!-- ░░ pinned blade overlay (z9) · IO-swept · the scroll-driven wipe is the next commit ░░ -->
      <div class="poverlay">
        <div class="pblade pblade--open">
          <p class="ps-over">DiaStage · hinge prototype · Pattern B</p>
          <h1 class="ps-head">The image does not move</h1>
          <p class="ps-lead">
            Each photograph is held <strong>dead-still</strong> — a behind-layer cover (Hero's
            mechanic), never glued to the viewport. A shutter covers it, then lifts to uncover the
            next one held behind it. The timing is set by where you are on the page.
          </p>
          <span class="pline" aria-hidden="true" />
        </div>
        <div class="pblade pblade--12">
          <p class="ps-over">between horror and hope</p>
          <p class="ps-text">— the black between —</p>
          <span class="pline" aria-hidden="true" />
        </div>
        <div class="pblade pblade--2x">
          <p class="ps-over">and the next plate waits</p>
          <p class="ps-text">— covered again —</p>
          <span class="pline" aria-hidden="true" />
        </div>
      </div>

      <!-- the OPEN region · tall enough to span the viewport-centre at the top, so scrolling back
           up re-asserts scene=open (the opening blade re-covers · #2). -->
      <div class="pseam pseam--intro" data-scene="open" aria-hidden="true"></div>

      <!-- ░░ SCENE 1 · img1 held dead-still (behind-layer) · the figure rises in the right lane ░░ -->
      <section class="pscene" data-scene="img1">
        <div class="pdia pdia--left" role="img" aria-label="the body, witnessed">
          <div class="pdia-cover">
            <div class="pdia-plate" :style="{ backgroundImage: `url('${beats.unspoken.image}')` }" />
          </div>
        </div>
        <div class="pfigure">
          <p class="pp-over">the body, witnessed</p>
          <h2 class="pp-head">NOT STORED — PERFORMED</h2>
          <p class="pp-body">
            The plate is held; the reading rises beside it. Scroll — the figure climbs over the
            dead-still image. The image never travels with it (that is the whole floor).
          </p>
        </div>
      </section>

      <!-- SEAM 1→2 · the blade covers here while img2 takes its place behind -->
      <div class="pseam pseam--mid" data-scene="seam" aria-hidden="true"></div>

      <!-- ░░ SCENE 2 · img2 held dead-still ░░ -->
      <section class="pscene" data-scene="img2">
        <div class="pdia pdia--left" role="img" aria-label="Elementare Animation · trustwalk">
          <div class="pdia-cover">
            <div class="pdia-plate" :style="{ backgroundImage: `url('${beats.trustwalk.image}')` }" />
          </div>
        </div>
        <div class="pfigure">
          <p class="pp-over">Elementare Animation · trustwalk</p>
          <h2 class="pp-head">THE BODY BEFORE THE HEAD</h2>
          <p class="pp-body">
            The shutter covered the seam while this plate took its place behind it — then lifted.
            No wrong-image, no peek: this plate was already here, dead-still, the whole time.
          </p>
        </div>
      </section>

      <!-- the CLOSE region · the closing blade covers img2 (the next plate waits) -->
      <div class="pseam pseam--close" data-scene="close" aria-hidden="true"></div>
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
/** wipe mode · `io` (default · the proven floor) vs `css` (B's scroll-driven reversible blade ·
 *  /proto?wipe=css). Read once on mount (proto · not reactive-by-design). */
const wipe = ref<'io' | 'css'>('io')

onMounted(() => {
  if (new URLSearchParams(location.search).get('wipe') === 'css') wipe.value = 'css'

  // #1 · opens-at-bottom guard: take scroll-restoration off auto, force the top on mount.
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual'
  window.scrollTo(0, 0)

  const stage = stageRef.value
  if (!stage || typeof IntersectionObserver === 'undefined') return
  // observe the scenes + seam-regions directly (each is a normal-flow block that spans the
  // viewport-centre during its scroll-range · the behind-layer plate is sticky INSIDE its scene,
  // so the scene itself is the honest sentinel). NOT the stage (it carries the default scene).
  const sentinels = stage.querySelectorAll<HTMLElement>(
    '.pscene[data-scene], .pseam[data-scene]',
  )
  // root = a 0-height line at the viewport-centre (rootMargin -50%/-50%); a region "intersects"
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

/* ════ MOBILE (<768) · linearise: plates are normal-flow illustrations, blades flow as blocks ════ */
.pscene { position: relative; margin-bottom: 1.25rem; }
.pdia {
  position: relative;
  border-radius: 6px;
  overflow: clip;
  margin-bottom: 1rem;
}
.pdia-cover { position: relative; height: auto; transform: none; }
.pdia-plate {
  position: relative;
  min-height: 16rem;
  background-size: cover;
  background-position: center;
  background-color: var(--color-bg);
  border-radius: 6px;
}
.pfigure { position: relative; z-index: 2; }
.pp-over { font-size: 0.8125rem; opacity: 0.85; margin: 0 0 0.35rem; letter-spacing: 0.02em; }
.pp-head { font-size: 1.25rem; font-weight: 700; line-height: 1.2; margin: 0 0 0.5rem; }
.pp-body { font-size: 0.9375rem; line-height: 1.6; margin: 0; }

.poverlay { display: contents; }
.pblade {
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
.pseam { display: none; }

/* ════ DESKTOP (≥768) · behind-layer dead-still plates + a pinned IO-swept blade overlay ════ */
@media (min-width: 768px) {
  /* the scene · a plain block (ancestor-purity) · min-height gives the held plate its travel */
  .pscene { position: relative; min-height: 130vh; margin-bottom: 0; }

  /* the held plate · Hero's behind-layer (A §22): window(clip) > cover(own transform CB) > plate(sticky) */
  .pdia {
    position: absolute;
    inset: 0;
    z-index: 1;
    width: 48%;
    overflow: clip;
    margin-bottom: 0;
    border-radius: 6px;
  }
  .pdia-cover {
    position: absolute;
    inset: 0;
    height: 200%;                  /* > one scene of travel → the plate never un-pins while up */
    transform: translate3d(0, 0, 0); /* own containing block → ancestor-purity-immune (Hero) */
  }
  .pdia-plate {
    position: sticky;
    top: 0;
    height: 100vh;                 /* dead-still: pins at the viewport-top for the scene's range */
    min-height: 0;
    border-radius: 0;
  }

  /* the rising Figure · right lane · z above the plate · normal flow (climbs over the held plate) */
  .pfigure {
    position: relative;
    z-index: 2;
    width: 44%;
    margin-left: 52%;
    padding: 2.5rem 0;
    text-shadow: 0 1px 10px rgba(0, 0, 0, 0.6);
  }

  /* the seam/intro/close regions · transparent travel that carries the scene-state (the pinned
     plate shows through them); each holds its scene while it spans the viewport-centre. */
  .pseam { display: block; height: 90vh; }
  .pseam--intro { height: 100vh; }   /* tall enough to own the centre at scrollTop 0 (#2) */
  .pseam--close { height: 100vh; }

  /* the pinned overlay · sticky + margin-bottom:-100vh so it overlaps the scenes without
     consuming flow. z above the plates + figures. Holds the blades as viewport-filling layers. */
  .poverlay {
    display: block;
    position: sticky;
    top: 0;
    height: 100vh;
    margin-bottom: -100vh;
    z-index: 9;
    pointer-events: none;
  }
  .pblade {
    position: absolute;
    inset: 0;
    min-height: 0;
    margin: 0;
    border-radius: 0;
    transition: transform 0.55s ease;
    will-change: transform;        /* leaf overlay · NOT a stage ancestor (purity safe) */
  }

  /* rest-states + the per-scene sweeps. The blade lifts only at its image's scene → it never
     reveals the wrong image. (Scroll-driven reversible wipe replaces these next commit.) */
  .pblade--open { transform: translateY(0); }       /* covers on open */
  .pblade--12   { transform: translateY(100%); }    /* waits below */
  .pblade--2x   { transform: translateY(100%); }    /* waits below */

  [data-scene="img1"] .pblade--open,
  [data-scene="seam"] .pblade--open,
  [data-scene="img2"] .pblade--open,
  [data-scene="close"] .pblade--open { transform: translateY(-100%); }   /* opening lifts off img1 */

  [data-scene="seam"] .pblade--12 { transform: translateY(0); }          /* covers the seam */
  [data-scene="img2"] .pblade--12,
  [data-scene="close"] .pblade--12 { transform: translateY(-100%); }     /* lifts off img2 */

  [data-scene="close"] .pblade--2x { transform: translateY(0); }         /* covers img2 (close) */
}

/* ════ B's UNIQUE LAYER · scroll-DRIVEN reversible blade-wipe (opt-in · /proto?wipe=css) ════
   The bench's bet: the blade-wipe is the ONE place scroll-driven is the RIGHT tool — it is pure
   PROGRESS (not a state-decision · §24-B), and "follows-the-finger, both directions" is exactly
   what kills the reverse-peek IO+transition can't (it cannot lag · it IS the scroll position).
   Each seam region carries a named view-timeline; the overlay blades (a different subtree) read it
   via a timeline-scope hoist on the stage. @supports-guarded; the IO floor (default ?wipe=io) is
   untouched. Engine 2026: Chromium + Safari 26 ship unprefixed; Firefox needs the flackr polyfill.
   ⚠ :3001 DIALS — (a) does timeline-scope resolve cross-subtree (§23 risk · else falls to no-anim)?
   (b) animation-range per blade is the timing knob — tune so a blade is DOWN through the whole
   transition zone, BOTH directions (§24-E). */
@keyframes pblade-cover-lift { from { transform: translateY(100%); } 50% { transform: translateY(0); } to { transform: translateY(-100%); } }
@keyframes pblade-lift       { from { transform: translateY(0); }    to  { transform: translateY(-100%); } }
@keyframes pblade-cover      { from { transform: translateY(100%); } to  { transform: translateY(0); } }

@supports (animation-timeline: view()) {
  @media (min-width: 768px) {
    /* hoist the seam timelines so the overlay blades (sibling subtree) can reference them */
    .proto-stage[data-wipe="css"] { timeline-scope: --tl-open, --tl-12, --tl-2x; }
    [data-wipe="css"] .pseam--intro { view-timeline: --tl-open block; }
    [data-wipe="css"] .pseam--mid   { view-timeline: --tl-12 block; }
    [data-wipe="css"] .pseam--close { view-timeline: --tl-2x block; }

    /* scroll-driven owns the transform in this mode → drop the IO transition */
    [data-wipe="css"] .pblade { transition: none; }

    [data-wipe="css"] .pblade--open {
      animation: pblade-lift linear both;
      animation-timeline: --tl-open;
      animation-range: cover 40% cover 100%;   /* dial */
    }
    [data-wipe="css"] .pblade--12 {
      animation: pblade-cover-lift linear both;
      animation-timeline: --tl-12;
      animation-range: cover 0% cover 100%;     /* dial */
    }
    [data-wipe="css"] .pblade--2x {
      animation: pblade-cover linear both;
      animation-timeline: --tl-2x;
      animation-range: cover 0% cover 60%;      /* dial */
    }
  }
}

/* reduced-motion · no sweeps; blades flow as normal blocks so the page is never trapped. */
@media (prefers-reduced-motion: reduce) {
  .pblade { transition: none !important; }
  .pblade--open, .pblade--12, .pblade--2x { position: relative; inset: auto; transform: none !important; }
  .poverlay { position: static; height: auto; margin-bottom: 0; }
}
</style>
