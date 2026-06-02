/**
 * Lane-distribution + randomness helpers for the magnifica CardsCanvas.
 *
 * Per CV@wsl dispatch #4 (TO (website) 2026-06-02 DI) §3:
 * - Min 5 horizontal lanes for post-it distribution
 * - Apply randomness to positioning within lanes (subtle, curated · not chaotic)
 *
 * ==Reuse-not-rebuild note==: the existing fpostit primitive at
 * `src/fpostit/utils/positioning.ts:153` (`getRandomRotation`) uses
 * `Math.random + Math.floor` to pick from a Tailwind class-string array.
 * The pattern reuses; the format differs (Tailwind classes vs deg values
 * for plain-CSS custom-properties). Inlining a sibling here rather than
 * refactoring fpostit's consumer-contract — keeps scope tight per
 * dispatch §4 (stop after components · do not start hardcoded site yet).
 * If HM/TO (website) want consolidation later, both shapes can move to a
 * shared `src/utils/random.ts` cleanly.
 */

/**
 * Default horizontal lanes for the cards-canvas blackboard.
 * 5-lane set per dispatch §3 example. The lanes are LEFT positions as
 * CSS percentages — each post-it pins at its lane's `left` value.
 * Picked to spread across the canvas with some asymmetry so the visual
 * doesn't read as a strict grid.
 */
export const DEFAULT_LANES: ReadonlyArray<number> = [5, 25, 45, 62, 85]

/**
 * Discrete rotation choices (degrees) for the cards-canvas.
 * Mirrors the spread of fpostit's `getRandomRotation()` but in deg-values
 * matching the howto-blackboard CSS-custom-property contract
 * (`--bb-rotate: <N>deg`).
 */
export const DEFAULT_ROTATIONS_DEG: ReadonlyArray<number> = [
    -3,
    -2,
    -1,
    0,
    1,
    2,
    3,
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
        throw new Error('[magnifica/lanes] pickRandom called with empty array')
    }
    return items[Math.floor(rng() * items.length)] as T
}

/** Pick a random rotation in degrees from {@link DEFAULT_ROTATIONS_DEG}. */
export function randomRotationDeg(rng: RandomSource = Math.random): number {
    return pickRandom(DEFAULT_ROTATIONS_DEG, rng)
}

/**
 * Pick a uniform value in `[min, max]`. Pure given rng.
 * Used for the per-item `top` jitter within a lane.
 */
export function randomInRange(min: number, max: number, rng: RandomSource = Math.random): number {
    return min + rng() * (max - min)
}

/** Result of distributing N items across the canvas. Each entry maps to one input item by index. */
export interface LaneAssignment {
    /** Lane index (`0..lanes.length-1`). */
    laneIndex: number
    /** Horizontal position in % (from `lanes[laneIndex]`). */
    leftPercent: number
    /** Vertical position in % (with jitter). */
    topPercent: number
    /** Rotation in degrees (from {@link DEFAULT_ROTATIONS_DEG}). */
    rotateDeg: number
}

export interface DistributeOptions {
    /** Horizontal lanes as left-% values. Default {@link DEFAULT_LANES}. */
    lanes?: ReadonlyArray<number>
    /** Discrete rotation values in degrees. Default {@link DEFAULT_ROTATIONS_DEG}. */
    rotations?: ReadonlyArray<number>
    /** Top-position jitter half-range in % (default 3 = ±3%). */
    topJitterPercent?: number
    /**
     * Random-source. Default `Math.random`. Tests inject a deterministic
     * source so distributions are verifiable.
     */
    rng?: RandomSource
    /**
     * Base spread for `top` placement. Default spreads items uniformly
     * across [10%, 80%] of the canvas before jitter is applied. The exact
     * base values come from a linear ramp anchored to item-index/count.
     */
    topRange?: [number, number]
}

/**
 * Distribute `count` items across the lane-set with per-item jitter on
 * `top` and a discrete rotation pick. Round-robin lane assignment ensures
 * even spread when item-count ≥ lane-count; per-lane rotation pick adds
 * the curated-feeling subtle variety HM specified.
 *
 * Pure given the rng. Determinism is the test-seam.
 */
export function distributeAcrossLanes(
    count: number,
    options: DistributeOptions = {},
): LaneAssignment[] {
    const lanes = options.lanes ?? DEFAULT_LANES
    const rotations = options.rotations ?? DEFAULT_ROTATIONS_DEG
    const jitter = options.topJitterPercent ?? 3
    const rng = options.rng ?? Math.random
    const [topMin, topMax] = options.topRange ?? [10, 80]

    if (lanes.length < 5) {
        throw new Error(
            `[magnifica/lanes] distributeAcrossLanes requires min 5 lanes; got ${lanes.length}`,
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
        const rotateDeg = pickRandom(rotations, rng)
        assignments.push({ laneIndex, leftPercent, topPercent, rotateDeg })
    }
    return assignments
}
