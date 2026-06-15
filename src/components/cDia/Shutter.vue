<template>
    <div
        class="shutter"
        :class="[`shutter--${transition}`, { 'shutter--seam': seam, 'shutter--separator': separator }]"
        :style="shutterStyle"
    >
        <slot />
    </div>
</template>

<script setup lang="ts">
/**
 * Shutter — the seam-blade between scenes (the Dia-projector's shutter · the *black between* ·
 * "Blende" in the whitepaper-etymology). Container-width (covers BOTH lanes), assigned the HIGHEST
 * z by the stage for `shutter-lift`/`wipe` (it passes OVER the held Dias + Figures). hero-shaped:
 * a flat colour OR a full-bleed image, with the dasei-style separator line that plays the gap
 * (the yellow line · UI_dasei_eu_slideOver_Hero).
 *
 * §34.4 — the `transition` (passed from the stage) drives this blade's seam-CSS:
 *  · `shutter-lift` (DEFAULT) — a `seam` shutter OVERLAPS the next plate (`margin-bottom:-1·--dia-h`
 *    · so the next Dia pins BEHIND it · no early peek) then `animation-timeline: view()` LIFTS it off
 *    the top to uncover the held next plate. Zero-JS-in-loop · `@supports`-guarded + a scroll-away
 *    fallback (Firefox-stable · degraded, never broken). The proven /proto mechanism, folded in.
 *  · `rise-over` — the blade is PASSIVE (a sticky plate the next Dia rises over · ascending-z · §27);
 *    no overlap, no lift.
 *  · `wipe` — (②·CandB) the scroll-driven reversible blade (added later).
 *
 * The STAGE assigns the z-index inline (the z-strategy is `transition`-keyed · §34.4); this blade
 * owns only its cover + the seam choreography.
 *
 * ── NOW-RUNNING ──  sticky cover + the `view()` lift (Chromium + Safari 26 · pure-CSS).
 * ── FUTURE-SPEC ──  the `wipe` value adds a reversible scroll-linked blade (flackr/scroll-timeline
 *    polyfill for Firefox-stable · `import 'scroll-timeline-polyfill'` or the canonical dist · the
 *    polyfill parses this CSS, so authoring stays declarative · same-origin stylesheet required).
 */
import { computed } from 'vue'

const props = withDefaults(
    defineProps<{
        /** flat blade colour (the "black between" · any theme colour or raw). Default: card bg. */
        color?: string
        /** optional full-bleed blade image (element-anchored · the hero-rented mechanics). */
        image?: string
        /** show the dasei-style separator line (the gap-player). */
        separator?: boolean
        /** a between-scenes seam (gets the overlap + lift for `shutter-lift`). vs a plain cover. */
        seam?: boolean
        /** the stage transition · drives the seam-CSS (§34.4). */
        transition?: 'shutter-lift' | 'rise-over' | 'wipe'
        /** blade height in vh · a BRIEF seam-blade vs the full plate. Omit → the stage's --dia-h. */
        heightVh?: number
    }>(),
    { separator: false, seam: false, transition: 'shutter-lift' },
)

const shutterStyle = computed<Record<string, string>>(() => {
    const s: Record<string, string> = {}
    if (props.color) s.background = props.color
    if (props.image) {
        s.backgroundImage = `url('${props.image}')`
        s.backgroundSize = 'cover'
        s.backgroundPosition = 'center'
    }
    if (props.heightVh) s['--shutter-h'] = `${props.heightVh}vh`
    return s
})
</script>

<style scoped>
/* the blade · full experience-width (breaks out of the lane via the stage's negative-margin gutter
   var), sized by the stage CSS vars. Square — theme-7 register, no border-radius (§34.7). z-index
   is assigned by the stage inline (the transition-keyed z-strategy · §34.4). */
.shutter {
    position: sticky;
    top: var(--dia-top, var(--bb-navbar-offset, 6rem));
    height: var(--shutter-h, var(--dia-h, 82vh));
    min-height: var(--shutter-h, var(--dia-h, 82vh));
    /* break out of the lane to cover both (the stage sets --stage-gutter to the lane offset) */
    margin-inline: calc(-1 * var(--stage-gutter, 0px));
    background: var(--shutter-bg, var(--color-card-bg, #1d1b1a));
    color: var(--color-card-contrast, #f4f4f4);
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 1.5rem clamp(1.25rem, 4vw, 3rem);
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

@media (min-width: 768px) {
    /* shutter-lift (default) · a seam OVERLAPS the next plate so it pins behind (no early peek),
       then the view()-driven lift uncovers the held next plate (the proven /proto mechanism). */
    .shutter--seam.shutter--shutter-lift {
        width: 100%;
        margin-bottom: calc(-1 * var(--dia-h, 82vh));
    }
    @supports (animation-timeline: view()) {
        .shutter--seam.shutter--shutter-lift {
            animation: shutter-lift linear both;
            animation-timeline: view(block);
            /* lift completes by the time the next plate pins · keyed to the blade's OWN view-pass +
               the uniform --dia-h → drift-free across scroll-speed + Figure-length (the §24-B trap
               avoided by keying to layout, not a guessed scroll-%). */
            animation-range: cover 0% cover 50%;
        }
        @keyframes shutter-lift {
            from { transform: translateY(0); }
            to { transform: translateY(-110%); }
        }
    }
    /* fallback (no scroll-driven · Firefox-stable) · the seam scrolls away in flow, still revealing
       the held plate — degraded (no double-speed lift), never broken. */
    @supports not (animation-timeline: view()) {
        .shutter--seam.shutter--shutter-lift {
            position: relative;
            top: auto;
        }
    }

    /* rise-over · the blade is a passive full-width sticky plate the next Dia rises over (no overlap,
       no lift · the ascending-z positional path · §27 · the rise-over instance ③ refines it). */
    .shutter--seam.shutter--rise-over {
        width: 100%;
    }
}

@media (max-width: 767px) {
    .shutter {
        position: relative;
        top: 0;
        height: auto;
        min-height: 12rem;
        margin-inline: 0;
        margin-bottom: 0 !important;
    }
}

/* reduced-motion (§41·3) · a user-setting, not a device. The lift drops to a STATIC reveal: kill
   the animation AND neutralise the overlap (position:relative · margin-bottom:0) so the seam scrolls
   away in flow and the held plate is revealed — NOT `animation:none` alone, which would strand the
   next plate behind the still-overlapping seam (no lift to uncover it). Same shape as the no-view()
   fallback above. */
@media (prefers-reduced-motion: reduce) {
    .shutter--seam.shutter--shutter-lift {
        animation: none !important;
        position: relative;
        top: auto;
        margin-bottom: 0;
    }
}
</style>
