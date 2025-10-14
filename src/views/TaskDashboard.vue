<template>
    <div class="dashboard-wrapper">
        <!-- Navbar -->
        <Navbar :is-authenticated="isAuthenticated" :user="user" @toggle-view-menu="toggleViewMenu"
            @toggle-admin-menu="toggleAdminMenu" @logout="handleLogout" />

        <!-- View Menu (ToggleMenu) -->
        <div v-if="showViewMenu" class="view-menu-overlay" @click="showViewMenu = false">
            <div class="view-menu-container" @click.stop>
                <ToggleMenu v-model="viewState" :placement="'left'" :header="'Ansicht'" :toggle-options="viewOptions"
                    @update:model-value="handleViewChange" />
            </div>
        </div>

        <!-- Admin Menu -->
        <div v-if="showAdminMenu" class="admin-menu-overlay" @click="showAdminMenu = false">
            <div class="admin-menu-container" @click.stop>
                <AdminMenu :admin-mode="adminMode" :settings-mode="settingsMode" :current-route="currentRoute"
                    :is-on-dashboard="currentRoute === '/'" @close="showAdminMenu = false" @set-mode="setAdminMode"
                    @toggle-settings="toggleSettingsMode" @action="handleAdminAction" />
            </div>
        </div>

        <Container>
            <Section>
                <!-- Not Authenticated State -->
                <div v-if="!isAuthenticated" class="auth-prompt">
                    <div class="auth-card">
                        <h2>🔒 Anmeldung erforderlich</h2>
                        <p>Bitte melden Sie sich an, um das Task-Dashboard zu nutzen.</p>
                        <Button @click="goToLogin" class="login-btn">Zur Anmeldung</Button>
                    </div>
                </div>

                <!-- Authenticated Content -->
                <div v-else>
                    <!-- Dashboard Header -->
                    <div class="dashboard-header">
                        <div class="header-role">
                            <h1 class="header-title">
                                <span v-if="user?.role === 'guest'">👤 Gast</span>
                                <span v-else-if="user?.role === 'admin'">👑 Admin</span>
                                <span v-else-if="user?.role === 'base'">📦 Basis</span>
                                <span v-else-if="user?.role === 'project1' || user?.role === 'project2'">🎯
                                    Projekt</span>
                                <span v-else>{{ user?.role }}</span>
                            </h1>
                            <p class="header-description">
                                <span v-if="user?.role === 'admin'">Verwalten Sie alle Aufgaben, Projekte und
                                    System-Einstellungen. Sie haben vollständigen Zugriff auf alle Funktionen.</span>
                                <span v-else-if="user?.role === 'base'">Bearbeiten Sie Basis-Aufgaben und verwalten Sie
                                    Standard-Inhalte. Ihr Fokus liegt auf den Kern-Funktionen.</span>
                                <span v-else-if="user?.role === 'project1' || user?.role === 'project2'">Verwalten Sie
                                    Ihre
                                    projekt-spezifischen Aufgaben und Inhalte. Sie arbeiten an Ihrem eigenen
                                    Projekt-Bereich.</span>
                                <span v-else>Willkommen im Task-Dashboard.</span>
                            </p>
                        </div>
                    </div>

                    <!-- Stats Cards (conditionally shown) -->
                    <div v-if="viewSettings.showStats" class="stats-grid">
                        <div class="stat-card stat-total">
                            <div class="stat-value">{{ stats.total }}</div>
                            <div class="stat-label">Gesamt</div>
                        </div>
                        <div class="stat-card stat-idea">
                            <div class="stat-value">{{ stats.idea }}</div>
                            <div class="stat-label">Ideen</div>
                        </div>
                        <div class="stat-card stat-draft">
                            <div class="stat-value">{{ stats.draft }}</div>
                            <div class="stat-label">Entwürfe</div>
                        </div>
                        <div class="stat-card stat-final">
                            <div class="stat-value">{{ stats.final }}</div>
                            <div class="stat-label">Fertig</div>
                        </div>
                        <div class="stat-card stat-reopen">
                            <div class="stat-value">{{ stats.reopen }}</div>
                            <div class="stat-label">Reopen</div>
                        </div>
                    </div>

                    <!-- Admin Filter Bar -->
                    <div v-if="user?.role === 'admin'" class="admin-filters">
                        <label class="filter-checkbox">
                            <input type="checkbox" v-model="adminFilters.showProject" />
                            <span>Projekt-Aufgaben anzeigen</span>
                        </label>
                        <label class="filter-checkbox">
                            <input type="checkbox" v-model="adminFilters.showBase" />
                            <span>Basis-Aufgaben anzeigen</span>
                        </label>
                        <label class="filter-checkbox">
                            <input type="checkbox" v-model="adminFilters.showAdmin" />
                            <span>Admin-Aufgaben anzeigen</span>
                        </label>
                    </div>

                    <!-- Loading State -->
                    <div v-if="loading" class="loading-state">
                        <p>Lädt Aufgaben...</p>
                    </div>

                    <!-- Error State -->
                    <div v-else-if="error" class="error-state">
                        <p>{{ error }}</p>
                        <Button @click="loadTasks">Erneut versuchen</Button>
                    </div>

                    <!-- Kanban Board Header with Toggle Buttons -->
                    <div v-else class="kanban-header">
                        <h2 class="kanban-title">Aufgaben-Board</h2>
                        <div class="kanban-toggles">
                            <button :class="['toggle-btn', { active: viewSettings.showNew }]"
                                @click="viewSettings.showNew = !viewSettings.showNew" title="Neu Spalte ein/ausblenden">
                                {{ viewSettings.showNew ? '👁' : '👁‍🗨' }} Neu
                            </button>
                            <button :class="['toggle-btn', { active: viewSettings.showTrash }]"
                                @click="viewSettings.showTrash = !viewSettings.showTrash"
                                title="Papierkorb Spalte ein/ausblenden">
                                {{ viewSettings.showTrash ? '👁' : '👁‍🗨' }} Papierkorb
                            </button>
                        </div>
                    </div>

                    <!-- Tasks Board (3 Main Columns + Optional) -->
                    <div v-if="!loading && !error" class="tasks-board">
                        <!-- Idea Column -->
                        <div class="task-column column-idea" @dragover.prevent @drop="handleDrop($event, 'idea')">
                            <h3 class="column-title">
                                <span class="column-icon">�</span>
                                Idea
                                <span class="column-count">{{ ideaTasks.length }}</span>
                            </h3>
                            <div class="task-list">
                                <TaskCard v-for="task in ideaTasks" :key="task.id" :task="task" @edit="editTask"
                                    @delete="deleteTask" @drag-start="handleDragStart" />
                                <div v-if="ideaTasks.length === 0" class="empty-column">
                                    No tasks in this column
                                </div>
                            </div>
                        </div>

                        <!-- New Column -->
                        <div class="task-column column-new" @dragover.prevent @drop="handleDrop($event, 'new')">
                            <h3 class="column-title">
                                <span class="column-icon">📋</span>
                                New
                                <span class="column-count">{{ newTasks.length }}</span>
                            </h3>
                            <div class="task-list">
                                <TaskCard v-for="task in newTasks" :key="task.id" :task="task" @edit="editTask"
                                    @delete="deleteTask" @drag-start="handleDragStart" />
                                <div v-if="newTasks.length === 0" class="empty-column">
                                    No tasks in this column
                                </div>
                            </div>
                        </div>

                        <!-- Draft Column -->
                        <div class="task-column column-draft" @dragover.prevent @drop="handleDrop($event, 'draft')">
                            <h3 class="column-title">
                                <span class="column-icon">⚡</span>
                                Draft
                                <span class="column-count">{{ draftTasks.length }}</span>
                            </h3>
                            <div class="task-list">
                                <TaskCard v-for="task in draftTasks" :key="task.id" :task="task" @edit="editTask"
                                    @delete="deleteTask" @drag-start="handleDragStart" />
                                <div v-if="draftTasks.length === 0" class="empty-column">
                                    No tasks in this column
                                </div>
                            </div>
                        </div>

                        <!-- Final/Reopen Column (Main - Combined) -->
                        <div class="task-column column-final" @dragover.prevent @drop="handleDrop($event, 'final')">
                            <h3 class="column-title">
                                <span class="column-icon">✓</span>
                                Fertig / Reopen
                                <span class="column-count">{{ finalReopenTasks.length }}</span>
                            </h3>
                            <div class="task-list">
                                <TaskCard v-for="task in finalReopenTasks" :key="task.id" :task="task" @edit="editTask"
                                    @delete="deleteTask" @drag-start="handleDragStart" />
                                <div v-if="finalReopenTasks.length === 0" class="empty-column">
                                    Keine Aufgaben
                                </div>
                            </div>
                        </div>

                        <!-- Trash Column (optional) -->
                        <div v-if="viewSettings.showTrash" class="task-column column-trash" @dragover.prevent
                            @drop="handleDrop($event, 'trash')">
                            <h3 class="column-title">
                                <span class="column-icon">🗑</span>
                                Papierkorb
                                <span class="column-count">{{ trashTasks.length }}</span>
                            </h3>
                            <div class="task-list">
                                <TaskCard v-for="task in trashTasks" :key="task.id" :task="task" @edit="editTask"
                                    @delete="deleteTask" @drag-start="handleDragStart" />
                                <div v-if="trashTasks.length === 0" class="empty-column">
                                    Keine Aufgaben
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Admin Sections -->
                    <div v-if="user?.role === 'admin'">
                        <!-- CRUD Tables (visible when settingsMode is ON) -->
                        <div v-if="settingsMode">
                            <!-- Releases Table -->
                            <ReleasesTable :releases="releases" :loading="releasesLoading" @create="createRelease"
                                @edit="editRelease" @delete="deleteRelease" />

                            <!-- Projects Table -->
                            <ProjectsTable :projects="projects" :loading="projectsLoading" @create="createProject"
                                @edit="editProject" @delete="deleteProject" />
                        </div>

                        <!-- Admin Tasks List (visible when settingsMode is OFF) -->
                        <div v-if="!settingsMode">
                            <AdminTasksList :tasks="adminTasks" :loading="adminTasksLoading"
                                @execute="executeAdminTask" />
                        </div>
                    </div>
                </div>
                <!-- End of authenticated content -->
            </Section>

            <!-- Task Edit Modal -->
            <TaskEditModal v-if="showTaskModal" :is-open="showTaskModal" :task="currentTask" :releases="releases"
                @close="closeTaskModal" @save="saveTask" />

            <!-- Toast Notifications -->
            <Toast v-if="showToast" :message="toastMessage" :type="toastType" @close="closeToast" />

            <!-- Project Modal -->
            <ProjectModal v-if="showProjectModal" :is-open="showProjectModal" :project="currentProject"
                @close="closeProjectModal" @save="saveProject" />

            <!-- Release Modal -->
            <ReleaseModal v-if="showReleaseModal" :is-open="showReleaseModal" :release="currentRelease"
                @close="closeReleaseModal" @save="saveRelease" />
        </Container>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, onBeforeRouteLeave } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import Container from '@/components/Container.vue'
