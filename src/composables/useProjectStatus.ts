/**
 * Composable: useProjectStatus
 * 
 * Manages project status lifecycle and configuration with sysreg system.
 * Similar to useImageStatus but tailored for project workflows.
 * 
 * Status values (status_val BYTEA):
 * - 0x00 (0): idea - Initial concept, not yet planned
 * - 0x01 (1): draft - Being planned/drafted
 * - 0x02 (2): planned - Scheduled and approved
 * - 0x04 (4): active - Currently running
 * - 0x08 (8): completed - Successfully finished
 * - 0x10 (16): archived - Historical record
 * 
 * Config bits (config_val BYTEA):
 * - bit 0: public - Visible to public
 * - bit 1: featured - Highlighted on homepage
 * - bit 2: registration_open - Accepting registrations
 * - bit 3: has_funding - Externally funded
 * - bit 4: recurring - Repeating project
 * - bit 5: archived - Archived status
 */

import { computed, type Ref } from 'vue'
import {
    parseByteaHex,
    byteaFromNumber,
    hasBit,
    setBit,
    clearBit,
    toggleBit
} from './useSysregTags'

export interface Project {
    id: number
    status_val: string | null  // BYTEA hex string
    config_val: string | null  // BYTEA hex string
    [key: string]: any
}

