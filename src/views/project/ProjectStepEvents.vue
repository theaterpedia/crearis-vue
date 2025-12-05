<template>
    <div class="step-component">
        <div class="step-header">
            <h3 v-html="i18nTitle"></h3>
            <p class="step-subtitle" v-html="i18nSubtitle"></p>
        </div>

        <!-- Error State -->
        <div v-if="error" class="error-banner">
            <svg fill="currentColor" height="20" viewBox="0 0 256 256" width="20" xmlns="http://www.w3.org/2000/svg">
                <path
                    d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm-8-80V80a8,8,0,0,1,16,0v56a8,8,0,0,1-16,0Zm20,36a12,12,0,1,1-12-12A12,12,0,0,1,140,172Z">
                </path>
            </svg>
            <span>{{ error }}</span>
        </div>

        <!-- Loading State -->
        <div v-if="isLoading" class="loading-container">
            <div class="spinner"></div>
            <p v-html="i18nLoading"></p>
        </div>

        <div v-else class="step-content-container">
            <!-- Left: Events Gallery -->
            <div class="events-gallery">
                <div v-if="projectEvents.length === 0" class="empty-state">
                    <svg fill="currentColor" height="48" viewBox="0 0 256 256" width="48"
                        xmlns="http://www.w3.org/2000/svg">
                        <path
                            d="M208,32H184V24a8,8,0,0,0-16,0v8H88V24a8,8,0,0,0-16,0v8H48A16,16,0,0,0,32,48V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V48A16,16,0,0,0,208,32ZM72,48v8a8,8,0,0,0,16,0V48h80v8a8,8,0,0,0,16,0V48h24V80H48V48ZM208,208H48V96H208V208Zm-68-76a12,12,0,1,1-12-12A12,12,0,0,1,140,132Zm44,0a12,12,0,1,1-12-12A12,12,0,0,1,184,132ZM96,172a12,12,0,1,1-12-12A12,12,0,0,1,96,172Zm44,0a12,12,0,1,1-12-12A12,12,0,0,1,140,172Zm44,0a12,12,0,1,1-12-12A12,12,0,0,1,184,172Z">
                        </path>
                    </svg>
                    <p class="empty-title" v-html="i18nEmptyTitle"></p>
                    <p class="empty-text" v-html="i18nEmptyText"></p>
                </div>

                <div v-else class="events-grid">
                    <EventCard v-for="event in projectEvents" :key="event.id" :event="event"
                        :instructors="allInstructors" @delete="handleEventDelete" />
                </div>
            </div>

            <!-- Right: Add Event Panel -->
            <div class="add-panel-container">
                <EventPanel :project-id="props.projectId" :base-events="baseEvents" :all-instructors="allInstructors"
                    :all-locations="allLocations" @event-added="handleEventAdded" />
            </div>
        </div>

        <div v-if="!hideActions" class="step-actions">
            <button class="action-btn primary-btn" @click="handleNext">
                <span v-html="i18nNext"></span>
                <svg fill="currentColor" height="16" viewBox="0 0 256 256" width="16"
                    xmlns="http://www.w3.org/2000/svg">
                    <path
                        d="M221.66,133.66l-72,72a8,8,0,0,1-11.32-11.32L196.69,136H40a8,8,0,0,1,0-16H196.69L138.34,61.66a8,8,0,0,1,11.32-11.32l72,72A8,8,0,0,1,221.66,133.66Z">
                    </path>
                </svg>
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import EventCard from '@/components/EventCard.vue'
import EventPanel from '@/components/EventPanel.vue'
import AlertBanner from '@/components/AlertBanner.vue'
import { useI18n } from '@/composables/useI18n'
import type { Event, Instructor } from '@/types'

interface Props {
    projectId: string
    isLocked?: boolean
    hideActions?: boolean
}

interface Emits {
    (e: 'next'): void
}

const props = withDefaults(defineProps<Props>(), {
    isLocked: false,
    hideActions: false
})
const emit = defineEmits<Emits>()

