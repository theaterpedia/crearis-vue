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
            <template #header>
                <StartPageHero :user="user">
                    <div class="registration-header">
                        <h2>Konferenz-Anmeldung 2025</h2>
                        <p>Bitte gib deine E-Mail-Adresse ein, um fortzufahren</p>
                    </div>

                    <!-- Double Entry Banner -->
                    <div v-if="hasExistingInteraction" class="double-entry-banner">
                        <div class="banner-content">
                            <p class="banner-message">
                                Deine Anmeldung ist gespeichert, du erhältst in 1-2 Tagen eine Bestätigungs-Email.
                                Logge dich hier auch einfach erneut ein, um den Status deiner Anmeldung zu verfolgen.
                            </p>
                            <div v-if="interactionStatusValue !== null && interactionStatusValue > 1"
                                class="banner-confirmed">
                                <p class="confirmed-text">✓ Anmeldung bestätigt!</p>
                                <router-link to="/login" class="btn-login">Jetzt einloggen</router-link>
                            </div>
                        </div>
                    </div>

                    <!-- Email Input Row -->
                    <div class="email-input-row">
                        <div class="form-group">
                            <label for="email" class="form-label">E-Mail-Adresse</label>
                            <div class="email-input-wrapper">
                                <input id="email" v-model="emailInput" type="email" class="form-input"
                                    placeholder="deine.email@example.com" @input="handleEmailInput"
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
                                <span v-else-if="usermode === 'verified'" class="status-badge status-verified">
                                    Verifiziert
                                </span>
                                <span v-else-if="usermode === 'loggedin'" class="status-badge status-loggedin">
                                    Eingeloggt
                                </span>
                            </div>
                        </div>
                    </div>

                    <!-- Password Input for existing users -->
                    <div v-if="usermode === 'user'" class="password-row">
                        <div class="form-group">
                            <label for="password" class="form-label">Passwort</label>
                            <input id="password" v-model="passwordInput" type="password" class="form-input"
                                placeholder="Dein Passwort eingeben" @keyup.enter="validatePassword" />
                        </div>
                        <div class="form-group">
                            <button class="btn-primary" @click="validatePassword" :disabled="isValidatingPassword">
                                {{ isValidatingPassword ? 'Wird überprüft...' : 'OK' }}
                            </button>
                        </div>
                    </div>
                </StartPageHero>
            </template>

            <!-- Registration Section -->
            <section class="registration-section bg-accent">
                <div class="container">
                    <!-- Interaction Form -->
                    <div v-if="showForm && interactionFields" class="form-container">
                        <CreateInteraction :form-name="interactionFields" :show="showForm"
                            :project-domaincode="project?.domaincode" :user-id="currentUser?.id"
                            :user-email="emailInput" @saved="handleFormSaved" @error="handleFormError" />
                    </div>
                </div>
            </section>

            <!-- Main Content -->
            <Section background="default">
                <Container>
                    <Columns gap="medium" align="top">

                        <Column width="2/3">
                            <Prose>
                                <Heading overline="Join Us" headline="Theaterpedia Conference 2025" level="h1" />

                                <h2>Munich, Germany</h2>
                                <p><strong>November 20-23, 2025</strong></p>

                                <h3>About the Conference</h3>
                                <p>
                                    Join theater professionals, educators, and enthusiasts from around the world
                                    for four days of workshops, performances, and networking at the annual
                                    Theaterpedia Conference.
                                </p>

                                <h3>What to Expect</h3>
                                <ul>
                                    <li><strong>Workshops & Masterclasses:</strong> Learn from industry leaders and
                                        experienced practitioners</li>
                                    <li><strong>Performances:</strong> Evening showcase of innovative theater
                                        productions
                                    </li>
                                    <li><strong>Networking:</strong> Connect with theater professionals from across
                                        Europe
                                    </li>
                                    <li><strong>Panel Discussions:</strong> Explore current trends and challenges in
                                        theater
                                        education</li>
                                </ul>

                                <h3>Schedule Overview</h3>
                                <ul>
                                    <li><strong>November 20:</strong> Opening Ceremony & Keynote Speech</li>
                                    <li><strong>November 21:</strong> Workshop Day 1 & Evening Performance</li>
                                    <li><strong>November 22:</strong> Workshop Day 2 & Panel Discussions</li>
                                    <li><strong>November 23:</strong> Final Presentations & Closing Event</li>
                                </ul>

                                <h3>Venue</h3>
                                <p>
                                    The conference will be held at the historic <strong>Münchner
                                        Volkstheater</strong>,
                                    located in the heart of Munich's cultural district.
                                </p>

                                <h3>Registration</h3>
                                <p>
                                    Early bird registration is now open! Complete the registration form to secure
                                    your spot. Space is limited to 150 participants.
                                </p>

                                <p><strong>Registration Fees:</strong></p>
                                <ul>
                                    <li>Early Bird (until Oct 31): €250</li>
                                    <li>Standard (Nov 1-10): €350</li>
                                    <li>Late Registration (after Nov 10): €450</li>
                                    <li>Student Rate: €150 (with valid ID)</li>
                                </ul>
                            </Prose>
                        </Column>
                    </Columns>
                </Container>
            </Section>

            <!-- Upcoming Events Section -->
            <Section background="muted">
                <Container>
                    <pList type="events" :project-domaincode="project.domaincode" item-type="card" size="medium"
                        header="Upcoming Events" is-footer />
                </Container>
            </Section>

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
import pList from '@/components/page/pList.vue'
import CreateInteraction from '@/components/forms/CreateInteraction.vue'
import Section from '@/components/Section.vue'
import Container from '@/components/Container.vue'
import Columns from '@/components/Columns.vue'
import Column from '@/components/Column.vue'
import Prose from '@/components/Prose.vue'
import Heading from '@/components/Heading.vue'
import type { EditPanelData } from '@/components/EditPanel.vue'
import { parseAsideOptions, parseFooterOptions, type AsideOptions, type FooterOptions } from '@/composables/usePageOptions'
import { getPublicNavItems } from '@/config/navigation'
import type { TopnavParentItem } from '@/components/TopNav.vue'
import { isValidEmail } from '@/utils/fieldListUtility'
import { pageSettings } from '@/settings'