import Section from '@/components/Section.vue'
import Button from '@/components/Button.vue'
import TaskCard from '@/components/TaskCard.vue'
import TaskEditModal from '@/components/TaskEditModal.vue'
import Navbar from '@/components/Navbar.vue'
import ToggleMenu from '@/components/ToggleMenu.vue'
import AdminMenu from '@/components/AdminMenu.vue'
import Toast from '@/components/Toast.vue'
import ProjectsTable from '@/components/ProjectsTable.vue'
import AdminTasksList from '@/components/AdminTasksList.vue'
import ProjectModal from '@/components/ProjectModal.vue'
import ReleasesTable from '@/components/ReleasesTable.vue'
import ReleaseModal from '@/components/ReleaseModal.vue'

interface Task {
    id: string
    title: string
    description?: string
    category: 'admin' | 'main' | 'release'
    status: 'idea' | 'new' | 'draft' | 'final' | 'reopen' | 'trash'
    priority: 'low' | 'medium' | 'high' | 'urgent'
    release_id?: string
    record_type?: string
    record_id?: string
    assigned_to?: string
    image?: string
    prompt?: string
    due_date?: string
    completed_at?: string
    created_at: string
    updated_at: string
    entity_name?: string
    display_title?: string
}

interface Release {
    id: string
    version: string
    version_major: number
    version_minor: number
    description?: string
    state: 'idea' | 'draft' | 'final' | 'trash'
    release_date?: string
    task_count: number
}

