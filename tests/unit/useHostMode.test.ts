/**
 * useHostMode decision-logic tests — Phase-A C10 · plan §9a.
 *
 * Tests the pure `resolveHostMode(host)` extraction (grandfather pattern).
 * The composable itself just feeds `window.location.host` into this; the
 * branches that matter are all in the pure function.
 */

import { describe, it, expect } from 'vitest'
import { resolveHostMode, PUBLIC_HOSTS } from '../../src/composables/useHostMode'

describe('resolveHostMode', () => {
    it("returns 'public' for utopia-in-action.de", () => {
        expect(resolveHostMode('utopia-in-action.de')).toBe('public')
    })

    it("returns 'app' for my.theaterpedia.org", () => {
        expect(resolveHostMode('my.theaterpedia.org')).toBe('app')
    })

    it("defaults to 'app' for an unknown host", () => {
        expect(resolveHostMode('unknown-domain.example')).toBe('app')
    })

    it("defaults to 'app' for the empty host string (defensive · server-render or unmounted)", () => {
        expect(resolveHostMode('')).toBe('app')
    })

    it("does NOT promote subdomains to 'public' mode by accident", () => {
        // e.g. an attacker registering test.utopia-in-action.de would NOT
        // get public-mode without an explicit allowlist entry.
        expect(resolveHostMode('test.utopia-in-action.de')).toBe('app')
        expect(resolveHostMode('my.utopia-in-action.de')).toBe('app')
    })

    it('PUBLIC_HOSTS contains only the v1 public-mode host', () => {
        // Reference-test: keeps the allowlist explicit + greppable + auditable.
        // Extending PUBLIC_HOSTS (e.g. freundes-kreis.de when its DNS lands)
        // should land in a deliberate commit — this test surfaces the change.
        expect(Array.from(PUBLIC_HOSTS).sort()).toEqual(['utopia-in-action.de'])
    })
})
