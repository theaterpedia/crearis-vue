<template>
    <div class="quadrant-seam" :class="{ 'quadrant-seam--spearhead': $slots.default }" :style="seamStyle">
        <!-- the CROSS-HAIR · the 2×2 divider, sized by the cDia height↔line math (SeamLine). -->
        <SeamLine :v-size="vSize" :h-size="hSize" :height="height" :line-color="lineColor" />
        <!-- content layer · PREPARED for the later cDia-style heading/text on the shutter (HP · A2);
             empty today. Centred (the spearhead bridge) when present. -->
        <div v-if="$slots.default" class="quadrant-seam-content">
            <slot />
        </div>
    </div>
</template>

<script setup lang="ts">
/**
 * QuadrantSeam — the OPAQUE curtain (the shutter). It scrolls UP across the FIXED quadrant, MASKING
 * it: when it covers a half, the stage toggles that row's content visible BEHIND the curtain, so the
 * eye sees finished content as the curtain lifts off (no pop-in · HP-recalibration 2026-06-16). NOT
 * a transparent blade (the first draft's error) — opaque, it covers.
 *
 * It carries the cross-hair (SeamLine) sized by the cDia/Shutter height↔line math (§Außenkreis-r2),
 * so it aligns with the cDia family and is PREPARED to host a heading/text layer later (the #default
 * slot · the spearhead centring · A2). It does NOT own the scroll-detection anymore — the STAGE
 * watches THIS element cross the fixed quadrant's half-lines (it knows the grid geometry).
 *
 * Height = `--q-shutter-h` (the stage writes the real px = a held cell-row, below 50vH after the
 * top/bottom offset corrections · A4); the `height` ordinal gives the no-JS fallback + the line-clamp.
 */
import { computed } from 'vue'
import SeamLine from './SeamLine.vue'
import { SHUTTER_HEIGHT_CSS, colorVar, type LineSize, type ShutterHeightSize } from './types'

const props = withDefaults(
    defineProps<{
        /** the curtain colour-token (`bg` = page bg · default · opaque · it MASKS). */
        bg?: string
        /** the shutter height-ordinal · scales --q-shutter-h + clamps the cross (the cDia math). */
        height?: ShutterHeightSize
        /** the cross arms (default a full cross · the divider) + colour. */
        vSize?: LineSize
        hSize?: LineSize
        lineColor?: string
    }>(),
    { bg: 'bg', height: 'full', vSize: 'full', hSize: 'full', lineColor: 'primary' },
)

const seamStyle = computed<Record<string, string>>(() => ({
    // backgroundColor longhand (opaque · the curtain) · NOT the shorthand
    backgroundColor: colorVar(props.bg, 'var(--color-bg)'),
    height: SHUTTER_HEIGHT_CSS[props.height],
}))
</script>

<style scoped>
/* the curtain · OPAQUE, square, full content-width · plain block in normal flow so it SWEEPS (does
   not pin) · the stage gives it the z above the held grid + the scroll-travel. */
.quadrant-seam {
    position: relative;
    width: 100%;
    min-height: var(--q-shutter-h, 50vh);
    color: var(--color-contrast);
    display: flex;
    flex-direction: column;
    justify-content: center;
}

/* content (later · heading/text) · centred on the cross (the spearhead bridge · cDia parity) */
.quadrant-seam--spearhead .quadrant-seam-content {
    position: relative;
    z-index: 1;
    max-width: 42rem;
    margin-inline: auto;
    padding: 1.5rem clamp(1.25rem, 4vw, 3rem);
    text-align: center;
}
</style>
