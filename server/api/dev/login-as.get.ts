/**
 * GET /api/dev/login-as — DEV-ONLY impersonation. Mint a real CV session for any
 * user without a password.
 *
 * ── Why this exists ──────────────────────────────────────────────────────────
 * Per HD 2026-07-28: the prod-side SSO is confirmed working (Phase-D scenarios
 * 1+2+3+5+6 ✓, 2026-05-22) and Odoo will not run on this box for a while. We do
 * not want to rebuild a working login just to reach the screens behind it — we
 * want to debug **what comes after** the login. So: say "now I am Rosa", "now I
 * am admin", and get on with it.
 *
 * ── Why an endpoint and not a CLI script ─────────────────────────────────────
 * The obvious shape — a terminal script that logs you in — cannot work here.
 * `sessions` is an in-memory `Map` inside the Nitro process
 * (`server/utils/session-store.ts:38`, "use Redis in production"). A separate
 * node process would write to its own Map and the running server would never see
 * it. So the session must be minted *inside* the server; the terminal calls this
 * endpoint rather than fabricating a session locally.
 *
 * ── Fidelity is the whole point ──────────────────────────────────────────────
 * This calls the SAME `hydrateUserProjectsAndRole()` helper that
 * `/api/auth/login` and the Odoo bridge both call — extracted for exactly that
 * symmetry (barrier-2, `server/utils/user-projects.ts`). Same `nanoid(32)`, same
 * 24h expiry, same `SessionData` shape, same cookie options. An impersonated
 * session is therefore indistinguishable downstream from a real one; if it
 * diverged, debugging against it would prove nothing.
 *
 * The ONLY thing skipped is the `bcrypt.compareSync` password check.
 *
 * ── Guards · three of them, all must pass ────────────────────────────────────
 *   1. `NODE_ENV !== 'production'`
 *   2. `DEV_LOGIN` must hold a token of >= 16 chars — absent by default, and
 *      `DEV_LOGIN=1` is deliberately too weak, so neither "running in dev" nor a
 *      habitual flag-flip opens this
 *   3. the request must present `?key=` matching that token
 *
 * A loopback check was the first design and is NOT used — it could never pass on
 * h3 2.0.1-rc.2 under `nitro dev` (no client-address signal exists), and the only
 * way to make it pass was to trust `x-forwarded-for`, which is client-supplied.
 * See `server/utils/dev-login-guard.ts` for the full reasoning.
 * Any failure returns a plain 404, i.e. the route denies its own existence
 * rather than advertising a disabled backdoor.
 *
 * ⚠ If this file ever appears in a production deployment, the guards are the
 * only thing between it and full account takeover. Do not weaken them, and do
 * not add a "just this once" bypass.
 *
 * ── Usage ────────────────────────────────────────────────────────────────────
 * Set a token in `.env` (gitignored) and start the backend with it:
 *   DEV_LOGIN=<a-long-random-string>       # >= 16 chars
 *
 *   # who can I be?
 *   curl -s 'localhost:3000/api/dev/login-as?key=$DEV_LOGIN' | jq
 *
 *   # browser: visit this and the cookie is set — then just navigate
 *   http://localhost:3001/api/dev/login-as?key=<token>&user=<username>
 *
 *   # curl with a cookie jar, for API-level debugging
 *   curl -s -c /tmp/cv.jar 'localhost:3000/api/dev/login-as?key=<token>&user=<username>'
 *   curl -s -b /tmp/cv.jar 'localhost:3000/api/auth/session' | jq
 *
 *   # pin role / project explicitly
 *   ...&role=admin&project=utopiaxaction
 */

import { defineEventHandler, getQuery, setCookie, createError } from 'h3'
import { nanoid } from 'nanoid'
import { db } from '../../database/init'
import { sessions, type SessionData } from '../../utils/session-store'
import { hydrateUserProjectsAndRole } from '../../utils/user-projects'
import { denyReason } from '../../utils/dev-login-guard'

interface DevUserRow {
    id: number
    sysmail: string
    extmail: string | null
    username: string
    role: string
    partner_id: number | null
    img_id: number | null
    status: number | null
}

