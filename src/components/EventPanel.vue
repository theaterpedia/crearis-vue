<template>
    <div class="add-event-panel">
        <!-- Component Header -->
        <div class="panel-header">
            <div class="dropdown-wrapper" ref="dropdownRef">
                <button class="add-event-btn" @click="toggleDropdown" :disabled="!baseEvents.length">
                    <svg fill="currentColor" height="20" viewBox="0 0 256 256" width="20"
                        xmlns="http://www.w3.org/2000/svg">
                        <path
                            d="M224,128a8,8,0,0,1-8,8H136v80a8,8,0,0,1-16,0V136H40a8,8,0,0,1,0-16h80V40a8,8,0,0,1,16,0v80h80A8,8,0,0,1,224,128Z">
                        </path>
                    </svg>
                    <span>Add Event</span>
                </button>

                <EventsDropdown v-if="isDropdownOpen" :events="baseEvents"
                    :selected-event-id="selectedEvent?.id || null" header-text="Basis-Veranstaltung wählen"
                    :show-check-mark="false" @select="selectBaseEvent" />
            </div>
        </div>

        <!-- Preview Card (disabled by default) -->
        <div v-if="selectedEvent" class="preview-section">
            <div class="section-header">
                <div class="section-label">Vorschau</div>
                <button class="delete-btn" @click="handleClearSelection" title="Auswahl aufheben">
                    <svg fill="currentColor" height="16" viewBox="0 0 256 256" width="16"
                        xmlns="http://www.w3.org/2000/svg">
                        <path
                            d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z">
                        </path>
                    </svg>
                </button>
            </div>
            <pGallery entity="events" :project="projectId" size="medium"
                :filter-ids="selectedEvent ? [selectedEvent.id] : []" item-type="card" :anatomy="'topimage'" />
        </div>

        <!-- Action Area (disabled by default) -->
        <div v-if="selectedEvent" class="action-section">
            <div class="section-label">Anpassen</div>

            <div class="form-group">
                <label class="form-label">Creator</label>
                <select v-model="selectedOwner" class="form-select">
                    <option value="">Creator wählen</option>
                    <option v-for="user in projectUsers" :key="user.id" :value="user.id">
                        {{ user.username }}
                    </option>
                </select>
                <small v-if="projectUsersLoading" class="form-hint">Lade Projekt-Mitglieder...</small>
            </div>

            <div class="form-group">
                <label class="form-label">Event Type</label>
                <select v-model="selectedEventType" class="form-select">
                    <option value="workshop">Workshop</option>
                    <option value="project">Project</option>
                    <option value="course">Course</option>
                    <option value="conference">Conference</option>
                    <option value="online">Online</option>
                    <option value="meeting">Meeting</option>
                </select>
            </div>

            <DateRangeEdit start-label="Beginn" end-label="Ende" type="datetime" :stacked="false" size="medium"
                v-model:start="dateBegin" v-model:end="dateEnd" />

            <div class="form-group">
                <label class="form-label">Location</label>
                <DropdownList entity="locations" title="Ort wählen" size="small" width="medium" :dataMode="true"
                    :multiSelect="false" v-model:selectedIds="selectedLocation" />
            </div>

            <div class="form-group">
                <label class="form-label">Name</label>
                <input v-model="customName" type="text" class="form-input" placeholder="Event-Name" />
            </div>

            <div class="form-group">
                <label class="form-label">Teaser</label>
                <textarea v-model="customTeaser" class="form-textarea" rows="3"
                    placeholder="Event-Beschreibung"></textarea>
            </div>

            <div class="form-group">
                <label class="form-label">Cover Image</label>
                <DropdownList entity="images" title="Select Cover Image" :project="projectId" size="small"
                    width="medium" :dataMode="true" :multiSelect="false" v-model:selectedIds="selectedImageId"
                    :displayXml="true" />
            </div>

            <!-- Header Settings -->
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Header Type</label>
                    <select v-model="selectedHeaderType" class="form-select">
                        <option value="cover">Cover (centered)</option>
                        <option value="banner">Banner (top-aligned)</option>
                        <option value="columns">Columns (side-by-side)</option>
                        <option value="simple">Simple (no image)</option>
                        <option value="bauchbinde">Bauchbinde</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Header Size</label>
                    <select v-model="selectedHeaderSize" class="form-select">
                        <option value="mini">Mini (25%)</option>
                        <option value="medium">Medium (50%)</option>
                        <option value="prominent">Prominent (75%)</option>
                        <option value="full">Full (100%)</option>
                    </select>
                </div>
            </div>

            <TagFamilies v-model:ttags="ttags" v-model:ctags="ctags" :enable-edit="['ttags', 'ctags']" layout="row" />

            <div class="action-buttons">
                <button class="cancel-btn" @click="handleCancel" :disabled="isSubmitting">
                    Abbrechen
                </button>
                <button class="apply-btn" @click="handleApply" :disabled="!canApply || isSubmitting">
                    <span v-if="isSubmitting" class="btn-spinner"></span>
                    <span>{{ isSubmitting ? 'Wird erstellt...' : 'Hinzufügen' }}</span>
                </button>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import HeadingParser from '@/components/HeadingParser.vue'
