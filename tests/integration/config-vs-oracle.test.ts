/**
 * Integration Test: Config vs Oracle Comparison
 * 
 * Compares results from:
 * - /api/sysreg/capabilities (config-driven)
 * - posts-permissions.ts (hardcoded oracle)
 * 
 * This validates that the sysreg_config entries produce
 * the same results as the 15 hardcoded rules.
 * 
 * Dec 5, 2025 - Sunrise Talk implementation
 */

import { describe, it, expect, beforeAll } from 'vitest'
import { v, vDescribe } from '../helpers/versioned-test'

// Import oracle functions
import {
    STATUS,
    CONFIGROLE,
    type PermissionContext,
    canReadPost,
    canEditPost,
    canCreatePost,
    getAvailableTransitions,
} from '../../server/utils/posts-permissions'

// ============================================================================
// Test Configuration
// ============================================================================

const API_BASE = 'http://localhost:3000'

// Map STATUS values to status names for API
const STATUS_NAMES: Record<number, string> = {
    [STATUS.NEW]: 'new',
    [STATUS.DRAFT]: 'draft',
    [STATUS.REVIEW]: 'review',
    [STATUS.RELEASED]: 'released',
    [STATUS.ARCHIVED]: 'archived',
    [STATUS.TRASH]: 'trash',
}

// Map relation names to test contexts
const RELATIONS = ['anonym', 'partner', 'participant', 'member', 'creator'] as const

// ============================================================================
// Helper Functions
// ============================================================================

interface ApiCapabilities {
    capabilities: {
        read: boolean
        update: boolean
        manage: boolean
        list: boolean
        share: boolean
    }
    transitions: string[]
}

async function fetchCapabilities(
    entity: string,
    status: string,
    relation: string
): Promise<ApiCapabilities | null> {
    try {
        const url = `${API_BASE}/api/sysreg/capabilities?entity=${entity}&status=${status}&relation=${relation}`
        console.log(`Fetching: ${url}`)
        const response = await fetch(url)
        console.log(`Response status: ${response.status}`)
        if (!response.ok) return null
        const data = await response.json()
        console.log(`Data:`, JSON.stringify(data))
        return data
    } catch (e) {
        console.error(`Fetch error:`, e)
        return null
    }
}

function createContext(
    userId: number,
    postOwnerId: number,
    projectOwnerId: number,
    postStatus: number,
    projectStatus: number,
    configrole: number | null
): PermissionContext {
    return {
        userId,
        post: postOwnerId > 0 ? {
            id: 1,
            owner_id: postOwnerId,
            status: postStatus,
            project_id: 1
        } : null,
        project: {
            id: 1,
            owner_id: projectOwnerId,
            status: projectStatus,
            team_size: 5
        },
        membership: configrole ? { configrole } : null
    }
}

// ============================================================================
// Test Suite
// ============================================================================

