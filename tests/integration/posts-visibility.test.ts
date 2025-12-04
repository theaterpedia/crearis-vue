/**
 * Integration Tests - Posts Visibility & Role-Based Access
 * 
 * Tests the posts API with real database triggers and visibility filtering.
 * Uses opus1 test project with Hans/Nina/Rosa/Marc test users.
 * 
 * Run: pnpm test tests/integration/posts-visibility.test.ts
 * 
 * Prerequisites:
 * - PostgreSQL running with crearis_admin_dev database
 * - Dev server running: pnpm dev
 * - Test data setup: npx tsx server/database/reset-test-data.ts --passwords
 */

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'

// Restore real fetch for integration tests (test-setup.ts mocks it)
// We need to use the real HTTP client, not the mocked one
const originalFetch = globalThis.fetch.bind(globalThis)

// Use undici for actual HTTP requests (bypasses vi mock)
import { request } from 'undici'

// Test configuration
const API_BASE = 'http://localhost:3000'
const TEST_PROJECT = 'opus1'

// Test user credentials (from .env)
const TEST_USERS = {
    hans: { email: 'hans.opus@theaterpedia.org', password: 'opus1hans', role: 'owner', userId: 8 },
    nina: { email: 'nina.opus@theaterpedia.org', password: 'opus1nina', role: 'member', userId: 17 },
    rosa: { email: 'rosa.opus@theaterpedia.org', password: 'opus1rosa', role: 'participant', userId: 7 },
    marc: { email: 'marc.opus@theaterpedia.org', password: 'opus1marc', role: 'partner', userId: 103 }
}

// Session storage for each user
const sessions: Record<string, string> = {}

/**
 * Helper: Login a test user and store session
 */
async function login(userKey: keyof typeof TEST_USERS): Promise<string> {
    const user = TEST_USERS[userKey]

    const { statusCode, headers, body } = await request(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.email, password: user.password })
    })

    if (statusCode !== 200) {
        const text = await body.text()
        throw new Error(`Login failed for ${userKey}: ${statusCode} - ${text}`)
    }

    // Extract session cookie from Set-Cookie header
    const setCookie = headers['set-cookie']
    const cookieStr = Array.isArray(setCookie) ? setCookie[0] : setCookie
    const sessionMatch = cookieStr?.match(/sessionId=([^;]+)/)
    if (!sessionMatch) {
        throw new Error(`No session cookie for ${userKey}`)
    }

    sessions[userKey] = sessionMatch[1]
    return sessions[userKey]
}

/**
 * Helper: Make authenticated API request using undici
 */
async function apiRequest(
    method: string,
    path: string,
    options: { session?: string; requestBody?: any } = {}
): Promise<{ status: number; data: any }> {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json'
    }

    if (options.session) {
        headers['Cookie'] = `sessionId=${options.session}`
    }

    const { statusCode, body } = await request(`${API_BASE}${path}`, {
        method: method as any,
        headers,
        body: options.requestBody ? JSON.stringify(options.requestBody) : undefined
    })

    const text = await body.text()
    let data
    try {
        data = JSON.parse(text)
    } catch {
        data = text
    }

    return { status: statusCode, data }
}

/**
 * Helper: GET posts with visibility filter
 */
async function getPosts(session?: string, visibility = true): Promise<any[]> {
    const url = `/api/posts?project=${TEST_PROJECT}${visibility ? '&visibility=true' : ''}`
    const { data } = await apiRequest('GET', url, { session })
    return data
}

/**
 * Helper: Check if server is ready and test data exists
 */
async function checkServerReady(): Promise<boolean> {
    try {
        const { statusCode, body } = await request(`${API_BASE}/api/posts?project=${TEST_PROJECT}`)
        if (statusCode !== 200) return false
        const text = await body.text()
        const posts = JSON.parse(text)
        return Array.isArray(posts) && posts.length > 0
    } catch {
        return false
    }
}

// =============================================================================
// Test Suite
// =============================================================================

