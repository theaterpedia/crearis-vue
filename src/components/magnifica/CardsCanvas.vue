<template>
    <section class="bb-canvas" :class="{ 'bb-canvas--bounded': bounded }">
        <!-- Blackboard · sticky · holds the persistent prose (hero title/subtitle) -->
        <div class="bb-board">
            <div class="bb-board-prose">
                <slot name="board" />
            </div>
        </div>

        <!--
            Scroll-choreography (restored from the 2022 source + howto-blackboard §2-4):
            each post-it is a `position: sticky` SIBLING of the board. As the reader
            scrolls, post-its drift up and pin at their own top/left (spread), accumulate,
            then — when the canvas's bottom passes — release together and scroll off as one
            (the next content rises from below · "Theatervorhang"). Pure CSS, no JS.
            Per-item `sticky: false` opts a card out → it scrolls off instantly (2022 config).
        -->
        <article
            v-for="(item, i) in boardItems"
            :key="item.key"
            class="bb-postit"
            :class="[`bb-${item.color}`, { 'bb-postit--nosticky': !item.sticky }]"
            :style="postitStyle(item)"
        >
            <p v-if="item.overline" class="bb-postit-overline">{{ item.overline }}</p>
            <h3 v-if="item.headline" class="bb-postit-headline">{{ item.headline }}</h3>
            <p v-if="item.bodyText" class="bb-postit-body">{{ item.bodyText }}</p>
        </article>

        <!-- Slot-based consumer-contract · author children directly -->
        <slot />

        <div class="bb-end" />
    </section>
</template>

<script setup lang="ts">
/**
 * CardsCanvas — the sticky-scroll "blackboard". Post-its arrive from below, pin
 * (spread across the board · §1-2 settled with HM 2026-06-07), accumulate, and the
 * whole canvas scrolls off as one. Pattern ported from the 2022 CardsCanvas.vue
 * (`position: sticky` siblings) + howto-blackboard.md — NOT the absolute-positioned
 * FloatingPostIt static-board (that variant dropped the scroll choreography).
 *
 * Positions: authored per-item (props.top/left/rotate) when present, else a deterministic
 * lane-spread by index. `marginTop` staggers each card's arrival (props.marginTop or a
 * default). The `board` named-slot carries the persistent prose. Colours via the
 * magnifica→OKLCH token map; square corners.
 */
import { computed } from 'vue'
import { magnificaToFpostitColor, parseRotateDeg, type CardsCanvasItem } from './types'
import { DEFAULT_LANES, DEFAULT_ROTATIONS } from '@/fpostit/utils/board'

interface Props {
    /** Items to pin on the board (CardsCanvasItem shape · authoring-compatible). */
    items?: ReadonlyArray<CardsCanvasItem>
    /** Override the default horizontal lanes (left-% values). */
    lanes?: ReadonlyArray<number>
    /** Opt-in: bound the full-bleed canvas to the 90rem content-column on wide
     *  viewports (≥1456px), aligning it with the magnifica page-shell + Hero. Default
     *  false → full-bleed (unchanged for the Demo / any non-magnifica use). */
    bounded?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    lanes: () => DEFAULT_LANES,
    bounded: false,
})

interface BoardCard {
    key: string
    overline?: string
    headline?: string
    bodyText?: string
    color: string
    top: string
    left: string
    rotate: number
    marginTop: string
    sticky: boolean
}

const boardItems = computed<BoardCard[]>(() =>
    (props.items ?? []).map((it, i): BoardCard => {
        const p = it.props
        const lane = props.lanes[i % props.lanes.length] ?? 5
        return {
            key: String(it.key ?? `b${i + 1}`),
            overline: p.overline,
            headline: p.headline,
            bodyText: p.bodyText,
            // 'primary' | 'positive' | 'negative' | 'dimmed' → .bb-{color}
            color: magnificaToFpostitColor(p.themeColor),
            // authored top/left win; else a deterministic vertical spread + lane
            top: (p.top as string) ?? `${8 + (i % 4) * 7}%`,
            left: (p.left as string) ?? `${lane}%`,
            rotate: parseRotateDeg(p.rotate ?? DEFAULT_ROTATIONS[i % DEFAULT_ROTATIONS.length]),
            // stagger arrival: first card immediate, rest spaced so they enter one-by-one
            marginTop: (p.marginTop as string) ?? (i === 0 ? '0' : 'clamp(5rem, 26vh, 14rem)'),
            // opt-out → scrolls off instantly instead of collecting (2022 "Ja das" config)
            sticky: p.sticky !== false,
        }
    }),
)

function postitStyle(card: BoardCard): Record<string, string> {
    return {
        top: card.top,
        left: card.left,
        marginTop: card.marginTop,
        transform: `rotate(${card.rotate}deg)`,
    }
}
</script>

<style scoped>
/* No overflow / flex / transform on the canvas or any ancestor — sticky needs the
   viewport as scroll-context (howto-blackboard §6). Height comes from the children. */
.bb-canvas {
    position: relative;
    background: var(--bb-page-bg, var(--color-bg, #1d1b1a));
}

/* opt-in (`bounded`) · align the canvas with the 90rem content-column on wide viewports
   (same 1456px gate + 90rem as Hero `magnifica`). max-width + margin only — no overflow/
   flex/transform — so the sticky scroll-choreography (§6 invariant) stays intact. */
@media (min-width: 1456px) {
    .bb-canvas--bounded {
        max-width: 90rem;
        margin-inline: auto;
    }
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
    max-width: 34rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.bb-board-prose :deep(p),
.bb-board-prose :deep(span) {
    color: var(--bb-board-text, var(--color-contrast, #f4f4f4));
}

/* every post-it · sticky sibling · square corners */
.bb-postit {
    position: sticky;
    width: min(20rem, 80vw);
    min-height: 12rem;
    padding: 1.25rem;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
    border-radius: 0;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    font-family: var(--font, ui-monospace);
}

/* opt-out: scroll off in place (no collect) */
.bb-postit--nosticky {
    position: relative;
}

/* semantic colours · OKLCH token pairs (square magnifica grammar) */
.bb-primary  { background: var(--color-primary-bg);  color: var(--color-primary-contrast); }
.bb-positive { background: var(--color-positive-bg); color: var(--color-positive-contrast); }
.bb-negative { background: var(--color-negative-bg); color: var(--color-negative-contrast); }
.bb-dimmed   { background: var(--color-card-bg);     color: var(--color-card-contrast); }

.bb-postit-overline {
    font-size: 0.875rem;
    opacity: 0.85;
    margin: 0;
}

.bb-postit-headline {
    font-size: 1.125rem;
    font-weight: 700;
    line-height: 1.3;
    margin: 0;
}

.bb-postit-body {
    font-size: 0.9375rem;
    line-height: 1.5;
    margin: 0;
    white-space: pre-line;
}

.bb-end {
    height: 2rem;
}

/* Mobile · linearise (howto-blackboard §5 Option A): drop sticky, flow one-per-row */
@media (max-width: 768px) {
    .bb-board {
        display: none;
    }
    .bb-postit {
        position: static;
        width: 100%;
        max-width: 24rem;
        min-height: 0;
        margin: 1rem auto !important;
        top: auto !important;
        left: auto !important;
        transform: none !important;
    }
}

@media (prefers-reduced-motion: reduce) {
    .bb-postit {
        transform: none;
    }
}
</style>