const router = useRouter()
const route = useRoute()

// SEO: Set meta tags from settings (Start/Conference page)
function setStartPageSeoMeta() {
    // Set title
    document.title = `Konferenz - ${pageSettings.seo_title}`;

    // Helper to set or update meta tag
    const setMeta = (selector: string, attributes: Record<string, string>) => {
        let element = document.head.querySelector(selector);
        if (!element) {
            const tagMatch = selector.match(/^(\w+)\[/);
            const tag = tagMatch && tagMatch[1] ? tagMatch[1] : 'meta';
            element = document.createElement(tag);
            document.head.appendChild(element);
        }
        Object.entries(attributes).forEach(([key, value]) => {
            if (value) {
                element!.setAttribute(key, value);
            }
        });
    };

    // Basic meta tags
    const startDescription = `Anmeldung zur Theaterpedia-Konferenz. ${pageSettings.seo_description}`;
    const startKeywords = `${pageSettings.seo_keywords}, Konferenz, Anmeldung, Event`;

    setMeta('meta[name="description"]', { name: 'description', content: startDescription });
    setMeta('meta[name="keywords"]', { name: 'keywords', content: startKeywords });

    // Open Graph tags
    setMeta('meta[property="og:title"]', { property: 'og:title', content: `Konferenz - ${pageSettings.og_title}` });
    setMeta('meta[property="og:description"]', { property: 'og:description', content: startDescription });
    setMeta('meta[property="og:type"]', { property: 'og:type', content: 'website' });
    setMeta('meta[property="og:image"]', { property: 'og:image', content: pageSettings.seo_image });

    // Twitter Card tags
    setMeta('meta[name="twitter:card"]', { name: 'twitter:card', content: pageSettings.twitter_card });
    setMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: `Konferenz - ${pageSettings.og_title}` });
    setMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: startDescription });
    setMeta('meta[name="twitter:image"]', { name: 'twitter:image', content: pageSettings.seo_image });
}

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
const isEditPanelOpen = ref(false)
const isConfigPanelOpen = ref(false)

// Props for usermode
interface Props {
    usermode?: 'no' | 'guest' | 'user' | 'verified' | 'loggedin'
    validatedEmail?: string
}

const props = withDefaults(defineProps<Props>(), {
    usermode: 'no',
    validatedEmail: ''
})

// Registration form state
const usermode = ref<'no' | 'guest' | 'user' | 'verified' | 'loggedin' | undefined>(props.usermode)
const validatedEmail = ref(props.validatedEmail)
const emailInput = ref('')
const passwordInput = ref('')
const emailSuggestions = ref<string[]>([])
const allUserEmails = ref<string[]>([])
const allUsers = ref<any[]>([])
const showSuggestions = ref(false)
const isValidatingPassword = ref(false)
const currentUser = ref<any>(null)
const hasExistingInteraction = ref(false)
const interactionStatusValue = ref<number | null>(null)

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

