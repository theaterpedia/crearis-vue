<!--
    HomeLayoutHack.vue - TEMPORARY HACK for User Onboarding Flow Testing
    
    Created: 2025-12-11
    Purpose: Quick iteration on onboarding states without polluting clean HomeLayout.vue
    
    TODO v0.5: Merge validated logic back into OnboardingStepper.vue and clean HomeLayout.vue
               (see chat/tasks/DEFERRED-v0.5.md for full task list)
    
    State Flow:
    - Status 1 (NEW): E-Mail verification required
    - Status 8 (DEMO): Partner linking + Avatar upload with project context
    - Status 64 (DRAFT): Profile activation + public profile option  
    - Status 1024 (CONFIRMED): Full project access with stepper
-->
<template>
    <div class="home-layout" :class="{ 'home-layout--dense': isDense }">
        <!-- Header with branding and user actions -->
        <header class="home-layout__header">
            <div class="home-layout__brand">
                <span class="home-layout__logo">🎭</span>
                <span class="home-layout__title">Theaterpedia</span>
            </div>

            <div class="home-layout__user">
                <span class="home-layout__username">{{ user?.username || 'User' }}</span>
                <button class="home-layout__logout" @click="handleLogout" title="Abmelden">
                    <LogOut :size="18" />
                </button>
            </div>
        </header>

        <!-- Main content area -->
        <main class="home-layout__main">
            <!-- Welcome Section -->
            <section class="home-layout__welcome">
                <h1>Hallo {{ userFirstName }}!</h1>
                <p class="home-layout__welcome-sub">{{ userStatusText }}</p>
            </section>

            <!-- ================================================================== -->
            <!-- STATUS 1 (NEW): E-Mail verification required -->
            <!-- ================================================================== -->
            <section v-if="isNewState" class="home-layout__verification">
                <div class="verification-box">
                    <div class="verification-icon">📧</div>
                    <h2>E-Mail Verifizierung erforderlich</h2>
                    <p>Bitte prüfe dein E-Mail-Postfach und klicke auf den Bestätigungslink.</p>
                    <p class="verification-hint">Keine E-Mail erhalten? Prüfe deinen Spam-Ordner oder kontaktiere den
                        Support.</p>
                </div>
            </section>

            <!-- ================================================================== -->
            <!-- STATUS 8 (DEMO): Partner linking + Avatar upload -->
            <!-- ================================================================== -->
            <section v-else-if="isDemoState" class="home-layout__onboarding">
                <div class="onboarding-demo">
                    <h2>Profil einrichten</h2>

                    <!-- Step 1: Partner Linking (always available) -->
                    <div class="onboarding-step" :class="{ completed: hasPartner }">
                        <div class="step-header">
                            <span class="step-number">1</span>
                            <span class="step-title">Partner-Profil verknüpfen</span>
                            <span v-if="hasPartner" class="step-check">✓</span>
                        </div>
                        <div v-if="!hasPartner" class="step-content">
                            <div class="form-box">
                                <p>Verknüpfe dein Benutzerkonto mit einem Partner-Profil:</p>

                                <!-- Search existing partner -->
                                <div class="partner-search">
                                    <label>Bestehendes Profil suchen:</label>
                                    <div class="search-input-group">
                                        <input v-model="partnerSearchQuery" type="text" placeholder="Name eingeben..."
                                            @input="searchPartners" />
                                    </div>
                                    <ul v-if="partnerSearchResults.length > 0" class="search-results">
                                        <li v-for="partner in partnerSearchResults" :key="partner.id"
                                            @click="selectPartner(partner)" :class="{ unavailable: partner.user_id }">
                                            <span class="partner-name">{{ partner.name }}</span>
                                            <span v-if="partner.user_id" class="partner-linked">(bereits
                                                verknüpft)</span>
                                        </li>
                                    </ul>
                                </div>

                                <div class="divider">oder</div>

                                <!-- Create new partner -->
                                <div class="partner-create">
                                    <label>Neues Profil erstellen:</label>
                                    <input v-model="newPartnerName" type="text" placeholder="Dein vollständiger Name" />
                                    <button class="btn btn--primary" @click="createPartner" :disabled="!newPartnerName">
                                        Profil erstellen
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div v-else class="step-done">
                            <p>✓ Verknüpft mit: <strong>{{ user?.partner_name || 'Partner' }}</strong></p>
                        </div>
                    </div>

                    <!-- Step 2: Avatar Upload (only if projects available) -->
                    <div v-if="projects.length > 0" class="onboarding-step" :class="{ completed: hasAvatar, disabled: !hasPartner }">
                        <div class="step-header">
                            <span class="step-number">2</span>
                            <span class="step-title">Avatar-Bild hochladen</span>
                            <span v-if="hasAvatar" class="step-check">✓</span>
                            <span v-else class="step-optional">(optional)</span>
                        </div>
                        <div v-if="hasPartner && !hasAvatar" class="step-content">
                            <div class="form-box">
                                <p>Lade ein Profilbild hoch. Wähle zuerst, unter welchem Kontext das Bild gespeichert
                                    werden soll:</p>

                                <!-- Project/Regio Selection -->
                                <div class="avatar-context">
                                    <label>Bildkontext wählen:</label>
                                    <select v-model="selectedImageContext">
                                        <option value="">Bitte wählen...</option>
                                        <optgroup v-if="userProjects.length > 0" label="Deine Projekte">
                                            <option v-for="proj in userProjects" :key="proj.id"
                                                :value="proj.domaincode">
                                                {{ proj.heading || proj.name }}
                                            </option>
                                        </optgroup>
                                        <optgroup v-if="regioProjects.length > 0" label="Regios">
                                            <option v-for="proj in regioProjects" :key="proj.id"
                                                :value="proj.domaincode">
                                                {{ proj.heading || proj.name }}
                                            </option>
                                        </optgroup>
                                    </select>
                                    <p class="context-hint">
                                        <em>Theaterpädagog:in?</em> → Wähle deine Regio<br>
                                        <em>Teilnehmer:in?</em> → Wähle dein Projekt (Bild bleibt privat)
                                    </p>
                                </div>

                                <!-- File Upload -->
                                <div v-if="selectedImageContext" class="avatar-upload">
                                    <label>Bild auswählen:</label>
                                    <input type="file" accept="image/*" @change="handleAvatarUpload"
                                        ref="avatarInput" />
                                    <p v-if="uploadProgress" class="upload-progress">{{ uploadProgress }}</p>
                                </div>
                            </div>
                        </div>
                        <div v-else-if="hasAvatar" class="step-done">
                            <p>✓ Avatar-Bild hochgeladen</p>
                        </div>
                    </div>

                    <!-- No projects hint for avatar -->
                    <div v-else-if="hasPartner" class="onboarding-step disabled">
                        <div class="step-header">
                            <span class="step-number">2</span>
                            <span class="step-title">Avatar-Bild hochladen</span>
                            <span class="step-optional">(später möglich)</span>
                        </div>
                        <div class="step-content">
                            <p class="no-project-hint">Ein Avatar-Bild kann hochgeladen werden, sobald du einem Projekt zugewiesen wurdest.</p>
                        </div>
                    </div>

                    <!-- Continue Button (shows after partner is set) -->
                    <div v-if="hasPartner" class="onboarding-continue">
                        <p v-if="hasAvatar">🎉 Super! Dein Profil ist eingerichtet.</p>
                        <p v-else-if="projects.length > 0">Du kannst das Avatar-Bild auch später hochladen.</p>
                        <p v-else>Du kannst ein Avatar-Bild später hochladen, sobald du einem Projekt zugewiesen wurdest.</p>
                        <button class="btn btn--primary btn--lg" @click="advanceToDraft">
                            Weiter zur Aktivierung →
                        </button>
                    </div>
                </div>
            </section>

            <!-- ================================================================== -->
            <!-- STATUS 64 (DRAFT): Profile activation -->
            <!-- ================================================================== -->
            <section v-else-if="isDraftState" class="home-layout__activation">
                <div v-if="projects.length > 0" class="activation-box">
                    <h2>🎉 Geschafft!</h2>
                    <p class="activation-lead">Nun aktiviere dein Profil, du hast dann direkten Zugang zu deinen
                        Projekten.</p>

                    <!-- Instructor hint -->
                    <div v-if="isOwnerCreatorMember" class="instructor-hint">
                        <p>Falls du Theaterpädagog:in bist, dann erstelle doch jetzt gleich deine öffentliche
                            Profilseite –
                            das braucht jetzt gar nicht mehr viel (oder entscheide, dass du 'unsichtbar' bleiben
                            möchtest).</p>
                    </div>

                    <!-- Projects with roles -->
                    <div class="projects-with-roles">
                        <h3>Deine Projekte</h3>
                        <ul class="project-role-list">
                            <li v-for="project in projectsWithRoles" :key="project.id">
                                <span class="project-name">{{ project.heading || project.name }}</span>
                                <span class="project-role">{{ project.roleDisplay }}</span>
                            </li>
                        </ul>
                    </div>

                    <!-- Role Summary -->
                    <div class="role-summary">
                        <h4>Deine Rollen im Überblick</h4>
                        <dl class="role-definition-list">
                            <template v-for="(count, role) in roleSummary" :key="role">
                                <dt>{{ getRoleLabel(role) }}</dt>
                                <dd>{{ count }} {{ count === 1 ? 'Projekt' : 'Projekte' }}</dd>
                            </template>
                        </dl>
                    </div>

                    <!-- Action Buttons -->
                    <div class="activation-actions">
                        <button class="btn btn--primary btn--lg" @click="activateProfile">
                            ✓ Profil aktivieren
                        </button>
                        <button v-if="isOwnerCreatorMember" class="btn btn--secondary btn--lg"
                            @click="createPublicProfile">
                            📄 Öffentliches Profil erstellen
                        </button>
                    </div>
                </div>
                <div v-else class="onboarding-no-project">
                    <p>Du hast noch keine Projekte. Kontaktiere den Admin für eine Projektzuweisung.</p>
                </div>
            </section>

            <!-- ================================================================== -->
            <!-- STATUS 1024 (CONFIRMED): Full project access with cards -->
            <!-- ================================================================== -->
            <section v-else-if="isConfirmedState" class="home-layout__projects">
                <div class="home-layout__section-header">
                    <h2>{{ projects.length > 0 ? 'Deine Projekte' : 'Keine Projekte' }}</h2>
                    <button class="btn btn--primary btn--sm" @click="createProject">
                        <Plus :size="16" />
                        Neues Projekt
                    </button>
                </div>

                <div v-if="isLoading" class="home-layout__loading">
                    <div class="loading-spinner" />
                </div>

                <div v-else-if="projects.length === 0" class="home-layout__empty">
                    <p>Warte auf Einladung oder beantrage ein neues Projekt.</p>
                </div>

                <div v-else class="home-layout__grid">
                    <article v-for="project in projects" :key="project.id" class="project-card"
                        @click="openProject(project)">
                        <div class="project-card__image">
                            <img v-if="project.cimg" :src="project.cimg" :alt="project.heading || project.name" />
                            <div v-else class="project-card__placeholder">
                                {{ (project.heading || project.name || 'P').charAt(0).toUpperCase() }}
                            </div>
                        </div>
                        <div class="project-card__content">
                            <h3 class="project-card__title">
                                {{ project.heading || project.name || project.domaincode }}
                            </h3>
                            <p v-if="project.teaser" class="project-card__teaser">
                                {{ project.teaser.substring(0, 80) }}{{ project.teaser.length > 80 ? '...' : '' }}
                            </p>
                            <div class="project-card__meta">
                                <span class="project-card__role">{{ getRoleLabel(project._userRole) }}</span>
                                <span class="project-card__status">{{ getStatusLabel(project.status) }}</span>
                            </div>
                        </div>
                    </article>
                </div>
            </section>

            <!-- ================================================================== -->
            <!-- STATUS >= 4096 (RELEASED) or fallback: Full access -->
            <!-- ================================================================== -->
            <section v-else class="home-layout__projects">
                <div class="home-layout__section-header">
                    <h2>{{ projects.length > 0 ? 'Deine Projekte' : 'Du bist noch in keinem Projekt registriert :(' }}
                    </h2>
                    <button class="btn btn--primary btn--sm" @click="createProject">
                        <Plus :size="16" />
                        Neues Projekt
                    </button>
                </div>

                <div v-if="isLoading" class="home-layout__loading">
                    <div class="loading-spinner" />
                </div>

                <div v-else-if="projects.length === 0" class="home-layout__empty">
                    <p>Warte auf Einladung oder beantrage ein neues Projekt.</p>
                </div>

                <div v-else class="home-layout__grid">
                    <article v-for="project in projects" :key="project.id" class="project-card"
                        @click="openProject(project)">
                        <div class="project-card__image">
                            <img v-if="project.cimg" :src="project.cimg" :alt="project.heading || project.name" />
                            <div v-else class="project-card__placeholder">
                                {{ (project.heading || project.name || 'P').charAt(0).toUpperCase() }}
                            </div>
                        </div>
                        <div class="project-card__content">
                            <h3 class="project-card__title">
                                {{ project.heading || project.name || project.domaincode }}
                            </h3>
                            <p v-if="project.teaser" class="project-card__teaser">
                                {{ project.teaser.substring(0, 80) }}{{ project.teaser.length > 80 ? '...' : '' }}
                            </p>
                            <div class="project-card__meta">
                                <span class="project-card__role">{{ getRoleLabel(project._userRole) }}</span>
                                <span class="project-card__status">{{ getStatusLabel(project.status) }}</span>
                            </div>
                        </div>
                    </article>
                </div>
            </section>

            <!-- Recent Activity Section (placeholder) -->
            <section v-if="recentActivity.length > 0" class="home-layout__activity">
                <h2>Letzte Aktivitäten</h2>
                <ul class="activity-list">
                    <li v-for="activity in recentActivity" :key="activity.id" class="activity-item">
                        <span class="activity-icon">{{ activity.icon }}</span>
                        <span class="activity-text">{{ activity.text }}</span>
                        <span class="activity-time">{{ activity.time }}</span>
                    </li>
                </ul>
            </section>
        </main>

        <!-- Footer -->
        <footer class="home-layout__footer">
            <p>© 2025 Theaterpedia · <a href="/impressum">Impressum</a> · <a href="/datenschutz">Datenschutz</a></p>
        </footer>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { LogOut, Plus } from 'lucide-vue-next'
