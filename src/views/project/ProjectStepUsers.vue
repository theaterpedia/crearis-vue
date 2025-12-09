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
                <div v-for="member in projectMembers" :key="member.user_id || member.id" class="member-card"
                    :class="{ 'is-current-user': isCurrentUser(member) }">
                    <!-- Avatar: Instructor image or initials fallback -->
                    <div class="member-avatar" @click="handleAvatarClick(member)">
                        <ImgShape 
                            v-if="getInstructorImage(member)"
                            :data="getInstructorImage(member)!"
                            shape="thumb"
                            :avatar="true"
                            class="avatar-image"
                        />
                        <span v-else class="avatar-initials">
                            {{ getInitials(member.username || member.id) }}
                        </span>
                    </div>
                    <div class="member-info">
                        <span class="member-name">{{ member.username || `User ${member.user_id}` }}</span>
                        <RoleBadge :relation="getMemberRelation(member)" :status="projectStatus" variant="pill"
                            :show-tooltip="true" :show-permissions="true" />
                        <!-- Create Instructor hint for current user without instructor -->
                        <button 
                            v-if="isCurrentUser(member) && !hasInstructor(member)"
                            class="create-instructor-btn"
                            @click="openCreateInstructorModal(member)"
                        >
                            + Instructor erstellen
                        </button>
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

        <!-- Create Instructor Modal -->
        <div v-if="showCreateInstructorModal" class="modal-overlay" @click.self="closeCreateInstructorModal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Instructor erstellen</h3>
                    <button class="modal-close" @click="closeCreateInstructorModal">×</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label class="form-label">Name</label>
                        <input v-model="newInstructor.name" type="text" class="form-input" 
                            :placeholder="selectedMember?.username || 'Instructor Name'" />
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Profilbild</label>
                        <DropdownList 
                            entity="images" 
                            title="Select Profile Image" 
                            :project="projectDomaincode"
                            size="small"
                            width="medium"
                            :dataMode="true"
                            :multiSelect="false"
                            v-model:selectedIds="newInstructor.img_id"
                            :displayXml="true"
                        />
                    </div>
                    
                    <div class="form-info">
                        <p class="info-text">
                            <strong>XMLID:</strong> <code>{{ generatedXmlid }}</code>
                        </p>
                        <p class="info-hint">
                            Der Instructor wird mit diesem Benutzer verknüpft.
                        </p>
                    </div>
                </div>
                <div class="modal-actions">
                    <button class="btn-cancel" @click="closeCreateInstructorModal" :disabled="isCreatingInstructor">
                        Abbrechen
                    </button>
                    <button class="btn-save" @click="createInstructor" :disabled="!canCreateInstructor || isCreatingInstructor">
                        <span v-if="isCreatingInstructor" class="btn-spinner"></span>
                        {{ isCreatingInstructor ? 'Erstellen...' : 'Instructor erstellen' }}
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, ref, reactive } from 'vue'
import RoleBadge from '@/components/badges/RoleBadge.vue'
import ImgShape from '@/components/images/ImgShape.vue'
import { DropdownList } from '@/components/clist'
import { useAuth } from '@/composables/useAuth'
import type { ProjectRelation } from '@/composables/useProjectActivation'
import { PROJECT_STATUS } from '@/composables/useProjectActivation'
import type { ImgShapeData } from '@/components/images/ImgShape.vue'

interface Props {
    projectId: string
    projectDomaincode?: string
    projectMembers?: any[]
    projectStatus?: number
    isLocked?: boolean
}

interface Emits {
    (e: 'next'): void
    (e: 'prev'): void
    (e: 'refresh-members'): void
}

const props = withDefaults(defineProps<Props>(), {
    projectDomaincode: '',
    projectMembers: () => [],
    projectStatus: PROJECT_STATUS.DRAFT,
    isLocked: false
})
const emit = defineEmits<Emits>()

const { user: currentUser } = useAuth()

// Create Instructor Modal State
const showCreateInstructorModal = ref(false)
const selectedMember = ref<any>(null)
const isCreatingInstructor = ref(false)
const newInstructor = reactive({
    name: '',
    img_id: null as number | null
})

// Check if member is current logged-in user
function isCurrentUser(member: any): boolean {
    if (!currentUser.value) return false
    return member.user_id === currentUser.value.id || member.id === currentUser.value.id
}

// Check if member has instructor attached
function hasInstructor(member: any): boolean {
    return !!member.instructor_id || !!member.instructor
}

// Get instructor image data for ImgShape
function getInstructorImage(member: any): ImgShapeData | null {
    // Check if member has instructor with image
    const instructor = member.instructor
    if (!instructor) return null
    
    // Try img_thumb or img_square from instructor
    const imgField = instructor.img_thumb || instructor.img_square
    if (!imgField) return null
    
    try {
        const imgData = typeof imgField === 'string' ? JSON.parse(imgField) : imgField
        return {
            url: imgData.url,
            blur: imgData.blur
        }
    } catch (e) {
        return null
    }
}

// Get member's relation/role for RoleBadge
function getMemberRelation(member: any): ProjectRelation {
    const role = member.relation || member.configrole || member.role
    if (role === 'owner' || role === 'p_owner') return 'p_owner'
    if (role === 'creator' || role === 'p_creator') return 'p_creator'
    if (role === 'member') return 'member'
    if (role === 'participant') return 'participant'
    if (role === 'partner') return 'partner'
    return 'member'
}

// Get initials for avatar fallback
function getInitials(name: string): string {
    return name.slice(0, 2).toUpperCase()
}

// Handle avatar click (could open image modal or create instructor)
function handleAvatarClick(member: any) {
    if (isCurrentUser(member) && !hasInstructor(member)) {
        openCreateInstructorModal(member)
    }
}