import pGallery from '@/components/page/pGallery.vue'
import EventsDropdown from '@/components/EventsDropdown.vue'
import DateRangeEdit from '@/components/DateRangeEdit.vue'
import TagFamilies from '@/components/sysreg/TagFamilies.vue'
import { DropdownList } from '@/components/clist'
import type { Event, Instructor, Partner } from '@/types'

interface ProjectUser {
    id: number
    username: string
    role?: string
}

interface Props {
    projectId: string
    baseEvents: Event[]
    allInstructors?: Instructor[]  // Legacy support (kept for backward compatibility)
    allPartners?: Partner[]  // New unified type (instructors)
    allLocations?: Location[]  // Legacy support
    locationPartners?: Partner[]  // New unified type (locations)
    addOnly?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    addOnly: true
})

const emit = defineEmits<{
    eventAdded: [eventId: string]
}>()

/**
 * Generate a URL-safe slug from a title string
 * Used for xmlid format: {domaincode}.{entity}.{slug}
 */
function generateSlug(title: string): string {
    return title
        .toLowerCase()
        .trim()
        // Replace German umlauts
        .replace(/ä/g, 'ae')
        .replace(/ö/g, 'oe')
        .replace(/ü/g, 'ue')
        .replace(/ß/g, 'ss')
        // Replace spaces and special characters with underscores
        .replace(/[\s\-]+/g, '_')
        // Remove any remaining non-alphanumeric characters except underscores
        .replace(/[^a-z0-9_]/g, '')
        // Remove consecutive underscores
        .replace(/_+/g, '_')
        // Remove leading/trailing underscores
        .replace(/^_|_$/g, '')
        // Limit length to keep xmlid manageable
        .substring(0, 50)
}

/**
 * Determine entity qualifier from ctags bitmask
 * Priority: Realisierung (online/hybrid) > Format (kurs/projekt/konferenz)
 * 
 * CTAGS bit allocation (from migration 038):
 * - Realisierung (bits 0-4): präsenz=1, online=2, hybrid=4|8|12
 * - Format (bits 5-15): workshop=32, kurs=256, projekt=2048, konferenz=16384
 */
function getEventEntityFromCtags(ctagsValue: number): string {
    // Step 1: Check Realisierung first (priority)
    // online: bit 1 (value 2)
    if ((ctagsValue & 2) === 2) return 'event_online'
    // hybrid: bits 2-4 (values 4, 8, 12)
    if ((ctagsValue & 4) === 4) return 'event_hybrid'

    // Step 2: Check Format (fallback)
    // kurs: bit 8 (value 256)
    if ((ctagsValue & 256) === 256) return 'event_kurs'
    // projekt: bit 11 (value 2048)
    if ((ctagsValue & 2048) === 2048) return 'event_projekt'
    // konferenz: bit 14 (value 16384)
    if ((ctagsValue & 16384) === 16384) return 'event_konferenz'

    // Default: plain event
    return 'event'
}

