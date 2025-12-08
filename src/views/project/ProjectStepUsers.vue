<template>
    <div class="step-component">
        <div class="step-header">
            <h3>Users & Regio konfigurieren</h3>
            <p class="step-subtitle">Verwalten Sie Benutzer und Regionalprojekte</p>
        </div>

        <!-- Project Members List -->
        <div class="members-container">
            <div v-if="projectMembers.length === 0" class="empty-state">
                <p>No project members found.</p>
            </div>
            <div v-else class="members-grid">
                <div v-for="member in projectMembers" :key="member.user_id || member.id" class="member-card">
                    <div class="member-avatar">
                        {{ getInitials(member.username || member.id) }}
                    </div>
                    <div class="member-info">
                        <span class="member-name">{{ member.username || `User ${member.user_id}` }}</span>
                        <RoleBadge 
                            :relation="getMemberRelation(member)"
                            :status="projectStatus"
                            variant="pill"
                            :show-tooltip="true"
                            :show-permissions="true"
                        />
                    </div>
                    <span v-if="member.configrole" class="member-configrole">{{ member.configrole }}</span>
                </div>
            </div>
        </div>

        <div class="step-actions">
            <button class="action-btn secondary-btn" @click="handlePrev">
                <svg fill="currentColor" height="16" viewBox="0 0 256 256" width="16"
                    xmlns="http://www.w3.org/2000/svg">
                    <path
                        d="M224,128a8,8,0,0,1-8,8H59.31l58.35,58.34a8,8,0,0,1-11.32,11.32l-72-72a8,8,0,0,1,0-11.32l72-72a8,8,0,0,1,11.32,11.32L59.31,120H216A8,8,0,0,1,224,128Z">
                    </path>
                </svg>
                <span>Zurück</span>
            </button>
            <button class="action-btn primary-btn" @click="handleNext">
                <span>Weiter</span>
                <svg fill="currentColor" height="16" viewBox="0 0 256 256" width="16"
                    xmlns="http://www.w3.org/2000/svg">
                    <path
                        d="M221.66,133.66l-72,72a8,8,0,0,1-11.32-11.32L196.69,136H40a8,8,0,0,1,0-16H196.69L138.34,61.66a8,8,0,0,1,11.32-11.32l72,72A8,8,0,0,1,221.66,133.66Z">
                    </path>
                </svg>
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import RoleBadge from '@/components/badges/RoleBadge.vue'
import type { ProjectRelation } from '@/composables/useProjectActivation'
import { PROJECT_STATUS } from '@/composables/useProjectActivation'

interface Props {
    projectId: string
    projectMembers?: any[]
    projectStatus?: number
    isLocked?: boolean
}

interface Emits {
    (e: 'next'): void
    (e: 'prev'): void
}

const props = withDefaults(defineProps<Props>(), {
    projectMembers: () => [],
    projectStatus: PROJECT_STATUS.DRAFT,
    isLocked: false
})
const emit = defineEmits<Emits>()

// Get member's relation/role for RoleBadge
function getMemberRelation(member: any): ProjectRelation {
    // Map from project_members.configrole or role field
    const role = member.relation || member.configrole || member.role
    if (role === 'owner' || role === 'p_owner') return 'p_owner'
    if (role === 'creator' || role === 'p_creator') return 'p_creator'
    if (role === 'member') return 'member'
    if (role === 'participant') return 'participant'
    if (role === 'partner') return 'partner'
    // Default to member
    return 'member'
}

// Get initials for avatar
function getInitials(name: string): string {
    return name.slice(0, 2).toUpperCase()
}

// Compute comma-separated usernames from project members (kept for backwards compatibility)
const usernames = computed(() => {
    if (!props.projectMembers || props.projectMembers.length === 0) {
        return ''
    }
    return props.projectMembers
        .map(member => member.username || `User ${member.user_id}`)
        .join(', ')
})

function handleNext() {
    emit('next')
}

function handlePrev() {
    emit('prev')
}
</script>

<style scoped>
/* ===== STEP COMPONENT ===== */
.step-component {
    display: flex;
    flex-direction: column;
    gap: 2rem;
}

.step-header h3 {
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--color-project);
    margin: 0 0 0.5rem 0;
}

.step-subtitle {
    font-size: 1rem;
    color: var(--color-dimmed);
    margin: 0;
}

/* ===== MEMBERS CONTAINER ===== */
.members-container {
    padding: 1.5rem;
    background: var(--color-bg-soft);
    border: var(--border) solid var(--color-border);
    border-radius: var(--radius-medium);
    min-height: 200px;
}

.empty-state {
    text-align: center;
    color: var(--color-dimmed);
    padding: 2rem;
}

/* ===== MEMBERS GRID ===== */
.members-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1rem;
}

.member-card {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem;
    background: var(--color-card-bg);
    border: 1px solid var(--color-border);
    border-radius: var(--radius);
    transition: all 0.2s ease;
}

.member-card:hover {
    border-color: var(--color-primary-bg);
    box-shadow: 0 2px 8px oklch(0% 0 0 / 0.1);
}

.member-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: var(--color-accent-bg);
    color: var(--color-accent-contrast);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.875rem;
    font-weight: 600;
    flex-shrink: 0;
}

.member-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    flex: 1;
    min-width: 0;
}

.member-name {
    font-weight: 500;
    color: var(--color-contrast);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.member-configrole {
    font-size: 0.75rem;
    color: var(--color-dimmed);
    font-style: italic;
}

/* ===== STEP ACTIONS ===== */
.step-actions {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    padding-top: 1.5rem;
    border-top: var(--border) solid var(--color-border);
}

.action-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    border: var(--border-button) solid var(--color-border);
    border-radius: var(--radius-button);
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
}

.primary-btn {
    background: var(--color-project);
    color: white;
    border-color: var(--color-project);
}

.primary-btn:hover {
    opacity: 0.9;
}

.secondary-btn {
    background: transparent;
    color: var(--color-text);
}

.secondary-btn:hover {
    background: var(--color-bg-soft);
}
</style>
