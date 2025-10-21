<script setup lang="ts">
/**
 * AdminActionsShowcase - Demonstration of all three AdminAction patterns
 * 
 * Pattern 1 (SimpleButton): addUserToProject
 * Pattern 2 (StateButton): createProjectForUser
 * Pattern 3 (CallbackLogic): createUser
 */
import { ref, computed, watch, watchEffect, onMounted } from 'vue'
import { useAdminActions } from '~/composables/useAdminActions'
import AdminAction from './AdminAction.vue'
import AdminActionUsersPanel from './AdminActionUsersPanel.vue'
import AdminActionProjectsPanel from './AdminActionProjectsPanel.vue'

const actions = useAdminActions()

// Shared state
const selectedUser = ref<string | null>(null)
const availableUsers = ref<Array<{ id: string; username: string }>>([])
const selectedAction = ref<string | null>(null)
const actionDescription = ref<string>('')

// Pattern 1: addUserToProject (SimpleButton)
const pattern1_projectId = ref<string | null>(null)
const pattern1_projects = ref<Array<{ id: string; name: string }>>([])

// Pattern 2: createProjectForUser (StateButton)
const pattern2_taskState = ref<null | boolean | number | string>(null)
const pattern2_modalOpen = ref(false)

// Pattern 3: createUser (CallbackLogic)
const pattern3_modalOpen = ref(false)
const pattern3_result = ref<string>('')

// Load users (filter out admin and base)
async function loadUsers() {
  try {
    const response = await fetch('/api/users')
    if (response.ok) {
      const data = await response.json()
      availableUsers.value = data.filter(
        (u: any) => !['admin', 'base'].includes(u.username)
      )
    }
  } catch (error) {
    console.error('Failed to load users:', error)
  }
}

// Load projects for Pattern 1 (exclude projects where user is owner/member)
async function loadProjectsForUser() {
  if (!selectedUser.value) return
  
  try {
    const response = await fetch(`/api/projects?exclude_user=${selectedUser.value}`)
    if (response.ok) {
      const data = await response.json()
      pattern1_projects.value = data
    }
  } catch (error) {
    console.error('Failed to load projects:', error)
  }
}

// Handle user selection change
watch(selectedUser, (newUser) => {
  if (newUser && selectedAction.value === 'addUserToProject') {
    loadProjectsForUser()
  }
})

// Handle action selection
function selectAction(action: string) {
  selectedAction.value = action
  
  switch (action) {
    case 'alterUser':
      actionDescription.value = 'Modify user details'
      break
    case 'createProjectForUser':
      actionDescription.value = 'Create a new project with selected user as owner'
      break
    case 'addUserToProject':
      actionDescription.value = 'Add selected user to an existing project'
      if (selectedUser.value) {
        loadProjectsForUser()
      }
      break
  }
}

function cancelAction() {
  selectedAction.value = null
  actionDescription.value = ''
  pattern1_projectId.value = null
}

// Pattern 1: SimpleButton Implementation
async function executePattern1() {
  if (!selectedUser.value || !pattern1_projectId.value) return
  
  const result = await actions.addUserToProject({
    userId: selectedUser.value,
    projectId: pattern1_projectId.value,
  })
  
  if (result.success) {
    alert('✓ User added to project successfully!')
    cancelAction()
  } else {
    alert(`✗ Failed: ${result.error}`)
  }
}

// Pattern 2: StateButton Implementation
function openPattern2Modal() {
  pattern2_modalOpen.value = true
  pattern2_taskState.value = null
}

async function handlePattern2Submit(data: any) {
  if (!selectedUser.value) return
  
  await actions.createProjectForUser(
    {
      userId: selectedUser.value,
      projectData: data,
    },
    {
      actionState: pattern2_taskState,
    }
  )
  
  pattern2_modalOpen.value = false
}

// Pattern 3: CallbackLogic Implementation
function openPattern3Modal() {
  pattern3_modalOpen.value = true
  pattern3_result.value = ''
}

function handlePattern3Submit(data: any) {
  actions.createUser(data, {
    actionCallback: (state, result) => {
      if (state === true) {
        pattern3_result.value = `✓ User created: ${result.data?.username || 'success'}`
        pattern3_modalOpen.value = false
      } else if (state === false) {
        pattern3_result.value = `✗ Failed: ${result.error || 'unknown error'}`
      } else if (typeof state === 'number') {
        pattern3_result.value = `⏳ Task ID: ${state}`
      } else if (typeof state === 'string') {
        pattern3_result.value = state
      }
    },
  })
}

// Initialize
onMounted(() => {
  loadUsers()
})
</script>