import { useAuth } from '@/composables/useAuth'
import { useTheme } from '@/composables/useTheme'

// ============================================================
// INTERNAL THEME CONTEXT
// ============================================================

const { setInternalContext } = useTheme()

onMounted(() => {
    setInternalContext(true, 'default')
})

onUnmounted(() => {
    setInternalContext(false)
})

// ============================================================
// AUTH & ROUTER
// ============================================================

const router = useRouter()
const { user, logout, checkSession } = useAuth()

// ============================================================
// STATE
// ============================================================

const projects = ref<any[]>([])
const regioProjects = ref<any[]>([])
const isLoading = ref(true)
const recentActivity = ref<any[]>([]) // Placeholder for future

// Dense mode detection
const isDense = ref(false)

// Partner linking state
const partnerSearchQuery = ref('')
const partnerSearchResults = ref<any[]>([])
const newPartnerName = ref('')

// Avatar upload state
const selectedImageContext = ref('')
const uploadProgress = ref('')
const avatarInput = ref<HTMLInputElement | null>(null)

// ============================================================
// COMPUTED: Status States
// ============================================================

const isNewState = computed(() => {
    const status = user.value?.status
    return !status || status === 1
})

const isDemoState = computed(() => {
    const status = user.value?.status
    return status === 8
})