describe('Posts Visibility - Integration Tests', () => {

    beforeAll(async () => {
        // Check if server is running and has test data
        const ready = await checkServerReady()
        if (!ready) {
            throw new Error(
                'Server not running or test data missing.\n\n' +
                'Prerequisites:\n' +
                '1. Start server: pnpm dev\n' +
                '2. Reset test data: npx tsx server/database/reset-test-data.ts --passwords\n' +
                '3. Run tests: pnpm test tests/integration/posts-visibility.test.ts'
            )
        }

        // Login all test users
        await login('hans')
        await login('nina')
        await login('rosa')
        await login('marc')
    })

    describe('Without visibility filter (all posts returned)', () => {
        it('should return all opus1 posts for anonymous user', async () => {
            const posts = await getPosts(undefined, false)
            expect(posts.length).toBe(3)
        })

        it('should return all opus1 posts for authenticated user', async () => {
            const posts = await getPosts(sessions.hans, false)
            expect(posts.length).toBe(3)
        })
    })

    describe('With visibility filter - Anonymous user', () => {
        it('should return 0 posts (all have r_anonym=false)', async () => {
            const posts = await getPosts(undefined, true)
            expect(posts.length).toBe(0)
        })
    })

    describe('With visibility filter - Hans (owner)', () => {
        it('should see all 3 posts as project owner', async () => {
            const posts = await getPosts(sessions.hans, true)
            expect(posts.length).toBe(3)
        })
    })

    describe('With visibility filter - Nina (member)', () => {
        it('should see posts with r_member=true', async () => {
            const posts = await getPosts(sessions.nina, true)
            // Post 34 has r_member=true
            expect(posts.length).toBeGreaterThanOrEqual(1)
            expect(posts.some((p: any) => p.id === 34)).toBe(true)
        })

        it('should NOT see posts with only r_owner=true', async () => {
            const posts = await getPosts(sessions.nina, true)
            // Posts 36 and 37 have r_member=false, r_owner=true
            // Nina should NOT see them (she's not the owner)
            const post36 = posts.find((p: any) => p.id === 36)
            const post37 = posts.find((p: any) => p.id === 37)
            expect(post36).toBeUndefined()
            expect(post37).toBeUndefined()
        })
    })

    describe('With visibility filter - Marc (partner)', () => {
        it('should see posts he owns (owner_id matches)', async () => {
            const posts = await getPosts(sessions.marc, true)
            // Marc owns post 37
            expect(posts.some((p: any) => p.id === 37)).toBe(true)
        })

        it('should NOT see posts he does not own with r_partner=false', async () => {
            const posts = await getPosts(sessions.marc, true)
            // All posts have r_partner=false, Marc only owns post 37
            expect(posts.length).toBe(1)
            expect(posts[0].id).toBe(37)
        })
    })

    describe('With visibility filter - Rosa (participant)', () => {
        it('should NOT see any posts (all have r_participant=false, she owns none)', async () => {
            const posts = await getPosts(sessions.rosa, true)
            // Rosa doesn't own any posts and r_participant=false on all
            expect(posts.length).toBe(0)
        })
    })

    describe('PATCH endpoint - Authorization', () => {
        it('should allow Hans (owner) to update any post', async () => {
            const { status, data } = await apiRequest('PATCH', '/api/posts/34', {
                session: sessions.hans,
                requestBody: { dtags: 100 }
            })
            expect(status).toBe(200)
            expect(data.dtags).toBe(100)
        })

        it('should allow Nina (member) to update posts', async () => {
            const { status, data } = await apiRequest('PATCH', '/api/posts/34', {
                session: sessions.nina,
                requestBody: { ctags: 200 }
            })
            expect(status).toBe(200)
            expect(data.ctags).toBe(200)
        })

        it('should allow Marc (partner) to update his own post', async () => {
            const { status, data } = await apiRequest('PATCH', '/api/posts/37', {
                session: sessions.marc,
                requestBody: { ttags: 300 }
            })
            expect(status).toBe(200)
            expect(data.ttags).toBe(300)
        })

        it('should reject unauthorized update from Rosa', async () => {
            // Rosa is participant but doesn't own post 36
            const { status } = await apiRequest('PATCH', '/api/posts/36', {
                session: sessions.rosa,
                requestBody: { dtags: 999 }
            })
            expect(status).toBe(403)
        })

        it('should reject update from anonymous user', async () => {
            const { status } = await apiRequest('PATCH', '/api/posts/34', {
                requestBody: { dtags: 999 }
            })
            expect(status).toBe(401)
        })
    })

    describe('POST endpoint - Tag fields', () => {
        let createdPostId: number

        it('should create post with tag fields', async () => {
            const { status, data } = await apiRequest('POST', '/api/posts', {
                session: sessions.hans,
                requestBody: {
                    name: '**Test Post** Created by integration test',
                    project: TEST_PROJECT,
                    owner_id: TEST_USERS.hans.userId,
                    dtags: 10,
                    ctags: 20,
                    ttags: 30,
                    rtags: 40
                }
            })
            expect(status).toBe(200)

            createdPostId = data.id

            expect(data.dtags).toBe(10)
            expect(data.ctags).toBe(20)
            expect(data.ttags).toBe(30)
            expect(data.rtags).toBe(40)
        })

        afterAll(async () => {
            // Cleanup: delete the test post
            if (createdPostId) {
                await apiRequest('DELETE', `/api/posts/${createdPostId}`, {
                    session: sessions.hans
                })
            }
        })
    })
})