// i18n setup - default to German for project users
const { field, desc, button, setLanguage } = useI18n()
setLanguage('de')

// i18n reactive strings
const i18nTitle = ref('')
const i18nSubtitle = ref('')
const i18nLoading = ref('')
const i18nNext = ref('')
const i18nEmptyTitle = ref('')
const i18nEmptyText = ref('')
const i18nErrorEvents = ref('')
const i18nErrorInstructors = ref('')
const i18nErrorLocations = ref('')

const baseEvents = ref<Event[]>([])
const projectEvents = ref<Event[]>([])
const allInstructors = ref<Instructor[]>([])
const allLocations = ref<any[]>([])
const isLoading = ref(true)
const error = ref<string | null>(null)

async function loadBaseEvents() {
    try {
        error.value = null
        const response = await fetch('/api/events?isbase=1')
        if (!response.ok) {
            throw new Error(`Failed to load base events: ${response.statusText}`)
        }
        baseEvents.value = await response.json()
    } catch (err) {
        console.error('Error loading base events:', err)
        error.value = i18nErrorEvents.value
    }
}

async function loadProjectEvents() {
    try {
        error.value = null
        const response = await fetch(`/api/events?project=${props.projectId}&isbase=0`)
        if (!response.ok) {
            throw new Error(`Failed to load project events: ${response.statusText}`)
        }
        projectEvents.value = await response.json()
    } catch (err) {
        console.error('Error loading project events:', err)
        error.value = i18nErrorEvents.value
    }
}

async function loadInstructors() {
    try {
        error.value = null
        const response = await fetch('/api/public-users')
        if (!response.ok) {
            throw new Error(`Failed to load instructors: ${response.statusText}`)
        }
        allInstructors.value = await response.json()
    } catch (err) {
        console.error('Error loading instructors:', err)
        error.value = i18nErrorInstructors.value
    }
}

async function loadLocations() {
    try {
        error.value = null
        const response = await fetch('/api/locations?isbase=1')
        if (!response.ok) {
            throw new Error(`Failed to load locations: ${response.statusText}`)
        }
        allLocations.value = await response.json()
    } catch (err) {
        console.error('Error loading locations:', err)
        error.value = i18nErrorLocations.value
    }
}

async function handleEventAdded(eventId: string) {
    console.log('✅ Event added:', eventId)
    // Reload project events to show the new one
    await loadProjectEvents()
}

async function handleEventDelete(eventId: string) {
    try {
        error.value = null
        const response = await fetch(`/api/events/${eventId}`, {
            method: 'DELETE'
        })

        if (!response.ok) {
            throw new Error(`Failed to delete event: ${response.statusText}`)
        }

        console.log('✅ Event deleted:', eventId)
        // Reload project events to remove the deleted one
        await loadProjectEvents()
    } catch (err) {
        console.error('Error deleting event:', err)
        error.value = 'Fehler beim Löschen des Events'
        alert('Fehler beim Löschen des Events')
    }
}

function handleNext() {
    emit('next')
}

