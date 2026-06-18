<template>
    <div class="quadrant-seam" :class="`quadrant-seam--${activePreset}`" :style="seamStyle">
        <!-- the CROSS-HAIR · sized by the cDia height↔line math (SeamLine) · default = vertical only. -->
        <SeamLine :v-size="vSize" :h-size="hSize" :height="height" :line-color="lineColor" />

        <!-- SPLIT preset (HP 2026-06-16 · change 3) · "left | right" split by the line: `left` sits
             left of the vertical line, `right` to its right (matches q3-left | q4-right). The stage
             switches the active text when the shutter crosses into the viewport's upper half. -->
        <div v-if="splitParts" class="quadrant-seam-split">
            <span class="quadrant-seam-split-cell quadrant-seam-split-cell--left">{{ splitParts.left }}</span>
            <span class="quadrant-seam-split-cell quadrant-seam-split-cell--right">{{ splitParts.right }}</span>
        </div>

        <!-- spearhead / plain text · centred on the cross (the cDia parity · the heading/text layer) -->
        <div v-else-if="text || $slots.default" class="quadrant-seam-content">
            <slot>{{ text }}</slot>
        </div>
    </div>
</template>

<script setup lang="ts">
/**
 * QuadrantSeam — the OPAQUE curtain (the shutter). It scrolls UP across the FIXED quadrant, MASKING
 * it; the stage toggles the covered row's content visible behind it (revealed as the curtain lifts).
 * Carries the cross-hair (SeamLine · cDia height↔line math · §Außenkreis-r2) — default = the VERTICAL
 * line only (change 2) — and a TEXT layer with two presets:
 *   · `split`    — "left | right" split by the vertical line (the divider) · the row-labels.
 *   · `spearhead`— centred on the cross (the cDia parity · default when text/slot present).
 * Height = `--q-shutter-h` (the stage writes the real px = a half · below 50vH after corrections).
 */
import { computed } from 'vue'
import SeamLine from './SeamLine.vue'
import { SHUTTER_HEIGHT_CSS, colorVar, type LineSize, type ShutterHeightSize } from './types'

const props = withDefaults(
    defineProps<{
        bg?: string
        height?: ShutterHeightSize
        /** the cross arms · default the VERTICAL line only (change 2). */
        vSize?: LineSize
        hSize?: LineSize
        lineColor?: string
        /** content distribution · `split` (left | right around the line) or `spearhead` (centred). */
        preset?: 'split' | 'spearhead'
        /** the active text (the stage feeds the current array-item · e.g. "q3-left | q4-right"). */
        text?: string
    }>(),
    { bg: 'bg', height: 'full', vSize: 'full', hSize: 'none', lineColor: 'primary', preset: 'spearhead' },
)

const activePreset = computed(() => (props.preset === 'split' && props.text ? 'split' : 'spearhead'))

/** split the active text by `|` → { left, right } (the two sides of the vertical line). */
const splitParts = computed(() => {
    if (props.preset !== 'split' || !props.text || !props.text.includes('|')) return null
    const [left = '', right = ''] = props.text.split('|')
    return { left: left.trim(), right: right.trim() }
})

const seamStyle = computed<Record<string, string>>(() => ({
    backgroundColor: colorVar(props.bg, 'var(--color-bg)'),
    height: SHUTTER_HEIGHT_CSS[props.height],
}))
</script>

<style scoped>
/* the curtain · OPAQUE, square, full content-width · plain block in normal flow so it SWEEPS · the
   stage gives it the z above the held grid + the scroll-travel. */
.quadrant-seam {
    position: relative;
    width: 100%;
    min-height: var(--q-shutter-h, 50vh);
    /* the shutter's ink is its OWN bg's contrast (the curtain bg = the page bg by default · dark in
       theme-7), so it stays readable regardless of the text-inverted toggle (which governs the cell
       headings · a black-on-dark shutter would be invisible). */
    color: var(--color-contrast);
    display: flex;
    flex-direction: column;
    justify-content: center;
}

/* SPLIT · the two labels flank the vertical line (left right-aligned toward the centre, right
   left-aligned from it). Vertically centred on the band (the "only vertical line" case · change 3).
   🚩 dial (HP): the parenthetical "above/below the line" — confirm on the screentest whether a future
   h-line case wants above/below instead of this left|right. */
.quadrant-seam-split {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    width: 100%;
}
.quadrant-seam-split-cell {
    flex: 1 1 0;
    font-weight: 700;
    padding: 0 clamp(1rem, 3vw, 2.5rem);
}
.quadrant-seam-split-cell--left {
    text-align: right;
}
.quadrant-seam-split-cell--right {
    text-align: left;
}

/* spearhead / plain · centred on the cross (the cDia parity · the heading/text layer) */
.quadrant-seam--spearhead .quadrant-seam-content {
    position: relative;
    z-index: 1;
    max-width: 42rem;
    margin-inline: auto;
    padding: 1.5rem clamp(1.25rem, 4vw, 3rem);
    text-align: center;
}
</style>
