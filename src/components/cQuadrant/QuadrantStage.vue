<template>
    <section
        ref="stageEl"
        class="quadrant-stage"
        :class="{ 'quadrant-stage--bounded': bounded, 'quadrant-stage--ink-dark': !textInverted }"
    >
        <!-- the FIXED grid · sticky-to-stage (pins · "does not scroll" · HP-A1) · the 2×2 (q1 q2 /
             q3 q4 · top-left anchor known). Backgrounds always painted; CONTENT toggled visible per
             row WHILE the opaque shutter covers that half (revealed as the curtain lifts). -->
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
                :postit-size="q.postitSize ?? postitSize"
                :revealed="isRevealed(i)"
            >
                <slot :name="`q-${i + 1}`" :quadrant="q" :index="i" />
            </Quadrant>
        </div>

        <!-- the OPAQUE shutter · scrolls UP over the fixed grid (z above it), masking it. The stage
             watches THIS element cross the grid's half-lines → toggles the row behind it. -->
        <div ref="seamWrapEl" class="quadrant-stage-seam">
            <QuadrantSeam
                :bg="seamBg"
                :height="seamHeight"
                :v-size="seamVSize"
                :h-size="seamHSize"
                :line-color="seamLineColor"
                :preset="seamPreset"
                :text="activeSeamText"
            />
        </div>

        <!-- the BRUSH · invisible release-trigger, 150vH below the shutter (50vH shutter + a full
             free viewport) · its arrival releases the grid + lets the honest-flag board wipe (A3). -->
        <QuadrantBrush class="quadrant-stage-brush" :visible="debugBrush" @arrive="onBrushArrive" />
    </section>
</template>

<script setup lang="ts">
/**
 * QuadrantStage — the cQuadrant assembler (between CardsCanvas + cDia). The 2×2 grid FIXES (sticky)
 * when fully in view and holds still; the OPAQUE shutter scrolls up across it (HP-recalibration
 * 2026-06-16 · A1). As the shutter covers the LOWER half it toggles q3+q4 visible (behind the
 * curtain), as it covers the UPPER half it toggles q1+q2 — so finished content is revealed as the
 * curtain lifts (no pop-in). Then the (invisible) brush arrives 150vH below and the grid releases.
 *
 * JS CONFIGURES the geometry (the only layout-JS · A4): on mount/resize it sets the held height to
 * the viewport MINUS px top/bottom offset-corrections (a fixed top-nav and/or footer), the square-ish
 * cells (each a half-row), and the shutter height = a half (so it covers exactly a half · below 50vH
 * once corrected). The REVEAL = two BOUNDED line-region IntersectionObservers watching the shutter
 * cross the fixed grid's mid/top lines (the sanctioned JS · not a per-frame scroll-driver).
 *
 * ── ANCESTOR-PURITY (load-bearing · backslide §9.1) ── the stage + EVERY ancestor stay plain blocks
 * (no transform/filter/overflow-non-visible/contain/will-change) or the sticky pin dies.
 */
import { ref, computed, onMounted, onUnmounted } from 'vue'
import Quadrant from './Quadrant.vue'
import QuadrantSeam from './QuadrantSeam.vue'
import QuadrantBrush from './QuadrantBrush.vue'
import type { QuadrantSpec, LineSize, ShutterHeightSize, PostitSize } from './types'

const props = withDefaults(
    defineProps<{
        /** the 4 cells · q1,q2 (top row) · q3,q4 (bottom row). >4 ignored; <4 padded by CSS. */
        quadrants: QuadrantSpec[]
        /** bound the held grid to the 90rem column on wide viewports (the --mag-bound/96rem gate). */
        bounded?: boolean
        /** px offset-correction off the TOP (a fixed top-nav) · the held grid + shutter shrink by it (A4). */
        topOffset?: number
        /** px offset-correction off the BOTTOM (a footer) · the held grid + shutter shrink by it (A4). */
        bottomOffset?: number
        /** the opaque curtain colour-token + cross arms/colour (forwarded to the shutter). */
        seamBg?: string
        seamHeight?: ShutterHeightSize
        /** the cross arms · default the VERTICAL line only (change 2). */
        seamVSize?: LineSize
        seamHSize?: LineSize
        seamLineColor?: string
        /** the shutter text-preset (`split` = "left | right" around the line) + the text:
         *  TWO items [lower-row, upper-row] → the active item switches when the shutter crosses into
         *  the viewport's UPPER half. ONE item → no switch · it shows in BOTH phases (HP · change 3). */
        seamPreset?: 'split' | 'spearhead'
        seamText?: string[]
        /** text-inverted toggle (change 1 · HP 2026-06-17). true (default) = the inverted/contrast ink
         *  (the current magnifica look · light on the dark shell); false = near-black ink for a light
         *  context (e.g. the ethnography quadrant). Governs the base/non-themed text + the shutter;
         *  themed cells keep their token-contrast. */
        textInverted?: boolean
        /** the sub-element (post-it) size default · small | medium | large (change 2). Per-cell
         *  `QuadrantSpec.postitSize` overrides this. */
        postitSize?: PostitSize
        /** show the (normally invisible) brush · debugging the release point on the screentest. */
        debugBrush?: boolean
        /** opt the reveal OFF → everything visible immediately (also forced by OS reduced-motion). */
        reducedMotion?: boolean
    }>(),
    {
        bounded: false,
        topOffset: 96, // ≈ --bb-navbar-offset (6rem) · the magnifica sticky header
        bottomOffset: 0,
        seamBg: 'bg',
        seamHeight: 'full',
        seamVSize: 'full',
        seamHSize: 'none', // default = the vertical line only (change 2)
        seamLineColor: 'primary',
        seamPreset: 'spearhead',
        textInverted: true,
        postitSize: 'small',
        debugBrush: false,
        reducedMotion: false,
    },
)

