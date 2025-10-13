# Demo Data Versioning & Task Management
## Guide for AI-Assisted Development with Claude Sonnet 4.5

## Overview

This document provides recommendations for implementing a complete versioning and task management system for demo data, designed to be implemented with AI assistance (Claude Sonnet 4.5 or similar).

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Demo Data System                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐      ┌──────────────┐                   │
│  │  Task Board  │◄────►│   Database   │                   │
│  │  Dashboard   │      │              │                   │
│  │  (/ route)   │      │  - events    │                   │
│  └──────────────┘      │  - posts     │                   │
│         │              │  - tasks     │                   │
│         │              │  - versions  │                   │
│         ▼              └──────────────┘                   │
│  ┌──────────────┐              │                          │
│  │   Hero Edit  │              │                          │
│  │    Modal     │◄─────────────┘                          │
│  │  + Tasks     │                                          │
│  └──────────────┘                                          │
│         │                                                   │
│         ▼                                                   │
│  ┌──────────────┐      ┌──────────────┐                   │
│  │   Version    │      │  CSV Bulk    │                   │
│  │   Manager    │◄────►│  Update      │                   │
│  └──────────────┘      └──────────────┘                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Phase 1: Database Schema Extensions

### 1.1 Task & Version Tables

**Create Migration Script**: `server/database/migrations/001_tasks_versioning.ts`

```typescript
export function addTasksAndVersioning(db: Database) {
  // Tasks table for tracking work items
  db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'todo' CHECK(status IN ('todo', 'in-progress', 'done', 'archived')),
      priority TEXT DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high', 'urgent')),
      record_type TEXT,  -- 'event', 'post', 'location', 'instructor', 'participant'
      record_id TEXT,    -- Reference to the actual record
      assigned_to TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      due_date TEXT,
      completed_at TEXT,
      version_id TEXT,   -- Link to version
      FOREIGN KEY (version_id) REFERENCES versions(id)
    )
  `)

  // Versions table for snapshots
  db.exec(`
    CREATE TABLE IF NOT EXISTS versions (
      id TEXT PRIMARY KEY,
      version_number TEXT NOT NULL UNIQUE,  -- e.g., 'v1.0.0', 'v1.1.0'
      name TEXT NOT NULL,                   -- e.g., 'Winter 2025 Release'
      description TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      created_by TEXT,
      is_active INTEGER DEFAULT 0,          -- 0 or 1 for boolean
      snapshot_data TEXT,                   -- JSON snapshot of all data
      csv_exported INTEGER DEFAULT 0,       -- 0 or 1 if CSVs were generated
      notes TEXT
    )
  `)

  // Version history for tracking changes to records
  db.exec(`
    CREATE TABLE IF NOT EXISTS record_versions (
      id TEXT PRIMARY KEY,
      version_id TEXT NOT NULL,
      record_type TEXT NOT NULL,
      record_id TEXT NOT NULL,
      data TEXT NOT NULL,                   -- JSON snapshot of record
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (version_id) REFERENCES versions(id)
    )
  `)

  // Extend existing tables with version tracking
  const tables = ['events', 'posts', 'locations', 'instructors', 'participants']
  
  tables.forEach(table => {
    db.exec(`
      ALTER TABLE ${table} ADD COLUMN version_id TEXT;
      ALTER TABLE ${table} ADD COLUMN created_at TEXT DEFAULT (datetime('now'));
      ALTER TABLE ${table} ADD COLUMN updated_at TEXT DEFAULT (datetime('now'));
      ALTER TABLE ${table} ADD COLUMN status TEXT DEFAULT 'active' CHECK(status IN ('active', 'draft', 'archived'));
    `)
  })

  // Create indexes for performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
    CREATE INDEX IF NOT EXISTS idx_tasks_record ON tasks(record_type, record_id);
    CREATE INDEX IF NOT EXISTS idx_tasks_version ON tasks(version_id);
    CREATE INDEX IF NOT EXISTS idx_versions_active ON versions(is_active);
    CREATE INDEX IF NOT EXISTS idx_record_versions_lookup ON record_versions(version_id, record_type, record_id);
  `)
}
```

### 1.2 Update Database Initialization

**Edit**: `server/database/db.ts`

