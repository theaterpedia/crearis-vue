/**
 * The Odoo-events mock — `server/utils/odooEventsMock.ts`.
 *
 * HD 2026-07-28: "the devbox never reaches Odoo, we only mock this." So this mock
 * is the ONLY thing the uia agenda (task A) can be built and seen against locally,
 * which makes one property load-bearing above all others:
 *
 *   **the mock's shape must equal the real endpoint's output shape.**
 *
 * If it drifts, every view built on it breaks on the first real prod response —
 * and a mock that teaches the wrong contract is worse than no mock. So these
 * tests pin the field set against what `server/api/odoo/events.get.ts` actually
 * emits, not against what would be convenient.
 *
 * They also pin the two places the mock deliberately does NOT invent data.
 */

import { describe, expect, it } from 'vitest'
import {
    UIA_WEBSITE,
    buildUiaMockEvents,
    filterMockEvents,
    type OdooEventShape,
} from '../../server/utils/odooEventsMock'
import { live, closedArcs } from '../../src/views/Uia/content/agenda'

/**
 * Every key `events.get.ts` puts in its `transformed` objects. Transcribed from
 * that handler — if it gains a field, this list must gain it too, and this test
 * is where that gets caught.
 */
const REAL_ENDPOINT_KEYS = [
    'id', 'odoo_id', 'name', 'date_begin', 'date_end', 'timezone',
    'stage_id', 'kanban_state',
    'seats_max', 'seats_available', 'seats_reserved', 'seats_used', 'seats_limited',
    'location', 'organizer', 'responsible', 'event_type_id', 'domain_code',
    'description', 'note',
    'active', 'is_published', 'website_url',
    'cid', 'rectitle', 'teasertext', 'cimg', 'md', 'schedule',
    'header_type', 'header_size', 'edit_mode', 'version',
] as const

const events = buildUiaMockEvents()

describe('mock shape · must match the real endpoint field-for-field', () => {
    it('every row carries exactly the real endpoint`s key set', () => {
        for (const e of events) {
            const keys = Object.keys(e).sort()
            expect(keys, `row ${e.id} (${e.name})`).toEqual([...REAL_ENDPOINT_KEYS].sort())
        }
    })

    it('renders many2ones as { id, name } objects, as the endpoint does', () => {
        const dated = events.find((e) => e.date_begin)
        expect(dated?.domain_code).toEqual({ id: UIA_WEBSITE.id, name: UIA_WEBSITE.name })
        expect(dated?.stage_id).toMatchObject({ id: expect.any(Number), name: expect.any(String) })
        expect(dated?.location).toMatchObject({ id: expect.any(Number), name: expect.any(String) })
    })

    it('scopes every row to the ratified uia website row', () => {
        expect(UIA_WEBSITE.name).toBe('utopiaxaction')
        for (const e of events) {
            expect(e.domain_code?.name).toBe('utopiaxaction')
        }
    })
})

describe('mock content · comes from the authored agenda, not from lorem', () => {
    it('emits one event per Mittwoch, plus the Aufführung, plus the closed arcs', () => {
        expect(live.dates).toHaveLength(15)
        expect(events).toHaveLength(live.dates.length + 1 + closedArcs.length)
    })

    it('uses the project`s real headline and teaser', () => {
        const mittwoch = events.find((e) => e.date_begin?.startsWith('2026-09-23'))
        expect(mittwoch?.name).toBe(live.headline)
        expect(mittwoch?.teasertext).toBe(live.subline)
    })

    it('converts DD.MM.YY + the flyer`s time-range into Odoo naive datetimes', () => {
        const first = events.find((e) => e.cid?.endsWith('-01'))
        // live.time is '19:00 – 21:00 Uhr' (en-dash)
        expect(first?.date_begin).toBe('2026-09-23 19:00:00')
        expect(first?.date_end).toBe('2026-09-23 21:00:00')
        expect(first?.timezone).toBe('Europe/Berlin')
    })

    it('carries the closed arcs with their own headlines', () => {
        for (const arc of closedArcs) {
            expect(events.some((e) => e.name === arc.headline), `missing: ${arc.headline}`).toBe(true)
        }
    })

    it('gives every row a 069-shaped cid under the ratified domaincode', () => {
        for (const e of events) {
            expect(e.cid, `row ${e.id}`).toMatch(/^utopiaxaction\.event(-[a-z]+)?__[a-z0-9-]+$/)
        }
    })

    it('keeps cids unique — 15 same-named Mittwochs must not collide', () => {
        const cids = events.map((e) => e.cid)
        expect(new Set(cids).size).toBe(cids.length)
    })
})