<template>
  <div class="admin-actions-showcase">
    <div class="showcase-header">
      <h2>Admin Actions Framework</h2>
      <p>Demonstration of three interaction patterns</p>
    </div>

    <div class="showcase-card">
      <!-- User Selection -->
      <div class="form-group">
        <label for="user-select">Select User:</label>
        <select
          id="user-select"
          v-model="selectedUser"
          class="form-select"
        >
          <option :value="null">-- Select a user --</option>
          <option
            v-for="user in availableUsers"
            :key="user.id"
            :value="user.id"
          >
            {{ user.username }}
          </option>
        </select>
      </div>

      <!-- Action List -->
      <div v-if="selectedUser" class="action-list">
        <button
          class="action-btn"
          :class="{ active: selectedAction === 'alterUser' }"
          @click="selectAction('alterUser')"
        >
          Alter User
        </button>
        <button
          class="action-btn"
          :class="{ active: selectedAction === 'createProjectForUser' }"
          @click="selectAction('createProjectForUser')"
        >
          Create Project For User
        </button>
        <button
          class="action-btn"
          :class="{ active: selectedAction === 'addUserToProject' }"
          @click="selectAction('addUserToProject')"
        >
          Add User To Project
        </button>
      </div>

      <!-- Action Details -->
      <div v-if="selectedAction" class="action-details">
        <p class="action-description">{{ actionDescription }}</p>
        
        <!-- Pattern 1: addUserToProject -->
        <div v-if="selectedAction === 'addUserToProject'" class="pattern-section">
          <div class="pattern-badge">Pattern 1: SimpleButton</div>
          <div class="form-group">
            <label>Select Project:</label>
            <select v-model="pattern1_projectId" class="form-select">
              <option :value="null">-- Select project --</option>
              <option
                v-for="project in pattern1_projects"
                :key="project.id"
                :value="project.id"
              >
                {{ project.name }}
              </option>
            </select>
          </div>
          <div class="button-group">
            <button class="btn btn-secondary" @click="cancelAction">Cancel</button>
            <button
              class="btn btn-primary"
              :disabled="!pattern1_projectId"
              @click="executePattern1"
            >
              Add User
            </button>
          </div>
        </div>

        <!-- Pattern 2: createProjectForUser -->
        <div v-if="selectedAction === 'createProjectForUser'" class="pattern-section">
          <div class="pattern-badge">Pattern 2: StateButton</div>
          <div class="button-group">
            <button class="btn btn-secondary" @click="cancelAction">Cancel</button>
            <button
              class="btn btn-primary btn-state"
              @click="openPattern2Modal"
            >
              <span v-if="pattern2_taskState === null" class="state-icon">⏳</span>
              <span v-else-if="pattern2_taskState === false" class="state-icon error">✗</span>
              <span v-else-if="pattern2_taskState === true" class="state-icon success">✓</span>
              <span v-else-if="typeof pattern2_taskState === 'number'">Task #{{ pattern2_taskState }}</span>
              <span v-else>{{ pattern2_taskState }}</span>
              {{ pattern2_taskState === null ? ' Processing...' : ' Create Project' }}
            </button>
          </div>
        </div>

        <!-- Pattern 3: alterUser -->
        <div v-if="selectedAction === 'alterUser'" class="pattern-section">
          <div class="pattern-badge">Pattern 3: CallbackLogic</div>
          <div v-if="pattern3_result" class="callback-result">
            {{ pattern3_result }}
          </div>
          <div class="button-group">
            <button class="btn btn-secondary" @click="cancelAction">Cancel</button>
            <button class="btn btn-primary" @click="openPattern3Modal">
              Open Form
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Pattern 2 Modal -->
    <AdminAction
      v-model="pattern2_modalOpen"
      init-step="collect"
      final-step="summary"
      action-type="create"
      core-type="project"
    >
      <template #panel="{ complete, cancel }">
        <AdminActionProjectsPanel
          action="create"
          fields="default"
          :owner-id="selectedUser"
          @submit="handlePattern2Submit"
          @cancel="cancel"
        />
      </template>
    </AdminAction>

    <!-- Pattern 3 Modal -->
    <AdminAction
      v-model="pattern3_modalOpen"
      init-step="none"
      final-step="inline"
      action-type="alter"
      core-type="user"
    >
      <template #panel="{ complete, cancel }">
        <AdminActionUsersPanel
          action="alter"
          fields="default"
          :user-id="selectedUser"
          @submit="handlePattern3Submit"
          @cancel="cancel"
        />
      </template>
    </AdminAction>
  </div>
</template>

<style scoped>
.admin-actions-showcase {
  max-width: 800px;
  margin: 2rem auto;
  padding: 0 1rem;
}

.showcase-header {
  margin-bottom: 2rem;
}

.showcase-header h2 {
  margin: 0 0 0.5rem 0;
  color: var(--color-heading);
}

.showcase-header p {
  margin: 0;
  color: var(--color-text-muted);
}

.showcase-card {
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 2rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: var(--color-text);
}

.form-select {
  width: 100%;
  padding: 0.625rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-background);
  color: var(--color-text);
  font-size: 0.875rem;
}

.action-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.action-btn {
  padding: 0.875rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-background-soft);
  color: var(--color-text);
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
  font-weight: 500;
}

.action-btn:hover {
  background: var(--color-background-mute);
  border-color: var(--color-primary);
}

.action-btn.active {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.action-details {
  padding-top: 1.5rem;
  border-top: 1px solid var(--color-border);
}

.action-description {
  margin: 0 0 1.5rem 0;
  color: var(--color-text-muted);
  font-size: 0.875rem;
}

.pattern-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.pattern-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background: var(--color-primary);
  color: white;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  align-self: flex-start;
}

.button-group {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
}

.btn {
  padding: 0.625rem 1.25rem;
  border-radius: 6px;
  font-weight: 500;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.btn-primary:hover:not(:disabled) {
  opacity: 0.9;
}

.btn-secondary {
  background: var(--color-background-soft);
  color: var(--color-text);
  border-color: var(--color-border);
}

.btn-secondary:hover {
  background: var(--color-background-mute);
}

.btn-state {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.state-icon {
  font-size: 1rem;
}

.state-icon.success {
  color: var(--color-success, #10b981);
}

.state-icon.error {
  color: var(--color-danger, #ef4444);
}

.callback-result {
  padding: 1rem;
  border-radius: 6px;
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
  font-size: 0.875rem;
  color: var(--color-text);
}

@media (max-width: 640px) {
  .button-group {
    flex-direction: column;
  }

  .btn {
    width: 100%;
  }
}
</style>
