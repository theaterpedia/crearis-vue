/**
 * GraphQL composable — calls the Nitro proxy at /api/odoo/graphql.
 *
 * Hand-written template-literal queries live alongside each domain-composable
 * (e.g. useControllingLines.ts). This composable only handles transport.
 */

export interface GraphQLError {
  message: string
  [key: string]: unknown
}

export interface GraphQLResponse<T> {
  data?: T
  errors?: GraphQLError[]
}

export function useGraphql() {
  async function query<T>(
    queryString: string,
    variables: Record<string, unknown> = {},
  ): Promise<T> {
    const response = await fetch('/api/odoo/graphql', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: queryString, variables }),
    })

    if (!response.ok) {
      throw new Error(`GraphQL fetch failed: ${response.status} ${response.statusText}`)
    }

    const json = (await response.json()) as GraphQLResponse<T>

    if (json.errors && json.errors.length > 0) {
      throw new Error(json.errors[0].message)
    }

    if (json.data === undefined) {
      throw new Error('GraphQL response missing data field')
    }

    return json.data
  }

  return { query }
}
