/**
 * uia · `src/views/Uia/uiaDates.ts`.
 *
 * The agenda is file-backed (no DB), so these three things carry it: the flyers'
 * `DD.MM.YY` parses correctly, the derived status only ever claims what a date in
 * a file can actually prove, and the landing's „nächste Termine" picks the right
 * three.
 */

import { describe, expect, it } from 'vitest'
import {
    UIA_STATUS,
    deriveStatus,
    formatUiaDateLong,
    formatUiaDay,
    nextUp,
    parseUiaDate,
    upcoming,
} from '@/views/Uia/uiaDates'
import { live } from '@/views/Uia/content/agenda'

/** Fixed anchors — never `new Date()`, or these go red on their own one morning. */
const BEFORE_THE_ARC = new Date('2026-07-27T10:00:00Z')
const MID_ARC = new Date('2026-11-15T10:00:00Z')
const AFTER_THE_ARC = new Date('2027-03-01T10:00:00Z')

describe('parseUiaDate', () => {
    it('reads the flyers` DD.MM.YY into the right calendar day', () => {
        const parsed = parseUiaDate('23.09.26')
        expect(parsed).not.toBeNull()
        expect(parsed?.getUTCFullYear()).toBe(2026)
        expect(parsed?.getUTCMonth()).toBe(8) // September
        expect(parsed?.getUTCDate()).toBe(23)
    })

    it('reads a two-digit year across the turn of the year', () => {
        expect(parseUiaDate('20.01.27')?.getUTCFullYear()).toBe(2027)
    })

    it('anchors at UTC noon, so no timezone can shift the day', () => {
        expect(parseUiaDate('23.09.26')?.getUTCHours()).toBe(12)
    })

    it('rejects a date that is not a real calendar date instead of rolling it over', () => {
        // `new Date(Date.UTC(2026, 1, 31))` silently becomes 03.03. — that would be a lie.
        expect(parseUiaDate('31.02.26')).toBeNull()
    })

    it('rejects shapes that are not DD.MM.YY', () => {
        expect(parseUiaDate('2026-09-23')).toBeNull()
        expect(parseUiaDate('vsl. 22.01.2027')).toBeNull()
        expect(parseUiaDate('')).toBeNull()
    })

    it('tolerates surrounding whitespace', () => {
        expect(parseUiaDate('  23.09.26 ')?.getUTCDate()).toBe(23)
    })
})

describe('formatting', () => {
    it('leads the date-line with the German weekday, as the flyer prints it', () => {
        // 23.09.2026 is a Wednesday — the whole agenda is Mittwochs.
        expect(formatUiaDay('23.09.26')).toBe('MI 23.09.26')
    })

    it('confirms every date in the file really is a Mittwoch', () => {
        for (const date of live.dates) {
            expect(formatUiaDay(date).startsWith('MI ')).toBe(true)
        }
    })

    it('expands to the full year where that is wanted', () => {
        expect(formatUiaDateLong('06.01.27')).toBe('06.01.2027')
    })

    it('passes unparseable input straight through rather than mangling it', () => {
        expect(formatUiaDay('vsl. 22.01.2027')).toBe('vsl. 22.01.2027')
    })
})

describe('deriveStatus', () => {
    it('calls a future beat „findet statt"', () => {
        expect(deriveStatus('23.09.26', BEFORE_THE_ARC)).toBe('findet-statt')
    })

    it('calls a past beat „abgeschlossen" — green, not an error state', () => {
        expect(deriveStatus('23.09.26', AFTER_THE_ARC)).toBe('abgeschlossen')
        expect(UIA_STATUS.abgeschlossen.token).toBe('positive')
    })

    it('still counts today as happening — a Mittwoch runs on the Mittwoch', () => {
        expect(deriveStatus('23.09.26', new Date('2026-09-23T23:00:00Z'))).toBe('findet-statt')
    })

    it('never invents the two states that need a live source', () => {
        // §4 has four states; only two are derivable from a date in a file. A
        // faked threshold would be worse than no threshold.
        const derived = new Set(live.dates.map((d) => deriveStatus(d, MID_ARC)))
        expect(derived.has('schwelle-offen')).toBe(false)
        expect(derived.has('anmeldung-geschlossen')).toBe(false)
    })

    it('errs towards „findet statt" on unparseable input, so a live beat is never hidden', () => {
        expect(deriveStatus('not a date', BEFORE_THE_ARC)).toBe('findet-statt')
    })
})

describe('upcoming / nextUp', () => {
    it('shows all 15 Mittwochs as upcoming before the arc starts', () => {
        expect(live.dates).toHaveLength(15)
        expect(upcoming(live.dates, BEFORE_THE_ARC)).toHaveLength(15)
    })

    it('drops the beats that have passed', () => {
        const future = upcoming(live.dates, MID_ARC)
        expect(future.length).toBeLessThan(live.dates.length)
        expect(future[0]).toBe('18.11.26')
    })

    it('gives the landing exactly its `agendaTeaser.limit` in file order', () => {
        expect(nextUp(live.dates, 3, BEFORE_THE_ARC)).toEqual(['23.09.26', '30.09.26', '07.10.26'])
    })

    it('falls back to the last N once every beat is past, so the band never renders empty', () => {
        expect(nextUp(live.dates, 3, AFTER_THE_ARC)).toEqual(['06.01.27', '13.01.27', '20.01.27'])
    })
})
