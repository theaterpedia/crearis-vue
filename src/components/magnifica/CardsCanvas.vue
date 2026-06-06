<template>
    <section class="bb-canvas">
        <!-- Blackboard · sticky · holds persistent body-text -->
        <div class="bb-board">
            <div class="bb-board-prose">
                <slot name="board" />
            </div>
        </div>

        <!--
            Board-mode (fpostit-unified · 2026-06-06): each item is a pinned
            `<FloatingPostIt hlogic="static-board">` positioned by buildBoardItems()
            (lane-distribution + jitter). Reuses the shared card + OKLCH theme tokens;
            the bespoke PostIt + lanes.ts are retired.
        -->
        <FloatingPostIt
            v-for="item in boardItems"
            :key="item.key"
            :data="toData(item)"
            :is-open="true"
        />

        <!-- Slot-based consumer-contract · author children directly -->
        <slot />

        <div class="bb-end" />
    </section>
</template>

<script setup lang="ts">
/**
 * CardsCanvas — sticky cards-blackboard, now a thin wrapper over the shared fpostit
 * board-mode. Items (CardsCanvasItem shape · authoring-compatible) map to
 * `BoardItem`s via `buildBoardItems()` and render as pinned `<FloatingPostIt>`s with
 * OKLCH theme colors. Lane-distribution + jitter live in `fpostit/utils/board.ts`.
 *
 * The `board` named-slot still carries the persistent blackboard prose.
 */
import { computed } from 'vue'
import FloatingPostIt from '@/fpostit/components/FloatingPostIt.vue'
import { magnificaToFpostitColor, type CardsCanvasItem } from './types'
import {
    buildBoardItems,
    DEFAULT_LANES,
    type BoardContent,
    type BoardItem,
    type RandomSource,
} from '@/fpostit/utils/board'
import type { FpostitData } from '@/fpostit/types'

interface Props {
    /** Items to pin on the board (CardsCanvasItem shape · authoring-compatible). */
    items?: ReadonlyArray<CardsCanvasItem>
    /** Override the default 5 lanes (left-% values). */
    lanes?: ReadonlyArray<number>
    /** Override the per-item `top` jitter half-range (default ±3%). */
    topJitterPercent?: number
    /** Inject a deterministic random-source for tests. Default Math.random. */
    rng?: RandomSource
}

const props = withDefaults(defineProps<Props>(), {
    lanes: () => DEFAULT_LANES,
    topJitterPercent: 3,
})

function esc(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

const boardItems = computed<BoardItem[]>(() => {
    const items = props.items ?? []
    const contents: BoardContent[] = items.map((it, i) => {
        const p = it.props
        const overline = p.overline ? `<p class="bb-overline">${esc(p.overline)}</p>` : ''
        const body = p.bodyText ? `<p>${esc(p.bodyText)}</p>` : ''
        return {
            key: String(it.key ?? `b${i + 1}`),
            title: p.headline ?? '',
            content: overline + body,
            color: magnificaToFpostitColor(p.themeColor),
            image: p.image,
        }
    })
    return buildBoardItems(contents, {
        lanes: props.lanes,
        topJitterPercent: props.topJitterPercent,
        rng: props.rng,
    })
})

function toData(item: BoardItem): FpostitData {
    return { ...item, hlogic: 'static-board' }
}
</script>

<style scoped>
.bb-canvas {
    position: relative;
    background: var(--bb-page-bg, var(--color-bg, #1d1b1a));
    min-height: 100vh;
}

.bb-board {
    position: sticky;
    top: var(--bb-navbar-offset, 6rem);
    height: 100vh;
    padding-bottom: 24rem;
    background: var(--bb-board-bg, var(--color-bg, #1d1b1a));
}

.bb-board-prose {
    padding: 1rem 0 0 1rem;
    max-width: 18rem;
}

.bb-board-prose :deep(p) {
    color: var(--bb-board-text, var(--color-contrast, #f4f4f4));
    font-size: 1rem;
    line-height: 1.5;
}

.bb-end {
    height: 2rem;
}

/* Mobile · linearised per howto-blackboard §5 */
@media (max-width: 768px) {
    .bb-board {
        display: none;
    }
}
</style>
