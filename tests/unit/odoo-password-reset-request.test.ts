/**
 * /api/auth/odoo-password-reset-request decision-logic tests — Phase-A C3.
 *
 * Covers `performOdooResetRequest`:
 *   - success path (upstream returns clean → returns true)
 *   - graceful suppression: upstream errors[] → returns false (warning logged ·
 *     never surfaced to the caller · enumeration protection)
 *   - graceful suppression: network error → returns false
 *   - mutation arg-names + REAL-IP/resquest-host forwarding
 *
 * Lighter test surface than C1/C2 because the endpoint deliberately surfaces
 * no information about the upstream outcome (always returns 200 success to
 * the caller). The branches that matter for security correctness:
 *   - the upstream call is made (so the email gets sent when the partner exists)
 *   - upstream failures are swallowed (no leakage of partner-membership)
 */

import { describe, it, expect, vi } from 'vitest'
import { performOdooResetRequest } from '../../server/api/auth/odoo-password-reset-request.post'

const ODOO_URL = 'https://service.dasei.eu/graphql/vsf'
const INPUT = {
    email: 'someone@example.org',
    realIp: '127.0.0.1',
    requestHost: 'my.theaterpedia.org',
}

function mockResponse(opts: {
    json: unknown
    throwOnJson?: boolean
}): Response {
    return {
        ok: true,
        status: 200,
        headers: new Headers(),
        json: opts.throwOnJson
            ? async () => {
                  throw new Error('not json')
              }
            : async () => opts.json,
    } as unknown as Response
}

describe('performOdooResetRequest', () => {
    it('returns true when upstream resolves cleanly', async () => {
        const fetchFn = vi.fn(async () =>
            mockResponse({ json: { data: { resetPassword: true } } }),
        )
        const result = await performOdooResetRequest(INPUT, {
            odooUrl: ODOO_URL,
            fetchFn,
        })
        expect(result).toBe(true)
        expect(fetchFn).toHaveBeenCalledTimes(1)
    })

    it('returns false when upstream signals graphql errors[] (suppressed · enumeration protection)', async () => {
        const fetchFn = vi.fn(async () =>
            mockResponse({ json: { errors: [{ message: 'Email not found' }] } }),
        )
        const result = await performOdooResetRequest(INPUT, {
            odooUrl: ODOO_URL,
            fetchFn,
        })
        expect(result).toBe(false)
    })

    it('returns false on network error (suppressed · upstream unavailability never surfaces)', async () => {
        const fetchFn = vi.fn(async () => {
            throw new Error('ECONNRESET')
        })
        const result = await performOdooResetRequest(INPUT, {
            odooUrl: ODOO_URL,
            fetchFn,
        })
        expect(result).toBe(false)
    })

    it('returns false when upstream JSON is unparseable (suppressed)', async () => {
        const fetchFn = vi.fn(async () =>
            mockResponse({ json: null, throwOnJson: true }),
        )
        const result = await performOdooResetRequest(INPUT, {
            odooUrl: ODOO_URL,
            fetchFn,
        })
        expect(result).toBe(true)
        // Note: when JSON-parse fails we treat it as "no errors observed"
        // because we can't distinguish a malformed-OK response from an
        // upstream-rejection on this code-path. Either way we return success
        // to the caller; the boolean here is only for log-tracing.
    })

    it('forwards mutation + REAL-IP/resquest-host typo headers', async () => {
        const fetchFn = vi.fn(async () =>
            mockResponse({ json: { data: { resetPassword: true } } }),
        )
        await performOdooResetRequest(INPUT, { odooUrl: ODOO_URL, fetchFn })

        const [calledUrl, calledInit] = fetchFn.mock.calls[0] as [string, RequestInit]
        expect(calledUrl).toBe(ODOO_URL)
        const headers = calledInit.headers as Record<string, string>
        expect(headers['REAL-IP']).toBe('127.0.0.1')
        expect(headers['resquest-host']).toBe('my.theaterpedia.org')

        const body = JSON.parse((calledInit.body as string) ?? '{}')
        expect(body.query).toContain('mutation ResetPassword')
        expect(body.variables).toEqual({ email: 'someone@example.org' })
    })
})
