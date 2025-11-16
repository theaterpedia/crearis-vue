<template>
    <div class="dashboard-wrapper">
        <!-- Navbar with menu slots -->
        <Navbar :user="user" :full-width="true" :logo-text="navbarLogoText" @logout="handleLogout">
            <template #menus>
                <!-- View Menu (ToggleMenu) - always visible when authenticated -->
                <div v-if="isAuthenticated" class="navbar-item">
                    <ToggleMenu v-model="viewState" :placement="'left'" :header="'Ansicht'" :button-text="'Ansicht'"
                        :toggle-options="viewOptions" @update:model-value="handleViewChange" />
                </div>

                <!-- Admin Menu - visible for admin users only -->
                <div v-if="isAuthenticated && user?.activeRole === 'admin'" class="navbar-item">
                    <AdminMenu :admin-mode="adminMode" :settings-mode="settingsMode" :base-mode="baseMode"
                        :current-route="currentRoute" :is-on-dashboard="isOnDashboard" :placement="'right'"
                        :button-text="'Admin'" :username="user?.username" @close="() => { }" @set-mode="setAdminMode"
                        @toggle-settings="toggleSettingsMode" @toggle-base-mode="toggleBaseMode"
                        @action="handleAdminAction" @logout="handleLogout">
                        <template #inverted-toggle>
                            <InvertedToggle />
                        </template>
                        <template #theme-dropdown>
                            <ThemeDropdown />
                        </template>
                    </AdminMenu>
                </div>
            </template>
        </Navbar>

        <div class="dashboard-content">
            <!-- Overview and Stats -->
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
                    <!-- Kanban Section -->
                    <div class="kanban-section">
                        <!-- Admin Filter Bar (hidden in base mode) -->
                        <div v-if="user?.role === 'admin' && !baseMode" class="admin-filters-container">
                            <div class="admin-filters-left">
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
                            <div v-if="viewSettings.showStats" class="admin-filters-stats">
                                <div class="stat-card-mini stat-total">
                                    <div class="stat-value-mini">{{ stats.total }}</div>
                                    <div class="stat-label-mini">Gesamt</div>
                                </div>
                                <div class="stat-card-mini stat-idea">
                                    <div class="stat-value-mini">{{ stats.idea }}</div>
                                    <div class="stat-label-mini">Ideen</div>
                                </div>
                                <div class="stat-card-mini stat-draft">
                                    <div class="stat-value-mini">{{ stats.draft }}</div>
                                    <div class="stat-label-mini">Entwürfe</div>
                                </div>
                                <div class="stat-card-mini stat-final">
                                    <div class="stat-value-mini">{{ stats.final }}</div>
                                    <div class="stat-label-mini">Fertig</div>
                                </div>
                                <div class="stat-card-mini stat-reopen">
                                    <div class="stat-value-mini">{{ stats.reopen }}</div>
                                    <div class="stat-label-mini">Reopen</div>
                                </div>
                            </div>
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
                                    @click="viewSettings.showNew = !viewSettings.showNew"
                                    title="Neu Spalte ein/ausblenden">
                                    {{ viewSettings.showNew ? '👁' : '👁‍🗨' }} Neu
                                </button>
                                <button :class="['toggle-btn', { active: viewSettings.showTrash }]"
                                    @click="viewSettings.showTrash = !viewSettings.showTrash"
                                    title="Papierkorb Spalte ein/ausblenden">
                                    {{ viewSettings.showTrash ? '👁' : '👁‍🗨' }} Papierkorb
                                </button>
                            </div>
                        </div>

                        <!-- Tasks Board (4 Main Columns + Optional) -->
                        <div v-if="!loading && !error" class="tasks-board">
                            <!-- Idea Column (status_value = 1) -->
                            <div class="task-column column-idea" @dragover.prevent @drop="handleDrop($event, STATUS_VALUE.IDEA)">
                                <h3 class="column-title">
                                    <span class="column-icon">💡</span>
                                    <div class="column-title-text">
                                        <strong>{{ getStatusDisplayName(STATUS_VALUE.IDEA, 'tasks', currentLang) }}</strong>
                                        <div class="column-subtitle" v-if="getMatchingStatusesForOtherTables(STATUS_VALUE.IDEA, currentLang).length > 0">
                                            <span v-for="(match, idx) in getMatchingStatusesForOtherTables(STATUS_VALUE.IDEA, currentLang)" :key="idx">
                                                {{ match.text }}<template v-if="idx < getMatchingStatusesForOtherTables(STATUS_VALUE.IDEA, currentLang).length - 1">, </template>
                                            </span>
                                        </div>
                                    </div>
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

                            <!-- New Column (status_value = 0) -->
                            <div v-if="viewSettings.showNew" class="task-column column-new" @dragover.prevent @drop="handleDrop($event, STATUS_VALUE.NEW)">
                                <h3 class="column-title">
                                    <span class="column-icon">📋</span>
                                    <div class="column-title-text">
                                        <strong>{{ getStatusDisplayName(STATUS_VALUE.NEW, 'tasks', currentLang) }}</strong>
                                        <div class="column-subtitle" v-if="getMatchingStatusesForOtherTables(STATUS_VALUE.NEW, currentLang).length > 0">
                                            <span v-for="(match, idx) in getMatchingStatusesForOtherTables(STATUS_VALUE.NEW, currentLang)" :key="idx">
                                                {{ match.text }}<template v-if="idx < getMatchingStatusesForOtherTables(STATUS_VALUE.NEW, currentLang).length - 1">, </template>
                                            </span>
                                        </div>
                                    </div>
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

                            <!-- Draft Column (status_value = 2) -->
                            <div class="task-column column-draft" @dragover.prevent @drop="handleDrop($event, STATUS_VALUE.DRAFT)">
                                <h3 class="column-title">
                                    <span class="column-icon">⚡</span>
                                    <div class="column-title-text">
                                        <strong>{{ getStatusDisplayName(STATUS_VALUE.DRAFT, 'tasks', currentLang) }}</strong>
                                        <div class="column-subtitle" v-if="getMatchingStatusesForOtherTables(STATUS_VALUE.DRAFT, currentLang).length > 0">
                                            <span v-for="(match, idx) in getMatchingStatusesForOtherTables(STATUS_VALUE.DRAFT, currentLang)" :key="idx">
                                                {{ match.text }}<template v-if="idx < getMatchingStatusesForOtherTables(STATUS_VALUE.DRAFT, currentLang).length - 1">, </template>
                                            </span>
                                        </div>
                                    </div>
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

                            <!-- Final Column (status_value = 5) -->
                            <div class="task-column column-final" @dragover.prevent @drop="handleDrop($event, STATUS_VALUE.FINAL)">
                                <h3 class="column-title">
                                    <span class="column-icon">✓</span>
                                    <div class="column-title-text">
                                        <strong>{{ getStatusDisplayName(STATUS_VALUE.FINAL, 'tasks', currentLang) }}</strong>
                                        <div class="column-subtitle" v-if="getMatchingStatusesForOtherTables(STATUS_VALUE.FINAL, currentLang).length > 0">
                                            <span v-for="(match, idx) in getMatchingStatusesForOtherTables(STATUS_VALUE.FINAL, currentLang)" :key="idx">
                                                {{ match.text }}<template v-if="idx < getMatchingStatusesForOtherTables(STATUS_VALUE.FINAL, currentLang).length - 1">, </template>
                                            </span>
                                        </div>
                                    </div>
                                    <span class="column-count">{{ finalTasks.length }}</span>
                                </h3>
                                <div class="task-list">
                                    <TaskCard v-for="task in finalTasks" :key="task.id" :task="task" @edit="editTask"
                                        @delete="deleteTask" @drag-start="handleDragStart" />
                                    <div v-if="finalTasks.length === 0" class="empty-column">
                                        Keine Aufgaben
                                    </div>
                                </div>
                            </div>

                            <!-- Reopen Column (status_value = 8) -->
                            <div class="task-column column-reopen" @dragover.prevent
                                @drop="handleDrop($event, STATUS_VALUE.REOPEN)">
                                <h3 class="column-title">
                                    <span class="column-icon">🔄</span>
                                    <div class="column-title-text">
                                        <strong>{{ getStatusDisplayName(STATUS_VALUE.REOPEN, 'tasks', currentLang) }}</strong>
                                        <div class="column-subtitle" v-if="getMatchingStatusesForOtherTables(STATUS_VALUE.REOPEN, currentLang).length > 0">
                                            <span v-for="(match, idx) in getMatchingStatusesForOtherTables(STATUS_VALUE.REOPEN, currentLang)" :key="idx">
                                                {{ match.text }}<template v-if="idx < getMatchingStatusesForOtherTables(STATUS_VALUE.REOPEN, currentLang).length - 1">, </template>
                                            </span>
                                        </div>
                                    </div>
                                    <span class="column-count">{{ reopenTasks.length }}</span>
                                </h3>
                                <div class="task-list">
                                    <TaskCard v-for="task in reopenTasks" :key="task.id" :task="task" @edit="editTask"
                                        @delete="deleteTask" @drag-start="handleDragStart" />
                                    <div v-if="reopenTasks.length === 0" class="empty-column">
                                        Keine Aufgaben
                                    </div>
                                </div>
                            </div>

                            <!-- Trash Column (optional) (status_value = 16) -->
                            <div v-if="viewSettings.showTrash" class="task-column column-trash" @dragover.prevent
                                @drop="handleDrop($event, STATUS_VALUE.TRASH)">
                                <h3 class="column-title">
                                    <span class="column-icon">🗑</span>
                                    <div class="column-title-text">
                                        <strong>{{ getStatusDisplayName(STATUS_VALUE.TRASH, 'tasks', currentLang) }}</strong>
                                        <div class="column-subtitle" v-if="getMatchingStatusesForOtherTables(STATUS_VALUE.TRASH, currentLang).length > 0">
                                            <span v-for="(match, idx) in getMatchingStatusesForOtherTables(STATUS_VALUE.TRASH, currentLang)" :key="idx">
                                                {{ match.text }}<template v-if="idx < getMatchingStatusesForOtherTables(STATUS_VALUE.TRASH, currentLang).length - 1">, </template>
                                            </span>
                                        </div>
                                    </div>
                                    <span class="column-count">{{ trashTasks.length }}</span>
                                </h3>
                                <div class="task-list">
                                    <!-- Regular tasks -->
                                    <TaskCard v-for="task in trashTasks" :key="task.id" :task="task" @edit="editTask"
                                        @delete="deleteTask" @drag-start="handleDragStart" />

                                    <!-- Trashed watch tasks -->
                                    <AdminTaskCard v-for="task in watchTasks.filter((t: any) => t.status_value === STATUS_VALUE.TRASH)"
                                        :key="task.id" :task="task" @restore="restoreWatchTask" />

                                    <div v-if="trashTasks.length === 0 && watchTasks.filter((t: any) => t.status_value === STATUS_VALUE.TRASH).length === 0"
                                        class="empty-column">
                                        No tasks
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div><!-- End Kanban Section -->

                    <!-- Admin Sections (hidden in base mode) -->
                    <div v-if="user?.activeRole === 'admin' && !baseMode">
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
                            <!-- Admin Actions Section -->
                            <div class="admin-actions-section">
                                <AdminActionsShowcase />
                            </div>

                            <!-- Watch Tasks Section -->
                            <div v-if="watchTasks.length > 0" class="watch-tasks-section">
                                <h3 class="section-title">Watch Tasks</h3>
                                <div class="watch-tasks-grid">
                                    <AdminTaskCard v-for="task in watchTasks.filter((t: any) => t.status !== 'trash')"
                                        :key="task.id" :task="task" @execute="executeWatchTask" @trash="trashWatchTask"
                                        @restore="restoreWatchTask" />
                                </div>
                            </div>

                            <!-- Regular Admin Tasks -->
                            <AdminTasksList :tasks="regularAdminTasks" :loading="adminTasksLoading"
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
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, onBeforeRouteLeave } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { useTheme } from '@/composables/useTheme'
import { useStatus } from '@/composables/useStatus'
import Section from '@/components/Section.vue'
import Button from '@/components/Button.vue'
import TaskCard from '@/components/TaskCard.vue'
import TaskEditModal from '@/components/TaskEditModal.vue'
import Navbar from '@/components/Navbar.vue'
import ToggleMenu from '@/components/ToggleMenu.vue'
import AdminMenu from '@/components/AdminMenu.vue'
import InvertedToggle from '@/components/InvertedToggle.vue'
import ThemeDropdown from '@/components/ThemeDropdown.vue'
import Toast from '@/components/Toast.vue'
import ProjectsTable from '@/components/ProjectsTable.vue'
import AdminTasksList from '@/components/AdminTasksList.vue'
import AdminTaskCard from '@/components/AdminTaskCard.vue'
import ProjectModal from '@/components/ProjectModal.vue'
import ReleasesTable from '@/components/ReleasesTable.vue'
import ReleaseModal from '@/components/ReleaseModal.vue'
import AdminActionsShowcase from '@/components/AdminActionsShowcase.vue'

