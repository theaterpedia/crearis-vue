/**
 * `/api/dev/login-as` — the guards.
 *
 * This endpoint mints a real CV session for any user with no password. In dev
 * that is exactly what we want (HD 2026-07-28: debug what comes *after* the
 * login, don't rebuild a login that already works on prod). Anywhere else it is
 * full account takeover.
 *
 * The three guards are therefore the security boundary, and they are what this
 * file pins. `denyReason` is a pure module specifically so they can be asserted
 * independently, without standing up a server — a guard that is only checked by
 * "we ran it and it seemed fine" is a guard that rots.
 *
 * All three must pass. Any failure → 404, denying the route's existence rather
 * than advertising a disabled backdoor.
 */

import { describe, expect, it } from 'vitest'
import { DEV_LOGIN_MIN_TOKEN, denyReason } from '../../server/utils/dev-login-guard'

const TOKEN = 'a'.repeat(DEV_LOGIN_MIN_TOKEN)

/** The one input combination that is allowed to run. */
const OPEN = { nodeEnv: 'development', devLogin: TOKEN, key: TOKEN }

describe('dev/login-as · the open case', () => {
    it('allows dev + a strong token + the matching key', () => {
        expect(denyReason(OPEN)).toBeNull()
    })
})

describe('dev/login-as · guard 1 · never in production', () => {
    it('denies in production even when fully configured and keyed', () => {
        expect(denyReason({ ...OPEN, nodeEnv: 'production' })).toBe('production')
    })

    it('production wins over every other input', () => {
        expect(denyReason({ nodeEnv: 'production', devLogin: TOKEN, key: TOKEN })).toBe('production')
    })
})

describe('dev/login-as · guard 2 · off unless a strong token is set', () => {
    it('denies when DEV_LOGIN is unset — dev alone is not enough', () => {
        expect(denyReason({ ...OPEN, devLogin: undefined })).toBe('not-enabled')
        expect(denyReason({ ...OPEN, devLogin: '' })).toBe('not-enabled')
    })

    it('rejects DEV_LOGIN=1 and other habitual flag-flips as too weak', () => {
        // The whole point: a reflexive `DEV_LOGIN=1` must NOT open this.
        for (const v of ['1', '0', 'true', 'yes', 'on', 'dev', 'secret']) {
            expect(denyReason({ ...OPEN, devLogin: v, key: v }), `should deny DEV_LOGIN=${v}`)
                .toBe('weak-token')
        }
    })

    it(`requires at least ${DEV_LOGIN_MIN_TOKEN} chars`, () => {
        const short = 'a'.repeat(DEV_LOGIN_MIN_TOKEN - 1)
        expect(denyReason({ ...OPEN, devLogin: short, key: short })).toBe('weak-token')
        const exact = 'a'.repeat(DEV_LOGIN_MIN_TOKEN)
        expect(denyReason({ ...OPEN, devLogin: exact, key: exact })).toBeNull()
    })
})

describe('dev/login-as · guard 3 · the key must match', () => {
    it('denies a missing key', () => {
        expect(denyReason({ ...OPEN, key: undefined })).toBe('bad-key')
        expect(denyReason({ ...OPEN, key: '' })).toBe('bad-key')
    })

    it('denies a wrong key of the same length', () => {
        expect(denyReason({ ...OPEN, key: 'b'.repeat(DEV_LOGIN_MIN_TOKEN) })).toBe('bad-key')
    })

    it('denies a prefix of the real token — no partial credit', () => {
        expect(denyReason({ ...OPEN, key: TOKEN.slice(0, -1) })).toBe('bad-key')
    })

    it('denies a key that merely contains the token', () => {
        expect(denyReason({ ...OPEN, key: `${TOKEN}x` })).toBe('bad-key')
        expect(denyReason({ ...OPEN, key: ` ${TOKEN}` })).toBe('bad-key')
    })
})

describe('dev/login-as · fail-closed', () => {
    it('denies when nothing is set at all', () => {
        expect(denyReason({ nodeEnv: undefined, devLogin: undefined, key: undefined })).not.toBeNull()
    })

    it('never returns null unless all three conditions hold', () => {
        const envs = ['production', 'development', 'test', undefined]
        const tokens = [undefined, '', '1', 'short', TOKEN]
        const keys = [undefined, '', '1', 'short', TOKEN, 'b'.repeat(DEV_LOGIN_MIN_TOKEN)]
        for (const nodeEnv of envs) {
            for (const devLogin of tokens) {
                for (const key of keys) {
                    const allowed = denyReason({ nodeEnv, devLogin, key }) === null
                    const shouldAllow =
                        nodeEnv !== 'production'
                        && !!devLogin
                        && devLogin.length >= DEV_LOGIN_MIN_TOKEN
                        && key === devLogin
                    expect(allowed, `env=${nodeEnv} token=${devLogin} key=${key}`).toBe(shouldAllow)
                }
            }
        }
    })
})
