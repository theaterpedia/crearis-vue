/**
 * Component Tests: StatusEditor.vue
 * 
 * Tests the StatusEditor Vue component rendering and interactions.
 * Uses Vue Test Utils with CSS variable mocks.
 * 
 * Test Coverage:
 * - Renders with correct initial state
 * - Displays current status badge
 * - Shows transition buttons/dropdown based on count
 * - Handles button clicks and emits events
 * - Displays loading state during transitions
 * - Shows error messages
 * - Trash/restore functionality
 * 
 * Note: These tests mock usePostStatus and usePostPermissions
 * to test the component in isolation.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises, type VueWrapper } from '@vue/test-utils'
import { ref, computed } from 'vue'
import { mountWithCSS } from '../utils/mount-helpers'

// Mock the composables before importing the component
vi.mock('@/composables/usePostStatus', () => ({
    usePostStatus: vi.fn(),
    STATUS: {
        NEW: 1,
        DEMO: 8,
        DRAFT: 64,
        REVIEW: 256,
        CONFIRMED: 512,
        RELEASED: 4096,
        ARCHIVED: 32768,
        TRASH: 65536
    }
}))

vi.mock('@/composables/usePostPermissions', () => ({
    usePostPermissions: vi.fn(() => ({
        canEdit: computed(() => true),
        canDelete: computed(() => true),
        availableTransitions: computed(() => [])
    })),
    STATUS: {
        NEW: 1,
        DEMO: 8,
        DRAFT: 64,
        REVIEW: 256,
        CONFIRMED: 512,
        RELEASED: 4096,
        ARCHIVED: 32768,
        TRASH: 65536
    }
}))

// Mock Lucide icons
vi.mock('lucide-vue-next', () => ({
    GitPullRequestDraft: { template: '<svg class="icon-git-pr" />' },
    Check: { template: '<svg class="icon-check" />' },
    Trash2: { template: '<svg class="icon-trash" />' },
    RotateCcw: { template: '<svg class="icon-rotate" />' },
    AlertCircle: { template: '<svg class="icon-alert" />' },
    XCircle: { template: '<svg class="icon-x" />' },
    Loader2: { template: '<svg class="icon-loader" />' },
    ChevronDown: { template: '<svg class="icon-chevron" />' }
}))

// Import after mocks are set up
import StatusEditor from '@/components/StatusEditor.vue'
import { usePostStatus } from '@/composables/usePostStatus'

// ============================================================================
// Test Fixtures
// ============================================================================

function createMockPost(status = 64, ownerId = 'user-1') {
    return {
        id: 100,
        owner_id: ownerId,
        status,
        project_id: 1
    }
}

function createMockProject(status = 4096, ownerId = 'owner-1') {
    return {
        id: 1,
        owner_id: ownerId,
        status,
        team_size: 5
    }
}

function createMockMembership(userId = 'user-1', configrole = 8) {
    return {
        user_id: userId,
        configrole
    }
}

function createUsePostStatusMock(overrides: Partial<ReturnType<typeof usePostStatus>> = {}) {
    const defaults = {
        currentStatus: computed(() => 64), // DRAFT
        currentStatusLabel: computed(() => 'Entwurf'),
        currentStatusColor: computed(() => 'warning'),
        currentStatusIcon: computed(() => '✏️'),
        currentStatusMeta: computed(() => ({
            label: 'Entwurf',
            color: 'warning',
            icon: '✏️',
            description: 'In Bearbeitung, für Team sichtbar'
        })),
        transitionActions: computed(() => [
            { value: 256, label: 'Zur Prüfung einreichen', color: 'accent', icon: '🔍', isPrimary: true }
        ]),
        canTrash: computed(() => true),
        isTransitioning: ref(false),
        transitionError: ref(null as string | null),
        transitionTo: vi.fn().mockResolvedValue(true),
        isTrashed: computed(() => false),
        permissions: {
            canEdit: computed(() => true),
            canDelete: computed(() => true),
            availableTransitions: computed(() => [256])
        }
    }
    
    return { ...defaults, ...overrides }
}

// ============================================================================
// Rendering Tests
// ============================================================================

describe('StatusEditor - Rendering', () => {
    let cleanup: (() => void) | null = null

    afterEach(() => {
        if (cleanup) cleanup()
        vi.clearAllMocks()
    })

    it('renders with header and current status', async () => {
        const mockStatus = createUsePostStatusMock()
        vi.mocked(usePostStatus).mockReturnValue(mockStatus as any)

        const { wrapper, cleanup: cleanupFn } = mountWithCSS(StatusEditor, {
            props: {
                post: createMockPost(),
                project: createMockProject()
            }
        })
        cleanup = cleanupFn

        // Header should show title
        expect(wrapper.find('.header-label').text()).toBe('Status ändern')
        
        // Current status should show label
        expect(wrapper.find('.status-badge').exists()).toBe(true)
        expect(wrapper.text()).toContain('Entwurf')
    })

    it('displays transition buttons when available', async () => {
        const mockStatus = createUsePostStatusMock({
            transitionActions: computed(() => [
                { value: 256, label: 'Zur Prüfung einreichen', color: 'accent', icon: '🔍', isPrimary: true },
                { value: 512, label: 'Direkt bestätigen', color: 'positive', icon: '✅', isPrimary: false }
            ])
        })
        vi.mocked(usePostStatus).mockReturnValue(mockStatus as any)

        const { wrapper, cleanup: cleanupFn } = mountWithCSS(StatusEditor, {
            props: {
                post: createMockPost(),
                project: createMockProject()
            }
        })
        cleanup = cleanupFn

        const buttons = wrapper.findAll('.transition-button')
        expect(buttons.length).toBe(2)
        expect(buttons[0].text()).toContain('Zur Prüfung einreichen')
        expect(buttons[1].text()).toContain('Direkt bestätigen')
    })

    it('renders dropdown for >4 transitions', async () => {
        const mockStatus = createUsePostStatusMock({
            transitionActions: computed(() => [
                { value: 64, label: 'Action 1', color: 'warning', icon: '1️⃣', isPrimary: false },
                { value: 256, label: 'Action 2', color: 'accent', icon: '2️⃣', isPrimary: false },
                { value: 512, label: 'Action 3', color: 'positive', icon: '3️⃣', isPrimary: false },
                { value: 4096, label: 'Action 4', color: 'primary', icon: '4️⃣', isPrimary: false },
                { value: 32768, label: 'Action 5', color: 'dimmed', icon: '5️⃣', isPrimary: false }
            ])
        })
        vi.mocked(usePostStatus).mockReturnValue(mockStatus as any)

        const { wrapper, cleanup: cleanupFn } = mountWithCSS(StatusEditor, {
            props: {
                post: createMockPost(),
                project: createMockProject()
            }
        })
        cleanup = cleanupFn

        // Should show dropdown instead of buttons
        expect(wrapper.find('.transition-dropdown').exists()).toBe(true)
        expect(wrapper.find('.transition-select').exists()).toBe(true)
        expect(wrapper.findAll('.transition-button').length).toBe(0)
    })

    it('shows trash button when canTrash is true', async () => {
        const mockStatus = createUsePostStatusMock({
            canTrash: computed(() => true),
            isTrashed: computed(() => false)
        })
        vi.mocked(usePostStatus).mockReturnValue(mockStatus as any)

        const { wrapper, cleanup: cleanupFn } = mountWithCSS(StatusEditor, {
            props: {
                post: createMockPost(),
                project: createMockProject()
            }
        })
        cleanup = cleanupFn

        expect(wrapper.find('.trash-button').exists()).toBe(true)
    })

    it('hides trash button when canTrash is false', async () => {
        const mockStatus = createUsePostStatusMock({
            canTrash: computed(() => false)
        })
        vi.mocked(usePostStatus).mockReturnValue(mockStatus as any)

        const { wrapper, cleanup: cleanupFn } = mountWithCSS(StatusEditor, {
            props: {
                post: createMockPost(),
                project: createMockProject()
            }
        })
        cleanup = cleanupFn

        expect(wrapper.find('.trash-button').exists()).toBe(false)
    })

    it('shows trashed state when isTrashed is true', async () => {
        const mockStatus = createUsePostStatusMock({
            isTrashed: computed(() => true),
            currentStatusLabel: computed(() => 'Papierkorb'),
            currentStatusColor: computed(() => 'negative'),
            transitionActions: computed(() => [
                { value: 64, label: 'Wiederherstellen', color: 'warning', icon: '✏️', isPrimary: true }
            ])
        })
        vi.mocked(usePostStatus).mockReturnValue(mockStatus as any)

        const { wrapper, cleanup: cleanupFn } = mountWithCSS(StatusEditor, {
            props: {
                post: createMockPost(65536), // TRASH status
                project: createMockProject()
            }
        })
        cleanup = cleanupFn

        expect(wrapper.find('.trashed-state').exists()).toBe(true)
        expect(wrapper.text()).toContain('Papierkorb')
    })

    it('shows no-transitions state when no actions available', async () => {
        const mockStatus = createUsePostStatusMock({
            transitionActions: computed(() => []),
            isTrashed: computed(() => false)
        })
        vi.mocked(usePostStatus).mockReturnValue(mockStatus as any)

        const { wrapper, cleanup: cleanupFn } = mountWithCSS(StatusEditor, {
            props: {
                post: createMockPost(),
                project: createMockProject()
            }
        })
        cleanup = cleanupFn

        expect(wrapper.find('.no-transitions').exists()).toBe(true)
        expect(wrapper.text()).toContain('Keine Statusänderungen verfügbar')
    })
})

// ============================================================================
// Interaction Tests
// ============================================================================

describe('StatusEditor - Interactions', () => {
    let cleanup: (() => void) | null = null

    afterEach(() => {
        if (cleanup) cleanup()
        vi.clearAllMocks()
    })

    it('calls transitionTo when button clicked', async () => {
        const transitionTo = vi.fn().mockResolvedValue(true)
        const mockStatus = createUsePostStatusMock({
            transitionTo,
            transitionActions: computed(() => [
                { value: 256, label: 'Zur Prüfung einreichen', color: 'accent', icon: '🔍', isPrimary: true }
            ])
        })
        vi.mocked(usePostStatus).mockReturnValue(mockStatus as any)

        const { wrapper, cleanup: cleanupFn } = mountWithCSS(StatusEditor, {
            props: {
                post: createMockPost(),
                project: createMockProject()
            }
        })
        cleanup = cleanupFn

        await wrapper.find('.transition-button').trigger('click')
        await flushPromises()

        expect(transitionTo).toHaveBeenCalledWith(256)
    })

    it('emits status-changed on successful transition', async () => {
        const transitionTo = vi.fn().mockResolvedValue(true)
        const mockStatus = createUsePostStatusMock({
            transitionTo,
            transitionActions: computed(() => [
                { value: 256, label: 'Zur Prüfung einreichen', color: 'accent', icon: '🔍', isPrimary: true }
            ])
        })
        vi.mocked(usePostStatus).mockReturnValue(mockStatus as any)

        const { wrapper, cleanup: cleanupFn } = mountWithCSS(StatusEditor, {
            props: {
                post: createMockPost(),
                project: createMockProject()
            }
        })
        cleanup = cleanupFn

        await wrapper.find('.transition-button').trigger('click')
        await flushPromises()

        expect(wrapper.emitted('status-changed')).toBeTruthy()
        expect(wrapper.emitted('status-changed')![0]).toEqual([256])
    })

    it('emits error on failed transition', async () => {
        const transitionError = ref<string | null>(null)
        const transitionTo = vi.fn().mockImplementation(async () => {
            transitionError.value = 'Fehler beim Statuswechsel'
            return false
        })
        const mockStatus = createUsePostStatusMock({
            transitionTo,
            transitionError,
            transitionActions: computed(() => [
                { value: 256, label: 'Zur Prüfung einreichen', color: 'accent', icon: '🔍', isPrimary: true }
            ])
        })
        vi.mocked(usePostStatus).mockReturnValue(mockStatus as any)

        const { wrapper, cleanup: cleanupFn } = mountWithCSS(StatusEditor, {
            props: {
                post: createMockPost(),
                project: createMockProject()
            }
        })
        cleanup = cleanupFn

        await wrapper.find('.transition-button').trigger('click')
        await flushPromises()

        expect(wrapper.emitted('error')).toBeTruthy()
        expect(wrapper.emitted('error')![0]).toEqual(['Fehler beim Statuswechsel'])
    })

    it('emits trash event when trash button clicked', async () => {
        const transitionTo = vi.fn().mockResolvedValue(true)
        const mockStatus = createUsePostStatusMock({
            transitionTo,
            canTrash: computed(() => true)
        })
        vi.mocked(usePostStatus).mockReturnValue(mockStatus as any)

        const { wrapper, cleanup: cleanupFn } = mountWithCSS(StatusEditor, {
            props: {
                post: createMockPost(),
                project: createMockProject()
            }
        })
        cleanup = cleanupFn

        await wrapper.find('.trash-button').trigger('click')
        await flushPromises()

        expect(transitionTo).toHaveBeenCalledWith(65536) // TRASH status
        expect(wrapper.emitted('trash')).toBeTruthy()
    })

    it('disables buttons during transition', async () => {
        const isTransitioning = ref(true)
        const mockStatus = createUsePostStatusMock({
            isTransitioning,
            transitionActions: computed(() => [
                { value: 256, label: 'Zur Prüfung einreichen', color: 'accent', icon: '🔍', isPrimary: true }
            ])
        })
        vi.mocked(usePostStatus).mockReturnValue(mockStatus as any)

        const { wrapper, cleanup: cleanupFn } = mountWithCSS(StatusEditor, {
            props: {
                post: createMockPost(),
                project: createMockProject()
            }
        })
        cleanup = cleanupFn

        const button = wrapper.find('.transition-button')
        expect(button.attributes('disabled')).toBeDefined()
    })

    it('shows loading overlay during transition', async () => {
        const isTransitioning = ref(true)
        const mockStatus = createUsePostStatusMock({
            isTransitioning
        })
        vi.mocked(usePostStatus).mockReturnValue(mockStatus as any)

        const { wrapper, cleanup: cleanupFn } = mountWithCSS(StatusEditor, {
            props: {
                post: createMockPost(),
                project: createMockProject()
            }
        })
        cleanup = cleanupFn

        expect(wrapper.find('.loading-overlay').exists()).toBe(true)
        expect(wrapper.text()).toContain('Statuswechsel')
    })
})

// ============================================================================
// Status Color Tests
// ============================================================================

describe('StatusEditor - Status Colors', () => {
    let cleanup: (() => void) | null = null

    afterEach(() => {
        if (cleanup) cleanup()
        vi.clearAllMocks()
    })

    const statusColorCases = [
        { status: 1, label: 'Neu', color: 'muted' },
        { status: 8, label: 'Demo', color: 'secondary' },
        { status: 64, label: 'Entwurf', color: 'warning' },
        { status: 256, label: 'Review', color: 'accent' },
        { status: 512, label: 'Bestätigt', color: 'positive' },
        { status: 4096, label: 'Veröffentlicht', color: 'primary' },
        { status: 32768, label: 'Archiviert', color: 'dimmed' },
        { status: 65536, label: 'Papierkorb', color: 'negative' }
    ]

    statusColorCases.forEach(({ status, label, color }) => {
        it(`status ${status} (${label}) has color class "status-${color}"`, async () => {
            const mockStatus = createUsePostStatusMock({
                currentStatus: computed(() => status),
                currentStatusLabel: computed(() => label),
                currentStatusColor: computed(() => color),
                isTrashed: computed(() => status === 65536)
            })
            vi.mocked(usePostStatus).mockReturnValue(mockStatus as any)

            const { wrapper, cleanup: cleanupFn } = mountWithCSS(StatusEditor, {
                props: {
                    post: createMockPost(status),
                    project: createMockProject()
                }
            })
            cleanup = cleanupFn

            const badge = wrapper.find('.status-badge')
            expect(badge.classes()).toContain(`status-${color}`)
        })
    })
})

// ============================================================================
// Dropdown Mode Tests
// ============================================================================

describe('StatusEditor - Dropdown Mode', () => {
    let cleanup: (() => void) | null = null

    afterEach(() => {
        if (cleanup) cleanup()
        vi.clearAllMocks()
    })

    it('shows dropdown with options and apply button', async () => {
        const transitionTo = vi.fn().mockResolvedValue(true)
        const mockStatus = createUsePostStatusMock({
            transitionTo,
            transitionActions: computed(() => [
                { value: 64, label: 'Action 1', color: 'warning', icon: '1️⃣', isPrimary: false },
                { value: 256, label: 'Action 2', color: 'accent', icon: '2️⃣', isPrimary: false },
                { value: 512, label: 'Action 3', color: 'positive', icon: '3️⃣', isPrimary: false },
                { value: 4096, label: 'Action 4', color: 'primary', icon: '4️⃣', isPrimary: false },
                { value: 32768, label: 'Action 5', color: 'dimmed', icon: '5️⃣', isPrimary: false }
            ])
        })
        vi.mocked(usePostStatus).mockReturnValue(mockStatus as any)

        const { wrapper, cleanup: cleanupFn } = mountWithCSS(StatusEditor, {
            props: {
                post: createMockPost(),
                project: createMockProject()
            }
        })
        cleanup = cleanupFn

        // Verify dropdown mode is rendered
        const select = wrapper.find('.transition-select')
        expect(select.exists()).toBe(true)
        
        // Verify all options are present
        const options = select.findAll('option')
        expect(options.length).toBe(6) // 5 actions + 1 placeholder
        
        // Verify apply button exists
        const applyBtn = wrapper.find('.apply-button')
        expect(applyBtn.exists()).toBe(true)
        expect(applyBtn.text()).toContain('Anwenden')
    })

    it('apply button is disabled when no selection', async () => {
        const mockStatus = createUsePostStatusMock({
            transitionActions: computed(() => [
                { value: 64, label: 'Action 1', color: 'warning', icon: '1️⃣', isPrimary: false },
                { value: 256, label: 'Action 2', color: 'accent', icon: '2️⃣', isPrimary: false },
                { value: 512, label: 'Action 3', color: 'positive', icon: '3️⃣', isPrimary: false },
                { value: 4096, label: 'Action 4', color: 'primary', icon: '4️⃣', isPrimary: false },
                { value: 32768, label: 'Action 5', color: 'dimmed', icon: '5️⃣', isPrimary: false }
            ])
        })
        vi.mocked(usePostStatus).mockReturnValue(mockStatus as any)

        const { wrapper, cleanup: cleanupFn } = mountWithCSS(StatusEditor, {
            props: {
                post: createMockPost(),
                project: createMockProject()
            }
        })
        cleanup = cleanupFn

        const applyBtn = wrapper.find('.apply-button')
        expect(applyBtn.attributes('disabled')).toBeDefined()
    })
})
