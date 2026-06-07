/**
 * Pure helper: extract Odoo's `session_id` value from a Set-Cookie header string.
 *
 * The Set-Cookie header reaching Nitro from Odoo may be a single cookie
 * (`session_id=abc; Path=/; HttpOnly`) or a comma-joined list of cookies
 * (`session_id=abc, frontend_lang=en, ...`). Node's `Response.headers.get()`
 * returns the comma-joined form when multiple cookies were set.
 *
 * Returns the raw `session_id` value (no decoding · Odoo emits it URL-safe),
 * or null when the header is missing / unparseable.
 *
 * Reused by C1/C2/C4 endpoints that capture the upstream Set-Cookie and
 * mirror Odoo's session into a CV-side session via `bridgeFromOdoo()`.
 */
export function parseOdooSessionFromSetCookie(
    setCookieHeader: string | null | undefined,
): string | null {
    if (!setCookieHeader) return null
    const match = /(?:^|[;,\s])session_id=([^;,\s]+)/.exec(setCookieHeader)
    return match?.[1] ?? null
}
