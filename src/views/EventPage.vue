<!--
  EventPage.vue - Single event view with page configuration
  
  TODO v0.5 (Odoo Integration):
  - Implement slug-from-xmlid for SEO-friendly URLs
  - Current implementation uses numeric IDs: /sites/:domaincode/events/:id
  - Target URL pattern: /sites/:domaincode/events/:slug
  - Slug derivation: xmlid.split('.').pop() → e.g., "dasei.event-workshop-2024" → "event-workshop-2024"
-->
<template>
    <div class="event-page">
        <!-- Edit Panel -->
        <EditPanel v-if="event" :is-open="isEditPanelOpen" :title="`Edit ${event.name || 'Event'}`"
            subtitle="Update event information" :data="editPanelData" entity-type="events"
            :projectDomaincode="event.domaincode" @close="closeEditPanel" @save="handleSaveEvent" />

        <!-- Page Config Panel (for admins/owners) -->
        <div v-if="showConfigPanel" class="config-panel-overlay" @click.self="closeConfigPanel">
            <div class="config-panel-container">
                <button class="close-panel-btn" @click="closeConfigPanel">&times;</button>
                <PageConfigController :project="projectId" type="events" mode="pages" />
            </div>
        </div>

        <!-- PageLayout wrapper with PageHeading in header slot -->
        <PageLayout v-if="event" :asideOptions="asideOptions" :footerOptions="footerOptions" :projectId="projectId"
            :navItems="navigationItems">
            <template #header>
                <PageHeading :heading="event.name || String(event.id)"
                    :imgTmp="event.img_wide?.url || event.cimg || 'https://picsum.photos/1440/900?random=event'"
                    :headerType="event.header_type || 'banner'" :headerSize="'prominent'" />
            </template>

            <!-- Tag Families Row -->
            <Section v-if="event.ttags || event.ctags || event.dtags" background="muted" spacing="compact">
                <Container>
                    <TagFamilies v-model:ttags="event.ttags" v-model:ctags="event.ctags" v-model:dtags="event.dtags"
                        :status="event.status" :config="event.config" :enable-edit="canEdit" group-selection="core"
                        layout="wrap" @update:ttags="handleUpdateTags('ttags', $event)"
                        @update:ctags="handleUpdateTags('ctags', $event)"
                        @update:dtags="handleUpdateTags('dtags', $event)" />
                </Container>
            </Section>

            <!-- Event Content Section -->
            <Section background="default">
                <Container>
                    <Prose>
                        <!-- Event metadata -->
                        <div class="event-meta">
                            <div v-if="event.status" class="event-status">
                                <StatusBadge :value="statusValueString" :label="statusLabel" variant="soft"
                                    size="medium" />
                            </div>
                            
                            <!-- Event-specific: Date & Time -->
                            <div v-if="event.date_begin || event.date_end" class="event-datetime">
                                <p><strong>📅 Datum:</strong> {{ formatEventDate() }}</p>
                                <p v-if="eventTime"><strong>🕐 Zeit:</strong> {{ eventTime }}</p>
                            </div>
                            
                            <!-- Event-specific: Location -->
                            <p v-if="event.location_name || event.location"><strong>📍 Ort:</strong> {{ event.location_name || event.location }}</p>
                            
                            <!-- Event-specific: Instructor -->
                            <p v-if="event.instructor_name"><strong>👤 Leitung:</strong> {{ event.instructor_name }}</p>
                            
                            <!-- Event Type -->
                            <p v-if="event.event_type"><strong>Typ:</strong> {{ event.event_type }}</p>
                        </div>

                        <!-- StatusBadge / StatusEditor -->
                        <div v-if="event && project" class="event-status-editor">
                            <PostStatusBadge :post="eventDataForPermissions" :project="projectDataForPermissions"
                                :membership="null" @status-changed="handleStatusChange"
                                @scope-changed="handleStatusChange" @trash="handleTrash" @restore="handleRestore"
                                @error="handleStatusError" />
                        </div>

                        <!-- Admin/Owner Controls -->
                        <div v-if="canEdit" class="event-controls">
                            <button class="icon-btn" @click="openEditPanel" title="Edit Event">
                                <svg fill="currentColor" height="20" viewBox="0 0 256 256" width="20"
                                    xmlns="http://www.w3.org/2000/svg">
                                    <path
                                        d="M227.31,73.37,182.63,28.68a16,16,0,0,0-22.63,0L36.69,152A15.86,15.86,0,0,0,32,163.31V208a16,16,0,0,0,16,16H92.69A15.86,15.86,0,0,0,104,219.31L227.31,96a16,16,0,0,0,0-22.63ZM92.69,208H48V163.31l88-88L180.69,120ZM192,108.68,147.31,64l24-24L216,84.68Z">
                                    </path>
                                </svg>
                            </button>
                            <button class="icon-btn" @click="openConfigPanel" title="Configure Page Layout">
                                <svg fill="currentColor" height="20" viewBox="0 0 256 256" width="20"
                                    xmlns="http://www.w3.org/2000/svg">
                                    <path
                                        d="M128,80a48,48,0,1,0,48,48A48.05,48.05,0,0,0,128,80Zm0,80a32,32,0,1,1,32-32A32,32,0,0,1,128,160Zm88-29.84q.06-2.16,0-4.32l14.92-18.64a8,8,0,0,0,1.48-7.06,107.6,107.6,0,0,0-10.88-26.25,8,8,0,0,0-6-3.93l-23.72-2.64q-1.48-1.56-3-3L186,40.54a8,8,0,0,0-3.94-6,107.29,107.29,0,0,0-26.25-10.86,8,8,0,0,0-7.06,1.48L130.16,40Q128,40,125.84,40L107.2,25.11a8,8,0,0,0-7.06-1.48A107.6,107.6,0,0,0,73.89,34.51a8,8,0,0,0-3.93,6L67.32,64.27q-1.56,1.49-3,3L40.54,70a8,8,0,0,0-6,3.94,107.71,107.71,0,0,0-10.87,26.25,8,8,0,0,0,1.49,7.06L40,125.84Q40,128,40,130.16L25.11,148.8a8,8,0,0,0-1.48,7.06,107.6,107.6,0,0,0,10.88,26.25,8,8,0,0,0,6,3.93l23.72,2.64q1.49,1.56,3,3L70,215.46a8,8,0,0,0,3.94,6,107.71,107.71,0,0,0,26.25,10.87,8,8,0,0,0,7.06-1.49L125.84,216q2.16.06,4.32,0l18.64,14.92a8,8,0,0,0,7.06,1.48,107.21,107.21,0,0,0,26.25-10.88,8,8,0,0,0,3.93-6l2.64-23.72q1.56-1.48,3-3L215.46,186a8,8,0,0,0,6-3.94,107.71,107.71,0,0,0,10.87-26.25,8,8,0,0,0-1.49-7.06Zm-16.1-6.5a73.93,73.93,0,0,1,0,8.68,8,8,0,0,0,1.74,5.48l14.19,17.73a91.57,91.57,0,0,1-6.23,15L187,173.11a8,8,0,0,0-5.1,2.64,74.11,74.11,0,0,1-6.14,6.14,8,8,0,0,0-2.64,5.1l-2.51,22.58a91.32,91.32,0,0,1-15,6.23l-17.74-14.19a8,8,0,0,0-5-1.75h-.48a73.93,73.93,0,0,1-8.68,0,8.06,8.06,0,0,0-5.48,1.74L100.45,215.8a91.57,91.57,0,0,1-15-6.23L82.89,187a8,8,0,0,0-2.64-5.1,74.11,74.11,0,0,1-6.14-6.14,8,8,0,0,0-5.1-2.64L46.43,170.6a91.32,91.32,0,0,1-6.23-15l14.19-17.74a8,8,0,0,0,1.74-5.48,73.93,73.93,0,0,1,0-8.68,8,8,0,0,0-1.74-5.48L40.2,100.45a91.57,91.57,0,0,1,6.23-15L69,82.89a8,8,0,0,0,5.1-2.64,74.11,74.11,0,0,1,6.14-6.14A8,8,0,0,0,82.89,69L85.4,46.43a91.32,91.32,0,0,1,15-6.23l17.74,14.19a8,8,0,0,0,5.48,1.74,73.93,73.93,0,0,1,8.68,0,8.06,8.06,0,0,0,5.48-1.74L155.55,40.2a91.57,91.57,0,0,1,15,6.23L173.11,69a8,8,0,0,0,2.64,5.1,74.11,74.11,0,0,1,6.14,6.14,8,8,0,0,0,5.1,2.64l22.58,2.51a91.32,91.32,0,0,1,6.23,15l-14.19,17.74A8,8,0,0,0,199.87,123.66Z">
                                    </path>
                                </svg>
                            </button>
                        </div>
                        
                        <!-- Teaser -->
                        <p v-if="event.teaser" class="event-teaser">{{ event.teaser }}</p>

                        <!-- Event HTML or Markdown content -->
                        <div v-if="event.html" v-html="event.html" class="event-html-content"></div>
                        <div v-else-if="event.md" class="event-markdown-content">{{ event.md }}</div>
                        <p v-else><em>No description available for this event.</em></p>
                        
                        <!-- Registration CTA (if event allows registration) -->
                        <div v-if="event.seats_max && event.seats_max > 0" class="event-registration">
                            <div class="registration-info">
                                <span v-if="event.seats_available > 0">
                                    {{ event.seats_available }} von {{ event.seats_max }} Plätzen verfügbar
                                </span>
                                <span v-else class="sold-out">Ausgebucht</span>
                            </div>
                            <button v-if="event.seats_available > 0" class="register-btn">
                                Jetzt anmelden
                            </button>
                        </div>
                    </Prose>
                </Container>
            </Section>
        </PageLayout>

        <!-- Fallback for when event is not loaded -->
        <PageLayout v-else>
            <template #header>
                <Section>
                    <Container>
                        <Prose>
                            <h1>Event Not Found</h1>
                            <p>The requested event could not be loaded.</p>
                        </Prose>
                    </Container>
                </Section>
            </template>
            <Section>
                <Container>
                    <Prose>
                        <p><a :href="`/sites/${domaincode}`">Return to Project</a></p>
                    </Prose>
                </Container>
            </Section>
        </PageLayout>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import PageLayout from '@/components/PageLayout.vue'