const router = useRouter()
const { user, isAuthenticated, checkSession, logout } = useAuth()

const tasks = ref<Task[]>([])
const releases = ref<Release[]>([])
const showTaskModal = ref(false)
const currentTask = ref<Task | null>(null)
const loading = ref(false)
const error = ref('')
const draggedTask = ref<Task | null>(null)

// View menu state
const showViewMenu = ref(false)
const viewState = ref('only-main') // 'only-release' | 'only-main' | 'all-tasks'

// Admin menu state (global, persisted across routes)
const showAdminMenu = ref(false)
const adminMode = ref<'base-release' | 'version-release'>('base-release')
const settingsMode = ref(false)
const currentRoute = computed(() => router.currentRoute.value.path)

// View settings
const viewSettings = ref({
    showStats: true,
    showNew: false,
    showTrash: false
})

// Admin filters (admin only)
const adminFilters = ref({
    showProject: false,
    showBase: true,
    showAdmin: true
})

// Admin data
const releasesLoading = ref(false)
const projects = ref<any[]>([])
const projectsLoading = ref(false)
const adminTasks = ref<Task[]>([])
const adminTasksLoading = ref(false)

// Project modal state
const showProjectModal = ref(false)
const currentProject = ref<any>(null)

// Release modal state
const showReleaseModal = ref(false)
const currentRelease = ref<any>(null)

