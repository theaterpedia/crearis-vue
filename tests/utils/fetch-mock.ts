/**
 * Fetch Mock Utilities
 * 
 * Helpers for mocking fetch API in tests.
 * Simplifies testing of data-driven components that call APIs.
 * 
 * @module tests/utils/fetch-mock
 */

import { vi, expect } from 'vitest'
import type { MockEntityData } from './clist-test-data'

/**
 * Mock successful fetch response
 * 
 * Sets up global.fetch to return successful response with provided data.
 * 
 * @param data - Data to return from fetch
 * 
 * @example
 * import { mockFetchSuccess } from '../../utils/fetch-mock'
 * import { createMockEvents } from '../../utils/clist-test-data'
 * 
 * const events = createMockEvents(5)
 * mockFetchSuccess(events)
 * 
 * // Now any fetch() call returns the events
 * const response = await fetch('/api/entities/events')
 * const data = await response.json()
 * // data === events
 */
export function mockFetchSuccess(data: any): void {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    statusText: 'OK',
    json: async () => data,
    text: async () => JSON.stringify(data),
    headers: new Headers({ 'Content-Type': 'application/json' })
  } as Response)
}

/**
 * Mock failed fetch response
 * 
 * Sets up global.fetch to return error response.
 * 
 * @param message - Error message
 * @param status - HTTP status code (default: 500)
 * 
 * @example
 * import { mockFetchError } from '../../utils/fetch-mock'
 * 
 * mockFetchError('Not Found', 404)
 * 
 * const response = await fetch('/api/entities/events')
 * expect(response.ok).toBe(false)
 * expect(response.status).toBe(404)
 */
export function mockFetchError(message: string, status = 500): void {
  global.fetch = vi.fn().mockResolvedValue({
    ok: false,
    status,
    statusText: message,
    json: async () => ({ error: message }),
    text: async () => message,
    headers: new Headers({ 'Content-Type': 'application/json' })
  } as Response)
}

/**
 * Mock fetch with specific endpoint responses
 * 
 * Sets up global.fetch to return different data based on URL.
 * Useful for testing components that call multiple endpoints.
 * 
 * @param endpointMap - Map of URL patterns to response data
 * 
 * @example
 * import { mockFetchWithEndpoints } from '../../utils/fetch-mock'
 * import { createMockEvents, createMockInstructors } from '../../utils/clist-test-data'
 * 
 * mockFetchWithEndpoints({
 *   '/api/entities/events': createMockEvents(5),
 *   '/api/entities/instructors': createMockInstructors(3),
 *   '/api/users/current': { id: 1, username: 'admin' }
 * })
 * 
 * // Different endpoints return different data
 * const events = await (await fetch('/api/entities/events')).json()
 * const instructors = await (await fetch('/api/entities/instructors')).json()
 */
export function mockFetchWithEndpoints(endpointMap: Record<string, any>): void {
  global.fetch = vi.fn((url: string | URL | Request) => {
    const urlStr = url.toString()

    for (const [endpoint, data] of Object.entries(endpointMap)) {
      if (urlStr.includes(endpoint)) {
        return Promise.resolve({
          ok: true,
          status: 200,
          statusText: 'OK',
          json: async () => data,
          text: async () => JSON.stringify(data),
          headers: new Headers({ 'Content-Type': 'application/json' })
        } as Response)
      }
    }

    // No match - return 404
    return Promise.resolve({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      json: async () => ({ error: 'Endpoint not mocked' }),
      text: async () => 'Endpoint not mocked',
      headers: new Headers({ 'Content-Type': 'application/json' })
    } as Response)
  })
}

/**
 * Mock entity API response
 * 
 * Convenience function for mocking /api/entities/:entity endpoints.
 * 
 * @param entity - Entity type (e.g., 'events', 'instructors')
 * @param data - Array of entity data to return
 * 
 * @example
 * import { mockEntityAPI } from '../../utils/fetch-mock'
 * import { createMockEvents } from '../../utils/clist-test-data'
 * 
 * mockEntityAPI('events', createMockEvents(5))
 * 
 * const response = await fetch('/api/entities/events')
 * const events = await response.json()
 * // events.length === 5
 */
export function mockEntityAPI(entity: string, data: MockEntityData[]): void {
  mockFetchSuccess(data)
}

/**
 * Mock entity API error
 * 
 * Convenience function for mocking failed /api/entities/:entity requests.
 * 
 * @param entity - Entity type (e.g., 'events', 'instructors')
 * @param message - Error message
 * 
 * @example
 * import { mockEntityAPIError } from '../../utils/fetch-mock'
 * 
 * mockEntityAPIError('events', 'Database connection failed')
 * 
 * const response = await fetch('/api/entities/events')
 * expect(response.ok).toBe(false)
 */
export function mockEntityAPIError(entity: string, message: string): void {
  mockFetchError(message, 500)
}

/**
 * Verify fetch was called with correct endpoint
 * 
 * Assertion helper to check fetch was called with expected URL.
 * 
 * @param endpoint - Expected endpoint substring
 * 
 * @example
 * import { expectFetchCalledWith } from '../../utils/fetch-mock'
 * 
 * // After component mounts and fetches data
 * await flushPromises()
 * 
 * expectFetchCalledWith('/api/entities/events')
 */
export function expectFetchCalledWith(endpoint: string): void {
  expect(global.fetch).toHaveBeenCalledWith(
    expect.stringContaining(endpoint)
  )
}

