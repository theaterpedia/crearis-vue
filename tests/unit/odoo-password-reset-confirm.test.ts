/**
 * /api/auth/odoo-password-reset-confirm decision-logic tests — Phase-A C4.
 *
 * Covers `performOdooResetConfirm`:
 *   - success path with Set-Cookie (post-addon-deploy auto-login)
 *   - success path without Set-Cookie (pre-addon-deploy as-shipped)
 *   - 401 path (graphql errors[] surfaced verbatim)
 *   - 401 path (data.changePassword=false signals refusal)
 *   - 401 path (data.changePassword=null)
 *   - 502 path (network / non-JSON)
 *   - mutation arg-names + REAL-IP/resquest-host forwarding
 */

import { describe, it, expect, vi } from 'vitest'
import { performOdooResetConfirm } from '../../server/api/auth/odoo-password-reset-confirm.post'

const ODOO_URL = 'https://service.dasei.eu/graphql/vsf'
const INPUT = {
    token: 'reset-token-xyz',
    newPassword: 'new-hunter2',
    realIp: '127.0.0.1',
    requestHost: 'my.theaterpedia.org',
}

function mockResponse(opts: {
    json: unknown
    setCookie?: string | null
    throwOnJson?: boolean
}): Response {
    const headers = new Headers()
    if (opts.setCookie) headers.set('set-cookie', opts.setCookie)
    return {
        ok: true,
        status: 200,
        headers,
        json: opts.throwOnJson
            ? async () => {
                  throw new Error('not json')
              }
            : async () => opts.json,
    } as unknown as Response
}

describe('performOdooResetConfirm', () => {
    it('returns ok:true + Set-Cookie on successful token-set with auto-login (post-addon)', async () => {
        const fetchFn = vi.fn(async () =>
            mockResponse({
                json: { data: { changePassword: true } },
                setCookie: 'session_id=new-session; Path=/; HttpOnly',
            }),
        )
        const result = await performOdooResetConfirm(INPUT, {
            odooUrl: ODOO_URL,
            fetchFn,
        })
        expect(result).toEqual({
            ok: true,
            setCookieHeader: 'session_id=new-session; Path=/; HttpOnly',
        })
    })

    it('returns ok:true without Set-Cookie pre-addon-deploy (as-shipped Odoo)', async () => {
        const fetchFn = vi.fn(async () =>
            mockResponse({ json: { data: { changePassword: true } }, setCookie: null }),
        )
        const result = await performOdooResetConfirm(INPUT, {
            odooUrl: ODOO_URL,
            fetchFn,
        })
        expect(result).toEqual({ ok: true, setCookieHeader: null })
    })

    it('returns 401 surfacing Odoo error message verbatim when token rejected', async () => {
        const fetchFn = vi.fn(async () =>
            mockResponse({
                json: { errors: [{ message: 'Invalid or expired reset token' }] },
            }),
        )
        const result = await performOdooResetConfirm(INPUT, {
            odooUrl: ODOO_URL,
            fetchFn,
        })
        expect(result).toEqual({
            ok: false,
            statusCode: 401,
            message: 'Invalid or expired reset token',
        })
    })

    it('returns 401 when data.changePassword=false (resolver refusal)', async () => {
        const fetchFn = vi.fn(async () =>
            mockResponse({ json: { data: { changePassword: false } } }),
        )
        const result = await performOdooResetConfirm(INPUT, {
            odooUrl: ODOO_URL,
            fetchFn,
        })
        expect(result).toEqual({
            ok: false,
            statusCode: 401,
            message: 'Invalid or expired token',
        })
    })

    it('returns 401 when data.changePassword=null', async () => {
        const fetchFn = vi.fn(async () =>
            mockResponse({ json: { data: { changePassword: null } } }),
        )
        const result = await performOdooResetConfirm(INPUT, {
            odooUrl: ODOO_URL,
            fetchFn,
        })
        expect(result.ok).toBe(false)
        if (!result.ok) expect(result.statusCode).toBe(401)
    })

    it('returns 502 on network error', async () => {
        const fetchFn = vi.fn(async () => {
            throw new Error('ETIMEDOUT')
        })
        const result = await performOdooResetConfirm(INPUT, {
            odooUrl: ODOO_URL,
            fetchFn,
        })
        expect(result).toEqual({
            ok: false,
            statusCode: 502,
            message: 'ETIMEDOUT',
        })
    })

    it('returns 502 when upstream JSON is unparseable', async () => {
        const fetchFn = vi.fn(async () =>
            mockResponse({ json: null, throwOnJson: true }),
        )
        const result = await performOdooResetConfirm(INPUT, {
            odooUrl: ODOO_URL,
            fetchFn,
        })
        expect(result.ok).toBe(false)
        if (!result.ok) expect(result.statusCode).toBe(502)
    })

    it('forwards mutation + REAL-IP/resquest-host headers + variables', async () => {
        const fetchFn = vi.fn(async () =>
            mockResponse({ json: { data: { changePassword: true } }, setCookie: null }),
        )
        await performOdooResetConfirm(INPUT, { odooUrl: ODOO_URL, fetchFn })

        const [calledUrl, calledInit] = fetchFn.mock.calls[0] as [string, RequestInit]
        expect(calledUrl).toBe(ODOO_URL)
        const headers = calledInit.headers as Record<string, string>
        expect(headers['REAL-IP']).toBe('127.0.0.1')
        expect(headers['resquest-host']).toBe('my.theaterpedia.org')

        const body = JSON.parse((calledInit.body as string) ?? '{}')
        expect(body.query).toContain('mutation ChangePassword')
        expect(body.variables).toEqual({
            newPassword: 'new-hunter2',
            token: 'reset-token-xyz',
        })
    })
})
