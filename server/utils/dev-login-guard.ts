/**
 * The guard for `/api/dev/login-as` — kept as a pure module, deliberately.
 *
 * That endpoint mints a real CV session for any user with no password. In dev
 * that is the point (HD 2026-07-28: debug what comes *after* login rather than
 * rebuilding a login that already works on prod). Anywhere else it is full
 * account takeover, so the guard IS the security boundary.
 *
 * It lives here rather than in the handler because the handler imports `h3`,
 * which is nitro-provided and not resolvable from vitest — so a guard defined
 * inside it could only be tested by standing up a server. A security boundary
 * checked only by "we ran it and it seemed fine" is a boundary that rots. Same
 * reasoning that put `hydrateUserProjectsAndRole` in `user-projects.ts`
 * (barrier-2): extract the decision, test the decision.
 *
 * ── Why a token and not a loopback check ─────────────────────────────────────
 * The first cut required the request to come from loopback. It could never pass:
 * under `nitro dev` on h3 2.0.1-rc.2, `getRequestIP` reads
 * `event.req.context?.clientAddress || event.req.ip` and both are undefined, and
 * probing further found `runtime.node.req` carries no socket address either. So
 * there is no non-spoofable client-address signal available here.
 *
 * The two bad ways out were: keep a guard that always denies (a dead endpoint),
 * or read `x-forwarded-for` (client-supplied — spoofable, and worse than no
 * guard because it looks like one). Instead the third factor is a **shared
 * secret**: `DEV_LOGIN` holds a token, and the caller must present it. That is
 * not spoofable, does not depend on transport details, and still costs the
 * operator one env var they were setting anyway.
 *
 * Pinned by `tests/unit/dev-login-guards.test.ts`, including an exhaustive sweep
 * asserting the open case is the ONLY open case.
 */

export type DevLoginDenial = 'production' | 'not-enabled' | 'weak-token' | 'bad-key'

/** Minimum token length. Long enough that guessing is not a strategy. */
export const DEV_LOGIN_MIN_TOKEN = 16

/**
 * Three guards, all must pass.
 *
 *   1. never in production
 *   2. `DEV_LOGIN` must be set to a token of at least `DEV_LOGIN_MIN_TOKEN`
 *      chars — absent by default, and `DEV_LOGIN=1` is explicitly too weak, so
 *      neither "running in dev" nor a habitual flag-flip opens this
 *   3. the request must present `?key=` matching `DEV_LOGIN` exactly
 *
 * @returns `null` when the route may run, otherwise which guard tripped.
 *   The caller turns any denial into a plain 404 — the route denies its own
 *   existence rather than advertising a disabled backdoor, so the reason is for
 *   logs and tests, never for the response body.
 */
export function denyReason(input: {
    nodeEnv: string | undefined
    devLogin: string | undefined
    key: string | undefined
}): DevLoginDenial | null {
    if (input.nodeEnv === 'production') return 'production'
    if (!input.devLogin) return 'not-enabled'
    if (input.devLogin.length < DEV_LOGIN_MIN_TOKEN) return 'weak-token'
    if (!input.key || !timingSafeEqualStr(input.key, input.devLogin)) return 'bad-key'
    return null
}

/**
 * Length-independent, early-exit-free string compare.
 *
 * Not because a timing attack on a devbox is a credible threat — it is not —
 * but because the alternative is `a === b`, and this is the one place in the
 * codebase where someone might later copy the comparison into a context where
 * it does matter.
 */
function timingSafeEqualStr(a: string, b: string): boolean {
    if (a.length !== b.length) return false
    let diff = 0
    for (let i = 0; i < a.length; i++) {
        diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
    }
    return diff === 0
}