interface Task {
    id: string
    name: string  // Renamed from title (Migration 019)
    title?: string  // Keep for backward compatibility
    description?: string
    category: 'admin' | 'main' | 'release'
    status_id: number  // INTEGER FK to status table (Migration 019)
    status_value: number  // Status byte value (0, 1, 2, 4, 5, 8, 16)
    status_name: string  // Status name from status table
    status_display: string  // Translated status name based on lang
    status?: string  // Keep for backward compatibility
    lang: string  // Language (de, en, cz)
    priority: 'low' | 'medium' | 'high' | 'urgent'
    release_id?: string
    record_type?: string
    record_id?: string
    assigned_to?: string
    cimg?: string  // Renamed from image (Migration 019)
    image?: string  // Keep for backward compatibility
    prompt?: string
    logic?: string
    filter?: string
    updatedFiles?: string[]
    updatedEntities?: string[]
    lastChecked?: string
    due_date?: string
    completed_at?: string
    created_at: string
    updated_at: string
    entity_name?: string
    display_title?: string
    entity_image?: string
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
const { 
    status4Lang, 
    getStatusDisplayName, 
    getMatchingStatusesForOtherTables,
    getDefaultLanguage,
    initializeCache 
} = useStatus()

const tasks = ref<Task[]>([])
const releases = ref<Release[]>([])
const showTaskModal = ref(false)
const currentTask = ref<Task | null>(null)
const loading = ref(false)
const error = ref('')
const draggedTask = ref<Task | null>(null)

// Language detection based on user role
const currentLang = computed(() => {
    return getDefaultLanguage(user.value?.activeRole)
})

// View state
const viewState = ref('only-main') // 'only-release' | 'only-main' | 'all-tasks'

// Admin state (global, persisted across routes)
const adminMode = ref<'base-release' | 'version-release'>('base-release')
const settingsMode = ref(false)
const baseMode = ref(false) // When true, admin sees base user view
const currentRoute = computed(() => router.currentRoute.value.path)

// Check if on dashboard routes (/ or /tasks)
const isOnDashboard = computed(() => {
    const path = currentRoute.value
    return path === '/' || path === '/tasks'
})

// Navbar logo text
const navbarLogoText = computed(() => {
    if (user.value?.activeRole === 'admin') {
        return '📋 Task Manager (Admin)'
    }
    return '📋 Task Manager'
})

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
const watchTasks = ref<any[]>([])
const regularAdminTasks = ref<Task[]>([])

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
    if (user.value?.activeRole === 'admin') {
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

// Status value constants (from status table)
const STATUS_VALUE = {
    NEW: 0,
    IDEA: 1,
    DRAFT: 2,
    ACTIVE: 4,
    FINAL: 5,
    REOPEN: 8,
    TRASH: 16
} as const

// Computed: Statistics
const stats = computed(() => {
    const filtered = filteredTasks.value
    return {
        total: filtered.length,
        idea: filtered.filter((t: Task) => t.status_value === STATUS_VALUE.IDEA).length,
        draft: filtered.filter((t: Task) => t.status_value === STATUS_VALUE.DRAFT).length,
        final: filtered.filter((t: Task) => t.status_value === STATUS_VALUE.FINAL).length,
        reopen: filtered.filter((t: Task) => t.status_value === STATUS_VALUE.REOPEN).length
    }
})

// Computed: Tasks by status value
const ideaTasks = computed(() =>
    filteredTasks.value.filter((t: Task) => t.status_value === STATUS_VALUE.IDEA)
)
const newTasks = computed(() =>
    filteredTasks.value.filter((t: Task) => t.status_value === STATUS_VALUE.NEW)
)
const draftTasks = computed(() =>
    filteredTasks.value.filter((t: Task) => t.status_value === STATUS_VALUE.DRAFT)
)
const finalTasks = computed(() =>
    filteredTasks.value.filter((t: Task) => t.status_value === STATUS_VALUE.FINAL)
)
const reopenTasks = computed(() =>
    filteredTasks.value.filter((t: Task) => t.status_value === STATUS_VALUE.REOPEN)
)
const trashTasks = computed(() =>
    filteredTasks.value.filter((t: Task) => t.status_value === STATUS_VALUE.TRASH)
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
    const taskTitle = task.display_title || task.name || task.title || 'this task'
    if (!confirm(`Are you sure you want to delete "${taskTitle}"?`)) {
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

// Update task status (for drag-and-drop) - now uses status_value
async function updateTaskStatus(taskId: string, newStatusValue: number) {
    try {
        const response = await fetch(`/api/tasks/${taskId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status_value: newStatusValue })
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

function handleDrop(event: DragEvent, newStatusValue: number) {
    event.preventDefault()

    if (draggedTask.value && draggedTask.value.status_value !== newStatusValue) {
        updateTaskStatus(draggedTask.value.id, newStatusValue)
    }

    draggedTask.value = null
}

// View change handler
function handleViewChange(newState: string) {
    viewState.value = newState
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
        // Settings mode ON: Lock navigation to dashboard routes (/ or /tasks)
        if (!isOnDashboard.value) {
            router.push('/tasks')
        }
        showToastNotification('Einstellungsmodus aktiviert - Navigation gesperrt, CRUD sichtbar', 'info')
    } else {
        showToastNotification('Einstellungsmodus deaktiviert - Navigation frei, Admin-Tasks sichtbar', 'info')
    }
}

function toggleBaseMode() {
    baseMode.value = !baseMode.value

    if (baseMode.value) {
        // Entering Base Mode
        // Turn off settings mode if it's on
        if (settingsMode.value) {
            settingsMode.value = false
        }

        // Reset to default base user state
        viewState.value = 'only-main'
        adminFilters.value.showProject = false
        adminFilters.value.showBase = true
        // Don't touch showAdmin

        showToastNotification('👤 Basis-Modus aktiviert - Ansicht als Basis-Benutzer', 'info')
    } else {
        // Exiting Base Mode - return to default admin state
        adminMode.value = 'base-release'
        settingsMode.value = false
        viewState.value = 'only-main'
        adminFilters.value.showProject = false
        adminFilters.value.showBase = true
        adminFilters.value.showAdmin = true

        showToastNotification('👑 Admin-Modus wiederhergestellt - Volle Kontrolle', 'info')
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
    if (user.value?.activeRole !== 'admin') return
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
    if (user.value?.activeRole !== 'admin') return
    adminTasksLoading.value = true
    try {
        const response = await fetch('/api/tasks?category=admin')
        if (response.ok) {
            const data = await response.json()
            adminTasks.value = data.tasks || []
            // Separate watch tasks from regular admin tasks
            watchTasks.value = adminTasks.value.filter((t: any) => t.logic)
            regularAdminTasks.value = adminTasks.value.filter((t: any) => !t.logic)
        }
    } catch (err) {
        console.error('Failed to load admin tasks:', err)
    } finally {
        adminTasksLoading.value = false
    }
}

// Check watch tasks for updates
async function checkWatchTasks() {
    if (user.value?.activeRole !== 'admin' || watchTasks.value.length === 0) return

    try {
        // Check CSV watch
        const csvResponse = await fetch('/api/admin/watch/csv/base')
        if (csvResponse.ok) {
            const csvData = await csvResponse.json()

            // Update CSV watch tasks
            for (const task of watchTasks.value) {
                if (task.logic === 'watchcsv_base' && task.status !== 'trash') {
                    if (csvData.hasUpdates) {
                        task.status = 'draft'
                        task.updatedFiles = csvData.updatedFiles
                        task.lastChecked = csvData.currentCheck
                    } else {
                        task.status = 'reopen'
                        task.updatedFiles = []
                        task.lastChecked = csvData.currentCheck
                    }
                }
            }
        }

        // Check DB watch
        const dbResponse = await fetch('/api/admin/watch/db/base')
        if (dbResponse.ok) {
            const dbData = await dbResponse.json()

            // Update DB watch tasks
            for (const task of watchTasks.value) {
                if (task.logic === 'watchdb_base' && task.status !== 'trash') {
                    if (dbData.hasUpdates) {
                        task.status = 'draft'
                        task.updatedEntities = dbData.updatedEntities
                        task.lastChecked = dbData.currentCheck
                    } else {
                        task.status = 'reopen'
                        task.updatedEntities = []
                        task.lastChecked = dbData.currentCheck
                    }
                }
            }
        }

        console.log('✅ Watch tasks checked:', watchTasks.value)
    } catch (error) {
        console.error('❌ Failed to check watch tasks:', error)
    }
}

// Execute watch task
async function executeWatchTask(task: any, filter: string) {
    try {
        const response = await fetch('/api/admin/watch/execute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                taskId: task.id,
                logic: task.logic,
                filter
            })
        })

        if (response.ok) {
            const data = await response.json()

            // Check if conflict resolution is required
            if (data.requiresConflictResolution && data.conflicts) {
                await handleWatchTaskConflict(task, filter, data.conflicts)
                return
            }

            showToastNotification(data.toastMessage, data.toastType || 'info')

            // Refresh tasks
            await loadAdminTasks()
            await checkWatchTasks()
        } else {
            showToastNotification('Failed to execute watch task', 'error')
        }
    } catch (error) {
        console.error('❌ Execute watch task error:', error)
        showToastNotification('Failed to execute watch task', 'error')
    }
}

// Handle conflict resolution for watch task
async function handleWatchTaskConflict(task: any, filter: string, conflicts: string[]) {
    // For each conflicting entity, show a dialog
    for (const entity of conflicts) {
        const action = await showConflictDialog(entity)

        if (action === 'cancel') {
            showToastNotification(`Cancelled operation for ${entity}`, 'info')
            continue
        }

        // Execute with conflict resolution
        try {
            const response = await fetch('/api/admin/watch/execute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    taskId: task.id,
                    logic: task.logic,
                    filter: entity,  // Process only this entity
                    conflictResolution: action,
                    conflictEntity: entity
                })
            })

            if (response.ok) {
                const data = await response.json()
                showToastNotification(data.toastMessage, data.toastType || 'info')
            } else {
                showToastNotification(`Failed to resolve conflict for ${entity}`, 'error')
            }
        } catch (error) {
            console.error(`❌ Conflict resolution error for ${entity}:`, error)
            showToastNotification(`Failed to resolve conflict for ${entity}`, 'error')
        }
    }

    // Refresh tasks after all conflicts resolved
    await loadAdminTasks()
    await checkWatchTasks()
}

// Show conflict dialog and return user choice
function showConflictDialog(entity: string): Promise<'cancel' | 'overwrite_csv' | 'reset_db'> {
    return new Promise((resolve) => {
        const message = `Conflict detected for ${entity}:\n\nBoth CSV file and database have been modified.\n\nWhat would you like to do?`

        // Use browser's confirm/prompt for now - could be replaced with a custom modal
        const userChoice = window.confirm(
            `${message}\n\n` +
            `Click OK to choose between:\n` +
            `1. Overwrite CSV (use database version)\n` +
            `2. Reset Database (use CSV version)\n` +
            `Click Cancel to skip this entity.`
        )

        if (!userChoice) {
            resolve('cancel')
            return
        }

        // Ask user which action to take
        const action = window.prompt(
            `Choose action for ${entity}:\n\n` +
            `Type 'csv' to use CSV version (reset database)\n` +
            `Type 'db' to use database version (overwrite CSV)\n` +
            `Or click Cancel to skip`
        )?.toLowerCase().trim()

        if (action === 'csv') {
            resolve('reset_db')
        } else if (action === 'db') {
            resolve('overwrite_csv')
        } else {
            resolve('cancel')
        }
    })
}

// Trash/restore watch task
async function trashWatchTask(task: any) {
    try {
        const response = await fetch(`/api/tasks/${task.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...task, status: 'trash' })
        })

        if (response.ok) {
            showToastNotification('Watch task moved to trash', 'info')
            await loadAdminTasks()
            await checkWatchTasks()
        }
    } catch (error) {
        console.error('❌ Trash watch task error:', error)
        showToastNotification('Failed to trash watch task', 'error')
    }
}

async function restoreWatchTask(task: any) {
    try {
        const response = await fetch(`/api/tasks/${task.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...task, status: 'reopen' })
        })

        if (response.ok) {
            showToastNotification('Watch task restored', 'success')
            await loadAdminTasks()
            await checkWatchTasks()
        }
    } catch (error) {
        console.error('❌ Restore watch task error:', error)
        showToastNotification('Failed to restore watch task', 'error')
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

// Initialize theme system
const { init: initTheme } = useTheme()

// Load data on mount
onMounted(async () => {
    // Initialize theme system (loads available themes, doesn't set any by default)
    await initTheme()

    // Initialize status cache
    await initializeCache()

    await checkSession()
    if (isAuthenticated.value) {
        await Promise.all([
            loadTasks(),
            loadReleases(),
            loadProjects(),
            loadAdminTasks()
        ])
        // Check watch tasks after admin tasks are loaded
        await checkWatchTasks()
    }
})
</script>

<style scoped>
/* Dashboard Wrapper */
.dashboard-wrapper {
    min-height: 100vh;
    background: var(--color-bg);
    color: var(--color-contrast);
}

/* Dashboard Content - Full Width with Padding */
.dashboard-content {
    width: 100%;
    padding-left: 2rem;
    padding-right: 2rem;
}

@media (max-width: 768px) {
    .dashboard-content {
        padding-left: 1rem;
        padding-right: 1rem;
    }
}

/* Admin Filters */
.admin-filters-container {
    display: flex;
    gap: 2rem;
    padding: 1.5rem;
    background: var(--color-secondary-bg);
    border-radius: var(--radius-button);
    margin-bottom: 2rem;
    align-items: flex-start;
    border: 1px solid var(--color-secondary-contrast);
}

.admin-filters-left {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    flex: 0 0 auto;
}

.admin-filters-stats {
    display: flex;
    flex-direction: row;
    gap: 0.75rem;
    margin-left: auto;
    flex: 0 0 auto;
}

.filter-checkbox {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    font-size: 0.9375rem;
    color: var(--color-secondary-contrast);
    user-select: none;
}

.filter-checkbox input[type="checkbox"] {
    width: 1.125rem;
    height: 1.125rem;
    cursor: pointer;
}

/* Mini Stats Cards */
.stat-card-mini {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    background: var(--color-card-bg);
    border-radius: var(--radius-button);
    border: 2px solid var(--color-border);
    transition: all 0.2s ease;
    min-width: 120px;
}

.stat-card-mini:hover {
    transform: translateX(-2px);
    box-shadow: 0 2px 8px oklch(0% 0 0 / 0.2);
    background: var(--color-accent-bg);
    border-color: var(--color-accent-contrast);
}

.stat-value-mini {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--color-card-contrast);
    line-height: 1;
    min-width: 2.5rem;
    text-align: center;
}

.stat-label-mini {
    font-size: 0.8125rem;
    color: var(--color-dimmed);
    font-weight: 500;
}

@media (max-width: 968px) {
    .admin-filters-container {
        flex-direction: column;
    }

    .admin-filters-stats {
        margin-left: 0;
        width: 100%;
    }

    .stat-card-mini {
        width: 100%;
    }
}

@media (max-width: 768px) {
    .admin-filters-stats {
        display: none;
    }
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
    background: var(--color-secondary-bg);
    border: 1px solid var(--color-secondary-contrast);
    border-radius: var(--radius-button);
    color: var(--color-secondary-contrast);
    font-family: var(--font);
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
}

.toggle-btn:hover {
    background: var(--color-accent-bg);
    border-color: var(--color-accent-contrast);
    color: var(--color-accent-contrast);
}

.toggle-btn.active {
    background: var(--color-accent-bg);
    border-color: var(--color-accent-contrast);
    color: var(--color-accent-contrast);
}

/* Stats Grid */
.stats-grid {
    display: grid;
    background: var(--color-muted-bg);
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1.5rem;
    margin: 2rem 0 3rem;
    padding: 1rem;
    border-radius: var(--radius-button);
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
    box-shadow: 0 4px 12px oklch(0% 0 0 / 0.2);
    background: var(--color-accent-bg);
    border-color: var(--color-accent-contrast);
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
    color: var(--color-card-contrast);
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
    background: var(--color-secondary-bg);
    border-radius: var(--radius-button);
    align-items: flex-end;
    flex-wrap: wrap;
    border: 1px solid var(--color-secondary-contrast);
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
    color: var(--color-secondary-contrast);
}

.filter-select {
    padding: 0.75rem 1rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-button);
    background: var(--color-card-bg);
    color: var(--color-card-contrast);
    font-family: var(--font);
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.2s ease;
}

.filter-select:hover {
    border-color: var(--color-accent-contrast);
    background: var(--color-accent-bg);
    color: var(--color-accent-contrast);
}

.filter-select:focus {
    outline: none;
    border-color: var(--color-accent-contrast);
    box-shadow: 0 0 0 3px var(--color-accent-variant);
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
    background: var(--color-secondary-bg);
    border-radius: var(--radius-button);
    margin: 2rem 0;
    color: var(--color-secondary-contrast);
}

.error-state p {
    color: var(--color-negative-contrast);
    margin-bottom: 1rem;
}

/* Tasks Board */
.tasks-board {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1.5rem;
    margin: 2rem 0;
}

@media (max-width: 1400px) {
    .tasks-board {
        grid-template-columns: repeat(2, 1fr);
    }
}

@media (max-width: 768px) {
    .tasks-board {
        grid-template-columns: 1fr;
    }
}

.task-column {
    background: var(--color-accent-variant);
    border-radius: var(--radius-button);
    padding: 1rem;
    display: flex;
    flex-direction: column;
    transition: all 0.2s ease;
    max-height: calc(100vh - 280px);
    overflow: hidden;
    border: 2px solid var(--color-accent-contrast);
}

.task-column:hover {
    background: var(--color-accent-bg);
    border-color: var(--color-accent-contrast);
}

.column-title {
    font-size: 1.125rem;
    font-weight: 700;
    margin: 0 0 1rem;
    padding-bottom: 1rem;
    border-bottom: 2px solid var(--color-accent-contrast);
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--color-accent-contrast);
}

.column-icon {
    font-size: 1.25rem;
}

.column-title-text {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    flex: 1;
}

.column-title-text strong {
    font-size: 1.125rem;
    line-height: 1.2;
}

.column-subtitle {
    font-size: 0.75rem;
    font-weight: 400;
    color: var(--color-dimmed);
    line-height: 1.3;
}

.column-count {
    margin-left: auto;
    font-size: 0.875rem;
    font-weight: 600;
    padding: 0.25rem 0.75rem;
    background: var(--color-card-bg);
    border-radius: 999px;
    color: var(--color-card-contrast);
    border: 1px solid var(--color-border);
}

.column-todo .column-title {
    color: var(--color-accent-contrast);
}

.column-in-progress .column-title {
    color: var(--color-accent-contrast);
}

.column-done .column-title {
    color: var(--color-positive-contrast);
}

.column-reopen .column-title {
    color: var(--color-warning-contrast);
}

.task-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    flex: 1;
    overflow-y: auto;
    padding-right: 0.5rem;
}

.task-list::-webkit-scrollbar {
    width: 20px;
}

.task-list::-webkit-scrollbar-track {
    background: transparent;
    margin-left: -10px;
}

.task-list::-webkit-scrollbar-thumb {
    background: var(--color-accent-contrast);
    border-radius: 4px;
    border-left: 12px solid transparent;
    background-clip: padding-box;
}

.task-list::-webkit-scrollbar-thumb:hover {
    background: var(--color-contrast);
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
    background: var(--color-secondary-bg);
    border-radius: 12px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
    text-align: center;
    border: 2px solid var(--color-secondary-contrast);
}

.auth-card h2 {
    font-size: 1.75rem;
    font-weight: 700;
    color: var(--color-secondary-contrast);
    margin-bottom: 1rem;
}

.auth-card p {
    font-size: 1.125rem;
    color: var(--color-secondary-contrast);
    margin-bottom: 2rem;
    opacity: 0.9;
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

/* Section Styling */
.overview-section {
    background: var(--color-muted-bg);
    padding: 2rem;
    border-radius: var(--radius-button);
    margin-bottom: 2rem;
}

.kanban-section {
    padding: 0 2rem;
}

/* Watch Tasks Section */
.watch-tasks-section {
    margin-bottom: 2rem;
}

.watch-tasks-section .section-title {
    font-size: 1.5rem;
    font-weight: 600;
    margin-bottom: 1rem;
    color: var(--color-contrast);
}

.watch-tasks-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 1rem;
}

@media (max-width: 768px) {
    .overview-section {
        padding: 1rem;
    }

    .kanban-section {
        padding: 0 1rem;
    }

    .watch-tasks-grid {
        grid-template-columns: 1fr;
    }
}
</style>