// Unified access - prefer partners, fall back to legacy types
const allInstructors = computed(() => {
    if (props.allPartners && props.allPartners.length > 0) {
        // Filter partners with instructor bit set (partner_types & 1 = 1)
        return props.allPartners.filter(p => (p.partner_types & 1) === 1)
    }
    return props.allInstructors || []
})

const dropdownRef = ref<HTMLElement | null>(null)
const isDropdownOpen = ref(false)
const selectedEvent = ref<Event | null>(null)
const selectedOwner = ref<number | ''>('')
const selectedEventType = ref('workshop')

// Project users state (like AddPostPanel)
const projectUsers = ref<ProjectUser[]>([])
const projectUsersLoading = ref(false)

// Fetch project users when component mounts or projectId changes
async function loadProjectUsers() {
    if (!props.projectId) return

    projectUsersLoading.value = true
    try {
        const response = await fetch(`/api/users?project_id=${props.projectId}`)
        if (!response.ok) {
            throw new Error(`Failed to load project users: ${response.statusText}`)
        }
        projectUsers.value = await response.json()
    } catch (err) {
        console.error('Error loading project users:', err)
        projectUsers.value = []
    } finally {
        projectUsersLoading.value = false
    }
}

// Watch for projectId changes
watch(() => props.projectId, () => {
    loadProjectUsers()
    loadProjectDefaults()
}, { immediate: true })

// Load header configs on mount
onMounted(() => {
    loadHeaderConfigs()
})

const selectedLocation = ref<number | null>(null)
const dateBegin = ref('')
const dateEnd = ref('')
const customName = ref('')
const customTeaser = ref('')
const isSubmitting = ref(false)
const selectedImageId = ref<string[] | string | null>(null)
const ttags = ref(0)
const ctags = ref(0)

// Header settings (for cover/banner/size selection)
const selectedHeaderType = ref<string>('cover')
const selectedHeaderSize = ref<string>('prominent')

// Available header configs from API
const headerConfigs = ref<Array<{ name: string; parent_type: string; label_en: string; theme_id: number | null }>>([])

// Load project defaults for header settings
async function loadProjectDefaults() {
    if (!props.projectId) return

    try {
        const response = await fetch(`/api/projects/${props.projectId}`)
        if (response.ok) {
            const project = await response.json()
            // Use project defaults if available
            selectedHeaderType.value = project.default_event_header_type || 'cover'
            selectedHeaderSize.value = project.default_event_header_size || 'prominent'
        }
    } catch (err) {
        console.error('Error loading project defaults:', err)
    }
}

// Load available header configs
async function loadHeaderConfigs() {
    try {
        const response = await fetch('/api/header-configs')
        if (response.ok) {
            const data = await response.json()
            if (data.success && data.data) {
                headerConfigs.value = data.data
            }
        }
    } catch (err) {
        console.error('Error loading header configs:', err)
    }
}

const previewEvent = computed(() => {
    if (!selectedEvent.value) return null

    return {
        ...selectedEvent.value,
        name: customName.value || selectedEvent.value.name,
        teaser: customTeaser.value || selectedEvent.value.teaser,
        public_user: selectedOwner.value || selectedEvent.value.public_user,
        location: selectedLocation.value || selectedEvent.value.location
    }
})

const canApply = computed(() => {
    return selectedEvent.value && selectedOwner.value && selectedLocation.value && dateBegin.value && dateEnd.value && customName.value
})

const toggleDropdown = () => {
    isDropdownOpen.value = !isDropdownOpen.value
}

