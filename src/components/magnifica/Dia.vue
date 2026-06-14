<template>
    <div
        class="dia"
        :class="[`dia--${lane}`, { 'dia--text': !image }]"
        :role="image ? 'img' : undefined"
        :aria-label="image ? (imageAlt ?? '') : undefined"
    >
        <!-- the over-tall cover · its own transform containing-block → the held plate inside never
             un-pins within the scene (Hero.vue:685 mechanic · backslide §20/§21). -->
        <div class="dia-cover">
            <div
                v-if="image"
                class="dia-plate"
                :style="plateStyle"
            />
            <div
                v-else
                class="dia-plate dia-plate--text"
            >
                <slot />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
/**
 * Dia — the held plate (the *Grund*) of the shadow-theater stage (DiaStage). Named for the
 * old Dia-projector slide: it sits DEAD-STILL while the Figures (text · z:2) rise *over* it and
 * the Shutter (z:3) passes. Image OR text — a text-Dia is just position-held text (what
 * background-image can never be · backslide §15: hold via `position`, not `attachment:fixed`).
 *
 * PATTERN A · the held-Dia on Hero's BEHIND-LAYER (backslide §20/§21 · HP's floor: the image
 * NEVER moves). The fault it cures: the old in-flow `position: sticky` Dia un-pinned at the
 * scene-bottom and scrolled off at content-speed (the seam scroll-off). Hero holds dead-still
 * instead — and we lift that exact mechanic, kept inside DiaStage's flat per-scene authoring:
 *
 *   `.dia`        — absolute behind-layer (z:1), spans its scene, `overflow: clip` (the window).
 *   `.dia-cover`  — OVER-TALL (200%) + `transform: translate3d` → its OWN containing block, so
 *                   it is immune to ancestor-purity (the Hero gift) AND gives the sticky plate
 *                   more travel than one scene of scroll → it never un-pins while the scene is up.
 *   `.dia-plate`  — `position: sticky; top` · the held image/text · dead-still for the whole scene,
 *                   element-anchored background (no `attachment:fixed` → iOS-safe + aspect control).
 *
 * The Figure (the prose · z:2, in normal flow) rises over it; the Shutter (z:3) masks the seam
 * where one Dia gives way to the next (HP: the swap happens behind the blade · the Dia never
 * moves in the open).
 *
 * ── NOW-RUNNING ──  the dead-still hold above (pure-CSS · the floor · cross-platform).
 * ── FUTURE-SPEC ──  (scroll-driven · flackr/scroll-timeline) the hold MAY become a literal
 *    `position: fixed` Dia-viewport whose plate cross-fades by `animation-timeline: view()` —
 *    see DiaStage's future-spec block. It ADDS on top of this floor; it does not replace it.
 */
import { computed } from 'vue'

const props = withDefaults(
    defineProps<{
        /** the plate image · element-anchored background (omit → a text-Dia, content via slot). */
        image?: string
        imageAlt?: string
        /** focal · Hero aspect-engine vocab → background-position-y (never :deep · gotcha #1). */
        imgTmpAlignY?: 'top' | 'center' | 'bottom'
        /** which stage lane the plate holds in (left/right ≈ 48% · full = both). */
        lane?: 'left' | 'right' | 'full'
    }>(),
    { imgTmpAlignY: 'center', lane: 'full' },
)

const plateStyle = computed<Record<string, string>>(() => {
    if (!props.image) return {}
    return {
        backgroundImage: `url('${props.image}')`,
        backgroundPosition: `center ${props.imgTmpAlignY}`,
    }
})
</script>

<style scoped>
/* the held plate · the lowest stage layer (z:1) · the behind-layer window. Absolute so it spans
   its scene (the Figure drives the scene height); `overflow: clip` clips the over-tall cover to
   this window (exactly Hero's `.hero` · gotcha-#6-immune because the clip is OUTSIDE the cover's
   transform containing-block, and the sticky plate lives INSIDE it). */
.dia {
    position: absolute;
    top: 0;
    bottom: 0;
    z-index: 1;
    overflow: clip;
    border-radius: 4px;
    background-color: var(--color-bg);
}

/* lanes · desktop only (which slice of the scene the plate holds in) */
@media (min-width: 768px) {
    .dia--left {
        left: 0;
        width: var(--dia-left-w, 48%);
    }
    .dia--right {
        right: 0;
        width: var(--dia-right-w, 48%);
    }
    .dia--full {
        left: 0;
        right: 0;
    }
}

/* the over-tall cover · own containing block (transform) · gives the sticky plate > one scene of
   travel so it holds dead-still throughout (the exact over-tall ratio is a :3001 dial · HP loop). */
.dia-cover {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 200%;
    transform: translate3d(0, 0, 0);
}

/* the held plate itself · pins via sticky, never via attachment:fixed (element-anchored bg). */
.dia-plate {
    position: sticky;
    top: var(--dia-top, var(--bb-navbar-offset, 6rem));
    height: var(--dia-h, 70vh);
    background-size: cover;
    background-repeat: no-repeat;
    background-color: var(--color-bg);
}

/* a text-Dia holds its slot content centered on the plate */
.dia-plate--text {
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 1.5rem;
}

/* <768 · the stage linearises: the plate is a normal-flow illustration, not the held behind-layer */
@media (max-width: 767px) {
    .dia {
        position: relative;
        width: auto;
        overflow: visible;
    }
    .dia-cover {
        position: relative;
        height: auto;
        transform: none;
    }
    .dia-plate {
        position: relative;
        top: 0;
        height: auto;
        min-height: 14rem;
    }
    .dia-plate--text {
        min-height: 0;
    }
}
</style>