```typescript
import { addTasksAndVersioning } from './migrations/001_tasks_versioning'

export function initDatabase() {
  // ... existing table creation ...
  
  // Add versioning tables
  addTasksAndVersioning(db)
}
```

## Phase 2: Task Management API

### 2.1 Task CRUD Endpoints

**Create**: `server/api/tasks/index.get.ts`

```typescript
import { defineEventHandler } from 'h3'
import db from '../../database/db'

export default defineEventHandler((event) => {
  const url = new URL(event.node.req.url!, `http://${event.node.req.headers.host}`)
  const status = url.searchParams.get('status')
  const recordType = url.searchParams.get('record_type')
  
  let query = 'SELECT * FROM tasks WHERE 1=1'
  const params: any[] = []
  
  if (status) {
    query += ' AND status = ?'
    params.push(status)
  }
  
  if (recordType) {
    query += ' AND record_type = ?'
    params.push(recordType)
  }
  
  query += ' ORDER BY priority DESC, created_at DESC'
  
  const tasks = db.prepare(query).all(...params)
  
  return {
    tasks,
    counts: {
      total: tasks.length,
      todo: tasks.filter(t => t.status === 'todo').length,
      inProgress: tasks.filter(t => t.status === 'in-progress').length,
      done: tasks.filter(t => t.status === 'done').length
    }
  }
})
```

**Create**: `server/api/tasks/index.post.ts`

```typescript
import { defineEventHandler, readBody, createError } from 'h3'
import { nanoid } from 'nanoid'
import db from '../../database/db'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  
  const { title, description, priority, record_type, record_id, due_date, version_id } = body
  
  if (!title) {
    throw createError({
      statusCode: 400,
      message: 'Title is required'
    })
  }
  
  const id = nanoid()
  
  const stmt = db.prepare(`
    INSERT INTO tasks (id, title, description, priority, record_type, record_id, due_date, version_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)
  
  stmt.run(id, title, description || null, priority || 'medium', record_type || null, 
           record_id || null, due_date || null, version_id || null)
  
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id)
  
  return {
    success: true,
    task
  }
})
```

**Create**: `server/api/tasks/[id].put.ts`

```typescript
import { defineEventHandler, readBody, createError } from 'h3'
import db from '../../database/db'

export default defineEventHandler(async (event) => {
  const id = event.context.params?.id
  const body = await readBody(event)
  
  const { title, description, status, priority, due_date, completed_at } = body
  
  const updates: string[] = []
  const values: any[] = []
  
  if (title !== undefined) {
    updates.push('title = ?')
    values.push(title)
  }
  if (description !== undefined) {
    updates.push('description = ?')
    values.push(description)
  }
  if (status !== undefined) {
    updates.push('status = ?')
    values.push(status)
    if (status === 'done' && !completed_at) {
      updates.push('completed_at = datetime("now")')
    }
  }
  if (priority !== undefined) {
    updates.push('priority = ?')
    values.push(priority)
  }
  if (due_date !== undefined) {
    updates.push('due_date = ?')
    values.push(due_date)
  }
  
  updates.push('updated_at = datetime("now")')
  values.push(id)
  
  const query = `UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`
  
  db.prepare(query).run(...values)
  
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id)
  
  return {
    success: true,
    task
  }
})
```

**Create**: `server/api/tasks/[id].delete.ts`

```typescript
import { defineEventHandler } from 'h3'
import db from '../../database/db'

export default defineEventHandler((event) => {
  const id = event.context.params?.id
  
  db.prepare('DELETE FROM tasks WHERE id = ?').run(id)
  
  return {
    success: true,
    message: 'Task deleted'
  }
})
```

## Phase 3: Task Dashboard (Root Route)

### 3.1 Replace Homepage with Task Dashboard

**Create**: `src/views/TaskDashboard.vue`

```vue
<template>
  <Container>
    <Section>
      <Heading level="1">Demo Data Task Dashboard</Heading>
      
      <!-- Stats Cards -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">{{ stats.total }}</div>
          <div class="stat-label">Total Tasks</div>
        </div>
        <div class="stat-card todo">
          <div class="stat-value">{{ stats.todo }}</div>
          <div class="stat-label">To Do</div>
        </div>
        <div class="stat-card in-progress">
          <div class="stat-value">{{ stats.inProgress }}</div>
          <div class="stat-label">In Progress</div>
        </div>
        <div class="stat-card done">
          <div class="stat-value">{{ stats.done }}</div>
          <div class="stat-label">Done</div>
        </div>
      </div>

      <!-- Filter Bar -->
      <div class="filter-bar">
        <select v-model="filterStatus" class="filter-select">
          <option value="">All Statuses</option>
          <option value="todo">To Do</option>
          <option value="in-progress">In Progress</option>
          <option value="done">Done</option>
        </select>
        
        <select v-model="filterType" class="filter-select">
          <option value="">All Types</option>
          <option value="event">Events</option>
          <option value="post">Posts</option>
          <option value="location">Locations</option>
          <option value="instructor">Instructors</option>
        </select>

        <Button @click="openNewTaskModal" variant="primary">
          + New Task
        </Button>
      </div>

      <!-- Tasks Board -->
      <div class="tasks-board">
        <div class="task-column">
          <h3 class="column-title">To Do</h3>
          <TaskCard 
            v-for="task in todoTasks" 
            :key="task.id"
            :task="task"
            @edit="editTask"
            @status-change="updateTaskStatus"
          />
        </div>

        <div class="task-column">
          <h3 class="column-title">In Progress</h3>
          <TaskCard 
            v-for="task in inProgressTasks" 
            :key="task.id"
            :task="task"
            @edit="editTask"
            @status-change="updateTaskStatus"
          />
        </div>

        <div class="task-column">
          <h3 class="column-title">Done</h3>
          <TaskCard 
            v-for="task in doneTasks" 
            :key="task.id"
            :task="task"
            @edit="editTask"
            @status-change="updateTaskStatus"
          />
        </div>
      </div>

      <!-- Version Management Section -->
      <div class="version-section">
        <h2>Version Management</h2>
        <Button @click="$router.push('/versions')" variant="secondary">
          Manage Versions
        </Button>
      </div>
    </Section>

    <!-- Task Edit Modal -->
    <TaskEditModal
      :is-open="showTaskModal"
      :task="currentTask"
      @close="showTaskModal = false"
      @save="saveTask"
    />
  </Container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

interface Task {
  id: string
  title: string
  description?: string
  status: 'todo' | 'in-progress' | 'done'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  record_type?: string
  record_id?: string
  due_date?: string
}

const router = useRouter()
const tasks = ref<Task[]>([])
const filterStatus = ref('')
const filterType = ref('')
const showTaskModal = ref(false)
const currentTask = ref<Task | null>(null)

const stats = computed(() => ({
  total: tasks.value.length,
  todo: tasks.value.filter(t => t.status === 'todo').length,
  inProgress: tasks.value.filter(t => t.status === 'in-progress').length,
  done: tasks.value.filter(t => t.status === 'done').length
}))

const filteredTasks = computed(() => {
  return tasks.value.filter(task => {
    if (filterStatus.value && task.status !== filterStatus.value) return false
    if (filterType.value && task.record_type !== filterType.value) return false
    return true
  })
})

const todoTasks = computed(() => filteredTasks.value.filter(t => t.status === 'todo'))
const inProgressTasks = computed(() => filteredTasks.value.filter(t => t.status === 'in-progress'))
const doneTasks = computed(() => filteredTasks.value.filter(t => t.status === 'done'))

async function loadTasks() {
  const response = await fetch('/api/tasks')
  const data = await response.json()
  tasks.value = data.tasks
}

function openNewTaskModal() {
  currentTask.value = null
  showTaskModal.value = true
}

function editTask(task: Task) {
  currentTask.value = task
  showTaskModal.value = true
}

async function saveTask(taskData: Task) {
  if (taskData.id) {
    await fetch(`/api/tasks/${taskData.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(taskData)
    })
  } else {
    await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(taskData)
    })
  }
  
  await loadTasks()
  showTaskModal.value = false
}

