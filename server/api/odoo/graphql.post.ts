/**
 * Server-side proxy for Odoo GraphQL operations (T3a-Basic).
 *
 * Routes GraphQL queries/mutations through Nitro to avoid CORS on prod Odoo
 * and to forward the browser session cookie for authenticated queries.
 *
 * Ported from crearis-nuxt/apps/home/server/api/graphql.post.ts with additions
 * per HANDOFF_CV.md Task 1 (cookie + REAL-IP + resquest-host forwarding).
 *
 * Phase-A C5 refinement (whitepaper §4.2 pattern · plan §6):
 *   · Narrows the forwarded Cookie header to session_id only (was: the entire
 *     browser cookie blob). The upstream Odoo session-state only cares about
 *     session_id; forwarding the entire blob leaks unrelated CV-side cookies
 *     to Odoo (e.g. CV's sessionId nanoid · analytics cookies in future).
 *   · Swaps the raw event.node.req.{socket.remoteAddress, headers.host}
 *     accesses to h3 helpers getRequestIP / getRequestHost — co-stylistic
 *     alignment with the 4 new auth endpoints (C1-C4) + safer under future
 *     h3 internal-shape changes.
 *
 * The earlier draft of this commit-message referenced SHA c48ae1d as a
 * label-for-the-pattern. Per CO@prod cross-check 07ff15b: c48ae1d lives in
 * CN@prod's repo, not CV's — the SHA reference would mislead future-readers
 * grepping CV's history. Pattern is the whitepaper §4.2-pattern reference
 * + the Wave-0 T3a-Basic anchor.
 *
 * Route: POST /api/odoo/graphql
 * Env:   ODOO_GRAPHQL_URL (via runtimeConfig.public.odooGraphqlUrl)
 */

import {
  createError,
  defineEventHandler,
  getRequestHost,
  getRequestIP,
  parseCookies,
  readBody,
} from 'h3'

interface GraphqlRequestBody {
  query?: string
  variables?: Record<string, unknown>
}

export default defineEventHandler(async (event) => {
  const body = await readBody<GraphqlRequestBody>(event)

  if (!body?.query) {
    throw createError({
      statusCode: 400,
      message: 'Missing GraphQL query',
    })
  }

  const graphqlUrl =
    process.env.ODOO_GRAPHQL_URL || 'https://service.dasei.eu/graphql/vsf'

  // Narrow Cookie forwarding to session_id only (whitepaper §4.2 pattern).
  const cookies = parseCookies(event)
  const cookieHeader = cookies.session_id
    ? `session_id=${cookies.session_id}`
    : undefined

  try {
    const response = await fetch(graphqlUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(cookieHeader ? { Cookie: cookieHeader } : {}),
        'REAL-IP': getRequestIP(event) || '',
        'resquest-host': getRequestHost(event) || '',
      },
      body: JSON.stringify({
        query: body.query,
        variables: body.variables || {},
      }),
    })

    if (!response.ok) {
      throw createError({
        statusCode: response.status,
        message: `Odoo returned ${response.status}: ${response.statusText}`,
      })
    }

    return await response.json()
  } catch (error) {
    console.error('[graphql.post] Fetch error:', error)
    throw createError({
      statusCode: 500,
      message: error instanceof Error ? error.message : 'Network error',
    })
  }
})
