/**
 * GET /api/admin/domains/check-dns?domain=example.com
 * Check if DNS is configured correctly for a domain
 * Admin only
 */

import { defineEventHandler, createError, getCookie, getQuery } from 'h3'
import { sessions } from '../../../utils/session-store'
import { db } from '../../../database/init'
import dns from 'dns'
import { promisify } from 'util'

const resolve4 = promisify(dns.resolve4)

export default defineEventHandler(async (event) => {
    // Check admin authentication
    const sessionId = getCookie(event, 'sessionId')
    if (!sessionId) {
        throw createError({ statusCode: 401, message: 'Authentication required' })
    }

    const session = sessions.get(sessionId)
    if (!session || session.expiresAt < Date.now()) {
        throw createError({ statusCode: 401, message: 'Session expired' })
    }

    // Check admin role
    const user = await db.get('SELECT role FROM users WHERE id = $1', [session.userId])
    if (!user || user.role !== 'admin') {
        throw createError({ statusCode: 403, message: 'Admin access required' })
    }

    const query = getQuery(event)
    const domain = query.domain as string

    if (!domain) {
        throw createError({ statusCode: 400, message: 'Domain parameter is required' })
    }

    try {
        // Get expected server IP from system config or environment
        const serverConfig = await db.get(
            "SELECT value FROM system_config WHERE key = 'server_ip'"
        )
        const expectedIp = serverConfig?.value || process.env.SERVER_IP || null

        // Resolve domain
        let resolvedIps: string[] = []
        let dnsConfigured = false
        let dnsError: string | null = null

        try {
            resolvedIps = await resolve4(domain)
            dnsConfigured = expectedIp ? resolvedIps.includes(expectedIp) : resolvedIps.length > 0
        } catch (err: any) {
            if (err.code === 'ENOTFOUND') {
                dnsError = 'Domain not found in DNS'
            } else if (err.code === 'ENODATA') {
                dnsError = 'No A record found for domain'
            } else {
                dnsError = `DNS lookup failed: ${err.message}`
            }
        }

        // Also check www subdomain
        let wwwResolvedIps: string[] = []
        let wwwConfigured = false
        try {
            wwwResolvedIps = await resolve4(`www.${domain}`)
            wwwConfigured = expectedIp ? wwwResolvedIps.includes(expectedIp) : wwwResolvedIps.length > 0
        } catch {
            // www subdomain not configured - that's okay
        }

        return {
            success: true,
            domain,
            expectedIp,
            dns: {
                configured: dnsConfigured,
                resolvedIps,
                error: dnsError
            },
            www: {
                configured: wwwConfigured,
                resolvedIps: wwwResolvedIps
            },
            ready: dnsConfigured, // Ready to proceed with SSL
            message: dnsConfigured
                ? `DNS configured correctly. Domain resolves to ${resolvedIps.join(', ')}`
                : dnsError || 'DNS not configured correctly'
        }
    } catch (error) {
        console.error('[admin/domains/check-dns] Error:', error)
        throw createError({
            statusCode: 500,
            message: `Failed to check DNS: ${(error as Error).message}`
        })
    }
})
