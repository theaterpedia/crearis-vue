<template>
    <div class="start-page">
        <!-- Edit Panel -->
        <EditPanel v-if="project" :is-open="isEditPanelOpen" :title="`Edit ${project.heading || 'Start'}`"
            subtitle="Update start page information and content" :data="editPanelData" @close="closeEditPanel"
            @save="handleSaveProject" />

        <!-- Navigation Config Panel -->
        <NavigationConfigPanel v-if="project" :is-open="isConfigPanelOpen" :project-id="project.domaincode"
            @close="closeConfigPanel" />

        <!-- PageLayout wrapper -->
        <PageLayout v-if="project" :asideOptions="asideOptions" :footerOptions="footerOptions"
            :projectDomaincode="project.domaincode" :navItems="navItems" navbarMode="page">
            <!-- TopNav Actions Slot - Edit and Config buttons -->
            <template #topnav-actions>
                <!-- Edit Panel Button -->
                <EditPanelButton :is-authenticated="!!user" :is-admin="user?.activeRole === 'admin'"
                    :is-owner="isProjectOwner" @open="openEditPanel" />

                <!-- Page Config Button -->
                <button v-if="canEdit" class="config-btn" @click="openPageConfig" aria-label="Page Configuration"
                    title="Page Configuration">
                    <svg fill="currentColor" height="20" viewBox="0 0 256 256" width="20"
                        xmlns="http://www.w3.org/2000/svg">
                        <path
                            d="M128,80a48,48,0,1,0,48,48A48.05,48.05,0,0,0,128,80Zm0,80a32,32,0,1,1,32-32A32,32,0,0,1,128,160Zm88-29.84q.06-2.16,0-4.32l14.92-18.64a8,8,0,0,0,1.48-7.06,107.6,107.6,0,0,0-10.88-26.25,8,8,0,0,0-6-3.93l-23.72-2.64q-1.48-1.56-3-3L186,40.54a8,8,0,0,0-3.94-6,107.29,107.29,0,0,0-26.25-10.86,8,8,0,0,0-7.06,1.48L130.16,40Q128,40,125.84,40L107.2,25.11a8,8,0,0,0-7.06-1.48A107.6,107.6,0,0,0,73.89,34.51a8,8,0,0,0-3.93,6L67.32,64.27q-1.56,1.49-3,3L40.54,70a8,8,0,0,0-6,3.94,107.71,107.71,0,0,0-10.87,26.25,8,8,0,0,0,1.49,7.06L40,125.84Q40,128,40,130.16L25.11,148.8a8,8,0,0,0-1.48,7.06,107.6,107.6,0,0,0,10.88,26.25,8,8,0,0,0,6,3.93l23.72,2.64q1.49,1.56,3,3L70,215.46a8,8,0,0,0,3.94,6,107.71,107.71,0,0,0,26.25,10.87,8,8,0,0,0,7.06-1.49L125.84,216q2.16.06,4.32,0l18.64,14.92a8,8,0,0,0,7.06,1.48,107.21,107.21,0,0,0,26.25-10.88,8,8,0,0,0,3.93-6l2.64-23.72q1.56-1.48,3-3L215.46,186a8,8,0,0,0,6-3.94,107.71,107.71,0,0,0,10.87-26.25,8,8,0,0,0-1.49-7.06Zm-16.1-6.5a73.93,73.93,0,0,1,0,8.68,8,8,0,0,0,1.74,5.48l14.19,17.73a91.57,91.57,0,0,1-6.23,15L187,173.11a8,8,0,0,0-5.1,2.64,74.11,74.11,0,0,1-6.14,6.14,8,8,0,0,0-2.64,5.1l-2.51,22.58a91.32,91.32,0,0,1-15,6.23l-17.74-14.19a8,8,0,0,0-5-1.75h-.48a73.93,73.93,0,0,1-8.68,0,8.06,8.06,0,0,0-5.48,1.74L100.45,215.8a91.57,91.57,0,0,1-15-6.23L82.89,187a8,8,0,0,0-2.64-5.1,74.11,74.11,0,0,1-6.14-6.14,8,8,0,0,0-5.1-2.64L46.43,170.6a91.32,91.32,0,0,1-6.23-15l14.19-17.74a8,8,0,0,0,1.74-5.48,73.93,73.93,0,0,1,0-8.68,8,8,0,0,0-1.74-5.48L40.2,100.45a91.57,91.57,0,0,1,6.23-15L69,82.89a8,8,0,0,0,5.1-2.64,74.11,74.11,0,0,1,6.14-6.14A8,8,0,0,0,82.89,69L85.4,46.43a91.32,91.32,0,0,1,15-6.23l17.74,14.19a8,8,0,0,0,5.48,1.74,73.93,73.93,0,0,1,8.68,0,8.06,8.06,0,0,0,5.48-1.74L155.55,40.2a91.57,91.57,0,0,1,15,6.23L173.11,69a8,8,0,0,0,2.64,5.1,74.11,74.11,0,0,1,6.14,6.14,8,8,0,0,0,5.1,2.64l22.58,2.51a91.32,91.32,0,0,1,6.23,15l-14.19,17.74A8,8,0,0,0,199.87,123.66Z">
                        </path>
                    </svg>
                </button>
            </template>

            <!-- Hero Section -->
            <StartPageHero :user="user" />

            <!-- Registration Section -->
            <section class="registration-section bg-accent">
                <div class="container">
                    <div class="registration-header">
                        <h2>Konferenz-Anmeldung 2025</h2>
                        <p>Bitte geben Sie Ihre E-Mail-Adresse ein, um fortzufahren</p>
                    </div>

                    <!-- Email Input Row -->
                    <div class="email-input-row">
                        <div class="form-group">
                            <label for="email" class="form-label">E-Mail-Adresse</label>
                            <div class="email-input-wrapper">
                                <input id="email" v-model="emailInput" type="email" class="form-input"
                                    placeholder="ihre.email@example.com" @input="handleEmailInput"
                                    @focus="handleEmailInput" />

                                <!-- Email suggestions dropdown -->
                                <div v-if="showSuggestions" class="email-suggestions">
                                    <button v-for="email in emailSuggestions" :key="email" type="button"
                                        class="suggestion-item" @click="selectEmail(email)">
                                        {{ email }}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div class="form-group">
                            <label class="form-label">Status</label>
                            <div class="status-display">
                                <span v-if="!usermode || usermode === 'no'" class="status-badge status-none">
                                    Keine E-Mail eingegeben
                                </span>
                                <span v-else-if="usermode === 'guest'" class="status-badge status-guest">
                                    Neue Anmeldung
                                </span>
                                <span v-else-if="usermode === 'user'" class="status-badge status-user">
                                    Bestehender Nutzer
                                </span>
                            </div>
                        </div>
                    </div>

                    <!-- Interaction Form -->
                    <div v-if="showForm && interactionFields" class="form-container">
                        <CreateInteraction :form-name="interactionFields" :show="showForm" :project-id="project?.id"
                            :user-email="emailInput" @saved="handleFormSaved" @error="handleFormError" />
                    </div>
                </div>
            </section>

            <!-- Upcoming Events Section -->
            <UpcomingEventsSection :events="events" />

            <!-- Footer -->
            <template #footer>
                <HomeSiteFooter />
            </template>
        </PageLayout>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import PageLayout from '@/components/PageLayout.vue'
