<template>
    <div class="capabilities-editor">
        <!-- Header with filters -->
        <div class="editor-header">
            <h2>🔐 Capabilities Matrix Editor</h2>
            <div class="filter-row">
                <div class="filter-group">
                    <label>Entity:</label>
                    <select v-model="selectedEntity" class="form-select">
                        <option value="">All Entities</option>
                        <option v-for="entity in ENTITIES" :key="entity.value" :value="entity.value">
                            {{ entity.name }}
                        </option>
                    </select>
                </div>
                <div class="filter-group">
                    <label>State:</label>
                    <select v-model="selectedState" class="form-select">
                        <option value="">All States</option>
                        <option v-for="state in STATES" :key="state.value" :value="state.value">
                            {{ state.name }}
                        </option>
                    </select>
                </div>
                <div class="filter-group">
                    <label>Project Type:</label>
                    <select v-model="selectedProjectType" class="form-select">
                        <option value="">All Types</option>
                        <option v-for="pt in PROJECT_TYPES" :key="pt.value" :value="pt.value">
                            {{ pt.name }}
                        </option>
                    </select>
                </div>
            </div>
        </div>

        <!-- Loading state -->
        <div v-if="loading" class="loading">
            Loading capabilities...
        </div>

        <!-- Config entries table -->
        <div v-else class="entries-container">
            <table class="capabilities-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Entity</th>
                        <th>State</th>
                        <th>Read</th>
                        <th>Update</th>
                        <th>Create</th>
                        <th>Manage</th>
                        <th>List</th>
                        <th>Share</th>
                        <th>Roles</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="entry in filteredEntries" :key="entry.id" class="entry-row"
                        :class="{ editing: editingId === entry.id }">
                        <td class="name-cell">
                            <code>{{ entry.name }}</code>
                            <span class="description">{{ entry.description }}</span>
                        </td>
                        <td>{{ getEntityName(entry.value) }}</td>
                        <td>{{ getStateName(entry.value) }}</td>
                        <td :class="getCapabilityClass('read', entry.value)">
                            {{ getCapabilityLabel('read', entry.value) }}
                        </td>
                        <td :class="getCapabilityClass('update', entry.value)">
                            {{ getCapabilityLabel('update', entry.value) }}
                        </td>
                        <td :class="getCapabilityClass('create', entry.value)">
                            {{ getCapabilityLabel('create', entry.value) }}
                        </td>
                        <td :class="getCapabilityClass('manage', entry.value)">
                            {{ getCapabilityLabel('manage', entry.value) }}
                        </td>
                        <td :class="{ active: hasSimpleCap(entry.value, 'list') }">
                            {{ hasSimpleCap(entry.value, 'list') ? '✓' : '-' }}
                        </td>
                        <td :class="{ active: hasSimpleCap(entry.value, 'share') }">
                            {{ hasSimpleCap(entry.value, 'share') ? '✓' : '-' }}
                        </td>
                        <td class="roles-cell">
                            <span v-for="role in getRoles(entry.value)" :key="role" class="role-badge"
                                :class="'role-' + role">
                                {{ role }}
                            </span>
                        </td>
                        <td class="actions-cell">
                            <button class="btn btn-sm btn-edit" @click="startEdit(entry)">✏️</button>
                            <button class="btn btn-sm btn-delete" @click="confirmDelete(entry)">🗑️</button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- Add new entry button -->
        <div class="add-entry-row">
            <button class="btn btn-primary" @click="startNewEntry">
                ➕ Add Capability Entry
            </button>
        </div>

        <!-- Edit/Create Modal -->
        <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
            <div class="modal-content">
                <h3>{{ isEditing ? 'Edit' : 'Create' }} Capability Entry</h3>

                <!-- Name -->
                <div class="form-group">
                    <label>Name:</label>
                    <input v-model="editForm.name" type="text" class="form-input" placeholder="entry_name" />
                </div>

                <!-- Description -->
                <div class="form-group">
                    <label>Description:</label>
                    <input v-model="editForm.description" type="text" class="form-input"
                        placeholder="Human readable description" />
                </div>

                <!-- Project Type -->
                <div class="form-group">
                    <label>Project Type:</label>
                    <select v-model="editForm.projectType" class="form-select">
                        <option v-for="pt in PROJECT_TYPES" :key="pt.value" :value="pt.value">
                            {{ pt.name }}
                        </option>
                    </select>
                </div>

                <!-- Entity -->
                <div class="form-group">
                    <label>Entity:</label>
                    <select v-model="editForm.entity" class="form-select">
                        <option v-for="entity in ENTITIES" :key="entity.value" :value="entity.value">
                            {{ entity.name }}
                        </option>
                    </select>
                </div>

                <!-- State -->
                <div class="form-group">
                    <label>Record State:</label>
                    <select v-model="editForm.state" class="form-select">
                        <option v-for="state in STATES" :key="state.value" :value="state.value">
                            {{ state.name }}
                        </option>
                    </select>
                </div>

                <!-- Complex Capabilities -->
                <div class="form-group capabilities-group">
                    <label>Complex Capabilities:</label>
                    <div class="capability-selects">
                        <div class="cap-item">
                            <span>Read:</span>
                            <select v-model="editForm.read" class="form-select">
                                <option v-for="opt in READ_OPTIONS" :key="opt.value" :value="opt.value">
                                    {{ opt.name }}
                                </option>
                            </select>
                        </div>
                        <div class="cap-item">
                            <span>Update:</span>
                            <select v-model="editForm.update" class="form-select">
                                <option v-for="opt in UPDATE_OPTIONS" :key="opt.value" :value="opt.value">
                                    {{ opt.name }}
                                </option>
                            </select>
                        </div>
                        <div class="cap-item">
                            <span>Create:</span>
                            <select v-model="editForm.create" class="form-select">
                                <option v-for="opt in CREATE_OPTIONS" :key="opt.value" :value="opt.value">
                                    {{ opt.name }}
                                </option>
                            </select>
                        </div>
                        <div class="cap-item">
                            <span>Manage:</span>
                            <select v-model="editForm.manage" class="form-select">
                                <option v-for="opt in MANAGE_OPTIONS" :key="opt.value" :value="opt.value">
                                    {{ opt.name }}
                                </option>
                            </select>
                        </div>
                    </div>
                </div>

                <!-- Simple Capabilities -->
                <div class="form-group">
                    <label>Simple Capabilities:</label>
                    <div class="checkbox-group">
                        <label class="checkbox-label">
                            <input type="checkbox" v-model="editForm.list" />
                            List
                        </label>
                        <label class="checkbox-label">
                            <input type="checkbox" v-model="editForm.share" />
                            Share
                        </label>
                    </div>
                </div>

                <!-- Roles -->
                <div class="form-group">
                    <label>Roles:</label>
                    <div class="checkbox-group roles-checkboxes">
                        <label v-for="role in ROLES" :key="role.bit" class="checkbox-label"
                            :class="'role-' + role.name">
                            <input type="checkbox" v-model="editForm.roles" :value="role.bit" />
                            {{ role.name }}
                        </label>
                    </div>
                </div>

                <!-- Preview -->
                <div class="form-group preview-group">
                    <label>Value Preview:</label>
                    <code class="value-preview">{{ computedValue }} (0x{{ computedValue.toString(16).toUpperCase()
                        }})</code>
                </div>

                <!-- Actions -->
                <div class="modal-actions">
                    <button class="btn btn-secondary" @click="closeModal">Cancel</button>
                    <button class="btn btn-primary" @click="saveEntry" :disabled="!isValid">
                        {{ isEditing ? 'Update' : 'Create' }}
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

