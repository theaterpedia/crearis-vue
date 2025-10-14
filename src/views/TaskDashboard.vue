<template>
    <Container>
        <Section>
            <Heading headline="Task Management Dashboard" />

            <!-- Not Authenticated State -->
            <div v-if="!isAuthenticated" class="auth-prompt">
                <div class="auth-card">
                    <h2>🔒 Authentication Required</h2>
                    <p>Please log in to access the Task Management Dashboard.</p>
                    <Button @click="goToLogin" class="login-btn">Go to Login</Button>
                </div>
            </div>

            <!-- Authenticated Content -->
            <div v-else>
                <!-- User Info -->
                <div class="user-info">
                    <span>Logged in as: <strong>{{ user?.username }}</strong> ({{ user?.role }})</span>
                    <Button @click="handleLogout" class="logout-btn-header">Logout</Button>
                </div>

                <!-- Stats Cards -->
                <div class="stats-grid">
                    <div class="stat-card stat-total">
                        <div class="stat-value">{{ stats.total }}</div>
                        <div class="stat-label">Total Tasks</div>
                    </div>
                    <div class="stat-card stat-idea">
                        <div class="stat-value">{{ stats.idea }}</div>
                        <div class="stat-label">Idea</div>
                    </div>
                    <div class="stat-card stat-new">
                        <div class="stat-value">{{ stats.new }}</div>
                        <div class="stat-label">New</div>
                    </div>
                    <div class="stat-card stat-draft">
                        <div class="stat-value">{{ stats.draft }}</div>
                        <div class="stat-label">Draft</div>
                    </div>
                    <div class="stat-card stat-final">
                        <div class="stat-value">{{ stats.final }}</div>
                        <div class="stat-label">Final</div>
                    </div>
                </div>

                <!-- Filter Bar -->
                <div class="filter-bar">
                    <div class="filter-group">
                        <label for="category-filter" class="filter-label">Category:</label>
                        <select id="category-filter" v-model="filterCategory" class="filter-select">
                            <option value="">All Categories</option>
                            <option value="admin">Admin</option>
                            <option value="main">Main</option>
                            <option value="release">Release</option>
                        </select>
                    </div>

                    <div class="filter-group">
                        <label for="status-filter" class="filter-label">Status:</label>
                        <select id="status-filter" v-model="filterStatus" class="filter-select">
                            <option value="">All Statuses</option>
                            <option value="idea">Idea</option>
                            <option value="new">New</option>
                            <option value="draft">Draft</option>
                            <option value="final">Final</option>
                            <option value="reopen">Reopen</option>
                            <option value="trash">Trash</option>
                        </select>
                    </div>

                    <div class="filter-group">
                        <label for="release-filter" class="filter-label">Release:</label>
                        <select id="release-filter" v-model="filterRelease" class="filter-select">
                            <option value="">All Releases</option>
                            <option v-for="release in releases" :key="release.id" :value="release.id">
                                {{ release.version }} - {{ release.state }}
                            </option>
                        </select>
                    </div>

                    <div class="filter-group">
                        <label for="type-filter" class="filter-label">Entity Type:</label>
                        <select id="type-filter" v-model="filterType" class="filter-select">
                            <option value="">All Types</option>
                            <option value="event">Events</option>
                            <option value="post">Posts</option>
                            <option value="location">Locations</option>
                            <option value="instructor">Instructors</option>
                            <option value="participant">Participants</option>
                        </select>
                    </div>

                    <Button @click="openNewTaskModal" class="new-task-btn">
                        + New Task
                    </Button>
                </div>

                <!-- Loading State -->
                <div v-if="loading" class="loading-state">
                    <p>Loading tasks...</p>
                </div>

                <!-- Error State -->
                <div v-else-if="error" class="error-state">
                    <p>{{ error }}</p>
                    <Button @click="loadTasks">Retry</Button>
                </div>

                <!-- Tasks Board -->
                <div v-else class="tasks-board">
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

                    <!-- Final Column -->
                    <div class="task-column column-final" @dragover.prevent @drop="handleDrop($event, 'final')">
                        <h3 class="column-title">
                            <span class="column-icon">✓</span>
                            Final
                            <span class="column-count">{{ finalTasks.length }}</span>
                        </h3>
                        <div class="task-list">
                            <TaskCard v-for="task in finalTasks" :key="task.id" :task="task" @edit="editTask"
                                @delete="deleteTask" @drag-start="handleDragStart" />
                            <div v-if="finalTasks.length === 0" class="empty-column">
                                No tasks in this column
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Quick Links Section -->
                <div class="quick-links-section">
                    <h2 class="section-subtitle">Quick Links</h2>
                    <div class="quick-links">
                        <Button @click="$router.push('/demo')" variant="plain">
                            View Demo Data
                        </Button>
                        <Button @click="$router.push('/heroes')" variant="plain">
                            Manage Heroes
                        </Button>
                        <Button @click="clearCompletedTasks" variant="plain" :disabled="finalTasks.length === 0">
                            Clear Completed ({{ finalTasks.length }})
                        </Button>
                    </div>
                </div>
            </div>
            <!-- End of authenticated content -->
        </Section>

        <!-- Task Edit Modal (placeholder - will be created separately) -->
        <TaskEditModal v-if="showTaskModal" :is-open="showTaskModal" :task="currentTask" @close="closeTaskModal"
            @save="saveTask" />
    </Container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import Container from '@/components/Container.vue'
