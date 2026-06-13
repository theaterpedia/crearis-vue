<template>
    <div
        class="dia"
        :class="[`dia--${lane}`, { 'dia--text': !image }]"
        :style="diaStyle"
        :role="image ? 'img' : undefined"
        :aria-label="image ? (imageAlt ?? '') : undefined"
    >
        <slot />
    </div>
</template>

<script setup lang="ts">
/**
 * Dia — the held plate (the *Grund*) of the shadow-theater stage (DiaStage). Named for the
 * old Dia-projector slide: it sits dead-still while the Shutter (higher z) passes over it and
 * the Figures (text) rise. Image OR text — a text-Dia is just position-held text (what
 * background-image can never be · backslide §15: hold via `position`, not `attachment:fixed`).
 *
 * The plate is ELEMENT-ANCHORED (background on THIS div · `attachment:scroll`), so it moves
 * WITH its lane / pins via `position` — never the viewport-glued image that bit i5 (the image
 * ran OVER the shutter). In the stage z-stack the Dia is the LOWEST (z:1): the ground.
 *
 * ── NOW-RUNNING ──  sticky-held: pins for its act's scroll-range, then releases as the next
 *    Dia takes over (the Shutter bridges the swap). Pure-CSS.
 * ── FUTURE-SPEC ──  (scroll-driven · flackr/scroll-timeline polyfill) one `position: fixed`
 *    Dia-viewport whose plate cross-fades/wipes by scroll progress via `animation-timeline:
 *    view()` — see the DiaStage future-spec block for the exact refactor. The "never moves"
 *    becomes literal (fixed), the swap becomes a scroll-linked transition. Engine stays CSS.
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

const diaStyle = computed<Record<string, string>>(() => {
    if (!props.image) return {}
    return {
        backgroundImage: `url('${props.image}')`,
        backgroundPosition: `center ${props.imgTmpAlignY}`,
    }
})
</script>

<style scoped>
/* the held plate · element-anchored · the lowest stage layer (z:1). Sized by the stage's
   CSS vars (set once by DiaStage's JS on mount/resize · "JS configures, CSS runs"). */
.dia {
    position: sticky;
    top: var(--dia-top, var(--bb-navbar-offset, 6rem));
    height: var(--dia-h, 70vh);
    z-index: 1;
    background-size: cover;
    background-repeat: no-repeat;
    background-color: var(--color-bg);
    border-radius: 4px;
    overflow: clip; /* clip the plate's own content only — it is a leaf, not a sticky ancestor */
}

/* lanes · desktop only (the plate width within the stage) */
@media (min-width: 768px) {
    .dia--left {
        width: var(--dia-left-w, 48%);
    }
    .dia--right {
        width: var(--dia-right-w, 48%);
        margin-left: var(--dia-left-w, 52%);
    }
}

/* a text-Dia holds its slot content centered on the plate */
.dia--text {
    display: flex;
    flex-direction: column;
    justify-content: center;
}

/* <768 · the stage linearises: the plate is a normal-flow illustration, not held */
@media (max-width: 767px) {
    .dia {
        position: relative;
        top: 0;
        height: auto;
        min-height: 16rem;
    }
}
</style>