async function updateTaskStatus(taskId: string, newStatus: string) {
  await fetch(`/api/tasks/${taskId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: newStatus })
  })
  
  await loadTasks()
}

onMounted(() => {
  loadTasks()
})
</script>

<style scoped>
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin: 2rem 0;
}

.stat-card {
  padding: 1.5rem;
  background: var(--color-card-bg);
  border-radius: var(--radius-button);
  border: 2px solid var(--color-border);
  text-align: center;
}

.stat-card.todo { border-color: #3b82f6; }
.stat-card.in-progress { border-color: #f59e0b; }
.stat-card.done { border-color: #10b981; }

.stat-value {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--color-contrast);
}

.stat-label {
  font-size: 0.875rem;
  color: var(--color-dimmed);
  margin-top: 0.5rem;
}

.filter-bar {
  display: flex;
  gap: 1rem;
  margin: 2rem 0;
  align-items: center;
}

.filter-select {
  padding: 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-button);
  background: var(--color-bg);
  color: var(--color-contrast);
}

.tasks-board {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
  margin: 2rem 0;
}

.task-column {
  background: var(--color-muted-bg);
  padding: 1rem;
  border-radius: var(--radius-button);
  min-height: 400px;
}

.column-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid var(--color-border);
}

.version-section {
  margin-top: 3rem;
  padding: 2rem;
  background: var(--color-card-bg);
  border-radius: var(--radius-button);
  text-align: center;
}
</style>
```

### 3.2 Update Router

**Edit**: `src/router/index.ts`

```typescript
import TaskDashboard from '@/views/TaskDashboard.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: TaskDashboard  // Changed from existing home component
  },
  // ... other routes
]
```

## Phase 4: Enhanced Hero Edit Modal with Tasks

### 4.1 Update HeroEditModal Component

**Edit**: `src/views/demo/HeroEditModal.vue`

Add task management section to the modal:

```vue
<!-- Add to template after description field -->
<div class="form-group">
  <label>Associated Tasks</label>
  <div class="tasks-list">
    <div 
      v-for="task in associatedTasks" 
      :key="task.id"
      class="task-item"
      :class="{ done: task.status === 'done' }"
    >
      <input 
        type="checkbox" 
        :checked="task.status === 'done'"
        @change="toggleTaskStatus(task)"
      />
      <span class="task-title">{{ task.title }}</span>
      <span class="task-priority" :class="task.priority">
        {{ task.priority }}
      </span>
      <button @click="editTask(task)" type="button" class="task-edit-btn">
        Edit
      </button>
    </div>
  </div>
  <button @click="addNewTask" type="button" class="btn btn-secondary btn-sm">
    + Add Task
  </button>
</div>
```

Add to script:

```typescript
const associatedTasks = ref<Task[]>([])

// Load tasks for current hero
watch(() => props.heroData, async (data) => {
  if (data) {
    // ... existing code ...
    
    // Load associated tasks
    const response = await fetch(`/api/tasks?record_type=event&record_id=${data.id}`)
    const taskData = await response.json()
    associatedTasks.value = taskData.tasks
  }
}, { immediate: true })

async function toggleTaskStatus(task: Task) {
  const newStatus = task.status === 'done' ? 'in-progress' : 'done'
  await fetch(`/api/tasks/${task.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: newStatus })
  })
  
  // Reload tasks
  const response = await fetch(`/api/tasks?record_type=event&record_id=${props.heroData?.id}`)
  const taskData = await response.json()
  associatedTasks.value = taskData.tasks
}