// Toast state
const toastMessage = ref('')
const toastType = ref<'success' | 'error' | 'warning' | 'info'>('info')
const showToast = ref(false)

// Navigate to login
const goToLogin = () => {
    router.push('/login')
}

// Handle logout
const handleLogout = async () => {
    await logout()
}

// View menu options
const viewOptions = [
    {
        text: 'Aufgabenumfang',
        children: [
            {
                text: 'Nur Hauptaufgaben',
                state: 'only-main',
                icon: { template: '📋' }
            },
            {
                text: 'Nur Release-Aufgaben',
                state: 'only-release',
                icon: { template: '🎯' }
            },
            {
                text: 'Alle Aufgaben',
                state: 'all-tasks',
                icon: { template: '📊' }
            }
        ]
    }
]

// Computed: Filtered tasks based on view state and admin filters
const filteredTasks = computed(() => {
    let result = tasks.value

    // Apply task scope filter (release/main/all)
    if (viewState.value === 'only-release') {
        result = result.filter((task: Task) => task.release_id !== null && task.release_id !== undefined)
    } else if (viewState.value === 'only-main') {
        result = result.filter((task: Task) => task.category === 'main')
    }
    // 'all-tasks' shows everything

    // Apply admin category filters (admin only)
    if (user.value?.role === 'admin') {
        const categoryFilters: Array<'admin' | 'main' | 'release'> = []
        if (adminFilters.value.showProject) categoryFilters.push('release')
        if (adminFilters.value.showBase) categoryFilters.push('main')
        if (adminFilters.value.showAdmin) categoryFilters.push('admin')

        if (categoryFilters.length > 0 && categoryFilters.length < 3) {
            result = result.filter((task: Task) => categoryFilters.includes(task.category))
        }
    }

    return result
})

// Computed: Statistics
const stats = computed(() => {
    const filtered = filteredTasks.value
    return {
        total: filtered.length,
        idea: filtered.filter((t: Task) => t.status === 'idea').length,
        draft: filtered.filter((t: Task) => t.status === 'draft').length,
        final: filtered.filter((t: Task) => t.status === 'final').length,
        reopen: filtered.filter((t: Task) => t.status === 'reopen').length
    }
})

// Computed: Tasks by status
const ideaTasks = computed(() =>
    filteredTasks.value.filter((t: Task) => t.status === 'idea')
)
const newTasks = computed(() =>
    filteredTasks.value.filter((t: Task) => t.status === 'new')
)
const draftTasks = computed(() =>
    filteredTasks.value.filter((t: Task) => t.status === 'draft')
)
const finalReopenTasks = computed(() =>
    filteredTasks.value.filter((t: Task) => t.status === 'final' || t.status === 'reopen')
)
const trashTasks = computed(() =>
    filteredTasks.value.filter((t: Task) => t.status === 'trash')
)

// Load tasks from API
async function loadTasks() {
    loading.value = true
    error.value = ''

    try {
        const response = await fetch('/api/tasks')
        if (!response.ok) {
            throw new Error(`Failed to load tasks: ${response.statusText}`)
        }

        const data = await response.json()
        tasks.value = data.tasks || []
    } catch (err) {
        error.value = err instanceof Error ? err.message : 'Failed to load tasks'
        console.error('Error loading tasks:', err)
    } finally {
        loading.value = false
    }
}

// Open modal for new task
function openNewTaskModal() {
    currentTask.value = null
    showTaskModal.value = true
}

// Open modal to edit task
function editTask(task: Task) {
    currentTask.value = { ...task }
    showTaskModal.value = true
}