const stageEl = ref<HTMLElement>()
const seamWrapEl = ref<HTMLElement>()
const cells = computed(() => props.quadrants.slice(0, 4))

/* ── reveal state · per row · toggled WHILE the opaque shutter covers that half (A1) ───────────── */
const topRowRevealed = ref(false) // q1 + q2 (upper half)
const bottomRowRevealed = ref(false) // q3 + q4 (lower half)
// split-text active item · 0 = lower-row labels · 1 = upper-row labels · switches when the shutter
// crosses into the viewport's UPPER half (change 3).
const activeSeamIndex = ref(0)
// A single-item seamText configures NO switch → show it in BOTH phases (fall back to [0] when the
// active index has no entry · HP 2026-06-17). Two items → the switch picks [0]/[1] per half.
const activeSeamText = computed(() => props.seamText?.[activeSeamIndex.value] ?? props.seamText?.[0])
let motionOff = false

/** q1,q2 (0,1) = top row · q3,q4 (2,3) = bottom row. */
function isRevealed(i: number): boolean {
    return i < 2 ? topRowRevealed.value : bottomRowRevealed.value
}
function onBrushArrive(_arrived: boolean): void {
    // The sticky grid releases positionally (stage-end ≈ the brush) — the wipe is layout-driven.
    // Hook kept for any future JS on the release (e.g. pausing the reveal); intentionally a no-op now.
}

/* ── JS geometry · the ONLY layout-JS (config, not a scroll-driver) ───────────────────────────── */
// magnifica-responsive bound (the --mag-bound geometry-token · 90rem content + gutters).
// TODO(step-2 / system-rescue · backslide §10.5): migrate the width-source to useResponsive +
// 04-dense + the canonical scale instead of the literal bound + gutter px (the magnifica drift-fix).
const BOUND_PX = 90 * 16
const GUTTER_PX = 48

let observers: IntersectionObserver[] = []

function configure(): void {
    if (!stageEl.value || typeof window === 'undefined') return
    const vw = window.innerWidth
    const vh = window.innerHeight
    // The grid must equal the page's content column (.landing-container: max-width 90rem
    // MINUS 2×3rem inline-padding). Subtract the gutter CONSISTENTLY — incl. at the bound-cap —
    // else on wide (≥1536) the grid stays the full 90rem while the column is 90rem−gutters (was
    // `min(vw − 2·gutter, BOUND)`, which dropped the gutter once capped → ~6rem too wide · HM).
    const avail = Math.min(vw, BOUND_PX) - GUTTER_PX * 2

    // the held grid fills the viewport MINUS the offset-corrections (A4); each cell = a half-row;
    // the shutter = a half so it covers exactly a half (below 50vH once corrected).
    const H = Math.max(0, vh - props.topOffset - props.bottomOffset)
    const cellH = H / 2
    const cellW = vw < 768 ? avail : avail / 2 // mobile: full-width stacked cells (the seam stays · A4)

    const el = stageEl.value
    el.style.setProperty('--q-top', `${props.topOffset}px`)
    el.style.setProperty('--q-cell-w', `${Math.round(cellW)}px`)
    el.style.setProperty('--q-cell-h', `${Math.round(cellH)}px`)
    el.style.setProperty('--q-total-w', `${Math.round(cellW * 2)}px`)
    el.style.setProperty('--q-total-h', `${Math.round(H)}px`)
    el.style.setProperty('--q-shutter-h', `${Math.round(cellH)}px`) // a half · = a cell-row
}

/** Two line-region observers watch the opaque shutter cross the FIXED grid's half-lines. The root is
 *  extended far UP (so a row stays revealed after the shutter exits the top) and shrunk at the bottom
 *  to the threshold line: intersecting ⇔ the shutter's top has risen to/above that line. */
