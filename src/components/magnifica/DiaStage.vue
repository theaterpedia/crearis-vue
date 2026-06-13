<template>
    <section
        ref="stageEl"
        class="dia-stage"
        :style="stageVars"
    >
        <slot />
    </section>
</template>

<script setup lang="ts">
/**
 * DiaStage — the shadow-theater stage (the page-level / main-container feature · HM 2026-06-12).
 * A held Dia (the Grund · z:1) · Figures that rise·stick·leave (z:2) · a Shutter that passes over
 * between scenes (z:3). The stage is the scroll region; its two lanes (left/right, fixed widths)
 * are where everything swims. Mounts in the body (MagnificaPageLayout content · later the core
 * PageLayout `<main class="main-content">`). NOT for the 3-col / aside layouts — the aside stays
 * OUTSIDE the stage (dasei.eu shows the shape: a left nav that does not join the theater).
 *
 * THE Z-STACK (the i5 fix — the image must never run over the shutter):
 *     z1 Dia      — the held ground (Dia.vue · element-anchored, never viewport-glued)
 *     z2 Figure   — the rising content (the prose · text-led)
 *     z3 Shutter  — the cover/blade between scenes (Shutter.vue · hero-shaped)
 *
 * ANCESTOR-PURITY (load-bearing · backslide §9.1/§12): the stage + EVERY ancestor stay plain
 * blocks — NO transform / filter / overflow(non-visible) / contain / will-change. They create a
 * containing block / scroll-context that kills `position: sticky` AND scroll-driven timelines.
 *
 * JS CONFIGURES · CSS RUNS: the only JS seat is measuring the viewport on mount/resize to write
 * the CSS vars the parts read (--dia-h · lane widths). JS never drives the scroll — the choreography
 * is the parts' pure-CSS sticky (now-running) / scroll-driven-animation (future-spec, in <style>).
 */
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = withDefaults(
    defineProps<{
        /** the held-plate / act height, as a fraction of the viewport (the Dia + Shutter height). */
        heightVh?: number
        /** the left (Dia) lane width in %; the right (Figure) lane takes the rest. */
        leftWidth?: number
    }>(),
    { heightVh: 70, leftWidth: 48 },
)

const stageEl = ref<HTMLElement>()

const stageVars = computed<Record<string, string>>(() => ({
    '--dia-left-w': `${props.leftWidth}%`,
    '--dia-right-w': `${100 - props.leftWidth}%`,
}))

/** Measure the viewport → set --dia-h (a real px, so the held plate fills the stage cleanly across
 *  sizes; the parts' `70vh` default is the no-JS fallback). This is the slidev-borrow seam (Trail
 *  §3.1): config → the parts read it. Extend here for per-item config / an IntersectionObserver
 *  active-predicate when a scene needs JS-fired enter-effects. */
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
/* the stage · a plain block in normal flow (ancestor-purity · see script). The parts self-place
   into the lanes (Dia/Figure widths) — no grid, so the Shutter is naturally full-stage-width. */
.dia-stage {
    position: relative;
    --dia-top: var(--bb-navbar-offset, 6rem);
}

/* ── FUTURE-SPEC · scroll-driven refactor (flackr/scroll-timeline polyfill) ─────────────────────
   Now-running = the parts pin via `position: sticky`. The refactor makes the transitions
   scroll-LINKED (JS-free), so the Dia truly never moves and the Shutter WIPES like a Dia-blade:

     .dia-stage      { view-timeline: --stage block; }     // or per-scene subjects, anonymous view(block)
     @keyframes shutter-wipe { from { transform: translateY(100%) } 50% { transform: none }
                               to   { transform: translateY(-100%) } }
     .shutter { animation: shutter-wipe linear both; animation-timeline: --stage;
                animation-range: cover 0% cover 100%; }     // the full overlap window
     .dia     { animation: dia-crossfade linear both; animation-timeline: --stage; }

   `view()` tracks a subject's progress through the scrollport; `scroll()` tracks a scroller's
   progress; named `view-timeline`/`scroll-timeline` decouple subject ↔ animated element. Engine
   support (2026): Chromium + Safari 26 ship unprefixed; **Firefox-stable still needs the polyfill**
   — `import 'scroll-timeline-polyfill'` (npm · a third-party republish of flackr's code), or the
   canonical `flackr.github.io/scroll-timeline/dist/scroll-timeline.js`. The polyfill ALSO parses
   this CSS (declarative authoring survives) — but cross-origin stylesheets are skipped, so keep
   the scroll-timeline CSS same-origin / inline. JS still only CONFIGURES (the vars above). ───────── */
</style>