// Close modal
function closeTaskModal() {
    showTaskModal.value = false
    currentTask.value = null
}

// Save task (create or update)
async function saveTask(taskData: Partial<Task>) {
    try {
        if (currentTask.value?.id) {
            // Update existing task
            const response = await fetch(`/api/tasks/${currentTask.value.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(taskData)
            })

            if (!response.ok) {
                throw new Error('Failed to update task')
            }
        } else {
            // Create new task
            const response = await fetch('/api/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(taskData)
            })

            if (!response.ok) {
                throw new Error('Failed to create task')
            }
        }

        await loadTasks()
        closeTaskModal()
    } catch (err) {
        error.value = err instanceof Error ? err.message : 'Failed to save task'
        console.error('Error saving task:', err)
    }
}

// Delete task
async function deleteTask(task: Task) {
    if (!confirm(`Are you sure you want to delete "${task.title}"?`)) {
        return
    }

    try {
        const response = await fetch(`/api/tasks/${task.id}`, {
            method: 'DELETE'
        })

        if (!response.ok) {
            throw new Error('Failed to delete task')
        }

        await loadTasks()
    } catch (err) {
        error.value = err instanceof Error ? err.message : 'Failed to delete task'
        console.error('Error deleting task:', err)
    }
}

// Update task status (for drag-and-drop)
async function updateTaskStatus(taskId: string, newStatus: Task['status']) {
    try {
        const response = await fetch(`/api/tasks/${taskId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        })

        if (!response.ok) {
            throw new Error('Failed to update task status')
        }

        await loadTasks()
    } catch (err) {
        error.value = err instanceof Error ? err.message : 'Failed to update task status'
        console.error('Error updating task status:', err)
    }
}

// Drag and drop handlers
function handleDragStart(task: Task) {
    draggedTask.value = task
}

function handleDrop(event: DragEvent, newStatus: Task['status']) {
    event.preventDefault()

    if (draggedTask.value && draggedTask.value.status !== newStatus) {
        updateTaskStatus(draggedTask.value.id, newStatus)
    }

    draggedTask.value = null
}

// View menu handlers
function toggleViewMenu() {
    showViewMenu.value = !showViewMenu.value
}

function handleViewChange(newState: string) {
    viewState.value = newState
    showViewMenu.value = false
}

// Admin menu handlers
function toggleAdminMenu() {
    showAdminMenu.value = !showAdminMenu.value
}

function setAdminMode(mode: 'base-release' | 'version-release') {
    adminMode.value = mode
    
    // Apply filters based on mode
    if (mode === 'base-release') {
        // Hide tasks that relate to projects
        adminFilters.value.showProject = false
        // Show tasks that relate to base
        adminFilters.value.showBase = true
        // Set to only main tasks
        viewState.value = 'only-main'
    } else {
        // version-release mode
        // Show tasks that relate to projects
        adminFilters.value.showProject = true
        // Hide tasks that relate to base
        adminFilters.value.showBase = false
        // Set to only tasks of one release
        viewState.value = 'only-release'
    }
    
    showToastNotification(
        mode === 'base-release' ? 
            'Modus: Basis-Release (nur Haupt-Tasks ohne Projekte)' : 
            'Modus: Version-Release (Tasks eines Releases mit Projekten)',
        'info'
    )
}

function toggleSettingsMode() {
    settingsMode.value = !settingsMode.value
    
    if (settingsMode.value) {
        // Settings mode ON: Lock navigation to /
        if (currentRoute.value !== '/') {
            router.push('/')
        }
        showToastNotification('Einstellungsmodus aktiviert - Navigation gesperrt, CRUD sichtbar', 'info')
    } else {
        showToastNotification('Einstellungsmodus deaktiviert - Navigation frei, Admin-Tasks sichtbar', 'info')
    }
}

function handleAdminAction(action: string) {
    const messages: Record<string, string> = {
        export: '📤 Daten werden exportiert...',
        backup: '💾 Backup wird erstellt...',
        sync: '🔄 Synchronisation gestartet...',
        report: '📊 Bericht wird generiert...'
    }
    showToastNotification(messages[action] || `Aktion "${action}" ausgeführt`, 'info')
}

// Toast notification
function showToastNotification(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') {
    toastMessage.value = message
    toastType.value = type
    showToast.value = true
}

function closeToast() {
    showToast.value = false
}

// Load projects (admin only)
async function loadProjects() {
    if (user.value?.role !== 'admin') return
    projectsLoading.value = true
    try {
        const response = await fetch('/api/projects')
        if (response.ok) {
            const data = await response.json()
            projects.value = data.projects || []
        }
    } catch (err) {
        console.error('Failed to load projects:', err)
    } finally {
        projectsLoading.value = false
    }
}

// Load admin tasks (admin only)
async function loadAdminTasks() {
    if (user.value?.role !== 'admin') return
    adminTasksLoading.value = true
    try {
        const response = await fetch('/api/tasks?category=admin')
        if (response.ok) {
            const data = await response.json()
            adminTasks.value = data.tasks || []
        }
    } catch (err) {
        console.error('Failed to load admin tasks:', err)
    } finally {
        adminTasksLoading.value = false
    }
}

// Project CRUD handlers
function createProject() {
    currentProject.value = null
    showProjectModal.value = true
}

function editProject(project: any) {
    currentProject.value = { ...project }
    showProjectModal.value = true
}

function closeProjectModal() {
    showProjectModal.value = false
    currentProject.value = null
}

async function saveProject(projectData: any) {
    try {
        const isEdit = currentProject.value?.id
        const url = isEdit ? `/api/projects/${currentProject.value.id}` : '/api/projects'
        const method = isEdit ? 'PUT' : 'POST'

        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(projectData)
        })

        if (response.ok) {
            await loadProjects()
            closeProjectModal()
            showToastNotification(
                isEdit ? 'Projekt aktualisiert' : 'Projekt erstellt',
                'success'
            )
        } else {
            throw new Error('Fehler beim Speichern')
        }
    } catch (err) {
        console.error('Error saving project:', err)
        showToastNotification('Fehler beim Speichern', 'error')
    }
}