describe('mock honesty · what it refuses to invent', () => {
    it('leaves cimg null while every content image is still TODO HP (§8)', () => {
        for (const e of events) expect(e.cimg).toBeNull()
    })

    it('leaves ALL seat/registration counts null — no faked Schwelle state', () => {
        // uia has no participant-count source. `seats_reserved: 7` would fabricate
        // precisely the threshold state the cutter-prompt forbids guessing at.
        for (const e of events) {
            expect(e.seats_max).toBeNull()
            expect(e.seats_available).toBeNull()
            expect(e.seats_reserved).toBeNull()
            expect(e.seats_used).toBeNull()
        }
    })

    it('does not fake a date for the provisional Aufführung', () => {
        const auff = events.find((e) => e.name.includes(live.performance.label))
        expect(auff).toBeDefined()
        // 'vsl. 22.01.2027' is a statement, not a date — carried as text.
        expect(auff?.date_begin).toBeNull()
        expect(auff?.schedule).toBe(live.performance.date)
    })
})

describe('mock filters · exercise the real query contract', () => {
    const NOW = new Date('2026-11-15T10:00:00Z')

    it('filters by domain_code and returns nothing for a foreign one', () => {
        expect(filterMockEvents(events, { domainCode: 'utopiaxaction' }).total).toBe(events.length)
        expect(filterMockEvents(events, { domainCode: 'freundeskreis' }).total).toBe(0)
    })

    it('upcoming drops past Mittwochs', () => {
        const { events: future } = filterMockEvents(events, { upcoming: true, now: NOW })
        expect(future.length).toBeGreaterThan(0)
        expect(future.length).toBeLessThan(events.length)
        for (const e of future) expect(e.date_begin! >= '2026-11-15').toBe(true)
    })

    it('upcoming excludes undated rows rather than ranking them first', () => {
        const { events: future } = filterMockEvents(events, { upcoming: true, now: NOW })
        for (const e of future) expect(e.date_begin).not.toBeNull()
    })

    it('orders by date_begin ascending, undated last', () => {
        const { events: all } = filterMockEvents(events, { limit: 100 })
        const dated = all.filter((e) => e.date_begin).map((e) => e.date_begin!)
        expect([...dated]).toEqual([...dated].sort())
        const firstUndated = all.findIndex((e) => !e.date_begin)
        if (firstUndated !== -1) {
            expect(all.slice(firstUndated).every((e) => !e.date_begin)).toBe(true)
        }
    })

    it('paginates, and total counts the whole match not the page', () => {
        const page = filterMockEvents(events, { limit: 3, offset: 0 })
        expect(page.events).toHaveLength(3)
        expect(page.total).toBe(events.length)
        const second = filterMockEvents(events, { limit: 3, offset: 3 })
        expect(second.events[0]?.id).not.toBe(page.events[0]?.id)
    })

    it('caps limit at 100 and floors offset at 0, as the endpoint does', () => {
        expect(filterMockEvents(events, { limit: 5000 }).events.length).toBeLessThanOrEqual(100)
        expect(filterMockEvents(events, { offset: -10, limit: 1 }).events[0]?.id)
            .toBe(filterMockEvents(events, { offset: 0, limit: 1 }).events[0]?.id)
    })
})

describe('mock determinism', () => {
    it('builds identically on every call — a fixture, not a generator', () => {
        expect(JSON.stringify(buildUiaMockEvents())).toBe(JSON.stringify(buildUiaMockEvents()))
    })

    it('does not mutate the input array when filtering', () => {
        const before = events.map((e: OdooEventShape) => e.id).join(',')
        filterMockEvents(events, { upcoming: true, now: new Date('2027-06-01T00:00:00Z') })
        expect(events.map((e) => e.id).join(',')).toBe(before)
    })
})