function editTask(task: Task) {
  // Open task edit modal or inline edit
  // Implementation depends on desired UX
}

function addNewTask() {
  // Open task creation modal with pre-filled record_id
}
```

## Phase 5: Version Management System

### 5.1 Version API Endpoints

**Create**: `server/api/versions/index.post.ts`

```typescript
import { defineEventHandler, readBody } from 'h3'
import { nanoid } from 'nanoid'
import db from '../../database/db'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { version_number, name, description, created_by } = body
  
  // Create snapshot of all current data
  const events = db.prepare('SELECT * FROM events WHERE status = "active"').all()
  const posts = db.prepare('SELECT * FROM posts WHERE status = "active"').all()
  const locations = db.prepare('SELECT * FROM locations WHERE status = "active"').all()
  const instructors = db.prepare('SELECT * FROM instructors WHERE status = "active"').all()
  const participants = db.prepare('SELECT * FROM participants WHERE status = "active"').all()
  
  const snapshot = {
    events,
    posts,
    locations,
    instructors,
    participants,
    timestamp: new Date().toISOString()
  }
  
  const id = nanoid()
  
  // Deactivate previous active version
  db.prepare('UPDATE versions SET is_active = 0 WHERE is_active = 1').run()
  
  // Create new version
  db.prepare(`
    INSERT INTO versions (id, version_number, name, description, created_by, is_active, snapshot_data)
    VALUES (?, ?, ?, ?, ?, 1, ?)
  `).run(id, version_number, name, description || null, created_by || null, JSON.stringify(snapshot))
  
  // Store individual record versions
  const recordTypes = ['events', 'posts', 'locations', 'instructors', 'participants']
  
  recordTypes.forEach(type => {
    const records = snapshot[type as keyof typeof snapshot] as any[]
    records.forEach(record => {
      db.prepare(`
        INSERT INTO record_versions (id, version_id, record_type, record_id, data)
        VALUES (?, ?, ?, ?, ?)
      `).run(nanoid(), id, type, record.id, JSON.stringify(record))
    })
  })
  
  const version = db.prepare('SELECT * FROM versions WHERE id = ?').get(id)
  
  return {
    success: true,
    version
  }
})
```

### 5.2 CSV Bulk Export

**Create**: `server/api/versions/[id]/export-csv.post.ts`

```typescript
import { defineEventHandler } from 'h3'
import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import db from '../../../database/db'