async function deleteProject(project: any) {
    if (!confirm(`Projekt "${project.name}" wirklich löschen?`)) {
        return
    }

    try {
        const response = await fetch(`/api/projects/${project.id}`, {
            method: 'DELETE'
        })

        if (response.ok) {
            await loadProjects()
            showToastNotification('Projekt gelöscht', 'success')
        } else {
            throw new Error('Fehler beim Löschen')
        }
    } catch (err) {
        console.error('Error deleting project:', err)
        showToastNotification('Fehler beim Löschen', 'error')
    }
}

// Release CRUD handlers
function createRelease() {
    currentRelease.value = null
    showReleaseModal.value = true
}

function editRelease(release: any) {
    currentRelease.value = { ...release }
    showReleaseModal.value = true
}

function closeReleaseModal() {
    showReleaseModal.value = false
    currentRelease.value = null
}

async function saveRelease(releaseData: any) {
    try {
        const isEdit = currentRelease.value?.id
        const url = isEdit ? `/api/releases/${currentRelease.value.id}` : '/api/releases'
        const method = isEdit ? 'PUT' : 'POST'

        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(releaseData)
        })

        if (response.ok) {
            await loadReleases()
            closeReleaseModal()
            showToastNotification(
                isEdit ? 'Release aktualisiert' : 'Release erstellt',
                'success'
            )
        } else {
            const error = await response.json()
            throw new Error(error.message || 'Fehler beim Speichern')
        }
    } catch (err: any) {
        console.error('Error saving release:', err)
        showToastNotification(err.message || 'Fehler beim Speichern', 'error')
    }
}

async function deleteRelease(release: any) {
    const taskCount = release.task_count || 0
    const confirmMsg = taskCount > 0
        ? `Release "v${release.version}" hat ${taskCount} Task(s). Wirklich löschen?`
        : `Release "v${release.version}" wirklich löschen?`

    if (!confirm(confirmMsg)) {
        return
    }

    try {
        const response = await fetch(`/api/releases/${release.id}`, {
            method: 'DELETE'
        })

        if (response.ok) {
            await loadReleases()
            showToastNotification('Release gelöscht', 'success')
        } else {
            throw new Error('Fehler beim Löschen')
        }
    } catch (err) {
        console.error('Error deleting release:', err)
        showToastNotification('Fehler beim Löschen', 'error')
    }
}

// Execute admin task
function executeAdminTask(task: Task) {
    showToastNotification(`${task.display_title || task.title} ausgeführt`, 'success')
}

