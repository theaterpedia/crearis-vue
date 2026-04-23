/**
 * Server-side proxy for Odoo GraphQL operations (T3a-Basic).
 *
 * Routes GraphQL queries/mutations through Nitro to avoid CORS on prod Odoo
 * and to forward the browser session cookie for authenticated queries.
 *
 * Ported from crearis-nuxt/apps/home/server/api/graphql.post.ts with additions
 * per HANDOFF_CV.md Task 1 (cookie + REAL-IP + resquest-host forwarding).
 *
 * Route: POST /api/odoo/graphql
 * Env:   ODOO_GRAPHQL_URL (via runtimeConfig.public.odooGraphqlUrl)
 */

import { defineEventHandler, readBody, createError } from 'h3'

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

  try {
    const response = await fetch(graphqlUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(event.node.req.headers.cookie
          ? { Cookie: event.node.req.headers.cookie }
          : {}),
        'REAL-IP': event.node.req.socket.remoteAddress || '',
        'resquest-host': event.node.req.headers.host || '',
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
