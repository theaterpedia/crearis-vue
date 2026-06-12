<template>
    <section class="mag-screen">
        <div
            v-if="$slots.anchor"
            class="mag-screen-anchor"
            :class="{ 'mag-screen-anchor--run-below': anchorPin === 'run-below' }"
        >
            <slot name="anchor" />
        </div>
        <slot />
    </section>
</template>

<script setup lang="ts">
/**
 * MagnificaScreen — the declarative sticky-screen container (the §4 Cutter-Spec as a component).
 * Graduated from the Doc-C Screen-Container proposal once Scene A + Scene B earned it (two real
 * screens · 06-12-DEVDOC-magnifica-scroll · Trail §2). It emits the validated sticky recipe
 * (Doc B §4) so a director authors a screen as props, not re-derived CSS:
 *
 *   <MagnificaScreen>                              — the screen (position:relative · plain block)
 *     <template #anchor> …heading… </template>     — pins at top (z:1, opaque) · anchorPin="run-below" to scroll it off
 *     <MagnificaRise lane="left"> …left lane… </MagnificaRise>      — pins, covers the anchor (z:2)
 *     <MagnificaRise :pin="8" :pause="50"> …rise… </MagnificaRise>  — right lane, rises after a pause
 *   </MagnificaScreen>
 *
 * SCROLL ENGINE: pure-CSS sticky-siblings — no JS (the validated Scene A/B). ANCESTOR-PURITY
 * (Doc C gotcha #6): the screen + every ancestor stay plain blocks — NO transform / filter /
 * overflow / contain / will-change (kills sticky). Desktop only; <768 linearises to normal flow.
 *
 * FUTURE SEAM (slidev borrow · Trail §3.1 · not built): a scroll-in-view *active-predicate*
 * (@vueuse `useElementVisibility` / IntersectionObserver — as the chatbox already does) + a
 * *transition contract* (fire enter/leave effects on entry) would graduate the same config→stages
 * shape slidev uses, swapping route-active for scroll-active. Wire it when a screen needs
 * enter-effects + the §3.1 research-Qs settle — the pin/rise/pause stays pure-CSS regardless.
 */
withDefaults(defineProps<{ anchorPin?: 'stay' | 'run-below' }>(), {
    anchorPin: 'stay',
})
</script>

<style scoped>
/* the screen · a plain block in normal flow (ancestor-purity · gotcha #6) */
.mag-screen {
    position: relative;
}

/* DESKTOP only · the anchor pins; the rises (MagnificaRise) pin beside it. <768 flows normally. */
@media (min-width: 768px) {
    /* the anchor · the un-compacted constant · pins below the nav, z BELOW the rises so a rising
       left-lane covers it (Doc A §1 · the "cover" gap). Opaque so it covers the next on release. */
    .mag-screen-anchor {
        position: sticky;
        top: var(--bb-navbar-offset, 6rem);
        z-index: 1;
        background: var(--color-bg);
        padding: 0.5rem 0;
    }
    /* the run-below header-option (Doc B §4 config · UI_episDesign_Ethno10): the anchor scrolls off
       instead of staying pinned. */
    .mag-screen-anchor--run-below {
        position: static;
    }
}
</style>
