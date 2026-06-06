/**
 * Tests for src/composables/useMagnificaAuth.ts pure helpers.
 *
 * Only `readPresentFlag` is tested as a pure-fn (with cookieString injected);
 * the composable's reactive state is integration-tested via the page-component
 * tests (would belong to a future smoke-pass on /demo/magnifica routes).
 */

import { describe, it, expect } from 'vitest'
import { readPresentFlag } from '@/composables/useMagnificaAuth'

describe('readPresentFlag', () => {
    it('returns false for empty cookie string', () => {
        expect(readPresentFlag('')).toBe(false)
    })

    it('returns false when undefined and document is unavailable', () => {
        // In vitest's jsdom env document.cookie is "" by default · still false
        expect(readPresentFlag(undefined)).toBe(false)
    })

    it('returns true for the canonical magnifica_auth_present=1 cookie alone', () => {
        expect(readPresentFlag('magnifica_auth_present=1')).toBe(true)
    })

    it('returns true when present-cookie is alongside other cookies', () => {
        expect(
            readPresentFlag('sessionId=abc; magnifica_auth_present=1; other=xyz'),
        ).toBe(true)
    })

    it('tolerates leading whitespace between cookies', () => {
        expect(readPresentFlag('a=1;   magnifica_auth_present=1; b=2')).toBe(true)
    })

    it('returns false when present-cookie has a non-1 value', () => {
        expect(readPresentFlag('magnifica_auth_present=0')).toBe(false)
        expect(readPresentFlag('magnifica_auth_present=')).toBe(false)
    })

    it('tolerates quoted cookie value', () => {
        expect(readPresentFlag('magnifica_auth_present="1"')).toBe(true)
    })

    it('does NOT match a cookie that just contains the name as substring', () => {
        expect(readPresentFlag('not_magnifica_auth_present=1')).toBe(false)
    })

    it('returns false when only the httpOnly hash-cookie is present', () => {
        // The hash-cookie alone never satisfies presence · the client never
        // reads it (it's httpOnly server-side · invisible to JS)
        expect(readPresentFlag('magnifica_auth=abc123hex')).toBe(false)
    })
})
