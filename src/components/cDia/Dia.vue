<template>
    <div
        class="dia"
        :class="[`dia--${lane}`, { 'dia--text': !image }]"
        :role="image ? 'img' : undefined"
        :aria-label="image ? (imageAlt ?? '') : undefined"
        :style="diaStyle"
    >
        <!-- a text-Dia holds its slot content (position-held text · what background-image can never
             be · §15: hold via `position`, not `attachment:fixed`). Image-Dias paint via diaStyle. -->
        <slot v-if="!image" />
    </div>
</template>

<script setup lang="ts">
/**
 * Dia — the held plate (the *Grund*) of the shadow-theater stage (DiaStage). Named for the old
 * Dia-projector slide: DEAD-STILL while the Figures (z:mid) rise *over* it and the Shutter (z:high)
 * passes. Image OR text — a text-Dia is just position-held text (§15).
 *
 * §34.3 — THE HOLD = sticky-to-stage + `--dia-h` (the converged hold · backslide §32.1). The Dia is
 * a SINGLE element that `position: sticky`-pins to the stage and never un-pins (element-anchored ·
 * no `attachment:fixed` · iOS-safe). **Hero's over-tall transform-cover is DROPPED** (§34.3): it
 * only ever protected a per-scene un-pin this sticky-to-stage model never has, and a `transform`
 * ancestor would itself break sticky (gotcha #6). The hold now relies on **ancestor-purity** — the
 * stage + the magnifica shell stay plain blocks (audited on mount).
 *
 * The STAGE assigns the z-index per scene (ascending · the reveal order) inline, from the
 * `transition` strategy (§34.4); the Dia owns only its hold + lane + focal.
 *
 * ── NOW-RUNNING ──  the pure-CSS sticky hold above (the floor · cross-platform).
 * ── FUTURE-SPEC ──  (scroll-driven · flackr/scroll-timeline) the held plate MAY cross-fade by
 *    `animation-timeline: view()` — see DiaStage's future-spec block. It ADDS on the floor.
 *
 * Focal = `imgTmpAlignX/Y` → inline `background-position` (Hero's aspect-engine vocab) — **via the
 * prop, NEVER `:deep()`** (gotcha #1: inline focal outranks any scoped selector).
 */
import { computed } from 'vue'

const props = withDefaults(
    defineProps<{
        /** the plate image · element-anchored background (omit → a text-Dia, content via slot). */
        image?: string
        imageAlt?: string
        /** focal · Hero aspect-engine vocab → background-position (never :deep · gotcha #1). */
        imgTmpAlignX?: 'left' | 'center' | 'right'
        imgTmpAlignY?: 'top' | 'center' | 'bottom'
        /** which stage lane the plate holds in (left/right ≈ 48% · full = both). */
        lane?: 'left' | 'right' | 'full'
    }>(),
    { imgTmpAlignX: 'center', imgTmpAlignY: 'center', lane: 'full' },
)

const diaStyle = computed<Record<string, string>>(() => {
    if (!props.image) return {}
    return {
        backgroundImage: `url('${props.image}')`,
        backgroundPosition: `${props.imgTmpAlignX} ${props.imgTmpAlignY}`,
    }
})
</script>

<style scoped>
/* the held plate · sticky-to-stage + `--dia-h` (§34.3 · the converged hold · NO over-tall cover).
   Dead-still, element-anchored (no `attachment:fixed`). Square — theme-7 register, no border-radius
   (§34.7). Opaque bg so a held plate never reads-through (gotcha #5). */
.dia {
    position: sticky;
    top: var(--dia-top, var(--bb-navbar-offset, 6rem));
    height: var(--dia-h, 82vh);
    background-size: cover;
    background-repeat: no-repeat;
    background-color: var(--color-bg);
}

/* lanes · desktop only (which slice of the stage the plate holds in) */
@media (min-width: 768px) {
    .dia--left {
        width: var(--dia-left-w, 48%);
        margin-right: auto;
    }
    .dia--right {
        width: var(--dia-right-w, 48%);
        margin-left: auto;
    }
    .dia--full {
        width: 100%;
    }
}

/* a text-Dia holds its slot content centered on the plate */
.dia--text {
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 1.5rem;
}

/* <768 · the stage linearises: the plate is a normal-flow illustration, not the held behind-layer */
@media (max-width: 767px) {
    .dia {
        position: relative;
        top: 0;
        width: auto;
        height: auto;
        min-height: 14rem;
    }
    .dia--text {
        min-height: 0;
    }
}
</style>
