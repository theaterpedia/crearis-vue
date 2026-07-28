/**
 * `useUiaEvents` — the agenda's data source (task A).
 *
 * The public agenda reads Odoo `event.event` through `/api/odoo/events`. Two
 * behaviours here are load-bearing and easy to break later:
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

function odooRow(overrides: Record<string, unknown> = {}) {
    return {
        id: 1000,
        name: 'Meine Grenzen',
        date_begin: '2026-09-23 19:00:00',
        teasertext: 'ein Tanztheater Projekt',
        schedule: '19:00 – 21:00 Uhr',
        cimg: null,
        stage_id: { id: 2, name: 'Booked' },
        domain_code: { id: 10, name: 'utopiaxaction' },
        ...overrides,
    } as never
}

function mockFetchOk(events: unknown[], extra: Record<string, unknown> = {}) {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true, events, total: events.length, ...extra }),
    })))
}

afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
})

describe('composeHeading · the crearis-md contract', () => {
    it('builds "overline **HEADLINE**" with the date-line leading', () => {
        const heading = composeHeading(odooRow())
        expect(heading).toContain('**Meine Grenzen**')
        expect(heading.indexOf('MI 23.09.26')).toBeLessThan(heading.indexOf('**'))
    })

    it('emits NO third part — Heading.vue cannot render overline + subline together', () => {
        // hasSubline = !hasOverline && (...) — so a three-part heading loses its
        // third part silently. Verified in the browser. We do not pass data that vanishes.
        const heading = composeHeading(odooRow())
        expect(heading.endsWith('**')).toBe(true)
        expect(heading).not.toContain('ein Tanztheater Projekt')
    })

    it('uses the teaser as the overline when there is no date-line to lead with', () => {
        const heading = composeHeading(odooRow({ date_begin: null, schedule: null, teasertext: 'FLINTA*-Space' }))
        expect(heading).toBe('FLINTA*-Space **Meine Grenzen**')
    })

    it('prints the date exactly as the file-backed path does', () => {
        // Same formatUiaDay the frontend uses, so the fallback is not a different site.
        expect(composeHeading(odooRow())).toContain('MI 23.09.26')
    })

    it('always emits a parseable **HEADLINE**, even with nothing else', () => {
        const bare = composeHeading(odooRow({ date_begin: null, teasertext: null, schedule: null }))
        expect(bare).toBe('**Meine Grenzen**')
        expect(/\*\*(.+?)\*\*/.exec(bare)?.[1]).toBe('Meine Grenzen')
    })

    it('leads an undated row with its schedule text rather than a fabricated date', () => {
        // uia's provisional Aufführung: 'vsl. 22.01.2027' is a statement, not a date.
        const heading = composeHeading(odooRow({ date_begin: null, schedule: 'vsl. 22.01.2027' }))
        expect(heading).toContain('vsl. 22.01.2027')
        expect(heading).not.toMatch(/\b(MO|DI|MI|DO|FR|SA|SO)\b/)
    })

    it('joins the date and the time-range in the overline', () => {
        expect(composeHeading(odooRow({ teasertext: null }))).toBe('MI 23.09.26 · 19:00 – 21:00 Uhr **Meine Grenzen**')
    })
})

describe('useUiaEvents · the happy path', () => {
    it('requests the ratified domaincode', async () => {
        mockFetchOk([odooRow()])
        const { load } = useUiaEvents()
        await load()
        const url = String((globalThis.fetch as unknown as { mock: { calls: string[][] } }).mock.calls[0]![0])
        expect(url).toContain(`domain_code=${UIA_DOMAIN_CODE}`)
        expect(UIA_DOMAIN_CODE).toBe('utopiaxaction')
    })

    it('maps rows to ListItems and marks the source as odoo', async () => {
        mockFetchOk([odooRow(), odooRow({ id: 1001, name: 'Ma(g)dalena-LAB' })])
        const { items, source, isFallback, load } = useUiaEvents()
        await load()
        expect(source.value).toBe('odoo')
        expect(isFallback.value).toBe(false)
        expect(items.value).toHaveLength(2)
        expect(items.value[0]?.heading).toContain('**Meine Grenzen**')
    })

    it('drops cimg when absent so ItemRow never gets a broken <img src>', async () => {
        mockFetchOk([odooRow({ cimg: null })])
        const { items, load } = useUiaEvents()
        await load()
        expect('cimg' in (items.value[0] as object)).toBe(false)
    })

    it('keeps a real cimg through', async () => {
        mockFetchOk([odooRow({ cimg: 'https://example.test/x.jpg' })])
        const { items, load } = useUiaEvents()
        await load()
        expect(items.value[0]?.cimg).toBe('https://example.test/x.jpg')
    })

    it('surfaces the mock flag so a demo cannot be mistaken for live data', async () => {
        mockFetchOk([odooRow()], { mock: true })
        const { isMock, load } = useUiaEvents()
        await load()
        expect(isMock.value).toBe(true)
    })

    it('forwards upcoming and limit', async () => {
        mockFetchOk([odooRow()])
        const { load } = useUiaEvents()
        await load({ upcoming: true, limit: 3 })
        const url = String((globalThis.fetch as unknown as { mock: { calls: string[][] } }).mock.calls[0]![0])
        expect(url).toContain('upcoming=true')
        expect(url).toContain('limit=3')
    })
})

describe('useUiaEvents · the fallback keeps the page correct without hiding failure', () => {
    beforeEach(() => {
        vi.spyOn(console, 'warn').mockImplementation(() => {})
    })

    it('renders the authored agenda before any fetch resolves', () => {
        mockFetchOk([odooRow()])
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

    it('falls back on an unexpected response shape', async () => {
        vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({ success: false }) })))
        const { source, load } = useUiaEvents()
        await load()
        expect(source.value).toBe('content')
    })

    it('never leaves the agenda empty, whatever went wrong', async () => {
        for (const bad of [
            () => Promise.reject(new Error('x')),
            () => Promise.resolve({ ok: false, status: 404, json: () => Promise.resolve({}) }),
            () => Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true, events: [] }) }),
        ]) {
            vi.stubGlobal('fetch', vi.fn(bad))
            const { items, load } = useUiaEvents()
            await load()
            expect(items.value.length).toBeGreaterThan(0)
        }
    })
})
