<template>
    <div
        class="mag-rise"
        :class="[`mag-rise--${lane}`, { 'mag-rise--scroll': scrollable != null }]"
        :style="riseStyle"
    >
        <slot />
    </div>
</template>

<script setup lang="ts">
/**
 * MagnificaRise — one lane/rise inside a <MagnificaScreen> (the §4 Cutter-Spec as props).
 * Pure-CSS sticky-sibling (Doc B §4); desktop only (<768 flows normally). Opaque bg so it
 * *covers* cleanly (Doc C gotcha #5). The knobs map 1:1 to the grammar:
 *   lane  · where the argument sits  — `left` (pins, z:2, covers the anchor) · `right` (left:52%)
 *   pin   · the constant it pins to  — rem added to the nav-offset for the sticky `top`
 *   pause · the gap-in-time          — vh of margin-top (the stagger before it rises)
 *   cover · the gap-in-space         — z-index override (default: left=2 · right=auto/DOM-order)
 *   scrollable · tall content (gotcha #4) — fixed scroll-box height in vh (overflow-y:auto)
 */
import { computed } from 'vue'

const props = withDefaults(
    defineProps<{
        lane?: 'left' | 'right'
        pin?: number
        pause?: number
        scrollable?: number
        cover?: number
    }>(),
    { lane: 'right', pin: 0, pause: 0 },
)

const riseStyle = computed<Record<string, string>>(() => {
    const s: Record<string, string> = { '--rise-pin': `${props.pin}rem` }
    if (props.pause) s['--rise-pause'] = `${props.pause}vh`
    if (props.scrollable != null) s['--rise-scroll'] = `${props.scrollable}vh`
    if (props.cover != null) s['--rise-cover'] = String(props.cover)
    return s
})
</script>

<style scoped>
/* <768 · normal flow (the screen linearises) */
@media (min-width: 768px) {
    .mag-rise {
        position: sticky;
        top: calc(var(--bb-navbar-offset, 6rem) + var(--rise-pin, 0rem));
        width: 48%;
        background: var(--color-bg);
        margin-top: var(--rise-pause, 0);
        z-index: var(--rise-cover, auto);
    }
    /* left lane · pins at the flow-start, covers the anchor (z:2 default · cover overrides) */
    .mag-rise--left {
        z-index: var(--rise-cover, 2);
    }
    /* right lane · the rises pin in the right half */
    .mag-rise--right {
        left: 52%;
    }
    /* tall content can't pin (gotcha #4) → a fixed scrollable box */
    .mag-rise--scroll {
        height: var(--rise-scroll, auto);
        overflow-y: auto;
    }
}
</style>