// Generate xmlid for new instructor: _mue.partner.{firstname_lastname}
const generatedXmlid = computed(() => {
    if (!selectedMember.value) return ''
    const username = selectedMember.value.username || ''
    // Convert "Hans Opus" to "hans_opus"
    const normalized = username.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
    return `_mue.partner.${normalized}`
})

const canCreateInstructor = computed(() => {
    return newInstructor.name.trim().length > 0
})

// Open create instructor modal
function openCreateInstructorModal(member: any) {
    selectedMember.value = member
    newInstructor.name = member.username || ''
    newInstructor.img_id = null
    showCreateInstructorModal.value = true
}

// Close create instructor modal
function closeCreateInstructorModal() {
    showCreateInstructorModal.value = false
    selectedMember.value = null
    newInstructor.name = ''
    newInstructor.img_id = null
}

// Create instructor API call
// TODO v0.5: Refactor entire 'create instructor' process
async function createInstructor() {
    if (!selectedMember.value || !canCreateInstructor.value) return
    
    isCreatingInstructor.value = true
    
    try {
        const instructorData = {
            name: newInstructor.name,
            xmlid: generatedXmlid.value,
            img_id: newInstructor.img_id,
            status: 64, // DRAFT status
            isbase: 0
        }
        
        // Create instructor via public-users endpoint
        const response = await fetch('/api/public-users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(instructorData)
        })
        
        if (!response.ok) {
            throw new Error('Failed to create instructor')
        }
        
        const result = await response.json()
        const instructorId = result.id
        
        // Link instructor to user
        const userId = selectedMember.value.user_id || selectedMember.value.id
        await fetch(`/api/users/${userId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ instructor_id: instructorId })
        })
        
        console.log('✅ Instructor created and linked:', instructorId)
        closeCreateInstructorModal()
        emit('refresh-members')
    } catch (error) {
        console.error('Failed to create instructor:', error)
        alert('Fehler beim Erstellen des Instructors')
    } finally {
        isCreatingInstructor.value = false
    }
}

// Compute comma-separated usernames (backwards compatibility)
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

/* ===== AVATAR WITH IMAGE ===== */
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
    overflow: hidden;
    cursor: pointer;
    transition: all 0.2s ease;
}

.member-card.is-current-user .member-avatar:hover {
    box-shadow: 0 0 0 2px var(--color-primary-bg);
}

.avatar-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.avatar-image :deep(img) {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 50%;
}

.avatar-initials {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
}

/* ===== CREATE INSTRUCTOR BUTTON ===== */
.create-instructor-btn {
    margin-top: 0.25rem;
    padding: 0.25rem 0.5rem;
    font-size: 0.6875rem;
    background: transparent;
    border: 1px dashed var(--color-border);
    border-radius: var(--radius-small);
    color: var(--color-dimmed);
    cursor: pointer;
    transition: all 0.2s ease;
}

.create-instructor-btn:hover {
    border-color: var(--color-primary-bg);
    color: var(--color-primary-bg);
    background: oklch(95% 0.02 250);
}

/* ===== MODAL STYLES ===== */
.modal-overlay {
    position: fixed;
    inset: 0;
    background: oklch(0% 0 0 / 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 1rem;
}

.modal-content {
    background: var(--color-card-bg);
    border-radius: var(--radius-large);
    max-width: 480px;
    width: 100%;
    box-shadow: 0 8px 32px oklch(0% 0 0 / 0.2);
    overflow: hidden;
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.25rem 1.5rem;
    border-bottom: 1px solid var(--color-border);
    background: var(--color-muted-bg);
}

.modal-header h3 {
    margin: 0;
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--color-contrast);
}

.modal-close {
    width: 2rem;
    height: 2rem;
    border: none;
    background: transparent;
    font-size: 1.5rem;
    cursor: pointer;
    color: var(--color-dimmed);
    border-radius: var(--radius-small);
    transition: all 0.2s ease;
}

.modal-close:hover {
    background: var(--color-border);
    color: var(--color-contrast);
}

.modal-body {
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
}

.form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.form-label {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-contrast);
}

.form-input {
    padding: 0.625rem 0.875rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-small);
    font-size: 0.9375rem;
    background: var(--color-card-bg);
    color: var(--color-contrast);
    transition: border-color 0.2s ease;
}

.form-input:focus {
    outline: none;
    border-color: var(--color-primary-bg);
}

.form-info {
    padding: 0.75rem;
    background: var(--color-muted-bg);
    border-radius: var(--radius-small);
}

.info-text {
    margin: 0 0 0.5rem;
    font-size: 0.8125rem;
    color: var(--color-contrast);
}

.info-text code {
    background: var(--color-border);
    padding: 0.125rem 0.375rem;
    border-radius: 0.25rem;
    font-family: 'Monaco', 'Menlo', monospace;
    font-size: 0.75rem;
}

.info-hint {
    margin: 0;
    font-size: 0.75rem;
    color: var(--color-dimmed);
}

.modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    padding: 1rem 1.5rem;
    border-top: 1px solid var(--color-border);
    background: var(--color-muted-bg);
}

.btn-cancel {
    padding: 0.625rem 1.25rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-small);
    background: transparent;
    color: var(--color-contrast);
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
}

.btn-cancel:hover:not(:disabled) {
    background: var(--color-muted-bg);
}

.btn-cancel:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.btn-save {
    padding: 0.625rem 1.25rem;
    border: none;
    border-radius: var(--radius-small);
    background: var(--color-primary-bg);
    color: var(--color-primary-contrast);
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.btn-save:hover:not(:disabled) {
    filter: brightness(1.1);
}

.btn-save:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.btn-spinner {
    width: 1rem;
    height: 1rem;
    border: 2px solid currentColor;
    border-top-color: transparent;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}
</style>
