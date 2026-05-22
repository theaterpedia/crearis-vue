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
import type { UserProjectsAndRole } from '../../server/utils/user-projects'

/** Default no-op hydrate stub: empty projects + no role-promotion. */
const emptyHydrate = async (): Promise<UserProjectsAndRole> => ({
    projectRecords: [],
    availableRoles: ['user'],
    activeRole: 'user',
    initialProjectId: null,
    initialProjectName: undefined,
})

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

    it('returns null when no CV user matches either partner_id or email', async () => {
        const findUser = vi.fn(async () => null)
        const result = await bridgeFromOdoo('odoo-id', {
            fetchInfo: async (): Promise<OdooSessionInfo> => ({
                uid: 7,
                partner_id: 99,
                username: 'hans.doenitz@dasei.eu',
            }),
            findUser,
        })
        expect(result).toBeNull()
        // findUser receives (partnerId, email) after the 2026-05-22 hot-patch.
        expect(findUser).toHaveBeenCalledWith(99, 'hans.doenitz@dasei.eu')
    })

    it('passes partner_id + Odoo username (email) to findUser', async () => {
        // Phase-D scenario 3 hot-patch: bridge must offer email as a fallback
        // discriminator so findCvUser can match sysmail OR extmail when the
        // partner_id link is NULL / stale. The bridge itself is opaque to
        // which row matched; the findCvUser lookup owns the resolution order.
        const findUser = vi.fn(async () => TEST_USER)
        await bridgeFromOdoo('odoo-id', {
            fetchInfo: async (): Promise<OdooSessionInfo> => ({
                uid: 7,
                partner_id: 99,
                username: 'creator@example.org',
            }),
            findUser,
            hydrate: emptyHydrate,
        })
        expect(findUser).toHaveBeenCalledWith(99, 'creator@example.org')
    })

    it('passes email=undefined to findUser when Odoo session-info omits username', async () => {
        const findUser = vi.fn(async () => null)
        await bridgeFromOdoo('odoo-id', {
            fetchInfo: async (): Promise<OdooSessionInfo> => ({
                uid: 7,
                partner_id: 99,
            }),
            findUser,
        })
        expect(findUser).toHaveBeenCalledWith(99, undefined)
    })

    it('creates CV session when Odoo info + CV user both resolve (no projects → stays user-role)', async () => {
        const result = await bridgeFromOdoo('odoo-id', {
            fetchInfo: async (): Promise<OdooSessionInfo> => ({
                uid: 7,
                partner_id: 99,
                username: 'creator',
            }),
            findUser: async () => TEST_USER,
            hydrate: emptyHydrate,
        })
        expect(result).not.toBeNull()
        expect(result!.session.userId).toBe(TEST_USER.id)
        expect(result!.session.partner_id).toBe(99)
        expect(result!.session.sysmail).toBe(TEST_USER.sysmail)
        expect(result!.session.activeRole).toBe('user')
        expect(result!.session.projects).toEqual([])
        expect(result!.session.projectId).toBeNull()
        expect(result!.sessionId).toMatch(/^[A-Za-z0-9_-]{32}$/)
        // Side effect: the session is registered in the in-memory store
        expect(sessions.get(result!.sessionId)).toBeDefined()
    })

    it("promotes activeRole to 'project' when the hydrate yields project memberships (barrier-2 fix)", async () => {
        // Mirrors Rosa Königer's surfaced bug at HM Phase-D scenario 3 retry:
        // bridge user has project memberships but pre-patch session stayed at
        // role='user' → /api/auth/set-project 403'd. Hydrate now provides the
        // role-promotion so session.activeRole reflects project access.
        const hydrate = vi.fn(async () => ({
            projectRecords: [
                {
                    id: 'utopiaxaction',
                    domaincode: 'utopiaxaction',
                    name: 'utopiaxaction',
                    heading: 'Utopia in Action',
                    username: 'utopiaxaction',
                    isOwner: true,
                    isMember: false,
                    isInstructor: false,
                    isAuthor: false,
                },
            ],
            availableRoles: ['user', 'project'],
            activeRole: 'project',
            initialProjectId: 'utopiaxaction',
            initialProjectName: 'utopiaxaction',
        }))
        const result = await bridgeFromOdoo('odoo-id', {
            fetchInfo: async (): Promise<OdooSessionInfo> => ({
                uid: 7,
                partner_id: 99,
                username: 'creator@example.org',
            }),
            findUser: async () => TEST_USER,
            hydrate,
        })
        expect(result).not.toBeNull()
        expect(result!.session.activeRole).toBe('project')
        expect(result!.session.availableRoles).toEqual(['user', 'project'])
        expect(result!.session.projectId).toBe('utopiaxaction')
        expect(result!.session.projects).toHaveLength(1)
        // hydrate receives the (id, role, partner_id) triple from the bridged user
        expect(hydrate).toHaveBeenCalledWith({
            id: TEST_USER.id,
            role: TEST_USER.role,
            partner_id: 99,
        })
    })

    it("does NOT promote 'base' user role even with project memberships", async () => {
        // Mirror login.post.ts's role-resolution rules: 'base' and 'admin' stay
        // put; only 'user' gets auto-promoted to 'project'. This protects
        // admin sessions from being routed into project-role flow by accident.
        const result = await bridgeFromOdoo('odoo-id', {
            fetchInfo: async (): Promise<OdooSessionInfo> => ({
                uid: 7,
                partner_id: 99,
                username: 'admin@example.org',
            }),
            findUser: async () => ({ ...TEST_USER, role: 'base' }),
            hydrate: async () => ({
                projectRecords: [
                    {
                        id: 'x',
                        domaincode: 'x',
                        name: 'x',
                        username: 'x',
                        isOwner: true,
                        isMember: false,
                        isInstructor: false,
                        isAuthor: false,
                    },
                ],
                // Resolved by the hydrate-helper itself (login.post.ts canon):
                // 'base' keeps its single role; activeRole stays 'base'.
                availableRoles: ['base'],
                activeRole: 'base',
                initialProjectId: null,
                initialProjectName: undefined,
            }),
        })
        expect(result!.session.activeRole).toBe('base')
        expect(result!.session.availableRoles).toEqual(['base'])
        expect(result!.session.projectId).toBeNull()
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