import Section from '@/components/Section.vue'
import Heading from '@/components/Heading.vue'
import Button from '@/components/Button.vue'
import TaskCard from '@/components/TaskCard.vue'
import TaskEditModal from '@/components/TaskEditModal.vue'

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
const filterStatus = ref('')
const filterCategory = ref('')
const filterRelease = ref('')
const filterType = ref('')
const showTaskModal = ref(false)
const currentTask = ref<Task | null>(null)
const loading = ref(false)
const error = ref('')
const draggedTask = ref<Task | null>(null)

// Navigate to login
const goToLogin = () => {
    router.push('/login')
}

// Handle logout
const handleLogout = async () => {
    await logout()
}

// Computed: Statistics
const stats = computed(() => ({
    total: tasks.value.length,
    idea: tasks.value.filter((t: Task) => t.status === 'idea').length,
    new: tasks.value.filter((t: Task) => t.status === 'new').length,
    draft: tasks.value.filter((t: Task) => t.status === 'draft').length,
    final: tasks.value.filter((t: Task) => t.status === 'final').length,
    reopen: tasks.value.filter((t: Task) => t.status === 'reopen').length,
    trash: tasks.value.filter((t: Task) => t.status === 'trash').length
}))

// Computed: Filtered tasks
const filteredTasks = computed(() => {
    return tasks.value.filter((task: Task) => {
        if (filterStatus.value && task.status !== filterStatus.value) return false
        if (filterCategory.value && task.category !== filterCategory.value) return false
        if (filterRelease.value && task.release_id !== filterRelease.value) return false
        if (filterType.value && task.record_type !== filterType.value) return false
        return true
    })
})

// Computed: Tasks by status (new status values)
const ideaTasks = computed(() =>
    filteredTasks.value.filter((t: Task) => t.status === 'idea')
)
const newTasks = computed(() =>
    filteredTasks.value.filter((t: Task) => t.status === 'new')
)
const draftTasks = computed(() =>
    filteredTasks.value.filter((t: Task) => t.status === 'draft')
)
const finalTasks = computed(() =>
    filteredTasks.value.filter((t: Task) => t.status === 'final')
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

// Clear completed tasks
async function clearCompletedTasks() {
    if (!confirm(`Delete all ${finalTasks.value.length} completed tasks?`)) {
        return
    }

    try {
        const deletePromises = finalTasks.value.map((task: Task) =>
            fetch(`/api/tasks/${task.id}`, { method: 'DELETE' })
        )

        await Promise.all(deletePromises)
        await loadTasks()
    } catch (err) {
        error.value = 'Failed to clear completed tasks'
        console.error('Error clearing tasks:', err)
    }
}

// Load releases from API
async function loadReleases() {
    try {
        const response = await fetch('/api/releases')
        if (!response.ok) {
            throw new Error('Failed to load releases')
        }
        const data = await response.json()
        releases.value = data.releases || []
    } catch (err) {
        console.error('Error loading releases:', err)
    }
}

// Load tasks and releases on mount
onMounted(async () => {
    await checkSession()
    if (isAuthenticated.value) {
        await Promise.all([loadTasks(), loadReleases()])
    }
})
</script>

<style scoped>
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
    border-color: var(--color-primary-bg);
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
</style>
