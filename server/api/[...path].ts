/**
 * Catch-all for unknown `/api/*` paths — JSON 404 instead of Nitro's default.
 *
 * Without this handler, an unknown path under `/api/` falls through to Nitro's
 * SPA-catch-all, which answers 200 with an empty body and no Content-Type.
 * Any browser-side `JSON.parse` on that empty body throws, producing the
 * "Unexpected token '<' … is not valid JSON" banner class of defects.
 *
 * File-based routing in Nitro: `[...path].ts` (no method suffix) is the lowest-
 * priority route inside `server/api/`; more-specific routes still win.
 * The catch-all fires ONLY when no other handler matched.
 *
 * Per deploy-uia thread `hcv/threads/2026-08_deploy-uia.md` · D-1 server-side
 * residual · finding pinned via `/api/pages?projectId=1&pageType=landing`
 * on 2026-08-07 evening.
 *
 * Instance: CV@prod (Kern)
 */
import { defineEventHandler, createError } from 'h3'

export default defineEventHandler((event) => {
    throw createError({
        statusCode: 404,
        statusMessage: 'API endpoint not found',
        message: `No API handler for ${event.node.req.method} ${event.node.req.url}`,
    })
})
