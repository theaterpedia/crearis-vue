/**
 * fpostit controller tests · key-relaxation + cap-raise (2026-06-06 fpostit-extend).
 *
 * Branch A relaxes the controller so inline-callout pages can register many triggers
 * with free-form keys (e.g. magnifica /discourse · ~10 callouts, beyond the legacy
 * p1-9 / max-9). Legacy p-keys stay valid (superset). The open-at-once soft-cap (9)
 * is preserved. happy-dom provides `window`, so create()/openPostit() run.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { useFpostitController, _resetController } from '../../src/fpostit/composables/useFpostitController'

beforeEach(() => {
    _resetController()
})

function make(key: string) {
    return { key, title: 'T', content: '<p>c</p>' }
}

describe('key validation (relaxed · superset of legacy p1-p9)', () => {
    it('accepts legacy p1-p9 keys', () => {
        const c = useFpostitController()
        c.create(make('p1'))
        c.create(make('p9'))
        expect(c.getKeys()).toEqual(expect.arrayContaining(['p1', 'p9']))
    })

    it('accepts free-form identifier keys (NEW)', () => {
        const c = useFpostitController()
        c.create(make('organicIntellectual'))
        c.create(make('c10'))
        c.create(make('twabu-2024'))
        expect(c.getKeys()).toEqual(expect.arrayContaining(['organicIntellectual', 'c10', 'twabu-2024']))
    })

    it('rejects keys not starting with a letter / containing bad chars', () => {
        const c = useFpostitController()
        c.create(make('1leading'))
        c.create(make('has space'))
        expect(c.getKeys()).toHaveLength(0)
    })
})

describe('registration cap (29 · citation-scale)', () => {
    it('registers up to 29 and rejects the 30th', () => {
        const c = useFpostitController()
        for (let i = 1; i <= 30; i++) c.create(make(`c${i}`))
        expect(c.getKeys()).toHaveLength(29)
    })
})

describe('open soft-cap (still 9 · closes oldest)', () => {
    it('never holds more than 9 open at once', () => {
        const c = useFpostitController()
        for (let i = 1; i <= 12; i++) c.create(make(`c${i}`))
        for (let i = 1; i <= 12; i++) c.openPostit(`c${i}`)
        expect(c.openKeys.size).toBe(9)
        // oldest (c1..c3) evicted; most-recent stays open
        expect(c.isOpen('c12')).toBe(true)
        expect(c.isOpen('c1')).toBe(false)
    })
})

describe('open / close basics', () => {
    it('opens, reports, and closes a registered post-it', () => {
        const c = useFpostitController()
        c.create(make('p1'))
        expect(c.isOpen('p1')).toBe(false)
        c.openPostit('p1')
        expect(c.isOpen('p1')).toBe(true)
        c.closePostit('p1')
        expect(c.isOpen('p1')).toBe(false)
    })

    it('closeAll clears open keys', () => {
        const c = useFpostitController()
        c.create(make('p1'))
        c.create(make('p2'))
        c.openPostit('p1')
        c.openPostit('p2')
        c.closeAll()
        expect(c.openKeys.size).toBe(0)
    })
})