import PageHeading from '@/components/PageHeading.vue'
import EditPanel from '@/components/EditPanel.vue'
import PageConfigController from '@/components/PageConfigController.vue'
import StatusBadge from '@/components/sysreg/StatusBadge.vue'
import PostStatusBadge from '@/components/PostStatusBadge.vue'
import TagFamilies from '@/components/sysreg/TagFamilies.vue'
import Prose from '@/components/Prose.vue'
import Section from '@/components/Section.vue'
import Container from '@/components/Container.vue'
import type { EditPanelData } from '@/components/EditPanel.vue'
import { sanitizeStatusVal, bufferToHex, getStatusLabel } from '@/composables/useSysreg'
import { parseAsideOptions, parseFooterOptions, type AsideOptions, type FooterOptions } from '@/composables/usePageOptions'
import { formatDateTime } from '@/plugins/dateTimeFormat'

const router = useRouter()
const route = useRoute()
const { user, checkSession, isLoading: authLoading } = useAuth()

// State
const event = ref<any>(null)
const project = ref<any>(null)
const projectId = ref<number | null>(null)
const domaincode = ref<string>('')
const isEditPanelOpen = ref(false)
const showConfigPanel = ref(false)

// Computed
const canEdit = computed(() => {
    if (!user.value) return false
    if (user.value.role === 'admin') return true
    if (user.value.activeRole === 'project' && projectId.value) {
        return true // Simplified - should check ownership
    }
    return false
})

