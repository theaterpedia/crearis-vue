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
    it("returns 'public' for utopiaxaction.theaterpedia.org", () => {
        expect(resolveHostMode('utopiaxaction.theaterpedia.org')).toBe('public')
    })

    it("returns 'app' for the retired utopia-in-action.de host", () => {
        // Freed 2026-09-11. Should it ever resolve here again, the safe
        // default must catch it — not a stale public-mode allowlist entry.
        expect(resolveHostMode('utopia-in-action.de')).toBe('app')
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

    it("does NOT promote neighbouring hosts to 'public' mode by accident", () => {
        // The public host now sits UNDER theaterpedia.org, so the blast-radius
        // of a sloppy match is the whole family — not just one foreign domain.
        expect(resolveHostMode('test.utopiaxaction.theaterpedia.org')).toBe('app')
        expect(resolveHostMode('theaterpedia.org')).toBe('app')
        expect(resolveHostMode('utopiaxaction.theaterpedia.org.evil.test')).toBe('app')
    })

    it('PUBLIC_HOSTS contains only the v1 public-mode host', () => {
        // Reference-test: keeps the allowlist explicit + greppable + auditable.
        // Extending PUBLIC_HOSTS (e.g. freundes-kreis.de when its DNS lands)
        // should land in a deliberate commit — this test surfaces the change.
        expect(Array.from(PUBLIC_HOSTS).sort()).toEqual(['utopiaxaction.theaterpedia.org'])
    })
})
