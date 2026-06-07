<!-- DomainsAdmin.vue - Domain Management Admin Interface -->
<template>
    <div class="domains-admin">
        <div class="admin-header">
            <h1>🌐 Domain Management</h1>
            <p class="subtitle">Configure project domains and subdomains</p>
        </div>

        <!-- Action Bar -->
        <div class="action-bar">
            <button class="btn btn-primary" @click="showAddModal = true">
                ➕ Add Domain
            </button>
            <button class="btn btn-secondary" @click="refreshData">
                🔄 Refresh
            </button>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="loading-state">
            <p>Loading domains...</p>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="error-state">
            <p>❌ {{ error }}</p>
            <button class="btn btn-secondary" @click="refreshData">Retry</button>
        </div>

        <!-- Content -->
        <div v-else class="content-grid">
            <!-- Active Domains Section -->
            <section class="panel domains-panel">
                <h2>🟢 Active Domains ({{ domains.length }})</h2>

                <div v-if="domains.length === 0" class="empty-state">
                    <p>No domains configured yet.</p>
                </div>

                <table v-else class="domains-table">
                    <thead>
                        <tr>
                            <th>Domain</th>
                            <th>Type</th>
                            <th>Project</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="domain in domains" :key="domain.id">
                            <td>
                                <code class="domain-name">{{ domain.domainname }}</code>
                                <span v-if="domain.description" class="domain-desc">{{ domain.description }}</span>
                            </td>
                            <td>
                                <span :class="['type-badge', domain.domain_type]">
                                    {{ domain.domain_type === 'subdomain' ? '📦 Subdomain' : '🌍 Custom' }}
                                </span>
                            </td>
                            <td>
                                <span v-if="domain.project_domaincode" class="project-link">
                                    {{ domain.project_name || domain.project_heading || domain.project_domaincode }}
                                </span>
                                <span v-else class="text-muted">Not assigned</span>
                            </td>
                            <td class="actions">
                                <button class="btn btn-sm btn-secondary" @click="editDomain(domain)">
                                    ✏️
                                </button>
                                <button class="btn btn-sm btn-danger" @click="confirmDelete(domain)">
                                    🗑️
                                </button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </section>

            <!-- System Domains Section -->
            <section class="panel sysdomains-panel">
                <h2>📋 System Domains (Wildcard SSL)</h2>

                <div v-if="sysdomains.length === 0" class="empty-state">
                    <p>No system domains configured.</p>
                </div>

                <div v-else class="sysdomains-list">
                    <div v-for="sd in sysdomains" :key="sd.id" class="sysdomain-item">
                        <div class="sysdomain-info">
                            <code class="sysdomain-name">*.{{ sd.fullDomain }}</code>
                            <span v-if="sd.hasWildcardSsl" class="ssl-badge">✅ Wildcard SSL</span>
                            <span v-else class="ssl-badge warn">⚠️ No Wildcard</span>
                        </div>
                        <p v-if="sd.description" class="sysdomain-desc">{{ sd.description }}</p>
                    </div>
                </div>
            </section>
        </div>

        <!-- Add Domain Modal -->
        <div v-if="showAddModal" class="modal-overlay" @click.self="closeAddModal">
            <div class="modal">
                <div class="modal-header">
                    <h3>Add Domain</h3>
                    <button class="close-btn" @click="closeAddModal">✕</button>
                </div>

                <div class="modal-body">
                    <!-- Domain Type Selection -->
                    <div class="form-group">
                        <label>Domain Type:</label>
                        <div class="radio-group">
                            <label class="radio-option" :class="{ active: addForm.type === 'subdomain' }">
                                <input type="radio" v-model="addForm.type" value="subdomain" />
                                <span class="radio-label">
                                    <strong>📦 Subdomain</strong>
                                    <small>Instant setup (wildcard SSL)</small>
                                </span>
                            </label>
                            <label class="radio-option" :class="{ active: addForm.type === 'custom' }">
                                <input type="radio" v-model="addForm.type" value="custom" />
                                <span class="radio-label">
                                    <strong>🌍 Custom Domain</strong>
                                    <small>Requires terminal setup</small>
                                </span>
                            </label>
                        </div>
                    </div>

                    <!-- Subdomain Form -->
                    <div v-if="addForm.type === 'subdomain'" class="subdomain-form">
                        <div class="form-group">
                            <label>System Domain:</label>
                            <select v-model="addForm.sysdomain_id" class="form-select">
                                <option :value="null">Select system domain...</option>
                                <option v-for="sd in sysdomains" :key="sd.id" :value="sd.id">
                                    {{ sd.fullDomain }}
                                </option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label>Subdomain:</label>
                            <div class="input-with-suffix">
                                <input v-model="addForm.textdomain" type="text" class="form-input"
                                    placeholder="myproject" pattern="[a-z0-9_]+" />
                                <span class="input-suffix">.{{ selectedSysdomain?.fullDomain || 'example.org' }}</span>
                            </div>
                            <small class="form-hint">Lowercase letters, numbers, underscores only</small>
                        </div>

                        <div class="form-group">
                            <label>Project:</label>
                            <select v-model="addForm.project_id" class="form-select">
                                <option :value="null">Select project...</option>
                                <option v-for="p in projects" :key="p.id" :value="p.id">
                                    {{ p.name || p.heading || p.domaincode }}
                                </option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label>Description (optional):</label>
                            <input v-model="addForm.description" type="text" class="form-input" />
                        </div>

                        <div class="preview-box">
                            <strong>Preview:</strong>
                            <code>{{ previewDomainname }}</code>
                        </div>

                        <div class="form-actions">
                            <button class="btn btn-secondary" @click="closeAddModal">Cancel</button>
                            <button class="btn btn-primary" @click="createSubdomain"
                                :disabled="!canCreateSubdomain || creating">
                                {{ creating ? 'Creating...' : '✅ Create Subdomain' }}
                            </button>
                        </div>
                    </div>

                    <!-- Custom Domain Form -->
                    <div v-if="addForm.type === 'custom'" class="custom-form">
                        <div class="form-group">
                            <label>Domain:</label>
                            <div class="input-with-suffix">
                                <input v-model="addForm.textdomain" type="text" class="form-input"
                                    placeholder="myproject" />
                                <span class="input-suffix">.</span>
                                <select v-model="addForm.tld" class="form-select tld-select">
                                    <option value="de">de</option>
                                    <option value="com">com</option>
                                    <option value="org">org</option>
                                    <option value="eu">eu</option>
                                    <option value="info">info</option>
                                    <option value="bayern">bayern</option>
                                </select>
                            </div>
                        </div>

                        <div class="form-group">
                            <label>Project:</label>
                            <select v-model="addForm.project_id" class="form-select">
                                <option :value="null">Select project...</option>
                                <option v-for="p in projects" :key="p.id" :value="p.id">
                                    {{ p.name || p.heading || p.domaincode }}
                                </option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label>Description (optional):</label>
                            <input v-model="addForm.description" type="text" class="form-input" />
                        </div>

                        <div class="preview-box">
                            <strong>Preview:</strong>
                            <code>{{ previewCustomDomain }}</code>
                        </div>

                        <!-- DNS Check -->
                        <div class="dns-check-section">
                            <button class="btn btn-secondary" @click="checkDns"
                                :disabled="!addForm.textdomain || checkingDns">
                                {{ checkingDns ? 'Checking...' : '🔍 Check DNS' }}
                            </button>

                            <div v-if="dnsStatus" :class="['dns-status', dnsStatus.ready ? 'ready' : 'not-ready']">
                                <span v-if="dnsStatus.ready">✅ {{ dnsStatus.message }}</span>
                                <span v-else>❌ {{ dnsStatus.message }}</span>
                            </div>
                        </div>

                        <div class="form-actions">
                            <button class="btn btn-secondary" @click="closeAddModal">Cancel</button>
                            <button class="btn btn-primary" @click="showSetupInstructions" :disabled="!canCreateCustom">
                                📋 Generate Setup Instructions
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Setup Instructions Modal -->
        <div v-if="showInstructionsModal" class="modal-overlay" @click.self="closeInstructionsModal">
            <div class="modal modal-large">
                <div class="modal-header">
                    <h3>Setup Instructions for {{ previewCustomDomain }}</h3>
                    <button class="close-btn" @click="closeInstructionsModal">✕</button>
                </div>

                <div class="modal-body instructions-body">
                    <!-- Step 1: DNS -->
                    <section class="instruction-step">
                        <h4>📡 Step 1: Configure DNS</h4>
                        <p>Add these DNS records at your domain registrar:</p>

                        <table class="dns-table">
                            <thead>
                                <tr>
                                    <th>Type</th>
                                    <th>Name</th>
                                    <th>Value</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>A</td>
                                    <td>@</td>
                                    <td><code>{{ serverIp || 'YOUR_SERVER_IP' }}</code></td>
                                </tr>
                                <tr>
                                    <td>A</td>
                                    <td>www</td>
                                    <td><code>{{ serverIp || 'YOUR_SERVER_IP' }}</code></td>
                                </tr>
                            </tbody>
                        </table>

                        <div class="dns-check-inline">
                            <button class="btn btn-sm btn-secondary" @click="checkDns" :disabled="checkingDns">
                                {{ checkingDns ? 'Checking...' : '🔍 Verify DNS' }}
                            </button>
                            <span v-if="dnsStatus"
                                :class="['dns-inline-status', dnsStatus.ready ? 'ready' : 'not-ready']">
                                {{ dnsStatus.ready ? '✅ Ready' : '❌ Not configured' }}
                            </span>
                        </div>
                    </section>

                    <!-- Step 2: Terminal -->
                    <section class="instruction-step">
                        <h4>💻 Step 2: Run on Server (as root)</h4>
                        <p>SSH into your server and run:</p>

                        <div class="code-block">
                            <pre>{{ terminalCommand }}</pre>
                            <button class="copy-btn" @click="copyCommand">📋 Copy</button>
                        </div>

                        <details class="manual-steps">
                            <summary>Or manually:</summary>
                            <div class="code-block">
                                <pre>{{ manualCommands }}</pre>
                            </div>
                        </details>
                    </section>

                    <!-- Step 3: Confirm -->
                    <section class="instruction-step">
                        <h4>✅ Step 3: Confirm Setup</h4>
                        <p>After running the script, click below to register the domain:</p>

                        <button class="btn btn-success btn-large" @click="confirmCustomDomainSetup"
                            :disabled="creating">
                            {{ creating ? 'Registering...' : '✓ Domain Setup Complete' }}
                        </button>
                    </section>
                </div>
            </div>
        </div>

        <!-- Edit Domain Modal -->
        <div v-if="showEditModal" class="modal-overlay" @click.self="closeEditModal">
            <div class="modal">
                <div class="modal-header">
                    <h3>Edit Domain</h3>
                    <button class="close-btn" @click="closeEditModal">✕</button>
                </div>

                <div class="modal-body">
                    <div class="form-group">
                        <label>Domain:</label>
                        <code class="domain-display">{{ editForm.domainname }}</code>
                    </div>

                    <div class="form-group">
                        <label>Project:</label>
                        <select v-model="editForm.project_id" class="form-select">
                            <option :value="null">No project assigned</option>
                            <option v-for="p in projects" :key="p.id" :value="p.id">
                                {{ p.name || p.heading || p.domaincode }}
                            </option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label>Description:</label>
                        <input v-model="editForm.description" type="text" class="form-input" />
                    </div>

                    <div class="form-actions">
                        <button class="btn btn-secondary" @click="closeEditModal">Cancel</button>
                        <button class="btn btn-primary" @click="updateDomain" :disabled="updating">
                            {{ updating ? 'Saving...' : '💾 Save Changes' }}
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Delete Confirmation Modal -->
        <div v-if="showDeleteModal" class="modal-overlay" @click.self="closeDeleteModal">
            <div class="modal modal-small">
                <div class="modal-header">
                    <h3>⚠️ Delete Domain</h3>
                    <button class="close-btn" @click="closeDeleteModal">✕</button>
                </div>

                <div class="modal-body">
                    <p>Are you sure you want to delete <strong>{{ deleteTarget?.domainname }}</strong>?</p>
                    <p class="warning-text">This will not remove the nginx configuration. You may need to manually clean
                        up server config.</p>

                    <div class="form-actions">
                        <button class="btn btn-secondary" @click="closeDeleteModal">Cancel</button>
                        <button class="btn btn-danger" @click="deleteDomain" :disabled="deleting">
                            {{ deleting ? 'Deleting...' : '🗑️ Delete' }}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