// Load releases from API
async function loadReleases() {
    releasesLoading.value = true
    try {
        const response = await fetch('/api/releases')
        if (!response.ok) {
            throw new Error('Failed to load releases')
        }
        const data = await response.json()
        releases.value = data.releases || []
    } catch (err) {
        console.error('Error loading releases:', err)
        releases.value = []
    } finally {
        releasesLoading.value = false
    }
}

// Block navigation when settings mode is active
onBeforeRouteLeave((to, from) => {
    if (settingsMode.value && to.path !== '/') {
        showToastNotification(
            '⚠️ Navigation gesperrt im Einstellungsmodus. Deaktivieren Sie den Einstellungsmodus um zu navigieren.',
            'warning'
        )
        return false
    }
    return true
})

// Load data on mount
onMounted(async () => {
    await checkSession()
    if (isAuthenticated.value) {
        await Promise.all([
            loadTasks(),
            loadReleases(),
            loadProjects(),
            loadAdminTasks()
        ])
    }
})
</script>

<style scoped>
/* Dashboard Wrapper */
.dashboard-wrapper {
    min-height: 100vh;
    background: var(--color-bg);
}

/* View Menu Overlay */
.view-menu-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: oklch(0% 0 0 / 0.5);
    z-index: 999;
    display: flex;
    align-items: flex-start;
    justify-content: flex-start;
    padding: 5rem 2rem 2rem 2rem;
}

.view-menu-container {
    background: var(--color-card-bg);
    border-radius: var(--radius-button);
    box-shadow: 0 10px 40px oklch(0% 0 0 / 0.3);
    max-width: 400px;
}

/* Admin Menu Overlay */
.admin-menu-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: oklch(0% 0 0 / 0.5);
    z-index: 999;
    display: flex;
    align-items: flex-start;
    justify-content: flex-end;
    padding: 5rem 2rem 2rem 2rem;
}

.admin-menu-container {
    max-width: 400px;
}

/* Dashboard Header */
.dashboard-header {
    padding: 2rem 0;
    margin-bottom: 2rem;
    border-bottom: 2px solid var(--color-border);
}

.header-role {
    max-width: 800px;
}

.header-title {
    font-size: 2rem;
    font-weight: 700;
    color: var(--color-contrast);
    margin: 0 0 0.75rem 0;
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.header-description {
    font-size: 1.125rem;
    color: var(--color-dimmed);
    line-height: 1.6;
    margin: 0;
}

/* Admin Filters */
.admin-filters {
    display: flex;
    gap: 1.5rem;
    flex-wrap: wrap;
    padding: 1rem 1.5rem;
    background: var(--color-muted-bg);
    border-radius: var(--radius-button);
    margin-bottom: 2rem;
}

.filter-checkbox {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    font-size: 0.9375rem;
    color: var(--color-contrast);
    user-select: none;
}

.filter-checkbox input[type="checkbox"] {
    width: 1.125rem;
    height: 1.125rem;
    cursor: pointer;
}

/* Kanban Header */
.kanban-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
    border-bottom: 2px solid var(--color-border);
}

.kanban-title {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--color-contrast);
    margin: 0;
}

.kanban-toggles {
    display: flex;
    gap: 0.75rem;
}

.toggle-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: var(--color-muted-bg);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-button);
    color: var(--color-dimmed);
    font-family: var(--font);
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
}

.toggle-btn:hover {
    background: var(--color-card-bg);
    border-color: var(--color-primary-bg);
}

.toggle-btn.active {
    background: var(--color-primary-bg);
    border-color: var(--color-primary-bg);
    color: var(--color-primary-contrast);
}

/* Stats Grid */
.stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1.5rem;
    margin: 2rem 0 3rem;
}

.stat-card {
    padding: 2rem 1.5rem;
    background: var(--color-card-bg);
    border-radius: var(--radius-button);
    border: 2px solid var(--color-border);
    text-align: center;
    transition: all 0.2s ease;
}

.stat-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px oklch(0% 0 0 / 0.1);
}

.stat-total {
    border-color: var(--color-accent-bg);
}

.stat-idea {
    border-color: oklch(72.21% 0.2812 280);
}

.stat-new {
    border-color: oklch(72.21% 0.2812 240);
}

.stat-draft {
    border-color: oklch(72.21% 0.2812 60);
}

.stat-final {
    border-color: var(--color-positive-bg);
}

.stat-reopen {
    border-color: var(--color-secondary-bg);
}

.stat-value {
    font-size: 3rem;
    font-weight: 700;
    color: var(--color-contrast);
    line-height: 1;
    margin-bottom: 0.5rem;
}