// Navigation items
const navigationItems = computed(() => {
    const items = [
        {
            label: 'Project',
            link: `/sites/${domaincode.value}`
        }
    ]

    if (user?.value?.activeRole === 'project') {
        items.unshift({
            label: 'Back to Dashboard',
            link: `/projects/${domaincode.value}/agenda`
        })
    }

    return items
})

// Parse options for PageLayout from event data
const asideOptions = computed<AsideOptions>(() => {
    if (!event.value) return {}
    return parseAsideOptions({
        aside_postit: event.value.aside_options,
        aside_toc: event.value.aside_toc,
        aside_list: event.value.aside_list,
        aside_context: event.value.aside_context
    })
})

const footerOptions = computed<FooterOptions>(() => {
    if (!event.value) return {}
    return parseFooterOptions({
        footer_gallery: event.value.footer_gallery,
        footer_postit: event.value.footer_options,
        footer_slider: event.value.footer_slider,
        footer_repeat: event.value.footer_repeat
    })
})

// Convert status_val to hex string and get label
const statusValueString = computed(() => {
    if (!event.value?.status) return null
    return bufferToHex(event.value.status)
})

const statusLabel = computed(() => {
    const hex = statusValueString.value
    if (!hex) return ''
    return getStatusLabel(hex, 'events')
})