// Types
interface Domain {
    id: number
    domainname: string
    textdomain: string | null
    tld: string
    sysdomain_id: number | null
    project_id: number | null
    description: string | null
    project_domaincode?: string
    project_name?: string
    project_heading?: string
    domain_type: 'subdomain' | 'custom'
}

interface Sysdomain {
    id: number
    domain: string
    tld: string
    domainstring: string
    fullDomain: string
    hasWildcardSsl: boolean
    description: string | null
}

interface Project {
    id: number
    domaincode: string
    name: string | null
    heading: string | null
}

interface DnsStatus {
    ready: boolean
    message: string
    resolvedIps?: string[]
}

// State
const loading = ref(true)
const error = ref<string | null>(null)
const domains = ref<Domain[]>([])
const sysdomains = ref<Sysdomain[]>([])
const projects = ref<Project[]>([])
const serverIp = ref<string>('')

// Modals
const showAddModal = ref(false)
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const showInstructionsModal = ref(false)

// Form states
const creating = ref(false)
const updating = ref(false)
const deleting = ref(false)
const checkingDns = ref(false)
const dnsStatus = ref<DnsStatus | null>(null)

// Add form
const addForm = ref({
    type: 'subdomain' as 'subdomain' | 'custom',
    textdomain: '',
    tld: 'de',
    sysdomain_id: null as number | null,
    project_id: null as number | null,
    description: ''
})

