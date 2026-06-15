<template>
    <section
        ref="stageEl"
        class="dia-stage"
        :class="[`dia-stage--${transition}`, { 'dia-stage--bounded': bounded }]"
        :style="stageVars"
    >
        <template
            v-for="(bild, i) in bilder"
            :key="bild.id ?? i"
        >
            <!-- the held Dia (the Grund · sticky-to-stage · ascending z from the transition strategy) -->
            <Dia
                class="dia-stage-plate"
                :image="bild.dia.image"
                :image-alt="bild.dia.imageAlt"
                :img-tmp-align-x="bild.dia.imgTmpAlignX"
                :img-tmp-align-y="bild.dia.imgTmpAlignY"
                :fit="bild.dia.fit"
                :lane="bild.lane ?? 'left'"
                :style="{ zIndex: plateZ(i) }"
            >
                <!-- text-Dia content (held text · the #dia-N slot · rich authoring) -->
                <slot
                    :name="`dia-${i}`"
                    :bild="bild"
                    :index="i"
                />
            </Dia>

            <!-- the Bild scroll-range + the rising Figure (the Figur · opposite Gasse · z:mid) -->
            <div class="dia-stage-bild">
                <div
                    class="dia-stage-figure"
                    :class="figureLaneClass(bild)"
                    :style="{ zIndex: figureZ(i) }"
                >
                    <!-- rich authoring via the #figure-N slot (CalloutPhrase/strong/em · /context);
                         the `figure` md-prop → HeadingParser is the editor-friendly quick path. -->
                    <slot
                        :name="`figure-${i}`"
                        :bild="bild"
                        :index="i"
                    >
                        <HeadingParser
                            v-if="bild.figure"
                            :content="bild.figure"
                            as="h2"
                            class="dia-stage-figure-head"
                        />
                    </slot>
                </div>
            </div>

            <!-- the seam Shutter masks the join INTO the next Bild (none after the last) -->
            <Shutter
                v-if="i < bilder.length - 1"
                class="dia-stage-seam"
                seam
                :transition="transition"
                :style="{ zIndex: seamZ(i) }"
            />
        </template>
    </section>
</template>

<script setup lang="ts">
/**
 * DiaStage — the shadow-theater stage · the cDia-family assembler (§34/§41 · CandA·shutter-lifts).
 * ONE component, a `transition` prop (NOT three siblings · §34.1·1). Data-driven: a `v-for` over
 * `:bilder` (the editor's target · the flat **Bild**-list · §38·1) renders, per Bild, a flat
 * interleave folding the proven /proto shutter-lift mechanism into the family —
 *     held Dia (z-low · ascending)  ·  scroll-range + rising Figure (z-mid)  ·  seam Shutter (z-high)
 * The **Scene** (a 3–5-Bild chain) + `chapterStart` flag are the 2.5-level (§39) ABOVE this — NOT
 * built here; the flat list stays additively-groupable. Core-grade (cDia · §41·1) · view-agnostic
 * (§37 one-primitive/three-views). NOT for the 3-col / aside layouts — the aside stays OUTSIDE the
 * stage (dasei.eu shows the shape · a left nav, the Gasse, that does not join the theater).
 *
 * THE TRANSITION (§34.4) drives TWO things, both from the prop:
 *   · the seam-CSS module — owned by Shutter.vue (shutter-lift overlap+view()-lift · rise-over
 *     passive · wipe later by ②·CandB).
 *   · the z-strategy — shutter-lift/wipe: plates ascending, Figures above, Shutters HELD ABOVE;
 *     rise-over: ALL layers ascending (the next plate rises over the seam). Assigned per-layer
 *     inline, below (the one non-trivial branch · §32/§33·a).
 *
 * THE HOLD = sticky-to-stage + `--dia-h` (§34.3 · the over-tall transform-cover is dropped). Relies
 * on ANCESTOR-PURITY (load-bearing · backslide §9.1/§12): the stage + EVERY ancestor stay plain
 * blocks — NO transform / filter / overflow(non-visible) / contain / will-change (they create a
 * containing block / scroll-context that kills `position: sticky` AND scroll-driven timelines).
 *
 * JS CONFIGURES · CSS RUNS (§34.3 · CandA's value): the ONLY JS is the mount/resize measure-hook
 * writing `--dia-h` (px · responsive) — config, never a scroll-driver (no scroll-listener / IO /
 * per-frame). The choreography is the parts' pure-CSS sticky + z + the `view()` lift. A CSS `vh`
 * fallback keeps it working JS-off / pre-hydrate.
 *
 * Figure authoring = slot + md-fallback (§34.6): per-Bild scoped slots `#figure-N` (rich) / `#dia-N`
 * (text-Dia), with `bild.figure` md → HeadingParser the quick path. The stage choreography is
 * SCOPED; slot-content renders in the CONSUMER scope (no `:deep()` needed); focal stays a prop (#1).
 *
 * ── SIGNED (load-bearing · §41·1 · HP-screentested roughly-green 2026-06-14) ──
 *   BLENDE · code — gate-checked: hold dead-still · seam-mask · ancestor-purity · standards-floor · gap-test 🌒
 *   SCHWELLE · epistemology — the gap held: Scene>Bild (§39 2.5-level) · the-hold · Figur-Grund made to move
 */
import { ref, computed, onMounted, onUnmounted } from 'vue'
import Dia from './Dia.vue'
import Shutter from './Shutter.vue'
import HeadingParser from '@/components/HeadingParser.vue'
import type { DiaBildSpec } from './types'

const props = withDefaults(
    defineProps<{
        /** the ordered Bild-list (the editor's v-for target · the flat beat-list · §38·1). */
        bilder: DiaBildSpec[]
        /** the seam mechanic + z-strategy (§34.4) · default the reference motion (§35). */
        transition?: 'shutter-lift' | 'rise-over' | 'wipe'
        /** bound the stage to the 90rem column on wide viewports (the --mag-bound/96rem gate). */
        bounded?: boolean
        /** the held-plate height as a fraction of the viewport (the Dia + Shutter height · proto 82). */
        heightVh?: number
        /** the held-Dia Gasse width in %; the Figure Gasse takes the rest. */
        leftWidth?: number
    }>(),
    { transition: 'shutter-lift', bounded: false, heightVh: 82, leftWidth: 48 },
)

const stageEl = ref<HTMLElement>()

const stageVars = computed<Record<string, string>>(() => ({
    '--dia-left-w': `${props.leftWidth}%`,
    '--dia-right-w': `${100 - props.leftWidth}%`,
    '--dia-right-off': `${props.leftWidth + 4}%`,
}))

/* the z-strategy · transition-keyed (§34.4). shutter-lift/wipe: plates ascending (the reveal order)
   · Figures above all plates · Shutters held high (they pass over). rise-over: ALL ascending so the
   next plate rises over the prior seam (§27 · the rise-over instance ③ refines its exact tuning). */
function plateZ(i: number): number {
    return props.transition === 'rise-over' ? (i + 1) * 10 : 1 + i
}
function figureZ(i: number): number {
    return props.transition === 'rise-over' ? (i + 1) * 10 + 1 : 1000
}
function seamZ(i: number): number {
    return props.transition === 'rise-over' ? (i + 1) * 10 + 2 : 2000 + i
}

/** the Figure rises in the Gasse OPPOSITE the held Dia (Dia left → Figure right · the default). */
function figureLaneClass(bild: DiaBildSpec): string {
    return bild.lane === 'right' ? 'dia-stage-figure--left' : 'dia-stage-figure--right'
}

/** Measure the viewport → set `--dia-h` in px (the held plate fills the stage cleanly across sizes;
 *  the CSS `82vh` default is the no-JS fallback). The ONLY JS — config, never a scroll-driver. */
function configure(): void {
    if (!stageEl.value) return
    const h = Math.round((window.innerHeight * props.heightVh) / 100)
    stageEl.value.style.setProperty('--dia-h', `${h}px`)
}

onMounted(() => {
    configure()
    window.addEventListener('resize', configure, { passive: true })
})
onUnmounted(() => window.removeEventListener('resize', configure))
</script>

<style scoped>
/* the stage · a plain block in normal flow (ancestor-purity · see script) · the sticky containing
   block, so a held Dia pins to the STAGE and never un-pins. The parts self-place into the Gassen. */
.dia-stage {
    position: relative;
    --dia-top: var(--bb-navbar-offset, 6rem);
}

/* bounded · align the stage to the 90rem column on wide viewports (the --mag-bound/96rem gate ·
   shared geometry-token with Hero/CardsCanvas/BackSlide · max-width self-activates above the bound). */
.dia-stage--bounded {
    max-width: var(--mag-bound, 90rem);
    margin-inline: auto;
}

@media (min-width: 768px) {
    /* the Bild · the scroll-RANGE the held plate holds across + where the Figure rises. Uniform
       length (incl. clean/text Bilder) so a seam never comes early (the proto 3rd-shutter fix). */
    .dia-stage-bild {
        position: relative;
        min-height: var(--dia-bild-h, 120vh);
    }

    /* the rising Figure · sticky in its Gasse, opaque (gotcha #5), lifts off the held plate via an
       OKLCH shadow (not rgba · standards-floor §34.7). z assigned inline (transition-keyed). */
    .dia-stage-figure {
        position: sticky;
        top: calc(var(--dia-top) + 3rem);
        /* the lane WIDTH (--dia-left-w · 48%), NOT the right-region (--dia-right-w · 52%): with a
           52% margin-left, a 52% width = 104% → the ~4% overflow past the page's right margin (the
           right lane stuck out · HP 2026-06-14). 48% + 52% offset = 100% → ends at the content-right,
           symmetric with the left lane's respect for the standard page margin. */
        width: var(--dia-left-w, 48%);
        background: var(--color-bg);
        padding: 1.25rem 1.5rem;
        box-shadow: 0 12px 32px oklch(0 0 0 / 0.3);
    }
    .dia-stage-figure--right {
        margin-left: var(--dia-right-off, 52%);
    }
    .dia-stage-figure--left {
        margin-right: var(--dia-right-off, 52%);
    }
}

.dia-stage-figure-head {
    margin: 0 0 0.75rem;
}

/* <768 · the stage currently linearises to plain stacked blocks (the Dia/Shutter components carry
   their own mobile reset · here the Figure goes full-width below its plate).
   🚩 HP-correction 2026-06-14: mobile having NO scroll-effect is a GAP, NOT by design — to be
   worked on in a dedicated round. The target: the SAME choreography (hold · sticky · seam-lift)
   runs on mobile too — NO separate mobile logic — only the PLACEMENT of Dia + Figure on screen
   adapts (they share the viewport instead of side-by-side Gassen). This linearize-reset is the
   accident; it stays for now (this round is desktop-only · "no mobile") and is the next round's. */
@media (max-width: 767px) {
    .dia-stage-figure {
        margin: 1.25rem 0 0;
        width: auto;
    }
}

/* ── FUTURE-SPEC · scroll-driven refactor (flackr/scroll-timeline polyfill) ─────────────────────
   Now-running = the parts pin via `position: sticky` + the Shutter's `view()` lift (Chromium +
   Safari 26). The deeper refactor makes the held Dia itself a scroll-linked cross-fade and the
   `wipe` transition a reversible blade:
     .dia-stage  { view-timeline: --stage block; }       // or per-Bild anonymous view(block)
     .dia-stage-seam[wipe] { animation: shutter-wipe linear both; animation-timeline: --stage;
                             animation-range: cover 0% cover 100%; }   // reversible both-ways (②)
   Engine support 2026: Chromium + Safari 26 ship unprefixed; Firefox-stable needs the polyfill
   (`import 'scroll-timeline-polyfill'`, or flackr's canonical dist/scroll-timeline.js · it parses
   this CSS so authoring stays declarative · keep the scroll-timeline CSS same-origin). JS still
   only CONFIGURES (--dia-h above) · never drives the scroll. ─────────────────────────────────── */
</style>