function setupObservers(): void {
    observers.forEach((o) => o.disconnect())
    observers = []
    const mobile = typeof window !== 'undefined' && window.innerWidth < 768
    // Mobile has no held-grid sweep yet (the desktop hold is this round's focus; the true mobile hold
    // is its own round · flagged in 2026-06_quadrant.md §10). Without the hold the curtain can't
    // coordinate a row-reveal, and "hidden-until-swept" would be a content TRAP → REVEAL EVERYTHING on
    // mobile (the no-trap floor · also covers reduced-motion + no-IO). Re-evaluated on resize.
    if (motionOff || mobile || typeof window === 'undefined' || !('IntersectionObserver' in window)) {
        topRowRevealed.value = true
        bottomRowRevealed.value = true
        return
    }
    // desktop · the sweep drives the reveal (start hidden · the curtain lifts each row)
    topRowRevealed.value = false
    bottomRowRevealed.value = false
    const wrap = seamWrapEl.value
    if (!wrap) {
        topRowRevealed.value = true
        bottomRowRevealed.value = true
        return
    }
    const vh = window.innerHeight
    const quadrantTop = props.topOffset
    const quadrantMid = props.topOffset + (vh - props.topOffset - props.bottomOffset) / 2

    // LOWER-half line (= grid mid) → q3+q4 ; UPPER-half line (= grid top) → q1+q2.
    const make = (lineY: number, set: (v: boolean) => void): IntersectionObserver => {
        const o = new IntersectionObserver(
            (entries) => entries.forEach((e) => set(e.isIntersecting)),
            { rootMargin: `100000px 0px ${-(vh - lineY)}px 0px`, threshold: 0 },
        )
        o.observe(wrap)
        return o
    }
    observers.push(make(quadrantMid, (v) => (bottomRowRevealed.value = v)))
    observers.push(make(quadrantTop, (v) => (topRowRevealed.value = v)))

    // split-text · switch the active item when the shutter crosses the viewport MID-line (change 3).
    // Only when TWO items are configured — a single item shows in both phases (no switch · HP).
    if (props.seamPreset === 'split' && (props.seamText?.length ?? 0) > 1) {
        observers.push(make(vh / 2, (v) => (activeSeamIndex.value = v ? 1 : 0)))
    }
}

onMounted(() => {
    motionOff =
        props.reducedMotion ||
        (typeof window !== 'undefined' &&
            window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches === true)
    configure()
    setupObservers() // owns the reveal state (desktop-sweep · or reveal-all on mobile/reduced/no-IO)
    window.addEventListener('resize', onResize, { passive: true })
})
function onResize(): void {
    configure()
    setupObservers() // mid/top lines moved → rebuild the line-region roots
}
onUnmounted(() => {
    window.removeEventListener('resize', onResize)
    observers.forEach((o) => o.disconnect())
})
</script>

<style scoped>
/* the stage · a plain block in normal flow (ancestor-purity · see script) · the sticky containing
   block for the held grid. Its height (grid + shutter + the 100vH brush-gap) keeps the grid pinned
   through the shutter sweep, then releases it ≈ when the brush arrives. */
.quadrant-stage {
    position: relative;
    --q-top: var(--bb-navbar-offset, 6rem);
    /* text-inverted toggle (change 1) · default true = the contrast ink (current · light on the dark
       magnifica shell). Inherited by the cells + the shutter; themed cells override with their token. */
    --q-ink: var(--color-contrast);
}
/* text-inverted=false · near-black ink for a light context (e.g. the ethnography quadrant). */
.quadrant-stage--ink-dark {
    --q-ink: var(--color-black, oklch(0% 0 0));
}

@media (min-width: 768px) {
    /* the held 2×2 · sticky-to-stage (the "fixed" hold · never un-pins until release) · centred
       (the known top-left = this centred origin). Square-ish tracks from the JS vars; gap 0 (the
       cell colours + the moving cross define the divide · standards-floor: square, no radius). */
    .quadrant-grid {
        position: sticky;
        top: var(--q-top);
        z-index: 1;
        width: var(--q-total-w, 80vmin);
        height: var(--q-total-h, 90vh);
        margin-inline: auto;
        display: grid;
        grid-template-columns: var(--q-cell-w, 40vmin) var(--q-cell-w, 40vmin);
        grid-template-rows: var(--q-cell-h, 45vh) var(--q-cell-h, 45vh);
        gap: 0;
    }

    /* the opaque curtain · z ABOVE the pinned grid · centred to the grid width · in normal flow so
       it SWEEPS up over the held grid (the rise-over: a later sibling rises over the pinned earlier).
       🚩 screentest-dial (HP · the "wait" gap before it enters + the sweep feel · §14 "wants eyes"). */
    .quadrant-stage-seam {
        position: relative;
        z-index: 2;
        width: var(--q-total-w, 80vmin);
        margin-inline: auto;
    }
}

/* the brush · 150vH below the shutter = a full free viewport (100vH) after the 50vH shutter (A3) ·
   so the held grid shows alone for a viewport, then the brush arrives + the grid releases. */
.quadrant-stage-brush {
    margin-top: 100vh;
}

/* mobile · stack the 4 cells vertically, each full content-width; the seam stays (HP-spec). No
   sticky hold (the stacked grid exceeds the viewport · the desktop hold is this round's focus ·
   cDia-style mobile-as-its-own-round · flagged). The reveal observers still run. */
@media (max-width: 767px) {
    .quadrant-grid {
        display: grid;
        grid-template-columns: 1fr;
        grid-auto-rows: var(--q-cell-h, 90vw);
        gap: 0;
    }
    .quadrant-stage-brush {
        margin-top: 50vh;
    }
}
</style>