// Edit form
const editForm = ref({
    id: 0,
    domainname: '',
    project_id: null as number | null,
    description: ''
})

// Delete target
const deleteTarget = ref<Domain | null>(null)

// Computed
const selectedSysdomain = computed(() => {
    if (!addForm.value.sysdomain_id) return null
    return sysdomains.value.find((sd: Sysdomain) => sd.id === addForm.value.sysdomain_id)
})

const previewDomainname = computed(() => {
    if (!addForm.value.textdomain || !selectedSysdomain.value) return '...'
    return `${addForm.value.textdomain}.${selectedSysdomain.value.fullDomain}`
})

const previewCustomDomain = computed(() => {
    if (!addForm.value.textdomain) return '...'
    return `${addForm.value.textdomain}.${addForm.value.tld}`
})

const canCreateSubdomain = computed(() => {
    return addForm.value.textdomain &&
        addForm.value.sysdomain_id &&
        /^[a-z0-9_]+$/.test(addForm.value.textdomain)
})

const canCreateCustom = computed(() => {
    return addForm.value.textdomain && addForm.value.tld
})

const terminalCommand = computed(() => {
    const domain = previewCustomDomain.value
    const domaincode = projects.value.find((p: Project) => p.id === addForm.value.project_id)?.domaincode || 'PROJECT_CODE'
    return `sudo /opt/crearis/scripts/add-domain.sh ${domain} ${domaincode}`
})