// Event-specific: formatted time
const eventTime = computed(() => {
    if (!event.value?.date_begin) return ''
    try {
        const date = new Date(event.value.date_begin)
        return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
    } catch {
        return ''
    }
})

const editPanelData = computed((): EditPanelData => {
    if (!event.value) return { heading: '', teaser: '', md: '' }
    return {
        heading: event.value.name || '',
        teaser: event.value.teaser || '',
        md: event.value.md || '',
        img_id: event.value.img_id || null,
        header_type: event.value.header_type || 'banner',
        header_size: event.value.header_size || null,
        status: event.value.status || null
    }
})

// Computed data for StatusBadge (reusing PostStatusBadge pattern)
const eventDataForPermissions = computed(() => {
    if (!event.value) return { id: 0, owner_id: 0, status: 1, project_id: 0 }
    const status = event.value.status || 1
    return {
        id: event.value.id,
        owner_id: event.value.owner_id || 0,
        creator_id: event.value.creator_id || 0,
        creator_sysmail: event.value.creator_sysmail || '',
        status: status,
        project_id: event.value.project_id || projectId.value || 0
    }
})

const projectDataForPermissions = computed(() => {
    if (!project.value) return { id: 0, owner_sysmail: '', status: 0 }
    return {
        id: project.value.id,
        owner_sysmail: project.value.owner_sysmail || '',
        owner_id: project.value.owner_id || 0,
        status: project.value.status || 0,
        team_size: project.value.team_size
    }
})

// Methods
async function loadEvent() {
    const eventId = route.params.id
    domaincode.value = route.params.domaincode as string

    console.log('[EventPage] Loading event:', { eventId, domaincode: domaincode.value })

    try {
        // First, get project by domaincode to get project_id
        const projectRes = await fetch(`/api/projects/${domaincode.value}`)
        if (!projectRes.ok) throw new Error('Project not found')
        const projectData = await projectRes.json()
        project.value = projectData
        projectId.value = projectData.id

        // Load event
        const response = await fetch(`/api/events/${eventId}`)
        if (!response.ok) throw new Error('Failed to load event')
        const data = await response.json()
        event.value = data.event || data
        console.log('[EventPage] Event loaded successfully!')
    } catch (error) {
        console.error('[EventPage] Error loading event:', error)
    }
}

function formatEventDate(): string {
    if (!event.value?.date_begin) return ''
    return formatDateTime({
        start: event.value.date_begin,
        end: event.value.date_end,
        format: 'standard',
        rows: '1or2',
        showTime: false
    })
}

function openEditPanel() {
    isEditPanelOpen.value = true
}

function closeEditPanel() {
    isEditPanelOpen.value = false
}

function openConfigPanel() {
    showConfigPanel.value = true
}

function closeConfigPanel() {
    showConfigPanel.value = false
}

function handleStatusChange(newStatus: number) {
    console.log('[EventPage] Status changed to:', newStatus)
    if (typeof newStatus !== 'number') {
        console.error('[EventPage] Invalid status type:', typeof newStatus)
        return
    }
    if (event.value) {
        event.value.status = newStatus
    }
}

async function handleTrash() {
    console.log('[EventPage] Trash requested')
    await handleStatusChange(65536)
}

async function handleRestore() {
    console.log('[EventPage] Restore requested')
    await handleStatusChange(64)
}