onMounted(async () => {
    // Load i18n strings with inline HTML strategy (get-or-create with default text)
    const { getOrCreate } = useI18n()

    const titleEntry = await getOrCreate('events', 'field', 'false', 'Veranstaltungen')
    i18nTitle.value = titleEntry?.text?.de || 'Veranstaltungen'

    const subtitleEntry = await getOrCreate('events-step-subtitle', 'desc', 'false', 'Wählen Sie die Events aus, die in Ihrem Projekt erscheinen sollen')
    i18nSubtitle.value = subtitleEntry?.text?.de || 'Wählen Sie die Events aus, die in Ihrem Projekt erscheinen sollen'

    const loadingEntry = await getOrCreate('loading-events', 'desc', 'false', 'Events werden geladen...')
    i18nLoading.value = loadingEntry?.text?.de || 'Events werden geladen...'

    const nextEntry = await getOrCreate('next', 'button', 'false', 'Weiter')
    i18nNext.value = nextEntry?.text?.de || 'Weiter'

    const emptyTitleEntry = await getOrCreate('no-events-yet', 'desc', 'false', 'Noch keine Events')
    i18nEmptyTitle.value = emptyTitleEntry?.text?.de || 'Noch keine Events'

    const emptyTextEntry = await getOrCreate('add-events-right', 'desc', 'false', 'Fügen Sie Events über das Panel rechts hinzu')
    i18nEmptyText.value = emptyTextEntry?.text?.de || 'Fügen Sie Events über das Panel rechts hinzu'

    const errorEventsEntry = await getOrCreate('error-loading-events', 'desc', 'false', 'Fehler beim Laden der Events')
    i18nErrorEvents.value = errorEventsEntry?.text?.de || 'Fehler beim Laden der Events'

    const errorInstructorsEntry = await getOrCreate('error-loading-instructors', 'desc', 'false', 'Fehler beim Laden der Kursleiter')
    i18nErrorInstructors.value = errorInstructorsEntry?.text?.de || 'Fehler beim Laden der Kursleiter'

    const errorLocationsEntry = await getOrCreate('error-loading-locations', 'desc', 'false', 'Fehler beim Laden der Orte')
    i18nErrorLocations.value = errorLocationsEntry?.text?.de || 'Fehler beim Laden der Orte'

    isLoading.value = true
    try {
        await Promise.all([
            loadBaseEvents(),
            loadProjectEvents(),
            loadInstructors(),
            loadLocations()
        ])
    } finally {
        isLoading.value = false
    }
})
</script>

<style scoped>
.step-component {
    display: flex;
    flex-direction: column;
    gap: 2rem;
    height: 100%;
}

.step-header h3 {
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--color-text);
    margin: 0 0 0.5rem 0;
}

.step-subtitle {
    font-size: 0.875rem;
    color: var(--color-dimmed);
    margin: 0;
}

/* Error Banner */
.error-banner {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem;
    background: #fee;
    border: 1px solid #fcc;
    border-radius: 6px;
    color: #c33;
}

.error-banner svg {
    flex-shrink: 0;
}

/* Loading State */
.loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 4rem 2rem;
    gap: 1rem;
}

.spinner {
    width: 40px;
    height: 40px;
    border: 4px solid var(--color-border);
    border-top-color: var(--color-primary, #3b82f6);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

.loading-container p {
    color: var(--color-text-muted);
    font-size: 0.875rem;
}

.step-content-container {
    display: grid;
    grid-template-columns: 1fr minmax(250px, 400px);
    gap: 1.5rem;
    flex: 1;
    min-height: 500px;
}

/* Responsive: Stack on smaller screens */
@media (max-width: 900px) {
    .step-content-container {
        grid-template-columns: 1fr;
    }
}

/* Left: Events Gallery */
.events-gallery {
    display: flex;
    flex-direction: column;
    min-width: 0;
    /* Prevent overflow */
}

.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem 2rem;
    background: var(--color-background-soft);
    border: 2px dashed var(--color-border);
    border-radius: 8px;
    text-align: center;
    min-height: 400px;
}

.empty-state svg {
    color: var(--color-primary, #3b82f6);
    opacity: 0.5;
    margin-bottom: 1rem;
}

.empty-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--color-heading);
    margin: 0 0 0.5rem 0;
}

.empty-text {
    font-size: 0.875rem;
    color: var(--color-text-muted);
    margin: 0;
    max-width: 400px;
}

.events-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1rem;
}

@media (min-width: 1024px) {
    .events-grid {
        grid-template-columns: repeat(3, 1fr);
    }
}

/* Right: Add Panel */
.add-panel-container {
    display: flex;
    flex-direction: column;
}

.step-actions {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    padding-top: 1rem;
    border-top: var(--border) solid var(--color-border);
}

.action-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: var(--radius-button);
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
}

.primary-btn {
    background: var(--color-primary-bg);
    color: var(--color-primary-contrast);
}

.primary-btn:hover {
    opacity: 0.9;
    transform: translateY(-1px);
}

.primary-btn:active {
    transform: translateY(0);
}
</style>