.stat-label {
    font-size: 0.875rem;
    color: var(--color-dimmed);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-weight: 500;
}

/* Filter Bar */
.filter-bar {
    display: flex;
    gap: 1.5rem;
    margin-bottom: 2rem;
    padding: 1.5rem;
    background: var(--color-muted-bg);
    border-radius: var(--radius-button);
    align-items: flex-end;
    flex-wrap: wrap;
}

.filter-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    min-width: 200px;
}

.filter-label {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-contrast);
}

.filter-select {
    padding: 0.75rem 1rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-button);
    background: var(--color-bg);
    color: var(--color-contrast);
    font-family: var(--font);
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.2s ease;
}

.filter-select:hover {
    border-color: var(--color-primary-bg);
}

.filter-select:focus {
    outline: none;
    border-color: var(--color-primary-bg);
    box-shadow: 0 0 0 3px var(--color-ring);
}

.new-task-btn {
    margin-left: auto;
    align-self: flex-end;
}

/* Loading & Error States */
.loading-state,
.error-state {
    text-align: center;
    padding: 4rem 2rem;
    background: var(--color-muted-bg);
    border-radius: var(--radius-button);
    margin: 2rem 0;
}

.error-state p {
    color: var(--color-negative-base);
    margin-bottom: 1rem;
}

/* Tasks Board */
.tasks-board {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1.5rem;
    margin: 2rem 0;
}

@media (max-width: 1200px) {
    .tasks-board {
        grid-template-columns: 1fr;
    }
}

.task-column {
    background: var(--color-muted-bg);
    border-radius: var(--radius-button);
    padding: 1rem;
    min-height: 500px;
    display: flex;
    flex-direction: column;
    transition: all 0.2s ease;
}

.task-column:hover {
    background: oklch(from var(--color-muted-bg) calc(l * 0.98) c h);
}

.column-title {
    font-size: 1.125rem;
    font-weight: 700;
    margin: 0 0 1rem;
    padding-bottom: 1rem;
    border-bottom: 2px solid var(--color-border);
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--color-contrast);
}

.column-icon {
    font-size: 1.25rem;
}

.column-count {
    margin-left: auto;
    font-size: 0.875rem;
    font-weight: 600;
    padding: 0.25rem 0.75rem;
    background: var(--color-bg);
    border-radius: 999px;
    color: var(--color-dimmed);
}

.column-todo .column-title {
    color: oklch(72.21% 0.2812 240);
}

.column-in-progress .column-title {
    color: oklch(72.21% 0.2812 60);
}

.column-done .column-title {
    color: var(--color-primary-bg);
}

.task-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    flex: 1;
}

.empty-column {
    text-align: center;
    padding: 3rem 1rem;
    color: var(--color-dimmed);
    font-size: 0.875rem;
    font-style: italic;
}

/* Quick Links Section */
.quick-links-section {
    margin-top: 4rem;
    padding: 2rem;
    background: var(--color-card-bg);
    border-radius: var(--radius-button);
    border: 1px solid var(--color-border);
}

.section-subtitle {
    font-size: 1.25rem;
    font-weight: 700;
    margin: 0 0 1.5rem;
    color: var(--color-contrast);
}

.quick-links {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
}

/* Authentication UI */
.auth-prompt {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 40vh;
    padding: 3rem 0;
}

.auth-card {
    max-width: 500px;
    padding: 3rem;
    background: white;
    border-radius: 12px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    text-align: center;
}

.auth-card h2 {
    font-size: 1.75rem;
    font-weight: 700;
    color: #111827;
    margin-bottom: 1rem;
}

.auth-card p {
    font-size: 1.125rem;
    color: #6b7280;
    margin-bottom: 2rem;
}

.login-btn {
    padding: 0.875rem 2rem;
    font-size: 1.125rem;
    font-weight: 600;
}

.user-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.5rem;
    background: #f3f4f6;
    border-radius: 8px;
    margin-bottom: 2rem;
}

.user-info span {
    color: #374151;
    font-size: 0.875rem;
}

.user-info strong {
    color: #111827;
    font-weight: 600;
}

.logout-btn-header {
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
}

/* Trash Column Styling */
.column-trash {
    opacity: 0.8;
}

.column-trash .column-title {
    color: var(--color-negative-bg);
}

.column-trash:hover {
    opacity: 1;
}
</style>
