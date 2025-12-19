<template>
    <div class="step-component">
        <div class="step-header">
            <h3 v-html="i18nTitle"></h3>
            <p class="step-subtitle" v-html="i18nSubtitle"></p>
        </div>

        <!-- Loading Spinner -->
        <div v-if="isLoading" class="loading-container">
            <div class="spinner"></div>
            <p v-html="i18nLoading"></p>
        </div>

        <!-- Error Banner -->
        <AlertBanner v-else-if="error" type="error" :message="error" />

        <!-- Main Content Grid (Left: Gallery, Right: Add Panel) -->
        <div v-else class="events-layout">
            <!-- Left Column: Events Gallery (using clist pGallery) -->
            <div class="events-gallery">
                <pGallery ref="eventsGalleryRef" entity="events" :project="projectId" :status-gt="0" size="medium"
                    item-type="card" :anatomy="'topimage'" on-activate="route" show-trash
                    :skip-alpha-filter="true"
                    @item-trash="handleEventDelete" />
            </div>

            <!-- Right Column: Add Event Panel -->
            <div class="add-panel-column">
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
import { ref, onMounted } from 'vue'
import pGallery from '@/components/page/pGallery.vue'
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
const { setLanguage } = useI18n()
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
const i18nErrorDelete = ref('')

// State
const baseEvents = ref<Event[]>([])
const allInstructors = ref<Instructor[]>([])
const allLocations = ref<any[]>([])
const isLoading = ref(true)
const error = ref<string | null>(null)
const eventsGalleryRef = ref<InstanceType<typeof pGallery> | null>(null)

// Load base events (isbase=1)
async function loadBaseEvents() {
    try {
        const response = await fetch('/api/events?isbase=1')
        if (!response.ok) {
            throw new Error(`Failed to load base events: ${response.statusText}`)
        }
        baseEvents.value = await response.json()
    } catch (err) {
        console.error('Error loading base events:', err)
        error.value = i18nErrorEvents.value
        throw err
    }
}

// Note: Project events are now loaded by pGallery component automatically

// Load instructors
async function loadInstructors() {
    try {
        const response = await fetch('/api/public-users')
        if (!response.ok) {
            throw new Error(`Failed to load instructors: ${response.statusText}`)
        }
        allInstructors.value = await response.json()
    } catch (err) {
        console.error('Error loading instructors:', err)
        error.value = i18nErrorInstructors.value
        throw err
    }
}

// Load locations
async function loadLocations() {
    try {
        const response = await fetch('/api/locations?isbase=1')
        if (!response.ok) {
            throw new Error(`Failed to load locations: ${response.statusText}`)
        }
        allLocations.value = await response.json()
    } catch (err) {
        console.error('Error loading locations:', err)
        error.value = i18nErrorLocations.value
        throw err
    }
}

// Handle event added - refresh the gallery
async function handleEventAdded(eventId: string) {
    console.log('Event added:', eventId)
    // Refresh pGallery to show newly added event
    eventsGalleryRef.value?.refresh()
}

// Handle event delete (from pGallery item-trash event)
async function handleEventDelete(item: any) {
    const eventId = item?.id || item
    try {
        const response = await fetch(`/api/events/${eventId}`, {
            method: 'DELETE'
        })

        if (!response.ok) {
            throw new Error(`Failed to delete event: ${response.statusText}`)
        }

        console.log('✅ Event deleted:', eventId)
        // Refresh gallery after delete
        eventsGalleryRef.value?.refresh()
    } catch (err) {
        console.error('Error deleting event:', err)
        error.value = i18nErrorDelete.value || 'Fehler beim Löschen des Events'
    }
}

function handleNext() {
    emit('next')
}

onMounted(async () => {
    // Load i18n strings with inline HTML strategy (get-or-create with default text)
    const { getOrCreate } = useI18n()

    const titleEntry = await getOrCreate('events', 'field', 'false', 'Veranstaltungen verwalten')
    i18nTitle.value = titleEntry?.text?.de || 'Veranstaltungen verwalten'

    const subtitleEntry = await getOrCreate('events-step-subtitle', 'desc', 'false', 'Wählen Sie Basis-Veranstaltungen aus und passen Sie diese für Ihr Projekt an')
    i18nSubtitle.value = subtitleEntry?.text?.de || 'Wählen Sie Basis-Veranstaltungen aus und passen Sie diese für Ihr Projekt an'

    const loadingEntry = await getOrCreate('loading-events', 'desc', 'false', 'Events werden geladen...')
    i18nLoading.value = loadingEntry?.text?.de || 'Events werden geladen...'

    const nextEntry = await getOrCreate('next', 'button', 'false', 'Weiter')
    i18nNext.value = nextEntry?.text?.de || 'Weiter'

    const errorEventsEntry = await getOrCreate('error-loading-events', 'desc', 'false', 'Fehler beim Laden der Events')
    i18nErrorEvents.value = errorEventsEntry?.text?.de || 'Fehler beim Laden der Events'

    const errorInstructorsEntry = await getOrCreate('error-loading-instructors', 'desc', 'false', 'Fehler beim Laden der Kursleiter')
    i18nErrorInstructors.value = errorInstructorsEntry?.text?.de || 'Fehler beim Laden der Kursleiter'

    const errorLocationsEntry = await getOrCreate('error-loading-locations', 'desc', 'false', 'Fehler beim Laden der Orte')
    i18nErrorLocations.value = errorLocationsEntry?.text?.de || 'Fehler beim Laden der Orte'

    const errorDeleteEntry = await getOrCreate('error-deleting-event', 'desc', 'false', 'Fehler beim Löschen des Events')
    i18nErrorDelete.value = errorDeleteEntry?.text?.de || 'Fehler beim Löschen des Events'

    isLoading.value = true
    try {
        await Promise.all([
            loadBaseEvents(),
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
    gap: 1.5rem;
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
    border-top-color: var(--color-primary-base);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

.loading-container p {
    color: var(--color-dimmed);
    font-size: 0.875rem;
}

/* Main Layout: Left Gallery + Right Panel */
.events-layout {
    display: grid;
    grid-template-columns: 1fr minmax(280px, 400px);
    gap: 1.5rem;
    flex: 1;
    min-height: 0;
}

@media (max-width: 900px) {
    .events-layout {
        grid-template-columns: 1fr;
    }
}

/* Left: Events Gallery */
.events-gallery {
    min-width: 0;
    overflow-y: auto;
}

/* Right: Add Panel */
.add-panel-column {
    display: flex;
    flex-direction: column;
}

/* Step Actions */
.step-actions {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    padding-top: 1rem;
    border-top: 1px solid var(--color-border);
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