const manualCommands = computed(() => {
    const domain = previewCustomDomain.value
    const domaincode = projects.value.find((p: Project) => p.id === addForm.value.project_id)?.domaincode || 'PROJECT_CODE'
    return `# Get SSL certificate
sudo certbot --nginx -d ${domain} -d www.${domain} --non-interactive --agree-tos

# Add to nginx map
echo '    ${domain}        "${domaincode}";' | sudo tee -a /etc/nginx/conf.d/domain-map.conf
echo '    www.${domain}    "${domaincode}";' | sudo tee -a /etc/nginx/conf.d/domain-map.conf

# Reload nginx
sudo nginx -t && sudo systemctl reload nginx`
})

// Methods
async function refreshData() {
    loading.value = true
    error.value = null

    try {
        const [domainsRes, sysdomainsRes, projectsRes] = await Promise.all([
            fetch('/api/admin/domains'),
            fetch('/api/admin/domains/sysdomains'),
            fetch('/api/projects')
        ])

        if (!domainsRes.ok) throw new Error('Failed to fetch domains')
        if (!sysdomainsRes.ok) throw new Error('Failed to fetch system domains')
        if (!projectsRes.ok) throw new Error('Failed to fetch projects')

        const domainsData = await domainsRes.json()
        const sysdomainsData = await sysdomainsRes.json()
        const projectsData = await projectsRes.json()

        domains.value = domainsData.domains || []
        sysdomains.value = sysdomainsData.sysdomains || []
        projects.value = projectsData || []

        // Try to get server IP
        try {
            const configRes = await fetch('/api/admin/domains/check-dns?domain=theaterpedia.org')
            if (configRes.ok) {
                const configData = await configRes.json()
                serverIp.value = configData.expectedIp || ''
            }
        } catch {
            // Ignore - serverIp will show placeholder
        }
    } catch (err) {
        error.value = (err as Error).message
    } finally {
        loading.value = false
    }
}