// Bit constants (matching spec)
const BITS = {
    // Project type (bits 0-2)
    PROJECT_ALL: 0b000,
    PROJECT_CORE: 0b001,
    PROJECT_DEV: 0b010,
    PROJECT_TP: 0b011,
    PROJECT_TOPIC: 0b100,
    PROJECT_PROJECT: 0b101,
    PROJECT_REGIO: 0b110,

    // Entity (bits 3-7)
    ENTITY_ALL: 0b00000,
    ENTITY_PROJECT: 0b00001,
    ENTITY_USER: 0b00010,
    ENTITY_PAGE: 0b00011,
    ENTITY_POST: 0b00100,
    ENTITY_EVENT: 0b00101,
    ENTITY_IMAGE: 0b00110,
    ENTITY_LOCATION: 0b00111,

    // State (bits 8-10)
    STATE_ALL: 0b000,
    STATE_NEW: 0b001,
    STATE_DEMO: 0b010,
    STATE_DRAFT: 0b011,
    STATE_REVIEW: 0b100,
    STATE_RELEASED: 0b101,
    STATE_ARCHIVED: 0b110,
    STATE_TRASH: 0b111,

    // Capabilities
    CAP_LIST: 1 << 23,
    CAP_SHARE: 1 << 24,

    // Roles
    ROLE_ANONYM: 1 << 25,
    ROLE_PARTNER: 1 << 26,
    ROLE_PARTICIPANT: 1 << 27,
    ROLE_MEMBER: 1 << 28,
    ROLE_OWNER: 1 << 29,
}