// Check if user already has an interaction entry
async function checkExistingInteraction() {
    if (!usermode.value || usermode.value === 'no' || !validatedEmail.value) {
        hasExistingInteraction.value = false
        interactionStatusValue.value = null
        return
    }

    try {
        const response = await fetch(`/api/interactions?user_email=${encodeURIComponent(validatedEmail.value)}`)
        if (response.ok) {
            const data = await response.json()
            if (data.items && data.items.length > 0) {
                hasExistingInteraction.value = true
                // Get the status value from the most recent interaction
                const interaction = data.items[0]
                // Fetch the status to get its value
                if (interaction.status_id) {
                    const statusResponse = await fetch(`/api/status?id=${interaction.status_id}`)
                    if (statusResponse.ok) {
                        const statusData = await statusResponse.json()
                        if (statusData.items && statusData.items.length > 0) {
                            interactionStatusValue.value = statusData.items[0].value
                        }
                    }
                }
            } else {
                hasExistingInteraction.value = false
                interactionStatusValue.value = null
            }
        } else {
            hasExistingInteraction.value = false
            interactionStatusValue.value = null
        }
    } catch (error) {
        console.error('Error checking for existing interactions:', error)
        hasExistingInteraction.value = false
        interactionStatusValue.value = null
    }
}

// Computed: showForm - true if usermode allows form display
const showForm = computed(() => {
    if (!usermode.value || usermode.value === 'no') return false
    if (usermode.value === 'guest') return true
    if (usermode.value === 'verified' || usermode.value === 'loggedin') return true
    return false
})