const isDraftState = computed(() => {
    const status = user.value?.status
    return status === 64
})

const isConfirmedState = computed(() => {
    const status = user.value?.status
    return status === 512 || status === 1024
})

// ============================================================
// COMPUTED: User Properties
// ============================================================

const userFirstName = computed(() => {
    const username = user.value?.username || 'Gast'
    return username.split(' ')[0]
})

const hasPartner = computed(() => {
    return user.value?.partner_id !== null && user.value?.partner_id !== undefined
})

const hasAvatar = computed(() => {
    return user.value?.img_id !== null && user.value?.img_id !== undefined
})

// User's own projects (from project_members or owner_id)
const userProjects = computed(() => {
    return projects.value.filter(p => !p.is_regio)
})

// Project names for display
const projectNames = computed(() => {
    if (projects.value.length === 0) return ''
    return projects.value.map(p => p.heading || p.name || p.domaincode).join(', ')
})

// Is user Owner, Creator, or Member (can have public profile)
const isOwnerCreatorMember = computed(() => {
    const validRoles = ['owner', 'creator', 'member']
    return projects.value.some(p => validRoles.includes(p._userRole))
})

// Projects with role display
const projectsWithRoles = computed(() => {
    return projects.value.map(p => ({
        ...p,
        roleDisplay: getRoleLabel(p._userRole || p.role)
    }))
})

