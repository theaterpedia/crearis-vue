/**
 * Odoo ↔ CV event sync · the decision core and the per-event lock.
 *
 * HD's four shape-decisions (2026-07-28) are what this pins:
 *   per-event locking · `odoo_xmlid` as identity · Odoo always wins ·
 *   the confirmed-rubicon still holds.
 *
 * The rubicon cases matter most. Getting them wrong means either an event that
 * should have stayed local goes through a one-way door into Odoo, or a confirmed
 * event never arrives. Neither is visible by looking at a page.
 */

import { describe, expect, it } from 'vitest'
import {
    activeLockCount,
    decideSync,
    isSyncable,
    lockKey,
    withEventLock,
    type CvSyncRow,
    type OdooSyncRow,
} from '../../server/utils/odooSync'
import { STATUS } from '../../server/utils/posts-permissions'

function cvRow(overrides: Partial<CvSyncRow> = {}): CvSyncRow {
    return {
        id: 1,
        status: STATUS.CONFIRMED,
        odoo_xmlid: 'utopiaxaction.event__meine-grenzen-01',
        confirmed_at: '2026-07-01T10:00:00Z',
        name: 'Meine Grenzen',
        teaser: 'ein Tanztheater Projekt',
        date_begin: '2026-09-23T19:00:00',
        date_end: '2026-09-23T21:00:00',
        ...overrides,
    }
}

function odooRow(overrides: Partial<OdooSyncRow> = {}): OdooSyncRow {
    return {
        odoo_xmlid: 'utopiaxaction.event__meine-grenzen-01',
        name: 'Meine Grenzen',
        write_date: '2026-07-10T10:00:00Z',
        ...overrides,
    }
}

describe('the rubicon · below confirmed stays local', () => {
    it('skips NEW, DEMO, DRAFT and REVIEW', () => {
        for (const status of [STATUS.NEW, STATUS.DEMO, STATUS.DRAFT, STATUS.REVIEW]) {
            const d = decideSync(cvRow({ status }), odooRow())
            expect(d.action, `status ${status}`).toBe('skip-below-rubicon')
        }
    })

    it('skips a null status rather than treating it as syncable', () => {
        expect(decideSync(cvRow({ status: null }), odooRow()).action).toBe('skip-below-rubicon')
    })

    it('lets CONFIRMED and RELEASED through', () => {
        expect(isSyncable({ status: STATUS.CONFIRMED })).toBe(true)
        expect(isSyncable({ status: STATUS.RELEASED })).toBe(true)
    })
})

describe('the one-way door · archived and trashed never get pushed', () => {
    // A bare `status >= CONFIRMED` would admit both, because 32768 and 65536 sort
    // above 512. Pushing a trashed event into Odoo cannot be undone.
    it('excludes ARCHIVED and TRASH even though they sort above CONFIRMED', () => {
        expect(STATUS.ARCHIVED).toBeGreaterThan(STATUS.CONFIRMED)
        expect(STATUS.TRASH).toBeGreaterThan(STATUS.CONFIRMED)
        expect(isSyncable({ status: STATUS.ARCHIVED })).toBe(false)
        expect(isSyncable({ status: STATUS.TRASH })).toBe(false)
    })

    it('reports skip-archived, distinct from skip-below-rubicon', () => {
        for (const status of [STATUS.ARCHIVED, STATUS.TRASH]) {
            const d = decideSync(cvRow({ status }), odooRow())
            expect(d.action, `status ${status}`).toBe('skip-archived')
        }
    })

    it('guards the archive BEFORE any push branch, even when only CV moved', () => {
        const d = decideSync(cvRow({ status: STATUS.TRASH }), odooRow(), {
            cvChangedAt: '2026-07-20T10:00:00Z',
            lastSyncedAt: '2026-07-15T10:00:00Z',
        })
        expect(d.action).toBe('skip-archived')
    })
})

describe('identity · odoo_xmlid is the basis', () => {
    it('creates in Odoo when past the rubicon with no xmlid', () => {
        const d = decideSync(cvRow({ odoo_xmlid: null }), null)
        expect(d.action).toBe('create-in-odoo')
    })

    it('recreates when CV holds an xmlid Odoo does not know', () => {
        const d = decideSync(cvRow(), null)
        expect(d.action).toBe('create-in-odoo')
        expect(d.reason).toContain('Odoo has no such event')
    })

    it('keys the lock on odoo_xmlid, and only falls back to the CV id before first sync', () => {
        expect(lockKey({ id: 7, odoo_xmlid: 'x.event__y' })).toBe('odoo:x.event__y')
        expect(lockKey({ id: 7, odoo_xmlid: null })).toBe('cv:7')
    })
})

describe('direction · who moved since the last reconcile', () => {
    const LAST = '2026-07-15T00:00:00Z'

    it('pulls when only Odoo moved', () => {
        const d = decideSync(cvRow(), odooRow({ write_date: '2026-07-20T00:00:00Z' }), {
            lastSyncedAt: LAST,
            cvChangedAt: '2026-07-01T00:00:00Z',
        })
        expect(d.action).toBe('pull-from-odoo')
        expect(d.conflict).toBe(false)
    })

    it('pushes when only CV moved', () => {
        const d = decideSync(cvRow(), odooRow({ write_date: '2026-07-10T00:00:00Z' }), {
            lastSyncedAt: LAST,
            cvChangedAt: '2026-07-20T00:00:00Z',
        })
        expect(d.action).toBe('push-to-odoo')
        expect(d.conflict).toBe(false)
    })

    it('no-ops when neither moved', () => {
        const d = decideSync(cvRow(), odooRow({ write_date: '2026-07-10T00:00:00Z' }), {
            lastSyncedAt: LAST,
            cvChangedAt: '2026-07-01T00:00:00Z',
        })
        expect(d.action).toBe('noop')
    })

    it('treats a never-synced pair as Odoo-moved rather than no-op', () => {
        // No lastSyncedAt: assume Odoo has something to give us.
        const d = decideSync(cvRow(), odooRow(), {})
        expect(d.action).toBe('pull-from-odoo')
    })
})

