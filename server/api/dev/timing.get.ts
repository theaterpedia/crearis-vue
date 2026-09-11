/**
 * `GET /api/dev/timing?key=…` — read the cheap-path timing series (R·4·6).
 *
 * The instrument's own failure mode is producing nothing, and nothing looks
 * exactly like a quiet system. This endpoint is what distinguishes them:
 * `sampled: 0` on every class means the middleware is not running, `since`
 * says when the counters last reset (a restart), and the per-class split is
 * the shape CM-A6·5's metric-set wants recorded month-to-month.
 *
 * 🔴 CHEAP PATH ONLY. The Odoo web session never enters this process — the
 * expensive half belongs to the A6 dispatch (CV@prod + CO@prod). Do not derive
 * a cheap/expensive ratio from this endpoint alone; that is the blended figure
 * CM-A6·4 names as a trap.
 *
 * Guarded exactly like `/api/dev/login-as` and `/api/dev/sync` — not-production
 * · `DEV_LOGIN` ≥16 chars · matching `?key=`. Any failure answers a bare 404:
 * the route denies its own existence rather than advertising a disabled one.
 * A monitored series is not secret, but the *shape* of an instance's traffic is
 * not a thing to hand to an anonymous caller either.
 */

import { createError, defineEventHandler, getQuery } from 'h3'
import { denyReason } from '../../utils/dev-login-guard'
import { timingSnapshot } from '../../utils/request-timing'

export default defineEventHandler((event) => {
    const query = getQuery(event)

    const denied = denyReason({
        nodeEnv: process.env.NODE_ENV,
        devLogin: process.env.DEV_LOGIN,
        key: query.key ? String(query.key) : undefined,
    })
    if (denied) {
        console.warn(`[dev/timing] denied · reason=${denied}`)
        throw createError({ statusCode: 404, statusMessage: 'Not Found' })
    }

    return timingSnapshot()
})
