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

                <div v-if="isDropdownOpen" class="events-dropdown">
                    <div class="events-dropdown-header">
                        <span>Basis-Veranstaltung wählen</span>
                    </div>

                    <button v-for="event in baseEvents" :key="event.id" class="event-option"
                        @click="selectBaseEvent(event)">
                        <img v-if="event.cimg" :src="event.cimg" :alt="event.name" class="event-option-image" />

                        <div class="event-option-label">
                            <HeadingParser :content="event.name" as="p" />
                        </div>

                        <svg fill="currentColor" height="16" viewBox="0 0 256 256" width="16"
                            xmlns="http://www.w3.org/2000/svg" class="event-option-check">
                            <path
                                d="M229.66,77.66l-128,128a8,8,0,0,1-11.32,0l-56-56a8,8,0,0,1,11.32-11.32L96,188.69,218.34,66.34a8,8,0,0,1,11.32,11.32Z">
                            </path>
                        </svg>
                    </button>
                </div>
            </div>
        </div>

        <!-- Preview Card (disabled by default) -->
        <div v-if="selectedEvent" class="preview-section">
            <div class="section-label">Vorschau</div>
            <EventCard :event="previewEvent" :instructors="allInstructors" />
        </div>

        <!-- Action Area (disabled by default) -->
        <div v-if="selectedEvent" class="action-section">
            <div class="section-label">Anpassen</div>

            <div class="form-group">
                <label class="form-label">Instructor</label>
                <select v-model="selectedInstructor" class="form-select">
                    <option value="">Instructor wählen</option>
                    <option v-for="instructor in allInstructors" :key="instructor.id" :value="instructor.id">
                        {{ instructor.name }}
                    </option>
                </select>
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

            <div class="action-buttons">
                <button class="cancel-btn" @click="handleCancel">
                    Abbrechen
                </button>
                <button class="apply-btn" @click="handleApply" :disabled="!canApply">
                    Hinzufügen
                </button>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import HeadingParser from '@/components/HeadingParser.vue'
import EventCard from '@/components/EventCard.vue'

const props = defineProps<{
    projectId: string
    baseEvents: any[]
    allInstructors: any[]
}>()

const emit = defineEmits<{
    eventAdded: [eventId: string]
}>()

const dropdownRef = ref<HTMLElement | null>(null)
const isDropdownOpen = ref(false)
const selectedEvent = ref<any | null>(null)
const selectedInstructor = ref('')
const customName = ref('')
const customTeaser = ref('')

const previewEvent = computed(() => {
    if (!selectedEvent.value) return null

    return {
        ...selectedEvent.value,
        name: customName.value || selectedEvent.value.name,
        teaser: customTeaser.value || selectedEvent.value.teaser,
        public_user: selectedInstructor.value || selectedEvent.value.public_user
    }
})

const canApply = computed(() => {
    return selectedEvent.value && selectedInstructor.value && customName.value
})

const toggleDropdown = () => {
    isDropdownOpen.value = !isDropdownOpen.value
}

const selectBaseEvent = (event: any) => {
    selectedEvent.value = event
    customName.value = event.name
    customTeaser.value = event.teaser || ''
    selectedInstructor.value = event.public_user || ''
    isDropdownOpen.value = false
}

const handleCancel = () => {
    selectedEvent.value = null
    selectedInstructor.value = ''
    customName.value = ''
    customTeaser.value = ''
}

const handleApply = async () => {
    if (!canApply.value || !selectedEvent.value) return

    try {
        // Construct the new event object
        const newEvent = {
            name: customName.value,
            teaser: customTeaser.value,
            isbase: 0,
            project: props.projectId,
            template: selectedEvent.value.id,
            public_user: selectedInstructor.value,
            location: selectedEvent.value.location,
            // Copy other fields from template
            cimg: selectedEvent.value.cimg,
            description: selectedEvent.value.description,
            start_time: selectedEvent.value.start_time,
            end_time: selectedEvent.value.end_time,
            event_type: selectedEvent.value.event_type
        }

        // Call API to create the event
        const response = await fetch('/api/events', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newEvent)
        })

        if (!response.ok) {
            throw new Error('Failed to create event')
        }

        const createdEvent = await response.json()

        // Emit the new event ID
        emit('eventAdded', createdEvent.id)

        // Reset the form
        handleCancel()

        console.log('✅ Event created:', createdEvent.id)
    } catch (error) {
        console.error('Error creating event:', error)
        alert('Fehler beim Erstellen der Veranstaltung')
    }
}

// Click outside to close dropdown
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

/* Events Dropdown */
.events-dropdown {
    position: absolute;
    top: calc(100% + 0.5rem);
    left: 0;
    right: 0;
    background: var(--color-background);
    border: 1px solid var(--color-border);
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    max-height: 400px;
    overflow-y: auto;
    z-index: 1000;
}

.events-dropdown-header {
    padding: 0.75rem 1rem;
    border-bottom: 1px solid var(--color-border);
    font-weight: 600;
    color: var(--color-heading);
    background: var(--color-background-soft);
    position: sticky;
    top: 0;
    z-index: 1;
}

.event-option {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    width: 100%;
    border: none;
    background: none;
    cursor: pointer;
    transition: background 0.2s ease;
    text-align: left;
}

.event-option:hover {
    background: var(--color-background-soft);
}

.event-option-image {
    width: 48px;
    height: 48px;
    border-radius: 4px;
    object-fit: cover;
    flex-shrink: 0;
}

.event-option-label {
    flex: 1;
    font-size: 0.875rem;
}

.event-option-check {
    flex-shrink: 0;
    color: var(--color-primary, #3b82f6);
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
</style>
