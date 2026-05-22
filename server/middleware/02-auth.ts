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
import { hydrateUserProjectsAndRole } from '../utils/user-projects'

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

/** Shape returned by the user-lookup — kept narrow to what buildBridgedSessionData reads. */
interface BridgedCvUser {
    id: number
    sysmail: string
    username: string
    status: number | null
    img_id: number | null
    role: string
}

/**
 * Looks up the CV user row matching either the Odoo partner_id (strong link)
 * or the Odoo email (fallback via sysmail / extmail).
 *
 * Per CTO hot-patch dispatch 2026-05-22 02:15 (Phase-D scenario 3): the
 * pre-patch lookup matched on `partner_id` only. HM's CV-user had a NULL
 * partner_id but extmail matching the Odoo-authenticated email — bridge
 * returned null cleanly, C6 half-authed guard fired with "no matching CV
 * account". Widening the lookup to include email-fallback recovers users
 * whose partner_id is NULL or stale-relative-to-Odoo (legacy users, data-
 * drift, cross-instance migration).
 *
 * Resolution order:
 *   1. partner_id match (definitive link when set)
 *   2. email match against sysmail OR extmail (fallback)
 *
 * partner_id is preferred so a CV-user explicitly linked to a partner takes
 * precedence over any unrelated email-collision row.
 */
async function findCvUser(
    partnerId: number,
    email: string | undefined,
): Promise<BridgedCvUser | null> {
    const select =
        'SELECT id, sysmail, username, status, img_id, role FROM users'

    const byPartner = (await db.get(
        `${select} WHERE partner_id = ? LIMIT 1`,
        [partnerId],
    )) as BridgedCvUser | undefined
    if (byPartner) return byPartner

    if (!email) return null
    const byEmail = (await db.get(
        `${select} WHERE sysmail = ? OR extmail = ? LIMIT 1`,
        [email, email],
    )) as BridgedCvUser | undefined
    return byEmail ?? null
}

/**
 * Build a fully-populated CV session-data for a lazy-bridged user, including
 * project memberships + role-promotion via the shared
 * `hydrateUserProjectsAndRole` helper.
 *
 * Per CV@prod barrier-2 dispatch 2026-05-22 14:29 (feed `af21dae`): the
 * pre-patch shape returned `availableRoles: [user.role]` + `activeRole:
 * user.role` + `projects: []` regardless of project memberships. Result:
 * Odoo-SSO bridged users couldn't switch to project-role · all subsequent
 * `/api/auth/set-project` calls 403 with "Project role required". This now
 * mirrors `login.post.ts` so both auth paths produce symmetric SessionData.
 */
async function buildBridgedSessionData(
    user: BridgedCvUser,
    odooInfo: OdooSessionInfo,
    deps: { hydrate?: typeof hydrateUserProjectsAndRole } = {},
): Promise<SessionData> {
    const hydrate = deps.hydrate ?? hydrateUserProjectsAndRole
    const partnerId =
        typeof odooInfo.partner_id === 'number' ? odooInfo.partner_id : null
    const {
        projectRecords,
        availableRoles,
        activeRole,
        initialProjectId,
        initialProjectName,
    } = await hydrate({
        id: user.id,
        role: user.role,
        partner_id: partnerId,
    })

    return {
        userId: user.id,
        sysmail: user.sysmail,
        username: user.username,
        status: user.status,
        partner_id: partnerId,
        img_id: user.img_id,
        availableRoles,
        activeRole,
        projectId: initialProjectId,
        projectName: initialProjectName,
        projects: projectRecords,
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
        findUser?: typeof findCvUser
        hydrate?: typeof hydrateUserProjectsAndRole
    } = {},
): Promise<{ sessionId: string; session: SessionData } | null> {
    const fetchInfo = deps.fetchInfo ?? fetchOdooSessionInfo
    const findUser = deps.findUser ?? findCvUser

    const info = await fetchInfo(odooSessionId)
    if (!info || info.uid === false || typeof info.uid !== 'number') {
        return null
    }
    if (info.partner_id === false || typeof info.partner_id !== 'number') {
        console.warn('[auth] Odoo session has no partner_id — cannot bridge')
        return null
    }

    const user = await findUser(info.partner_id, info.username)
    if (!user) {
        console.warn(
            `[auth] no CV user matching partner-id=${info.partner_id} or email=${info.username ?? '<none>'} — skipping bridge`,
        )
        return null
    }

    const sessionId = nanoid(32)
    const session = await buildBridgedSessionData(user, info, {
        hydrate: deps.hydrate,
    })
    sessions.set(sessionId, session)
    console.log(
        `[auth] lazy-create CV-session for-partner-id=${info.partner_id} from-Odoo-cookie role=${session.activeRole} projects=${session.projects?.length ?? 0}`,
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