function handleStatusError(error: string) {
    console.error('[EventPage] Status Editor error:', error)
}

async function handleUpdateTags(family: string, value: number) {
    try {
        console.log(`[EventPage] Updating ${family} to ${value}`)
        const response = await fetch(`/api/events/${event.value.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ [family]: value })
        })

        if (!response.ok) throw new Error(`Failed to update ${family}`)
        if (event.value) {
            event.value[family] = value
        }
        console.log(`[EventPage] Successfully updated ${family}`)
    } catch (error) {
        console.error(`[EventPage] Error updating ${family}:`, error)
    }
}

async function handleSaveEvent(data: Record<string, any>) {
    console.log('[EventPage] handleSaveEvent called:', data)

    try {
        let html = ''
        if (data.md) {
            const { marked } = await import('marked')
            html = await marked(data.md) as string
        }

        const payload = {
            name: data.heading || '',
            teaser: data.teaser || '',
            md: data.md || '',
            html: html || '',
            img_id: (data.img_id === undefined || data.img_id === 0) ? null : data.img_id,
            header_type: data.header_type || 'banner',
            header_size: data.header_size || null,
            status: sanitizeStatusVal(data.status),
            ttags: data.ttags || '\\x00',
            ctags: data.ctags || '\\x00',
            dtags: data.dtags || '\\x00'
        }

        const response = await fetch(`/api/events/${event.value.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            throw new Error(errorData?.message || 'Failed to save event')
        }

        await loadEvent()
        closeEditPanel()
    } catch (error: any) {
        console.error('[EventPage] Error saving event:', error)
        alert(`Failed to save event: ${error?.message || 'Unknown error'}`)
    }
}

onMounted(async () => {
    await checkSession()
    loadEvent()
})
</script>

<style scoped>
.event-page {
    min-height: 100vh;
    background: var(--color-neutral-bg);
}

.event-meta {
    margin-bottom: 2rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid var(--color-border);
    font-family: var(--headings);
}

.event-status {
    margin-bottom: 1rem;
}

.event-datetime {
    margin: 1rem 0;
}

.event-datetime p {
    margin: 0.25rem 0;
}

.event-teaser {
    font-size: 1.125rem;
    font-weight: 500;
    color: hsl(var(--color-dimmed));
    margin-bottom: 1.5rem;
}

.event-controls {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 2rem;
}

.icon-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.5rem;
    background: var(--color-accent-bg);
    color: var(--color-accent-contrast);
    border: none;
    border-radius: 0.375rem;
    cursor: pointer;
    transition: opacity 0.2s;
}

.icon-btn:hover {
    opacity: 0.9;
}

.event-html-content {
    line-height: 1.7;
}

.event-markdown-content {
    white-space: pre-wrap;
    line-height: 1.7;
}

/* Registration Section */
.event-registration {
    margin-top: 2rem;
    padding: 1.5rem;
    background: hsl(var(--color-primary-bg));
    border-radius: var(--radius-medium);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
}

.registration-info {
    font-weight: 500;
    color: hsl(var(--color-primary-contrast));
}

.sold-out {
    color: hsl(var(--color-negative-base));
}

.register-btn {
    padding: 0.75rem 1.5rem;
    background: hsl(var(--color-primary-base));
    color: hsl(var(--color-primary-contrast));
    border: none;
    border-radius: var(--radius-medium);
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s;
}

.register-btn:hover {
    background: hsl(var(--color-primary-hover));
}

.config-panel-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
}

.config-panel-container {
    position: relative;
    width: 100%;
    max-width: 1200px;
    height: 90vh;
    background: var(--color-card-bg);
    border-radius: 0.75rem;
    overflow: hidden;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

.close-panel-btn {
    position: absolute;
    top: 1rem;
    right: 1rem;
    width: 2.5rem;
    height: 2.5rem;
    background: var(--color-muted-bg);
    color: var(--color-muted-contrast);
    border: none;
    border-radius: 50%;
    font-size: 1.5rem;
    cursor: pointer;
    z-index: 10;
    transition: opacity 0.2s;
}

.close-panel-btn:hover {
    opacity: 0.8;
}
</style>