// Role summary across all projects
const roleSummary = computed(() => {
    const summary: Record<string, number> = {}
    for (const project of projects.value) {
        const role = project._userRole || project.role || 'member'
        summary[role] = (summary[role] || 0) + 1
    }
    return summary
})

const userStatusText = computed(() => {
    const status = user.value?.status
    if (!status || status === 1) return 'Deine E-Mail muss verifiziert sein bevor du Zugriff auf Projekte bekommst.'
    if (status === 8) {
        if (projects.value.length > 0) {
            return `Deine E-Mail ist verifiziert ✓ Du hast Zugriff auf: ${projectNames.value}`
        }
        return 'Deine E-Mail ist verifiziert ✓'
    }
    if (status === 64) return 'Status: Entwurf – Profil bereit zur Aktivierung'
    if (status === 512 || status === 1024) return 'Status: Verifiziert ✓'
    if (status >= 4096) return 'Status: Aktiv ✓'
    return 'Wähle ein Projekt oder erstelle ein neues.'
})

// ============================================================
// METHODS: Data Loading
// ============================================================

async function loadProjects() {
    try {
        isLoading.value = true

        // Load user's projects (owner or member)
        const response = await fetch('/api/projects?my=true')
        if (response.ok) {
            projects.value = await response.json()
        } else {
            console.error('Failed to load projects:', response.status)
        }

        // Load regio projects for avatar context selection
        const regioResponse = await fetch('/api/projects?is_regio=true')
        if (regioResponse.ok) {
            regioProjects.value = await regioResponse.json()
        }
    } catch (err) {
        console.error('Failed to load projects:', err)
    } finally {
        isLoading.value = false
    }
}

// ============================================================
// METHODS: Partner Linking
// ============================================================

