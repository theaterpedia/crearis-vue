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
                <div class="location-dropdown-wrapper" ref="locationDropdownRef">
                    <button class="location-select-btn" @click="toggleLocationDropdown" type="button">
                        <span v-if="selectedLocation">
                            {{allLocations.find((l: Location) => l.id === selectedLocation)?.name || 'Ort wählen'}}
                        </span>
                        <span v-else class="placeholder">Ort wählen</span>
                        <svg fill="currentColor" height="16" viewBox="0 0 256 256" width="16"
                            xmlns="http://www.w3.org/2000/svg">
                            <path
                                d="M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z">
                            </path>
                        </svg>
                    </button>

                    <LocationsDropdown v-if="isLocationDropdownOpen" :locations="allLocations"
                        :selected-location-id="selectedLocation" header-text="Ort wählen" :show-check-mark="true"
                        @select="selectLocation" />
                </div>
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
import LocationsDropdown from '@/components/LocationsDropdown.vue'
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

interface Location {
    id: string
    name: string
    cimg?: string
    street?: string
    city?: string
    zip?: string
    [key: string]: any
}

// Unified access - prefer partners, fall back to legacy types
const allInstructors = computed(() => {
    if (props.allPartners && props.allPartners.length > 0) {
        // Filter partners with instructor bit set (partner_types & 1 = 1)
        return props.allPartners.filter(p => (p.partner_types & 1) === 1)
    }
    return props.allInstructors || []
})

const allLocations = computed(() => {
    if (props.locationPartners && props.locationPartners.length > 0) {
        // Filter partners with location bit set (partner_types & 2 = 2)
        return props.locationPartners.filter(p => (p.partner_types & 2) === 2)
    }
    return props.allLocations || []
})

const dropdownRef = ref<HTMLElement | null>(null)
const locationDropdownRef = ref<HTMLElement | null>(null)
const isDropdownOpen = ref(false)
const isLocationDropdownOpen = ref(false)
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
}, { immediate: true })
const selectedLocation = ref('')
const dateBegin = ref('')
const dateEnd = ref('')
const customName = ref('')
const customTeaser = ref('')
const isSubmitting = ref(false)
const selectedImageId = ref<string[] | string | null>(null)
const ttags = ref(0)
const ctags = ref(0)

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

const toggleLocationDropdown = () => {
    isLocationDropdownOpen.value = !isLocationDropdownOpen.value
}

const selectBaseEvent = (event: Event) => {
    selectedEvent.value = event
    customName.value = event.name
    customTeaser.value = event.teaser || ''
    // Don't pre-select owner - let user choose from project members
    selectedOwner.value = ''
    selectedEventType.value = event.event_type || 'workshop'
    selectedLocation.value = event.location || ''

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

const selectLocation = (location: Location) => {
    selectedLocation.value = location.id
    isLocationDropdownOpen.value = false
}

const handleCancel = () => {
    selectedEvent.value = null
    selectedOwner.value = ''
    selectedEventType.value = 'workshop'
    selectedLocation.value = ''
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
        // Construct XML-ID based on template xmlid
        // Base events have xmlid like "_demo.event1" or "base_event.workshop1"
        // We need to extract the suffix and create a new xmlid for this project
        const templateXmlId = selectedEvent.value.xmlid || `base_event.${selectedEvent.value.id}`

        // Split xmlid by '.' to get suffix (e.g., "event1" from "_demo.event1")
        const parts = templateXmlId.split('.')
        const eventSuffix = parts.length > 1 ? parts[parts.length - 1] : `event${selectedEvent.value.id}`
        const newXmlId = `_${props.projectId}.${eventSuffix}`

        // Construct the new event object with all required fields
        const newEvent = {
            id: newXmlId,
            name: customName.value.trim(),
            teaser: customTeaser.value.trim() || '',
            isbase: 0,
            project: props.projectId,
            template: templateXmlId,  // Use xmlid as template reference
            owner_id: selectedOwner.value,  // Use owner_id (user FK) instead of public_user (partner reference)
            location: selectedLocation.value,
            // Image from dropdown (img_id FK)
            img_id: Array.isArray(selectedImageId.value) ? selectedImageId.value[0] : selectedImageId.value,
            // Use dates from input fields (not template)
            date_begin: dateBegin.value,
            date_end: dateEnd.value,
            event_type: selectedEventType.value,
            // Tag families
            ttags: ttags.value,
            ctags: ctags.value
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
            if (errorMessage.includes('UNIQUE') || errorMessage.includes('duplicate')) {
                alert('Fehler: Ein Event mit dieser ID existiert bereits.\n\nBitte wählen Sie eine andere Basis-Veranstaltung oder wenden Sie sich an einen Administrator.')
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
    if (locationDropdownRef.value && !locationDropdownRef.value.contains(event.target as Node)) {
        isLocationDropdownOpen.value = false
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
</style>
