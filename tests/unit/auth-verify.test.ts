/**
 * /api/auth/verify decision-logic tests — NGINX edge-auth (SSO-StepB §3.4).
 *
 * Tests `decideVerifyOutcome` (the pure auth-decision extracted from the
 * handler). The h3-event wrapping is integration-territory; here we cover the
 * branches that determine 200 vs 401.
 *
 * Spec test-cases (per CTO-WED-package §3.4):
 *   - 200 when CV-cookie valid
 *   - 200 when middleware-populated event.context.session present
 *   - 401 when no cookie + no context
 *   - 401 when cookie present but session expired / unknown
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { sessions, type SessionData } from '../../server/utils/session-store'
import { decideVerifyOutcome } from '../../server/api/auth/verify.get'

const NOW = 1_700_000_000_000

function makeSession(overrides: Partial<SessionData> = {}): SessionData {
    return {
        userId: 42,
        sysmail: 'test@example.org',
        username: 'tester',
        status: null,
        partner_id: null,
        img_id: null,
        availableRoles: ['base'],
        activeRole: 'base',
        projectId: null,
        expiresAt: NOW + 60_000,
        ...overrides,
    }
}

describe('decideVerifyOutcome', () => {
    beforeEach(() => {
        sessions.clear()
    })

    it('returns "unauthed" when no cookie and no middleware context', () => {
        const result = decideVerifyOutcome({
            ctxSessionUserId: null,
            sessionId: undefined,
            now: NOW,
        })
        expect(result).toBe('unauthed')
    })

    it('returns "unauthed" when sessionId present but no matching session', () => {
        const result = decideVerifyOutcome({
            ctxSessionUserId: null,
            sessionId: 'unknown',
            now: NOW,
        })
        expect(result).toBe('unauthed')
    })

    it('returns "unauthed" when session expired (and drops the stale session)', () => {
        const id = 'expired-id'
        sessions.set(id, makeSession({ expiresAt: NOW - 1 }))
        const result = decideVerifyOutcome({
            ctxSessionUserId: null,
            sessionId: id,
            now: NOW,
        })
        expect(result).toBe('unauthed')
        expect(sessions.has(id)).toBe(false)
    })

    it('returns "authed-via-cookie" when CV sessionId valid and not expired', () => {
        const id = 'valid-id'
        sessions.set(id, makeSession({ expiresAt: NOW + 1 }))
        const result = decideVerifyOutcome({
            ctxSessionUserId: null,
            sessionId: id,
            now: NOW,
        })
        expect(result).toBe('authed-via-cookie')
        expect(sessions.has(id)).toBe(true)
    })

    it('returns "authed-via-cookie" at the exact expiry boundary (>=)', () => {
        const id = 'edge-id'
        sessions.set(id, makeSession({ expiresAt: NOW }))
        const result = decideVerifyOutcome({
            ctxSessionUserId: null,
            sessionId: id,
            now: NOW,
        })
        expect(result).toBe('authed-via-cookie')
    })

    it('returns "authed-via-context" when middleware populated event.context.session (Odoo path)', () => {
        const result = decideVerifyOutcome({
            ctxSessionUserId: 7,
            sessionId: undefined,
            now: NOW,
        })
        expect(result).toBe('authed-via-context')
    })

    it('prefers middleware context over a stale CV-cookie (does not even check cookie)', () => {
        const id = 'stale-id'
        sessions.set(id, makeSession({ expiresAt: NOW - 1000 }))
        const result = decideVerifyOutcome({
            ctxSessionUserId: 7,
            sessionId: id,
            now: NOW,
        })
        expect(result).toBe('authed-via-context')
        // Cookie path was short-circuited — stale session is NOT cleaned up here.
        // That's fine; the next plain-cookie request will clean it up.
        expect(sessions.has(id)).toBe(true)
    })

    it('accepts ctxSessionUserId = 0 as authed (falsy-but-valid id)', () => {
        const result = decideVerifyOutcome({
            ctxSessionUserId: 0,
            sessionId: undefined,
            now: NOW,
        })
        expect(result).toBe('authed-via-context')
    })
})
