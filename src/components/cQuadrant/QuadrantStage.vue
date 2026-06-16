<template>
    <section
        ref="stageEl"
        class="quadrant-stage"
        :class="{ 'quadrant-stage--bounded': bounded }"
    >
        <!-- the HELD grid · sticky-to-stage (the 2×2 · top-left anchor known · q1 q2 / q3 q4).
             Backgrounds always painted; CONTENT reveal-gated per row by the seam (HP-A1). -->
        <div class="quadrant-grid">
            <Quadrant
                v-for="(q, i) in cells"
                :key="q.id ?? `q${i + 1}`"
                :image="q.image"
                :image-alt="q.imageAlt"
                :img-tmp-align-x="q.imgTmpAlignX"
                :img-tmp-align-y="q.imgTmpAlignY"
                :theme="q.theme"
                :heading="q.heading"
                :heading-as="q.headingAs"
                :heading-side="q.headingSide"
                :revealed="isRevealed(i)"
            >
                <!-- per-cell sub-element slot (#q-1 … #q-4 · the in-place post-it · HP-A3) -->
                <slot :name="`q-${i + 1}`" :quadrant="q" :index="i" />
            </Quadrant>
        </div>

        <!-- the sweeping cross-hair blade · scrolls UP over the pinned grid (z above it), its edges
             driving the row-reveals. Transparent (the grid reads through). -->
        <QuadrantSeam
            class="quadrant-stage-seam"
            :height="seamHeight"
            :v-size="seamVSize"
            :h-size="seamHSize"
            :line-color="seamLineColor"
            @reveal-bottom="onRevealBottom"
            @reveal-top="onRevealTop"
        />
    </section>
</template>

<script setup lang="ts">
/**
 * QuadrantStage — the cQuadrant assembler (= DiaStage's role · between CardsCanvas + cDia). A HELD
 * 2×2 grid (q1/q2 top · q3/q4 bottom) that a 50vH cross-hair seam sweeps over, revealing the cells'
 * content row-by-row (bottom row as the seam-bottom enters · top row as the seam-top exits · HP-A1).
 *
 * JS CONFIGURES the geometry (HP-spec · the ONLY layout-JS): on mount/resize it computes the cell
 * box (height vH + width vW) from the held height + the cell-aspect, clamped to the magnifica
 * content-bound, and writes --q-cell-w/h + --q-total-w/h. The KNOWN TOP-LEFT is the centred grid's
 * origin; CSS grid lays q1..q4 out from there. (The reveal-toggle is the seam's bounded IO · §2.)
 *
 * ── ANCESTOR-PURITY (load-bearing · backslide §9.1) ── the stage + EVERY ancestor stay plain blocks
 * (no transform/filter/overflow-non-visible/contain/will-change) or the grid's sticky hold dies. The
 * mounting page must honor this (the landing's .magnifica-landing-content is clean · audited).
 *
 * The honest-flag content is the NEXT sibling on the page (a CardsCanvas blackboard): as the stage
 * ends and the grid releases, the blackboard rises OVER it — the wipe (HP-spec · Theatervorhang).
 */
import { ref, computed, onMounted, onUnmounted } from 'vue'
import Quadrant from './Quadrant.vue'
import QuadrantSeam from './QuadrantSeam.vue'
import type { QuadrantSpec, LineSize } from './types'

const props = withDefaults(
    defineProps<{
        /** the 4 cells · q1,q2 (top row) · q3,q4 (bottom row). >4 ignored; <4 padded by CSS. */
        quadrants: QuadrantSpec[]
        /** bound the held grid to the 90rem column on wide viewports (the --mag-bound/96rem gate). */
        bounded?: boolean
        /** the held grid's total height as a fraction of the viewport (the held-plate feel). */
        heightVh?: number
        /** each cell's aspect (w/h · HP-A4 default 1 = square grid). */
        cellAspect?: number
        /** the seam blade height (HP-spec · mostly 50vH). */
        seamHeight?: string
        /** the cross-hair line sizes/colour (forwarded to the seam · the dasei-yellow motif). */
        seamVSize?: LineSize
        seamHSize?: LineSize
        seamLineColor?: string
        /** opt the reveal-choreography OFF → everything visible immediately (also forced by the OS
         *  prefers-reduced-motion · the no-trap floor). Default false → the reveal runs (the point). */
        reducedMotion?: boolean
    }>(),
    {
        bounded: false,
        heightVh: 82,
        cellAspect: 1,
        seamHeight: '50vh',
        seamVSize: 'medium',
        seamHSize: 'medium',
        seamLineColor: 'primary',
        reducedMotion: false,
    },
)

const stageEl = ref<HTMLElement>()
const cells = computed(() => props.quadrants.slice(0, 4))

/* ── the reveal state · per row · driven by the seam's edge-events (HP-A1) ─────────────────────── */
const topRowRevealed = ref(false) // q1 + q2
const bottomRowRevealed = ref(false) // q3 + q4
let motionOff = false

function onRevealBottom(v: boolean): void {
    if (!motionOff) bottomRowRevealed.value = v
}
function onRevealTop(v: boolean): void {
    if (!motionOff) topRowRevealed.value = v
}
/** q1,q2 (indices 0,1) = top row · q3,q4 (indices 2,3) = bottom row. */
function isRevealed(i: number): boolean {
    return i < 2 ? topRowRevealed.value : bottomRowRevealed.value
}

/* ── JS geometry · the ONLY layout-JS (config, not a scroll-driver) ───────────────────────────── */
// magnifica-responsive bound (the --mag-bound geometry-token · 90rem content + gutters).
// TODO(step-2 / system-rescue · backslide §10.5): migrate this width-source to useResponsive +
// 04-dense + the canonical scale instead of the literal bound + gutter px (the magnifica drift-fix).
const BOUND_PX = 90 * 16
const GUTTER_PX = 48

function configure(): void {
    if (!stageEl.value || typeof window === 'undefined') return
    const vw = window.innerWidth
    const vh = window.innerHeight
    const avail = Math.min(vw - GUTTER_PX * 2, BOUND_PX)

    let cellH: number
    let cellW: number
    if (vw < 768) {
        // mobile · cells stack vertically, full content-width, 1:1 (always-fill · HP-spec mobile).
        // 🚩 screentest-dial: the held-sticky hold + the sweep on mobile want HP's eyes (cDia treats
        // mobile as its own round · here "all other behaviour remains" per spec — reveals do work).
        cellW = avail
        cellH = cellW / props.cellAspect
    } else {
        // desktop · start from the held height, derive the square cell, clamp to the content-bound.
        let totalH = Math.round((vh * props.heightVh) / 100)
        cellH = totalH / 2
        cellW = cellH * props.cellAspect
        if (cellW * 2 > avail) {
            cellW = avail / 2
            cellH = cellW / props.cellAspect
        }
    }
    const el = stageEl.value
    el.style.setProperty('--q-cell-w', `${Math.round(cellW)}px`)
    el.style.setProperty('--q-cell-h', `${Math.round(cellH)}px`)
    el.style.setProperty('--q-total-w', `${Math.round(cellW * 2)}px`)
    el.style.setProperty('--q-total-h', `${Math.round(cellH * 2)}px`)
}

onMounted(() => {
    motionOff =
        props.reducedMotion ||
        (typeof window !== 'undefined' &&
            window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)
    if (motionOff) {
        topRowRevealed.value = true
        bottomRowRevealed.value = true
    }
    configure()
    window.addEventListener('resize', configure, { passive: true })
})
onUnmounted(() => window.removeEventListener('resize', configure))
</script>

<style scoped>
/* the stage · a plain block in normal flow (ancestor-purity · see script) · the sticky containing
   block for the held grid. Stage height = grid + seam (so the grid pins while the seam sweeps). */
.quadrant-stage {
    position: relative;
    --q-top: var(--bb-navbar-offset, 6rem);
}

/* the held 2×2 · sticky-to-stage (never un-pins · element-anchored) · centred (the known top-left
   anchor = this centred origin). Square tracks from the JS vars; gap 0 (the cell colours + the
   moving cross define the divide · no static grid-lines · standards-floor: square, no radius). */
@media (min-width: 768px) {
    .quadrant-grid {
        position: sticky;
        top: var(--q-top);
        z-index: 1;
        width: var(--q-total-w, 80vmin);
        height: var(--q-total-h, 80vmin);
        margin-inline: auto;
        display: grid;
        grid-template-columns: var(--q-cell-w, 40vmin) var(--q-cell-w, 40vmin);
        grid-template-rows: var(--q-cell-h, 40vmin) var(--q-cell-h, 40vmin);
        gap: 0;
    }

    /* the seam sweeps UP over the pinned grid · z above the grid · pulled up to overlap the grid
       region so the cross rides over the held cells (the §50·2 "the line slides past the held
       plate"). 🚩 screentest-dial (HP · the cross-sweep timing/overlap · the §14 "wants eyes"). */
    .quadrant-stage-seam {
        position: relative;
        z-index: 2;
        margin-top: calc(-1 * var(--q-total-h, 80vmin));
    }
}

/* mobile · stack the 4 cells vertically, each full content-width 1:1; the seam stays (50vH ·
   HP-spec). No sticky hold (the stacked grid exceeds the viewport · the desktop hold is the round's
   focus · cDia-style mobile-as-its-own-round · flagged in script). Reveals still run. */
@media (max-width: 767px) {
    .quadrant-grid {
        display: grid;
        grid-template-columns: 1fr;
        grid-auto-rows: var(--q-cell-h, 90vw);
        gap: 0;
    }
}
</style>