const selectBaseEvent = (event: Event) => {
    selectedEvent.value = event
    customName.value = event.name
    customTeaser.value = event.teaser || ''
    // Don't pre-select owner - let user choose from project members
    selectedOwner.value = ''
    selectedEventType.value = event.event_type || 'workshop'
    // Location is stored as partner ID (number)
    selectedLocation.value = event.location ? Number(event.location) : null

    // Populate dates from template - convert to datetime-local format if needed
    dateBegin.value = formatDateForInput(event.date_begin || '')
    dateEnd.value = formatDateForInput(event.date_end || '')

    isDropdownOpen.value = false
}

// Helper function to format date for datetime-local input
const formatDateForInput = (dateString: string): string => {
    if (!dateString) return ''

    try {
        // If it's already in datetime-local format (YYYY-MM-DDTHH:mm), return as-is
        if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(dateString)) {
            return dateString.substring(0, 16) // datetime-local format
        }

        // If it's a date-only format (YYYY-MM-DD), add default time
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
            return `${dateString}T09:00` // Add 9:00 AM as default
        }

        // Try to parse as Date and format
        const date = new Date(dateString)
        if (!isNaN(date.getTime())) {
            // Format as YYYY-MM-DDTHH:mm for datetime-local input
            const year = date.getFullYear()
            const month = String(date.getMonth() + 1).padStart(2, '0')
            const day = String(date.getDate()).padStart(2, '0')
            const hours = String(date.getHours()).padStart(2, '0')
            const minutes = String(date.getMinutes()).padStart(2, '0')
            return `${year}-${month}-${day}T${hours}:${minutes}`
        }
    } catch (e) {
        console.warn('Could not parse date:', dateString, e)
    }

    return ''
}

const handleCancel = () => {
    selectedEvent.value = null
    selectedOwner.value = ''
    selectedEventType.value = 'workshop'
    selectedLocation.value = null
    dateBegin.value = ''
    dateEnd.value = ''
    customName.value = ''
    customTeaser.value = ''
    selectedImageId.value = null
    // Reset tags to initial state
    ttags.value = 0
    ctags.value = 0
}

// Clear selection (same as cancel but clearer intent for delete button)
const handleClearSelection = () => handleCancel()