export default defineEventHandler(async (event) => {
    const query = getQuery(event)

    const denied = denyReason({
        nodeEnv: process.env.NODE_ENV,
        devLogin: process.env.DEV_LOGIN,
        key: query.key ? String(query.key) : undefined,
    })
    if (denied) {
        // The RESPONSE denies existence — no hint about which guard tripped, and
        // no hint that a dev-login route exists at all. But log the reason
        // server-side: an endpoint that silently 404s is otherwise undebuggable,
        // and in production it is unreachable anyway so the log is dev-only noise.
        console.warn(`[dev/login-as] denied · reason=${denied} · NODE_ENV=${process.env.NODE_ENV}`)
        throw createError({ statusCode: 404, statusMessage: 'Not Found' })
    }
    const wanted = query.user ? String(query.user).trim() : ''

    // No `user` given → list who is available. Makes the endpoint
    // self-documenting on a devbox whose user-set is whatever got seeded.
    if (!wanted) {
        const users = await db.all<DevUserRow>(
            `SELECT id, sysmail, extmail, username, role, partner_id, img_id, status
             FROM users ORDER BY id`,
        )
        return {
            success: true,
            hint: 'pass ?user=<username|sysmail> to log in · optional &role= and &project=',
            count: users.length,
            users: users.map((u) => ({ id: u.id, username: u.username, sysmail: u.sysmail, role: u.role })),
        }
    }

    const user = await db.get<DevUserRow>(
        `SELECT id, sysmail, extmail, username, role, partner_id, img_id, status
         FROM users
         WHERE username = $1 OR sysmail = $1 OR extmail = $1
         LIMIT 1`,
        [wanted],
    )

    if (!user) {
        throw createError({
            statusCode: 404,
            message: `No user matching '${wanted}'. Call without ?user to list what exists on this box.`,
        })
    }

    // The canonical helper — same one both real auth paths call.
    const {
        projectRecords,
        availableRoles,
        activeRole,
        initialProjectId,
        initialProjectName,
    } = await hydrateUserProjectsAndRole({
        id: user.id,
        role: user.role,
        partner_id: typeof user.partner_id === 'number' ? user.partner_id : null,
    })

    // Optional overrides. `role` must be one the user actually has — an
    // impersonation that grants a role the real login would refuse teaches the
    // wrong thing about the screens behind it.
    let resolvedRole = activeRole
    if (query.role) {
        const asked = String(query.role)
        if (!availableRoles.includes(asked)) {
            throw createError({
                statusCode: 400,
                message: `User '${user.username}' has no role '${asked}'. availableRoles=[${availableRoles.join(', ')}]`,
            })
        }
        resolvedRole = asked
    }

    let resolvedProjectId = initialProjectId
    let resolvedProjectName = initialProjectName
    if (query.project) {
        const asked = String(query.project)
        const match = projectRecords.find((p) => p.domaincode === asked)
        if (!match) {
            throw createError({
                statusCode: 400,
                message: `User '${user.username}' has no access to project '${asked}'. `
                    + `projects=[${projectRecords.map((p) => p.domaincode).join(', ') || 'none'}]`,
            })
        }
        // by-domaincode-over-by-id (HD-discipline 2026-05-22): never fall back to
        // a numeric id here — downstream resolution expects the domaincode.
        resolvedProjectId = match.domaincode
        resolvedProjectName = match.heading || match.name
    }

    const sessionId = nanoid(32)
    const expiresAt = Date.now() + (24 * 60 * 60 * 1000)

    const sessionData: SessionData = {
        userId: user.id,
        sysmail: user.sysmail,
        username: user.username,
        status: user.status ?? null,
        partner_id: user.partner_id ?? null,
        img_id: user.img_id ?? null,
        availableRoles,
        activeRole: resolvedRole,
        projectId: resolvedProjectId,
        projectName: resolvedProjectName,
        projects: projectRecords,
        capabilities: {},
        expiresAt,
    }

    sessions.set(sessionId, sessionData)

    // Identical options to /api/auth/login. `secure` stays false in dev so the
    // cookie survives plain-http localhost.
    setCookie(event, 'sessionId', sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60,
        path: '/',
    })

    console.log(
        `[dev/login-as] impersonating '${user.username}' (id=${user.id}) `
        + `role=${resolvedRole} project=${resolvedProjectId ?? 'none'}`,
    )

    return {
        success: true,
        impersonated: true,
        message: `Now logged in as '${user.username}' (${resolvedRole})`,
        sessionId,
        user: {
            id: user.id,
            username: user.username,
            sysmail: user.sysmail,
            availableRoles,
            activeRole: resolvedRole,
            projectId: resolvedProjectId,
            projectName: resolvedProjectName,
            projects: projectRecords.map((p) => p.domaincode),
        },
    }
})
