<template>
    <div ref="brushEl" class="quadrant-brush" :class="{ 'quadrant-brush--visible': visible }" aria-hidden="true">
        <slot />
    </div>
</template>

<script setup lang="ts">
/**
 * QuadrantBrush — the (invisible) release-trigger of the cQuadrant family. Mounted 150vH BELOW the
 * shutter (= the 50vH shutter + a full free viewport · the stage positions it), it begins scrolling
 * on AFTER the shutter has fully left the top. Its arrival is what ENDS the held phase: it emits
 * `@arrive(true)` so the stage can release the fixed quadrant and let the honest-flag board take
 * over (HP-recalibration 2026-06-16 · A3 · invisible trigger). `visible` opt-in for debugging only.
 *
 * Detection = a single bounded IntersectionObserver (the family's sanctioned JS · not a scroll-
 * driver). No-IO floor → emit arrive(true) on mount (never strand the release).
 */
import { ref, onMounted, onUnmounted } from 'vue'

withDefaults(defineProps<{ visible?: boolean }>(), { visible: false })

const emit = defineEmits<{ (e: 'arrive', arrived: boolean): void }>()

const brushEl = ref<HTMLElement>()
let observer: IntersectionObserver | null = null

onMounted(() => {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
        emit('arrive', true)
        return
    }
    observer = new IntersectionObserver(
        (entries) => entries.forEach((e) => emit('arrive', e.isIntersecting)),
        { threshold: 0 },
    )
    if (brushEl.value) observer.observe(brushEl.value)
})
onUnmounted(() => observer?.disconnect())
</script>

<style scoped>
/* invisible by default (a trigger · need not be seen · HP A3) · zero-impact marker in normal flow */
.quadrant-brush {
    width: 100%;
    height: 1px;
    visibility: hidden;
}
.quadrant-brush--visible {
    height: 2rem;
    visibility: visible;
    background: var(--color-primary-bg);
    opacity: 0.4;
}
</style>
