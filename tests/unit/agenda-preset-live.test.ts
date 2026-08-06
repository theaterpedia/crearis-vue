/**
 * F-2 · the real-store path of the agenda preset system.
 *
 * Two of these describe DECISIONS, not behaviour:
 *   - the BLESSED sysreg → AgendaLineStatus mapping (sysreg thread §2, HD):
 *     cancelled=12288 (composite, checked first) · documented=8192-tier/past ·
 *     active=4096-tier · confirmed=512-tier · planned below — MASKED lifecycle.
 *   - venue wall-clock: offset-carrying timestamps convert, naive strings do not
 *     (the platform ruling from `displayTimezone`).
 * Changing what they assert reverses a ruling — reopen in the thread first.
 */

import { describe, expect, it } from 'vitest'
import {
    agendaLineStatus,
    mapEventsToDayGroups,
    resolveAgendaForPreset,
    type AgendaEventRow,
} from '@/composables/useAgendaPreset'

const TODAY = new Date('2026-08-06T12:00:00Z')

function row(overrides: Partial<AgendaEventRow> = {}): AgendaEventRow {
    return { id: 8, name: 'Meine Grenzen', date_begin: '2026-09-23T19:00:00', date_end: '2026-09-23T21:00:00', status: 64, ...overrides }
}

describe('agendaLineStatus · the BLESSED sysreg mapping (decision)', () => {
    it('maps the tiers: planned < 512 ≤ confirmed < 4096 ≤ active', () => {
        expect(agendaLineStatus(64, false)).toBe('planned')
        expect(agendaLineStatus(512, false)).toBe('confirmed')
        expect(agendaLineStatus(1024, false)).toBe('confirmed')
        expect(agendaLineStatus(4096, false)).toBe('active')
        expect(agendaLineStatus(8192, false)).toBe('documented')
    })

    it('cancelled = 12288 — the composite outranks the documented-tier check', () => {
        expect(agendaLineStatus(12288, false)).toBe('cancelled')
    })

    it('known-past documents a row whatever its workflow tier says', () => {
        expect(agendaLineStatus(4096, true)).toBe('documented')
    })

    it('compares the MASKED lifecycle — a scope-toggle cannot inflate the tier', () => {
        // draft(64) + a bit-17+ toggle sorts above every tier raw; masked it stays planned
        expect(agendaLineStatus(64 + (1 << 18), false)).toBe('planned')
    })
})

describe('mapEventsToDayGroups · rows → the canonical day-group shape', () => {
    it('groups by venue date, sorted, with the mock label convention', () => {
        const groups = mapEventsToDayGroups([
            row({ id: 2, date_begin: '2026-10-01T19:00:00' }),
            row({ id: 1 }),
        ], TODAY)
        expect(groups.map((g) => g.date)).toEqual(['2026-09-23', '2026-10-01'])
        expect(groups[0]?.label).toBe('MI 2026-09-23')
    })

    it('converts an offset-carrying wire timestamp to the venue clock (decision)', () => {
        const groups = mapEventsToDayGroups([
            row({ date_begin: '2026-09-23 17:00:00+00:00', date_end: '2026-09-23 19:00:00+00:00' }),
        ], TODAY)
        // 17:00 UTC = 19:00 Berlin CEST — the poster's clock, not UTC
        expect(groups[0]?.lines[0]?.timeRange).toBe('19:00 – 21:00')
    })

    it('keeps a naive string lexically — it is already venue time', () => {
        const groups = mapEventsToDayGroups([row()], TODAY)
        expect(groups[0]?.lines[0]?.timeRange).toBe('19:00 – 21:00')
    })

    it('carries undated rows in a trailing group instead of dropping them', () => {
        const groups = mapEventsToDayGroups([
            row(),
            row({ id: 10, name: 'Unser Kernprogramm', date_begin: null, date_end: null }),
        ], TODAY)
        const trailing = groups[groups.length - 1]
        expect(trailing?.date).toBe('')
        expect(trailing?.lines[0]?.headline).toBe('Unser Kernprogramm')
        expect(trailing?.lines[0]?.timeRange).toBe('')
    })

    it('teaser rides as the overline, location passes through', () => {
        const groups = mapEventsToDayGroups([
            row({ teaser: 'ein Tanztheater-Projekt', location: 'assemblé' }),
        ], TODAY)
        expect(groups[0]?.lines[0]?.overline).toBe('ein Tanztheater-Projekt')
        expect(groups[0]?.lines[0]?.location).toBe('assemblé')
    })
})

describe('the mock stays intact — offline fixture + no-domaincode fallback', () => {
    it('still resolves both preset mocks', () => {
        expect(resolveAgendaForPreset('initiative').length).toBeGreaterThan(0)
        expect(resolveAgendaForPreset('schule-project').length).toBeGreaterThan(0)
    })
})
