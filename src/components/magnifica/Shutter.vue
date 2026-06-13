<template>
    <div
        class="shutter"
        :style="shutterStyle"
        :class="{ 'shutter--separator': separator }"
    >
        <slot />
    </div>
</template>

<script setup lang="ts">
/**
 * Shutter — the cover/blade between scenes (the Dia-projector's shutter; the *black in between*).
 * Container-width (covers BOTH lanes — it breaks out of its lane via the stage), the HIGHEST z
 * in the stage z-stack (z:3): it passes OVER the held Dia + the Figures, then leaves and a new
 * Dia opens. hero.vue-shaped: a flat colour OR a full-bleed image OR a banner — and a
 * dasei.eu-style separator line that "plays the gap" (the yellow line · UI_dasei_eu_slideOver_Hero).
 *
 * ── NOW-RUNNING ──  a sticky cover (pins to hold the "black between", then releases). Pure-CSS.
 * ── FUTURE-SPEC ──  (scroll-driven · flackr/scroll-timeline polyfill) the blade WIPES — a
 *    scroll-linked transform driven by the stage's view-progress, no JS scroll:
 *      @keyframes shutter-wipe { from { transform: translateY(100%) } 50% { transform: none }
 *                                to   { transform: translateY(-100%) } }
 *      .shutter { animation: shutter-wipe linear both;
 *                 animation-timeline: view(block);          · its pass through the scrollport
 *                 animation-range: cover 0% cover 100%; }    · the full overlap window
 *    Engine support 2026: Chromium + Safari 26 ship unprefixed; Firefox stable needs the polyfill
 *    (`import 'scroll-timeline-polyfill'`, or flackr's canonical dist/scroll-timeline.js) — the
 *    polyfill parses this CSS, so authoring stays declarative. Same-origin stylesheet required.
 */
import { computed } from 'vue'

const props = withDefaults(
    defineProps<{
        /** flat blade colour (the "black between" · any theme colour or raw). Default: page bg. */
        color?: string
        /** optional full-bleed blade image (element-anchored · the hero-rented mechanics). */
        image?: string
        /** show the dasei-style separator line (the gap-player). */
        separator?: boolean
    }>(),
    { separator: false },
)

const shutterStyle = computed<Record<string, string>>(() => {
    const s: Record<string, string> = {}
    if (props.color) s.background = props.color
    if (props.image) {
        s.backgroundImage = `url('${props.image}')`
        s.backgroundSize = 'cover'
        s.backgroundPosition = 'center'
    }
    return s
})
</script>

<style scoped>
/* the blade · full experience-width (breaks out of the lane via the stage's negative-margin
   gutter var), highest stage z. Sized by the stage CSS vars. */
.shutter {
    position: sticky;
    top: var(--dia-top, var(--bb-navbar-offset, 6rem));
    height: var(--dia-h, 70vh);
    z-index: 3;
    /* break out of the lane to cover both (the stage sets --stage-gutter to the lane offset) */
    margin-inline: calc(-1 * var(--stage-gutter, 0px));
    background: var(--shutter-bg, var(--color-card-bg, #1d1b1a));
    color: var(--color-card-contrast, #f4f4f4);
    display: flex;
    flex-direction: column;
    justify-content: center;
    border-radius: 4px;
}

/* the dasei separator · a thin primary line that plays the gap (the yellow line) */
.shutter--separator::after {
    content: '';
    position: absolute;
    left: 50%;
    top: 12%;
    bottom: 12%;
    width: 2px;
    background: var(--color-primary-bg);
}

@media (max-width: 767px) {
    .shutter {
        position: relative;
        top: 0;
        height: auto;
        min-height: 12rem;
        margin-inline: 0;
    }
}
</style>