export function useProjectStatus(project: Ref<Project | null>) {
    // Parse current values
    const currentStatus = computed(() => {
        if (!project.value?.status_val) return 0
        return parseByteaHex(project.value.status_val)
    })

    const currentConfig = computed(() => {
        if (!project.value?.config_val) return 0
        return parseByteaHex(project.value.config_val)
    })

    // Status checks
    const isIdea = computed(() => currentStatus.value === 0x00)
    const isDraft = computed(() => currentStatus.value === 0x01)
    const isPlanned = computed(() => currentStatus.value === 0x02)
    const isActive = computed(() => currentStatus.value === 0x04)
    const isCompleted = computed(() => currentStatus.value === 0x08)
    const isArchived = computed(() => currentStatus.value === 0x10)

    // Config bit checks
    const isPublic = computed(() => hasBit(project.value?.config_val || '\\x00', 0))
    const isFeatured = computed(() => hasBit(project.value?.config_val || '\\x00', 1))
    const registrationOpen = computed(() => hasBit(project.value?.config_val || '\\x00', 2))
    const hasFunding = computed(() => hasBit(project.value?.config_val || '\\x00', 3))
    const isRecurring = computed(() => hasBit(project.value?.config_val || '\\x00', 4))
    const isArchivedConfig = computed(() => hasBit(project.value?.config_val || '\\x00', 5))

    // Status transition validations
    const canStartPlanning = computed(() => {
        return currentStatus.value === 0x00 // Only from idea
    })

    const canApprove = computed(() => {
        return currentStatus.value === 0x01 // Only from draft
    })

    const canActivate = computed(() => {
        return currentStatus.value === 0x02 // Only from planned
    })

    const canComplete = computed(() => {
        return currentStatus.value === 0x04 // Only from active
    })

    const canArchive = computed(() => {
        return currentStatus.value === 0x08 // Only completed projects
    })

    const canUnarchive = computed(() => {
        return currentStatus.value === 0x10 // Only archived projects
    })

    const canReopen = computed(() => {
        return currentStatus.value === 0x08 // Can reopen completed projects
    })

    // Status transition functions
    async function startPlanning() {
        if (!canStartPlanning.value) {
            throw new Error('Cannot start planning: invalid current status')
        }

        return updateProjectStatus({
            status_val: byteaFromNumber(0x01)
        })
    }

    async function approveProject() {
        if (!canApprove.value) {
            throw new Error('Cannot approve: project must be in draft status')
        }

        return updateProjectStatus({
            status_val: byteaFromNumber(0x02)
        })
    }

    async function activateProject() {
        if (!canActivate.value) {
            throw new Error('Cannot activate: project must be planned first')
        }

        return updateProjectStatus({
            status_val: byteaFromNumber(0x04),
            config_val: setBit(project.value!.config_val || '\\x00', 0) // Set public
        })
    }

    async function completeProject(summary?: string) {
        if (!canComplete.value) {
            throw new Error('Cannot complete: project must be active')
        }

        const confirmed = confirm(
            summary
                ? `Projekt abschließen?\n\n${summary}\n\nEs kann später wieder geöffnet werden.`
                : 'Projekt als abgeschlossen markieren? Es kann später wieder geöffnet werden.'
        )

        if (!confirmed) return null

        return updateProjectStatus({
            status_val: byteaFromNumber(0x08),
            config_val: clearBit(project.value!.config_val || '\\x00', 2) // Close registration
        })
    }

    async function archiveProject() {
        if (!canArchive.value) {
            throw new Error('Cannot archive: project must be completed first')
        }

        const confirmed = confirm(
            'Projekt archivieren? Es wird aus aktiven Listen entfernt.'
        )

        if (!confirmed) return null

        return updateProjectStatus({
            status_val: byteaFromNumber(0x10),
            config_val: clearBit(clearBit(project.value!.config_val || '\\x00', 0), 1) // Clear public and featured
        })
    }

    async function unarchiveProject() {
        if (!canUnarchive.value) {
            throw new Error('Cannot unarchive: invalid current status')
        }

        return updateProjectStatus({
            status_val: byteaFromNumber(0x08) // Back to completed
        })
    }

    async function reopenProject() {
        if (!canReopen.value) {
            throw new Error('Cannot reopen: project must be completed')
        }

        const confirmed = confirm(
            'Projekt wieder öffnen? Status wird auf "Aktiv" gesetzt.'
        )

        if (!confirmed) return null

        return updateProjectStatus({
            status_val: byteaFromNumber(0x04) // Back to active
        })
    }

    // Config bit management
    function hasConfigBit(bit: number): boolean {
        if (!project.value?.config_val) return false
        return hasBit(project.value.config_val, bit)
    }

    async function setConfigBit(bit: number, value: boolean) {
        if (!project.value) return null

        const newConfig = value
            ? setBit(project.value.config_val || '\\x00', bit)
            : clearBit(project.value.config_val || '\\x00', bit)

        return updateProjectStatus({
            config_val: newConfig
        })
    }

    async function toggleConfigBit(bit: number) {
        if (!project.value) return null

        return updateProjectStatus({
            config_val: toggleBit(project.value.config_val || '\\x00', bit)
        })
    }

    async function togglePublic() {
        return toggleConfigBit(0)
    }

    async function toggleFeatured() {
        return toggleConfigBit(1)
    }

    async function toggleRegistration() {
        // Validate: can only open registration for planned/active projects
        if (currentStatus.value !== 0x02 && currentStatus.value !== 0x04) {
            throw new Error('Registration can only be opened for planned or active projects')
        }
        return toggleConfigBit(2)
    }

    async function toggleFunding() {
        return toggleConfigBit(3)
    }

    async function toggleRecurring() {
        return toggleConfigBit(4)
    }

    // Update helper
    async function updateProjectStatus(updates: Partial<Project>) {
        if (!project.value) return null

        try {
            const response = await fetch(`/api/projects/${project.value.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            })

            if (!response.ok) {
                throw new Error(`Failed to update project: ${response.statusText}`)
            }

            const updated = await response.json()

            // Update local ref
            if (project.value) {
                Object.assign(project.value, updated)
            }

            return updated
        } catch (error) {
            console.error('Error updating project status:', error)
            throw error
        }
    }

    // Status label helpers
    const statusLabel = computed(() => {
        switch (currentStatus.value) {
            case 0x00: return 'Idee'
            case 0x01: return 'Entwurf'
            case 0x02: return 'Geplant'
            case 0x04: return 'Aktiv'
            case 0x08: return 'Abgeschlossen'
            case 0x10: return 'Archiviert'
            default: return 'Unbekannt'
        }
    })

    const statusColor = computed(() => {
        switch (currentStatus.value) {
            case 0x00: return 'gray'
            case 0x01: return 'yellow'
            case 0x02: return 'blue'
            case 0x04: return 'green'
            case 0x08: return 'purple'
            case 0x10: return 'red'
            default: return 'gray'
        }
    })

    // Config summary
    const configFlags = computed(() => ({
        public: isPublic.value,
        featured: isFeatured.value,
        registrationOpen: registrationOpen.value,
        hasFunding: hasFunding.value,
        recurring: isRecurring.value,
        archived: isArchivedConfig.value
    }))

    // Workflow helpers
    const nextAction = computed(() => {
        if (canStartPlanning.value) return { label: 'Planung starten', action: startPlanning }
        if (canApprove.value) return { label: 'Freigeben', action: approveProject }
        if (canActivate.value) return { label: 'Aktivieren', action: activateProject }
        if (canComplete.value) return { label: 'Abschließen', action: completeProject }
        if (canArchive.value) return { label: 'Archivieren', action: archiveProject }
        return null
    })

    return {
        // Current state
        currentStatus,
        currentConfig,
        statusLabel,
        statusColor,
        configFlags,
        nextAction,

        // Status checks
        isIdea,
        isDraft,
        isPlanned,
        isActive,
        isCompleted,
        isArchived,

        // Config checks
        isPublic,
        isFeatured,
        registrationOpen,
        hasFunding,
        isRecurring,
        isArchivedConfig,

        // Transition capabilities
        canStartPlanning,
        canApprove,
        canActivate,
        canComplete,
        canArchive,
        canUnarchive,
        canReopen,

        // Status transitions
        startPlanning,
        approveProject,
        activateProject,
        completeProject,
        archiveProject,
        unarchiveProject,
        reopenProject,

        // Config management
        hasConfigBit,
        setConfigBit,
        toggleConfigBit,
        togglePublic,
        toggleFeatured,
        toggleRegistration,
        toggleFunding,
        toggleRecurring,

        // Update helper
        updateProjectStatus
    }
}