function objectToCSV(data: any[]): string {
  if (data.length === 0) return ''
  
  const headers = Object.keys(data[0])
  const rows = data.map(obj => 
    headers.map(h => {
      const val = obj[h]
      if (val === null || val === undefined) return ''
      if (typeof val === 'string' && (val.includes(',') || val.includes('"') || val.includes('\n'))) {
        return `"${val.replace(/"/g, '""')}"`
      }
      return val
    }).join(',')
  )
  
  return [headers.join(','), ...rows].join('\n')
}

export default defineEventHandler(async (event) => {
  const versionId = event.context.params?.id
  
  // Get version
  const version = db.prepare('SELECT * FROM versions WHERE id = ?').get(versionId)
  if (!version) {
    throw new Error('Version not found')
  }
  
  const snapshot = JSON.parse(version.snapshot_data)
  const csvDir = join(process.cwd(), 'src/assets/csv')
  const versionDir = join(csvDir, `version_${version.version_number}`)
  
  // Create version directory
  await import('node:fs').then(fs => 
    fs.promises.mkdir(versionDir, { recursive: true })
  )
  
  // Export each data type to CSV
  const exports = [
    { name: 'events.csv', data: snapshot.events },
    { name: 'posts.csv', data: snapshot.posts },
    { name: 'locations.csv', data: snapshot.locations },
    { name: 'instructors.csv', data: snapshot.instructors },
    { name: 'participants.csv', data: snapshot.participants }
  ]
  
  for (const exp of exports) {
    const csv = objectToCSV(exp.data)
    await writeFile(join(versionDir, exp.name), csv, 'utf-8')
  }
  
  // Update version to mark as exported
  db.prepare('UPDATE versions SET csv_exported = 1 WHERE id = ?').run(versionId)
  
  return {
    success: true,
    message: `CSV files exported to ${versionDir}`,
    path: versionDir
  }
})
```

### 5.3 CSV Bulk Import (Roundtrip)

**Create**: `server/api/versions/[id]/import-csv.post.ts`

```typescript
import { defineEventHandler } from 'h3'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import db from '../../../database/db'

function parseCSV(csv: string): any[] {
  const lines = csv.split('\n').filter(l => l.trim())
  if (lines.length < 2) return []
  
  const headers = lines[0].split(',').map(h => h.trim())
  
  return lines.slice(1).map(line => {
    const values = line.split(',')
    const obj: any = {}
    headers.forEach((header, i) => {
      obj[header] = values[i]?.trim() || null
    })
    return obj
  })
}

