<template>
    <div class="project-workflow-wrapper">
        <!-- Activation Panel (modal) -->
        <ProjectActivationPanel :is-open="isActivationPanelOpen" :project="projectData" :entity-counts="entityCounts"
            :membership="membershipData" @close="closeActivationPanel" @activated="handleActivated" />

        <!-- Activation Trigger Button (when applicable) -->
        <div v-if="showActivationButton" class="activation-trigger">
            <button class="activation-btn" :class="{ 'highlight': shouldHighlight }" @click="openActivationPanel">
                <span class="btn-icon">🚀</span>
                <span class="btn-text">{{ activationButtonLabel }}</span>
            </button>
        </div>

        <!-- Layout indicator (dev mode) -->
        <div v-if="showLayoutIndicator" class="layout-indicator">
            <span class="layout-badge" :class="layoutType">
                {{ layoutType === 'stepper' ? '📋 Stepper' : '📊 Dashboard' }}
            </span>
            <span class="status-badge" :class="`status-${currentStatusName}`">
                {{ currentStatusName }}
            </span>
            <span class="relation-badge">
                {{ userRelation }}
            </span>
            <span class="mode-badge">
                {{ panelDetailMode }}
            </span>
        </div>

        <!-- Slot for child content (ProjectSite, etc.) -->
        <slot :layout-type="layoutType" :panel-detail-mode="panelDetailMode" :is-stepper="isStepper"
            :is-dashboard="isDashboard" :user-relation="userRelation" :current-status="currentStatus"
            :can-manage="canManageProject" :can-transition="canTransition" />
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, provide, onMounted } from 'vue'
import ProjectActivationPanel from '@/components/ProjectActivationPanel.vue'
import {
    useProjectActivation,
    PROJECT_STATUS,
    STATUS_TO_NAME,
    type ProjectData,
    type EntityCounts,
    type MembershipData,
    type ProjectRelation,
    type PanelDetailMode
} from '@/composables/useProjectActivation'

const props = defineProps<{
    project: any // Raw project from API
    posts?: any[]
    events?: any[]
    members?: any[]
    associatedProjects?: any[]
    membership?: any
    showLayoutIndicator?: boolean // Dev mode
}>()

const emit = defineEmits<{
    activated: [newStatus: number]
    layoutChange: [layoutType: 'stepper' | 'dashboard']
}>()

// Transform raw project data
const projectData = computed<ProjectData | null>(() => {
    if (!props.project) return null
    return {
        id: props.project.id || props.project.domaincode,
        heading: props.project.heading,
        type: props.project.type || 'project',
        status: props.project.status_id || props.project.status || PROJECT_STATUS.NEW,
        owner_id: props.project.owner_id,
        owner_sysmail: props.project.owner_sysmail,
        image_id: props.project.image_id || (props.project.cimg ? 1 : null) // Simplified check
    }
})

// Calculate entity counts
const entityCounts = computed<EntityCounts>(() => {
    const posts = props.posts?.length ?? 0
    const events = props.events?.length ?? 0
    const members = props.members?.length ?? 0
    const associatedProjects = props.associatedProjects?.length ?? 0
    // Team size = owner (1) + creators + members
    const teamSize = 1 + members // Simplified

    return {
        posts,
        events,
        members,
        associatedProjects,
        teamSize
    }
})

// Membership data
const membershipData = computed<MembershipData | null>(() => {
    if (!props.membership) return null
    return {
        user_id: props.membership.user_id,
        configrole: props.membership.configrole
    }
})

// Use activation composable
const {
    isLoading,
    error,
    userRelation,
    isPOwner,
    isPCreator,
    canManageProject,
    currentStatus,
    currentStatusName,
    layoutType,
    isStepper,
    isDashboard,
    panelDetailMode,
    allCriteriaMet,
    canTransition
} = useProjectActivation(projectData, entityCounts, membershipData)

// Activation panel state
const isActivationPanelOpen = ref(false)

// Should show activation button?
const showActivationButton = computed(() => {
    return canManageProject.value && canTransition.value
})

// Should highlight button?
const shouldHighlight = computed(() => {
    // Highlight when project is in new state
    return currentStatus.value === PROJECT_STATUS.NEW
})