describe('conflict · Odoo always wins, and says that it did', () => {
    it('pulls and flags the conflict when both sides moved', () => {
        const d = decideSync(cvRow(), odooRow({ write_date: '2026-07-20T00:00:00Z' }), {
            lastSyncedAt: '2026-07-15T00:00:00Z',
            cvChangedAt: '2026-07-21T00:00:00Z',
        })
        expect(d.action).toBe('pull-from-odoo')
        expect(d.conflict).toBe(true)
        // This is the one outcome that loses work — it must not be silent.
        expect(d.reason).toContain('CV edit is discarded')
    })

    it('wins even when the CV edit is the more recent one', () => {
        const d = decideSync(cvRow(), odooRow({ write_date: '2026-07-16T00:00:00Z' }), {
            lastSyncedAt: '2026-07-15T00:00:00Z',
            cvChangedAt: '2026-07-28T00:00:00Z', // newer, still loses
        })
        expect(d.action).toBe('pull-from-odoo')
        expect(d.conflict).toBe(true)
    })
})

describe('the Foundation seam is injectable', () => {
    it('honours an overridden rubicon predicate', () => {
        // CV-Schema can supply the authoritative predicate without editing this module.
        const d = decideSync(cvRow({ status: STATUS.DRAFT }), odooRow(), {
            isSyncable: () => true,
            lastSyncedAt: '2026-07-15T00:00:00Z',
        })
        expect(d.action).not.toBe('skip-below-rubicon')
    })

    it('but the archive-guard is NOT overridable by it', () => {
        // Deliberate: the one-way door is not a policy knob.
        const d = decideSync(cvRow({ status: STATUS.TRASH }), odooRow(), { isSyncable: () => true })
        expect(d.action).toBe('skip-archived')
    })
})

describe('per-event lock', () => {
    it('serialises two syncs of the SAME event', async () => {
        const order: string[] = []
        const row = { id: 1, odoo_xmlid: 'x.event__a' }
        const slow = withEventLock(row, async () => {
            order.push('a-start')
            await new Promise((r) => setTimeout(r, 30))
            order.push('a-end')
        })
        const fast = withEventLock(row, async () => { order.push('b') })
        await Promise.all([slow, fast])
        // b must not interleave inside a
        expect(order).toEqual(['a-start', 'a-end', 'b'])
    })

    it('runs DIFFERENT events in parallel', async () => {
        const order: string[] = []
        const slow = withEventLock({ id: 1, odoo_xmlid: 'x.event__a' }, async () => {
            await new Promise((r) => setTimeout(r, 30))
            order.push('a')
        })
        const fast = withEventLock({ id: 2, odoo_xmlid: 'x.event__b' }, async () => { order.push('b') })
        await Promise.all([slow, fast])
        // per-event, not per-table: b finishes first
        expect(order).toEqual(['b', 'a'])
    })

    it('a failed sync does not poison later syncs of the same event', async () => {
        const row = { id: 1, odoo_xmlid: 'x.event__a' }
        await expect(withEventLock(row, async () => { throw new Error('odoo down') })).rejects.toThrow('odoo down')
        await expect(withEventLock(row, async () => 'recovered')).resolves.toBe('recovered')
    })

    it('releases the lock so nothing leaks', async () => {
        const before = activeLockCount()
        await withEventLock({ id: 99, odoo_xmlid: null }, async () => 'done')
        expect(activeLockCount()).toBe(before)
    })

    it('returns the task result unchanged', async () => {
        await expect(withEventLock({ id: 1, odoo_xmlid: 'x' }, async () => ({ ok: 1 }))).resolves.toEqual({ ok: 1 })
    })

    it('queues a double-save rather than dropping the second write', async () => {
        const row = { id: 5, odoo_xmlid: null }
        const seen: number[] = []
        const task = (n: number) => withEventLock(row, async () => {
            await new Promise((r) => setTimeout(r, 5))
            seen.push(n)
        })
        await Promise.all([task(1), task(2), task(3)])
        expect(seen).toEqual([1, 2, 3])
    })
})

describe('reasons read like a log line', () => {
    it('every action carries a usable reason', () => {
        const cases: Array<[CvSyncRow, OdooSyncRow | null]> = [
            [cvRow({ status: STATUS.DRAFT }), odooRow()],
            [cvRow({ status: STATUS.TRASH }), odooRow()],
            [cvRow({ odoo_xmlid: null }), null],
            [cvRow(), odooRow()],
        ]
        for (const [cv, odoo] of cases) {
            const d = decideSync(cv, odoo)
            expect(d.reason.length, JSON.stringify(d)).toBeGreaterThan(10)
            expect(d.reason).not.toContain('undefined')
        }
    })
})