export default defineEventHandler(async (event) => {
  const versionId = event.context.params?.id
  
  // Get version
  const version = db.prepare('SELECT * FROM versions WHERE id = ?').get(versionId)
  if (!version) {
    throw new Error('Version not found')
  }
  
  const versionDir = join(process.cwd(), 'src/assets/csv', `version_${version.version_number}`)
  
  // Read CSV files
  const files = [
    { name: 'events.csv', table: 'events' },
    { name: 'posts.csv', table: 'posts' },
    { name: 'locations.csv', table: 'locations' },
    { name: 'instructors.csv', table: 'instructors' },
    { name: 'participants.csv', table: 'participants' }
  ]
  
  const updates: any = {}
  
  for (const file of files) {
    const csv = await readFile(join(versionDir, file.name), 'utf-8')
    const data = parseCSV(csv)
    
    // Update database with CSV data
    for (const record of data) {
      const columns = Object.keys(record)
      const placeholders = columns.map(() => '?').join(',')
      const values = columns.map(col => record[col])
      
      db.prepare(`
        INSERT OR REPLACE INTO ${file.table} (${columns.join(',')})
        VALUES (${placeholders})
      `).run(...values)
    }
    
    updates[file.table] = data.length
  }
  
  // Update version snapshot with new data
  const newSnapshot = {
    events: db.prepare('SELECT * FROM events WHERE version_id = ?').all(versionId),
    posts: db.prepare('SELECT * FROM posts WHERE version_id = ?').all(versionId),
    locations: db.prepare('SELECT * FROM locations WHERE version_id = ?').all(versionId),
    instructors: db.prepare('SELECT * FROM instructors WHERE version_id = ?').all(versionId),
    participants: db.prepare('SELECT * FROM participants WHERE version_id = ?').all(versionId),
    timestamp: new Date().toISOString()
  }
  
  db.prepare('UPDATE versions SET snapshot_data = ? WHERE id = ?')
    .run(JSON.stringify(newSnapshot), versionId)
  
  return {
    success: true,
    message: 'CSV data imported successfully',
    updates
  }
})
```

## Claude AI Prompting Guide

### Implementing Phase 1: Database Schema

**Prompt to Claude:**

```
I need to add task management and versioning to my demo-data application. 

Current setup:
- SQLite database with better-sqlite3
- Database init in server/database/db.ts
- Existing tables: events, posts, locations, instructors, participants

Please create:
1. A migration file at server/database/migrations/001_tasks_versioning.ts
2. Three new tables: tasks, versions, record_versions
3. Extend existing tables with: version_id, created_at, updated_at, status columns
4. Create appropriate indexes for performance

Requirements:
- Tasks should track: title, description, status (todo/in-progress/done/archived), priority
- Tasks can be linked to specific records (record_type, record_id)
- Versions should snapshot all data as JSON
- Use TEXT PRIMARY KEY with nanoid for IDs
- Add CHECK constraints for enum fields
```

### Implementing Phase 2: API Endpoints

**Prompt to Claude:**

```
Create REST API endpoints for task management in my Nitro server.

Context:
- Using Nitro 3 with H3
- Database: SQLite with better-sqlite3 at server/database/db.ts
- Task table has fields: id, title, description, status, priority, record_type, record_id, etc.

Please create:
1. GET /api/tasks - List tasks with optional ?status= and ?record_type= filters
2. POST /api/tasks - Create new task
3. PUT /api/tasks/[id] - Update task (status, title, description, etc.)
4. DELETE /api/tasks/[id] - Delete task

Files needed:
- server/api/tasks/index.get.ts
- server/api/tasks/index.post.ts
- server/api/tasks/[id].put.ts
- server/api/tasks/[id].delete.ts

Use proper error handling with createError(), return JSON responses, use prepared statements.
```

### Implementing Phase 3: Task Dashboard

**Prompt to Claude:**

```
Create a Task Dashboard as the new homepage (/ route) for my Vue 3 app.

Current setup:
- Vue 3 with Composition API and TypeScript
- Vue Router
- Existing components: Container, Section, Heading, Button
- CSS uses custom properties like --color-card-bg, --color-border