import EditPanel from '@/components/EditPanel.vue'
import EditPanelButton from '@/components/EditPanelButton.vue'
import NavigationConfigPanel from '@/components/NavigationConfigPanel.vue'
import HomeSiteFooter from '@/components/homeSiteFooter.vue'
import StartPageHero from './HomeComponents/StartPageHero.vue'
import UpcomingEventsSection from './HomeComponents/UpcomingEventsSection.vue'
import CreateInteraction from '@/components/forms/CreateInteraction.vue'
import type { EditPanelData } from '@/components/EditPanel.vue'
import { parseAsideOptions, parseFooterOptions, type AsideOptions, type FooterOptions } from '@/composables/usePageOptions'
import { getPublicNavItems } from '@/config/navigation'
import type { TopnavParentItem } from '@/components/TopNav.vue'

const router = useRouter()
const route = useRoute()

// Get public navigation items
const navItems = computed<TopnavParentItem[]>(() => {
    return getPublicNavItems().map(item => ({
        label: item.label,
        link: item.link
    }))
})

// State - Fixed to project 'tp'
const FIXED_PROJECT_ID = 'tp'
const user = ref<any>(null)
const project = ref<any>(null)
const events = ref<any[]>([])
const isEditPanelOpen = ref(false)
const isConfigPanelOpen = ref(false)

// Props for usermode
interface Props {
    usermode?: 'no' | 'guest' | 'user'
}

