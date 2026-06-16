<template>
    <!-- the CROSS · a vertical arm (::before · height %, height-clamped) + a horizontal arm
         (::after · width %), centred, coloured. Either arm `none` → invisible. Square, no radius. -->
    <div class="seam-line" :style="lineStyle" aria-hidden="true" />
</template>

<script setup lang="ts">
/**
 * SeamLine — the cross-hair sub-element (the 2×2 divider · the dasei line that "plays the gap"). The
 * geometry is the cDia/Shutter formula (§Außenkreis-r2) — the v-arm is HEIGHT-CLAMPED to the shutter
 * height, the h-arm is width-based — so the cross aligns visually with the cDia family + the spec
 * (and a later heading/text layer) stays reusable (HP 2026-06-16 · A2). Lifted as a sub-element, NOT
 * the whole Shutter (per the original spec).
 */
import { computed } from 'vue'
import { crossGeometry, colorVar, type LineSize, type ShutterHeightSize } from './types'

const props = withDefaults(
    defineProps<{
        /** the vertical arm (the q1|q2 / q3|q4 column divider). */
        vSize?: LineSize
        /** the horizontal arm (the q1q2 / q3q4 row divider · the moving scan-line). */
        hSize?: LineSize
        /** the host shutter's height-ordinal · clamps the v-arm (the cDia math). */
        height?: ShutterHeightSize
        /** the line colour-token (default `primary` · the dasei-yellow motif). */
        lineColor?: string
    }>(),
    { vSize: 'full', hSize: 'full', height: 'full', lineColor: 'primary' },
)

const lineStyle = computed<Record<string, string>>(() => {
    const g = crossGeometry(props.vSize, props.hSize, props.height)
    return {
        '--line-color': colorVar(props.lineColor, 'var(--color-primary-bg)'),
        '--line-v-len': g.vLen,
        '--line-v-wt': g.vWt,
        '--line-h-len': g.hLen,
        '--line-h-wt': g.hWt,
    }
})
</script>

<style scoped>
.seam-line {
    position: absolute;
    inset: 0;
    pointer-events: none;
}
.seam-line::before,
.seam-line::after {
    content: '';
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    background: var(--line-color, var(--color-primary-bg));
}
/* vertical arm · height % of the shutter */
.seam-line::before {
    width: var(--line-v-wt, 0);
    height: var(--line-v-len, 0);
}
/* horizontal arm · width % of the shutter */
.seam-line::after {
    width: var(--line-h-len, 0);
    height: var(--line-h-wt, 0);
}
</style>
