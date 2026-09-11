/**
 * Venue time, and the CET/CEST marker.
 *
 * HD 2026-08-03: *"I decided to almost hardcode the CET into the plugin — crearis-vue
 * is all about simplification. You don't need all the timezoning as long as you stay
 * between Stockholm, Bratislava, Madrid, Paris. If somebody browses with a different
 * timezone we should append 'CET', otherwise not. Nobody cares about these things on
 * the continent."*
 *
 * So the contract is two sentences:
 *   1. an event time renders in the **venue's** clock, identically for every reader
 *   2. a reader **outside** the Central European band gets a `CET`/`CEST` marker
 *
 * ── Why these tests set `process.env.TZ` ────────────────────────────────────
 * The devbox, the server and ~90 % of readers are all in `Europe/Berlin`, so **every
 * one of these assertions passes trivially in the ambient timezone** — which is
 * exactly how the defect stayed invisible in the first place. A test that only ever
 * runs in Berlin cannot tell venue-time from viewer-time. Forcing the zone is the
 * only thing that makes the distinction observable.
 *
 * The measurement that motivated it — same instant, before the fix:
 *
 *     stored                            Berlin   London   New York
 *     '2026-11-04T19:00:00'   (naive)   19:00    19:00    19:00
 *     '2026-11-04 18:00:00+00:00'       19:00    18:00    13:00   ← viewer-time
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest'

/** 19:00 in Berlin, expressed the way Odoo puts it on the wire (K4). */
const WINTER_WIRE = '2026-11-04 18:00:00+00:00' // CET  · UTC+1
const SUMMER_WIRE = '2026-07-08 17:00:00+00:00' // CEST · UTC+2
/** The same wall-clock as CV stores it today — naive, already venue-time. */
const WINTER_NAIVE = '2026-11-04T19:00:00'

const ORIGINAL_TZ = process.env.TZ

/**
 * Re-import under a forced zone. Node reads `process.env.TZ` lazily per Date
 * operation, so setting it is enough — but the modules are re-imported anyway so
 * nothing caches an offset from a previous case.
 */
async function underTimezone<T>(tz: string, run: (mod: {
    formatDateTime: typeof import('@/plugins/dateTimeFormat')['formatDateTime']
    tzu: typeof import('@/utils/displayTimezone')
}) => T): Promise<T> {
    process.env.TZ = tz
    const [{ formatDateTime }, tzu] = await Promise.all([
        import('@/plugins/dateTimeFormat'),
        import('@/utils/displayTimezone'),
    ])
    return run({ formatDateTime, tzu })
}

const fmt = (formatDateTime: any, start: string) =>
    formatDateTime({ start, format: 'standard', showTime: true, rows: 'row' })

beforeEach(() => { process.env.TZ = ORIGINAL_TZ })
afterEach(() => { process.env.TZ = ORIGINAL_TZ })

describe('venue time · the SAME wall-clock for every reader', () => {
    const CONTINENT = ['Europe/Berlin', 'Europe/Madrid', 'Europe/Stockholm', 'Europe/Bratislava', 'Europe/Paris']

    for (const tz of CONTINENT) {
        it(`renders 19:00 in ${tz} — and adds no marker, because the reader is in the band`, async () => {
            const out = await underTimezone(tz, ({ formatDateTime }) => fmt(formatDateTime, WINTER_WIRE))
            expect(out).toContain('19:00')
            expect(out, 'no marker on the continent').not.toMatch(/CES?T/)
        })
    }

    for (const tz of ['Europe/London', 'America/New_York', 'Asia/Tokyo']) {
        it(`still renders 19:00 in ${tz} — venue time, not the reader's`, async () => {
            const out = await underTimezone(tz, ({ formatDateTime }) => fmt(formatDateTime, WINTER_WIRE))
            expect(out, 'the venue clock must not follow the reader').toContain('19:00')
        })
    }

    it('treats naive CV rows and offset-carrying Odoo rows as the same wall-clock', async () => {
        for (const tz of ['Europe/Berlin', 'America/New_York']) {
            const [wire, naive] = await underTimezone(tz, ({ formatDateTime }) => [
                fmt(formatDateTime, WINTER_WIRE),
                fmt(formatDateTime, WINTER_NAIVE),
            ])
            // The whole point of the pull not changing what a page says.
            expect(wire.replace(/ CES?T$/, ''), `mismatch in ${tz}`).toBe(naive.replace(/ CES?T$/, ''))
        }
    })
})

describe('the marker · only for a reader outside the band', () => {
    it('is absent on the continent', async () => {
        const out = await underTimezone('Europe/Madrid', ({ formatDateTime }) => fmt(formatDateTime, WINTER_WIRE))
        expect(out).not.toMatch(/CES?T/)
    })

    it('is present in London — one hour off is still off', async () => {
        const out = await underTimezone('Europe/London', ({ formatDateTime }) => fmt(formatDateTime, WINTER_WIRE))
        expect(out).toMatch(/CET$/)
    })

    it('is present in New York', async () => {
        const out = await underTimezone('America/New_York', ({ formatDateTime }) => fmt(formatDateTime, WINTER_WIRE))
        expect(out).toMatch(/CES?T$/)
    })

    it('says CEST in summer, not CET — the label is chosen by the instant', async () => {
        // Labelling a July event "CET" would be wrong by exactly the hour the marker
        // exists to prevent: a London reader converting CET lands an hour early.
        const out = await underTimezone('Europe/London', ({ formatDateTime }) => fmt(formatDateTime, SUMMER_WIRE))
        expect(out).toMatch(/CEST$/)
        expect(out).toContain('19:00')
    })

    it('is omitted when no time is shown — a bare date carries no zone claim', async () => {
        const out = await underTimezone('America/New_York', ({ formatDateTime }) =>
            formatDateTime({ start: WINTER_WIRE, format: 'standard', showTime: false, rows: 'row' }))
        expect(out).not.toMatch(/CES?T/)
    })
})

describe('the helpers themselves', () => {
    it('reports the band correctly per instant, DST included', async () => {
        await underTimezone('Europe/Berlin', ({ tzu }) => {
            expect(tzu.displayZoneOffsetMinutes(new Date(WINTER_WIRE))).toBe(60)   // CET
            expect(tzu.displayZoneOffsetMinutes(new Date(SUMMER_WIRE))).toBe(120)  // CEST
            expect(tzu.displayZoneLabel(new Date(WINTER_WIRE))).toBe('CET')
            expect(tzu.displayZoneLabel(new Date(SUMMER_WIRE))).toBe('CEST')
        })
    })

    it('does not throw on an unparseable date', async () => {
        await underTimezone('Europe/Berlin', ({ tzu }) => {
            const bad = new Date('nonsense')
            expect(() => tzu.toDisplayZone(bad)).not.toThrow()
            expect(tzu.viewerIsOutsideDisplayZone(bad)).toBe(false)
            expect(tzu.displayZoneSuffix(bad)).toBe('')
        })
    })
})
