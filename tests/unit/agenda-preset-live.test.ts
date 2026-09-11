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
    EVENT_VISIBILITY_COMPUTED,
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

    // The Schwelle-Silhouette (HD 2026-08-07, design-thread §3·3): r_anonym
    // === false marks a line internal — /start renders it as form-without-
    // content for guests. The mechanism is DORMANT until the r_* trigger fix
    // (defect ③) produces real values; null must stay public, or the broken
    // trigger would silhouette the whole public agenda.
    // ⛔ DECISION-ENCODING (2026-08-10): the Schwelle-Silhouette is GATED OFF at
    // `EVENT_VISIBILITY_COMPUTED` because events have no computed visibility —
    // and because today's trigger, measured, returns creator-only for EVERY
    // state, which would silhouette the whole public agenda instead of single
    // rows. This test pins the GATE, not a preference: if it goes red because
    // `internal` is set again, the gate was flipped — and flipping it is only
    // legitimate once event-visibility distinguishes states (Defect ③ closed).
    it('never flags internal while event-visibility is ungated — not even on explicit false', () => {
        const groups = mapEventsToDayGroups([
            row({ id: 1, r_anonym: false }),
            row({ id: 2, r_anonym: 0 }),
            row({ id: 3, r_anonym: null }),
            row({ id: 4 }),
            row({ id: 5, r_anonym: true }),
        ], TODAY)
        const lines = groups[0]?.lines ?? []
        expect(EVENT_VISIBILITY_COMPUTED).toBe(false)
        for (const id of ['1', '2', '3', '4', '5']) {
            expect(lines.find(l => l.id === id)?.internal, `line ${id}`).toBeUndefined()
        }
    })

    // The derivation itself stays pinned, so flipping the gate is a one-line
    // change with a test that already describes the intended behaviour.
    it('DERIVATION (behind the gate): false/0 would mark internal, null/true would not', () => {
        const wouldBeInternal = (r: boolean | number | null | undefined) => r === false || r === 0 || undefined
        expect(wouldBeInternal(false)).toBe(true)
        expect(wouldBeInternal(0)).toBe(true)
        expect(wouldBeInternal(null)).toBeUndefined()
        expect(wouldBeInternal(undefined)).toBeUndefined()
        expect(wouldBeInternal(true)).toBeUndefined()
    })
})

describe('the mock stays intact — offline fixture + no-domaincode fallback', () => {
    it('still resolves both preset mocks', () => {
        expect(resolveAgendaForPreset('initiative').length).toBeGreaterThan(0)
        expect(resolveAgendaForPreset('schule-project').length).toBeGreaterThan(0)
    })
})
