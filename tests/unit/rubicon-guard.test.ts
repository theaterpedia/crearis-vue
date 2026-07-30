/**
 * The Rubicon write-guard — CV's half of D4's ownership line.
 *
 * D4 (cv↔odoo decision thread §1): *below sysreg 512 CV owns the entity; at/above
 * 512 CV caches it and Odoo is the system of record.* Until 2026-07-30 that was
 * decided but unenforced — `events/[id].patch.ts` and `posts/[id].patch.ts` checked
 * **authorship only**, so any authorised member could write an at/above-512 row,
 * silently, because D7 removed conflict detection.
 *
 * The decision is a pure module for the same reason `dev-login-guard.ts` is: the
 * handlers import `h3`, which is nitro-provided and unresolvable from vitest, so a
 * rule living inside them could only be checked by standing up a server.
 *
 * The load-bearing subtlety these tests pin: **the rule keys on the row's CURRENT
 * status, never the incoming one.** Raising a row across 512 is the *handoff* and
 * must stay allowed — `qmd://sfr/freundeskreis-dashboard-walkthrough.md:134`,
 * *"HM clicks 'Announce project' OR 'Cross Rubicon' → sysreg crosses 512 →
 * propagated-to-Odoo"* — and it is exactly what makes `odooSync` decide
 * `create-in-odoo`. A guard that refused it would break the mechanism D4 depends on.
 */

import { describe, expect, it } from 'vitest'
import { decideRubiconWrite, resolveGuardMode } from '../../server/utils/rubicon-guard'
import { RUBICON, STATUS } from '../../src/utils/status-constants'

const BELOW = [STATUS.NEW, STATUS.DEMO, STATUS.DRAFT, 128, 256] // new · demo · draft · draft_user · draft_review
const AT_OR_ABOVE = [STATUS.CONFIRMED, STATUS.CONFIRMED_USER, STATUS.RELEASED, STATUS.ARCHIVED, STATUS.TRASH]

describe('the line itself', () => {
    it('puts the Rubicon at 512', () => {
        expect(RUBICON).toBe(512)
        expect(STATUS.CONFIRMED).toBe(512)
    })
})

describe('update/delete · keys on the CURRENT status', () => {
    for (const status of BELOW) {
        it(`allows an update below the line (status ${status}) — CV owns it`, () => {
            const v = decideRubiconWrite({ kind: 'update', currentStatus: status, mode: 'enforce' })
            expect(v.violates).toBe(false)
            expect(v.allowed).toBe(true)
        })
    }

    for (const status of AT_OR_ABOVE) {
        it(`refuses an update at/above the line (status ${status}) — Odoo owns it`, () => {
            const v = decideRubiconWrite({ kind: 'update', currentStatus: status, mode: 'enforce' })
            expect(v.violates).toBe(true)
            expect(v.allowed).toBe(false)
        })

        it(`refuses a delete at status ${status} too — deleting a cached row is not CV's call`, () => {
            const v = decideRubiconWrite({ kind: 'delete', currentStatus: status, mode: 'enforce' })
            expect(v.allowed).toBe(false)
        })
    }

    it('refuses ARCHIVED and TRASH as well — they are above 512 and CV does not own them either', () => {
        expect(decideRubiconWrite({ kind: 'update', currentStatus: STATUS.ARCHIVED, mode: 'enforce' }).allowed).toBe(false)
        expect(decideRubiconWrite({ kind: 'update', currentStatus: STATUS.TRASH, mode: 'enforce' }).allowed).toBe(false)
    })

    it('treats a null/absent status as below the line', () => {
        expect(decideRubiconWrite({ kind: 'update', currentStatus: null, mode: 'enforce' }).allowed).toBe(true)
        expect(decideRubiconWrite({ kind: 'update', currentStatus: undefined, mode: 'enforce' }).allowed).toBe(true)
    })
})

