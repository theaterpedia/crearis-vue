<template>
    <div ref="seamEl" class="quadrant-seam" :style="{ height }">
        <!-- zero-height edge-sentinels · the IO measures THESE crossing the viewport edges -->
        <span ref="topEl" class="quadrant-seam-sentinel quadrant-seam-sentinel--top" aria-hidden="true" />
        <!-- the CROSS-HAIR · the 2×2 divider made visible (the dasei line that plays the gap) -->
        <SeamLine :v-size="vSize" :h-size="hSize" :line-color="lineColor" />
        <span ref="bottomEl" class="quadrant-seam-sentinel quadrant-seam-sentinel--bottom" aria-hidden="true" />
    </div>
</template>

<script setup lang="ts">
/**
 * QuadrantSeam — the 50vH blade that sweeps (bottom→top) over the HELD quadrant, carrying the
 * cross-hair (the 2×2 divider · SeamLine). Transparent surface (the §52 "a line that plays OVER
 * held layers needs a transparent surface" gene), so the held grid reads through it.
 *
 * It OWNS its scroll-edge detection (HP-spec: "a shutter is controlled by scroll and releases an
 * event when its bottom enters the viewport + when its top exits") and EMITS:
 *   · @reveal-bottom(true)  when the seam's BOTTOM edge has entered the viewport → stage shows q3+q4
 *   · @reveal-top(true)     when the seam's TOP edge has exited above the viewport → stage shows q1+q2
 * Both are RE-EMITTED with the reversed value on scroll-up (the spec's "the other way around").
 *
 * Mechanism = a BOUNDED IntersectionObserver on two zero-height edge-sentinels — NOT a per-frame
 * scroll-driver (the sanctioned divergence from cDia's "CSS runs" · thread §2). The callback only
 * fires at viewport-edge crossings; we recompute both booleans from the live rects and emit. No-IO
 * floor (SSR / ancient engine) = emit both true on mount (everything visible · never a hidden trap).
 */
import { ref, onMounted, onUnmounted } from 'vue'
import SeamLine from './SeamLine.vue'
import type { LineSize } from './types'

withDefaults(
    defineProps<{
        /** the blade height (HP-spec: mostly 50vH · stays 50vH on mobile too). */
        height?: string
        vSize?: LineSize
        hSize?: LineSize
        lineColor?: string
    }>(),
    { height: '50vh', vSize: 'medium', hSize: 'medium', lineColor: 'primary' },
)

const emit = defineEmits<{
    (e: 'reveal-bottom', visible: boolean): void
    (e: 'reveal-top', visible: boolean): void
}>()

const seamEl = ref<HTMLElement>()
const topEl = ref<HTMLElement>()
const bottomEl = ref<HTMLElement>()

let observer: IntersectionObserver | null = null
let lastTop: boolean | null = null
let lastBottom: boolean | null = null

/** Recompute the two reveal-booleans from the live sentinel rects + viewport, emit on change. */
function measureAndEmit(): void {
    const top = topEl.value
    const bottom = bottomEl.value
    if (!top || !bottom) return
    const vh = window.innerHeight
    // BOTTOM edge has entered the viewport once it sits above the viewport's bottom line.
    const revealBottom = bottom.getBoundingClientRect().top < vh
    // TOP edge has exited once it sits above the viewport's top line.
    const revealTop = top.getBoundingClientRect().top < 0
    if (revealBottom !== lastBottom) {
        lastBottom = revealBottom
        emit('reveal-bottom', revealBottom)
    }
    if (revealTop !== lastTop) {
        lastTop = revealTop
        emit('reveal-top', revealTop)
    }
}

onMounted(() => {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
        // no-JS / ancient-engine floor — reveal everything (never a hidden-forever trap)
        emit('reveal-bottom', true)
        emit('reveal-top', true)
        return
    }
    // IO fires at the viewport-edge crossings (the "when to recompute" trigger); the rects do the rest.
    observer = new IntersectionObserver(() => measureAndEmit(), { threshold: [0, 1] })
    if (topEl.value) observer.observe(topEl.value)
    if (bottomEl.value) observer.observe(bottomEl.value)
    measureAndEmit() // initial state (before any crossing)
})

onUnmounted(() => observer?.disconnect())
</script>

<style scoped>
/* the blade · TRANSPARENT (the held grid reads through · §52) · plain block in normal flow so it
   SWEEPS (does not pin · the stage positions it over the sticky grid via z + margin). Square. */
.quadrant-seam {
    position: relative;
    width: 100%;
    background: transparent;
    pointer-events: none; /* never traps clicks meant for the held grid beneath */
}

/* zero-height edge markers · the IO watches these cross the viewport top/bottom */
.quadrant-seam-sentinel {
    position: absolute;
    left: 0;
    width: 100%;
    height: 1px;
}
.quadrant-seam-sentinel--top {
    top: 0;
}
.quadrant-seam-sentinel--bottom {
    bottom: 0;
}
</style>
