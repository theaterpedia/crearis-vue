<template>
    <section class="bb-canvas">
        <!-- Blackboard · sticky · holds persistent body-text -->
        <div class="bb-board">
            <div class="bb-board-prose">
                <slot name="board" />
            </div>
        </div>

        <!--
            Items-array consumer-contract (mirrors the 2022 JSON-items pattern at
            theaterpedia2022/components/content/CardsCanvas.vue). Each item resolves
            to <PostIt> with its props forwarded; if `top`/`left`/`rotate` is missing
            on an item, lane-distribution + jitter + discrete-rotation fill them in.
        -->
        <template v-if="items && items.length">
            <PostIt
                v-for="(item, i) in resolvedItems"
                :key="item.key ?? i"
                v-bind="item.props"
                :style="item.extraStyle"
            />
        </template>

        <!-- Slot-based consumer-contract · alternative to items-prop -->
        <slot />

        <!-- End-strip · clean bottom · per howto §4 -->
        <div class="bb-end" />
    </section>
</template>

<script setup lang="ts">
/**
 * CardsCanvas — sticky-post-its blackboard · canonical CSS per
 * `crearis:projects/magnifica/docs/howto-blackboard.md`.
 *
 * Two consumer-contracts (per howto §7):
 *   - JSON-items prop · each item `{component, props}` resolves to <PostIt />
 *     (mirrors the 2022 source-of-truth pattern at
 *     `theaterpedia2022/components/content/CardsCanvas.vue`)
 *   - Default slot · author <PostIt> children directly · use when content
 *     authoring lives in templates rather than markdown frontmatter
 *
 * ==Lane-distribution + randomness== (per dispatch #4 §3): when items omit
 * `top`/`left`/`rotate`, `distributeAcrossLanes()` fills them in. 5 default
 * horizontal lanes (5%, 25%, 45%, 62%, 85%) · per-item jitter ±3% on `top` ·
 * discrete rotation pick from {-3°…+3°}. Result feels curated, not chaotic.
 *
 * The board's persistent body-text lives in the `board` named-slot.
 *
 * Per CV@wsl dispatch #4 (TO (website) 2026-06-02 DI · meta-feed).
 */
import { computed } from 'vue'
import PostIt from './PostIt.vue'
import type { CardsCanvasItem } from './types'
import {
    DEFAULT_LANES,
    DEFAULT_ROTATIONS_DEG,
    distributeAcrossLanes,
    type LaneAssignment,
    type RandomSource,
} from './lanes'

interface Props {
    /** Optional JSON-items list. When provided, post-its are rendered from this array; the default slot is still honored alongside. */
    items?: ReadonlyArray<CardsCanvasItem>
    /**
     * Override the default 5 lanes (left-% values). Min 5 lanes enforced
     * by `distributeAcrossLanes()` per dispatch §3.
     */
    lanes?: ReadonlyArray<number>
    /** Override the default discrete rotation pool (degrees). */
    rotations?: ReadonlyArray<number>
    /** Override the per-item `top` jitter half-range (default ±3%). */
    topJitterPercent?: number
    /**
     * Inject a deterministic random-source for tests. Default `Math.random`.
     * Marks the lane-distribution as a pure decision given the rng — same
     * grandfather-pattern as bridgeFromOdoo's injectable deps.
     */
    rng?: RandomSource
}

const props = withDefaults(defineProps<Props>(), {
    lanes: () => DEFAULT_LANES,
    rotations: () => DEFAULT_ROTATIONS_DEG,
    topJitterPercent: 3,
})

/**
 * Resolve items: fill in lane-distributed `top`/`left`/`rotate` for items
 * that omit them, leave authored values for items that have them. Pure;
 * tests verify the distribution shape via injected rng.
 */
const resolvedItems = computed(() => {
    const itemsArr = props.items ?? []
    if (itemsArr.length === 0) return []

    // Compute distribution for items that need fill-in. To keep the
    // distribution deterministic per item-index regardless of which items
    // have authored positions, compute lane-assignments for ALL indices
    // and apply them only where the item omits the corresponding prop.
    const distribution: LaneAssignment[] = distributeAcrossLanes(itemsArr.length, {
        lanes: props.lanes,
        rotations: props.rotations,
        topJitterPercent: props.topJitterPercent,
        rng: props.rng,
    })

    return itemsArr.map((item, i) => {
        const assigned = distribution[i] as LaneAssignment
        const propsOut = { ...item.props }
        if (propsOut.top === undefined) propsOut.top = `${assigned.topPercent.toFixed(1)}%`
        if (propsOut.left === undefined) propsOut.left = `${assigned.leftPercent}%`
        if (propsOut.rotate === undefined) propsOut.rotate = assigned.rotateDeg
        return {
            key: item.key,
            props: propsOut,
            extraStyle: undefined,
        }
    })
})
</script>

<style scoped>
.bb-canvas {
    /* No positioning, no overflow, no flex · height comes from children
       per howto-blackboard §4 (sticky requires this). */
    position: relative;
    background: var(--bb-page-bg, #1d1b1a);
}

.bb-board {
    position: sticky;
    top: var(--bb-navbar-offset, 6rem);
    height: 100vh;
    padding-bottom: 24rem;
    background: var(--bb-board-bg, #1d1b1a);
}

.bb-board-prose {
    padding: 1rem 0 0 1rem;
    max-width: 18rem;
}

.bb-board-prose :deep(p) {
    color: var(--bb-board-text, #f4f4f4);
    font-size: 1rem;
    line-height: 1.5;
}

.bb-end {
    height: 2rem;
}

/* Mobile · Option-A linearised per howto-blackboard §5 (HM-approved):
   blackboard hidden, post-its flow normally · linearised reading. */
@media (max-width: 768px) {
    .bb-board {
        display: none;
    }
}
</style>
