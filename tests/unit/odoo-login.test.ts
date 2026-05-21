/**
 * /api/auth/odoo-login decision-logic tests — Phase-A C1.
 *
 * Tests:
 *   - `parseOdooSessionFromSetCookie` · all branches (null / empty / single /
 *     multi-cookie / comma-joined / no-session_id / lookalike-name)
 *   - `performOdooLogin` · success path + auth-failure (errors[]) + null-data +
 *     non-JSON upstream + network-error · with injected fetchFn
 *
 * h3 event-wrapping is integration territory; this suite covers branches
 * a unit-test can ground (grandfather pattern matching bridgeFromOdoo /
 * decideVerifyOutcome). Live-Odoo + h3-event paths are smoke-test territory
 * (proposal §7.4 / plan §15).
 */

import { describe, it, expect, vi } from 'vitest'
import { parseOdooSessionFromSetCookie } from '../../server/utils/odoo-set-cookie-parse'
import { performOdooLogin } from '../../server/api/auth/odoo-login.post'

describe('parseOdooSessionFromSetCookie', () => {
    it('returns null for undefined / null / empty', () => {
        expect(parseOdooSessionFromSetCookie(undefined)).toBeNull()
        expect(parseOdooSessionFromSetCookie(null)).toBeNull()
        expect(parseOdooSessionFromSetCookie('')).toBeNull()
    })

    it('extracts session_id from a single cookie at the start of the header', () => {
        expect(parseOdooSessionFromSetCookie('session_id=abc123')).toBe('abc123')
    })

    it('extracts session_id from a single Set-Cookie with attributes', () => {
        expect(
            parseOdooSessionFromSetCookie(
                'session_id=abc123; Path=/; HttpOnly; SameSite=Lax',
            ),
        ).toBe('abc123')
    })

    it('extracts session_id when it appears after other cookies (semicolon-joined)', () => {
        expect(
            parseOdooSessionFromSetCookie('frontend_lang=en; session_id=abc123; Path=/'),
        ).toBe('abc123')
    })

    it('extracts session_id from a comma-joined multi-cookie header (Node fetch shape)', () => {
        expect(
            parseOdooSessionFromSetCookie(
                'frontend_lang=en; Path=/, session_id=xyz789; Path=/; HttpOnly',
            ),
        ).toBe('xyz789')
    })

    it('returns null when no session_id is present', () => {
        expect(parseOdooSessionFromSetCookie('frontend_lang=en; Path=/')).toBeNull()
    })

    it('does not match cookie names that merely contain session_id as a substring', () => {
        // e.g. `no_session_id=...` or `session_id_legacy=...`
        expect(parseOdooSessionFromSetCookie('no_session_id=abc')).toBeNull()
        expect(parseOdooSessionFromSetCookie('session_id_legacy=abc')).toBeNull()
    })
})

const PARTNER = { id: 7, name: 'Creator User', email: 'creator@example.org' }
const ODOO_URL = 'https://service.dasei.eu/graphql/vsf'
const INPUT = {
    email: 'creator@example.org',
    password: 'hunter2',
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

describe('performOdooLogin', () => {
    it('returns ok:true + Set-Cookie + partner on successful upstream login', async () => {
        const fetchFn = vi.fn(async () =>
            mockResponse({
                json: { data: { login: PARTNER } },
                setCookie: 'session_id=odoo-abc; Path=/; HttpOnly',
            }),
        )
        const result = await performOdooLogin(INPUT, { odooUrl: ODOO_URL, fetchFn })

        expect(result).toEqual({
            ok: true,
            setCookieHeader: 'session_id=odoo-abc; Path=/; HttpOnly',
            partner: PARTNER,
        })
        expect(fetchFn).toHaveBeenCalledTimes(1)
    })

    it('forwards REAL-IP + resquest-host typo headers + login variables to upstream', async () => {
        const fetchFn = vi.fn(async () =>
            mockResponse({ json: { data: { login: PARTNER } }, setCookie: null }),
        )
        await performOdooLogin(INPUT, { odooUrl: ODOO_URL, fetchFn })

        const [calledUrl, calledInit] = fetchFn.mock.calls[0] as [string, RequestInit]
        expect(calledUrl).toBe(ODOO_URL)
        expect(calledInit.method).toBe('POST')
        const headers = calledInit.headers as Record<string, string>
        expect(headers['Content-Type']).toBe('application/json')
        expect(headers['REAL-IP']).toBe('127.0.0.1')
        expect(headers['resquest-host']).toBe('my.theaterpedia.org')
        // resquest-host typo preserved (v0.2 Decision-3 · feedback_resquest_host_typo on CO-side)
        expect(headers).not.toHaveProperty('request-host')

        const body = JSON.parse((calledInit.body as string) ?? '{}')
        expect(body.variables).toEqual({
            email: 'creator@example.org',
            password: 'hunter2',
        })
        expect(body.query).toContain('mutation Login')
    })

    it('returns ok:false 401 when upstream reports graphql errors[]', async () => {
        const fetchFn = vi.fn(async () =>
            mockResponse({ json: { errors: [{ message: 'Invalid credentials' }] } }),
        )
        const result = await performOdooLogin(INPUT, { odooUrl: ODOO_URL, fetchFn })
        expect(result).toEqual({
            ok: false,
            statusCode: 401,
            message: 'Invalid credentials',
        })
    })

    it('returns ok:false 401 when upstream returns data.login=null (no error message)', async () => {
        const fetchFn = vi.fn(async () => mockResponse({ json: { data: { login: null } } }))
        const result = await performOdooLogin(INPUT, { odooUrl: ODOO_URL, fetchFn })
        expect(result).toEqual({ ok: false, statusCode: 401, message: 'Login failed' })
    })

    it('returns ok:false 502 when upstream JSON is unparseable', async () => {
        const fetchFn = vi.fn(async () =>
            mockResponse({ json: null, throwOnJson: true }),
        )
        const result = await performOdooLogin(INPUT, { odooUrl: ODOO_URL, fetchFn })
        expect(result.ok).toBe(false)
        if (!result.ok) {
            expect(result.statusCode).toBe(502)
            expect(result.message).toContain('non-JSON')
        }
    })

    it('returns ok:false 502 when fetchFn throws (network error)', async () => {
        const fetchFn = vi.fn(async () => {
            throw new Error('ECONNREFUSED')
        })
        const result = await performOdooLogin(INPUT, { odooUrl: ODOO_URL, fetchFn })
        expect(result).toEqual({
            ok: false,
            statusCode: 502,
            message: 'ECONNREFUSED',
        })
    })

    it('returns ok:true setCookieHeader=null when upstream omits Set-Cookie', async () => {
        // Edge case: Odoo's `login` mutation should always Set-Cookie on success,
        // but the contract is defensive — if upstream is mid-deploy/misconfigured
        // and returns success-without-cookie, surface that cleanly so the
        // endpoint can decide whether to skip the bridge step.
        const fetchFn = vi.fn(async () =>
            mockResponse({ json: { data: { login: PARTNER } }, setCookie: null }),
        )
        const result = await performOdooLogin(INPUT, { odooUrl: ODOO_URL, fetchFn })
        expect(result).toEqual({ ok: true, setCookieHeader: null, partner: PARTNER })
    })
})
