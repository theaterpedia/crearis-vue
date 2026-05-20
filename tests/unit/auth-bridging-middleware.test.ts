/**
 * 02-auth bridging-middleware tests (SSO-StepB §3.1).
 *
 * Covers:
 *   - shouldAttemptBridge: cookie-combination branches (CV-only / Odoo-only /
 *     both / neither / stale-CV)
 *   - bridgeFromOdoo: Odoo info-fetch + CV user lookup + session-create
 *     (success path · uid-false · partner-id-false · no-CV-user · Odoo-error)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { sessions, type SessionData } from '../../server/utils/session-store'
import {
    shouldAttemptBridge,
    bridgeFromOdoo,
    type OdooSessionInfo,
} from '../../server/middleware/02-auth'

const NOW = 1_700_000_000_000

function makeCvSession(overrides: Partial<SessionData> = {}): SessionData {
    return {
        userId: 42,
        sysmail: 'creator@example.org',
        username: 'creator',
        status: null,
        partner_id: 99,
        img_id: null,
        availableRoles: ['user'],
        activeRole: 'user',
        projectId: null,
        expiresAt: NOW + 60_000,
        ...overrides,
    }
}

const TEST_USER = {
    id: 42,
    sysmail: 'creator@example.org',
    username: 'creator',
    status: 1,
    img_id: null,
    role: 'user',
}

describe('shouldAttemptBridge', () => {
    beforeEach(() => {
        sessions.clear()
    })

    it('skips when no Odoo cookie + no CV cookie', () => {
        expect(
            shouldAttemptBridge({ cvCookie: undefined, odooCookie: undefined, now: NOW }),
        ).toEqual({ attempt: false, reason: 'no-odoo-cookie' })
    })

    it('skips with reason "cv-cookie-present" when CV session valid + no Odoo cookie', () => {
        sessions.set('cv-id', makeCvSession())
        expect(
            shouldAttemptBridge({ cvCookie: 'cv-id', odooCookie: undefined, now: NOW }),
        ).toEqual({ attempt: false, reason: 'cv-cookie-present' })
    })

    it('skips with reason "cv-and-odoo-both-present" when CV valid + Odoo present', () => {
        sessions.set('cv-id', makeCvSession())
        expect(
            shouldAttemptBridge({ cvCookie: 'cv-id', odooCookie: 'odoo-id', now: NOW }),
        ).toEqual({ attempt: false, reason: 'cv-and-odoo-both-present' })
    })

    it('attempts when only Odoo cookie present', () => {
        expect(
            shouldAttemptBridge({ cvCookie: undefined, odooCookie: 'odoo-id', now: NOW }),
        ).toEqual({ attempt: true })
    })

    it('attempts when CV cookie is stale (treats as absent) + Odoo cookie present', () => {
        sessions.set('stale-cv', makeCvSession({ expiresAt: NOW - 1000 }))
        expect(
            shouldAttemptBridge({ cvCookie: 'stale-cv', odooCookie: 'odoo-id', now: NOW }),
        ).toEqual({ attempt: true })
    })

    it('skips when CV cookie is stale but no Odoo cookie (no bridge possible)', () => {
        sessions.set('stale-cv', makeCvSession({ expiresAt: NOW - 1000 }))
        expect(
            shouldAttemptBridge({ cvCookie: 'stale-cv', odooCookie: undefined, now: NOW }),
        ).toEqual({ attempt: false, reason: 'no-odoo-cookie' })
    })

    it('skips when CV cookie is unknown (treats as absent) but no Odoo cookie', () => {
        expect(
            shouldAttemptBridge({ cvCookie: 'never-seen', odooCookie: undefined, now: NOW }),
        ).toEqual({ attempt: false, reason: 'no-odoo-cookie' })
    })
})

describe('bridgeFromOdoo', () => {
    beforeEach(() => {
        sessions.clear()
    })

    it('returns null when Odoo info-fetch fails (network / 5xx)', async () => {
        const result = await bridgeFromOdoo('odoo-id', {
            fetchInfo: async () => null,
            findUser: async () => null,
        })
        expect(result).toBeNull()
    })

    it('returns null when Odoo reports uid=false (unauthenticated)', async () => {
        const result = await bridgeFromOdoo('odoo-id', {
            fetchInfo: async (): Promise<OdooSessionInfo> => ({ uid: false, partner_id: false }),
            findUser: async () => TEST_USER,
        })
        expect(result).toBeNull()
    })

    it('returns null when Odoo reports partner_id=false', async () => {
        const result = await bridgeFromOdoo('odoo-id', {
            fetchInfo: async (): Promise<OdooSessionInfo> => ({ uid: 7, partner_id: false }),
            findUser: async () => TEST_USER,
        })
        expect(result).toBeNull()
    })

    it('returns null when no CV user matches the Odoo partner_id', async () => {
        const findUser = vi.fn(async () => null)
        const result = await bridgeFromOdoo('odoo-id', {
            fetchInfo: async (): Promise<OdooSessionInfo> => ({ uid: 7, partner_id: 99 }),
            findUser,
        })
        expect(result).toBeNull()
        expect(findUser).toHaveBeenCalledWith(99)
    })

    it('creates CV session when Odoo info + CV user both resolve', async () => {
        const result = await bridgeFromOdoo('odoo-id', {
            fetchInfo: async (): Promise<OdooSessionInfo> => ({
                uid: 7,
                partner_id: 99,
                username: 'creator',
            }),
            findUser: async () => TEST_USER,
        })
        expect(result).not.toBeNull()
        expect(result!.session.userId).toBe(TEST_USER.id)
        expect(result!.session.partner_id).toBe(99)
        expect(result!.session.sysmail).toBe(TEST_USER.sysmail)
        expect(result!.session.activeRole).toBe('user')
        expect(result!.sessionId).toMatch(/^[A-Za-z0-9_-]{32}$/)
        // Side effect: the session is registered in the in-memory store
        expect(sessions.get(result!.sessionId)).toBeDefined()
    })

    it('passes the supplied Odoo cookie value to fetchInfo unchanged', async () => {
        const fetchInfo = vi.fn(async () => null)
        await bridgeFromOdoo('cookie-value-xyz', {
            fetchInfo,
            findUser: async () => null,
        })
        expect(fetchInfo).toHaveBeenCalledWith('cookie-value-xyz')
    })
})