const props = withDefaults(defineProps<Props>(), {
    usermode: 'no'
})

// Registration form state
const usermode = ref<'no' | 'guest' | 'user' | undefined>(props.usermode)
const emailInput = ref('')
const emailSuggestions = ref<string[]>([])
const allUserEmails = ref<string[]>([])
const showSuggestions = ref(false)

// Parse options for PageLayout
const asideOptions = computed<AsideOptions>(() => {
    if (!project.value) return {}
    return parseAsideOptions(project.value)
})

const footerOptions = computed<FooterOptions>(() => {
    if (!project.value) return {}
    return parseFooterOptions(project.value)
})

// Edit panel data computed from project
const editPanelData = computed<EditPanelData>(() => {
    if (!project.value) {
        return {
            heading: '',
            teaser: '',
            cimg: '',
            header_type: '',
            header_size: '',
            md: ''
        }
    }
    return {
        heading: project.value.heading || '',
        teaser: project.value.teaser || '',
        cimg: project.value.cimg || '',
        header_type: project.value.header_type || '',
        header_size: project.value.header_size || '',
        md: project.value.md || ''
    }
})

// Check if current user is the project owner
const isProjectOwner = computed(() => {
    if (!user.value || !project.value) return false
    return user.value.activeRole === 'project' && user.value.projectId === FIXED_PROJECT_ID
})

// Check if user can edit (admin or project owner)
const canEdit = computed(() => {
    if (!user.value) return false
    return user.value.activeRole === 'admin' || isProjectOwner.value
})

// Computed: showForm - true if usermode is not 'no' or undefined
const showForm = computed(() => {
    return usermode.value && usermode.value !== 'no'
})

// Computed: interactionFields - return form name based on usermode
const interactionFields = computed(() => {
    if (!usermode.value || usermode.value === 'no') {
        return false
    }
    return usermode.value === 'guest' ? 'registration' : 'verification'
})

// Open/close edit panel
function openEditPanel() {
    isEditPanelOpen.value = true
}

function closeEditPanel() {
    isEditPanelOpen.value = false
}

// Open/close config panel
function openPageConfig() {
    isConfigPanelOpen.value = true
}

function closeConfigPanel() {
    isConfigPanelOpen.value = false
}

