/**
 * fpostit/board pure-function tests · static-board mode (2026-06-06 fpostit-extend).
 *
 * Pins the lane-distribution + buildBoardItems logic the magnifica cards-blackboard
 * now rides on (moved here from src/components/magnifica/lanes.ts during the
 * fpostit-unification). Determinism is the test-seam: an injected counter-RNG makes
 * the distribution verifiable.
 */

import { describe, it, expect } from 'vitest'
import {
    DEFAULT_LANES,
    DEFAULT_ROTATIONS,
    distributeAcrossLanes,
    buildBoardItems,
    pickRandom,
    randomInRange,
    type BoardContent,
} from '../../src/fpostit/utils/board'

/** Deterministic counter-based RNG · cycles fixed values for predictable tests. */
function makeRng(values: number[]): () => number {
    let i = 0
    return () => {
        const v = values[i % values.length] as number
        i += 1
        return v
    }
}

describe('pickRandom', () => {
    it('picks by rng-scaled index', () => {
        expect(pickRandom(['a', 'b', 'c'], makeRng([0]))).toBe('a')
        expect(pickRandom(['a', 'b', 'c'], makeRng([0.99]))).toBe('c')
    })
    it('throws on empty array', () => {
        expect(() => pickRandom([], makeRng([0]))).toThrow()
    })
})

describe('randomInRange', () => {
    it('maps rng 0 → min and rng→1 → max', () => {
        expect(randomInRange(-3, 3, makeRng([0]))).toBe(-3)
        expect(randomInRange(-3, 3, makeRng([1]))).toBe(3)
    })
})

describe('distributeAcrossLanes', () => {
    it('returns one assignment per item', () => {
        expect(distributeAcrossLanes(7, { rng: makeRng([0.5]) })).toHaveLength(7)
        expect(distributeAcrossLanes(0)).toHaveLength(0)
        expect(distributeAcrossLanes(-2)).toHaveLength(0)
    })

    it('assigns lanes round-robin across the 5 default lanes', () => {
        const out = distributeAcrossLanes(6, { rng: makeRng([0.5]) })
        expect(out.map(a => a.laneIndex)).toEqual([0, 1, 2, 3, 4, 0])
        expect(out[0]!.leftPercent).toBe(DEFAULT_LANES[0])
        expect(out[5]!.leftPercent).toBe(DEFAULT_LANES[0])
    })

    it('picks rotations from the default pool', () => {
        const out = distributeAcrossLanes(5, { rng: makeRng([0.5]) })
        for (const a of out) expect(DEFAULT_ROTATIONS).toContain(a.rotation)
    })

    it('keeps top within base-range ± jitter', () => {
        const out = distributeAcrossLanes(5, { rng: makeRng([0.5]), topJitterPercent: 3, topRange: [10, 80] })
        for (const a of out) {
            expect(a.topPercent).toBeGreaterThanOrEqual(10 - 3)
            expect(a.topPercent).toBeLessThanOrEqual(80 + 3)
        }
    })

    it('is deterministic given the same rng sequence', () => {
        const seq = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8]
        const a = distributeAcrossLanes(4, { rng: makeRng(seq) })
        const b = distributeAcrossLanes(4, { rng: makeRng(seq) })
        expect(a).toEqual(b)
    })

    it('throws when given fewer than 5 lanes', () => {
        expect(() => distributeAcrossLanes(3, { lanes: [10, 50] })).toThrow()
    })
})

describe('buildBoardItems', () => {
    const content: BoardContent[] = [
        { key: 'a', title: 'A', content: '<p>a</p>', color: 'primary' },
        { key: 'b', title: 'B', content: '<p>b</p>', color: 'positive' },
    ]

    it('fills top/left as percentage strings and carries content through', () => {
        const items = buildBoardItems(content, { rng: makeRng([0.5]) })
        expect(items).toHaveLength(2)
        expect(items[0]!.key).toBe('a')
        expect(items[0]!.title).toBe('A')
        expect(items[0]!.content).toBe('<p>a</p>')
        expect(items[0]!.color).toBe('primary')
        expect(items[0]!.top).toMatch(/^\d+(\.\d+)?%$/)
        expect(items[0]!.left).toMatch(/^\d+(\.\d+)?%$/)
        expect(DEFAULT_ROTATIONS).toContain(items[0]!.rotation)
    })

    it('preserves an authored rotation instead of picking one', () => {
        const items = buildBoardItems(
            [{ key: 'x', title: 'X', content: 'x', rotation: 'rotate-2' }],
            { rng: makeRng([0.5]) },
        )
        expect(items[0]!.rotation).toBe('rotate-2')
    })
})