async function searchPartners() {
    if (partnerSearchQuery.value.length < 2) {
        partnerSearchResults.value = []
        return
    }

    try {
        const response = await fetch(`/api/partners?search=${encodeURIComponent(partnerSearchQuery.value)}&limit=10`)
        if (response.ok) {
            partnerSearchResults.value = await response.json()
        }
    } catch (err) {
        console.error('Partner search failed:', err)
    }
}

async function selectPartner(partner: any) {
    if (partner.user_id) {
        alert('Dieses Profil ist bereits mit einem anderen Benutzer verknüpft.')
        return
    }

    try {
        const response = await fetch('/api/users/me/partner', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ partner_id: partner.id })
        })

        if (response.ok) {
            // Refresh user data
            window.location.reload()
        } else {
            const error = await response.json()
            alert(`Fehler: ${error.message}`)
        }
    } catch (err) {
        console.error('Partner linking failed:', err)
        alert('Verknüpfung fehlgeschlagen')
    }
}

async function createPartner() {
    if (!newPartnerName.value) return

    try {
        const response = await fetch('/api/partners', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: newPartnerName.value,
                partner_types: 1 // Default to instructor type
            })
        })

        if (response.ok) {
            const newPartner = await response.json()
            await selectPartner(newPartner)
        } else {
            const error = await response.json()
            alert(`Fehler: ${error.message}`)
        }
    } catch (err) {
        console.error('Partner creation failed:', err)
        alert('Profil konnte nicht erstellt werden')
    }
}

// ============================================================
// METHODS: Avatar Upload
// ============================================================

async function handleAvatarUpload(event: Event) {
    const input = event.target as HTMLInputElement
    if (!input.files?.length || !selectedImageContext.value) return

    const file = input.files[0]
    uploadProgress.value = 'Hochladen...'

    try {
        // Generate xmlid: domaincode.image_avatar.sanitized_sysmail_timestamp
        const sysmail = user.value?.sysmail || 'user'
        const sanitizedMail = sysmail.replace(/[@.\-]/g, '_')
        const timestamp = Date.now()
        const xmlid = `${selectedImageContext.value}.image_avatar.${sanitizedMail}_${timestamp}`

        const formData = new FormData()
        formData.append('file', file)
        formData.append('xmlid', xmlid)
        formData.append('owner_id', String(user.value?.id || 0))
        formData.append('context', selectedImageContext.value)
        formData.append('is_avatar', 'true')

        const response = await fetch('/api/images/upload', {
            method: 'POST',
            credentials: 'include',
            body: formData
        })

        if (response.ok) {
            const result = await response.json()
            const imageId = result.image_id  // upload returns image_id, not id

            // Link image to user
            const avatarResponse = await fetch('/api/users/me/avatar', {
                method: 'PATCH',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ img_id: imageId })
            })

            if (!avatarResponse.ok) {
                console.error('Failed to link avatar to user:', await avatarResponse.text())
            }

            // Also update partner's img_id if user has linked partner
            if (user.value?.partner_id) {
                const partnerResponse = await fetch(`/api/partners/${user.value.partner_id}`, {
                    method: 'PATCH',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ img_id: imageId })
                })
                if (!partnerResponse.ok) {
                    console.error('Failed to link avatar to partner:', await partnerResponse.text())
                }
            }

            uploadProgress.value = 'Erfolgreich hochgeladen!'
            // Refresh session to get updated img_id
            await checkSession()
        } else {
            const error = await response.json()
            uploadProgress.value = `Fehler: ${error.message}`
        }
    } catch (err) {
        console.error('Avatar upload failed:', err)
        uploadProgress.value = 'Upload fehlgeschlagen'
    }
}

// ============================================================
// METHODS: Profile Advancement (DEMO → DRAFT)
// ============================================================

async function advanceToDraft() {
    try {
        const response = await fetch('/api/users/me/advance', {
            method: 'POST'
        })

        if (response.ok) {
            // Refresh session to get updated status
            await checkSession()
        } else {
            const error = await response.json()
            alert(`Fehler: ${error.message}`)
        }
    } catch (err) {
        console.error('Advancement failed:', err)
        alert('Weiter-Schritt fehlgeschlagen')
    }
}

// ============================================================
// METHODS: Profile Activation
// ============================================================

async function activateProfile() {
    try {
        console.log('[Activation] Starting activation, current user status:', user.value?.status)
        
        const response = await fetch('/api/users/me/activate', {
            method: 'POST'
        })

        if (response.ok) {
            const result = await response.json()
            console.log('[Activation] API response:', result)
            
            // Refresh session to get updated status - this will trigger isConfirmedState
            await checkSession()
            
            console.log('[Activation] After checkSession, user status:', user.value?.status)
            console.log('[Activation] isConfirmedState should be:', user.value?.status === 512 || user.value?.status === 1024)
            // No alert needed - UI will automatically show project cards
        } else {
            const error = await response.json()
            alert(`Fehler: ${error.message}`)
        }
    } catch (err) {
        console.error('Activation failed:', err)
        alert('Aktivierung fehlgeschlagen')
    }
}