// Options arrays for dropdowns
const PROJECT_TYPES = [
    { value: BITS.PROJECT_ALL, name: 'All' },
    { value: BITS.PROJECT_CORE, name: 'Core' },
    { value: BITS.PROJECT_DEV, name: 'Dev' },
    { value: BITS.PROJECT_TP, name: 'Topic/Project' },
    { value: BITS.PROJECT_TOPIC, name: 'Topic' },
    { value: BITS.PROJECT_PROJECT, name: 'Project' },
    { value: BITS.PROJECT_REGIO, name: 'Regio' },
]

const ENTITIES = [
    { value: BITS.ENTITY_ALL, name: 'All' },
    { value: BITS.ENTITY_PROJECT, name: 'Project' },
    { value: BITS.ENTITY_USER, name: 'User' },
    { value: BITS.ENTITY_PAGE, name: 'Page' },
    { value: BITS.ENTITY_POST, name: 'Post' },
    { value: BITS.ENTITY_EVENT, name: 'Event' },
    { value: BITS.ENTITY_IMAGE, name: 'Image' },
    { value: BITS.ENTITY_LOCATION, name: 'Location' },
]

const STATES = [
    { value: BITS.STATE_ALL, name: 'All' },
    { value: BITS.STATE_NEW, name: 'New' },
    { value: BITS.STATE_DEMO, name: 'Demo' },
    { value: BITS.STATE_DRAFT, name: 'Draft' },
    { value: BITS.STATE_REVIEW, name: 'Review' },
    { value: BITS.STATE_RELEASED, name: 'Released' },
    { value: BITS.STATE_ARCHIVED, name: 'Archived' },
    { value: BITS.STATE_TRASH, name: 'Trash' },
]

const READ_OPTIONS = [
    { value: 0, name: '(none)' },
    { value: 1, name: 'read (full)' },
    { value: 2, name: 'read > preview' },
    { value: 3, name: 'read > metadata' },
]

const UPDATE_OPTIONS = [
    { value: 0, name: '(none)' },
    { value: 1, name: 'update (full)' },
    { value: 2, name: 'update > comment' },
    { value: 3, name: 'update > append' },
    { value: 4, name: 'update > replace' },
    { value: 5, name: 'update > shift' },
]

const CREATE_OPTIONS = [
    { value: 0, name: '(none)' },
    { value: 1, name: 'create (full)' },
    { value: 2, name: 'create > draft' },
    { value: 3, name: 'create > template' },
]

const MANAGE_OPTIONS = [
    { value: 0, name: '(none)' },
    { value: 1, name: 'manage (full)' },
    { value: 2, name: 'manage > status' },
    { value: 3, name: 'manage > config' },
    { value: 4, name: 'manage > delete' },
    { value: 5, name: 'manage > archive' },
]

