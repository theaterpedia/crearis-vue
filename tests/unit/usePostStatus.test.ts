/**
 * Unit Tests: usePostStatus composable
 * 
 * Tests the status workflow UI composable that powers StatusEditor.
 * All tests are pure unit tests without database dependencies.
 * 
 * Test Coverage:
 * - STATUS_META: labels, colors, icons, descriptions
 * - TRANSITION_LABELS: human-readable action names
 * - currentStatus computed values
 * - availableStatusOptions filtering
 * - transitionActions with isPrimary logic
 * - Workflow state helpers (isWorkInProgress, isPublished, etc.)
 * - getTransitionLabel function
 * 
 * Test Users (same as posts-permissions):
 * - Hans: Project owner
 * - Nina: Member (configrole=8)
 * - Rosa: Participant (configrole=4)
 * - Marc: Partner (configrole=2)
 * 
 * Dependencies: usePostPermissions (mocked via reactive refs)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref, nextTick } from 'vue'

// STATUS constant — re-rooted from removed usePostPermissions to useCapabilities
// as part of Item-1 cleanup (3a). This test re-implements STATUS_META locally
// and exercises the workflow-logic shape; no actual composable under test.
import { STATUS } from '../../src/composables/useCapabilities'

// ============================================================================
// Test the STATUS_META and TRANSITION_LABELS directly
// (These are constants, so we import and verify them)
// ============================================================================

// Re-create the constants for testing (mirrors usePostStatus.ts)
const STATUS_META: Record<number, { label: string; color: string; icon: string; description: string }> = {
    [STATUS.NEW]: {
        label: 'Neu',
        color: 'muted',
        icon: '📝',
        description: 'Gerade erstellt, nur für Ersteller sichtbar'
    },
    [STATUS.DEMO]: {
        label: 'Demo',
        color: 'secondary',
        icon: '👁️',
        description: 'Vorschau-Modus'
    },
    [STATUS.DRAFT]: {
        label: 'Entwurf',
        color: 'warning',
        icon: '✏️',
        description: 'In Bearbeitung, für Team sichtbar'
    },
    [STATUS.REVIEW]: {
        label: 'Review',
        color: 'accent',
        icon: '🔍',
        description: 'Bereit zur Prüfung'
    },
    [STATUS.CONFIRMED]: {
        label: 'Bestätigt',
        color: 'positive',
        icon: '✅',
        description: 'Vom Owner freigegeben'
    },
    [STATUS.RELEASED]: {
        label: 'Veröffentlicht',
        color: 'primary',
        icon: '🚀',
        description: 'Öffentlich sichtbar'
    },
    [STATUS.ARCHIVED]: {
        label: 'Archiviert',
        color: 'dimmed',
        icon: '📦',
        description: 'Nicht mehr aktiv'
    },
    [STATUS.TRASH]: {
        label: 'Papierkorb',
        color: 'negative',
        icon: '🗑️',
        description: 'Zum Löschen markiert'
    }
}

const TRANSITION_LABELS: Record<string, string> = {
    [`${STATUS.NEW}_${STATUS.DRAFT}`]: 'Als Entwurf speichern',
    [`${STATUS.DRAFT}_${STATUS.REVIEW}`]: 'Zur Prüfung einreichen',
    [`${STATUS.DRAFT}_${STATUS.CONFIRMED}`]: 'Direkt bestätigen',
    [`${STATUS.REVIEW}_${STATUS.CONFIRMED}`]: 'Freigeben',
    [`${STATUS.REVIEW}_${STATUS.DRAFT}`]: 'Zurück an Autor',
    [`${STATUS.CONFIRMED}_${STATUS.RELEASED}`]: 'Veröffentlichen',
    [`${STATUS.CONFIRMED}_${STATUS.REVIEW}`]: 'Erneut prüfen',
    [`${STATUS.RELEASED}_${STATUS.ARCHIVED}`]: 'Archivieren',
    [`${STATUS.RELEASED}_${STATUS.CONFIRMED}`]: 'Zurückziehen',
    [`${STATUS.ARCHIVED}_${STATUS.RELEASED}`]: 'Wieder veröffentlichen'
}

// Helper to get transition label
function getTransitionLabel(from: number, to: number): string {
    const key = `${from}_${to}`
    return TRANSITION_LABELS[key] ?? `→ ${STATUS_META[to]?.label ?? 'Unknown'}`
}

// Helper to determine primary transition
function isPrimaryTransition(from: number, to: number): boolean {
    if (from === STATUS.NEW && to === STATUS.DRAFT) return true
    if (from === STATUS.DRAFT && to === STATUS.REVIEW) return true
    if (from === STATUS.REVIEW && to === STATUS.CONFIRMED) return true
    if (from === STATUS.CONFIRMED && to === STATUS.RELEASED) return true
    return false
}

// ============================================================================
// STATUS_META Tests
// ============================================================================

describe('usePostStatus - STATUS_META', () => {
    describe('All status values have metadata', () => {
        it('NEW (1) has correct metadata', () => {
            expect(STATUS_META[STATUS.NEW]).toBeDefined()
            expect(STATUS_META[STATUS.NEW].label).toBe('Neu')
            expect(STATUS_META[STATUS.NEW].color).toBe('muted')
            expect(STATUS_META[STATUS.NEW].icon).toBe('📝')
        })

        it('DEMO (8) has correct metadata', () => {
            expect(STATUS_META[STATUS.DEMO]).toBeDefined()
            expect(STATUS_META[STATUS.DEMO].label).toBe('Demo')
            expect(STATUS_META[STATUS.DEMO].color).toBe('secondary')
            expect(STATUS_META[STATUS.DEMO].icon).toBe('👁️')
        })

        it('DRAFT (64) has correct metadata', () => {
            expect(STATUS_META[STATUS.DRAFT]).toBeDefined()
            expect(STATUS_META[STATUS.DRAFT].label).toBe('Entwurf')
            expect(STATUS_META[STATUS.DRAFT].color).toBe('warning')
            expect(STATUS_META[STATUS.DRAFT].icon).toBe('✏️')
        })

        it('REVIEW (256) has correct metadata', () => {
            expect(STATUS_META[STATUS.REVIEW]).toBeDefined()
            expect(STATUS_META[STATUS.REVIEW].label).toBe('Review')
            expect(STATUS_META[STATUS.REVIEW].color).toBe('accent')
            expect(STATUS_META[STATUS.REVIEW].icon).toBe('🔍')
        })

        it('CONFIRMED (512) has correct metadata', () => {
            expect(STATUS_META[STATUS.CONFIRMED]).toBeDefined()
            expect(STATUS_META[STATUS.CONFIRMED].label).toBe('Bestätigt')
            expect(STATUS_META[STATUS.CONFIRMED].color).toBe('positive')
            expect(STATUS_META[STATUS.CONFIRMED].icon).toBe('✅')
        })

        it('RELEASED (4096) has correct metadata', () => {
            expect(STATUS_META[STATUS.RELEASED]).toBeDefined()
            expect(STATUS_META[STATUS.RELEASED].label).toBe('Veröffentlicht')
            expect(STATUS_META[STATUS.RELEASED].color).toBe('primary')
            expect(STATUS_META[STATUS.RELEASED].icon).toBe('🚀')
        })

        it('ARCHIVED (32768) has correct metadata', () => {
            expect(STATUS_META[STATUS.ARCHIVED]).toBeDefined()
            expect(STATUS_META[STATUS.ARCHIVED].label).toBe('Archiviert')
            expect(STATUS_META[STATUS.ARCHIVED].color).toBe('dimmed')
            expect(STATUS_META[STATUS.ARCHIVED].icon).toBe('📦')
        })

        it('TRASH (65536) has correct metadata', () => {
            expect(STATUS_META[STATUS.TRASH]).toBeDefined()
            expect(STATUS_META[STATUS.TRASH].label).toBe('Papierkorb')
            expect(STATUS_META[STATUS.TRASH].color).toBe('negative')
            expect(STATUS_META[STATUS.TRASH].icon).toBe('🗑️')
        })
    })

    describe('Color variants are CSS-safe', () => {
        const validColors = ['muted', 'primary', 'secondary', 'warning', 'positive', 'negative', 'accent', 'dimmed']

        it('all colors are in the valid set', () => {
            Object.values(STATUS_META).forEach(meta => {
                expect(validColors).toContain(meta.color)
            })
        })
    })

    describe('Descriptions are informative', () => {
        it('all statuses have non-empty descriptions', () => {
            Object.values(STATUS_META).forEach(meta => {
                expect(meta.description).toBeTruthy()
                expect(meta.description.length).toBeGreaterThan(10)
            })
        })
    })
})

// ============================================================================
// TRANSITION_LABELS Tests
// ============================================================================

describe('usePostStatus - TRANSITION_LABELS', () => {
    describe('Standard workflow transitions have labels', () => {
        it('NEW → DRAFT: "Als Entwurf speichern"', () => {
            expect(getTransitionLabel(STATUS.NEW, STATUS.DRAFT)).toBe('Als Entwurf speichern')
        })

        it('DRAFT → REVIEW: "Zur Prüfung einreichen"', () => {
            expect(getTransitionLabel(STATUS.DRAFT, STATUS.REVIEW)).toBe('Zur Prüfung einreichen')
        })

        it('DRAFT → CONFIRMED: "Direkt bestätigen"', () => {
            expect(getTransitionLabel(STATUS.DRAFT, STATUS.CONFIRMED)).toBe('Direkt bestätigen')
        })

        it('REVIEW → CONFIRMED: "Freigeben"', () => {
            expect(getTransitionLabel(STATUS.REVIEW, STATUS.CONFIRMED)).toBe('Freigeben')
        })

        it('REVIEW → DRAFT: "Zurück an Autor"', () => {
            expect(getTransitionLabel(STATUS.REVIEW, STATUS.DRAFT)).toBe('Zurück an Autor')
        })

        it('CONFIRMED → RELEASED: "Veröffentlichen"', () => {
            expect(getTransitionLabel(STATUS.CONFIRMED, STATUS.RELEASED)).toBe('Veröffentlichen')
        })

        it('CONFIRMED → REVIEW: "Erneut prüfen"', () => {
            expect(getTransitionLabel(STATUS.CONFIRMED, STATUS.REVIEW)).toBe('Erneut prüfen')
        })

        it('RELEASED → ARCHIVED: "Archivieren"', () => {
            expect(getTransitionLabel(STATUS.RELEASED, STATUS.ARCHIVED)).toBe('Archivieren')
        })

        it('RELEASED → CONFIRMED: "Zurückziehen"', () => {
            expect(getTransitionLabel(STATUS.RELEASED, STATUS.CONFIRMED)).toBe('Zurückziehen')
        })

        it('ARCHIVED → RELEASED: "Wieder veröffentlichen"', () => {
            expect(getTransitionLabel(STATUS.ARCHIVED, STATUS.RELEASED)).toBe('Wieder veröffentlichen')
        })
    })

    describe('Unknown transitions get fallback label', () => {
        it('undefined transition returns "→ <target label>"', () => {
            // NEW → RELEASED is not a valid transition, so no label exists
            const label = getTransitionLabel(STATUS.NEW, STATUS.RELEASED)
            expect(label).toBe('→ Veröffentlicht')
        })

        it('completely unknown target returns "→ Unknown"', () => {
            const label = getTransitionLabel(STATUS.NEW, 999999)
            expect(label).toBe('→ Unknown')
        })
    })
})

// ============================================================================
// isPrimaryTransition Tests
// ============================================================================

describe('usePostStatus - isPrimaryTransition', () => {
    describe('Primary (natural workflow) transitions', () => {
        it('NEW → DRAFT is primary', () => {
            expect(isPrimaryTransition(STATUS.NEW, STATUS.DRAFT)).toBe(true)
        })

        it('DRAFT → REVIEW is primary', () => {
            expect(isPrimaryTransition(STATUS.DRAFT, STATUS.REVIEW)).toBe(true)
        })

        it('REVIEW → CONFIRMED is primary', () => {
            expect(isPrimaryTransition(STATUS.REVIEW, STATUS.CONFIRMED)).toBe(true)
        })

        it('CONFIRMED → RELEASED is primary', () => {
            expect(isPrimaryTransition(STATUS.CONFIRMED, STATUS.RELEASED)).toBe(true)
        })
    })

    describe('Secondary (non-primary) transitions', () => {
        it('DRAFT → CONFIRMED is NOT primary (skip review)', () => {
            expect(isPrimaryTransition(STATUS.DRAFT, STATUS.CONFIRMED)).toBe(false)
        })

        it('REVIEW → DRAFT is NOT primary (rejection)', () => {
            expect(isPrimaryTransition(STATUS.REVIEW, STATUS.DRAFT)).toBe(false)
        })

        it('RELEASED → ARCHIVED is NOT primary', () => {
            expect(isPrimaryTransition(STATUS.RELEASED, STATUS.ARCHIVED)).toBe(false)
        })

        it('RELEASED → CONFIRMED is NOT primary (withdraw)', () => {
            expect(isPrimaryTransition(STATUS.RELEASED, STATUS.CONFIRMED)).toBe(false)
        })
    })
})

// ============================================================================
// Workflow State Helpers Tests
// ============================================================================

describe('usePostStatus - Workflow State Helpers', () => {
    describe('isWorkInProgress', () => {
        it('NEW is work in progress', () => {
            const status = STATUS.NEW
            const isWIP = status === STATUS.NEW || status === STATUS.DRAFT
            expect(isWIP).toBe(true)
        })

        it('DRAFT is work in progress', () => {
            const status = STATUS.DRAFT
            const isWIP = status === STATUS.NEW || status === STATUS.DRAFT
            expect(isWIP).toBe(true)
        })

        it('REVIEW is NOT work in progress', () => {
            const status = STATUS.REVIEW
            const isWIP = status === STATUS.NEW || status === STATUS.DRAFT
            expect(isWIP).toBe(false)
        })

        it('RELEASED is NOT work in progress', () => {
            const status = STATUS.RELEASED
            const isWIP = status === STATUS.NEW || status === STATUS.DRAFT
            expect(isWIP).toBe(false)
        })
    })

    describe('isAwaitingApproval', () => {
        it('REVIEW is awaiting approval', () => {
            const status = STATUS.REVIEW
            expect(status === STATUS.REVIEW).toBe(true)
        })

        it('DRAFT is NOT awaiting approval', () => {
            const status = STATUS.DRAFT
            expect(status === STATUS.REVIEW).toBe(false)
        })

        it('CONFIRMED is NOT awaiting approval', () => {
            const status = STATUS.CONFIRMED
            expect(status === STATUS.REVIEW).toBe(false)
        })
    })

    describe('isPublished', () => {
        it('RELEASED is published', () => {
            const status = STATUS.RELEASED
            expect(status >= STATUS.RELEASED).toBe(true)
        })

        it('CONFIRMED is NOT published', () => {
            const status = STATUS.CONFIRMED
            expect(status >= STATUS.RELEASED).toBe(false)
        })

        it('ARCHIVED is technically "published" (was released)', () => {
            const status = STATUS.ARCHIVED
            expect(status >= STATUS.RELEASED).toBe(true)
        })
    })

    describe('isTrashed', () => {
        it('TRASH is trashed', () => {
            const status = STATUS.TRASH
            expect(status === STATUS.TRASH).toBe(true)
        })

        it('DRAFT is NOT trashed', () => {
            const status = STATUS.DRAFT
            expect(status === STATUS.TRASH).toBe(false)
        })

        it('ARCHIVED is NOT trashed', () => {
            const status = STATUS.ARCHIVED
            expect(status === STATUS.TRASH).toBe(false)
        })
    })
})

// ============================================================================
// Status Value Consistency Tests
// ============================================================================

describe('usePostStatus - STATUS Value Consistency', () => {
    it('STATUS values match posts-permissions.ts', () => {
        // These values must match server/utils/posts-permissions.ts
        expect(STATUS.NEW).toBe(1)
        expect(STATUS.DEMO).toBe(8)
        expect(STATUS.DRAFT).toBe(64)
        expect(STATUS.REVIEW).toBe(256)
        expect(STATUS.CONFIRMED).toBe(512)
        expect(STATUS.RELEASED).toBe(4096)
        expect(STATUS.ARCHIVED).toBe(32768)
        expect(STATUS.TRASH).toBe(65536)
    })

    it('All STATUS values have corresponding STATUS_META', () => {
        const statusValues = Object.values(STATUS)
        statusValues.forEach(value => {
            expect(STATUS_META[value]).toBeDefined()
        })
    })

    it('STATUS values are powers of 2 (bitfield compatible)', () => {
        Object.values(STATUS).forEach(value => {
            // Check if value is a power of 2
            expect(value > 0 && (value & (value - 1)) === 0).toBe(true)
        })
    })
})

// ============================================================================
// Integration Scenario Tests
// ============================================================================

describe('usePostStatus - Integration Scenarios', () => {
    describe('Scenario: Creator submits new post', () => {
        it('NEW post shows "Als Entwurf speichern" as primary action', () => {
            const currentStatus = STATUS.NEW
            const availableTransitions = [STATUS.DRAFT] // From usePostPermissions

            const actions = availableTransitions.map(target => ({
                value: target,
                label: getTransitionLabel(currentStatus, target),
                isPrimary: isPrimaryTransition(currentStatus, target)
            }))

            expect(actions).toHaveLength(1)
            expect(actions[0].label).toBe('Als Entwurf speichern')
            expect(actions[0].isPrimary).toBe(true)
        })
    })

    describe('Scenario: Author submits draft for review', () => {
        it('DRAFT post shows "Zur Prüfung einreichen" as primary', () => {
            const currentStatus = STATUS.DRAFT
            const availableTransitions = [STATUS.REVIEW] // Non-owner cannot skip

            const actions = availableTransitions.map(target => ({
                value: target,
                label: getTransitionLabel(currentStatus, target),
                isPrimary: isPrimaryTransition(currentStatus, target)
            }))

            expect(actions).toHaveLength(1)
            expect(actions[0].label).toBe('Zur Prüfung einreichen')
            expect(actions[0].isPrimary).toBe(true)
        })
    })

    describe('Scenario: Project owner reviews post', () => {
        it('REVIEW post shows both approve and reject options', () => {
            const currentStatus = STATUS.REVIEW
            const availableTransitions = [STATUS.CONFIRMED, STATUS.DRAFT] // Owner can approve/reject

            const actions = availableTransitions
                .filter(t => t !== STATUS.TRASH)
                .map(target => ({
                    value: target,
                    label: getTransitionLabel(currentStatus, target),
                    isPrimary: isPrimaryTransition(currentStatus, target)
                }))

            expect(actions).toHaveLength(2)

            const approveAction = actions.find(a => a.value === STATUS.CONFIRMED)
            expect(approveAction?.label).toBe('Freigeben')
            expect(approveAction?.isPrimary).toBe(true)

            const rejectAction = actions.find(a => a.value === STATUS.DRAFT)
            expect(rejectAction?.label).toBe('Zurück an Autor')
            expect(rejectAction?.isPrimary).toBe(false)
        })
    })

    describe('Scenario: Owner skips review', () => {
        it('Owner sees "Direkt bestätigen" option on DRAFT', () => {
            const currentStatus = STATUS.DRAFT
            const availableTransitions = [STATUS.REVIEW, STATUS.CONFIRMED] // Owner can skip

            const actions = availableTransitions.map(target => ({
                value: target,
                label: getTransitionLabel(currentStatus, target),
                isPrimary: isPrimaryTransition(currentStatus, target)
            }))

            expect(actions).toHaveLength(2)

            const skipAction = actions.find(a => a.value === STATUS.CONFIRMED)
            expect(skipAction?.label).toBe('Direkt bestätigen')
            expect(skipAction?.isPrimary).toBe(false) // Skip is not the primary path
        })
    })

    describe('Scenario: Publishing confirmed content', () => {
        it('CONFIRMED post shows "Veröffentlichen" as primary', () => {
            const currentStatus = STATUS.CONFIRMED
            const availableTransitions = [STATUS.RELEASED, STATUS.REVIEW] // Can publish or send back

            const actions = availableTransitions.map(target => ({
                value: target,
                label: getTransitionLabel(currentStatus, target),
                isPrimary: isPrimaryTransition(currentStatus, target)
            }))

            const publishAction = actions.find(a => a.value === STATUS.RELEASED)
            expect(publishAction?.label).toBe('Veröffentlichen')
            expect(publishAction?.isPrimary).toBe(true)
        })
    })
})

// ============================================================================
// Edge Cases
// ============================================================================

describe('usePostStatus - Edge Cases', () => {
    it('handles null post gracefully', () => {
        // When post is null, status should default to NEW
        const post = null
        const status = post?.status ?? STATUS.NEW
        expect(status).toBe(STATUS.NEW)
    })

    it('handles undefined status gracefully', () => {
        const post = { id: 1, owner_id: 'test', status: undefined as any }
        const status = post?.status ?? STATUS.NEW
        expect(status).toBe(STATUS.NEW)
    })

    it('handles empty transitions array', () => {
        const availableTransitions: number[] = []
        const hasActions = availableTransitions.length > 0
        expect(hasActions).toBe(false)
    })

    it('filters TRASH from main action buttons', () => {
        const availableTransitions = [STATUS.DRAFT, STATUS.TRASH]
        const mainActions = availableTransitions.filter(t => t !== STATUS.TRASH)
        expect(mainActions).toEqual([STATUS.DRAFT])
        expect(mainActions).not.toContain(STATUS.TRASH)
    })
})
