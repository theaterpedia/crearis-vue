/**
 * 02-auth.ts — Odoo→CV bridging middleware (SSO-StepB §3.1).
 *
 * Q-StepA-1 (b) unified-experience: a Tier-1-Creator arrives on a cand2_uia
 * subdomain having authenticated via Office365-SSO at service.dasei.eu. They
 * carry an Odoo `session_id` cookie. If they have no CV-local `sessionId` yet,
 * this middleware lazy-creates a CV session (looking up the matching CV user
 * row via partner_id) and sets the CV cookie.
 *
 * Post-FLIP (CO@prod sets Odoo `session_cookie.domain = .dasei.eu`), the Odoo
 * cookie is visible on cand2_uia subdomains and this middleware bridges.
 * Pre-FLIP, the Odoo cookie is host-only on service.dasei.eu and never reaches
 * cand2_uia — the middleware no-ops, and existing CV login-flow handles auth.
 *
 * The middleware runs on every request because Nitro scans `server/middleware/`
 * — but fast-paths the common case (CV cookie present OR no Odoo cookie) so
 * the non-SSO request cost is one cookie lookup.
 *
 * Audit trail: every lazy-create logs:
 *   `[auth] lazy-create CV-session for-partner-id=<id> from-Odoo-cookie`
 *
 * Per CTO-WED-package §3.1 + Q-StepA-3 Path-B (Odoo `Domain=.dasei.eu`).
 */

import { defineEventHandler, getCookie, setCookie } from 'h3'
import { nanoid } from 'nanoid'
import { db } from '../database/init'
import { sessions, type SessionData } from '../utils/session-store'

const CV_COOKIE = 'sessionId'
const ODOO_COOKIE = 'session_id'
const CV_SESSION_TTL_MS = 24 * 60 * 60 * 1000 // matches login.post.ts

/** Reasons the middleware decides to skip — used in tests + structured logs. */
export type BridgeSkipReason =
    | 'cv-cookie-present'
    | 'no-odoo-cookie'
    | 'cv-and-odoo-both-present'

/** Pre-flight decision (pure) — should we attempt to bridge Odoo→CV here? */
export function shouldAttemptBridge(input: {
    cvCookie: string | undefined
    odooCookie: string | undefined
    now: number
}): { attempt: true } | { attempt: false; reason: BridgeSkipReason } {
    if (input.cvCookie) {
        const session = sessions.get(input.cvCookie)
        if (session && session.expiresAt >= input.now) {
            return input.odooCookie
                ? { attempt: false, reason: 'cv-and-odoo-both-present' }
                : { attempt: false, reason: 'cv-cookie-present' }
        }
        // Stale CV cookie — treat as absent; the bridge may succeed and replace it.
    }
    if (!input.odooCookie) {
        return { attempt: false, reason: 'no-odoo-cookie' }
    }
    return { attempt: true }
}

/** Shape returned by Odoo `/web/session/get_session_info`. */
export interface OdooSessionInfo {
    uid: number | false
    partner_id: number | false
    username?: string
    name?: string
}

/**
 * Default Odoo session-info fetcher — calls Odoo's classic
 * `/web/session/get_session_info` JSON-RPC endpoint with the inbound cookie.
 * Injectable for tests via {@link bridgeFromOdoo}.
 */
export async function fetchOdooSessionInfo(
    odooSessionId: string,
): Promise<OdooSessionInfo | null> {
    const odooUrl = process.env.ODOO_URL || 'https://service.dasei.eu'
    try {
        const response = await fetch(`${odooUrl}/web/session/get_session_info`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Cookie: `${ODOO_COOKIE}=${odooSessionId}`,
            },
            body: JSON.stringify({ jsonrpc: '2.0', method: 'call', params: {} }),
        })
        if (!response.ok) return null
        const json = (await response.json()) as { result?: OdooSessionInfo; error?: unknown }
        if (json.error || !json.result) return null
        return json.result
    } catch (err) {
        console.error('[auth] Odoo session-info fetch error:', err)
        return null
    }
}

/** Looks up the CV user row whose `partner_id` matches the Odoo partner. */
async function findCvUserByPartner(partnerId: number): Promise<{
    id: number
    sysmail: string
    username: string
    status: number | null
    img_id: number | null
    role: string
} | null> {
    const row = (await db.get(
        `SELECT id, sysmail, username, status, img_id, role
         FROM users
         WHERE partner_id = ?
         LIMIT 1`,
        [partnerId],
    )) as
        | {
              id: number
              sysmail: string
              username: string
              status: number | null
              img_id: number | null
              role: string
          }
        | undefined
    return row ?? null
}

/** Minimal CV session-data scaffold for a lazy-bridged user. */
function buildBridgedSessionData(
    user: NonNullable<Awaited<ReturnType<typeof findCvUserByPartner>>>,
    odooInfo: OdooSessionInfo,
): SessionData {
    const partnerId =
        typeof odooInfo.partner_id === 'number' ? odooInfo.partner_id : null
    return {
        userId: user.id,
        sysmail: user.sysmail,
        username: user.username,
        status: user.status,
        partner_id: partnerId,
        img_id: user.img_id,
        availableRoles: [user.role],
        activeRole: user.role,
        projectId: null,
        projectName: undefined,
        projects: [],
        capabilities: {},
        expiresAt: Date.now() + CV_SESSION_TTL_MS,
    }
}

/**
 * Core bridge — orchestrates fetch + user-lookup + session-create. Injectable
 * dependencies so the test-suite covers the branches without a live Odoo.
 * Returns the new sessionId on success, null otherwise (logs reason).
 */
export async function bridgeFromOdoo(
    odooSessionId: string,
    deps: {
        fetchInfo?: typeof fetchOdooSessionInfo
        findUser?: typeof findCvUserByPartner
    } = {},
): Promise<{ sessionId: string; session: SessionData } | null> {
    const fetchInfo = deps.fetchInfo ?? fetchOdooSessionInfo
    const findUser = deps.findUser ?? findCvUserByPartner

    const info = await fetchInfo(odooSessionId)
    if (!info || info.uid === false || typeof info.uid !== 'number') {
        return null
    }
    if (info.partner_id === false || typeof info.partner_id !== 'number') {
        console.warn('[auth] Odoo session has no partner_id — cannot bridge')
        return null
    }

    const user = await findUser(info.partner_id)
    if (!user) {
        console.warn(
            `[auth] no CV user for partner-id=${info.partner_id} — skipping bridge`,
        )
        return null
    }

    const sessionId = nanoid(32)
    const session = buildBridgedSessionData(user, info)
    sessions.set(sessionId, session)
    console.log(
        `[auth] lazy-create CV-session for-partner-id=${info.partner_id} from-Odoo-cookie`,
    )
    return { sessionId, session }
}

export default defineEventHandler(async (event) => {
    const decision = shouldAttemptBridge({
        cvCookie: getCookie(event, CV_COOKIE),
        odooCookie: getCookie(event, ODOO_COOKIE),
        now: Date.now(),
    })
    if (!decision.attempt) {
        return
    }

    const odooSessionId = getCookie(event, ODOO_COOKIE) as string
    const result = await bridgeFromOdoo(odooSessionId)
    if (!result) {
        return
    }

    setCookie(event, CV_COOKIE, result.sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: CV_SESSION_TTL_MS / 1000,
        path: '/',
    })

    // Attach to event.context so downstream handlers (e.g. /api/auth/verify
    // in the same request) see the auth without needing the round-trip
    // cookie that we just set in the response.
    ;(event.context as { session?: { userId: number } }).session = {
        userId: result.session.userId,
    }
})