const handleApply = async () => {
    if (!canApply.value || !selectedEvent.value || isSubmitting.value) return

    // Validate constraints before submitting
    const validationErrors: string[] = []

    if (!selectedEvent.value) {
        validationErrors.push('Bitte wählen Sie eine Basis-Veranstaltung aus')
    }

    if (!selectedOwner.value) {
        validationErrors.push('Bitte wählen Sie einen Creator aus')
    }

    if (!selectedLocation.value) {
        validationErrors.push('Bitte wählen Sie einen Ort aus')
    }

    if (!dateBegin.value) {
        validationErrors.push('Bitte geben Sie ein Beginndatum ein')
    }

    if (!dateEnd.value) {
        validationErrors.push('Bitte geben Sie ein Enddatum ein')
    }

    // Validate date range if both dates are provided
    if (dateBegin.value && dateEnd.value) {
        const beginDate = new Date(dateBegin.value)
        const endDate = new Date(dateEnd.value)
        if (endDate <= beginDate) {
            validationErrors.push('Das Enddatum muss nach dem Beginndatum liegen')
        }
    }

    if (!customName.value || customName.value.trim() === '') {
        validationErrors.push('Bitte geben Sie einen Namen ein')
    }

    // Check for required fields based on events table structure
    if (!props.projectId) {
        validationErrors.push('Projekt-ID fehlt')
    }

    // If there are validation errors, show them and don't proceed
    if (validationErrors.length > 0) {
        const errorMessage = 'Bitte füllen Sie alle Pflichtfelder aus:\n\n' + validationErrors.join('\n')
        alert(errorMessage)
        return // Don't reset form, keep current state
    }

    isSubmitting.value = true
    try {
        // Build XML-ID with format: {domaincode}.{entity}.{slug}
        // domaincode: projectId (e.g., "theaterpedia")
        // entity: determined by ctags (event_online, event_kurs, etc.)
        // slug: Generated from the event title
        const templateXmlId = selectedEvent.value.xmlid || `base_event.${selectedEvent.value.id}`

        // Generate slug from title
        const titleSlug = generateSlug(customName.value.trim() || 'untitled')

        // Determine entity qualifier from ctags
        const entityQualifier = getEventEntityFromCtags(ctags.value)

        // Build the new xmlid: {domaincode}.{entity}.{slug}
        const newXmlId = `${props.projectId}.${entityQualifier}.${titleSlug}`

        // Determine status: DEMO (8) if user edited name/teaser, otherwise NEW (1)
        const hasEdits = (customName.value && customName.value !== selectedEvent.value.name) ||
            (customTeaser.value && customTeaser.value !== selectedEvent.value.teaser)
        const eventStatus = hasEdits ? 8 : 1  // 8 = DEMO, 1 = NEW

        // Construct the new event object with all required fields
        const newEvent = {
            id: newXmlId,
            name: customName.value.trim(),
            teaser: customTeaser.value.trim() || '',
            isbase: 0,
            project: props.projectId,
            template: templateXmlId,  // Use xmlid as template reference
            creator_id: selectedOwner.value,  // User FK (events.user_id -> users.id)
            location: selectedLocation.value,
            // Image from dropdown (img_id FK)
            img_id: Array.isArray(selectedImageId.value) ? selectedImageId.value[0] : selectedImageId.value,
            // Use dates from input fields (not template)
            date_begin: dateBegin.value,
            date_end: dateEnd.value,
            event_type: selectedEventType.value,
            // Tag families
            ttags: ttags.value,
            ctags: ctags.value,
            // Status: NEW (1) or DEMO (8) if edits made
            status: eventStatus,
            // Header settings (from form selection)
            header_type: selectedHeaderType.value || 'cover',
            header_size: selectedHeaderSize.value || 'prominent'
        }

        // Debug logging - see what we're sending
        console.log('📋 Creating new event with data:', {
            newEvent,
            selectedEvent: selectedEvent.value,
            projectId: props.projectId,
            selectedOwner: selectedOwner.value,
            selectedLocation: selectedLocation.value,
            customName: customName.value,
            customTeaser: customTeaser.value
        })

        // Call API to create the event
        const response = await fetch('/api/events', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newEvent)
        })

        console.log('📥 API Response:', {
            status: response.status,
            statusText: response.statusText,
            ok: response.ok
        })

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
            console.error('❌ Error data from API:', errorData)

            const errorMessage = String(errorData.error || `HTTP ${response.status}: ${response.statusText}`)

            console.error('❌ Error message:', errorMessage)

            // Check for common constraint violations
            if (errorMessage.includes('duplicate key') || errorMessage.includes('events_xmlid_key') || errorMessage.includes('23505')) {
                alert('Du hast versucht, dieselbe Vorlage ein zweites Mal anzuwenden, dies geht nicht (ggf. später einmal). Bitte clicke "Abbrechen" und versuche es erneut mit einer anderen Vorlage.')
            } else if (errorMessage.includes('NOT NULL') || errorMessage.includes('constraint')) {
                alert(`Fehler: Pflichtfelder fehlen oder sind ungültig.\n\n${errorMessage}\n\nBitte überprüfen Sie alle Felder.`)
            } else {
                alert(`Fehler beim Erstellen der Veranstaltung:\n\n${errorMessage}`)
            }

            return // Don't reset form on error, keep current state
        }

        const createdEvent = await response.json()

        // Show success message (you could replace with a toast notification)
        console.log('✅ Event created:', createdEvent.id)

        // Emit the new event ID
        emit('eventAdded', createdEvent.id)

        // Only reset the form on success
        handleCancel()
    } catch (error) {
        console.error('Error creating event:', error)
        const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler'
        alert(`Fehler beim Erstellen der Veranstaltung:\n\n${errorMessage}\n\nBitte versuchen Sie es erneut oder wenden Sie sich an einen Administrator.`)
        // Don't reset form on error, keep current state
    } finally {
        isSubmitting.value = false
    }
}