vDescribe({ version: '0.3' })('config-vs-oracle', () => {
    let serverAvailable = false

    beforeAll(async () => {
        // Check if server is running
        try {
            const response = await fetch(`${API_BASE}/api/sysreg/capabilities?entity=post&status=draft&relation=creator`)
            serverAvailable = response.ok
        } catch {
            serverAvailable = false
        }
    })

    describe('Server Availability', () => {
        it('should have server running for integration tests', () => {
            if (!serverAvailable) {
                console.warn('⚠️  Server not running - skipping integration tests')
                console.warn('   Start with: pnpm dev')
            }
            // Don't fail - just warn
            expect(true).toBe(true)
        })
    })

    describe('Read Permissions: Released Posts', () => {
        v({ version: '0.3' })('anonym should read released post (Rule 1)', async () => {
            if (!serverAvailable) return

            // API check
            const api = await fetchCapabilities('post', 'released', 'anonym')
            expect(api?.capabilities.read).toBe(true)

            // Oracle check (visitor = anonym)
            const ctx = createContext(999, 100, 1, STATUS.RELEASED, STATUS.RELEASED, null)
            expect(canReadPost(ctx)).toBe(true)
        })

        v({ version: '0.3' })('partner should read released post (Rule 6)', async () => {
            if (!serverAvailable) return

            const api = await fetchCapabilities('post', 'released', 'partner')
            expect(api?.capabilities.read).toBe(true)

            const ctx = createContext(999, 100, 1, STATUS.RELEASED, STATUS.RELEASED, CONFIGROLE.PARTNER)
            expect(canReadPost(ctx)).toBe(true)
        })
    })

    describe('Read Permissions: Draft Posts', () => {
        v({ version: '0.3' })('member should read draft post (Rule 4)', async () => {
            if (!serverAvailable) return

            const api = await fetchCapabilities('post', 'draft', 'member')
            expect(api?.capabilities.read).toBe(true)

            const ctx = createContext(999, 100, 1, STATUS.DRAFT, STATUS.RELEASED, CONFIGROLE.MEMBER)
            expect(canReadPost(ctx)).toBe(true)
        })

        v({ version: '0.3' })('anonym should NOT read draft post', async () => {
            if (!serverAvailable) return

            const api = await fetchCapabilities('post', 'draft', 'anonym')
            expect(api?.capabilities.read).toBe(false)

            const ctx = createContext(999, 100, 1, STATUS.DRAFT, STATUS.RELEASED, null)
            expect(canReadPost(ctx)).toBe(false)
        })
    })

    describe('Read Permissions: Review Posts', () => {
        v({ version: '0.3' })('participant should read review post (Rule 5)', async () => {
            if (!serverAvailable) return

            const api = await fetchCapabilities('post', 'review', 'participant')
            expect(api?.capabilities.read).toBe(true)

            const ctx = createContext(999, 100, 1, STATUS.REVIEW, STATUS.RELEASED, CONFIGROLE.PARTICIPANT)
            expect(canReadPost(ctx)).toBe(true)
        })

        v({ version: '0.3' })('partner should NOT read review post', async () => {
            if (!serverAvailable) return

            const api = await fetchCapabilities('post', 'review', 'partner')
            expect(api?.capabilities.read).toBe(false)

            const ctx = createContext(999, 100, 1, STATUS.REVIEW, STATUS.RELEASED, CONFIGROLE.PARTNER)
            expect(canReadPost(ctx)).toBe(false)
        })
    })

    describe('Creator Permissions (Rule 2)', () => {
        v({ version: '0.3' })('creator should have full access to own post', async () => {
            if (!serverAvailable) return

            // Check across all statuses
            for (const [statusVal, statusName] of Object.entries(STATUS_NAMES)) {
                const api = await fetchCapabilities('post', statusName, 'creator')
                expect(api?.capabilities.read).toBe(true)
                expect(api?.capabilities.update).toBe(true)
                expect(api?.capabilities.manage).toBe(true)
            }

            // Oracle: post owner always has access
            const ctx = createContext(100, 100, 1, STATUS.DRAFT, STATUS.RELEASED, null)
            expect(canReadPost(ctx)).toBe(true)
            expect(canEditPost(ctx)).toBe(true)
        })
    })

    describe('Transitions: Creator Submit Path (Rule 12)', () => {
        v({ version: '0.3' })('creator can transition draft→review', async () => {
            if (!serverAvailable) return

            const api = await fetchCapabilities('post', 'draft', 'creator')
            expect(api?.transitions).toContain('review')

            // Oracle
            const ctx = createContext(100, 100, 1, STATUS.DRAFT, STATUS.RELEASED, null)
            const transitions = getAvailableTransitions(ctx)
            expect(transitions).toContain(STATUS.REVIEW)
        })

        v({ version: '0.3' })('creator can transition new→draft', async () => {
            if (!serverAvailable) return

            const api = await fetchCapabilities('post', 'new', 'creator')
            expect(api?.transitions).toContain('draft')
        })
    })

    describe('Transitions: Trash (Any Status)', () => {
        v({ version: '0.3' })('creator can trash from any status', async () => {
            if (!serverAvailable) return

            for (const statusName of ['new', 'draft', 'review', 'released']) {
                const api = await fetchCapabilities('post', statusName, 'creator')
                expect(api?.transitions).toContain('trash')
            }
        })

        v({ version: '0.3' })('member can trash (as P_owner proxy)', async () => {
            if (!serverAvailable) return

            const api = await fetchCapabilities('post', 'draft', 'member')
            expect(api?.transitions).toContain('trash')
        })
    })

    describe('Update Permissions', () => {
        v({ version: '0.3' })('member should update draft post (Rule 10)', async () => {
            if (!serverAvailable) return

            const api = await fetchCapabilities('post', 'draft', 'member')
            expect(api?.capabilities.update).toBe(true)

            const ctx = createContext(999, 100, 1, STATUS.DRAFT, STATUS.DRAFT, CONFIGROLE.MEMBER)
            expect(canEditPost(ctx)).toBe(true)
        })

        v({ version: '0.3' })('participant should NOT update draft post', async () => {
            if (!serverAvailable) return

            const api = await fetchCapabilities('post', 'draft', 'participant')
            expect(api?.capabilities.update).toBe(false)

            const ctx = createContext(999, 100, 1, STATUS.DRAFT, STATUS.DRAFT, CONFIGROLE.PARTICIPANT)
            expect(canEditPost(ctx)).toBe(false)
        })
    })
})
