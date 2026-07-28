/**
 * `useUiaEvents` — the agenda's data source (task A).
 *
 * Source: CV's own `events` table via `/api/events?project=utopiaxaction` — the
 * SAME endpoint EventPanel writes to, so read and write share one store. (An
 * earlier cut read `/api/odoo/events`; that is an admin-only, unscoped, read-only
 * surface. Odoo is reached by a 2-way sync behind this endpoint, not by the view.)
 *
 * Two behaviours here are load-bearing and easy to break later:
 *
 *   1. **Heading composition.** `ItemList` is given `items=`, so nothing composes
 *      the crearis-md `"overline **HEADLINE**"` for us. If this drifts, rows
 *      silently collapse to bare titles — which is exactly what the
 *      `entity=`-fetch path does, and the reason A does not use it.
 *      Note it is two parts, not three: `Heading.vue` gates
 *      `hasSubline = !hasOverline && …`, so overline and subline are either/or
 *      and a third part would vanish. Pinned below.
 *   2. **The fallback.** A failing endpoint must leave the authored agenda on
 *      screen, and must NOT pretend it came from the DB. A silent fallback would
 *      let the live agenda go stale unnoticed.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { UIA_DOMAIN_CODE, composeHeading, useUiaEvents } from '@/views/Uia/useUiaEvents'
import { agendaItems } from '@/views/Uia/content/agenda'

/** A CV `events` row as /api/events returns it (raw e.*, bare array). */
function cvEvent(overrides: Record<string, unknown> = {}) {
    return {
        id: 1000,
        name: 'Meine Grenzen',
        date_begin: '2026-09-23T19:00:00',
        date_end: '2026-09-23T21:00:00',
        teaser: 'ein Tanztheater Projekt',
        cimg: null,
        domaincode: 'utopiaxaction',
        ...overrides,
    } as never
}

/** /api/events answers with a BARE ARRAY — no { success, events } envelope. */
function mockFetchOk(events: unknown[]) {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve(events),
    })))
}

afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
})

describe('composeHeading · the crearis-md contract', () => {
    it('builds "overline **HEADLINE**" with the date-line leading', () => {
        const heading = composeHeading(cvEvent())
        expect(heading).toContain('**Meine Grenzen**')
        expect(heading.indexOf('MI 23.09.26')).toBeLessThan(heading.indexOf('**'))
    })

    it('emits NO third part — Heading.vue cannot render overline + subline together', () => {
        // hasSubline = !hasOverline && (...) — so a three-part heading loses its
        // third part silently. Verified in the browser. We do not pass data that vanishes.
        const heading = composeHeading(cvEvent())
        expect(heading.endsWith('**')).toBe(true)
        expect(heading).not.toContain('ein Tanztheater Projekt')
    })

    it('uses the teaser as the overline when there is no date-line to lead with', () => {
        const heading = composeHeading(cvEvent({ date_begin: null, date_end: null, teaser: 'FLINTA*-Space' }))
        expect(heading).toBe('FLINTA*-Space **Meine Grenzen**')
    })

    it('prints the date exactly as the file-backed path does', () => {
        // Same formatUiaDay the frontend uses, so the fallback is not a different site.
        expect(composeHeading(cvEvent())).toContain('MI 23.09.26')
    })

    it('always emits a parseable **HEADLINE**, even with nothing else', () => {
        const bare = composeHeading(cvEvent({ date_begin: null, date_end: null, teaser: null }))
        expect(bare).toBe('**Meine Grenzen**')
        expect(/\*\*(.+?)\*\*/.exec(bare)?.[1]).toBe('Meine Grenzen')
    })

    it('never fabricates a weekday for an undated row', () => {
        const heading = composeHeading(cvEvent({ date_begin: null, date_end: null, teaser: 'vsl. 22.01.2027' }))
        expect(heading).toContain('vsl. 22.01.2027')
        expect(heading).not.toMatch(/\b(MO|DI|MI|DO|FR|SA|SO)\b/)
    })

    it('derives the time-range from date_begin/date_end', () => {
        expect(composeHeading(cvEvent({ teaser: null }))).toBe('MI 23.09.26 · 19:00 – 21:00 Uhr **Meine Grenzen**')
    })

    it('prints a single time when begin and end share it', () => {
        expect(composeHeading(cvEvent({ teaser: null, date_end: '2026-09-23T19:00:00' })))
            .toBe('MI 23.09.26 · 19:00 Uhr **Meine Grenzen**')
    })
})

describe('useUiaEvents · the happy path', () => {
    it('requests /api/events scoped to the ratified domaincode', async () => {
        mockFetchOk([cvEvent()])
        const { load } = useUiaEvents()
        await load()
        const url = String((globalThis.fetch as unknown as { mock: { calls: string[][] } }).mock.calls[0]![0])
        expect(url).toContain('/api/events?')
        expect(url).toContain(`project=${UIA_DOMAIN_CODE}`)
        expect(UIA_DOMAIN_CODE).toBe('utopiaxaction')
    })

    it('maps rows to ListItems and marks the source as db', async () => {
        mockFetchOk([cvEvent(), cvEvent({ id: 1001, name: 'Ma(g)dalena-LAB' })])
        const { items, source, isFallback, load } = useUiaEvents()
        await load()
        expect(source.value).toBe('db')
        expect(isFallback.value).toBe(false)
        expect(items.value).toHaveLength(2)
        expect(items.value[0]?.heading).toContain('**Meine Grenzen**')
    })

    it('drops cimg when absent so ItemRow never gets a broken <img src>', async () => {
        mockFetchOk([cvEvent({ cimg: null })])
        const { items, load } = useUiaEvents()
        await load()
        expect('cimg' in (items.value[0] as object)).toBe(false)
    })

    it('keeps a real cimg through', async () => {
        mockFetchOk([cvEvent({ cimg: 'https://example.test/x.jpg' })])
        const { items, load } = useUiaEvents()
        await load()
        expect(items.value[0]?.cimg).toBe('https://example.test/x.jpg')
    })

    it('honours limit client-side', async () => {
        mockFetchOk([cvEvent({ id: 1 }), cvEvent({ id: 2 }), cvEvent({ id: 3 })])
        const { items, load } = useUiaEvents()
        await load({ limit: 2 })
        expect(items.value).toHaveLength(2)
    })
})

