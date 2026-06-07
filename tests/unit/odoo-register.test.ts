/**
 * /api/auth/odoo-register decision-logic tests — Phase-A C2.
 *
 * Covers `performOdooRegister`:
 *   - success path (Set-Cookie present · post-addon-deploy)
 *   - success path (Set-Cookie absent · pre-addon-deploy · the as-shipped Odoo state)
 *   - 409 path (email-already-in-use error · pattern-classified)
 *   - 400 path (generic upstream graphql errors[])
 *   - 502 path (network error / non-JSON upstream)
 *   - 400 path (data.register=null without errors)
 *   - mutation arg names + REAL-IP/resquest-host forwarding
 *
 * Per CO@prod cross-check 07ff15b: register-mutation as-shipped returns
 * { data.register: {...} } WITHOUT Set-Cookie. The "Set-Cookie absent · OK"
 * branch is the expected pre-addon-deploy reality. Once the
 * crearis_auth_resolver_patches addon deploys, the same flow gains Set-Cookie.
 */

import { describe, it, expect, vi } from 'vitest'
import { performOdooRegister } from '../../server/api/auth/odoo-register.post'

const PARTNER = { id: 11, name: 'Alex Creator', email: 'alex@example.org' }
const ODOO_URL = 'https://service.dasei.eu/graphql/vsf'
const INPUT = {
    email: 'alex@example.org',
    name: 'Alex Creator',
    password: 'hunter2',
    subscribeNewsletter: false,
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

describe('performOdooRegister', () => {
    it('returns ok:true + partner + Set-Cookie when upstream auto-logs-in (post-addon)', async () => {
        const fetchFn = vi.fn(async () =>
            mockResponse({
                json: { data: { register: PARTNER } },
                setCookie: 'session_id=odoo-new; Path=/; HttpOnly',
            }),
        )
        const result = await performOdooRegister(INPUT, { odooUrl: ODOO_URL, fetchFn })
        expect(result).toEqual({
            ok: true,
            setCookieHeader: 'session_id=odoo-new; Path=/; HttpOnly',
            partner: PARTNER,
        })
    })

    it('returns ok:true + partner with setCookieHeader=null pre-addon-deploy (as-shipped Odoo)', async () => {
        // Per CO@prod 07ff15b: this IS the expected as-shipped behavior — partner
        // creation succeeds, no Set-Cookie issued. The endpoint surfaces success
        // and the client falls back to login.
        const fetchFn = vi.fn(async () =>
            mockResponse({ json: { data: { register: PARTNER } }, setCookie: null }),
        )
        const result = await performOdooRegister(INPUT, { odooUrl: ODOO_URL, fetchFn })
        expect(result).toEqual({ ok: true, setCookieHeader: null, partner: PARTNER })
    })

    it('forwards mutation variables (name/email/password/subscribeNewsletter) + REAL-IP/resquest-host headers', async () => {
        const fetchFn = vi.fn(async () =>
            mockResponse({ json: { data: { register: PARTNER } }, setCookie: null }),
        )
        await performOdooRegister(
            { ...INPUT, subscribeNewsletter: true },
            { odooUrl: ODOO_URL, fetchFn },
        )

        const [calledUrl, calledInit] = fetchFn.mock.calls[0] as [string, RequestInit]
        expect(calledUrl).toBe(ODOO_URL)
        const headers = calledInit.headers as Record<string, string>
        expect(headers['REAL-IP']).toBe('127.0.0.1')
        expect(headers['resquest-host']).toBe('my.theaterpedia.org')

        const body = JSON.parse((calledInit.body as string) ?? '{}')
        expect(body.query).toContain('mutation Register')
        expect(body.variables).toEqual({
            name: 'Alex Creator',
            email: 'alex@example.org',
            password: 'hunter2',
            subscribeNewsletter: true,
        })
    })

    it('returns 409 when upstream signals email-already-in-use (pattern-matched)', async () => {
        const fetchFn = vi.fn(async () =>
            mockResponse({
                json: {
                    errors: [{ message: 'A user with this email already exists.' }],
                },
            }),
        )
        const result = await performOdooRegister(INPUT, { odooUrl: ODOO_URL, fetchFn })
        expect(result).toEqual({
            ok: false,
            statusCode: 409,
            message: 'A user with this email already exists.',
        })
    })

    it('returns 400 for generic graphql errors[] not matching the duplicate-email pattern', async () => {
        const fetchFn = vi.fn(async () =>
            mockResponse({ json: { errors: [{ message: 'Password too short' }] } }),
        )
        const result = await performOdooRegister(INPUT, { odooUrl: ODOO_URL, fetchFn })
        expect(result).toEqual({
            ok: false,
            statusCode: 400,
            message: 'Password too short',
        })
    })

    it('returns 400 when upstream returns data.register=null with no errors[]', async () => {
        const fetchFn = vi.fn(async () =>
            mockResponse({ json: { data: { register: null } } }),
        )
        const result = await performOdooRegister(INPUT, { odooUrl: ODOO_URL, fetchFn })
        expect(result).toEqual({
            ok: false,
            statusCode: 400,
            message: 'Registration failed',
        })
    })

    it('returns 502 on network error', async () => {
        const fetchFn = vi.fn(async () => {
            throw new Error('ENETUNREACH')
        })
        const result = await performOdooRegister(INPUT, { odooUrl: ODOO_URL, fetchFn })
        expect(result).toEqual({
            ok: false,
            statusCode: 502,
            message: 'ENETUNREACH',
        })
    })

    it('returns 502 when upstream JSON is unparseable', async () => {
        const fetchFn = vi.fn(async () =>
            mockResponse({ json: null, throwOnJson: true }),
        )
        const result = await performOdooRegister(INPUT, { odooUrl: ODOO_URL, fetchFn })
        expect(result.ok).toBe(false)
        if (!result.ok) {
            expect(result.statusCode).toBe(502)
        }
    })
})