function closeAddModal() {
    showAddModal.value = false
    resetAddForm()
}

function resetAddForm() {
    addForm.value = {
        type: 'subdomain',
        textdomain: '',
        tld: 'de',
        sysdomain_id: null,
        project_id: null,
        description: ''
    }
    dnsStatus.value = null
}

async function createSubdomain() {
    if (!canCreateSubdomain.value) return

    creating.value = true
    try {
        const res = await fetch('/api/admin/domains', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                textdomain: addForm.value.textdomain,
                tld: selectedSysdomain.value?.tld,
                sysdomain_id: addForm.value.sysdomain_id,
                project_id: addForm.value.project_id,
                description: addForm.value.description || null
            })
        })

        if (!res.ok) {
            const data = await res.json()
            throw new Error(data.message || 'Failed to create subdomain')
        }

        await refreshData()
        closeAddModal()
    } catch (err) {
        alert((err as Error).message)
    } finally {
        creating.value = false
    }
}

async function checkDns() {
    if (!addForm.value.textdomain) return

    checkingDns.value = true
    dnsStatus.value = null

    try {
        const domain = previewCustomDomain.value
        const res = await fetch(`/api/admin/domains/check-dns?domain=${encodeURIComponent(domain)}`)

        if (!res.ok) throw new Error('DNS check failed')

        const data = await res.json()
        dnsStatus.value = {
            ready: data.ready,
            message: data.message,
            resolvedIps: data.dns?.resolvedIps
        }
    } catch (err) {
        dnsStatus.value = {
            ready: false,
            message: (err as Error).message
        }
    } finally {
        checkingDns.value = false
    }
}

function showSetupInstructions() {
    showInstructionsModal.value = true
}

function closeInstructionsModal() {
    showInstructionsModal.value = false
}

async function confirmCustomDomainSetup() {
    creating.value = true
    try {
        const res = await fetch('/api/admin/domains', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                textdomain: addForm.value.textdomain,
                tld: addForm.value.tld,
                sysdomain_id: null,
                project_id: addForm.value.project_id,
                description: addForm.value.description || null
            })
        })

        if (!res.ok) {
            const data = await res.json()
            throw new Error(data.message || 'Failed to register domain')
        }

        await refreshData()
        closeInstructionsModal()
        closeAddModal()
    } catch (err) {
        alert((err as Error).message)
    } finally {
        creating.value = false
    }
}

function copyCommand() {
    navigator.clipboard.writeText(terminalCommand.value)
    alert('Command copied to clipboard!')
}

function editDomain(domain: Domain) {
    editForm.value = {
        id: domain.id,
        domainname: domain.domainname,
        project_id: domain.project_id,
        description: domain.description || ''
    }
    showEditModal.value = true
}

function closeEditModal() {
    showEditModal.value = false
}

