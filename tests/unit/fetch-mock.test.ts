/**
 * fetch-mock - Unit Tests
 * 
 * Validates fetch mocking utilities work correctly.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  mockFetchSuccess,
  mockFetchError,
  mockFetchWithEndpoints,
  mockEntityAPI,
  mockEntityAPIError,
  expectFetchCalledWith,
  expectFetchCalledTimes,
  getFetchCalls,
  buildSuccessResponse,
  buildErrorResponse,
  clearFetchMocks,
  mockFetchWithDelay,
  mockFetchErrorWithDelay
} from '../utils/fetch-mock'
import { createMockEvents, createMockInstructors } from '../utils/clist-test-data'

describe('fetch-mock Utilities', () => {
  beforeEach(() => {
    // Reset fetch before each test
    delete (global as any).fetch
  })

  afterEach(() => {
    clearFetchMocks()
  })

  describe('mockFetchSuccess', () => {
    it('should mock successful response', async () => {
      const data = { test: 'data' }
      mockFetchSuccess(data)

      const response = await fetch('/api/test')
      const json = await response.json()

      expect(response.ok).toBe(true)
      expect(response.status).toBe(200)
      expect(json).toEqual(data)
    })

    it('should work with array data', async () => {
      const events = createMockEvents(5)
      mockFetchSuccess(events)

      const response = await fetch('/api/entities/events')
      const json = await response.json()

      expect(json).toHaveLength(5)
      expect(json[0].id).toBe(1)
    })
  })

  describe('mockFetchError', () => {
    it('should mock error response', async () => {
      mockFetchError('Not Found', 404)

      const response = await fetch('/api/test')
      const json = await response.json()

      expect(response.ok).toBe(false)
      expect(response.status).toBe(404)
      expect(json.error).toBe('Not Found')
    })

    it('should default to 500 status', async () => {
      mockFetchError('Server Error')

      const response = await fetch('/api/test')

      expect(response.status).toBe(500)
    })
  })

  describe('mockFetchWithEndpoints', () => {
    it('should return different data for different endpoints', async () => {
      const events = createMockEvents(5)
      const instructors = createMockInstructors(3)

      mockFetchWithEndpoints({
        '/api/entities/events': events,
        '/api/entities/instructors': instructors
      })

      const eventsResponse = await fetch('/api/entities/events')
      const instructorsResponse = await fetch('/api/entities/instructors')

      const eventsJson = await eventsResponse.json()
      const instructorsJson = await instructorsResponse.json()

      expect(eventsJson).toHaveLength(5)
      expect(instructorsJson).toHaveLength(3)
    })

    it('should return 404 for unmocked endpoints', async () => {
      mockFetchWithEndpoints({
        '/api/entities/events': []
      })

      const response = await fetch('/api/entities/unknown')

      expect(response.ok).toBe(false)
      expect(response.status).toBe(404)
    })

    it('should handle partial URL matches', async () => {
      mockFetchWithEndpoints({
        '/events': createMockEvents(1)
      })

      const response = await fetch('http://localhost:3000/api/entities/events')
      const json = await response.json()

      expect(json).toHaveLength(1)
    })
  })

  describe('mockEntityAPI', () => {
    it('should mock entity API', async () => {
      const events = createMockEvents(10)
      mockEntityAPI('events', events)

      const response = await fetch('/api/entities/events')
      const json = await response.json()

      expect(json).toHaveLength(10)
    })
  })

  describe('mockEntityAPIError', () => {
    it('should mock entity API error', async () => {
      mockEntityAPIError('events', 'Database error')

      const response = await fetch('/api/entities/events')
      const json = await response.json()

      expect(response.ok).toBe(false)
      expect(json.error).toBe('Database error')
    })
  })

  describe('expectFetchCalledWith', () => {
    it('should verify fetch was called with endpoint', async () => {
      mockFetchSuccess([])

      await fetch('/api/entities/events')

      expectFetchCalledWith('/api/entities/events')
    })

    it('should work with partial endpoint match', async () => {
      mockFetchSuccess([])

      await fetch('http://localhost:3000/api/entities/events?filter=active')

      expectFetchCalledWith('/entities/events')
    })
  })

  describe('expectFetchCalledTimes', () => {
    it('should verify fetch call count', async () => {
      mockFetchSuccess([])

      await fetch('/api/test')
      await fetch('/api/test')
      await fetch('/api/test')

      expectFetchCalledTimes(3)
    })

    it('should work with zero calls', () => {
      mockFetchSuccess([])

      // Don't call fetch

      expectFetchCalledTimes(0)
    })
  })

  describe('getFetchCalls', () => {
    it('should return all fetch calls', async () => {
      mockFetchSuccess([])

      await fetch('/api/test1')
      await fetch('/api/test2')

      const calls = getFetchCalls()

      expect(calls).toHaveLength(2)
      expect(calls[0][0]).toBe('/api/test1')
      expect(calls[1][0]).toBe('/api/test2')
    })

    it('should return empty array when no calls', () => {
      mockFetchSuccess([])

      const calls = getFetchCalls()

      expect(calls).toHaveLength(0)
    })
  })

  describe('buildSuccessResponse', () => {
    it('should build success response', async () => {
      const data = { test: 'data' }
      const response = buildSuccessResponse(data)

      expect(response.ok).toBe(true)
      expect(response.status).toBe(200)

      const json = await response.json()
      expect(json).toEqual(data)
    })
  })

  describe('buildErrorResponse', () => {
    it('should build error response', async () => {
      const response = buildErrorResponse('Error', 500)

      expect(response.ok).toBe(false)
      expect(response.status).toBe(500)

      const json = await response.json()
      expect(json.error).toBe('Error')
    })
  })

  describe('clearFetchMocks', () => {
    it('should clear fetch mock state', async () => {
      mockFetchSuccess([])

      await fetch('/api/test')

      clearFetchMocks()

      const calls = getFetchCalls()
      expect(calls).toHaveLength(0)
    })

    it('should not throw if fetch not mocked', () => {
      expect(() => clearFetchMocks()).not.toThrow()
    })
  })

  describe('mockFetchWithDelay', () => {
    it('should delay response', async () => {
      const data = { test: 'data' }
      mockFetchWithDelay(data, 100)

      const start = Date.now()
      const response = await fetch('/api/test')
      const duration = Date.now() - start

      const json = await response.json()

      expect(duration).toBeGreaterThanOrEqual(95) // Allow 5ms tolerance
      expect(json).toEqual(data)
    })
  })

  describe('mockFetchErrorWithDelay', () => {
    it('should delay error response', async () => {
      mockFetchErrorWithDelay('Timeout', 100, 504)

      const start = Date.now()
      const response = await fetch('/api/test')
      const duration = Date.now() - start

      expect(duration).toBeGreaterThanOrEqual(95)
      expect(response.status).toBe(504)
    })
  })

  describe('Integration Scenarios', () => {
    it('should handle complex endpoint routing', async () => {
      mockFetchWithEndpoints({
        '/api/entities/events': createMockEvents(5),
        '/api/entities/instructors': createMockInstructors(3),
        '/api/users/current': { id: 1, username: 'admin' }
      })

      const events = await (await fetch('/api/entities/events')).json()
      const instructors = await (await fetch('/api/entities/instructors')).json()
      const user = await (await fetch('/api/users/current')).json()

      expect(events).toHaveLength(5)
      expect(instructors).toHaveLength(3)
      expect(user.username).toBe('admin')

      const calls = getFetchCalls()
      expect(calls).toHaveLength(3)
    })

    it('should handle error then success', async () => {
      // First request fails
      mockFetchError('Server Error', 500)
      const failResponse = await fetch('/api/test')
      expect(failResponse.ok).toBe(false)

      // Second request succeeds
      mockFetchSuccess({ success: true })
      const successResponse = await fetch('/api/test')
      expect(successResponse.ok).toBe(true)
    })
  })
})