describe('useUiaEvents · the fallback keeps the page correct without hiding failure', () => {
    beforeEach(() => {
        vi.spyOn(console, 'warn').mockImplementation(() => {})
    })

    it('renders the authored agenda before any fetch resolves', () => {
        mockFetchOk([cvEvent()])
        const { items, isFallback } = useUiaEvents()
        // Synchronous initial state — the band is never empty.
        expect(isFallback.value).toBe(true)
        expect(items.value).toHaveLength(agendaItems.length)
    })

    it('falls back on a rejected request, and says so', async () => {
        vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('no backend'))))
        const { items, source, isFallback, error, load } = useUiaEvents()
        await load()
        expect(source.value).toBe('content')
        expect(isFallback.value).toBe(true)
        expect(error.value).toBe('no backend')
        expect(items.value).toHaveLength(agendaItems.length)
        expect(console.warn).toHaveBeenCalled()
    })

    it('falls back on a non-OK status', async () => {
        vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: false, status: 500, json: () => Promise.resolve({}) })))
        const { source, error, load } = useUiaEvents()
        await load()
        expect(source.value).toBe('content')
        expect(error.value).toContain('500')
    })

    it('falls back on an empty result — a scoping mistake reads like "no events"', async () => {
        mockFetchOk([])
        const { items, source, error, load } = useUiaEvents()
        await load()
        expect(source.value).toBe('content')
        expect(error.value).toBe('no events returned')
        expect(items.value).toHaveLength(agendaItems.length)
    })

    it('falls back on an unexpected response shape (object, not array)', async () => {
        vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({ success: false }) })))
        const { source, load } = useUiaEvents()
        await load()
        expect(source.value).toBe('content')
    })

    it('never leaves the agenda empty, whatever went wrong', async () => {
        for (const bad of [
            () => Promise.reject(new Error('x')),
            () => Promise.resolve({ ok: false, status: 404, json: () => Promise.resolve({}) }),
            () => Promise.resolve({ ok: true, json: () => Promise.resolve([]) }),
        ]) {
            vi.stubGlobal('fetch', vi.fn(bad))
            const { items, load } = useUiaEvents()
            await load()
            expect(items.value.length).toBeGreaterThan(0)
        }
    })
})

describe('useUiaEvents · the „Was ansteht" band shows what is ahead', () => {
    const TODAY = new Date('2026-07-28T10:00:00Z')

    function rows() {
        return [
            cvEvent({ id: 1, name: 'Meine Grenzen', date_begin: '2026-09-23T19:00:00' }),
            // finished — has its own „Was schon war" band, must not appear here
            cvEvent({ id: 2, name: "Let's perform Utopia", date_begin: '2026-06-10T19:00:00' }),
            cvEvent({ id: 3, name: 'Ma(g)dalena-LAB', date_begin: '2026-06-04T10:00:00' }),
            // genuinely ahead but with no firm date — 'vsl. 22.01.2027'
            cvEvent({ id: 4, name: 'Abschluss-Aufführung', date_begin: null, date_end: null }),
        ]
    }

    it('drops known-past rows so finished arcs are not listed as upcoming', async () => {
        mockFetchOk(rows())
        const { items, load } = useUiaEvents()
        await load({ today: TODAY })
        const headings = items.value.map((i) => i.heading).join(' | ')
        expect(headings).toContain('Meine Grenzen')
        expect(headings).not.toContain("Let's perform Utopia")
        expect(headings).not.toContain('Ma(g)dalena-LAB')
    })

    it('KEEPS an undated row — unknown is not the same as past', async () => {
        mockFetchOk(rows())
        const { items, load } = useUiaEvents()
        await load({ today: TODAY })
        // The arc's climax carries no firm date; dropping it would hide it.
        expect(items.value.map((i) => i.heading).join(' | ')).toContain('Abschluss-Aufführung')
    })

    it('keeps a row dated today — the Mittwoch is still on, on the Mittwoch', async () => {
        mockFetchOk([cvEvent({ date_begin: '2026-07-28T19:00:00' })])
        const { items, load } = useUiaEvents()
        await load({ today: TODAY })
        expect(items.value).toHaveLength(1)
    })

    it('falls back when everything returned is already past', async () => {
        vi.spyOn(console, 'warn').mockImplementation(() => {})
        mockFetchOk([cvEvent({ date_begin: '2026-06-10T19:00:00' })])
        const { source, error, items, load } = useUiaEvents()
        await load({ today: TODAY })
        expect(source.value).toBe('content')
        expect(error.value).toBe('no upcoming events returned')
        // the count that explains WHY goes to the log, not the error field
        expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('none of them ahead'))
        expect(items.value.length).toBeGreaterThan(0)
    })
})
