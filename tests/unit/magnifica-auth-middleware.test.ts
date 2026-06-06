/**
 * Tests for server/middleware/00-magnifica-auth.ts pure helpers.
 *
 * Per the bridge-test pattern (predecessor's 02-auth.ts test shape): extract
 * the decision-logic as pure functions, test them deterministically, mock
 * nothing of the h3 event lifecycle.
 */

import { describe, it, expect } from 'vitest'
import {
    sha256Hex,
    decideAuthOutcome,
    SUCCESS_REDIRECT,
    MISMATCH_REDIRECT,
} from '@/../server/middleware/00-magnifica-auth'

describe('sha256Hex', () => {
    it('returns the known sha256 hex of empty string', () => {
        expect(sha256Hex('')).toBe(
            'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        )
    })

    it('returns the known sha256 hex of "abc"', () => {
        expect(sha256Hex('abc')).toBe(
            'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
        )
    })

    it('is deterministic for the same input', () => {
        const a = sha256Hex('magnifica-2026')
        const b = sha256Hex('magnifica-2026')
        expect(a).toBe(b)
    })

    it('produces hex-only output of length 64', () => {
        const hash = sha256Hex('any-input-string-here')
        expect(hash).toMatch(/^[0-9a-f]{64}$/)
    })

    it('handles unicode input', () => {
        const hash = sha256Hex('Theaterpädagoge')
        expect(hash).toMatch(/^[0-9a-f]{64}$/)
    })
})

describe('decideAuthOutcome', () => {
    it('returns misconfig when expected is empty', () => {
        const result = decideAuthOutcome({ submitted: 'anything', expected: '' })
        expect(result).toEqual({ kind: 'misconfig' })
    })

    it('returns mismatch when submitted is empty and expected is non-empty', () => {
        const result = decideAuthOutcome({ submitted: '', expected: 'secret' })
        expect(result).toEqual({ kind: 'mismatch' })
    })

    it('returns mismatch when submitted differs from expected', () => {
        const result = decideAuthOutcome({ submitted: 'wrong', expected: 'secret' })
        expect(result).toEqual({ kind: 'mismatch' })
    })

    it('returns mismatch for case-sensitive comparison', () => {
        const result = decideAuthOutcome({ submitted: 'SECRET', expected: 'secret' })
        expect(result).toEqual({ kind: 'mismatch' })
    })

    it('returns match with sha256-hex cookieValue on equal submission', () => {
        const password = 'magnifica-2026'
        const result = decideAuthOutcome({ submitted: password, expected: password })
        expect(result.kind).toBe('match')
        if (result.kind === 'match') {
            expect(result.cookieValue).toBe(sha256Hex(password))
            expect(result.cookieValue).toMatch(/^[0-9a-f]{64}$/)
        }
    })

    it('returns misconfig (not mismatch) when both submitted and expected are empty', () => {
        // Empty-expected always means misconfig · we never auto-accept empty
        const result = decideAuthOutcome({ submitted: '', expected: '' })
        expect(result).toEqual({ kind: 'misconfig' })
    })
})

describe('redirect constants', () => {
    it('SUCCESS_REDIRECT lands on / directly (6-beat plays pre-submit · no overlay flag)', () => {
        // The ?just_unlocked overlay-trigger retired 2026-06-06; choreography is in EntryHero
        expect(SUCCESS_REDIRECT).toBe('/')
    })

    it('MISMATCH_REDIRECT carries the inline-error query-param for the entry-hero', () => {
        // EntryHero reads route.query.error and renders "Wrong password." inline
        expect(MISMATCH_REDIRECT).toBe('/?error=invalid')
    })
})