const ROLES = [
    { bit: BITS.ROLE_ANONYM, name: 'anonym' },
    { bit: BITS.ROLE_PARTNER, name: 'partner' },
    { bit: BITS.ROLE_PARTICIPANT, name: 'participant' },
    { bit: BITS.ROLE_MEMBER, name: 'member' },
    { bit: BITS.ROLE_OWNER, name: 'owner' },
]

// State
interface ConfigEntry {
    id: number
    value: number
    name: string
    description: string
    tagfamily: string
    taglogic: string
    is_default: boolean
}

const loading = ref(true)
const entries = ref<ConfigEntry[]>([])
const showModal = ref(false)
const editingId = ref<number | null>(null)
const isEditing = computed(() => editingId.value !== null)

// Filters
const selectedEntity = ref<number | string>('')
const selectedState = ref<number | string>('')
const selectedProjectType = ref<number | string>('')

// Edit form
const editForm = ref({
    name: '',
    description: '',
    projectType: BITS.PROJECT_ALL,
    entity: BITS.ENTITY_ALL,
    state: BITS.STATE_ALL,
    read: 0,
    update: 0,
    create: 0,
    manage: 0,
    list: false,
    share: false,
    roles: [] as number[],
})

// Computed value from form
const computedValue = computed(() => {
    let value = 0

    // Project type (bits 0-2)
    value |= editForm.value.projectType

    // Entity (bits 3-7)
    value |= editForm.value.entity << 3

    // State (bits 8-10)
    value |= editForm.value.state << 8

    // Read (bits 11-13)
    value |= editForm.value.read << 11

    // Update (bits 14-16)
    value |= editForm.value.update << 14

    // Create (bits 17-19)
    value |= editForm.value.create << 17

    // Manage (bits 20-22)
    value |= editForm.value.manage << 20

    // List (bit 23)
    if (editForm.value.list) value |= BITS.CAP_LIST

    // Share (bit 24)
    if (editForm.value.share) value |= BITS.CAP_SHARE

    // Roles (bits 25-29)
    for (const roleBit of editForm.value.roles) {
        value |= roleBit
    }

    return value
})

// Validation
const isValid = computed(() => {
    return editForm.value.name.trim().length > 0 &&
        editForm.value.roles.length > 0
})

// Filtered entries
const filteredEntries = computed(() => {
    return entries.value.filter(entry => {
        if (selectedEntity.value !== '' && getEntityValue(entry.value) !== selectedEntity.value) return false
        if (selectedState.value !== '' && getStateValue(entry.value) !== selectedState.value) return false
        if (selectedProjectType.value !== '' && getProjectTypeValue(entry.value) !== selectedProjectType.value)
            return false
        return true
    })
})

// Helper functions to extract bits from value
function getProjectTypeValue(value: number): number {
    return value & 0b111 // bits 0-2
}

function getEntityValue(value: number): number {
    return (value >> 3) & 0b11111 // bits 3-7
}

function getStateValue(value: number): number {
    return (value >> 8) & 0b111 // bits 8-10
}

function getCapabilityValue(value: number, cap: 'read' | 'update' | 'create' | 'manage'): number {
    const offsets = { read: 11, update: 14, create: 17, manage: 20 }
    return (value >> offsets[cap]) & 0b111
}

function hasSimpleCap(value: number, cap: 'list' | 'share'): boolean {
    const bits = { list: 23, share: 24 }
    return (value & (1 << bits[cap])) !== 0
}

function getRolesBits(value: number): number[] {
    const roles: number[] = []
    for (const role of ROLES) {
        if (value & role.bit) roles.push(role.bit)
    }
    return roles
}

// Display helpers
function getEntityName(value: number): string {
    const entityVal = getEntityValue(value)
    const entity = ENTITIES.find(e => e.value === entityVal)
    return entity?.name || '?'
}