async function createPublicProfile() {
    // Navigate to public profile editor
    router.push('/profile/public')
}

// ============================================================
// METHODS: Navigation
// ============================================================

function openProject(project: any) {
    const projectId = project.domaincode || project.id
    router.push(`/projects/${projectId}`)
}

function createProject() {
    alert('Das System ist im Alpha-Status, bitte beantrage ein neues Projekt direkt bei Hans :)')
}

async function handleLogout() {
    await logout()
    window.location.href = '/'
}

// ============================================================
// METHODS: Helpers
// ============================================================

function getRoleLabel(role: string | null): string {
    const labels: Record<string, string> = {
        'owner': 'Eigentümer',
        'creator': 'Ersteller',
        'member': 'Mitglied',
        'partner': 'Partner',
        'participant': 'Teilnehmer'
    }
    return labels[role || ''] || 'Mitglied'
}

function getStatusLabel(status: number | null): string {
    const labels: Record<number, string> = {
        1: 'Neu',
        8: 'Demo',
        64: 'Entwurf',
        128: 'Review',
        256: 'Bestätigt',
        512: 'Veröffentlicht',
        1024: 'Archiviert'
    }
    return labels[status || 0] || 'Unbekannt'
}

function checkDenseMode() {
    const width = window.innerWidth
    isDense.value = width < 379 || (width >= 660 && width <= 800)
}

// ============================================================
// LIFECYCLE
// ============================================================

onMounted(async () => {
    // First restore session state from cookie
    await checkSession()
    // Then load user's projects
    loadProjects()
    checkDenseMode()
    window.addEventListener('resize', checkDenseMode)
})

onUnmounted(() => {
    window.removeEventListener('resize', checkDenseMode)
})
</script>

<style scoped>
.home-layout {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    background: var(--color-bg);
}

/* Header */
.home-layout__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 1.5rem;
    background: var(--color-card-bg);
    border-bottom: 1px solid var(--color-border);
}

.home-layout__brand {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.home-layout__logo {
    font-size: 1.5rem;
}

.home-layout__title {
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--color-contrast);
}

.home-layout__user {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.home-layout__username {
    font-size: 0.875rem;
    color: var(--color-dimmed);
}

.home-layout__logout {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.375rem;
    background: transparent;
    border: none;
    border-radius: var(--radius-small);
    color: var(--color-dimmed);
    cursor: pointer;
    transition: all 0.15s ease;
}

.home-layout__logout:hover {
    background: var(--color-muted-bg);
    color: var(--color-contrast);
}

/* Main */
.home-layout__main {
    flex: 1;
    padding: 2rem 1.5rem;
    max-width: 1200px;
    margin: 0 auto;
    width: 100%;
}

/* Welcome */
.home-layout__welcome {
    margin-bottom: 2rem;
}

.home-layout__welcome h1 {
    margin: 0 0 0.25rem;
    font-size: 1.75rem;
    font-weight: 600;
    color: var(--color-contrast);
}

.home-layout__welcome-sub {
    margin: 0;
    color: var(--color-dimmed);
}

/* ================================================================== */
/* STATUS 1: Verification Box */
/* ================================================================== */

.verification-box {
    background: var(--color-card-bg);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-large);
    padding: 2rem;
    text-align: center;
    max-width: 500px;
    margin: 0 auto;
}

.verification-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
}

.verification-box h2 {
    margin: 0 0 1rem;
    color: var(--color-contrast);
}

.verification-box p {
    color: var(--color-dimmed);
    margin: 0 0 0.5rem;
}

.verification-hint {
    font-size: 0.875rem;
    font-style: italic;
}

/* ================================================================== */
/* STATUS 8: Demo Onboarding */
/* ================================================================== */

.onboarding-demo {
    background: var(--color-card-bg);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-large);
    padding: 1.5rem;
}

.onboarding-demo h2 {
    margin: 0 0 1.5rem;
    font-size: 1.25rem;
    color: var(--color-contrast);
}

.onboarding-step {
    border: 1px solid var(--color-border);
    border-radius: var(--radius-medium);
    margin-bottom: 1rem;
    overflow: hidden;
}

.onboarding-step.completed {
    border-color: var(--color-positive-base);
    background: oklch(from var(--color-positive-base) l c h / 0.05);
}

.onboarding-step.disabled {
    opacity: 0.5;
    pointer-events: none;
}

.step-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem;
    background: var(--color-muted-bg);
}

.step-number {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: var(--color-primary-base);
    color: white;
    font-weight: 600;
    font-size: 0.875rem;
}