Please create src/views/TaskDashboard.vue with:
1. Stats cards showing total/todo/in-progress/done task counts
2. Filter dropdowns for status and record type
3. Kanban-style board with 3 columns (To Do, In Progress, Done)
4. Each column displays TaskCard components (I'll create separately)
5. "New Task" button opens a modal
6. Fetch tasks from GET /api/tasks
7. Allow drag-and-drop between columns (optional)

Also update src/router/index.ts to use TaskDashboard at '/' route.
```

### Implementing Phase 4: Hero Modal Enhancement

**Prompt to Claude:**

```
Enhance the existing HeroEditModal component to include task management.

Current file: src/views/demo/HeroEditModal.vue
- Vue 3 Composition API with TypeScript
- Props: isOpen, heroData (with id field), availableEvents
- Emits: close, save

Add to the modal:
1. New section showing associated tasks for the current hero/event
2. Each task shows: checkbox (for done status), title, priority badge, edit button
3. "Add Task" button to create new task linked to this record
4. Clicking checkbox updates task status via PUT /api/tasks/[id]
5. Tasks loaded from GET /api/tasks?record_type=event&record_id={heroData.id}

Keep existing hero editing functionality intact. Style to match existing modal design.
```

### Implementing Phase 5: Version Management

**Prompt to Claude:**

```
Implement version management system for demo data snapshots.

Requirements:
1. Create POST /api/versions endpoint that:
   - Takes version_number, name, description
   - Snapshots all active records from all tables
   - Stores as JSON in versions.snapshot_data
   - Creates individual record_versions entries
   - Marks version as active (deactivate previous)

2. Create POST /api/versions/[id]/export-csv that:
   - Exports version snapshot to CSV files
   - Creates directory: src/assets/csv/version_{version_number}/
   - Generates separate CSV for each table
   - Handles proper CSV escaping (quotes, commas, newlines)

3. Create POST /api/versions/[id]/import-csv that:
   - Reads CSV files from version directory
   - Updates database with CSV data
   - Enables roundtrip editing (export → edit → import)
   - Updates version snapshot with imported data

Context:
- Nitro 3 server
- SQLite with better-sqlite3
- Use node:fs/promises for file operations
- CSV format: headers row, comma-separated values
```

## Best Practices for AI Collaboration

### 1. Iterative Development

Work in phases:
1. **Schema first** - Get database structure right
2. **API layer** - Build and test endpoints
3. **UI components** - Build reusable pieces
4. **Integration** - Connect everything together

### 2. Testing After Each Phase

```bash
# After database changes
pnpm run build
node .output/server/index.mjs
curl http://localhost:3000/api/tasks

# After UI changes
pnpm run dev
# Open browser and test manually
```

### 3. Prompt Structure

Good prompts include:
- **Context**: What exists currently
- **Goal**: What you want to achieve
- **Requirements**: Specific features needed
- **Constraints**: Technology choices, patterns to follow
- **Examples**: Show existing code patterns

### 4. Code Review Checklist

After Claude generates code, verify:
- [ ] TypeScript types are correct
- [ ] Database queries use prepared statements
- [ ] Error handling is present
- [ ] API responses are consistent
- [ ] Component props/emits are typed
- [ ] CSS follows existing patterns
- [ ] File paths are correct

## Deployment Considerations

### Database Migrations

For production, implement proper migrations:

```typescript
// server/database/migrate.ts
export function runMigrations(db: Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INTEGER PRIMARY KEY,
      name TEXT UNIQUE,
      applied_at TEXT DEFAULT (datetime('now'))
    )
  `)
  
  const migrations = [
    { name: '001_tasks_versioning', fn: addTasksAndVersioning }
  ]
  
  for (const migration of migrations) {
    const existing = db.prepare('SELECT * FROM migrations WHERE name = ?').get(migration.name)
    if (!existing) {
      migration.fn(db)
      db.prepare('INSERT INTO migrations (name) VALUES (?)').run(migration.name)
    }
  }
}
```

### Backup Strategy

```bash
# Backup database before version creation
cp demo-data.db demo-data.db.backup

# Backup specific version
sqlite3 demo-data.db ".backup version_v1.0.0.db"
```

## Conclusion

This guide provides a comprehensive roadmap for implementing task management and versioning in your demo-data application, designed to be executed with AI assistance from Claude Sonnet 4.5.

Follow the phases sequentially, test after each phase, and iterate based on results. The system enables:

- ✅ Task tracking per record
- ✅ Kanban-style dashboard
- ✅ Inline task management in editors
- ✅ Version snapshots with CSV export
- ✅ Roundtrip CSV editing workflow
- ✅ Full data history and rollback capability

For questions or issues, refer to the main documentation or create GitHub issues.