describe('the crossing stays allowed — this is the handoff, not a violation', () => {
    it('allows raising a draft row across the line', () => {
        // current 64 → incoming 512. The guard must not look at `incomingStatus` here.
        const v = decideRubiconWrite({
            kind: 'update',
            currentStatus: STATUS.DRAFT,
            incomingStatus: STATUS.CONFIRMED,
            mode: 'enforce',
        })
        expect(v.violates).toBe(false)
        expect(v.allowed).toBe(true)
    })

    it('allows raising straight to released from below', () => {
        expect(decideRubiconWrite({
            kind: 'update', currentStatus: STATUS.DRAFT, incomingStatus: STATUS.RELEASED, mode: 'enforce',
        }).allowed).toBe(true)
    })

    it('refuses pulling an above-line row back down — the door is one-way', () => {
        const v = decideRubiconWrite({
            kind: 'update', currentStatus: STATUS.RELEASED, incomingStatus: STATUS.DRAFT, mode: 'enforce',
        })
        expect(v.allowed).toBe(false)
    })
})

describe('scope toggles must not inflate the comparison', () => {
    // The bug the mask exists to prevent: a `draft` row carrying `scope_public`
    // is 2097216 raw, which sorts above every threshold.
    const DRAFT_SCOPE_PUBLIC = STATUS.DRAFT | (1 << 21)

    it('a draft row carrying a scope toggle is still below the line', () => {
        expect(DRAFT_SCOPE_PUBLIC).toBeGreaterThan(RUBICON) // raw value is huge
        const v = decideRubiconWrite({ kind: 'update', currentStatus: DRAFT_SCOPE_PUBLIC, mode: 'enforce' })
        expect(v.violates, 'masking must strip the toggle before comparing').toBe(false)
        expect(v.allowed).toBe(true)
    })

    it('a confirmed row carrying a scope toggle is still above the line', () => {
        const v = decideRubiconWrite({ kind: 'update', currentStatus: STATUS.CONFIRMED | (1 << 21), mode: 'enforce' })
        expect(v.allowed).toBe(false)
    })
})

describe('create · keys on the INCOMING status, since there is no row yet', () => {
    it('allows creating below the line', () => {
        expect(decideRubiconWrite({
            kind: 'create', currentStatus: null, incomingStatus: STATUS.DRAFT, mode: 'enforce',
        }).allowed).toBe(true)
    })

    it('refuses creating at/above the line — CV would mint what Odoo should own', () => {
        expect(decideRubiconWrite({
            kind: 'create', currentStatus: null, incomingStatus: STATUS.CONFIRMED, mode: 'enforce',
        }).allowed).toBe(false)
    })

    it('allows a create with no status at all (the API defaults to NEW)', () => {
        expect(decideRubiconWrite({
            kind: 'create', currentStatus: null, incomingStatus: undefined, mode: 'enforce',
        }).allowed).toBe(true)
    })
})

describe('modes · implemented ahead, flagged down locally', () => {
    it('warn allows the write but still reports the violation', () => {
        const v = decideRubiconWrite({ kind: 'update', currentStatus: STATUS.CONFIRMED, mode: 'warn' })
        expect(v.violates, 'warn must not pretend it is fine').toBe(true)
        expect(v.allowed).toBe(true)
    })

    it('off allows it and still reports the violation', () => {
        const v = decideRubiconWrite({ kind: 'update', currentStatus: STATUS.CONFIRMED, mode: 'off' })
        expect(v.violates).toBe(true)
        expect(v.allowed).toBe(true)
    })

    it('no mode changes what counts as a violation — only what happens about it', () => {
        for (const mode of ['enforce', 'warn', 'off'] as const) {
            expect(decideRubiconWrite({ kind: 'update', currentStatus: STATUS.RELEASED, mode }).violates).toBe(true)
            expect(decideRubiconWrite({ kind: 'update', currentStatus: STATUS.DRAFT, mode }).violates).toBe(false)
        }
    })
})

describe('resolveGuardMode · fail-safe', () => {
    it('defaults to enforce when unset — a deployment that forgets the flag gets the strict behaviour', () => {
        expect(resolveGuardMode(undefined)).toBe('enforce')
        expect(resolveGuardMode('')).toBe('enforce')
    })

    it('treats an unrecognised value as enforce, not as permission', () => {
        for (const v of ['1', 'true', 'yes', 'disabled', 'WARN', 'Off']) {
            expect(resolveGuardMode(v), `should not open on ${JSON.stringify(v)}`).toBe('enforce')
        }
    })

    it('accepts the two documented relaxations exactly', () => {
        expect(resolveGuardMode('warn')).toBe('warn')
        expect(resolveGuardMode('off')).toBe('off')
    })
})