// Handle save project
async function handleSaveProject(data: EditPanelData) {
    if (!project.value) return

    try {
        const response = await fetch(`/api/projects/${project.value.domaincode}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        })

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.message || 'Failed to save project')
        }

        // Refresh project data
        await fetchProject(project.value.domaincode)

        // Close the panel
        closeEditPanel()
    } catch (error: any) {
        console.error('Failed to save project:', error)
        alert(error.message || 'Failed to save changes. Please try again.')
    }
}

// Check authentication
async function checkAuth() {
    try {
        const response = await fetch('/api/auth/session')
        const data = await response.json()
        if (data.authenticated) {
            user.value = data.user
        }
    } catch (error) {
        console.error('Auth check failed:', error)
    }
}

// Fetch project (fixed to 'tp')
async function fetchProject(domaincode: string) {
    try {
        const response = await fetch(`/api/projects/${domaincode}`)
        if (response.ok) {
            const data = await response.json()
            project.value = data
        } else if (response.status === 404) {
            console.error('Project not found')
            router.push('/')
        }
    } catch (error) {
        console.error('Failed to fetch project:', error)
    }
}

// Fetch events
async function fetchEvents() {
    try {
        const response = await fetch('/api/events')
        if (response.ok) {
            const data = await response.json()
            events.value = data.slice(0, 6)
        }
    } catch (error) {
        console.error('Failed to fetch events:', error)
    }
}

// Fetch all user emails (extmail entries)
async function fetchUserEmails() {
    try {
        const response = await fetch('/api/users')
        if (response.ok) {
            const users = await response.json()
            allUserEmails.value = users
                .map((u: any) => u.extmail || u.sysmail)
                .filter((email: string) => email)
        }
    } catch (error) {
        console.error('Error fetching user emails:', error)
    }
}

// Handle email input changes with lookahead support
function handleEmailInput() {
    const input = emailInput.value.trim()

    // Start lookahead after 10 characters
    if (input.length >= 10) {
        emailSuggestions.value = allUserEmails.value.filter((email: string) =>
            email.toLowerCase().startsWith(input.toLowerCase())
        )
        showSuggestions.value = emailSuggestions.value.length > 0
    } else {
        emailSuggestions.value = []
        showSuggestions.value = false
    }

    // Check if it's a valid email
    if (isValidEmail(input)) {
        checkEmailExists(input)
    }
}

// Select email from suggestions
function selectEmail(email: string) {
    emailInput.value = email
    showSuggestions.value = false
    checkEmailExists(email)
}

// Check if email exists in users table
function checkEmailExists(email: string) {
    const exists = allUserEmails.value.some(
        (userEmail: string) => userEmail.toLowerCase() === email.toLowerCase()
    )

    if (exists) {
        usermode.value = 'user'
    } else {
        usermode.value = 'guest'
    }
}

// Basic email validation
function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
}

// Handle form submission success
function handleFormSaved(interactionId: number) {
    console.log('Interaction saved with ID:', interactionId)
    // Could show a success message or redirect
}

// Handle form submission error
function handleFormError(error: string) {
    console.error('Form error:', error)
    alert('Fehler beim Speichern: ' + error)
}

// Initialize
onMounted(async () => {
    await checkAuth()
    await fetchProject(FIXED_PROJECT_ID)
    await fetchEvents()
    await fetchUserEmails()
})
</script>

<style scoped>
.start-page {
    min-height: 100vh;
    background-color: var(--color-bg);
    color: var(--color-contrast);
}

.config-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.5rem;
    height: 2.5rem;
    color: var(--color-contrast);
    background: transparent;
    border: none;
    border-radius: 0.5rem;
    cursor: pointer;
    transition: var(--transition);
    transition-property: background-color, color;
}

.config-btn:hover {
    background-color: var(--color-muted-bg);
}

.config-btn:focus {
    outline: 2px solid var(--color-primary-bg);
    outline-offset: 2px;
}

/* Registration Section */
.registration-section {
    padding: 4rem 0;
}

.registration-section.bg-accent {
    background-color: var(--color-accent-bg, #fef3c7);
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1.5rem;
}

.registration-header {
    margin-bottom: 2rem;
    text-align: center;
}

.registration-header h2 {
    font-size: 2rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
    color: var(--color-text, #1f2937);
}

.registration-header p {
    color: var(--color-text-muted, #6b7280);
    font-size: 1.125rem;
}

.email-input-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
    margin-bottom: 2rem;
    max-width: 900px;
    margin-left: auto;
    margin-right: auto;
}

@media (max-width: 768px) {
    .email-input-row {
        grid-template-columns: 1fr;
    }
}

.form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.form-label {
    font-weight: 500;
    font-size: 0.95rem;
    color: var(--color-text, #1f2937);
}

.email-input-wrapper {
    position: relative;
}

.form-input {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid var(--color-border, #e5e7eb);
    border-radius: 0.5rem;
    font-size: 1rem;
    font-family: inherit;
    transition: border-color 0.2s;
    background: white;
}

.form-input:focus {
    outline: none;
    border-color: var(--color-primary, #3b82f6);
}

.email-suggestions {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: white;
    border: 1px solid var(--color-border, #e5e7eb);
    border-radius: 0.5rem;
    margin-top: 0.25rem;
    max-height: 200px;
    overflow-y: auto;
    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
    z-index: 10;
}

.suggestion-item {
    width: 100%;
    padding: 0.75rem;
    border: none;
    background: white;
    text-align: left;
    cursor: pointer;
    font-family: inherit;
    font-size: 0.95rem;
    transition: background-color 0.15s;
    color: var(--color-text, #1f2937);
}

.suggestion-item:hover {
    background: var(--color-primary-lighter, #eff6ff);
}

.status-display {
    display: flex;
    align-items: center;
    height: 100%;
    padding-top: 0.75rem;
}

.status-badge {
    display: inline-block;
    padding: 0.5rem 1rem;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    font-weight: 500;
}

.status-none {
    background: var(--color-gray-light, #f3f4f6);
    color: var(--color-gray-dark, #6b7280);
}

.status-guest {
    background: var(--color-info-bg, #dbeafe);
    color: var(--color-info, #2563eb);
}

.status-user {
    background: var(--color-success-bg, #dcfce7);
    color: var(--color-success, #16a34a);
}

.form-container {
    margin-top: 2rem;
    padding: 2rem;
    background: white;
    border-radius: 0.75rem;
    box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
    max-width: 900px;
    margin-left: auto;
    margin-right: auto;
}
</style>