/**
 * Verify fetch was called specific number of times
 * 
 * @param times - Expected number of calls
 * 
 * @example
 * import { expectFetchCalledTimes } from '../../utils/fetch-mock'
 * 
 * // After component lifecycle
 * expectFetchCalledTimes(1) // Called once
 */
export function expectFetchCalledTimes(times: number): void {
  expect(global.fetch).toHaveBeenCalledTimes(times)
}

/**
 * Get all fetch calls made
 * 
 * Returns array of [url, options] pairs for all fetch calls.
 * Useful for debugging or complex assertions.
 * 
 * @returns Array of fetch call arguments
 * 
 * @example
 * import { getFetchCalls } from '../../utils/fetch-mock'
 * 
 * const calls = getFetchCalls()
 * console.log('Fetch calls:', calls)
 * 
 * expect(calls).toHaveLength(2)
 * expect(calls[0][0]).toContain('/api/entities/events')
 */
export function getFetchCalls(): Array<[string | URL | Request, RequestInit?]> {
  const mockFn = global.fetch as unknown as ReturnType<typeof vi.fn>
  return mockFn.mock.calls as Array<[string | URL | Request, RequestInit?]>
}

/**
 * Build successful response object
 * 
 * Helper for creating Response objects in custom mocks.
 * 
 * @param data - Response data
 * @returns Mock Response object
 * 
 * @example
 * import { buildSuccessResponse } from '../../utils/fetch-mock'
 * 
 * global.fetch = vi.fn((url) => {
 *   if (url.includes('/special-endpoint')) {
 *     return Promise.resolve(buildSuccessResponse({ special: true }))
 *   }
 *   return Promise.resolve(buildSuccessResponse([]))
 * })
 */
export function buildSuccessResponse(data: any): Response {
  return {
    ok: true,
    status: 200,
    statusText: 'OK',
    json: async () => data,
    text: async () => JSON.stringify(data),
    headers: new Headers({ 'Content-Type': 'application/json' })
  } as Response
}

/**
 * Build error response object
 * 
 * Helper for creating error Response objects in custom mocks.
 * 
 * @param message - Error message
 * @param status - HTTP status code
 * @returns Mock Response object
 * 
 * @example
 * import { buildErrorResponse } from '../../utils/fetch-mock'
 * 
 * global.fetch = vi.fn((url) => {
 *   if (url.includes('/unauthorized')) {
 *     return Promise.resolve(buildErrorResponse('Unauthorized', 401))
 *   }
 *   return Promise.resolve(buildSuccessResponse([]))
 * })
 */
export function buildErrorResponse(message: string, status: number): Response {
  return {
    ok: false,
    status,
    statusText: message,
    json: async () => ({ error: message }),
    text: async () => message,
    headers: new Headers({ 'Content-Type': 'application/json' })
  } as Response
}

/**
 * Clear all fetch mocks
 * 
 * Resets fetch mock state. Use in afterEach to clean up.
 * 
 * @example
 * import { clearFetchMocks } from '../../utils/fetch-mock'
 * 
 * afterEach(() => {
 *   clearFetchMocks()
 * })
 */
export function clearFetchMocks(): void {
  if (global.fetch && typeof global.fetch === 'function') {
    const mockFn = global.fetch as unknown as ReturnType<typeof vi.fn>
    if (mockFn.mockClear) {
      mockFn.mockClear()
    }
  }
}

/**
 * Mock fetch with delay
 * 
 * Simulates network latency for testing loading states.
 * 
 * @param data - Data to return
 * @param delayMs - Delay in milliseconds
 * 
 * @example
 * import { mockFetchWithDelay } from '../../utils/fetch-mock'
 * 
 * // Simulate slow network
 * mockFetchWithDelay(createMockEvents(10), 1000)
 * 
 * const wrapper = mount(ItemList, { props: { entity: 'events' }})
 * 
 * // Loading state should be visible
 * expect(wrapper.find('.loading').exists()).toBe(true)
 * 
 * // Wait for delay
 * await new Promise(resolve => setTimeout(resolve, 1100))
 * await flushPromises()
 * 
 * // Now data should be loaded
 * expect(wrapper.find('.loading').exists()).toBe(false)
 */
export function mockFetchWithDelay(data: any, delayMs: number): void {
  global.fetch = vi.fn().mockImplementation(() =>
    new Promise(resolve =>
      setTimeout(() => {
        resolve({
          ok: true,
          status: 200,
          statusText: 'OK',
          json: async () => data,
          text: async () => JSON.stringify(data),
          headers: new Headers({ 'Content-Type': 'application/json' })
        } as Response)
      }, delayMs)
    )
  )
}

/**
 * Mock fetch that fails after delay
 * 
 * Simulates timeout or slow failing request.
 * 
 * @param message - Error message
 * @param delayMs - Delay in milliseconds
 * @param status - HTTP status code
 * 
 * @example
 * import { mockFetchErrorWithDelay } from '../../utils/fetch-mock'
 * 
 * mockFetchErrorWithDelay('Timeout', 5000, 504)
 */
export function mockFetchErrorWithDelay(
  message: string,
  delayMs: number,
  status = 500
): void {
  global.fetch = vi.fn().mockImplementation(() =>
    new Promise(resolve =>
      setTimeout(() => {
        resolve({
          ok: false,
          status,
          statusText: message,
          json: async () => ({ error: message }),
          text: async () => message,
          headers: new Headers({ 'Content-Type': 'application/json' })
        } as Response)
      }, delayMs)
    )
  )
}
