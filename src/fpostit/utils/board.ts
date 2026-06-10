/**
 * Board-mode utilities for the floating-post-it system.
 *
 * The `static-board` hlogic (see types.ts · BoardItem) pins many post-its at
 * authored top/left percentages inside a positioned container — the "cards
 * blackboard" pattern. This module owns the lane-distribution + jitter that
 * turns a flat content-list into positioned `BoardItem`s.
 *
 * Moved here from `src/components/magnifica/lanes.ts` (2026-06-06 fpostit-extend ·
 * unifying the magnifica parallel-implementation into the shared fpostit system).
 * The distribution is pure given an injectable RNG; tests pass a deterministic
 * source. Rotations are emitted as `PostitRotation` classes (fpostit's
 * `.rotate-*` convention) rather than raw degrees.
 */

import type { BoardItem, PostitColor, PostitRotation } from '../types'

/**
 * Default horizontal lanes (LEFT positions as CSS percentages). 5-lane spread
 * with asymmetry so the board doesn't read as a strict grid.
 */
export const DEFAULT_LANES: ReadonlyArray<number> = [5, 25, 45, 62, 85]

/** Discrete rotation classes for board variety (matches getRandomRotation pool). */
export const DEFAULT_ROTATIONS: ReadonlyArray<PostitRotation> = [
    'rotate-0',
    '-rotate-1',
    '-rotate-2',
    '-rotate-3',
    'rotate-1',
    'rotate-2',
    'rotate-3',
]

/**
 * Pure RNG seam: the consumer passes its own random-source. Defaults to
 * `Math.random` in production; tests pass a deterministic source so the
 * distribution is verifiable.
 */
export type RandomSource = () => number

/** Pick a random element from a non-empty readonly-array. Pure given rng. */
export function pickRandom<T>(items: ReadonlyArray<T>, rng: RandomSource = Math.random): T {
    if (items.length === 0) {
        throw new Error('[fpostit/board] pickRandom called with empty array')
    }
    return items[Math.floor(rng() * items.length)] as T
}

/** Pick a uniform value in `[min, max]`. Pure given rng. Used for top-jitter. */
export function randomInRange(min: number, max: number, rng: RandomSource = Math.random): number {
    return min + rng() * (max - min)
}

/** Result of distributing N items across the board. One entry per input item by index. */
export interface LaneAssignment {
    /** Lane index (`0..lanes.length-1`). */
    laneIndex: number
    /** Horizontal position in % (from `lanes[laneIndex]`). */
    leftPercent: number
    /** Vertical position in % (with jitter). */
    topPercent: number
    /** Rotation class (from {@link DEFAULT_ROTATIONS}). */
    rotation: PostitRotation
}

export interface DistributeOptions {
    /** Horizontal lanes as left-% values. Default {@link DEFAULT_LANES}. Min 5. */
    lanes?: ReadonlyArray<number>
    /** Discrete rotation classes. Default {@link DEFAULT_ROTATIONS}. */
    rotations?: ReadonlyArray<PostitRotation>
    /** Top-position jitter half-range in % (default 3 = ±3%). */
    topJitterPercent?: number
    /** Random-source. Default `Math.random`. Tests inject a deterministic source. */
    rng?: RandomSource
    /** Base spread for `top` placement before jitter. Default [10%, 80%]. */
    topRange?: [number, number]
}

/**
 * Distribute `count` items across the lane-set with per-item `top` jitter and a
 * discrete rotation pick. Round-robin lane assignment gives even horizontal
 * spread; per-item rotation adds curated subtle variety. Pure given the rng.
 */
export function distributeAcrossLanes(
    count: number,
    options: DistributeOptions = {},
): LaneAssignment[] {
    const lanes = options.lanes ?? DEFAULT_LANES
    const rotations = options.rotations ?? DEFAULT_ROTATIONS
    const jitter = options.topJitterPercent ?? 3
    const rng = options.rng ?? Math.random
    const [topMin, topMax] = options.topRange ?? [10, 80]

    if (lanes.length < 5) {
        throw new Error(
            `[fpostit/board] distributeAcrossLanes requires min 5 lanes; got ${lanes.length}`,
        )
    }
    if (count < 0) return []

    const assignments: LaneAssignment[] = []
    const span = topMax - topMin
    for (let i = 0; i < count; i++) {
        const laneIndex = i % lanes.length
        const leftPercent = lanes[laneIndex] as number
        const baseTop = count === 1 ? (topMin + topMax) / 2 : topMin + (span * i) / Math.max(1, count - 1)
        const jitterOffset = randomInRange(-jitter, jitter, rng)
        const topPercent = baseTop + jitterOffset
        const rotation = pickRandom(rotations, rng)
        assignments.push({ laneIndex, leftPercent, topPercent, rotation })
    }
    return assignments
}

/** Content for a board item before positions are assigned (top/left/rotation filled by buildBoardItems). */
export interface BoardContent {
    key: string
    title: string
    content: string
    color?: PostitColor
    /** Optional explicit rotation; otherwise distribution picks one. */
    rotation?: PostitRotation
    image?: string
    svg?: string
    actions?: BoardItem['actions']
}

/**
 * Turn a flat content-list into positioned `BoardItem`s: assigns `top`/`left`
 * percentages (lane-distributed) and a `rotation` class where not authored.
 * Pure given the rng — same determinism seam as distributeAcrossLanes.
 */
export function buildBoardItems(
    items: ReadonlyArray<BoardContent>,
    options: DistributeOptions = {},
): BoardItem[] {
    const distribution = distributeAcrossLanes(items.length, options)
    return items.map((item, i) => {
        const a = distribution[i] as LaneAssignment
        return {
            key: item.key,
            title: item.title,
            content: item.content,
            color: item.color,
            rotation: item.rotation ?? a.rotation,
            top: `${a.topPercent.toFixed(1)}%`,
            left: `${a.leftPercent}%`,
            image: item.image,
            svg: item.svg,
            actions: item.actions,
        }
    })
}