// Computed: interactionFields - return form name based on usermode
const interactionFields = computed(() => {
    if (!usermode.value || usermode.value === 'no') {
        return false
    }
    if (usermode.value === 'guest') return 'registration'
    if (usermode.value === 'verified' || usermode.value === 'loggedin') return 'verification'
    return false
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

// Fetch all user emails (both extmail and sysmail entries)
async function fetchUserEmails() {
    try {
        const response = await fetch('/api/users')
        if (response.ok) {
            const users = await response.json()
            allUsers.value = users

            // Collect all emails (both extmail and sysmail)
            const emails: string[] = []
            users.forEach((u: any) => {
                if (u.extmail) emails.push(u.extmail)
                if (u.sysmail) emails.push(u.sysmail)
            })
            allUserEmails.value = emails.filter((email: string) => email)

            console.log('Loaded user emails:', allUserEmails.value.length)
        }
    } catch (error) {
        console.error('Error fetching user emails:', error)
    }
}

// Handle email input changes with lookahead support
function handleEmailInput() {
    const input = emailInput.value.trim()

    // Reset usermode and validatedEmail if email is not valid yet
    if (!isValidEmail(input)) {
        usermode.value = 'no'
        validatedEmail.value = ''
    }

    // Start lookahead after 10 characters (and only if contains @)
    if (input.length >= 10 && input.includes('@')) {
        emailSuggestions.value = allUserEmails.value.filter((email: string) =>
            email.toLowerCase().startsWith(input.toLowerCase())
        )
        showSuggestions.value = emailSuggestions.value.length > 0
    } else {
        emailSuggestions.value = []
        showSuggestions.value = false
    }

    // Only check if email exists when it's fully valid
    if (isValidEmail(input)) {
        validatedEmail.value = input
        checkEmailExists(input)
    }
}

// Select email from suggestions
function selectEmail(email: string) {
    emailInput.value = email
    validatedEmail.value = email
    showSuggestions.value = false
    checkEmailExists(email)
}

// Check if email exists in users table
async function checkEmailExists(email: string) {
    const emailLower = email.toLowerCase()

    // Find user in either extmail or sysmail
    const foundUser = allUsers.value.find((user: any) => {
        const extmailMatch = user.extmail && user.extmail.toLowerCase() === emailLower
        const sysmailMatch = user.sysmail && user.sysmail.toLowerCase() === emailLower
        return extmailMatch || sysmailMatch
    })

    console.log('Email check:', email, 'exists:', !!foundUser)

    if (foundUser) {
        currentUser.value = foundUser
        usermode.value = 'user'
    } else {
        currentUser.value = null
        usermode.value = 'guest'
    }

    // Check for existing interaction
    await checkExistingInteraction()
}

// Validate password and update user status
async function validatePassword() {
    if (!passwordInput.value || !currentUser.value) {
        return
    }

    isValidatingPassword.value = true

    try {
        console.log('=== Password Validation Debug ===')
        console.log('Current User:', currentUser.value)
        console.log('Validated Email:', validatedEmail.value)
        console.log('Password entered (length):', passwordInput.value.length)
        console.log('User status_id:', currentUser.value?.status_id)

        // For now, we skip actual password authentication
        // Just validate the password is not empty and proceed with status_id checks
        if (!passwordInput.value || passwordInput.value.length < 5) {
            alert('Bitte gib ein gültiges Passwort ein')
            return
        }

        console.log('Password check bypassed (not using auth yet)')

        // Check user status_id
        const statusId = currentUser.value.status_id

        console.log('Checking status_id:', statusId)

        if (statusId === 46 || statusId === 47) {
            // Case a) - status 46 or 47
            console.log('Case a) - status 46 or 47')
            usermode.value = 'verified'
        } else if (statusId === 48 || statusId === 49) {
            // Case b) - status 48 or 49
            console.log('Case b) - status 48 or 49')
            usermode.value = 'verified'
            showToast('Login ab 9. NOV verfügbar')
        } else if (!statusId || statusId === null || statusId === undefined) {
            // Case c) - no status_id, update to 46
            console.log('Case c) - no status_id, updating to 46')
            await updateUserStatus(currentUser.value.id, 46)
            usermode.value = 'verified'
        } else {
            // Case d) - other status
            console.log('Case d) - other status:', statusId)
            alert('Ungültiger User-Status')
            return
        }

        console.log('New usermode:', usermode.value)

        // Check for existing interaction after verification
        await checkExistingInteraction()
    } catch (error) {
        console.error('Password validation error:', error)
        alert('Fehler bei der Anmeldung')
    } finally {
        isValidatingPassword.value = false
    }
}

// Update user status_id
async function updateUserStatus(userId: number, statusId: number) {
    try {
        const response = await fetch(`/api/users/${userId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status_id: statusId })
        })

        if (!response.ok) {
            throw new Error('Failed to update user status')
        }

        // Update local user object
        if (currentUser.value) {
            currentUser.value.status_id = statusId
        }
    } catch (error) {
        console.error('Error updating user status:', error)
        throw error
    }
}

// Show toast message
function showToast(message: string) {
    // Simple toast implementation
    const toast = document.createElement('div')
    toast.textContent = message
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--color-primary, #3b82f6);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 0.5rem;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `
    document.body.appendChild(toast)
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease'
        setTimeout(() => toast.remove(), 300)
    }, 3000)
}

// Handle form submission success
async function handleFormSaved(interactionId: number) {
    console.log('Interaction saved with ID:', interactionId)
    // Refresh the interaction status
    await checkExistingInteraction()
}

// Handle form submission error
function handleFormError(error: string) {
    console.error('Form error:', error)
    alert('Fehler beim Speichern: ' + error)
}

// Initialize
onMounted(async () => {
    // Set SEO meta tags
    setStartPageSeoMeta()

    await checkAuth()
    await fetchProject(FIXED_PROJECT_ID)
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

.status-verified {
    background: var(--color-success-bg, #dcfce7);
    color: var(--color-success, #16a34a);
}

.status-loggedin {
    background: var(--color-primary-bg, #dbeafe);
    color: var(--color-primary, #3b82f6);
}

.double-entry-banner {
    background: var(--color-primary, #3b82f6);
    color: white;
    padding: 1.5rem;
    border-radius: 0.5rem;
    margin-bottom: 2rem;
    max-width: 900px;
    margin-left: auto;
    margin-right: auto;
}

.banner-content {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.banner-message {
    margin: 0;
    font-weight: 500;
    font-size: 1rem;
    line-height: 1.5;
}

.banner-confirmed {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    align-items: center;
    padding-top: 1rem;
    border-top: 1px solid rgba(255, 255, 255, 0.3);
}

.confirmed-text {
    margin: 0;
    font-size: 1.125rem;
    font-weight: 600;
}

.btn-login {
    display: inline-block;
    padding: 0.5rem 1.5rem;
    background: white;
    color: var(--color-primary, #3b82f6);
    text-decoration: none;
    border-radius: 0.375rem;
    font-weight: 500;
    transition: background-color 0.2s, transform 0.1s;
}

.btn-login:hover {
    background: rgba(255, 255, 255, 0.9);
    transform: translateY(-1px);
}

.password-row {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 1rem;
    margin-bottom: 2rem;
    max-width: 900px;
    margin-left: auto;
    margin-right: auto;
    align-items: end;
}

@media (max-width: 768px) {
    .password-row {
        grid-template-columns: 1fr;
    }
}

.btn-primary {
    padding: 0.75rem 2rem;
    background: var(--color-primary, #3b82f6);
    color: white;
    border: none;
    border-radius: 0.5rem;
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s;
    font-family: inherit;
    white-space: nowrap;
}

.btn-primary:hover:not(:disabled) {
    background: var(--color-primary-dark, #2563eb);
}

.btn-primary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
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

@keyframes slideIn {
    from {
        transform: translateX(100%);
        opacity: 0;
    }

    to {
        transform: translateX(0);
        opacity: 1;
    }
}

@keyframes slideOut {
    from {
        transform: translateX(0);
        opacity: 1;
    }

    to {
        transform: translateX(100%);
        opacity: 0;
    }
}
</style>