// Activation button label
const activationButtonLabel = computed(() => {
    switch (currentStatus.value) {
        case PROJECT_STATUS.NEW:
            return 'Activate Project'
        case PROJECT_STATUS.DEMO:
            return 'Advance to Draft'
        case PROJECT_STATUS.DRAFT:
            return 'Confirm Project'
        case PROJECT_STATUS.CONFIRMED:
            return 'Release Project'
        case PROJECT_STATUS.RELEASED:
            return 'Manage Status'
        case PROJECT_STATUS.ARCHIVED:
            return 'Restore Project'
        default:
            return 'Manage Status'
    }
})

// Open/close activation panel
function openActivationPanel() {
    isActivationPanelOpen.value = true
}

function closeActivationPanel() {
    isActivationPanelOpen.value = false
}

// Handle activation
function handleActivated(newStatus: number) {
    emit('activated', newStatus)

    // Check if layout changed
    const oldLayoutType = layoutType.value
    // Layout will be recalculated by composable, but we need to emit if it changed
    // For now, trigger a reload if crossing the stepper/dashboard boundary
    const wasStepper = currentStatus.value < PROJECT_STATUS.DRAFT
    const willBeDashboard = newStatus >= PROJECT_STATUS.DRAFT

    if (wasStepper && willBeDashboard) {
        emit('layoutChange', 'dashboard')
    } else if (!wasStepper && newStatus < PROJECT_STATUS.DRAFT) {
        emit('layoutChange', 'stepper')
    }
}

// Watch for layout changes
watch(layoutType, (newLayout: 'stepper' | 'dashboard') => {
    emit('layoutChange', newLayout)
})

// Provide data to child components
provide('projectWorkflow', {
    layoutType,
    panelDetailMode,
    userRelation,
    currentStatus,
    currentStatusName,
    canManageProject,
    isPOwner,
    isPCreator,
    openActivationPanel
})
</script>

<style scoped>
.project-workflow-wrapper {
    position: relative;
}

/* Activation Trigger */
.activation-trigger {
    position: fixed;
    bottom: 2rem;
    right: 2rem;
    z-index: 100;
}

.activation-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.25rem;
    border: none;
    border-radius: 50px;
    background: var(--color-primary-base);
    color: white;
    font-weight: 600;
    font-size: 0.9rem;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    transition: all 0.2s ease;
}

.activation-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
}

.activation-btn.highlight {
    animation: pulse 2s infinite;
}

@keyframes pulse {

    0%,
    100% {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    50% {
        box-shadow: 0 4px 20px var(--color-primary-base);
    }
}

.btn-icon {
    font-size: 1.2rem;
}

/* Layout Indicator (dev mode) */
.layout-indicator {
    position: fixed;
    top: 4rem;
    right: 1rem;
    z-index: 90;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    padding: 0.5rem;
    background: var(--color-card-bg);
    border: 1px solid var(--color-border);
    border-radius: 8px;
    font-size: 0.75rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.layout-badge,
.status-badge,
.relation-badge,
.mode-badge {
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    text-align: center;
}

.layout-badge {
    background: var(--color-info-bg);
    color: var(--color-info-base);
    font-weight: 600;
}

.layout-badge.stepper {
    background: var(--color-warning-bg);
    color: var(--color-warning-base);
}

.layout-badge.dashboard {
    background: var(--color-positive-bg);
    color: var(--color-positive-base);
}

.status-badge {
    background: var(--color-muted-bg);
    color: var(--color-muted);
}

.status-badge.status-new {
    background: var(--color-info-bg);
    color: var(--color-info-base);
}

.status-badge.status-demo {
    background: var(--color-warning-bg);
    color: var(--color-warning-base);
}

.status-badge.status-draft {
    background: var(--color-info-bg);
    color: var(--color-info-base);
}

.status-badge.status-confirmed {
    background: var(--color-positive-bg);
    color: var(--color-positive-base);
}

.status-badge.status-released {
    background: var(--color-positive-bg);
    color: var(--color-positive-base);
}

.status-badge.status-archived {
    background: var(--color-muted-bg);
    color: var(--color-muted);
}

.relation-badge {
    background: var(--color-accent-bg);
    color: var(--color-accent-base);
}

.mode-badge {
    background: var(--color-muted-bg);
    color: var(--color-contrast);
    font-style: italic;
}
</style>
