/**
 * GET /api/domains/check
 * Check if a domain name is available
 */

import { defineEventHandler, getQuery, createError } from 'h3'
import { db } from '../../database/init'

export default defineEventHandler(async (event) => {
    const query = getQuery(event)
    const domainname = query.name as string

    if (!domainname) {
        throw createError({
            statusCode: 400,
            message: 'Domain name is required',
        })
    }

    try {
        // Check if domain exists
        const existingDomain = await db.get(
            'SELECT id, domainname FROM domains WHERE domainname = $1',
            [domainname]
        )

        if (existingDomain) {
            return {
                available: false,
                domain: existingDomain,
                message: `Domain ${domainname} is already registered`,
            }
        }

        return {
            available: true,
            message: `Domain ${domainname} is available`,
        }
    } catch (error) {
        throw createError({
            statusCode: 500,
            message: `Failed to check domain availability: ${(error as Error).message}`,
        })
    }
})