// Click outside to close dropdowns
const handleClickOutside = (event: MouseEvent) => {
    if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
        isDropdownOpen.value = false
    }
}

onMounted(() => {
    document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
    document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.add-event-panel {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    background: var(--color-background);
    border: 1px solid var(--color-border);
    border-radius: 8px;
    padding: 1.5rem;
}

/* Panel Header */
.panel-header {
    display: flex;
    align-items: center;
}

.dropdown-wrapper {
    position: relative;
    width: 100%;
}

.add-event-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    background: var(--color-primary, #3b82f6);
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    width: 100%;
    justify-content: center;
}

.add-event-btn:hover:not(:disabled) {
    background: var(--color-primary-hover, #2563eb);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.add-event-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.add-event-btn svg {
    width: 20px;
    height: 20px;
}

/* Location Dropdown */
.location-dropdown-wrapper {
    position: relative;
    width: 100%;
}

.location-select-btn {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: 0.75rem;
    border: 1px solid var(--color-border);
    border-radius: 6px;
    font-size: 0.875rem;
    background: var(--color-background);
    color: var(--color-text);
    cursor: pointer;
    transition: border-color 0.2s ease;
    text-align: left;
}

.location-select-btn:hover {
    border-color: var(--color-primary, #3b82f6);
}

.location-select-btn .placeholder {
    color: var(--color-text-muted, #9ca3af);
}

.location-select-btn svg {
    flex-shrink: 0;
    opacity: 0.5;
}

/* Preview Section */
.preview-section {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.section-label {
    font-weight: 600;
    color: var(--color-heading);
    font-size: 0.875rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.delete-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    background: var(--color-muted-bg);
    border: 1px solid var(--color-border);
    border-radius: 6px;
    cursor: pointer;
    color: var(--color-dimmed);
    transition: all 0.2s ease;
}

.delete-btn:hover {
    background: var(--color-negative-bg);
    border-color: var(--color-negative-contrast);
    color: var(--color-negative-contrast);
}

/* Action Section */
.action-section {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.form-label {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-heading);
}

.form-select,
.form-input,
.form-textarea {
    padding: 0.75rem;
    border: 1px solid var(--color-border);
    border-radius: 6px;
    font-size: 0.875rem;
    background: var(--color-background);
    color: var(--color-text);
    transition: border-color 0.2s ease;
}

.form-select:focus,
.form-input:focus,
.form-textarea:focus {
    outline: none;
    border-color: var(--color-primary, #3b82f6);
}

.form-textarea {
    resize: vertical;
    font-family: inherit;
}

/* Action Buttons */
.action-buttons {
    display: flex;
    gap: 1rem;
    margin-top: 0.5rem;
}

.cancel-btn,
.apply-btn {
    flex: 1;
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 6px;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
}

.cancel-btn {
    background: var(--color-background-soft);
    color: var(--color-text);
    border: 1px solid var(--color-border);
}

.cancel-btn:hover {
    background: var(--color-background-mute);
}

.apply-btn {
    background: var(--color-primary, #3b82f6);
    color: white;
}

.apply-btn:hover:not(:disabled) {
    background: var(--color-primary-hover, #2563eb);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.apply-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.apply-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
}

.btn-spinner {
    display: inline-block;
    width: 14px;
    height: 14px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

/* Form row for side-by-side date inputs */
.form-row {
    display: flex;
    gap: 1rem;
}

.form-row .form-group {
    flex: 1;
}

/* Responsive: stack on narrow screens */
@media (max-width: 640px) {
    .form-row {
        flex-direction: column;
        gap: 0.75rem;
    }
}

/* Responsive: narrower panel on smaller screens */
@media (max-width: 1400px) {
    .event-panel {
        padding: 1rem;
    }

    .add-event-btn {
        padding: 0.625rem 1rem;
        font-size: 0.875rem;
    }

    .add-event-btn span {
        display: none;
    }

    .add-event-btn svg {
        width: 24px;
        height: 24px;
    }
}
</style>