async function updateDomain() {
    updating.value = true
    try {
        const res = await fetch(`/api/admin/domains/${editForm.value.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                project_id: editForm.value.project_id,
                description: editForm.value.description || null
            })
        })

        if (!res.ok) {
            const data = await res.json()
            throw new Error(data.message || 'Failed to update domain')
        }

        await refreshData()
        closeEditModal()
    } catch (err) {
        alert((err as Error).message)
    } finally {
        updating.value = false
    }
}

function confirmDelete(domain: Domain) {
    deleteTarget.value = domain
    showDeleteModal.value = true
}

function closeDeleteModal() {
    showDeleteModal.value = false
    deleteTarget.value = null
}

async function deleteDomain() {
    if (!deleteTarget.value) return

    deleting.value = true
    try {
        const res = await fetch(`/api/admin/domains/${deleteTarget.value.id}`, {
            method: 'DELETE'
        })

        if (!res.ok) {
            const data = await res.json()
            throw new Error(data.message || 'Failed to delete domain')
        }

        await refreshData()
        closeDeleteModal()
    } catch (err) {
        alert((err as Error).message)
    } finally {
        deleting.value = false
    }
}

// Lifecycle
onMounted(() => {
    refreshData()
})
</script>

<style scoped>
.domains-admin {
    padding: 2rem;
    max-width: 1200px;
    margin: 0 auto;
}

.admin-header {
    margin-bottom: 2rem;
}

.admin-header h1 {
    font-size: 2rem;
    margin-bottom: 0.5rem;
}

.subtitle {
    color: var(--color-text-muted, #666);
}

.action-bar {
    display: flex;
    gap: 1rem;
    margin-bottom: 2rem;
}

.content-grid {
    display: grid;
    gap: 2rem;
}

.panel {
    background: var(--color-neutral-bg, #fff);
    border: 1px solid var(--color-border, #ddd);
    border-radius: 0.5rem;
    padding: 1.5rem;
}

.panel h2 {
    font-size: 1.25rem;
    margin-bottom: 1rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid var(--color-border, #eee);
}

/* Tables */
.domains-table {
    width: 100%;
    border-collapse: collapse;
}

.domains-table th,
.domains-table td {
    padding: 0.75rem;
    text-align: left;
    border-bottom: 1px solid var(--color-border, #eee);
}

.domains-table th {
    font-weight: 600;
    color: var(--color-text-muted, #666);
    font-size: 0.875rem;
}

.domain-name {
    font-weight: 600;
    display: block;
}

.domain-desc {
    font-size: 0.75rem;
    color: var(--color-text-muted, #666);
}

.type-badge {
    display: inline-block;
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    font-size: 0.75rem;
}

.type-badge.subdomain {
    background: var(--color-primary-bg, #e3f2fd);
    color: var(--color-primary, #1976d2);
}

.type-badge.custom {
    background: var(--color-accent-bg, #fff3e0);
    color: var(--color-accent, #e65100);
}

.project-link {
    color: var(--color-primary, #1976d2);
}

.text-muted {
    color: var(--color-text-muted, #999);
}

.actions {
    display: flex;
    gap: 0.5rem;
}

/* System Domains */
.sysdomains-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.sysdomain-item {
    padding: 0.75rem;
    background: var(--color-muted-bg, #f5f5f5);
    border-radius: 0.375rem;
}

.sysdomain-info {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.sysdomain-name {
    font-weight: 600;
}

.ssl-badge {
    font-size: 0.75rem;
    padding: 0.125rem 0.5rem;
    border-radius: 0.25rem;
    background: var(--color-positive-bg, #e8f5e9);
    color: var(--color-positive, #2e7d32);
}

.ssl-badge.warn {
    background: var(--color-warning-bg, #fff3e0);
    color: var(--color-warning, #e65100);
}

.sysdomain-desc {
    font-size: 0.75rem;
    color: var(--color-text-muted, #666);
    margin-top: 0.25rem;
}

/* Modal */
.modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
}

.modal {
    background: var(--color-neutral-bg, #fff);
    border-radius: 0.5rem;
    width: 90%;
    max-width: 500px;
    max-height: 90vh;
    overflow-y: auto;
}

.modal-large {
    max-width: 700px;
}

.modal-small {
    max-width: 400px;
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.5rem;
    border-bottom: 1px solid var(--color-border, #eee);
}

.modal-header h3 {
    margin: 0;
}

.close-btn {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: var(--color-text-muted, #666);
}

.modal-body {
    padding: 1.5rem;
}

/* Forms */
.form-group {
    margin-bottom: 1rem;
}

.form-group label {
    display: block;
    font-weight: 500;
    margin-bottom: 0.5rem;
}

.form-input,
.form-select {
    width: 100%;
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--color-border, #ddd);
    border-radius: 0.375rem;
    font-size: 1rem;
}

.form-hint {
    font-size: 0.75rem;
    color: var(--color-text-muted, #666);
}

.radio-group {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.radio-option {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 0.75rem;
    border: 1px solid var(--color-border, #ddd);
    border-radius: 0.375rem;
    cursor: pointer;
    transition: border-color 0.2s;
}

.radio-option.active {
    border-color: var(--color-primary, #1976d2);
    background: var(--color-primary-bg, #e3f2fd);
}

.radio-option input {
    margin-top: 0.25rem;
}

.radio-label {
    display: flex;
    flex-direction: column;
}

.radio-label small {
    color: var(--color-text-muted, #666);
}

.input-with-suffix {
    display: flex;
    align-items: center;
}

.input-with-suffix .form-input {
    border-radius: 0.375rem 0 0 0.375rem;
    flex: 1;
}

.input-suffix {
    padding: 0.5rem 0.75rem;
    background: var(--color-muted-bg, #f5f5f5);
    border: 1px solid var(--color-border, #ddd);
    border-left: none;
    border-radius: 0 0.375rem 0.375rem 0;
    color: var(--color-text-muted, #666);
}

.tld-select {
    width: auto;
    border-radius: 0 0.375rem 0.375rem 0;
}

.preview-box {
    padding: 0.75rem;
    background: var(--color-muted-bg, #f5f5f5);
    border-radius: 0.375rem;
    margin-bottom: 1rem;
}

.preview-box code {
    font-size: 1.125rem;
    color: var(--color-primary, #1976d2);
}

.form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    margin-top: 1.5rem;
}

/* DNS Check */
.dns-check-section {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1rem;
}

.dns-status {
    padding: 0.5rem 0.75rem;
    border-radius: 0.375rem;
}

.dns-status.ready {
    background: var(--color-positive-bg, #e8f5e9);
    color: var(--color-positive, #2e7d32);
}

.dns-status.not-ready {
    background: var(--color-negative-bg, #ffebee);
    color: var(--color-negative, #c62828);
}

/* Instructions */
.instructions-body {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.instruction-step {
    padding: 1rem;
    background: var(--color-muted-bg, #f5f5f5);
    border-radius: 0.5rem;
}

.instruction-step h4 {
    margin-bottom: 0.75rem;
}

.dns-table {
    width: 100%;
    margin: 0.75rem 0;
    border-collapse: collapse;
}

.dns-table th,
.dns-table td {
    padding: 0.5rem;
    border: 1px solid var(--color-border, #ddd);
    text-align: left;
}

.dns-check-inline {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-top: 0.75rem;
}

.dns-inline-status {
    font-weight: 500;
}

.dns-inline-status.ready {
    color: var(--color-positive, #2e7d32);
}

.dns-inline-status.not-ready {
    color: var(--color-negative, #c62828);
}

.code-block {
    position: relative;
    background: #1e1e1e;
    color: #d4d4d4;
    padding: 1rem;
    border-radius: 0.375rem;
    overflow-x: auto;
}

.code-block pre {
    margin: 0;
    font-family: 'Fira Code', monospace;
    font-size: 0.875rem;
    white-space: pre-wrap;
}

.copy-btn {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    padding: 0.25rem 0.5rem;
    background: #333;
    color: #fff;
    border: none;
    border-radius: 0.25rem;
    cursor: pointer;
    font-size: 0.75rem;
}

.copy-btn:hover {
    background: #444;
}

.manual-steps {
    margin-top: 0.75rem;
}

.manual-steps summary {
    cursor: pointer;
    color: var(--color-primary, #1976d2);
}

/* Buttons */
.btn {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 0.375rem;
    cursor: pointer;
    font-size: 0.875rem;
    font-weight: 500;
    transition: opacity 0.2s;
}

.btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.btn-primary {
    background: var(--color-primary, #1976d2);
    color: white;
}

.btn-secondary {
    background: var(--color-muted-bg, #e0e0e0);
    color: var(--color-text, #333);
}

.btn-success {
    background: var(--color-positive, #2e7d32);
    color: white;
}

.btn-danger {
    background: var(--color-negative, #c62828);
    color: white;
}

.btn-sm {
    padding: 0.25rem 0.5rem;
    font-size: 0.75rem;
}

.btn-large {
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
}

/* States */
.loading-state,
.error-state,
.empty-state {
    padding: 2rem;
    text-align: center;
    color: var(--color-text-muted, #666);
}

.error-state {
    color: var(--color-negative, #c62828);
}

.warning-text {
    color: var(--color-warning, #e65100);
    font-size: 0.875rem;
}

.domain-display {
    display: block;
    font-size: 1.125rem;
    padding: 0.5rem;
    background: var(--color-muted-bg, #f5f5f5);
    border-radius: 0.375rem;
}
</style>
