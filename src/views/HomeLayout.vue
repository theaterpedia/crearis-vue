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

            <!-- Demo State (status=8): Show onboarding instructions -->
            <section v-if="isDemoState" class="home-layout__onboarding">
                <div v-if="projects.length > 0" class="onboarding-instructions">
                    <h2>Wie geht es jetzt weiter?</h2>
                    <div class="instructions-content">
                        <p>Im <strong>Projekt-Stepper</strong> kannst du dein Projekt Schritt für Schritt einrichten:
                        </p>
                        <ul>
                            <li>📅 <strong>Events anlegen</strong> – Erstelle Veranstaltungen aus Vorlagen oder von
                                Grund auf</li>
                            <li>📝 <strong>Themen/Posts erstellen</strong> – Beschreibe dein Projekt mit Beiträgen</li>
                            <li>🖼️ <strong>Bilder hochladen</strong> – Füge Bilder zu Events und Posts hinzu</li>
                            <li>🏷️ <strong>Taxonomie testen</strong> – Ordne Inhalte mit Tags und Kategorien</li>
                            <li>🎨 <strong>Theme wählen</strong> – Passe das Erscheinungsbild deines Projekts an</li>
                        </ul>
                        <p class="instructions-hint">Klicke auf dein Projekt um den Stepper zu starten:</p>
                    </div>

                    <!-- Project Cards for Demo State -->
                    <div class="home-layout__grid">
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
                            </div>
                        </article>
                    </div>
                </div>

                <div v-else class="onboarding-no-project">
                    <p>Bevor du auf Theaterpedia arbeiten kannst, musst du in einem Projekt registriert sein.</p>
                    <p class="contact-hint">Bitte informiere den Admin, damit du einem Projekt zugewiesen werden kannst.
                    </p>
                </div>
            </section>

            <!-- Projects Grid - Only show if user is verified (status >= 64) -->
            <section v-else-if="isUserVerified" class="home-layout__projects">
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
const { user, logout } = useAuth()

// ============================================================
// STATE
// ============================================================

const projects = ref<any[]>([])
const isLoading = ref(true)
const recentActivity = ref<any[]>([]) // Placeholder for future

// Dense mode detection
const isDense = ref(false)

// ============================================================
// COMPUTED
// ============================================================

const userFirstName = computed(() => {
    const username = user.value?.username || 'Gast'
    // Extract firstname (first word before space)
    return username.split(' ')[0]
})

// User is in demo state (status = 8)
const isDemoState = computed(() => {
    const status = user.value?.status
    return status === 8
})

// User is verified if status >= 64 (draft or higher)
const isUserVerified = computed(() => {
    const status = user.value?.status
    return status && status >= 64
})

// Project names for display
const projectNames = computed(() => {
    if (projects.value.length === 0) return ''
    return projects.value.map(p => p.heading || p.name || p.domaincode).join(', ')
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
    if (status === 64) return 'Status: Entwurf – Profil unvollständig'
    if (status === 512 || status === 1024) return 'Status: Verifiziert ✓'
    if (status >= 4096) return 'Status: Aktiv ✓'
    return 'Wähle ein Projekt oder erstelle ein neues.'
})

// ============================================================
// METHODS
// ============================================================

async function loadProjects() {
    try {
        isLoading.value = true

        // Load projects where user is owner or member
        const response = await fetch('/api/projects?my=true')

        if (response.ok) {
            projects.value = await response.json()
        } else {
            console.error('Failed to load projects:', response.status)
        }
    } catch (err) {
        console.error('Failed to load projects:', err)
    } finally {
        isLoading.value = false
    }
}

function openProject(project: any) {
    // Use domaincode or id for route
    const projectId = project.domaincode || project.id
    router.push(`/projects/${projectId}`)
}

function createProject() {
    // Alpha status - direct request to Hans
    alert('Das System ist im Alpha-Status, bitte beantrage ein neues Projekt direkt bei Hans :)')
}

async function handleLogout() {
    await logout()
    // Force full page navigation to clear component state
    window.location.href = '/'
}

function getRoleLabel(role: string | null): string {
    const labels: Record<string, string> = {
        'owner': 'Eigentümer',
        'member': 'Mitglied',
        'partner': 'Partner',
        'participant': 'Teilnehmer'
    }
    return labels[role || ''] || 'Mitglied'
}

function getStatusLabel(status: number | null): string {
    // Based on Migration 040 status values
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

// Responsive check for dense mode
function checkDenseMode() {
    const width = window.innerWidth
    isDense.value = width < 379 || (width >= 660 && width <= 800)
}

// ============================================================
// LIFECYCLE
// ============================================================

onMounted(() => {
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

/* Section Headers */
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

/* Loading */
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

/* Empty */
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

/* Projects Grid */
.home-layout__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1.5rem;
}

/* Project Card */
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

/* Activity Section */
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

/* Onboarding Section */
.home-layout__onboarding {
    margin-top: 2rem;
}

.onboarding-instructions {
    background: var(--color-card-bg);
    border-radius: var(--radius-large);
    padding: 1.5rem;
    border: 1px solid var(--color-border);
}

.onboarding-instructions h2 {
    font-size: 1.25rem;
    margin-bottom: 1rem;
    color: var(--color-contrast);
}

.instructions-content {
    color: var(--color-dimmed);
    line-height: 1.6;
}

.instructions-content p {
    margin-bottom: 1rem;
}

.instructions-content ul {
    list-style: none;
    padding: 0;
    margin: 1rem 0;
}

.instructions-content li {
    padding: 0.5rem 0;
    border-bottom: 1px solid var(--color-border);
}

.instructions-content li:last-child {
    border-bottom: none;
}

.instructions-hint {
    font-weight: 500;
    color: var(--color-contrast);
    margin-top: 1.5rem;
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

.btn--primary {
    background: var(--color-primary-base);
    color: var(--color-primary-contrast);
}

.btn--primary:hover {
    background: var(--color-primary-hover);
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
}
</style>
