<template>
    <!-- the CROSS · a vertical line (::before · height %) + a horizontal line (::after · width %),
         centred, coloured. Either size `none` → that arm is invisible. Square grammar, no radius. -->
    <div class="seam-line" :style="lineStyle" aria-hidden="true" />
</template>

<script setup lang="ts">
/**
 * SeamLine — the cross-hair sub-element (the 2×2 divider made visible · the dasei line that "plays
 * the gap"). The line-geometry is lifted from cDia/Shutter.vue (§Außenkreis-r2 · the ONE formula),
 * NOT the whole Shutter (HP-spec: don't reuse the main Shutter, borrow a sub-element). Pure CSS,
 * transparent surface (it plays OVER held layers · the §50·3/§52 "cover is a role" gene).
 */
import { computed } from 'vue'
import { lineGeometry, colorVar, type LineSize } from './types'

const props = withDefaults(
    defineProps<{
        /** the vertical arm (the q1|q2 / q3|q4 column divider). */
        vSize?: LineSize
        /** the horizontal arm (the q1q2 / q3q4 row divider). */
        hSize?: LineSize
        /** the line colour-token (default `primary` · the dasei-yellow motif). */
        lineColor?: string
    }>(),
    { vSize: 'medium', hSize: 'medium', lineColor: 'primary' },
)

const lineStyle = computed<Record<string, string>>(() => {
    const v = lineGeometry(props.vSize)
    const h = lineGeometry(props.hSize)
    return {
        '--line-color': colorVar(props.lineColor, 'var(--color-primary-bg)'),
        '--line-v-len': v.len,
        '--line-v-wt': v.weight,
        '--line-h-len': h.len,
        '--line-h-wt': h.weight,
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
/* vertical arm · height % of the box */
.seam-line::before {
    width: var(--line-v-wt, 0);
    height: var(--line-v-len, 0);
}
/* horizontal arm · width % of the box */
.seam-line::after {
    width: var(--line-h-len, 0);
    height: var(--line-h-wt, 0);
}
</style>
