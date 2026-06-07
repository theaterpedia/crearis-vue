/**
 * magnifica/lanes pure-function tests.
 *
 * Per CV@wsl dispatch #4 (TO (website) 2026-06-02 DI) §5 verification:
 * lane-distribution behavior across 5 lanes + jitter + deterministic
 * rotation pick. The Vue side stays integration territory; this suite
 * pins the pure decision-logic that CardsCanvas builds on.
 */

import { describe, it, expect } from 'vitest'
import {
    DEFAULT_LANES,
    DEFAULT_ROTATIONS_DEG,
    distributeAcrossLanes,
    pickRandom,
    randomInRange,
    randomRotationDeg,
} from '../../src/components/magnifica/lanes'

/** Deterministic counter-based RNG · cycles through fixed values for predictable tests. */
function makeRng(values: number[]): () => number {
    let i = 0
    return () => {
        const v = values[i % values.length] as number
        i += 1
        return v
    }
}

describe('pickRandom', () => {
    it('returns the indexed element for rng = 0 (first)', () => {
        expect(pickRandom([1, 2, 3, 4], () => 0)).toBe(1)
    })

    it('returns the last element for rng just under 1', () => {
        expect(pickRandom([1, 2, 3, 4], () => 0.9999)).toBe(4)
    })

    it('returns the middle element for rng = 0.5 with 4 items', () => {
        // Math.floor(0.5 * 4) = 2 → index 2 = third element
        expect(pickRandom(['a', 'b', 'c', 'd'], () => 0.5)).toBe('c')
    })

    it('throws on empty array (fail-fast)', () => {
        expect(() => pickRandom([], () => 0)).toThrow(/empty array/)
    })
})

describe('randomInRange', () => {
    it('returns min when rng = 0', () => {
        expect(randomInRange(-3, 3, () => 0)).toBe(-3)
    })

    it('returns just under max when rng just under 1', () => {
        expect(randomInRange(-3, 3, () => 0.9999)).toBeCloseTo(3, 2)
    })

    it('returns the midpoint when rng = 0.5', () => {
        expect(randomInRange(-3, 3, () => 0.5)).toBe(0)
    })
})

describe('randomRotationDeg', () => {
    it('returns -3 (first DEFAULT_ROTATIONS_DEG element) when rng = 0', () => {
        expect(randomRotationDeg(() => 0)).toBe(-3)
    })

    it('returns 3 (last element) when rng just under 1', () => {
        expect(randomRotationDeg(() => 0.9999)).toBe(3)
    })

    it('only returns values from DEFAULT_ROTATIONS_DEG (no out-of-band)', () => {
        const seen = new Set<number>()
        const rng = makeRng([0, 0.1, 0.25, 0.5, 0.75, 0.9, 0.99])
        for (let i = 0; i < 7; i++) seen.add(randomRotationDeg(rng))
        for (const v of seen) {
            expect(DEFAULT_ROTATIONS_DEG).toContain(v)
        }
    })
})

describe('distributeAcrossLanes', () => {
    it('returns an empty array for count = 0', () => {
        expect(distributeAcrossLanes(0)).toEqual([])
    })

    it('returns an empty array for negative count', () => {
        expect(distributeAcrossLanes(-1)).toEqual([])
    })

    it('assigns lanes round-robin (item-index modulo lane-count)', () => {
        const rng = makeRng([0.5])
        const out = distributeAcrossLanes(10, { rng })
        expect(out).toHaveLength(10)
        // 5 default lanes → index 0,5 → lane 0; index 1,6 → lane 1; etc.
        expect(out[0]!.laneIndex).toBe(0)
        expect(out[1]!.laneIndex).toBe(1)
        expect(out[2]!.laneIndex).toBe(2)
        expect(out[3]!.laneIndex).toBe(3)
        expect(out[4]!.laneIndex).toBe(4)
        expect(out[5]!.laneIndex).toBe(0)
        expect(out[6]!.laneIndex).toBe(1)
    })

    it('uses the lane left-% values from DEFAULT_LANES', () => {
        const rng = makeRng([0.5])
        const out = distributeAcrossLanes(5, { rng })
        expect(out.map((a) => a.leftPercent)).toEqual([...DEFAULT_LANES])
    })

    it('applies jitter inside ±topJitterPercent (with seeded rng)', () => {
        // rng=0 → jitter = -3% (min); rng=1-ε → jitter = +3% (just under max)
        // Item 0 baseTop with count=5 → topMin (10%); with rng=0 jitter=-3% → topPercent=7%
        const rng = makeRng([0]) // every call returns 0
        const out = distributeAcrossLanes(5, { rng, topJitterPercent: 3 })
        // With seeded rng=0, every randomInRange returns the min (-3%), every pickRandom returns first (rotateDeg=-3)
        expect(out[0]!.topPercent).toBeCloseTo(7, 5) // 10% baseTop - 3% jitter
        expect(out[0]!.rotateDeg).toBe(-3)
    })

    it('spreads baseTop uniformly across topRange', () => {
        // With rng always 0.5 (zero jitter), baseTop should be the linear ramp
        const rng = () => 0.5
        const out = distributeAcrossLanes(5, { rng, topRange: [0, 100] })
        // Linear ramp 0 → 100 across 5 items: 0, 25, 50, 75, 100
        const expected = [0, 25, 50, 75, 100]
        for (let i = 0; i < 5; i++) {
            // randomInRange(-3, 3, () => 0.5) = 0 (midpoint)
            // pickRandom([...rotations], () => 0.5) → midpoint pick
            expect(out[i]!.topPercent).toBeCloseTo(expected[i] as number, 5)
        }
    })

    it('places single item at midpoint of topRange', () => {
        const rng = () => 0.5
        const out = distributeAcrossLanes(1, { rng, topRange: [10, 80] })
        expect(out).toHaveLength(1)
        // Single item · midpoint = (10+80)/2 = 45 · jitter = 0
        expect(out[0]!.topPercent).toBeCloseTo(45, 5)
    })

    it('throws when given fewer than 5 lanes (HM spec floor)', () => {
        expect(() =>
            distributeAcrossLanes(3, { lanes: [10, 50, 90] }),
        ).toThrow(/min 5 lanes/)
    })

    it('accepts >5 lanes (HM spec is a floor, not a ceiling)', () => {
        const sixLanes = [5, 20, 35, 50, 65, 80]
        const out = distributeAcrossLanes(6, { lanes: sixLanes, rng: () => 0.5 })
        expect(out).toHaveLength(6)
        // Round-robin over 6 lanes
        expect(out.map((a) => a.laneIndex)).toEqual([0, 1, 2, 3, 4, 5])
    })

    it('uses authored rotation pool when overridden', () => {
        const rng = () => 0
        const out = distributeAcrossLanes(5, { rng, rotations: [10, 20] })
        // rng=0 → pickRandom returns first → 10
        for (const a of out) expect(a.rotateDeg).toBe(10)
    })
})
