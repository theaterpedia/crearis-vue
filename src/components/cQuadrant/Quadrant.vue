<template>
    <div
        class="quadrant"
        :class="[themeClass, { 'quadrant--revealed': revealed }]"
        :style="bgStyle"
        :role="image ? 'img' : undefined"
        :aria-label="image ? (imageAlt ?? '') : undefined"
    >
        <!-- the CONTENT layer · heading + the in-place sub-element. Placed on its real position on
             load but visibility-gated (HP-A3) — `visibility:hidden` RESERVES the layout (the "real
             position"), the reveal flips it visible. q1 (image-only · no content) renders nothing. -->
        <div
            v-if="hasContent"
            class="quadrant-content"
            :class="`quadrant-content--${headingSide}`"
        >
            <HeadingParser
                v-if="heading"
                :content="heading"
                :as="headingAs"
                class="quadrant-heading"
            />
            <!-- the sub-element (one now · a list later · HP-spec). Faked card-code today; a real
                 fpostit (discourse/context/ethnography) is the fast-follow (thread §4 · A2). -->
            <div v-if="$slots.default" class="quadrant-sub">
                <slot />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
/**
 * Quadrant — one cell of the held 2×2 grid (q1/q2 top · q3/q4 bottom). The BACKGROUND (image +/or
 * theme-colour) is ALWAYS painted; the CONTENT (heading + in-place sub-element) is reveal-gated by
 * the stage's scroll-driven `:revealed`. The image always FILLS the cell (`cover` · cut-off · the
 * mobile 1:1 always-fill intent · HP-spec). Focal via the prop, NEVER :deep (cDia gotcha #1).
 *
 * Heading = crearis-md → HeadingParser (the blackboard heading-style · left|right · the §53 gene).
 * Standards-floor: var(--color-*) · square · OKLCH (backslide §30.3).
 */
import { computed, useSlots } from 'vue'
import HeadingParser from '@/components/HeadingParser.vue'
import type { QuadrantAlignX, QuadrantAlignY, QuadrantTheme, HeadingSide } from './types'

const props = withDefaults(
    defineProps<{
        image?: string
        imageAlt?: string
        imgTmpAlignX?: QuadrantAlignX
        imgTmpAlignY?: QuadrantAlignY
        theme?: QuadrantTheme
        heading?: string
        headingAs?: 'h3' | 'h4'
        headingSide?: HeadingSide
        /** the stage's scroll-reveal state for this cell's row (HP-A1 · default false = invisible on load). */
        revealed?: boolean
    }>(),
    { imgTmpAlignX: 'center', imgTmpAlignY: 'center', headingAs: 'h3', headingSide: 'left', revealed: false },
)

const slots = useSlots()
const hasContent = computed(() => Boolean(props.heading) || Boolean(slots.default))

/** theme → the OKLCH token-pair class (yellow→primary · green→positive · pink→negative · dim→card). */
const themeClass = computed(() => (props.theme ? `quadrant--${props.theme}` : ''))

const bgStyle = computed<Record<string, string>>(() => {
    const s: Record<string, string> = {}
    if (props.image) {
        s.backgroundImage = `url('${props.image}')`
        s.backgroundPosition = `${props.imgTmpAlignX} ${props.imgTmpAlignY}`
        s.backgroundSize = 'cover' // always fill · cut-off parts (the 1:1 always-fill intent)
        s.backgroundRepeat = 'no-repeat'
    }
    return s
})
</script>

<style scoped>
/* the cell · fills its grid-track (sized by the stage's --q-cell-w/h vars · see QuadrantStage).
   Opaque bg so a held cell never reads-through; square (no radius · standards-floor). */
.quadrant {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden; /* clip the cover-cut image — LOCAL only (not an ancestor of the sticky stage) */
    background-color: var(--color-bg);
    color: var(--color-contrast);
}

/* theme palette · OKLCH token pairs (the magnifica grammar · same map as CardsCanvas) */
.quadrant--yellow { background-color: var(--color-primary-bg);  color: var(--color-primary-contrast); }
.quadrant--green  { background-color: var(--color-positive-bg); color: var(--color-positive-contrast); }
.quadrant--pink   { background-color: var(--color-negative-bg); color: var(--color-negative-contrast); }
.quadrant--dim    { background-color: var(--color-card-bg);     color: var(--color-card-contrast); }

/* the reveal-gated content · placed on its real position, invisible on load (visibility KEEPS the
   layout · HP-A3) · toggled visible INSTANTLY while the opaque shutter covers this half, so finished
   content is revealed as the curtain lifts (no fade · the curtain IS the reveal motion · A1). */
.quadrant-content {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding: clamp(1rem, 2.5vw, 2rem);
    height: 100%;
    visibility: hidden;
}
.quadrant--revealed .quadrant-content {
    visibility: visible;
}

/* heading side · left (default · top-left) or right (top-right) */
.quadrant-content--left {
    align-items: flex-start;
    text-align: left;
}
.quadrant-content--right {
    align-items: flex-end;
    text-align: right;
}

.quadrant-heading {
    margin: 0;
}

.quadrant-sub {
    margin-top: auto; /* the sub-element settles toward the cell's lower region by default */
}
</style>