function getStateName(value: number): string {
    const stateVal = getStateValue(value)
    const state = STATES.find(s => s.value === stateVal)
    return state?.name || '?'
}

function getCapabilityLabel(cap: 'read' | 'update' | 'create' | 'manage', value: number): string {
    const capVal = getCapabilityValue(value, cap)
    if (capVal === 0) return '-'
    const options = { read: READ_OPTIONS, update: UPDATE_OPTIONS, create: CREATE_OPTIONS, manage: MANAGE_OPTIONS }
    const opt = options[cap].find(o => o.value === capVal)
    return opt?.name.replace(/.*> /, '') || String(capVal)
}

function getCapabilityClass(cap: 'read' | 'update' | 'create' | 'manage', value: number): string {
    const capVal = getCapabilityValue(value, cap)
    if (capVal === 0) return 'inactive'
    if (capVal === 1) return 'active full'
    return 'active partial'
}

function getRoles(value: number): string[] {
    const roles: string[] = []
    for (const role of ROLES) {
        if (value & role.bit) roles.push(role.name)
    }
    return roles
}

// Modal functions
function startNewEntry() {
    editingId.value = null
    editForm.value = {
        name: '',
        description: '',
        projectType: BITS.PROJECT_ALL,
        entity: BITS.ENTITY_ALL,
        state: BITS.STATE_ALL,
        read: 0,
        update: 0,
        create: 0,
        manage: 0,
        list: false,
        share: false,
        roles: [],
    }
    showModal.value = true
}

function startEdit(entry: ConfigEntry) {
    editingId.value = entry.id
    editForm.value = {
        name: entry.name,
        description: entry.description,
        projectType: getProjectTypeValue(entry.value),
        entity: getEntityValue(entry.value),
        state: getStateValue(entry.value),
        read: getCapabilityValue(entry.value, 'read'),
        update: getCapabilityValue(entry.value, 'update'),
        create: getCapabilityValue(entry.value, 'create'),
        manage: getCapabilityValue(entry.value, 'manage'),
        list: hasSimpleCap(entry.value, 'list'),
        share: hasSimpleCap(entry.value, 'share'),
        roles: getRolesBits(entry.value),
    }
    showModal.value = true
}

function closeModal() {
    showModal.value = false
    editingId.value = null
}

async function saveEntry() {
    const payload = {
        value: computedValue.value,
        name: editForm.value.name.trim(),
        description: editForm.value.description.trim(),
        tagfamily: 'config',
        taglogic: 'toggle',
        is_default: false,
    }

    try {
        if (isEditing.value) {
            // Update existing
            await $fetch(`/api/sysreg/config/${editingId.value}`, {
                method: 'PUT',
                body: payload,
            })
        } else {
            // Create new
            await $fetch('/api/sysreg/config', {
                method: 'POST',
                body: payload,
            })
        }
        await loadEntries()
        closeModal()
    } catch (error) {
        console.error('Failed to save entry:', error)
        alert('Failed to save entry. Check console for details.')
    }
}

async function confirmDelete(entry: ConfigEntry) {
    if (!confirm(`Delete capability "${entry.name}"?`)) return

    try {
        await $fetch(`/api/sysreg/config/${entry.id}`, {
            method: 'DELETE',
        })
        await loadEntries()
    } catch (error) {
        console.error('Failed to delete entry:', error)
        alert('Failed to delete entry. Check console for details.')
    }
}

// Load entries from API
async function loadEntries() {
    loading.value = true
    try {
        const data = await $fetch<{ config: ConfigEntry[] }>('/api/sysreg/all')
        entries.value = data.config || []
    } catch (error) {
        console.error('Failed to load config entries:', error)
        entries.value = []
    } finally {
        loading.value = false
    }
}

onMounted(() => {
    loadEntries()
})
</script>

<style scoped>
.capabilities-editor {
    padding: 1rem;
    max-width: 1400px;
    margin: 0 auto;
}

.editor-header {
    margin-bottom: 1rem;
}

.editor-header h2 {
    margin: 0 0 0.5rem 0;
}