.onboarding-step.completed .step-number {
    background: var(--color-positive-base);
}

.step-title {
    flex: 1;
    font-weight: 500;
    color: var(--color-contrast);
}

.step-check {
    color: var(--color-positive-base);
    font-weight: 600;
}

.step-optional {
    color: var(--color-dimmed);
    font-size: 0.85rem;
    font-style: italic;
}

.step-content {
    padding: 1rem;
}

.step-content p {
    margin: 0 0 1rem;
    color: var(--color-dimmed);
}

/* Form box with muted background */
.form-box {
    background: var(--color-muted-bg);
    border-radius: var(--radius-medium);
    padding: 1rem;
}

.step-done {
    padding: 1rem;
    color: var(--color-positive-base);
}

/* Partner Search */
.partner-search,
.partner-create {
    margin-bottom: 1rem;
}

.partner-search label,
.partner-create label,
.avatar-context label,
.avatar-upload label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: var(--color-contrast);
}

.search-input-group input,
.partner-create input {
    width: 100%;
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-small);
    font-size: 0.875rem;
}

.search-results {
    list-style: none;
    margin: 0.5rem 0 0;
    padding: 0;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-small);
    max-height: 200px;
    overflow-y: auto;
}

.search-results li {
    padding: 0.5rem 0.75rem;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
}

.search-results li:hover {
    background: var(--color-muted-bg);
}

.search-results li.unavailable {
    opacity: 0.5;
    cursor: not-allowed;
}

.partner-linked {
    font-size: 0.75rem;
    color: var(--color-dimmed);
}

.divider {
    text-align: center;
    color: var(--color-dimmed);
    margin: 1rem 0;
    position: relative;
}

.divider::before,
.divider::after {
    content: '';
    position: absolute;
    top: 50%;
    width: 40%;
    height: 1px;
    background: var(--color-border);
}

.divider::before {
    left: 0;
}

.divider::after {
    right: 0;
}

/* Avatar Upload */
.avatar-context select {
    width: 100%;
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-small);
    font-size: 0.875rem;
    margin-bottom: 0.5rem;
}

.context-hint {
    font-size: 0.8125rem;
    color: var(--color-dimmed);
    font-style: italic;
}

.avatar-upload {
    margin-top: 1rem;
}

.upload-progress {
    margin-top: 0.5rem;
    font-size: 0.875rem;
    color: var(--color-primary-base);
}

.onboarding-complete {
    background: oklch(from var(--color-positive-base) l c h / 0.1);
    border-radius: var(--radius-medium);
    padding: 1rem;
    margin: 1rem 0;
    text-align: center;
}

.onboarding-complete p {
    margin: 0;
    color: var(--color-positive-base);
}

.onboarding-continue {
    background: var(--color-muted-bg);
    border-radius: var(--radius-medium);
    padding: 1.5rem;
    margin-top: 1.5rem;
    text-align: center;
}

.onboarding-continue p {
    margin: 0 0 1rem;
    color: var(--color-contrast);
}

.no-project-hint {
    color: var(--color-dimmed);
    font-style: italic;
}

.onboarding-no-project {
    background: var(--color-muted-bg);
    border-radius: var(--radius-large);
    padding: 2rem;
    text-align: center;
}

.onboarding-no-project p {
    margin-bottom: 0.5rem;
    color: var(--color-contrast);
}

.contact-hint {
    color: var(--color-dimmed);
    font-size: 0.875rem;
}

/* ================================================================== */
/* STATUS 64: Activation Box */
/* ================================================================== */

.activation-box {
    background: var(--color-card-bg);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-large);
    padding: 1.5rem;
}

.activation-box h2 {
    margin: 0 0 0.5rem;
    font-size: 1.5rem;
}

.activation-lead {
    font-size: 1.125rem;
    color: var(--color-contrast);
    margin-bottom: 1.5rem;
}

.instructor-hint {
    background: oklch(from var(--color-primary-base) l c h / 0.1);
    border-radius: var(--radius-medium);
    padding: 1rem;
    margin-bottom: 1.5rem;
}

.instructor-hint p {
    margin: 0;
    color: var(--color-dimmed);
    font-size: 0.9375rem;
}

.projects-with-roles {
    margin-bottom: 1.5rem;
}

.projects-with-roles h3 {
    margin: 0 0 0.75rem;
    font-size: 1rem;
}

.project-role-list {
    list-style: none;
    margin: 0;
    padding: 0;
}

.project-role-list li {
    display: flex;
    justify-content: space-between;
    padding: 0.5rem 0;
    border-bottom: 1px solid var(--color-border);
}

.project-role-list li:last-child {
    border-bottom: none;
}

.project-name {
    font-weight: 500;
}

.project-role {
    font-size: 0.875rem;
    color: var(--color-dimmed);
}

.role-summary {
    background: var(--color-muted-bg);
    border-radius: var(--radius-medium);
    padding: 1rem;
    margin-bottom: 1.5rem;
}

.role-summary h4 {
    margin: 0 0 0.75rem;
    font-size: 0.875rem;
    color: var(--color-dimmed);
}

.role-definition-list {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 0.25rem 1rem;
    margin: 0;
}

.role-definition-list dt {
    font-weight: 500;
}

.role-definition-list dd {
    margin: 0;
    color: var(--color-dimmed);
}

.activation-actions {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
}

/* ================================================================== */
/* Section Headers & Grid */
/* ================================================================== */

.home-layout__section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1rem;
}

.home-layout__section-header h2 {
    margin: 0;
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--color-contrast);
}

.home-layout__loading {
    display: flex;
    justify-content: center;
    padding: 3rem;
}

.loading-spinner {
    width: 2rem;
    height: 2rem;
    border: 3px solid var(--color-border);
    border-top-color: var(--color-primary-base);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

.home-layout__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    padding: 3rem;
    background: var(--color-card-bg);
    border: 2px dashed var(--color-border);
    border-radius: var(--radius-large);
    text-align: center;
}

.home-layout__empty p {
    margin: 0;
    color: var(--color-dimmed);
}

.home-layout__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1.5rem;
    margin-top: 1.5rem;
}

/* Project Cards */
.project-card {
    display: flex;
    flex-direction: column;
    background: var(--color-card-bg);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-large);
    overflow: hidden;
    cursor: pointer;
    transition: all 0.2s ease;
}

.project-card:hover {
    border-color: var(--color-primary-base);
    box-shadow: 0 4px 12px oklch(from var(--color-contrast) l c h / 0.1);
    transform: translateY(-2px);
}

.project-card__image {
    position: relative;
    height: 140px;
    background: var(--color-muted-bg);
}

.project-card__image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.project-card__placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    font-size: 3rem;
    font-weight: 600;
    color: var(--color-dimmed);
}

.project-card__content {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 1rem;
}

.project-card__title {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
    color: var(--color-contrast);
}

.project-card__teaser {
    margin: 0;
    font-size: 0.8125rem;
    color: var(--color-dimmed);
    line-height: 1.4;
}

.project-card__meta {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-top: 0.25rem;
}

.project-card__role,
.project-card__status {
    font-size: 0.6875rem;
    font-weight: 500;
    padding: 0.125rem 0.5rem;
    border-radius: var(--radius-small);
}

.project-card__role {
    background: var(--color-primary-bg);
    color: var(--color-primary-base);
}

.project-card__status {
    background: var(--color-muted-bg);
    color: var(--color-dimmed);
}

/* Activity */
.home-layout__activity {
    margin-top: 2rem;
}

.home-layout__activity h2 {
    margin: 0 0 1rem;
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--color-contrast);
}

.activity-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.activity-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    background: var(--color-card-bg);
    border-radius: var(--radius-medium);
}

.activity-icon {
    font-size: 1rem;
}

.activity-text {
    flex: 1;
    font-size: 0.875rem;
    color: var(--color-contrast);
}

.activity-time {
    font-size: 0.75rem;
    color: var(--color-dimmed);
}

/* Footer */
.home-layout__footer {
    padding: 1.5rem;
    text-align: center;
    color: var(--color-dimmed);
    font-size: 0.8125rem;
}

.home-layout__footer a {
    color: var(--color-dimmed);
    text-decoration: underline;
}

.home-layout__footer a:hover {
    color: var(--color-contrast);
}

/* Buttons */
.btn {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.5rem 1rem;
    border: none;
    border-radius: var(--radius-medium);
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
}

.btn--sm {
    padding: 0.375rem 0.75rem;
    font-size: 0.8125rem;
}

.btn--lg {
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
}

.btn--primary {
    background: var(--color-primary-base);
    color: var(--color-primary-contrast);
}

.btn--primary:hover {
    background: var(--color-primary-hover);
}

.btn--primary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.btn--secondary {
    background: var(--color-muted-bg);
    color: var(--color-contrast);
    border: 1px solid var(--color-border);
}

.btn--secondary:hover {
    background: var(--color-border);
}

/* Dense Mode */
.home-layout--dense {
    font-size: 87.5%;
}

.home-layout--dense .home-layout__welcome h1 {
    font-size: 1.5rem;
}

/* Responsive */
@media (max-width: 640px) {
    .home-layout__main {
        padding: 1.5rem 1rem;
    }

    .home-layout__welcome h1 {
        font-size: 1.5rem;
    }

    .home-layout__grid {
        grid-template-columns: 1fr;
    }

    .activation-actions {
        flex-direction: column;
    }
}
</style>