.filter-row {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
}

.filter-group {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.filter-group label {
    font-weight: 500;
    white-space: nowrap;
}

.form-select {
    padding: 0.25rem 0.5rem;
    border: 1px solid var(--vp-c-divider);
    border-radius: 4px;
    background: var(--vp-c-bg);
    color: var(--vp-c-text-1);
}

.loading {
    text-align: center;
    padding: 2rem;
    color: var(--vp-c-text-2);
}

.entries-container {
    overflow-x: auto;
}

.capabilities-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.875rem;
}

.capabilities-table th,
.capabilities-table td {
    padding: 0.5rem;
    text-align: left;
    border-bottom: 1px solid var(--vp-c-divider);
}

.capabilities-table th {
    font-weight: 600;
    background: var(--vp-c-bg-soft);
}

.entry-row:hover {
    background: var(--vp-c-bg-soft);
}

.entry-row.editing {
    background: var(--vp-c-brand-soft);
}

.name-cell {
    min-width: 200px;
}

.name-cell code {
    display: block;
    font-weight: 600;
}

.name-cell .description {
    font-size: 0.75rem;
    color: var(--vp-c-text-2);
}

.inactive {
    color: var(--vp-c-text-3);
}

.active {
    color: var(--vp-c-green-1);
    font-weight: 500;
}

.active.full {
    color: var(--vp-c-green-1);
}

.active.partial {
    color: var(--vp-c-yellow-1);
}

.roles-cell {
    display: flex;
    gap: 0.25rem;
    flex-wrap: wrap;
}

.role-badge {
    padding: 0.125rem 0.375rem;
    border-radius: 3px;
    font-size: 0.75rem;
    font-weight: 500;
}

.role-anonym {
    background: #e1e1e1;
    color: #666;
}

.role-partner {
    background: #c8e6c9;
    color: #2e7d32;
}

.role-participant {
    background: #bbdefb;
    color: #1565c0;
}

.role-member {
    background: #ffecb3;
    color: #ff6f00;
}

.role-owner {
    background: #f8bbd9;
    color: #ad1457;
}

.actions-cell {
    white-space: nowrap;
}

.btn {
    padding: 0.25rem 0.5rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
}

.btn-sm {
    font-size: 0.75rem;
}

.btn-edit {
    background: var(--vp-c-bg-soft);
}

.btn-delete {
    background: var(--vp-c-danger-soft);
}

.btn-primary {
    background: var(--vp-c-brand-1);
    color: white;
}

.btn-secondary {
    background: var(--vp-c-bg-soft);
}

.add-entry-row {
    margin-top: 1rem;
    padding: 1rem;
    text-align: center;
}

/* Modal styles */
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
}

.modal-content {
    background: var(--vp-c-bg);
    padding: 1.5rem;
    border-radius: 8px;
    max-width: 600px;
    width: 90%;
    max-height: 90vh;
    overflow-y: auto;
}

.modal-content h3 {
    margin: 0 0 1rem 0;
}

.form-group {
    margin-bottom: 1rem;
}

.form-group label {
    display: block;
    font-weight: 500;
    margin-bottom: 0.25rem;
}

.form-input {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid var(--vp-c-divider);
    border-radius: 4px;
    background: var(--vp-c-bg);
    color: var(--vp-c-text-1);
}

.capabilities-group .capability-selects {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.5rem;
}

.cap-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.cap-item span {
    min-width: 60px;
    font-weight: 500;
}

.cap-item .form-select {
    flex: 1;
}

.checkbox-group {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
}

.checkbox-label {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    cursor: pointer;
}

.roles-checkboxes .checkbox-label {
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
}

.preview-group .value-preview {
    display: block;
    padding: 0.5rem;
    background: var(--vp-c-bg-soft);
    border-radius: 4px;
    font-family: monospace;
}

.modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
    margin-top: 1.5rem;
}

.modal-actions .btn {
    padding: 0.5rem 1rem;
}
</style>
